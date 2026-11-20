import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { journeyPlaces } from "@/features/bible-journey/places";
import { leviticusInteractive, leviticusReviewStatus } from "@/features/bible-journey/leviticus-interactive";
import { buildLeviticusChapters } from "@/features/bible-journey/leviticus-content";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];

describe("Jornada interativa: Levítico", () => {
  it("está marcado como pendente de revisão humana", () => {
    expect(leviticusReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 5 movimentos com paradas, quiz e textos nos 6 idiomas", async () => {
    const leviticus = (await journeyCatalogRepository.getBook("leviticus"))!;
    expect(Object.keys(leviticusInteractive).sort()).toEqual(leviticus.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(leviticusInteractive)) {
      const range = leviticus.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(3);
      expect(section.stops.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      for (const stop of section.stops) {
        // Levítico acontece todo no Sinai (Lv 1:1; 25:1; 27:34): nenhum outro lugar no mapa.
        if (stop.placeId) expect(stop.placeId, `${slug}/${stop.id}`).toBe("sinai");
        expect(journeyPlaces.sinai).toBeDefined();
        expect(stop.title, `${slug}/${stop.id} precisa de título próprio`).toBeDefined();
        stop.people.forEach(id => expect(journeyPeople[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("leviticus");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        // Lv 6:1–7 tem outra numeração nas Bíblias alemãs (5:20–26): não usar.
        expect(stop.ref.chapter, stop.id).not.toBe(6);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          expect(stop.title![lang].trim(), `${stop.id}/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      expect(quiz.ref.book).toBe("leviticus");
      expect(quiz.ref.chapter).toBeGreaterThanOrEqual(range.startChapter);
      expect(quiz.ref.chapter).toBeLessThanOrEqual(range.endChapter);
      const count = quiz.options["pt-PT"].length;
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(4);
      LANGS.forEach(lang => {
        expect(quiz.question[lang].trim(), `${slug}/${lang}`).not.toBe("");
        expect(quiz.options[lang], `${slug}/${lang}`).toHaveLength(count);
        quiz.options[lang].forEach(option => expect(option.trim()).not.toBe(""));
        expect(quiz.explanation[lang].trim(), `${slug}/${lang}`).not.toBe("");
      });
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThan(count);
      const walk = (node: FamilyNode): void => { expect(journeyPeople[node.person], node.person).toBeDefined(); node.spouses?.forEach(id => expect(journeyPeople[id], id).toBeDefined()); node.children?.forEach(walk); };
      if (section.family) walk(section.family.root);
      expect(section.era.length, slug).toBeGreaterThan(0);
      for (const mark of section.era) {
        expect(mark.year, slug).toBeLessThan(0);
        LANGS.forEach(lang => expect(mark.label[lang].trim()).not.toBe(""));
      }
    }
  });

  it("as respostas certas do quiz não ficam sempre na mesma posição", () => {
    const answers = Object.values(leviticusInteractive).map(s => s.checkpoint.answer);
    expect(new Set(answers).size).toBeGreaterThan(1);
  });

  it("a gravura é de domínio público, tem fonte no Commons e o arquivo existe", () => {
    const figures = Object.values(leviticusInteractive).flatMap(s => s.figure ? [s.figure] : []);
    expect(figures.length).toBeGreaterThan(0);
    for (const figure of figures) {
      expect(figure.license).toBe("PD");
      expect(figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(figure.src).toMatch(/^\/jornada\/levitico\/.+\.webp$/);
      expect(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), figure.src).toBe(true);
      expect(figure.artist.trim()).not.toBe("");
      expect(figure.width).toBeGreaterThan(0);
      expect(figure.height).toBeGreaterThan(0);
      LANGS.forEach(lang => expect(figure.title[lang].trim(), lang).not.toBe(""));
    }
    expect(leviticusInteractive.atonement.figure?.src).toBe("/jornada/levitico/hunt-bode-expiatorio.webp");
  });

  it("tem 27 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildLeviticusChapters();
    const leviticus = (await journeyCatalogRepository.getBook("leviticus"))!;
    expect(chapters).toHaveLength(27);
    expect(leviticus.chapters.map(c => c.content.en.title)).toEqual(chapters.map(c => c.content.en.title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = leviticus.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(section, String(chapter.number)).toBeDefined();
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title);
      expect(new Set(titles).size, lang).toBe(27);
      titles.forEach(title => { expect(title.trim()).not.toBe(""); expect(title, lang).not.toMatch(/·\s*\d+$/); });
      expect(new Set(chapters.map(c => c.content[lang].description)).size, lang).toBe(27);
      chapters.forEach(c => expect(c.content[lang].reflectionPrompt.trim()).not.toBe(""));
    }
    LANGS.forEach(lang => expect(leviticus.overview[lang].principles.length, lang).toBe(3));
  });

  it("o português segue a norma brasileira (sem grafias só de Portugal)", () => {
    const pt = [
      ...Object.values(leviticusInteractive).flatMap(s => [
        ...s.stops.flatMap(stop => [stop.text["pt-PT"], stop.title?.["pt-PT"] ?? ""]),
        s.checkpoint.question["pt-PT"], s.checkpoint.explanation["pt-PT"], ...s.checkpoint.options["pt-PT"],
      ]),
      ...buildLeviticusChapters().flatMap(c => [c.content["pt-PT"].title, c.content["pt-PT"].description]),
    ].join(" ");
    expect(pt).not.toMatch(/\b(registo|facto|espias|equipa|ecrã|Génesis|tu |você)\b/i);
  });

  it("formata as referências de Levítico", () => {
    expect(formatBibleRef({ book: "leviticus", chapter: 16, verse: 20, endVerse: 22 }, "pt-PT")).toBe("Lv 16:20–22");
    expect(formatBibleRef({ book: "leviticus", chapter: 19, verse: 18 }, "de")).toBe("3. Mose 19,18");
  });
});
