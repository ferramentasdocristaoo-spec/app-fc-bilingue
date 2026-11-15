import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_VERSION_BY_LANG, VERSIONS_BY_LANG, normalizeBibleLanguage } from "@/data/bible-versions";

// Versículo do dia: só interessa qual versão ele pede ao Worker, por isso a busca é simulada.
vi.mock("@/lib/content-api", () => ({
  fetchBibleChapter: vi.fn(async () => [{ verse: 1, text: "No princípio criou Deus os céus e a terra." }]),
}));
import { fetchBibleChapter } from "@/lib/content-api";
import { dailyVerseVersion, fetchVerse } from "@/lib/daily-verse";

/** Lista do FC Brasil (fc-sermon/src/pages/BibliaPage.tsx), na mesma ordem. */
const LISTA_FC_BRASIL = ["ACF11", "ARA", "ARC09", "ALM21", "KJA", "NAA", "NBV07", "NTLH", "NVIPT", "NVT", "TB10", "VFL"];

describe("versões brasileiras da Bíblia (pt-BR)", () => {
  it("pt-BR tem as 12 versões do FC Brasil, na mesma ordem, com nome e sigla", () => {
    const ids = VERSIONS_BY_LANG["pt-BR"].map((v) => v.id);
    expect(ids).toEqual(LISTA_FC_BRASIL);
    for (const v of VERSIONS_BY_LANG["pt-BR"]) {
      expect(v.name).toMatch(/^[A-Z0-9]+ - .+/);
      // Só caracteres aceitos pelo Worker de conteúdo (cloudflare/content-worker/src/bible.ts).
      expect(v.id).toMatch(/^[A-Za-z0-9_+-]{1,24}$/);
    }
  });

  it("padrão do pt-BR é a ARA (Almeida Revista e Atualizada) e ela está na lista", () => {
    expect(DEFAULT_VERSION_BY_LANG["pt-BR"]).toBe("ARA");
    expect(VERSIONS_BY_LANG["pt-BR"].some((v) => v.id === "ARA")).toBe(true);
  });

  it("pt-PT continua com a lista europeia e o padrão OL", () => {
    expect(DEFAULT_VERSION_BY_LANG["pt-PT"]).toBe("OL");
    expect(VERSIONS_BY_LANG["pt-PT"].map((v) => v.id)).toEqual(["OL", "NVIPT"]);
  });

  it("todo idioma com lista tem um padrão que está na própria lista", () => {
    for (const [lang, versions] of Object.entries(VERSIONS_BY_LANG)) {
      const padrao = DEFAULT_VERSION_BY_LANG[lang];
      expect(padrao, lang).toBeTruthy();
      expect(versions.map((v) => v.id), lang).toContain(padrao);
    }
  });

  it("normalizeBibleLanguage: pt-BR (em qualquer grafia) é pt-BR; pt sem região e outros lusófonos são pt-PT", () => {
    expect(normalizeBibleLanguage("pt-BR")).toBe("pt-BR");
    expect(normalizeBibleLanguage("pt-br")).toBe("pt-BR");
    expect(normalizeBibleLanguage("pt_BR")).toBe("pt-BR");
    expect(normalizeBibleLanguage("pt")).toBe("pt-PT");
    expect(normalizeBibleLanguage("pt-PT")).toBe("pt-PT");
    expect(normalizeBibleLanguage("pt-AO")).toBe("pt-PT");
    expect(normalizeBibleLanguage("en-US")).toBe("en");
    expect(normalizeBibleLanguage("de-CH")).toBe("de");
    expect(normalizeBibleLanguage("xx")).toBe("pt-PT");
  });
});

describe("versículo do dia em pt-BR", () => {
  beforeEach(() => vi.mocked(fetchBibleChapter).mockClear());

  it("usa a versão padrão de cada idioma (pt-BR → ARA, pt-PT → OL, en → KJV, de → LUT)", () => {
    expect(dailyVerseVersion("pt-BR")).toBe("ARA");
    expect(dailyVerseVersion("pt-PT")).toBe("OL");
    expect(dailyVerseVersion("pt")).toBe("OL");
    expect(dailyVerseVersion("en-GB")).toBe("KJV");
    expect(dailyVerseVersion("de")).toBe("LUT");
    expect(dailyVerseVersion("es")).toBe("RV1960");
  });

  it("pede o capítulo ao Worker na ARA quando o idioma é pt-BR", async () => {
    const verse = await fetchVerse("pt-BR", { book: 1, chapter: 1, verse: 1 });
    expect(fetchBibleChapter).toHaveBeenCalledWith({ version: "ARA", bookId: 1, chapter: 1 });
    expect(verse?.text).toContain("No princípio");
  });
});
