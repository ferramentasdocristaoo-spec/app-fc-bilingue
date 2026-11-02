import type { Ctx, Deps, Env } from "./types";
import { corsHeaders, error, json, withHeaders } from "./http";
import { handleBible } from "./bible";
import { handleLibrary } from "./library";
import { handleMuralImage, handleMuralUpload } from "./mural";

/**
 * fc-content — conteúdo pesado do app FC bilíngue servido pela Cloudflare.
 *   GET  /v1/bible?version=&bookId=&chapter=     texto bíblico (público, cache longo)
 *   GET  /v1/library/{produto}/{volume}?lang=    volume da biblioteca (precisa de acesso)
 *   POST /v1/mural/images                        envia imagem do mural (usuário liberado)
 *   GET  /v1/mural/{aaaa-mm}/{uuid}.{ext}        imagem do mural (pública, imutável)
 *   GET  /health
 */
export async function route(req: Request, env: Env, deps: Deps, ctx: Ctx): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") return new Response(null, { status: 204 });
  if (path === "/health") return json({ ok: true });
  if (path === "/v1/bible" && method === "GET") return handleBible(url, env, deps, ctx);
  if (path.startsWith("/v1/library/") && method === "GET") return handleLibrary(req, url, env, deps, ctx);
  if (path === "/v1/mural/images" && method === "POST") return handleMuralUpload(req, url, env, deps);
  if (path.startsWith("/v1/mural/") && method === "GET") return handleMuralImage(url, env, deps, ctx);
  return error("not_found", 404);
}

export async function handle(req: Request, env: Env, deps: Deps, ctx: Ctx): Promise<Response> {
  const cors = corsHeaders(req, env);
  try {
    return withHeaders(await route(req, env, deps, ctx), cors);
  } catch (err) {
    console.error("fc-content error", err instanceof Error ? err.message : "unknown");
    return withHeaders(error("internal_error", 500), cors);
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    // caches.default existe no runtime dos Workers
    const cache = (globalThis as unknown as { caches: { default: Deps["cache"] } }).caches.default;
    return handle(req, env, { cache, fetch: (input, init) => fetch(input, init), now: () => Date.now() }, ctx);
  },
};
