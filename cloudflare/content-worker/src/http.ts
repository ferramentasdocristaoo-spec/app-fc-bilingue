import type { Env } from "./types";

export const ALLOWED_HEADERS = "authorization, content-type, x-fc-email, if-none-match";

export function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && (allowed.includes("*") || allowed.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

export const error = (code: string, status: number) => json({ error: code }, status);

export function withHeaders(res: Response, headers: Record<string, string>): Response {
  const out = new Response(res.body, res);
  for (const [key, value] of Object.entries(headers)) out.headers.set(key, value);
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
