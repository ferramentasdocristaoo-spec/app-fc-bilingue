import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aplicarPlanos, lerCompra, type EstadoAcesso, type PlanoSku } from "./parse.ts";

// Webhook de compra do FC bilíngue (KawaiPay; formatos antigos continuam aceitos).
// Regras (14/11/2026): compra_aprovada / assinatura_renovada liberam e estendem a validade;
// reembolso / chargeback bloqueiam; o resto responde 200 "ignored". Nunca 404: a KawaiPay
// pausa a fila. SKU desconhecido não libera nada (a mesma loja vende os e-books da Livraria).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let raw: unknown = null;
    try { raw = await req.json(); } catch { return json({ ignored: true, reason: "payload_invalido" }); }
    console.log("Webhook payload:", JSON.stringify(raw).slice(0, 1000));

    const compra = lerCompra(raw);
    console.log(`Evento: ${compra.evento || "(sem evento)"} | ação: ${compra.acao} | e-mail: ${compra.email ?? "?"} | itens: ${compra.itens.length}`);

    if (compra.acao === "ignorar") return json({ ignored: true, event: compra.evento || null });
    if (!compra.email || !compra.email.includes("@")) return json({ ignored: true, reason: "email_ausente", event: compra.evento || null });
    const email = compra.email;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const candidatos = [...new Set(compra.itens.flatMap((i) => i.candidatos))];
    let planos: PlanoSku[] = [];
    if (candidatos.length) {
      const { data, error } = await supabase
        .from("sku_plans")
        .select("sku, plan_name, months, unlocks_languages")
        .in("sku", candidatos);
      if (error) { console.error("Erro ao ler sku_plans:", error); return json({ error: "Erro ao ler planos" }, 500); }
      planos = (data ?? []) as PlanoSku[];
    }

    const { data: atualRow, error: atualErr } = await supabase
      .from("approved_emails")
      .select("id, plan, expires_at, idiomas_liberados, bloqueado")
      .eq("email", email)
      .maybeSingle();
    if (atualErr) { console.error("Erro ao ler approved_emails:", atualErr); return json({ error: "Erro ao ler acesso" }, 500); }
    const atual: (EstadoAcesso & { id: string; bloqueado: boolean }) | null = atualRow
      ? { id: atualRow.id, plan: atualRow.plan ?? null, expires_at: atualRow.expires_at ?? null, idiomas_liberados: !!atualRow.idiomas_liberados, bloqueado: !!atualRow.bloqueado }
      : null;

    if (compra.acao === "bloquear") {
      if (!atual) return json({ ignored: true, reason: "email_desconhecido", event: compra.evento });
      if (planos.length === 0) return json({ ignored: true, reason: "sku_desconhecido", event: compra.evento });
      // Reembolso só do adicional de idiomas: tira os idiomas e mantém o plano.
      const soAdicional = planos.every((p) => p.months === 0);
      const patch = soAdicional ? { idiomas_liberados: false } : { bloqueado: true };
      const { error } = await supabase.from("approved_emails").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", atual.id);
      if (error) { console.error("Erro ao bloquear:", error); return json({ error: "Erro ao bloquear" }, 500); }
      console.log(`Acesso ${soAdicional ? "sem idiomas adicionais" : "bloqueado"}: ${email} (${compra.evento})`);
      return json({ success: true, action: soAdicional ? "languages_revoked" : "blocked", email });
    }

    // liberar
    const novo = aplicarPlanos(atual, planos);
    if (!novo) {
      console.warn(`SKU desconhecido para ${email}: ${candidatos.join(", ") || "(nenhum)"} — nada liberado. Cadastre em sku_plans.`);
      return json({ ignored: true, reason: "sku_desconhecido", skus: candidatos, email });
    }

    // Só o adicional, sem plano com validade e sem cadastro: cria a linha já vencida (o plano
    // principal, quando chegar, estende a partir de hoje). Assim o bump sozinho não dá acesso.
    const expiresAt = novo.expires_at ?? (atual ? null : new Date().toISOString());
    const registro = {
      email,
      plan: novo.plan ?? atual?.plan ?? "adicional_idiomas",
      sku: novo.sku,
      expires_at: expiresAt,
      idiomas_liberados: novo.idiomas_liberados,
      // Compra nova reabilita quem estava bloqueado por reembolso antigo.
      bloqueado: false,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("approved_emails").upsert(registro, { onConflict: "email" });
    if (error) { console.error("Erro ao salvar acesso:", error); return json({ error: "Erro ao salvar acesso" }, 500); }

    // Um SKU pode liberar também um produto da Livraria (acesso ao produto, em todos os idiomas).
    for (const sku of candidatos) {
      const { data: libraryProduct } = await supabase.from("library_sku_products").select("product_slug").eq("sku", sku).maybeSingle();
      if (!libraryProduct) continue;
      const { error: entitlementError } = await supabase
        .from("library_entitlements")
        .upsert({ email, product_slug: libraryProduct.product_slug, source_sku: sku }, { onConflict: "email,product_slug" });
      if (entitlementError) console.error("Error granting library access:", entitlementError);
    }

    console.log(`Acesso liberado: ${email} | plano: ${registro.plan} | validade: ${registro.expires_at ?? "sem"} | idiomas: ${registro.idiomas_liberados}`);
    return json({ success: true, email, plan: registro.plan, expires_at: registro.expires_at, idiomas_liberados: registro.idiomas_liberados });
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Erro interno" }, 500);
  }
});
