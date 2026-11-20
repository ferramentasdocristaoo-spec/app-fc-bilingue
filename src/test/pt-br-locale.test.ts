import { describe, expect, it } from "vitest";
import "@/i18n";
import i18n from "i18next";
import ptPT from "@/i18n/locales/pt-PT/translation.json";
import ptBR from "@/i18n/locales/pt-BR/translation.json";
import { matchAppLanguage } from "@/i18n/app-languages";
import { normalizeBibleLanguage } from "@/data/bible-versions";
import { libraryLanguage } from "@/data/library";
import { normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { appLogo } from "@/lib/branding";

type Tree = Record<string, unknown>;
const flat = (o: Tree, p = ""): [string, unknown][] =>
  Object.entries(o).flatMap(([k, v]) =>
    v !== null && typeof v === "object" && !Array.isArray(v) ? flat(v as Tree, `${p}${k}.`) : [[`${p}${k}`, v]],
  );
const placeholders = (s: unknown) => (String(s).match(/\{\{[^}]+\}\}/g) ?? []).sort().join(",");

/** Lusitanismos que não podem sobrar no português do Brasil (palavra inteira, sem acento sensível a maiúsculas). */
const LUSITANISMOS =
  // Limites de palavra com acentos (\b do JS não vê "é" como letra: "Moisés" casava com "és").
  /(?<!\p{L})(tu|teu|tua|teus|tuas|te|ti|contigo|podes|tens|queres|és|estás|vais|partilha\w*|ecrã|ficheiro\w*|utilizador\w*|rato|telemóvel|ementa|génesis|registo|palavra-passe|subscrição|anónimo|aceder|acede|acedes|guardar|guarda|elimina\w*|carregar em|instalar aplicação|nossa aplicação|instala a aplicação|a carregar|a gerar|a enviar|a orar|a analisar|a procurar|a aguardar|a ouvir|a trabalhar|a extrair|aspeto|ligação à internet|paragem|paragens|deuteronómio|crónicas|job|oséias|abdias|filemon)(?!\p{L})/iu;

describe("locale pt-BR", () => {
  const pt = Object.fromEntries(flat(ptPT as Tree));
  const br = Object.fromEntries(flat(ptBR as Tree));

  it("tem exatamente as mesmas chaves do pt-PT", () => {
    expect(Object.keys(br).sort()).toEqual(Object.keys(pt).sort());
  });

  it("mantém os placeholders {{x}} e o tamanho das listas", () => {
    for (const [key, value] of Object.entries(pt)) {
      if (Array.isArray(value)) expect((br[key] as unknown[]).length, key).toBe(value.length);
      else expect(placeholders(br[key]), key).toBe(placeholders(value));
    }
  });

  it("não sobra lusitanismo nem texto vazio", () => {
    for (const [key, value] of Object.entries(br)) {
      const texts = Array.isArray(value) ? (value as string[]) : [String(value)];
      for (const text of texts) {
        expect(text.trim(), key).not.toBe("");
        expect(text, `${key}: "${text}"`).not.toMatch(LUSITANISMOS);
      }
    }
  });

  it("usa os nomes brasileiros dos livros e 'você'", () => {
    const books = (ptBR as Tree & { biblia: { books: string[] } }).biblia.books;
    expect(books).toHaveLength(66);
    expect(books[0]).toBe("Gênesis");
    expect(books[4]).toBe("Deuteronômio");
    expect(books[17]).toBe("Jó");
    expect(books[27]).toBe("Oseias");
    expect(books[30]).toBe("Obadias");
    expect(books[56]).toBe("Filemom");
    expect(br["home.prepDone"]).toContain("Você pode");
    expect(br["sidebar.mural.description"]).toBe("Compartilhe pedidos de oração");
  });

  it("i18next: pt-BR traduz a interface e cai no pt-PT antes do inglês", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(i18n.t("home.yourWeek")).toBe("Sua semana");
    expect(i18n.t("login.passwordLabel")).toBe("Senha");
    // Chave que só existe no pt-PT (simulada): a reserva é o português de Portugal, não o inglês.
    i18n.addResource("pt-PT", "translation", "__teste.reserva", "só em pt-PT");
    i18n.addResource("en", "translation", "__teste.reserva", "only in en");
    expect(i18n.t("__teste.reserva")).toBe("só em pt-PT");
    expect(document.documentElement.lang).toBe("pt-BR");
    await i18n.changeLanguage("pt-PT");
  });

  it("conteúdo editorial, livraria e logo de pt-BR caem no pt-PT; a Bíblia tem lista própria", () => {
    expect(matchAppLanguage("pt-BR")).toBe("pt-BR");
    expect(matchAppLanguage("pt")).toBe("pt-PT");
    expect(normalizeJourneyLanguage("pt-BR")).toBe("pt-PT");
    // 14/11/2026: decisão do dono — as versões brasileiras do FC Brasil voltaram ao bilíngue.
    // Antes pt-BR caía em pt-PT (OL); agora tem lista própria (padrão ARA). Detalhe em bible-versions-pt-br.test.ts.
    expect(normalizeBibleLanguage("pt-BR")).toBe("pt-BR");
    expect(libraryLanguage("pt-BR")).toBe("pt-PT");
    expect(appLogo("pt-BR")).toBe(appLogo("pt-PT"));
  });
});
