import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Extrair email do payload da plataforma de vendas
    // Suporta: { email: "..." } OU payload completo com events[].data.customer_email
    let email: string | undefined;

    if (body.email) {
      email = body.email;
    } else if (body.events && Array.isArray(body.events)) {
      email = body.events[0]?.data?.customer_email;
    } else if (body.body?.events && Array.isArray(body.body.events)) {
      email = body.body.events[0]?.data?.customer_email;
    } else if (Array.isArray(body) && body[0]?.body?.events) {
      email = body[0].body.events[0]?.data?.customer_email;
    }

    if (!email || typeof email !== "string") {
      console.error("Payload recebido sem email:", JSON.stringify(body).slice(0, 500));
      return new Response(JSON.stringify({ error: "Email não encontrado no payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    email = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("approved_emails")
      .upsert({ email }, { onConflict: "email" });

    if (error) {
      console.error("Erro ao salvar email:", error);
      return new Response(JSON.stringify({ error: "Erro ao salvar email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email aprovado salvo:", email);
    return new Response(JSON.stringify({ success: true, email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
