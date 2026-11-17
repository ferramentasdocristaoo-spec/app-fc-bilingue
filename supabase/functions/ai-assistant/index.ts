import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  CACHE_TTL_MS,
  brasilCacheKey,
  localCacheKey,
  readSharedCache,
  usesBrasilCache,
  writeSharedCache,
  type CacheStore,
  type CacheTargets,
} from "./shared-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANG_NAMES: Record<string, string> = {
  "pt-PT": "European Portuguese (Portugal)",
  "pt-BR": "Brazilian Portuguese (Brazil)",
  "en": "English",
  "fr": "French",
  "es": "Spanish",
  "it": "Italian",
  "de": "German",
};

function getLangName(lang: string): string {
  return LANG_NAMES[lang] || "European Portuguese (Portugal)";
}

// Tabela ai_cache (igual nos dois projetos) vista como um "store" do shared-cache.ts.
function supabaseCacheStore(name: string, client: SupabaseClient): CacheStore {
  return {
    name,
    async read(action, key) {
      const { data, error } = await client
        .from("ai_cache")
        .select("result")
        .eq("action", action)
        .eq("cache_key", key)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data?.result ?? null;
    },
    async write(action, key, result, expiresAt) {
      const { error } = await client.from("ai_cache").upsert(
        { action, cache_key: key, result, expires_at: expiresAt, created_at: new Date().toISOString() },
        { onConflict: "action,cache_key" },
      );
      if (error) throw new Error(error.message);
    },
  };
}

/**
 * Cache do FC Brasil (Supabase FC-BRASIL), só com os dois secrets da função:
 * FC_BRASIL_URL e FC_BRASIL_SERVICE_KEY (`supabase secrets set`). Sem eles, fica só o cache local.
 */
function brasilClient() {
  const url = Deno.env.get("FC_BRASIL_URL");
  const key = Deno.env.get("FC_BRASIL_SERVICE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Busca versículos reais na bible-api.com (tradução Almeida, sem API key)
async function fetchBibleVerse(referencia: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(referencia);
    const res = await fetch(`https://bible-api.com/${encoded}?translation=almeida`);
    if (!res.ok) {
      console.warn(`bible-api.com retornou ${res.status} para "${referencia}"`);
      return null;
    }
    const data = await res.json();
    if (data.text) return data.text.trim();
    if (data.verses && Array.isArray(data.verses)) {
      return data.verses.map((v: any) => `${v.book_name} ${v.chapter}:${v.verse} - ${v.text}`).join("\n").trim();
    }
    return null;
  } catch (e) {
    console.warn("Erro ao buscar bible-api.com:", e);
    return null;
  }
}

// Provedor principal: Anthropic. Reserva: OpenAI (entra sozinha se a Anthropic falhar ou os créditos acabarem).
async function callAnthropic(system: string, user: string, toolDef: any) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw { status: 401, message: "ANTHROPIC_API_KEY ausente." };
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-5-5",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
      tools: [{ name: toolDef.name, description: toolDef.description ?? toolDef.name, input_schema: toolDef.parameters }],
      tool_choice: { type: "tool", name: toolDef.name },
    }),
  });
  if (!response.ok) {
    const t = await response.text();
    console.error("Anthropic error:", response.status, t);
    throw { status: response.status, message: `Erro na IA (Anthropic): ${response.status}` };
  }
  const data = await response.json();
  const block = (data.content ?? []).find((c: any) => c.type === "tool_use");
  if (block?.input) return block.input;
  throw { status: 500, message: "Falha ao processar resposta da IA (Anthropic)." };
}

async function callOpenAI(system: string, user: string, toolDef: any) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw { status: 401, message: "OPENAI_API_KEY ausente." };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [{ type: "function", function: toolDef }],
      tool_choice: { type: "function", function: { name: toolDef.name } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Limite de requisições atingido. Aguarde um momento." };
    if (response.status === 402 || response.status === 401) throw { status: response.status, message: "Erro de autenticação com a API OpenAI. Verifique sua chave." };
    const t = await response.text();
    console.error("AI error:", response.status, t);
    throw { status: 500, message: `Erro na IA: ${response.status}` };
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }
  throw { status: 500, message: "Falha ao processar resposta da IA." };
}

// O primeiro argumento (_legacyKey) é mantido só para não mexer nas chamadas; as chaves vêm dos secrets.
async function callAiStructured(_legacyKey: string, system: string, user: string, toolDef: any) {
  const hasAnthropic = !!Deno.env.get("ANTHROPIC_API_KEY");
  const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
  if (hasAnthropic) {
    try {
      return await callAnthropic(system, user, toolDef);
    } catch (e) {
      if (!hasOpenAI) throw e;
      console.warn("Anthropic falhou; usando OpenAI de reserva:", (e as any)?.status ?? e);
    }
  }
  return await callOpenAI(system, user, toolDef);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!OPENAI_API_KEY && !Deno.env.get("ANTHROPIC_API_KEY")) throw new Error("Nenhuma chave de IA configurada (ANTHROPIC_API_KEY ou OPENAI_API_KEY)");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const { action, payload, adminCredentials } = await req.json();

    // Extract and validate language
    const lang = payload.lang || "pt-PT";
    const langName = getLangName(lang);

    // Editorial generation is an admin-only operation because it consumes paid AI tokens.
    // Credentials are validated before cache access and are never included in cache keys.
    if (action === "jornada-capitulo" || action === "jornada-uso") {
      const { data: isAdmin, error: adminError } = await sb.rpc("verify_admin", {
        _email: adminCredentials?._admin_email || "",
        _password: adminCredentials?._admin_password || "",
      });
      if (adminError || !isAdmin) throw { status: 401, message: "Apenas o administrador pode gerar conteúdo da Jornada." };
    }

    const journeyDailyLimit = 50;
    const journeyDayStart = new Date();
    journeyDayStart.setUTCHours(0, 0, 0, 0);
    const getJourneyDailyUsage = async () => {
      const { count } = await sb.from("ai_cache").select("id", { count: "exact", head: true })
        .eq("action", "jornada-capitulo").gte("created_at", journeyDayStart.toISOString());
      return count ?? 0;
    };
    if (action === "jornada-uso") {
      const used = await getJourneyDailyUsage();
      return new Response(JSON.stringify({ result: { used, limit: journeyDailyLimit, remaining: Math.max(0, journeyDailyLimit - used) } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate limiting: max 10 AI calls per IP per minute ---
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const ipDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientIp));
    const rateLimitKey = Array.from(new Uint8Array(ipDigest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
    const { count: recentCalls } = await sb
      .from("ai_request_log")
      .select("id", { count: "exact", head: true })
      .eq("request_key", rateLimitKey)
      .gte("created_at", oneMinuteAgo);

    if ((recentCalls ?? 0) >= 10) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento antes de tentar novamente." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await sb.from("ai_request_log").insert({ request_key: rateLimitKey, action });

    // Chave local: action + payload com as chaves ordenadas (inclui lang).
    const cacheKey = localCacheKey(payload);

    // pt-BR consulta e grava também no ai_cache do FC Brasil (chave sem lang = mesma fórmula de lá).
    // Qualquer falha lá cai no cache local e segue. Ver shared-cache.ts.
    const compartilhado = usesBrasilCache(action, lang);
    const sbBrasil = compartilhado ? brasilClient() : null;
    if (compartilhado && !sbBrasil) {
      console.warn("pt-BR sem FC_BRASIL_URL/FC_BRASIL_SERVICE_KEY: usando só o cache local");
    }
    const cacheTargets: CacheTargets = {
      brasil: sbBrasil ? { store: supabaseCacheStore("fc-brasil", sbBrasil), key: brasilCacheKey(payload) } : null,
      local: { store: supabaseCacheStore("local", sb), key: cacheKey },
    };

    // Check cache first (respect TTL via expires_at)
    const cached = await readSharedCache(cacheTargets, action, { log: (m) => console.warn(m) });

    if (cached) {
      console.log(`Cache HIT (${cached.source}) for ${action} [${lang}]: ${cacheKey}`);
      return new Response(JSON.stringify({ result: cached.result, cacheHit: true, cacheSource: cached.source }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Cache MISS for ${action} [${lang}]: ${cacheKey}`);
    if (action === "jornada-capitulo" && await getJourneyDailyUsage() >= journeyDailyLimit) {
      throw { status: 429, message: `Limite diário de ${journeyDailyLimit} gerações da Jornada atingido.` };
    }
    let result: any;

    switch (action) {
      case "jornada-capitulo": {
        const { bookName, chapter, scriptureText, previousChapterTitle, nextChapterTitle } = payload;
        if (!bookName || !chapter || !scriptureText) throw { status: 400, message: "Livro, capítulo e texto bíblico são obrigatórios." };
        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are a careful evangelical Bible editor. Respond entirely in ${langName}. Remain strictly grounded in the supplied biblical text. Never invent people, places, events, quotations or cross-references. Distinguish explicit information from reasonable literary connections.`,
          `Create the editorial guide for ${bookName} ${chapter}.
Previous chapter: ${previousChapterTitle || "none"}.
Next chapter: ${nextChapterTitle || "none"}.
Return a specific title, a concise 2-3 sentence summary, the central theme, named characters, explicit places, 2-5 valid related Bible references, one reflective question, and short connections to the adjacent chapters.

BIBLICAL TEXT:
${scriptureText}`,
          {
            name: "journey_chapter_editorial",
            description: "Returns a grounded chapter guide for the Bible Journey",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" }, summary: { type: "string" }, keyTheme: { type: "string" },
                characters: { type: "array", items: { type: "string" } }, places: { type: "array", items: { type: "string" } },
                relatedReferences: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                reflectionPrompt: { type: "string" }, previousConnection: { type: "string" }, nextConnection: { type: "string" },
              },
              required: ["title", "summary", "keyTheme", "characters", "places", "relatedReferences", "reflectionPrompt", "previousConnection", "nextConnection"],
            },
          },
        );
        break;
      }
      case "gerar-esboco": {
        const { titulo, textoBase, tema, tipo, tempo } = payload;
        const minutos = parseInt(tempo) || 15;
        const numPontos = minutos <= 10 ? 2 : minutos <= 30 ? 3 : minutos <= 60 ? 5 : minutos <= 90 ? 7 : 10;
        const profundidade = minutos <= 15 ? "brief and direct" : minutos <= 45 ? "detailed" : "extremely deep and extensive, with sub-points, illustrations, practical examples and multiple biblical references in each point";

        let contextoVersiculo = "";
        if (textoBase) {
          const textoBiblico = await fetchBibleVerse(textoBase);
          if (textoBiblico) {
            contextoVersiculo = `\n\nBIBLICAL TEXT (Almeida translation):\n"${textoBiblico}"\n\nUse this real text as the basis of the sermon.`;
          }
        }

        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are an experienced evangelical theologian. Generate complete and deep sermon outlines. You MUST respond entirely in ${langName}. The sermon should have enough content for ${minutos} minutes of preaching.`,
          `Generate a sermon outline for ${minutos} minutes of preaching. Title: ${titulo || "To be defined"}, Base Text: ${textoBase || "To be defined"}, Theme: ${tema || "General"}, Type: ${tipo || "Thematic"}. The sermon should be ${profundidade}. Include an elaborate introduction, ${numPontos} development points with verses and content proportional to the duration, detailed practical application and conclusion with an altar call.${contextoVersiculo}`,
          {
            name: "sermon_outline",
            description: "Returns structured sermon outline",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Sermon title" },
                texto_base: { type: "string", description: "Base biblical reference" },
                introducao: {
                  type: "object",
                  properties: {
                    gancho: { type: "string", description: "Impactful opening sentence" },
                    contextualizacao: { type: "string", description: "Theme contextualization" },
                  },
                  required: ["gancho", "contextualizacao"],
                },
                pontos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string" },
                      conteudo: { type: "string", description: "Development of the point" },
                      versiculos: { type: "array", items: { type: "string" }, description: "Supporting verses" },
                    },
                    required: ["titulo", "conteudo", "versiculos"],
                  },
                  description: "Main sermon points (quantity proportional to duration)",
                },
                aplicacao_pratica: { type: "string", description: "How to apply in daily life" },
                conclusao: { type: "string", description: "Conclusion and final altar call" },
              },
              required: ["titulo", "texto_base", "introducao", "pontos", "aplicacao_pratica", "conclusao"],
            },
          }
        );
        break;
      }

      case "raio-x": {
        const { referencia } = payload;

        let contextoVersiculo = "";
        if (referencia) {
          const textoBiblico = await fetchBibleVerse(referencia);
          if (textoBiblico) {
            contextoVersiculo = `\n\nBIBLICAL TEXT (Almeida translation):\n"${textoBiblico}"\n\nUse this real text as reference for the analysis.`;
          }
        }

        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are a biblical scholar specializing in exegesis and original languages. You MUST respond entirely in ${langName}.`,
          `Do a complete X-Ray of the passage: ${referencia}. Include biblical versions, keywords in the original language, historical context, literary context and application.${contextoVersiculo}`,
          {
            name: "verse_analysis",
            description: "Returns complete verse analysis",
            parameters: {
              type: "object",
              properties: {
                referencia: { type: "string", description: "The analyzed biblical reference" },
                versoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sigla: { type: "string", description: "Version abbreviation (NVI, ACF, NVT, ARA)" },
                      texto: { type: "string", description: "Verse text in that version" },
                    },
                    required: ["sigla", "texto"],
                  },
                  description: "Verse in 4 different versions",
                },
                palavras_chave: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      palavra: { type: "string", description: "Word in the target language" },
                      original: { type: "string", description: "Word in original language (Greek/Hebrew)" },
                      transliteracao: { type: "string" },
                      significado: { type: "string", description: "Meaning and nuances" },
                    },
                    required: ["palavra", "original", "transliteracao", "significado"],
                  },
                  description: "3-5 keywords in the original",
                },
                contexto_historico: { type: "string", description: "Who wrote it, for whom, when and why" },
                contexto_literario: { type: "string", description: "What comes before and after the passage" },
                aplicacao: { type: "string", description: "Main teaching and current relevance" },
              },
              required: ["referencia", "versoes", "palavras_chave", "contexto_historico", "contexto_literario", "aplicacao"],
            },
          }
        );
        break;
      }

      case "devocional": {
        const { tema } = payload;
        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are an evangelical Christian spiritual leader with a gift for devotional writing. You MUST respond entirely in ${langName}.`,
          `Generate a complete devotional${tema ? ` about: ${tema}` : ""}. Include a daily reading, deep meditation and prayer.`,
          {
            name: "devotional",
            description: "Returns structured devotional",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Devotional title" },
                leitura: { type: "string", description: "Biblical reference for daily reading" },
                versiculo_chave: { type: "string", description: "A highlighted verse with reference" },
                meditacao: { type: "string", description: "Deep reflection of 3-4 paragraphs" },
                oracao: { type: "string", description: "Complete and sincere prayer" },
              },
              required: ["titulo", "leitura", "versiculo_chave", "meditacao", "oracao"],
            },
          }
        );
        break;
      }

      case "garimpo": {
        const { categoria } = payload;
        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are a biblical specialist. You MUST respond entirely in ${langName} with complete verses.`,
          `Biblical mining on "${categoria}". List 8-10 relevant verses with full text and brief explanation.`,
          {
            name: "bible_mining",
            description: "Returns mined verses by theme",
            parameters: {
              type: "object",
              properties: {
                tema: { type: "string", description: "The researched theme" },
                resumo: { type: "string", description: "Brief introduction about what the Bible says about this theme" },
                versiculos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      referencia: { type: "string", description: "Biblical reference (e.g.: John 3:16)" },
                      texto: { type: "string", description: "Full verse text" },
                      aplicacao: { type: "string", description: "Brief explanation of how it applies to the theme" },
                    },
                    required: ["referencia", "texto", "aplicacao"],
                  },
                },
              },
              required: ["tema", "resumo", "versiculos"],
            },
          }
        );
        break;
      }

      case "nomes": {
        const { nome } = payload;
        result = await callAiStructured(
          OPENAI_API_KEY,
          `You are a linguist specializing in ancient languages (Hebrew, Aramaic, Greek and Latin). You MUST respond entirely in ${langName}.`,
          `Research the name "${nome}". Meaning in Hebrew, Aramaic, Greek and Latin (with original characters and transliteration), detailed etymology and history. Do NOT include biblical references. If it doesn't exist in a language, put null.`,
          {
            name: "nome_resultado",
            description: "Returns structured meaning of a name",
            parameters: {
              type: "object",
              properties: {
                significado_geral: { type: "string" },
                hebraico: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    transliteracao: { type: "string" },
                    significado: { type: "string" },
                  },
                  required: ["original", "transliteracao", "significado"],
                },
                aramaico: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    transliteracao: { type: "string" },
                    significado: { type: "string" },
                  },
                  required: ["original", "transliteracao", "significado"],
                },
                grego: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    transliteracao: { type: "string" },
                    significado: { type: "string" },
                  },
                  required: ["original", "transliteracao", "significado"],
                },
                latim: {
                  type: "object",
                  properties: {
                    original: { type: "string" },
                    transliteracao: { type: "string" },
                    significado: { type: "string" },
                  },
                  required: ["original", "transliteracao", "significado"],
                },
                etimologia: { type: "string" },
                historia: { type: "string" },
                variacoes: { type: "array", items: { type: "string" } },
              },
              required: ["significado_geral", "etimologia", "historia", "variacoes"],
            },
          }
        );
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Save to cache (local e, em pt-BR, também no FC Brasil; falha em um não impede o outro)
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    const gravados = await writeSharedCache(cacheTargets, action, result, expiresAt, { log: (m) => console.warn(m) });
    if (gravados.length === 0) console.warn(`Cache save error for ${action} [${lang}]: nenhum cache gravou`);
    else console.log(`Cache SAVED (${gravados.join("+")}) for ${action} [${lang}]: ${cacheKey}`);

    return new Response(JSON.stringify({ result, cacheHit: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ai-assistant error:", error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
