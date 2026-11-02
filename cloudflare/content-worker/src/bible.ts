import type { Ctx, Deps, Env } from "./types";
import { error, json } from "./http";

/**
 * Texto bíblico: Cache API (borda) → R2 (permanente) → bolls.life (origem).
 * Cada capítulo é buscado na origem uma única vez e depois fica no R2 para sempre.
 * Rota pública, como a bible-proxy atual (texto bíblico não é conteúdo pago).
 */
export const BIBLE_BROWSER_CACHE = "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800";

export type BibleParams = { version: string; bookId: number; chapter: number };

export function parseBibleParams(url: URL): BibleParams | null {
  const version = (url.searchParams.get("version") ?? "").trim();
  const bookId = Number(url.searchParams.get("bookId"));
  const chapter = Number(url.searchParams.get("chapter"));
  if (!/^[A-Za-z0-9_+-]{1,24}$/.test(version)) return null;
  if (!Number.isInteger(bookId) || bookId < 1 || bookId > 88) return null;
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 200) return null;
  return { version, bookId, chapter };
}

export const bibleR2Key = (p: BibleParams) => `bible/${p.version}/${p.bookId}/${p.chapter}.json`;
const cacheUrl = (p: BibleParams) => `https://bible-cache.fc.internal/${bibleR2Key(p)}`;

function bibleResponse(body: string, source: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": BIBLE_BROWSER_CACHE,
      "X-FC-Source": source,
    },
  });
}

export async function handleBible(url: URL, env: Env, deps: Deps, ctx: Ctx): Promise<Response> {
  const params = parseBibleParams(url);
  if (!params) return error("missing_parameters", 400);

  const edge = await deps.cache.match(cacheUrl(params));
  if (edge) {
    const body = await edge.text();
    return bibleResponse(body, "edge");
  }

  const stored = await env.CONTENT.get(bibleR2Key(params));
  if (stored) {
    const body = await stored.text();
    ctx.waitUntil(deps.cache.put(cacheUrl(params), bibleResponse(body, "edge")));
    return bibleResponse(body, "r2");
  }

  const origin = (env.BIBLE_ORIGIN ?? "https://bolls.life").replace(/\/$/, "");
  let upstream: Response;
  try {
    upstream = await deps.fetch(`${origin}/get-text/${encodeURIComponent(params.version)}/${params.bookId}/${params.chapter}/`);
  } catch {
    return error("bible_provider_unavailable", 502);
  }
  if (!upstream.ok) return error("bible_not_found", upstream.status === 404 ? 404 : 502);
  const data = await upstream.json().catch(() => null);
  if (!Array.isArray(data) || data.length === 0) return error("invalid_bible_response", 502);

  const body = JSON.stringify(data);
  ctx.waitUntil(
    Promise.all([
      env.CONTENT.put(bibleR2Key(params), body, { httpMetadata: { contentType: "application/json; charset=utf-8" } }),
      deps.cache.put(cacheUrl(params), bibleResponse(body, "edge")),
    ]),
  );
  return bibleResponse(body, "origin");
}

export { json };
