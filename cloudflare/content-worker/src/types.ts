// Tipos mínimos dos bindings usados pelo Worker. Mantidos aqui (e não via
// @cloudflare/workers-types) para que os testes rodem no vitest do app.

export interface R2ObjectLike {
  key: string;
  etag?: string;
  httpEtag?: string;
  size?: number;
  httpMetadata?: { contentType?: string };
  body: ReadableStream | null;
  text(): Promise<string>;
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
}

export interface CacheLike {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

export interface Env {
  CONTENT: R2BucketLike;
  SUPABASE_URL: string;
  /** Chave pública (anon/publishable) — só chama RPCs liberadas para anon. */
  SUPABASE_ANON_KEY: string;
  /** Opcional: segredo HS256 legado do projeto. Projetos com chaves assimétricas usam JWKS. */
  SUPABASE_JWT_SECRET?: string;
  /** Lista separada por vírgula. "*" libera tudo (só para desenvolvimento). */
  ALLOWED_ORIGINS?: string;
  /** "true" aceita o cabeçalho X-FC-Email (login antigo só por e-mail) durante a transição. */
  ALLOW_LEGACY_EMAIL?: string;
  /** URL pública do próprio Worker, usada para montar links de imagens do mural. */
  PUBLIC_BASE_URL?: string;
  BIBLE_ORIGIN?: string;
}

export interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
}

export interface Deps {
  cache: CacheLike;
  fetch: typeof fetch;
  now: () => number;
}
