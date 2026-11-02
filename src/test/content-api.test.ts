import { describe, expect, it } from "vitest";
import { bibleChapterRequest, contentApiBase } from "@/lib/content-api";

describe("content-api", () => {
  const supabaseEnv = { VITE_SUPABASE_URL: "https://proj.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "anon" };

  it("sem VITE_CONTENT_API_URL continua usando a bible-proxy do Supabase", () => {
    const req = bibleChapterRequest({ version: "NVIPT", bookId: 43, chapter: 3 }, supabaseEnv);
    expect(req.url).toBe("https://proj.supabase.co/functions/v1/bible-proxy?version=NVIPT&bookId=43&chapter=3");
    expect(req.headers.Authorization).toBe("Bearer anon");
  });

  it("com VITE_CONTENT_API_URL usa o Worker, sem mandar chave do Supabase", () => {
    const env = { ...supabaseEnv, VITE_CONTENT_API_URL: "https://fc-content.example.dev/" };
    expect(contentApiBase(env)).toBe("https://fc-content.example.dev");
    const req = bibleChapterRequest({ version: "KJV", bookId: 1, chapter: 2 }, env);
    expect(req.url).toBe("https://fc-content.example.dev/v1/bible?version=KJV&bookId=1&chapter=2");
    expect(req.headers).toEqual({});
  });
});
