import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emLotes, enviarFcm, lerContaServico, tokenAcesso, type ResultadoFcm } from "./fcm.ts";
import { chaveCache, idiomasParaTraduzir, lerRespostaTraducao, pedidoAnthropic, type Traducoes } from "./traducao.ts";
import { filtrarPublico, lerPublico, rotuloPublico, validarMensagem, type Acesso, type Inscricao, type Publico } from "./publico.ts";

// Central de mensagens do FC (21/11/2026, Noé). Modelo da Fome Livre (FCM HTTP v1, um projeto Firebase por produto).
// Ações (POST JSON { acao, ... }):
//   aberto    { envio }                          público: o service worker avisa que tocaram na notificação
//   status    {}                                 admin: Firebase configurado? quantos aparelhos inscritos?
//   contar    { publico }                        admin: quantas pessoas/aparelhos vão receber
//   enviar    { publico, titulo, texto, link, confirmar }   admin: confirmar = nº de pessoas mostrado ao admin
//   historico {}                                 admin: últimos 30 envios
//   traduzir  { titulo, texto, idiomas }         admin: versões traduzidas do pt-BR (Claude Haiku, cache no ai_cache)
// Admin = sessão Supabase com e-mail confirmado em admin_users (RPC session_admin_email) OU login antigo do painel
// (creds { _admin_email, _admin_password } → verify_admin). verify_jwt = false (config.toml): a própria função confere.
// Secrets: FCM_SERVICE_ACCOUNT (JSON da conta de serviço, base64 ou puro); ANTHROPIC_API_KEY (tradução). Opcionais: APP_URL, FCM_TESTE (FCM falso local).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const APP_URL = (Deno.env.get("APP_URL") ?? "https://app.ferramentasdocristao.com").replace(/\/$/, "");
const MAX_APARELHOS = 5000;
const PARALELO = 25;

type Creds = { _admin_email?: unknown; _admin_password?: unknown };

async function emailDoAdmin(req: Request, sb: SupabaseClient, creds: Creds | undefined): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (auth.startsWith("Bearer ") && anon) {
    const doUsuario = createClient(SUPABASE_URL, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data } = await doUsuario.rpc("session_admin_email");
    if (typeof data === "string" && data) return data;
  }
  const email = typeof creds?._admin_email === "string" ? creds._admin_email.trim().toLowerCase() : "";
  const senha = typeof creds?._admin_password === "string" ? creds._admin_password : "";
  if (email && senha) {
    const { data } = await sb.rpc("verify_admin", { _email: email, _password: senha });
    if (data === true) return email;
  }
  return null;
}

async function todasInscricoes(sb: SupabaseClient, publico: Publico): Promise<Inscricao[]> {
  const out: Inscricao[] = [];
  for (let de = 0; ; de += 1000) {
    let q = sb.from("push_inscricoes").select("email, token, lang").eq("ativo", true).order("id").range(de, de + 999);
    if (publico.tipo === "email") q = q.eq("email", publico.email);
    const { data, error } = await q;
    if (error) throw new Error(`inscricoes_${error.code ?? "erro"}`);
    out.push(...(data as Inscricao[]));
    if (!data || data.length < 1000) return out;
  }
}

async function acessosDe(sb: SupabaseClient, emails: string[]): Promise<Map<string, Acesso>> {
  const mapa = new Map<string, Acesso>();
  for (let i = 0; i < emails.length; i += 200) {
    const { data, error } = await sb.from("approved_emails")
      .select("email, plan, bloqueado, expires_at, idiomas_liberados").in("email", emails.slice(i, i + 200));
    if (error) throw new Error(`acessos_${error.code ?? "erro"}`);
    for (const a of data ?? []) {
      mapa.set(String(a.email).toLowerCase(), {
        plan: a.plan ?? null, bloqueado: a.bloqueado === true, expires_at: a.expires_at ?? null, idiomas_liberados: a.idiomas_liberados === true,
      });
    }
  }
  return mapa;
}

async function quemRecebe(sb: SupabaseClient, publico: Publico) {
  const inscricoes = await todasInscricoes(sb, publico);
  const acessos = await acessosDe(sb, [...new Set(inscricoes.map((i) => i.email.toLowerCase()))]);
  return filtrarPublico(inscricoes, acessos, publico);
}

const CACHE_ACAO = "push-traducao";
const CACHE_DIAS = 30;

/** Traduz título/texto pt-BR para os idiomas pedidos. Mesmo texto + mesmos idiomas sai do ai_cache, sem nova chamada. */
async function traduzir(sb: SupabaseClient, titulo: string, texto: string, idiomas: string[]) {
  const chave = chaveCache(titulo, texto, idiomas);
  const { data: guardado } = await sb.from("ai_cache").select("result").eq("action", CACHE_ACAO).eq("cache_key", chave)
    .gte("expires_at", new Date().toISOString()).maybeSingle();
  if (guardado?.result) return { ok: true as const, traducoes: guardado.result as Traducoes, cache: true };

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return { ok: false as const, erro: "traducao_sem_chave" };
  let resp: Response;
  try {
    resp = await fetch(Deno.env.get("ANTHROPIC_URL") ?? "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify(pedidoAnthropic(titulo, texto, idiomas)),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    console.error("[push-send] tradução sem resposta:", (e as Error).name);
    return { ok: false as const, erro: "traducao_falhou" };
  }
  if (!resp.ok) {
    console.error("[push-send] tradução:", resp.status, (await resp.text()).slice(0, 300));
    return { ok: false as const, erro: resp.status === 429 || resp.status === 529 ? "traducao_ocupada" : "traducao_falhou" };
  }
  const dados = await resp.json();
  const lida = lerRespostaTraducao(dados, idiomas);
  const u = dados?.usage ?? {};
  console.log(`[push-send] tradução ${idiomas.join(",")}: entrada ${u.input_tokens ?? "?"}, saída ${u.output_tokens ?? "?"} tokens${lida.ok ? "" : ` (${lida.erro})`}`);
  if (!lida.ok) return { ok: false as const, erro: lida.erro };
  const expira = new Date(Date.now() + CACHE_DIAS * 86_400_000).toISOString();
  const { error } = await sb.from("ai_cache").upsert(
    { action: CACHE_ACAO, cache_key: chave, result: lida.traducoes, expires_at: expira, created_at: new Date().toISOString() },
    { onConflict: "action,cache_key" },
  );
  if (error) console.warn("[push-send] cache da tradução:", error.message);
  return { ok: true as const, traducoes: lida.traducoes, cache: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "metodo" }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any = null;
  try { body = await req.json(); } catch { return json({ ok: false, error: "json_invalido" }, 400); }
  const sb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

  try {
    if (body?.acao === "aberto") {
      const envio = Number(body.envio);
      if (Number.isSafeInteger(envio) && envio > 0) await sb.rpc("push_marcar_aberto", { _envio: envio });
      return json({ ok: true });
    }

    const admin = await emailDoAdmin(req, sb, body?.creds);
    if (!admin) return json({ ok: false, error: "nao_autorizado" }, 401);
    const conta = lerContaServico(Deno.env.get("FCM_SERVICE_ACCOUNT"));

    if (body.acao === "status") {
      const { count } = await sb.from("push_inscricoes").select("id", { count: "exact", head: true }).eq("ativo", true);
      return json({ ok: true, configurado: !!conta, projeto: conta?.project_id ?? null, aparelhos: count ?? 0 });
    }

    if (body.acao === "historico") {
      const { data, error } = await sb.from("push_envios")
        .select("id, criado_em, criado_por, titulo, texto, link, publico_rotulo, pessoas, aparelhos, status, enviados, falhas, removidos, abertos, concluido_em")
        .order("criado_em", { ascending: false }).limit(30);
      if (error) throw new Error(`historico_${error.code ?? "erro"}`);
      return json({ ok: true, envios: data ?? [] });
    }

    if (body.acao === "traduzir") {
      const idiomas = idiomasParaTraduzir(body.idiomas);
      if (!idiomas.length) return json({ ok: false, error: "sem_idiomas" }, 400);
      const v = validarMensagem({ titulo: body.titulo, texto: body.texto, link: "/" });
      if (!v.ok) return json({ ok: false, error: v.erro }, 400);
      const r = await traduzir(sb, v.msg.titulo, v.msg.texto, idiomas);
      return r.ok ? json({ ok: true, traducoes: r.traducoes, cache: r.cache }) : json({ ok: false, error: r.erro }, 502);
    }

    const publico = lerPublico(body.publico);
    if (!publico) return json({ ok: false, error: "publico_invalido" }, 400);

    if (body.acao === "contar") {
      const r = await quemRecebe(sb, publico);
      return json({ ok: true, pessoas: r.pessoas, aparelhos: r.aparelhos, rotulo: rotuloPublico(publico) });
    }

    if (body.acao !== "enviar") return json({ ok: false, error: "acao_desconhecida" }, 400);
    if (!conta) return json({ ok: false, error: "firebase_nao_configurado" }, 503);
    const v = validarMensagem(body);
    if (!v.ok) return json({ ok: false, error: v.erro }, 400);

    const alvo = await quemRecebe(sb, publico);
    // A confirmação mostrou N pessoas: se o número mudou nesse meio-tempo, pede para confirmar de novo.
    if (Number(body.confirmar) !== alvo.pessoas) return json({ ok: false, error: "confirmacao_diferente", pessoas: alvo.pessoas, aparelhos: alvo.aparelhos }, 409);
    if (alvo.aparelhos === 0) return json({ ok: false, error: "ninguem_inscrito" }, 400);
    if (alvo.aparelhos > MAX_APARELHOS) return json({ ok: false, error: "publico_grande", aparelhos: alvo.aparelhos }, 413);

    // Mesma mensagem para o mesmo público em menos de 1 minuto: não manda de novo (o teste no e-mail do dono
    // seguido do envio para "Todos" é outro público, então passa).
    const rotulo = rotuloPublico(publico);
    const { data: recente } = await sb.from("push_envios").select("id")
      .eq("titulo", v.msg.titulo).eq("texto", v.msg.texto).eq("publico_rotulo", rotulo)
      .gte("criado_em", new Date(Date.now() - 60_000).toISOString()).limit(1);
    if (recente?.length) return json({ ok: false, error: "envio_repetido", envio: recente[0].id }, 409);

    // OAuth antes de gravar/enviar: se a conta de serviço for recusada, nada saiu.
    const teste = Deno.env.get("FCM_TESTE") || undefined;
    try { await tokenAcesso(conta, teste); } catch (e) {
      console.error("[push-send] oauth:", (e as Error).message);
      return json({ ok: false, error: "firebase_recusou" }, 502);
    }

    // chave = idempotência gerada no navegador a cada "Sim, enviar" (UNIQUE no banco): duas abas ou dois
    // cliques com a mesma confirmação não mandam duas vezes.
    const chave = typeof body.chave === "string" && /^[A-Za-z0-9-]{8,64}$/.test(body.chave) ? body.chave : null;
    const { data: linha, error: erroLinha } = await sb.from("push_envios").insert({
      criado_por: admin, titulo: v.msg.titulo, texto: v.msg.texto, link: v.msg.link, chave,
      publico, publico_rotulo: rotulo, pessoas: alvo.pessoas, aparelhos: alvo.aparelhos, status: "enviando",
    }).select("id").single();
    if (erroLinha?.code === "23505") return json({ ok: false, error: "envio_repetido" }, 409);
    if (erroLinha || !linha) throw new Error(`envio_${erroLinha?.code ?? "erro"}`);
    const envio = Number(linha.id);

    const conteudo = { ...v.msg, envio, tag: `fc-${envio}`, ping: `${SUPABASE_URL}/functions/v1/push-send` };
    const resultados: ResultadoFcm[] = await emLotes(alvo.tokens, PARALELO, (t) => enviarFcm(conta, t, conteudo, APP_URL, teste));

    const ok = alvo.tokens.filter((_, i) => resultados[i].tipo === "ok");
    const mortos = alvo.tokens.filter((_, i) => resultados[i].tipo === "invalido");
    const falhas = resultados.filter((r) => r.tipo === "falha").length;
    for (let i = 0; i < mortos.length; i += 200) await sb.from("push_inscricoes").delete().in("token", mortos.slice(i, i + 200));
    const agora = new Date().toISOString();
    for (let i = 0; i < ok.length; i += 200) await sb.from("push_inscricoes").update({ ultimo_envio: agora }).in("token", ok.slice(i, i + 200));
    const status = ok.length === 0 ? "falhou" : ok.length < alvo.aparelhos ? "parcial" : "enviado";
    await sb.from("push_envios").update({ status, enviados: ok.length, falhas, removidos: mortos.length, concluido_em: agora }).eq("id", envio);
    const erros = [...new Set(resultados.filter((r) => r.tipo !== "ok").map((r) => r.erro))].slice(0, 5);
    console.log(`[push-send] envio ${envio} por ${admin}: ${ok.length} ok, ${falhas} falhas, ${mortos.length} removidos${erros.length ? ` (${erros.join(", ")})` : ""}`);
    return json({ ok: true, envio, status, enviados: ok.length, falhas, removidos: mortos.length, pessoas: alvo.pessoas });
  } catch (e) {
    console.error("[push-send] erro:", (e as Error).message);
    return json({ ok: false, error: "erro_interno" }, 500);
  }
});
