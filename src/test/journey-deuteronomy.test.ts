import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { basePlaces, journeyPlaces } from "@/features/bible-journey/places";
import { numbersPlaces } from "@/features/bible-journey/numbers-places";
import { joshuaPlaces } from "@/features/bible-journey/joshua-places";
import { MAP_HEIGHT, MAP_WIDTH, projectLonLat } from "@/features/bible-journey/map/projection";
import { deuteronomyInteractive, deuteronomyReviewStatus } from "@/features/bible-journey/deuteronomy-interactive";
import { deuteronomyPlaces } from "@/features/bible-journey/deuteronomy-places";
import { buildDeuteronomyChapters } from "@/features/bible-journey/deuteronomy-content";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const places = { ...journeyPlaces, ...deuteronomyPlaces };
const people = journeyPeople;

describe("Jornada interativa: Deuteronômio", () => {
  it("está marcado como pendente de revisão humana", () => {
    expect(deuteronomyReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 5 movimentos com paradas, quiz e textos nos 6 idiomas", async () => {
    const book = (await journeyCatalogRepository.getBook("deuteronomy"))!;
    expect(Object.keys(deuteronomyInteractive).sort()).toEqual(book.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(deuteronomyInteractive)) {
      const range = book.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(3);
      expect(section.stops.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      for (const stop of section.stops) {
        if (stop.placeId) expect(places[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(people[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("deuteronomy");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          if (stop.title) expect(stop.title[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      expect(quiz.ref.book).toBe("deuteronomy");
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
      const walk = (node: FamilyNode): void => { expect(people[node.person], node.person).toBeDefined(); node.spouses?.forEach(id => expect(people[id], id).toBeDefined()); node.children?.forEach(walk); };
      if (section.family) {
        walk(section.family.root);
        expect(section.family.ref.book).toBe("deuteronomy");
      }
      expect(section.era.length, slug).toBeGreaterThan(0);
      for (const mark of section.era) {
        expect(mark.year, slug).toBeLessThan(0);
        LANGS.forEach(lang => expect(mark.label[lang].trim()).not.toBe(""));
      }
    }
  });

  it("a gravura é de domínio público, existe em public/ e não é a 064 (que representa Deus)", () => {
    const figures = Object.values(deuteronomyInteractive).flatMap(section => section.figure ? [section.figure] : []);
    expect(figures).toHaveLength(1);
    for (const figure of figures) {
      expect(figure.license).toBe("PD");
      expect(figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(figure.sourceUrl).not.toMatch(/_064\.png$/);
      expect(figure.src).toMatch(/^\/jornada\/deuteronomio\/.+\.webp$/);
      expect(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), figure.src).toBe(true);
      expect(figure.width).toBeGreaterThan(0);
      expect(figure.height).toBeGreaterThan(0);
      LANGS.forEach(lang => expect(figure.title[lang].trim()).not.toBe(""));
    }
    expect(deuteronomyInteractive["moses-farewell"].figure).toBeDefined();
  });

  it("os lugares novos não repetem o gazetteer e caem dentro do mapa-base", () => {
    for (const [id, place] of Object.entries(deuteronomyPlaces)) {
      expect(place.id).toBe(id);
      expect({ ...basePlaces, ...numbersPlaces, ...joshuaPlaces }[id], `${id} já existe no gazetteer`).toBeUndefined();
      expect(journeyPlaces[id], `${id} registrado em places.ts`).toEqual(place);
      expect(place.openBibleId, id).toMatch(/^a[0-9a-f]{6}$/);
      const [x, y] = projectLonLat(place.lon, place.lat);
      expect(x, id).toBeGreaterThanOrEqual(0); expect(x, id).toBeLessThanOrEqual(MAP_WIDTH);
      expect(y, id).toBeGreaterThanOrEqual(0); expect(y, id).toBeLessThanOrEqual(MAP_HEIGHT);
      LANGS.forEach(lang => expect(place.names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("tem 34 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildDeuteronomyChapters();
    const book = (await journeyCatalogRepository.getBook("deuteronomy"))!;
    expect(chapters).toHaveLength(34);
    expect(book.chapters.map(c => c.content.en.title)).toEqual(chapters.map(c => c.content.en.title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = book.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(section, String(chapter.number)).toBeDefined();
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title);
      expect(new Set(titles).size, lang).toBe(34);
      titles.forEach(title => { expect(title.trim()).not.toBe(""); expect(title, lang).not.toMatch(/·\s*\d+$/); });
      chapters.forEach(c => {
        expect(c.content[lang].description.trim()).not.toBe("");
        expect(c.content[lang].reflectionPrompt.trim()).not.toBe("");
      });
    }
    LANGS.forEach(lang => expect(book.overview[lang].principles.length, lang).toBe(3));
  });

  it("o português segue a norma brasileira (sem tu/vós na narração nem grafias de Portugal)", () => {
    const texts = [
      ...Object.values(deuteronomyInteractive).flatMap(section => [
        ...section.stops.flatMap(stop => [stop.text["pt-PT"], stop.title?.["pt-PT"] ?? ""]),
        section.checkpoint.question["pt-PT"], section.checkpoint.explanation["pt-PT"], ...section.checkpoint.options["pt-PT"],
      ]),
      ...buildDeuteronomyChapters().flatMap(c => [c.content["pt-PT"].title, c.content["pt-PT"].description, c.content["pt-PT"].reflectionPrompt]),
    ].map(text => text.replace(/«[^»]*»/g, ""));
    for (const text of texts) expect(text, text).not.toMatch(/\b(registo|facto|espias|Deuteronómio|Génesis|connosco|precisas|tens|estás)\b/);
  });

  it("formata as referências de Deuteronômio", () => {
    expect(formatBibleRef({ book: "deuteronomy", chapter: 6, verse: 4, endVerse: 9 }, "pt-PT")).toBe("Dt 6:4–9");
    expect(formatBibleRef({ book: "deuteronomy", chapter: 30, verse: 19 }, "de")).toBe("5. Mose 30,19");
  });
});
