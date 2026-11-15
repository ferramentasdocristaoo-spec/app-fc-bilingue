/**
 * Cache de IA compartilhado com o FC Brasil (decisão do dono, 14/11/2026).
 *
 * Lógica pura (sem Deno) para o vitest testar: chave de cache, escolha do cache e leitura/gravação
 * com reserva. A ligação com o Supabase fica em index.ts.
 *
 * CHAVE DE CACHE (documentação)
 * - Os dois projetos têm a mesma tabela `ai_cache(action, cache_key, result, expires_at, created_at)`
 *   com UNIQUE (action, cache_key) e TTL de 30 dias em `expires_at`
 *   (migrations 20260323220810 e 20260409153627, iguais nos dois).
 * - FC Brasil (`fc-sermon/supabase/functions/ai-assistant`):
 *   cache_key = JSON.stringify(payload, Object.keys(payload).sort()) — o payload NÃO tem idioma.
 *   Ex.: raio-x → {"referencia":"João 3:16"}
 *        gerar-esboco → {"tema":"Fé","tempo":"15 minutos","textoBase":"Hb 11","tipo":"Expositivo","titulo":"…"}
 * - Bilíngue: o front (`src/hooks/use-ai.ts`) acrescenta `lang` ao payload, então a chave local
 *   leva o idioma: {"lang":"pt-BR","referencia":"João 3:16"}.
 * - Unificação (feita aqui, só do lado do bilíngue): para pt-BR a chave do Brasil é a chave local
 *   SEM `lang`. Fica idêntica à do FC Brasil, então as pesquisas salvas de lá servem ao bilíngue
 *   e cada resposta nova gravada pelo bilíngue serve ao FC Brasil.
 * - Os payloads das 5 ações são idênticos nos dois apps (mesmos campos, "tempo" = "N minutos",
 *   "tipo" ∈ Expositivo/Temático/Textual). Qualquer mudança de campo no front quebra o compartilhamento.
 */

export const SHARED_ACTIONS = ["gerar-esboco", "raio-x", "devocional", "garimpo", "nomes"] as const;
export type SharedAction = (typeof SHARED_ACTIONS)[number];

/** TTL igual ao dos dois projetos: 30 dias. */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Tempo máximo esperando o Supabase do Brasil; passou disso, segue com o cache local. */
export const BRASIL_TIMEOUT_MS = 4000;

type Payload = Record<string, unknown>;

/** Mesma fórmula do FC Brasil: JSON com as chaves em ordem alfabética. */
export function sortedJson(payload: Payload): string {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

/** Chave do cache local do bilíngue (inclui `lang`, como sempre foi). */
export function localCacheKey(payload: Payload): string {
  return sortedJson(payload);
}

/** Chave no `ai_cache` do FC Brasil: o payload sem `lang`. */
export function brasilCacheKey(payload: Payload): string {
  const semIdioma: Payload = {};
  for (const [k, v] of Object.entries(payload)) if (k !== "lang") semIdioma[k] = v;
  return sortedJson(semIdioma);
}

/** pt-BR em qualquer grafia (pt-BR, pt-br, pt_BR). */
export function isBrasilLanguage(lang: unknown): boolean {
  return typeof lang === "string" && lang.trim().toLowerCase().replace("_", "-") === "pt-br";
}

/** Só as ações que existem no FC Brasil, e só em pt-BR. Os outros idiomas ficam no cache próprio. */
export function usesBrasilCache(action: string, lang: unknown): boolean {
  return isBrasilLanguage(lang) && (SHARED_ACTIONS as readonly string[]).includes(action);
}

export interface CacheStore {
  name: string;
  /** Devolve o `result` guardado (ainda válido) ou null. */
  read(action: string, key: string): Promise<unknown | null>;
  write(action: string, key: string, result: unknown, expiresAt: string): Promise<void>;
}

export interface CacheTarget { store: CacheStore; key: string }
export interface CacheTargets { brasil: CacheTarget | null; local: CacheTarget }
export interface CacheHit { result: unknown; source: string }

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}: tempo esgotado (${ms} ms)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Lê primeiro o cache do Brasil (quando houver), depois o local.
 * Erro ou demora no Brasil nunca derruba a resposta: registra e cai no local.
 */
export async function readSharedCache(
  targets: CacheTargets,
  action: string,
  options: { timeoutMs?: number; log?: (message: string) => void } = {},
): Promise<CacheHit | null> {
  const log = options.log ?? (() => {});
  const timeoutMs = options.timeoutMs ?? BRASIL_TIMEOUT_MS;
  if (targets.brasil) {
    try {
      const result = await withTimeout(targets.brasil.store.read(action, targets.brasil.key), timeoutMs, targets.brasil.store.name);
      if (result !== null && result !== undefined) return { result, source: targets.brasil.store.name };
    } catch (e) {
      log(`cache ${targets.brasil.store.name} indisponível na leitura (${(e as Error)?.message ?? e}); seguindo com o local`);
    }
  }
  try {
    const result = await targets.local.store.read(action, targets.local.key);
    if (result !== null && result !== undefined) return { result, source: targets.local.store.name };
  } catch (e) {
    log(`cache ${targets.local.store.name} falhou na leitura (${(e as Error)?.message ?? e})`);
  }
  return null;
}

/**
 * Grava nos dois caches; cada falha é só registrada. Devolve o nome dos que gravaram.
 * O limite de tempo vale só para o Brasil; o local é aguardado como sempre foi.
 */
export async function writeSharedCache(
  targets: CacheTargets,
  action: string,
  result: unknown,
  expiresAt: string,
  options: { timeoutMs?: number; log?: (message: string) => void } = {},
): Promise<string[]> {
  const log = options.log ?? (() => {});
  const timeoutMs = options.timeoutMs ?? BRASIL_TIMEOUT_MS;
  const alvos = [targets.brasil, targets.local].filter((t): t is CacheTarget => t !== null);
  const settled = await Promise.allSettled(
    alvos.map((t) => {
      const escrita = t.store.write(action, t.key, result, expiresAt);
      return t === targets.brasil ? withTimeout(escrita, timeoutMs, t.store.name) : escrita;
    }),
  );
  const gravados: string[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") gravados.push(alvos[i].store.name);
    else log(`cache ${alvos[i].store.name} falhou na gravação (${(s.reason as Error)?.message ?? s.reason})`);
  });
  return gravados;
}
