import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

async function callAiStructured(apiKey: string, system: string, user: string, toolDef: any) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const { action, payload } = await req.json();

    // --- Rate limiting: max 10 AI calls per IP per minute ---
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const rateLimitKey = `rate:${clientIp}`;
    const { count: recentCalls } = await sb
      .from("ai_cache")
      .select("id", { count: "exact", head: true })
      .eq("cache_key", rateLimitKey)
      .gte("created_at", oneMinuteAgo);

    if ((recentCalls ?? 0) >= 10) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento antes de tentar novamente." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build cache key from action + sorted payload values
    const cacheKey = JSON.stringify(payload, Object.keys(payload).sort());

    // Check cache first (respect TTL via expires_at)
    const { data: cached } = await sb
      .from("ai_cache")
      .select("result")
      .eq("action", action)
      .eq("cache_key", cacheKey)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log(`Cache HIT for ${action}: ${cacheKey}`);
      return new Response(JSON.stringify({ result: cached.result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Cache MISS for ${action}: ${cacheKey}`);
    let result: any;

    switch (action) {
      case "gerar-esboco": {
        const { titulo, textoBase, tema, tipo, tempo } = payload;
        const minutos = parseInt(tempo) || 15;
        const numPontos = minutos <= 10 ? 2 : minutos <= 30 ? 3 : minutos <= 60 ? 5 : minutos <= 90 ? 7 : 10;
        const profundidade = minutos <= 15 ? "breve e direto" : minutos <= 45 ? "detalhado" : "extremamente profundo e extenso, com sub-pontos, ilustrações, exemplos práticos e múltiplas referências bíblicas em cada ponto";

        // Buscar texto bíblico real se houver referência
        let contextoVersiculo = "";
        if (textoBase) {
          const textoBiblico = await fetchBibleVerse(textoBase);
          if (textoBiblico) {
            contextoVersiculo = `\n\nTEXTO BÍBLICO REAL (tradução Almeida):\n"${textoBiblico}"\n\nUse este texto real como base do sermão.`;
          }
        }

        result = await callAiStructured(
          OPENAI_API_KEY,
          `Você é um teólogo evangélico experiente. Gere esboços de sermões completos e profundos. Responda em português do Brasil. O sermão deve ter conteúdo suficiente para ${minutos} minutos de pregação.`,
          `Gere um esboço de sermão para ${minutos} minutos de pregação. Título: ${titulo || "A definir"}, Texto Base: ${textoBase || "A definir"}, Tema: ${tema || "Geral"}, Tipo: ${tipo || "Temático"}. O sermão deve ser ${profundidade}. Inclua introdução elaborada, ${numPontos} pontos de desenvolvimento com versículos e conteúdo proporcional à duração, aplicação prática detalhada e conclusão com apelo.${contextoVersiculo}`,
          {
            name: "sermon_outline",
            description: "Retorna esboço de sermão estruturado",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título do sermão" },
                texto_base: { type: "string", description: "Referência bíblica base" },
                introducao: {
                  type: "object",
                  properties: {
                    gancho: { type: "string", description: "Frase de abertura impactante" },
                    contextualizacao: { type: "string", description: "Contextualização do tema" },
                  },
                  required: ["gancho", "contextualizacao"],
                },
                pontos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string" },
                      conteudo: { type: "string", description: "Desenvolvimento do ponto" },
                      versiculos: { type: "array", items: { type: "string" }, description: "Versículos de apoio" },
                    },
                    required: ["titulo", "conteudo", "versiculos"],
                  },
                  description: "Pontos principais do sermão (quantidade proporcional à duração)",
                },
                aplicacao_pratica: { type: "string", description: "Como aplicar na vida cotidiana" },
                conclusao: { type: "string", description: "Conclusão e apelo final" },
              },
              required: ["titulo", "texto_base", "introducao", "pontos", "aplicacao_pratica", "conclusao"],
            },
          }
        );
        break;
      }

      case "raio-x": {
        const { referencia } = payload;

        // Buscar texto bíblico real para injetar como contexto
        let contextoVersiculo = "";
        if (referencia) {
          const textoBiblico = await fetchBibleVerse(referencia);
          if (textoBiblico) {
            contextoVersiculo = `\n\nTEXTO BÍBLICO REAL (tradução Almeida):\n"${textoBiblico}"\n\nUse este texto real como referência para a análise.`;
          }
        }

        result = await callAiStructured(
          OPENAI_API_KEY,
          `Você é um estudioso bíblico especialista em exegese e línguas originais. Responda em português do Brasil.`,
          `Faça um Raio-X completo da passagem: ${referencia}. Inclua versões bíblicas, palavras-chave no original, contexto histórico, contexto literário e aplicação.${contextoVersiculo}`,
          {
            name: "verse_analysis",
            description: "Retorna análise completa de versículo",
            parameters: {
              type: "object",
              properties: {
                referencia: { type: "string", description: "A referência bíblica analisada" },
                versoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sigla: { type: "string", description: "Sigla da versão (NVI, ACF, NVT, ARA)" },
                      texto: { type: "string", description: "Texto do versículo nessa versão" },
                    },
                    required: ["sigla", "texto"],
                  },
                  description: "Versículo em 4 versões diferentes",
                },
                palavras_chave: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      palavra: { type: "string", description: "Palavra em português" },
                      original: { type: "string", description: "Palavra no idioma original (grego/hebraico)" },
                      transliteracao: { type: "string" },
                      significado: { type: "string", description: "Significado e nuances" },
                    },
                    required: ["palavra", "original", "transliteracao", "significado"],
                  },
                  description: "3-5 palavras-chave no original",
                },
                contexto_historico: { type: "string", description: "Quem escreveu, para quem, quando e por quê" },
                contexto_literario: { type: "string", description: "O que vem antes e depois da passagem" },
                aplicacao: { type: "string", description: "Principal ensinamento e relevância atual" },
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
          `Você é um líder espiritual cristão evangélico com dom de escrita devocional. Responda em português do Brasil.`,
          `Gere um devocional completo${tema ? ` sobre: ${tema}` : ""}. Inclua leitura do dia, meditação profunda e oração.`,
          {
            name: "devotional",
            description: "Retorna devocional estruturado",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título do devocional" },
                leitura: { type: "string", description: "Referência bíblica para leitura do dia" },
                versiculo_chave: { type: "string", description: "Um versículo destacado com referência" },
                meditacao: { type: "string", description: "Reflexão profunda de 3-4 parágrafos" },
                oracao: { type: "string", description: "Oração completa e sincera" },
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
          `Você é um especialista bíblico. Responda em português do Brasil com versículos completos.`,
          `Garimpo bíblico sobre "${categoria}". Liste 8-10 versículos relevantes com texto completo (NVI) e explicação breve.`,
          {
            name: "bible_mining",
            description: "Retorna versículos garimpados por tema",
            parameters: {
              type: "object",
              properties: {
                tema: { type: "string", description: "O tema pesquisado" },
                resumo: { type: "string", description: "Breve introdução sobre o que a Bíblia diz sobre esse tema" },
                versiculos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      referencia: { type: "string", description: "Referência bíblica (ex: João 3:16)" },
                      texto: { type: "string", description: "Texto completo do versículo" },
                      aplicacao: { type: "string", description: "Breve explicação de como se aplica ao tema" },
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
          `Você é um linguista especializado em línguas antigas (hebraico, aramaico, grego e latim). Responda em português do Brasil.`,
          `Pesquise o nome "${nome}". Significado em hebraico, aramaico, grego e latim (com caracteres originais e transliteração), etimologia detalhada e história. NÃO inclua referências bíblicas. Se não existir em alguma língua, coloque null.`,
          {
            name: "nome_resultado",
            description: "Retorna significado estruturado de um nome",
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

    // Save to cache
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cacheErr } = await sb.from("ai_cache").insert({ action, cache_key: cacheKey, result, expires_at: expiresAt });
    if (cacheErr) console.warn("Cache save error:", cacheErr.message);
    else console.log(`Cache SAVED for ${action}: ${cacheKey}`);

    return new Response(JSON.stringify({ result }), {
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
