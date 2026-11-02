import type { Ctx, Deps, Env } from "./types";
import { error } from "./http";
import { hasLibraryAccess, identifyCaller } from "./auth";

/**
 * Volumes da biblioteca (antes: tabela library_volumes + função library-content).
 * Arquivo no R2: library/{produto}/{volume}/{idioma}.json
 *   { "title": "...", "content": "...", "language": "pt-BR", "word_count": 1234 }
 * Sem tradução no idioma pedido → cai para pt-BR (mesma regra da função antiga).
 */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const LANG_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

export const libraryR2Key = (product: string, volume: string, lang: string) => `library/${product}/${volume}/${lang}.json`;

export function parseLibraryPath(pathname: string): { product: string; volume: string } | null {
  const match = pathname.match(/^\/v1\/library\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  const [product, volume] = [decodeURIComponent(match[1]), decodeURIComponent(match[2])];
  if (!SLUG_RE.test(product) || !SLUG_RE.test(volume)) return null;
  return { product, volume };
}

async function readVolume(env: Env, deps: Deps, ctx: Ctx, key: string): Promise<{ body: string; etag: string } | null> {
  const cacheKey = `https://library-cache.fc.internal/${key}`;
  const hit = await deps.cache.match(cacheKey);
  if (hit) return { body: await hit.text(), etag: hit.headers.get("ETag") ?? "" };
  const obj = await env.CONTENT.get(key);
  if (!obj) return null;
  const body = await obj.text();
  const etag = obj.httpEtag ?? (obj.etag ? `"${obj.etag}"` : "");
  ctx.waitUntil(
    deps.cache.put(
      cacheKey,
      new Response(body, { headers: { "Content-Type": "application/json", ETag: etag, "Cache-Control": "max-age=3600" } }),
    ),
  );
  return { body, etag };
}

export async function handleLibrary(req: Request, url: URL, env: Env, deps: Deps, ctx: Ctx): Promise<Response> {
  const target = parseLibraryPath(url.pathname);
  if (!target) return error("missing_parameters", 400);
  const lang = url.searchParams.get("lang") || "pt-BR";
  if (!LANG_RE.test(lang)) return error("invalid_language", 400);

  const caller = await identifyCaller(req, env, deps);
  if (!caller) return error("unauthorized", 401);
  if (!(await hasLibraryAccess(caller.email, target.product, env, deps))) return error("access_denied", 403);

  let volume = await readVolume(env, deps, ctx, libraryR2Key(target.product, target.volume, lang));
  if (!volume && lang !== "pt-BR") volume = await readVolume(env, deps, ctx, libraryR2Key(target.product, target.volume, "pt-BR"));
  if (!volume) return error("content_not_found", 404);

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    // privado: só o navegador do leitor guarda; nunca um cache compartilhado
    "Cache-Control": "private, max-age=3600",
  };
  if (volume.etag) headers.ETag = volume.etag;
  if (volume.etag && req.headers.get("If-None-Match") === volume.etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(volume.body, { headers });
}
