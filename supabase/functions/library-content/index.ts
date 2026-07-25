import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, product_slug, volume_slug, language } = await req.json();
    if (!email || !product_slug || !volume_slug) {
      return new Response(JSON.stringify({ error: "missing_parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: entitlement } = await supabase
      .from("library_entitlements")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("product_slug", product_slug)
      .maybeSingle();

    if (!entitlement) {
      return new Response(JSON.stringify({ error: "access_denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestedLanguage = String(language || "pt-BR");
    let { data: volume } = await supabase
      .from("library_volumes")
      .select("title, content, language, word_count")
      .eq("product_slug", product_slug)
      .eq("volume_slug", volume_slug)
      .eq("language", requestedLanguage)
      .maybeSingle();

    if (!volume && requestedLanguage !== "pt-BR") {
      const fallback = await supabase
        .from("library_volumes")
        .select("title, content, language, word_count")
        .eq("product_slug", product_slug)
        .eq("volume_slug", volume_slug)
        .eq("language", "pt-BR")
        .maybeSingle();
      volume = fallback.data;
    }

    if (!volume) {
      return new Response(JSON.stringify({ error: "content_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(volume), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
