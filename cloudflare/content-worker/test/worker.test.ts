// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handle } from "../src/index";
import { resetJwksMemo, verifySupabaseJwt } from "../src/auth";
import { sniffImageType } from "../src/mural";
import type { CacheLike, Deps, Env, R2BucketLike, R2ObjectLike } from "../src/types";

const SUPABASE_URL = "https://proj.supabase.co";
const SECRET = "test-secret-only-for-unit-tests";
const NOW = Date.UTC(2026, 10, 2, 12, 0, 0);

class MemoryR2 implements R2BucketLike {
  store = new Map<string, { data: Uint8Array; type?: string }>();
  async get(key: string): Promise<R2ObjectLike | null> {
    const item = this.store.get(key);
    if (!item) return null;
    const data = item.data;
    return {
      key,
      etag: `etag-${data.length}`,
      httpEtag: `"etag-${data.length}"`,
      httpMetadata: { contentType: item.type },
      body: new Response(data).body,
      text: async () => new TextDecoder().decode(data),
    };
  }
  async put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }) {
    const data = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value as ArrayBuffer);
    this.store.set(key, { data, type: options?.httpMetadata?.contentType });
  }
}

class MemoryCache implements CacheLike {
  store = new Map<string, Response>();
  async match(req: Request | string) {
    const hit = this.store.get(typeof req === "string" ? req : req.url);
    return hit?.clone();
  }
  async put(req: Request | string, res: Response) {
    this.store.set(typeof req === "string" ? req : req.url, res.clone());
  }
}

const b64url = (data: Uint8Array | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function signHs256(payload: Record<string, unknown>, secret = SECRET) {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

const validClaims = (email = "leitor@exemplo.com") => ({
  sub: "user-1",
  email,
  role: "authenticated",
  aud: "authenticated",
  iss: `${SUPABASE_URL}/auth/v1`,
  exp: Math.floor(NOW / 1000) + 3600,
});

let r2: MemoryR2;
let cache: MemoryCache;
let fetchMock: ReturnType<typeof vi.fn>;
let env: Env;
let deps: Deps;
const waits: Promise<unknown>[] = [];
const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p) };
const settle = () => Promise.all(waits.splice(0));

const rpcReply = (fnResults: Record<string, unknown>) => async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const fn = url.split("/rpc/")[1];
  if (fn && fn in fnResults) return new Response(JSON.stringify(fnResults[fn]), { status: 200 });
  if (url.startsWith("https://bolls.life/")) return new Response(JSON.stringify([{ pk: 1, verse: 1, text: "No princípio" }]));
  return new Response("not found", { status: 404 });
};

beforeEach(() => {
  r2 = new MemoryR2();
  cache = new MemoryCache();
  fetchMock = vi.fn(rpcReply({ has_library_access: true, app_access_status: "ok" }));
  env = {
    CONTENT: r2,
    SUPABASE_URL,
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_JWT_SECRET: SECRET,
    ALLOWED_ORIGINS: "https://app-fc-bilingue.pages.dev",
    ALLOW_LEGACY_EMAIL: "false",
    PUBLIC_BASE_URL: "https://fc-content.example.dev",
  };
  deps = { cache, fetch: fetchMock as unknown as typeof fetch, now: () => NOW };
  waits.length = 0;
  resetJwksMemo();
});

const call = (path: string, init: RequestInit = {}) => handle(new Request(`https://fc-content.example.dev${path}`, init), env, deps, ctx);

describe("JWT do Supabase", () => {
  it("aceita token HS256 válido", async () => {
    const payload = await verifySupabaseJwt(await signHs256(validClaims()), env, deps);
    expect(payload?.email).toBe("leitor@exemplo.com");
  });
  it("recusa assinatura errada, token vencido e emissor de outro projeto", async () => {
    expect(await verifySupabaseJwt(await signHs256(validClaims(), "outro-segredo"), env, deps)).toBeNull();
    expect(await verifySupabaseJwt(await signHs256({ ...validClaims(), exp: Math.floor(NOW / 1000) - 1 }), env, deps)).toBeNull();
    expect(await verifySupabaseJwt(await signHs256({ ...validClaims(), iss: "https://outro.supabase.co/auth/v1" }), env, deps)).toBeNull();
    expect(await verifySupabaseJwt(await signHs256({ ...validClaims(), aud: "anon" }), env, deps)).toBeNull();
    expect(await verifySupabaseJwt("lixo", env, deps)).toBeNull();
  });
  it("aceita ES256 conferindo pela JWKS do projeto", async () => {
    const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1", alg: "ES256" };
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input).endsWith("/auth/v1/.well-known/jwks.json") ? new Response(JSON.stringify({ keys: [jwk] })) : new Response("", { status: 404 }),
    );
    const head = b64url(JSON.stringify({ alg: "ES256", kid: "k1", typ: "JWT" }));
    const body = b64url(JSON.stringify(validClaims()));
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, new TextEncoder().encode(`${head}.${body}`)));
    const payload = await verifySupabaseJwt(`${head}.${body}.${b64url(sig)}`, { ...env, SUPABASE_JWT_SECRET: undefined }, deps);
    expect(payload?.sub).toBe("user-1");
  });
});

describe("Bíblia", () => {
  it("busca na origem uma vez, guarda no R2 e depois serve do cache", async () => {
    const first = await call("/v1/bible?version=NVIPT&bookId=1&chapter=1");
    expect(first.status).toBe(200);
    expect(first.headers.get("X-FC-Source")).toBe("origin");
    expect(first.headers.get("Cache-Control")).toContain("s-maxage");
    await settle();
    expect(r2.store.has("bible/NVIPT/1/1.json")).toBe(true);

    const second = await call("/v1/bible?version=NVIPT&bookId=1&chapter=1");
    expect(second.headers.get("X-FC-Source")).toBe("edge");
    expect(await second.json()).toEqual([{ pk: 1, verse: 1, text: "No princípio" }]);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("bolls.life"))).toHaveLength(1);
  });
  it("lê do R2 quando o cache da borda está vazio", async () => {
    await r2.put("bible/KJV/43/3.json", JSON.stringify([{ verse: 16, text: "For God so loved" }]));
    const res = await call("/v1/bible?version=KJV&bookId=43&chapter=3");
    expect(res.headers.get("X-FC-Source")).toBe("r2");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("valida parâmetros", async () => {
    expect((await call("/v1/bible?version=../x&bookId=1&chapter=1")).status).toBe(400);
    expect((await call("/v1/bible?version=KJV&bookId=99&chapter=1")).status).toBe(400);
  });
  it("devolve CORS só para origens liberadas", async () => {
    await r2.put("bible/KJV/1/1.json", "[]");
    const ok = await call("/v1/bible?version=KJV&bookId=1&chapter=1", { headers: { Origin: "https://app-fc-bilingue.pages.dev" } });
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe("https://app-fc-bilingue.pages.dev");
    const other = await call("/v1/bible?version=KJV&bookId=1&chapter=1", { headers: { Origin: "https://site-qualquer.com" } });
    expect(other.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("Biblioteca", () => {
  const volume = { title: "Vol 1", content: "Capítulo 1\nTexto", language: "pt-BR", word_count: 3 };
  beforeEach(async () => {
    await r2.put("library/kit-pregador/volume-1/pt-BR.json", JSON.stringify(volume));
  });

  it("exige identificação", async () => {
    expect((await call("/v1/library/kit-pregador/volume-1?lang=pt-BR")).status).toBe(401);
  });
  it("não aceita o cabeçalho de e-mail antigo quando a transição foi desligada", async () => {
    const res = await call("/v1/library/kit-pregador/volume-1", { headers: { "X-FC-Email": "leitor@exemplo.com" } });
    expect(res.status).toBe(401);
  });
  it("aceita o e-mail antigo enquanto ALLOW_LEGACY_EMAIL = true", async () => {
    env.ALLOW_LEGACY_EMAIL = "true";
    const res = await call("/v1/library/kit-pregador/volume-1", { headers: { "X-FC-Email": "Leitor@Exemplo.com" } });
    expect(res.status).toBe(200);
    const rpcBody = JSON.parse(String(fetchMock.mock.calls.find(([u]) => String(u).endsWith("/rpc/has_library_access"))?.[1]?.body));
    expect(rpcBody).toEqual({ _email: "leitor@exemplo.com", _product_slug: "kit-pregador" });
  });
  it("entrega o volume com JWT válido e cai para pt-BR sem tradução", async () => {
    const token = await signHs256(validClaims());
    const res = await call("/v1/library/kit-pregador/volume-1?lang=en", { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(volume);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=3600");
  });
  it("responde 304 quando o navegador já tem a mesma versão", async () => {
    const token = await signHs256(validClaims());
    const first = await call("/v1/library/kit-pregador/volume-1", { headers: { Authorization: `Bearer ${token}` } });
    const etag = first.headers.get("ETag")!;
    const again = await call("/v1/library/kit-pregador/volume-1", { headers: { Authorization: `Bearer ${token}`, "If-None-Match": etag } });
    expect(again.status).toBe(304);
  });
  it("nega quem não comprou o produto e guarda a consulta no cache", async () => {
    fetchMock.mockImplementation(rpcReply({ has_library_access: false }));
    const token = await signHs256(validClaims());
    const res = await call("/v1/library/kit-pregador/volume-1", { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(403);
    await call("/v1/library/kit-pregador/volume-1", { headers: { Authorization: `Bearer ${token}` } });
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("/rpc/"))).toHaveLength(1);
  });
  it("recusa slugs com caracteres estranhos", async () => {
    expect((await call("/v1/library/..%2Fsecret/volume-1")).status).toBe(400);
  });
});

describe("Mural", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);

  it("reconhece tipos de imagem pelos bytes", () => {
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
  it("envia imagem com JWT, grava no R2 e serve de volta com cache imutável", async () => {
    const token = await signHs256(validClaims());
    const up = await call("/v1/mural/images", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/png" }, body: png });
    expect(up.status).toBe(201);
    const { url, key } = (await up.json()) as { url: string; key: string };
    expect(key).toMatch(/^mural\/2026-11\/[0-9a-f-]{36}\.png$/);
    expect(url).toBe(`https://fc-content.example.dev/v1/${key}`);
    const img = await call(`/v1/${key}`);
    expect(img.status).toBe(200);
    expect(img.headers.get("Content-Type")).toBe("image/png");
    expect(img.headers.get("Cache-Control")).toContain("immutable");
  });
  it("serve imagens migradas do Supabase (mural/legacy) e recusa caminhos estranhos", async () => {
    await r2.put("mural/legacy/1710000000000-abc.jpg", new Uint8Array([0xff, 0xd8, 0xff]).buffer, { httpMetadata: { contentType: "image/jpeg" } });
    expect((await call("/v1/mural/legacy/1710000000000-abc.jpg")).status).toBe(200);
    expect((await call("/v1/mural/legacy/..%2F..%2Fsecret")).status).toBe(404);
    expect((await call("/v1/mural/library/kit/volume.json")).status).toBe(404);
  });
  it("recusa upload anônimo, usuário bloqueado e arquivo que não é imagem", async () => {
    expect((await call("/v1/mural/images", { method: "POST", body: png })).status).toBe(401);
    const token = await signHs256(validClaims());
    expect((await call("/v1/mural/images", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: "texto" })).status).toBe(415);
    fetchMock.mockImplementation(rpcReply({ app_access_status: "blocked" }));
    const blocked = await signHs256(validClaims("bloqueado@exemplo.com"));
    expect((await call("/v1/mural/images", { method: "POST", headers: { Authorization: `Bearer ${blocked}` }, body: png })).status).toBe(403);
  });
});
