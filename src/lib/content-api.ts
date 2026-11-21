import { supabase } from "@/integrations/supabase/client";
import { offlineBible } from "@/lib/bible-offline/manager";

/**
 * Ponto único de acesso ao conteúdo pesado do app (Bíblia, biblioteca, imagens do mural).
 *
 * Com VITE_CONTENT_API_URL definido, tudo vem do Worker fc-content na Cloudflare
 * (cache na borda + R2), sem gastar egress do Supabase. Sem a variável, o app continua
 * usando as funções antigas do Supabase — por isso o deploy pode ser feito em etapas.
 */

const AUTH_EMAIL_KEY = "fc-sermon-auth-email";

type Env = Record<string, string | undefined>;

export function contentApiBase(env: Env = import.meta.env as Env): string | null {
  const raw = (env.VITE_CONTENT_API_URL ?? "").trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

export type BibleChapterRequest = { version: string; bookId: number; chapter: number };

export function bibleChapterRequest(
  { version, bookId, chapter }: BibleChapterRequest,
  env: Env = import.meta.env as Env,
): { url: string; headers: Record<string, string> } {
  const query = `version=${encodeURIComponent(version)}&bookId=${bookId}&chapter=${chapter}`;
  const base = contentApiBase(env);
  if (base) return { url: `${base}/v1/bible?${query}`, headers: {} };
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  return {
    url: `${env.VITE_SUPABASE_URL}/functions/v1/bible-proxy?${query}`,
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  };
}

/** Capítulos já lidos nesta sessão: voltar a um capítulo ou trocar de versão e voltar não refaz o pedido. */
const BIBLE_CACHE_MAX = 60;
const bibleCache = new Map<string, unknown[]>();
const bibleCacheKey = ({ version, bookId, chapter }: BibleChapterRequest) => `${version}:${bookId}:${chapter}`;

export function clearBibleChapterCache() {
  bibleCache.clear();
}

/** Espera entre tentativas quando o provedor (bolls.life) limita pedidos (429) ou cai (5xx). */
export const BIBLE_RETRY_DELAYS_MS = [700, 1800];
const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) { reject(new DOMException("aborted", "AbortError")); return; }
  const onAbort = () => { clearTimeout(id); reject(new DOMException("aborted", "AbortError")); };
  const id = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, ms);
  signal?.addEventListener("abort", onAbort, { once: true });
});

/** Busca um capítulo e devolve a lista crua de versículos (formato bolls.life). */
export async function fetchBibleChapter(
  request: BibleChapterRequest,
  init: { signal?: AbortSignal; retryDelaysMs?: number[] } = {},
): Promise<unknown[]> {
  const key = bibleCacheKey(request);
  const cached = bibleCache.get(key);
  if (cached) return cached;
  // Versão guardada no aparelho (Bíblia offline): lê dele, sem internet.
  const stored = await offlineBible().readChapter(request.version, request.bookId, request.chapter);
  if (init.signal?.aborted) throw new DOMException("aborted", "AbortError");
  if (stored) {
    if (bibleCache.size >= BIBLE_CACHE_MAX) bibleCache.delete(bibleCache.keys().next().value as string);
    bibleCache.set(key, stored);
    return stored;
  }
  const { url, headers } = bibleChapterRequest(request);
  const delays = init.retryDelaysMs ?? BIBLE_RETRY_DELAYS_MS;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers, signal: init.signal });
    if (!res.ok) {
      const transient = res.status === 429 || res.status >= 500;
      if (transient && attempt < delays.length) {
        await sleep(delays[attempt], init.signal);
        continue;
      }
      throw new Error(`bible_http_${res.status}`);
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("bible_invalid_response");
    if (bibleCache.size >= BIBLE_CACHE_MAX) bibleCache.delete(bibleCache.keys().next().value as string);
    bibleCache.set(key, data);
    return data;
  }
}

/**
 * Cabeçalhos de identidade para o Worker: o access token do Supabase Auth quando há
 * sessão (link mágico); senão o e-mail do login antigo, aceito só durante a transição.
 */
export async function contentAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) return { Authorization: `Bearer ${token}` };
  const legacyEmail = typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_EMAIL_KEY) : null;
  return legacyEmail ? { "X-FC-Email": legacyEmail } : {};
}

export type LibraryVolume = { title: string; content: string; language: string; word_count: number };

export async function fetchLibraryVolume(params: {
  email: string;
  productSlug: string;
  volumeSlug: string;
  language: string;
}): Promise<{ data: LibraryVolume | null; error: string | null }> {
  const base = contentApiBase();
  if (base) {
    try {
      const url = `${base}/v1/library/${encodeURIComponent(params.productSlug)}/${encodeURIComponent(params.volumeSlug)}?lang=${encodeURIComponent(params.language)}`;
      const res = await fetch(url, { headers: await contentAuthHeaders() });
      const body = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: body?.error || "content_error" };
      return { data: body as LibraryVolume, error: null };
    } catch {
      return { data: null, error: "content_error" };
    }
  }
  const { data, error } = await supabase.functions.invoke("library-content", {
    body: {
      email: params.email,
      product_slug: params.productSlug,
      volume_slug: params.volumeSlug,
      language: params.language,
    },
  });
  if (error || data?.error) return { data: null, error: data?.error || "content_error" };
  return { data: data as LibraryVolume, error: null };
}

/** Envia a imagem de um pedido de oração e devolve a URL pública. */
export async function uploadPrayerImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const base = contentApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/v1/mural/images`, {
        method: "POST",
        headers: { ...(await contentAuthHeaders()), "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) return { url: null, error: body?.error || "upload_error" };
      return { url: body.url as string, error: null };
    } catch {
      return { url: null, error: "upload_error" };
    }
  }
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("prayer-images").upload(path, file, { cacheControl: "31536000" });
  if (error) return { url: null, error: error.message };
  return { url: supabase.storage.from("prayer-images").getPublicUrl(path).data.publicUrl, error: null };
}
