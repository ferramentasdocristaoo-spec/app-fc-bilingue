import type { Ctx, Deps, Env } from "./types";
import { error, json } from "./http";
import { appAccessStatus, identifyCaller } from "./auth";

/** Imagens do mural de oração: upload autenticado, leitura pública e imutável. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const IMMUTABLE = "public, max-age=31536000, immutable";

/** Confere os primeiros bytes — não confia só no Content-Type enviado. */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

export async function handleMuralUpload(req: Request, url: URL, env: Env, deps: Deps): Promise<Response> {
  const caller = await identifyCaller(req, env, deps);
  if (!caller) return error("unauthorized", 401);
  const status = await appAccessStatus(caller.email, env, deps);
  if (status !== "ok") return error(status ?? "access_check_failed", status ? 403 : 503);

  const declared = Number(req.headers.get("Content-Length") ?? "0");
  if (declared > MAX_IMAGE_BYTES) return error("image_too_large", 413);
  const buffer = await req.arrayBuffer();
  if (buffer.byteLength === 0) return error("empty_image", 400);
  if (buffer.byteLength > MAX_IMAGE_BYTES) return error("image_too_large", 413);
  const type = sniffImageType(new Uint8Array(buffer.slice(0, 16)));
  if (!type) return error("unsupported_image_type", 415);

  const month = new Date(deps.now()).toISOString().slice(0, 7);
  const key = `mural/${month}/${crypto.randomUUID()}.${TYPES[type]}`;
  await env.CONTENT.put(key, buffer, { httpMetadata: { contentType: type, cacheControl: IMMUTABLE } });
  const base = (env.PUBLIC_BASE_URL || url.origin).replace(/\/$/, "");
  return json({ url: `${base}/v1/${key}`, key }, 201);
}

export async function handleMuralImage(url: URL, env: Env, deps: Deps, ctx: Ctx): Promise<Response> {
  const key = url.pathname.replace(/^\/v1\//, "");
  // novas: mural/aaaa-mm/uuid.ext · migradas do Supabase Storage: mural/legacy/nome-original
  const valid = /^mural\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(key) || /^mural\/legacy\/[A-Za-z0-9][A-Za-z0-9._-]{0,150}$/.test(key);
  if (!valid) return error("not_found", 404);
  const cacheKey = `https://mural-cache.fc.internal/${key}`;
  const hit = await deps.cache.match(cacheKey);
  if (hit) return hit;
  const obj = await env.CONTENT.get(key);
  if (!obj?.body) return error("not_found", 404);
  const res = new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": IMMUTABLE,
      ...(obj.httpEtag ? { ETag: obj.httpEtag } : {}),
    },
  });
  ctx.waitUntil(deps.cache.put(cacheKey, res.clone()));
  return res;
}
