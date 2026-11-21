/**
 * Tradução das notificações (21/11/2026 · Noé). Regras puras (sem Deno, sem rede): quais idiomas
 * traduzir, o pedido para a Anthropic, a leitura/validação da resposta e a chave do cache.
 * Testadas em src/test/push-traducao.test.ts. Quem chama a API é a ação "traduzir" do push-send.
 */
import { IDIOMAS_PUSH, LIMITES } from "./publico.ts";

/** Idioma em que o dono escreve. Sai exatamente como foi escrito (nunca vai para o modelo). */
export const IDIOMA_ORIGEM = "pt-BR";
export const MODELO_TRADUCAO = "claude-haiku-5-5";
/** Mudar o texto do prompt? Suba a versão: o cache antigo deixa de valer. */
export const VERSAO_PROMPT = 1;

export type Versao = { titulo: string; texto: string };
export type Traducoes = Record<string, Versao>;

const NOMES: Record<string, string> = {
  "pt-PT": "Portuguese as written in Portugal (pt-PT)",
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  de: "German",
};

/** Nomes das seções como aparecem no app (sidebar.*.title e exploreJourney em src/i18n/locales, 21/11/2026). */
export const GLOSSARIO: Record<string, Record<string, string>> = {
  "Jornada": {"pt-PT": "Jornada", "en": "Journey", "es": "Jornada", "fr": "Voyage", "it": "Viaggio", "de": "Reise"},
  "Oficina de Sermões": {"pt-PT": "Oficina de Sermões", "en": "Sermon Workshop", "es": "Taller de Sermones", "fr": "Atelier de Sermon", "it": "Laboratorio di Sermoni", "de": "Predigtwerkstatt"},
  "Meus Esboços": {"pt-PT": "Os Meus Esboços", "en": "My Outlines", "es": "Mis Esquemas", "fr": "Mes Plans", "it": "I Miei Schemi", "de": "Meine Gliederungen"},
  "Raio-X do Versículo": {"pt-PT": "Raio-X do Versículo", "en": "Verse X-Ray", "es": "Radiografía del Versículo", "fr": "Rayon X du Verset", "it": "Radiografia del Versetto", "de": "Vers-Röntgen"},
  "Mineração Bíblica": {"pt-PT": "Mineração Bíblica", "en": "Biblical Mining", "es": "Minería Bíblica", "fr": "Exploitation Biblique", "it": "Estrazione Biblica", "de": "Bibelschürfen"},
  "Mural de Oração": {"pt-PT": "Mural de Oração", "en": "Prayer Wall", "es": "Muro de Oración", "fr": "Mur de Prière", "it": "Muro di Preghiera", "de": "Gebetswand"},
  "Mural": {"pt-PT": "Mural", "en": "Prayer Wall", "es": "Muro de Oración", "fr": "Mur de Prière", "it": "Muro di Preghiera", "de": "Gebetswand"},
  "Voz de Deus": {"pt-PT": "Voz de Deus", "en": "God's Voice", "es": "Voz de Dios", "fr": "Voix de Dieu", "it": "Voce di Dio", "de": "Gottes Stimme"},
  "Púlpito Compartilhado": {"pt-PT": "Púlpito Partilhado", "en": "Shared Pulpit", "es": "Púlpito Compartido", "fr": "Chaire Partagée", "it": "Pulpito Condiviso", "de": "Geteilte Kanzel"},
  "Bíblia Sagrada": {"pt-PT": "Bíblia Sagrada", "en": "Holy Bible", "es": "Biblia Sagrada", "fr": "Bible Sacrée", "it": "Bibbia Sacra", "de": "Heilige Bibel"},
  "Livraria": {"pt-PT": "Livraria", "en": "Library", "es": "Librería", "fr": "Librairie", "it": "Libreria", "de": "Bibliothek"},
};

/** Idiomas que precisam de tradução: os válidos de IDIOMAS_PUSH, sem pt-BR, sem repetir, na ordem da lista. */
export function idiomasParaTraduzir(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const pedidos = new Set(v.filter((x): x is string => typeof x === "string"));
  return IDIOMAS_PUSH.filter((l) => l !== IDIOMA_ORIGEM && pedidos.has(l));
}

export function promptSistema(): string {
  return [
    "You translate push notifications for Ferramentas do Cristão, a Christian Bible-study app.",
    "The source is Brazilian Portuguese. Translate the title and the body into each requested language.",
    "Rules:",
    "- Natural, warm and respectful tone, as a native speaker would write a short app notification. Not literal.",
    "- Biblical names and books in the form usually used in that language's Bibles (e.g. Rute → Ruth / Rut; Josué → Joshua / Josua; Gênesis → Genesis / Génesis / Genèse).",
    "- Keep every emoji, URL, number and app path (like /biblia) exactly as in the source.",
    `- Title at most ${LIMITES.titulo} characters, body at most ${LIMITES.texto} characters. Shorten wording if needed; never cut mid-word.`,
    "- pt-PT: light adaptation only — European Portuguese spelling and usage (e.g. 'facto', 'ecrã', 'Génesis'), 'tu'/impersonal forms instead of Brazilian 'você', same meaning and length.",
    "- Do not add explanations, quotes or extra text. Return only the JSON.",
  ].join("\n");
}

export function mensagemUsuario(titulo: string, texto: string, idiomas: string[]): string {
  // Só os termos do glossário que aparecem no texto, para o pedido ficar curto.
  const fonte = `${titulo} ${texto}`.toLowerCase();
  const termos = Object.entries(GLOSSARIO).filter(([pt]) => fonte.includes(pt.toLowerCase()));
  return [
    `Target languages: ${idiomas.map((l) => `${l} = ${NOMES[l] ?? l}`).join("; ")}.`,
    ...(termos.length ? [
      "App section names — when the source refers to these sections, use exactly these names:",
      ...termos.map(([pt, m]) => `- "${pt}": ${idiomas.map((l) => `${l} "${m[l] ?? pt}"`).join(", ")}`),
    ] : []),
    "Source (pt-BR):",
    JSON.stringify({ titulo, texto }),
  ].join("\n");
}

/** JSON Schema da resposta (structured outputs): { "<idioma>": { titulo, texto } } só com os idiomas pedidos. */
export function esquemaResposta(idiomas: string[]) {
  const versao = {
    type: "object",
    properties: { titulo: { type: "string" }, texto: { type: "string" } },
    required: ["titulo", "texto"],
    additionalProperties: false,
  };
  return {
    type: "object",
    properties: Object.fromEntries(idiomas.map((l) => [l, versao])),
    required: idiomas,
    additionalProperties: false,
  };
}

/** Corpo do POST /v1/messages. Effort baixo: tarefa curta, sem raciocínio longo. */
export function pedidoAnthropic(titulo: string, texto: string, idiomas: string[]) {
  return {
    model: MODELO_TRADUCAO,
    max_tokens: 4000,
    system: promptSistema(),
    messages: [{ role: "user", content: mensagemUsuario(titulo, texto, idiomas) }],
    output_config: { effort: "low", format: { type: "json_schema", schema: esquemaResposta(idiomas) } },
  };
}

export type ErroTraducao = "traducao_vazia" | "traducao_invalida" | "traducao_incompleta" | "traducao_recusada" | "traducao_cortada";

/**
 * Lê a resposta da Messages API. Aceita só JSON com todos os idiomas pedidos, título e texto não vazios
 * e dentro de LIMITES (com espaço em volta tirado). Qualquer falha devolve erro: nada é enviado sem tradução.
 */
export function lerRespostaTraducao(resposta: unknown, idiomas: string[]): { ok: true; traducoes: Traducoes } | { ok: false; erro: ErroTraducao; idioma?: string } {
  const r = (resposta ?? {}) as { stop_reason?: unknown; content?: unknown };
  if (r.stop_reason === "refusal") return { ok: false, erro: "traducao_recusada" };
  if (r.stop_reason === "max_tokens") return { ok: false, erro: "traducao_cortada" };
  const blocos = Array.isArray(r.content) ? r.content : [];
  const texto = blocos
    .filter((b): b is { type: string; text: string } => !!b && typeof b === "object" && (b as { type?: unknown }).type === "text" && typeof (b as { text?: unknown }).text === "string")
    .map((b) => b.text).join("").trim();
  if (!texto) return { ok: false, erro: "traducao_vazia" };
  // Tolera cerca de código ```json ... ``` caso o formato estruturado não seja respeitado.
  const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let dados: unknown;
  try { dados = JSON.parse(limpo); } catch { return { ok: false, erro: "traducao_invalida" }; }
  return validarTraducoes(dados, idiomas);
}

export function validarTraducoes(dados: unknown, idiomas: string[]): { ok: true; traducoes: Traducoes } | { ok: false; erro: ErroTraducao; idioma?: string } {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return { ok: false, erro: "traducao_invalida" };
  const o = dados as Record<string, unknown>;
  const out: Traducoes = {};
  for (const l of idiomas) {
    const v = o[l] as { titulo?: unknown; texto?: unknown } | undefined;
    const titulo = typeof v?.titulo === "string" ? v.titulo.trim() : "";
    const texto = typeof v?.texto === "string" ? v.texto.trim() : "";
    if (!titulo || !texto) return { ok: false, erro: "traducao_incompleta", idioma: l };
    // Passou do limite: corta no último espaço antes do limite (o dono ainda revisa antes de enviar).
    out[l] = { titulo: caber(titulo, LIMITES.titulo), texto: caber(texto, LIMITES.texto) };
  }
  return { ok: true, traducoes: out };
}

/** Encaixa no limite sem cortar palavra no meio; se não houver espaço, corta seco. */
export function caber(s: string, max: number): string {
  if (s.length <= max) return s;
  const corte = s.slice(0, max + 1).lastIndexOf(" ");
  return (corte > max * 0.6 ? s.slice(0, corte) : s.slice(0, max)).replace(/[\s,;:–-]+$/, "");
}

/** Chave do cache (tabela ai_cache, action "push-traducao"): mesmo texto + mesmos idiomas = mesma chave. */
export function chaveCache(titulo: string, texto: string, idiomas: string[]): string {
  return JSON.stringify({ v: VERSAO_PROMPT, titulo: titulo.trim(), texto: texto.trim(), idiomas: [...idiomas].sort() });
}
