import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { basePeople, journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { basePlaces, journeyPlaces } from "@/features/bible-journey/places";
import { MAP_HEIGHT, MAP_WIDTH, projectLonLat } from "@/features/bible-journey/map/projection";
import { joshuaInteractive, joshuaReviewStatus } from "@/features/bible-journey/joshua-interactive";
import { joshuaPlaces } from "@/features/bible-journey/joshua-places";
import { joshuaPeople } from "@/features/bible-journey/joshua-people";
import { buildJoshuaChapters } from "@/features/bible-journey/joshua-content";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const places = { ...journeyPlaces, ...joshuaPlaces };
const people = { ...journeyPeople, ...joshuaPeople };

describe("Jornada interativa: Josué", () => {
  it("está marcado como pendente de revisão humana", () => {
    expect(joshuaReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 4 movimentos com paragens, quiz e textos nos 6 idiomas", async () => {
    const joshua = (await journeyCatalogRepository.getBook("joshua"))!;
    expect(Object.keys(joshuaInteractive).sort()).toEqual(joshua.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(joshuaInteractive)) {
      const range = joshua.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(3);
      expect(section.stops.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      expect(section.figure, slug).toBeUndefined();
      for (const stop of section.stops) {
        if (stop.placeId) expect(places[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(people[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("joshua");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          if (stop.title) expect(stop.title[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      expect(quiz.ref.book).toBe("joshua");
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
      if (section.family) walk(section.family.root);
      expect(section.era.length, slug).toBeGreaterThan(0);
      for (const mark of section.era) {
        expect(mark.year, slug).toBeLessThan(0);
        LANGS.forEach(lang => expect(mark.label[lang].trim()).not.toBe(""));
      }
    }
  });

  it("os lugares novos não repetem o gazetteer e caem dentro do mapa-base", () => {
    for (const [id, place] of Object.entries(joshuaPlaces)) {
      expect(place.id).toBe(id);
      expect(basePlaces[id], `${id} já existe em places.ts`).toBeUndefined();
      expect(place.openBibleId, id).toMatch(/^a[0-9a-f]{6}$/);
      const [x, y] = projectLonLat(place.lon, place.lat);
      expect(x, id).toBeGreaterThanOrEqual(0); expect(x, id).toBeLessThanOrEqual(MAP_WIDTH);
      expect(y, id).toBeGreaterThanOrEqual(0); expect(y, id).toBeLessThanOrEqual(MAP_HEIGHT);
      LANGS.forEach(lang => expect(place.names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("as pessoas novas não repetem journeyPeople e têm nome nos 6 idiomas", () => {
    for (const [id, names] of Object.entries(joshuaPeople)) {
      expect(basePeople[id], `${id} já existe em journeyPeople`).toBeUndefined();
      LANGS.forEach(lang => expect(names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("tem 24 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildJoshuaChapters();
    const joshua = (await journeyCatalogRepository.getBook("joshua"))!;
    expect(chapters).toHaveLength(24);
    expect(joshua.chapters.map(c => c.content.en.title)).toEqual(chapters.map(c => c.content.en.title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = joshua.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(section, String(chapter.number)).toBeDefined();
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title);
      expect(new Set(titles).size, lang).toBe(24);
      titles.forEach(title => { expect(title.trim()).not.toBe(""); expect(title, lang).not.toMatch(/·\s*\d+$/); });
      chapters.forEach(c => {
        expect(c.content[lang].description.trim()).not.toBe("");
        expect(c.content[lang].reflectionPrompt.trim()).not.toBe("");
      });
    }
    LANGS.forEach(lang => expect(joshua.overview[lang].principles.length, lang).toBe(3));
  });

  it("formata as referências de Josué", () => {
    expect(formatBibleRef({ book: "joshua", chapter: 7, verse: 1, endChapter: 8, endVerse: 29 }, "pt-PT")).toBe("Js 7:1–8:29");
    expect(formatBibleRef({ book: "joshua", chapter: 24, verse: 15 }, "it")).toBe("Gs 24,15");
  });
});
