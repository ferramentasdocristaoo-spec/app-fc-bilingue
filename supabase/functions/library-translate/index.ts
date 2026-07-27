import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish (neutral Latin American)",
  fr: "French",
  it: "Italian",
  de: "German",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      translate_token,
      product_slug,
      volume_slug,
      language,
      block_from = 0,
      block_count = 5,
    } = await req.json();

    if (!product_slug || !volume_slug || !LANGUAGE_NAMES[language]) {
      return json({ error: "missing_parameters" }, 400);
    }

    const expectedToken = Deno.env.get("LIBRARY_TRANSLATE_TOKEN");
    if (!expectedToken || translate_token !== expectedToken) {
      return json({ error: "unauthorized" }, 403);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: volume } = await supabase
      .from("library_volumes")
      .select("content")
      .eq("product_slug", product_slug)
      .eq("volume_slug", volume_slug)
      .eq("language", "pt-BR")
      .maybeSingle();
    if (!volume) return json({ error: "source_not_found" }, 404);

    const blocks = volume.content.split(/\n\s*\n/).filter((b: string) => b.trim());
    const slice = blocks.slice(block_from, block_from + block_count);
    if (slice.length === 0) return json({ error: "empty_range" }, 400);

    const source = slice.join("\n\n");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ error: "openai_not_configured" }, 500);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              `You are a professional translator of Christian theological books. Translate the user's text from Brazilian Portuguese into ${LANGUAGE_NAMES[language]}.\n` +
              "STRICT RULES:\n" +
              "- Preserve the structure EXACTLY: the same number of blocks separated by blank lines, and the same line breaks inside each block. Never merge or split lines.\n" +
              "- The first line of each block is a title: translate it as a title, without adding punctuation.\n" +
              "- Translate Bible book names and references into the target language's standard Bible naming.\n" +
              "- Bible quotations should follow a traditional public-domain Bible style in the target language.\n" +
              "- Do not add markdown, notes, numbering or any text that is not a translation of the source.\n" +
              "- Output ONLY the translated text.",
          },
          { role: "user", content: source },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return json({ error: "openai_error", detail: detail.slice(0, 300) }, 502);
    }

    const completion = await response.json();
    const translated = completion.choices?.[0]?.message?.content?.trim();
    if (!translated) return json({ error: "empty_translation" }, 502);

    const translatedBlocks = translated.split(/\n\s*\n/).filter((b: string) => b.trim());
    return json({
      blocks: translatedBlocks,
      source_blocks: slice.length,
      total_blocks: blocks.length,
    });
  } catch {
    return json({ error: "internal_error" }, 500);
  }
});
