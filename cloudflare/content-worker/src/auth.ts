import type { Deps, Env } from "./types";
import { sha256Hex } from "./http";

/**
 * Identidade de quem chama o Worker.
 * - "jwt": sessão do Supabase Auth (link mágico) — assinatura conferida aqui.
 * - "legacy": login antigo só por e-mail (cabeçalho X-FC-Email), aceito apenas
 *   enquanto ALLOW_LEGACY_EMAIL = "true". Mesmo nível de confiança da função
 *   library-content atual, que recebia o e-mail no corpo.
 */
export type Caller = { email: string; via: "jwt" | "legacy" };

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
};

type Jwk = JsonWebKey & { kid?: string; alg?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const JWKS_TTL_MS = 10 * 60 * 1000;
let jwksMemo: { url: string; keys: Jwk[]; at: number } | null = null;

export function resetJwksMemo() {
  jwksMemo = null;
}

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodePart<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part))) as T;
}

async function loadJwks(env: Env, deps: Deps): Promise<Jwk[]> {
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
  if (jwksMemo && jwksMemo.url === url && deps.now() - jwksMemo.at < JWKS_TTL_MS) return jwksMemo.keys;
  const res = await deps.fetch(url, { headers: { apikey: env.SUPABASE_ANON_KEY } });
  if (!res.ok) return [];
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksMemo = { url, keys, at: deps.now() };
  return keys;
}

async function verifySignature(header: JwtHeader, signingInput: string, signature: Uint8Array, env: Env, deps: Deps) {
  const data = new TextEncoder().encode(signingInput);
  if (header.alg === "HS256") {
    if (!env.SUPABASE_JWT_SECRET) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.SUPABASE_JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify("HMAC", key, signature, data);
  }
  if (header.alg === "ES256" || header.alg === "RS256") {
    const keys = await loadJwks(env, deps);
    const jwk = keys.find((k) => (header.kid ? k.kid === header.kid : true) && (!k.alg || k.alg === header.alg));
    if (!jwk) return false;
    const algorithm =
      header.alg === "ES256"
        ? { import: { name: "ECDSA", namedCurve: "P-256" }, verify: { name: "ECDSA", hash: "SHA-256" } }
        : { import: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, verify: { name: "RSASSA-PKCS1-v1_5" } };
    const key = await crypto.subtle.importKey("jwk", jwk, algorithm.import, false, ["verify"]);
    return crypto.subtle.verify(algorithm.verify, key, signature, data);
  }
  return false;
}

/** Confere assinatura, validade, emissor e público de um access token do Supabase Auth. */
export async function verifySupabaseJwt(token: string, env: Env, deps: Deps): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header: JwtHeader;
  let payload: JwtPayload;
  try {
    header = decodePart<JwtHeader>(parts[0]);
    payload = decodePart<JwtPayload>(parts[1]);
  } catch {
    return null;
  }
  const ok = await verifySignature(header, `${parts[0]}.${parts[1]}`, b64urlToBytes(parts[2]), env, deps).catch(() => false);
  if (!ok) return null;

  const nowSec = Math.floor(deps.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) return null;
  if (typeof payload.nbf === "number" && payload.nbf > nowSec + 30) return null;
  const expectedIss = `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
  if (payload.iss && payload.iss !== expectedIss) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes("authenticated")) return null;
  return payload;
}

/** Descobre quem está chamando. Não decide permissão — só identidade. */
export async function identifyCaller(req: Request, env: Env, deps: Deps): Promise<Caller | null> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token) {
    const payload = await verifySupabaseJwt(token, env, deps);
    if (payload?.role === "authenticated" && payload.email && EMAIL_RE.test(payload.email)) {
      return { email: payload.email.trim().toLowerCase(), via: "jwt" };
    }
  }
  if (env.ALLOW_LEGACY_EMAIL === "true") {
    const email = (req.headers.get("X-FC-Email") ?? "").trim().toLowerCase();
    if (email && EMAIL_RE.test(email)) return { email, via: "legacy" };
  }
  return null;
}

/**
 * Chama uma RPC do Supabase com a chave pública e guarda a resposta no Cache API
 * por alguns minutos — assim cada leitor custa ~1 consulta pequena ao Supabase
 * a cada 5 min, em vez de baixar o conteúdo inteiro de lá.
 */
export async function cachedRpc<T>(
  env: Env,
  deps: Deps,
  fn: string,
  args: Record<string, string>,
  ttlSeconds = 300,
): Promise<T | null> {
  const cacheKey = `https://rpc-cache.fc.internal/${fn}/${await sha256Hex(JSON.stringify(args))}`;
  const hit = await deps.cache.match(cacheKey);
  if (hit) return (await hit.json()) as T;

  const res = await deps.fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) return null;
  const value = (await res.json()) as T;
  // Resposta negativa fica pouco tempo no cache: quem acabou de comprar não espera 5 min.
  const ttl = value === true || value === "ok" ? ttlSeconds : 30;
  await deps.cache.put(
    cacheKey,
    new Response(JSON.stringify(value), {
      headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${ttl}` },
    }),
  );
  return value;
}

export type AccessStatus = "ok" | "not_approved" | "blocked" | "expired";

/** Usuário do app liberado (approved_emails sem bloqueio e dentro da validade). */
export async function appAccessStatus(email: string, env: Env, deps: Deps): Promise<AccessStatus | null> {
  return cachedRpc<AccessStatus>(env, deps, "app_access_status", { _email: email });
}

export async function hasLibraryAccess(email: string, productSlug: string, env: Env, deps: Deps): Promise<boolean> {
  return (await cachedRpc<boolean>(env, deps, "has_library_access", { _email: email, _product_slug: productSlug })) === true;
}
