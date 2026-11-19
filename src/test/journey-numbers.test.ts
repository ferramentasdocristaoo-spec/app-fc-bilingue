import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { basePeople, journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { basePlaces, journeyPlaces } from "@/features/bible-journey/places";
import { MAP_HEIGHT, MAP_WIDTH, projectLonLat } from "@/features/bible-journey/map/projection";
import { numbersInteractive, numbersReviewStatus } from "@/features/bible-journey/numbers-interactive";
import { numbersPlaces } from "@/features/bible-journey/numbers-places";
import { numbersPeople } from "@/features/bible-journey/numbers-people";
import { buildNumbersChapters } from "@/features/bible-journey/numbers-content";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const places = { ...journeyPlaces, ...numbersPlaces };
const people = { ...journeyPeople, ...numbersPeople };

describe("Jornada interativa: Números", () => {
  it("continua marcado como pendente de revisão humana", () => {
    expect(numbersReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 5 movimentos com paradas, quiz e textos nos 6 idiomas", async () => {
    const numbers = (await journeyCatalogRepository.getBook("numbers"))!;
    expect(Object.keys(numbersInteractive).sort()).toEqual(numbers.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(numbersInteractive)) {
      const range = numbers.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(3);
      expect(section.stops.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      for (const stop of section.stops) {
        if (stop.placeId) expect(places[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(people[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("numbers");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          if (stop.title) expect(stop.title[lang].trim(), `${stop.id}/título/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      const count = quiz.options["pt-PT"].length;
      expect(count, slug).toBeGreaterThanOrEqual(3);
      expect(count, slug).toBeLessThanOrEqual(4);
      LANGS.forEach(lang => {
        expect(quiz.question[lang].trim(), `${slug}/${lang}`).not.toBe("");
        expect(quiz.options[lang], `${slug}/${lang}`).toHaveLength(count);
        quiz.options[lang].forEach(option => expect(option.trim()).not.toBe(""));
        expect(quiz.explanation[lang].trim(), `${slug}/${lang}`).not.toBe("");
      });
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThan(count);
      expect(quiz.ref.book).toBe("numbers");
      const walk = (node: FamilyNode): void => { expect(people[node.person], node.person).toBeDefined(); node.spouses?.forEach(id => expect(people[id], id).toBeDefined()); node.children?.forEach(walk); };
      if (section.family) walk(section.family.root);
      expect(section.figure, `${slug} não usa imagens`).toBeUndefined();
      section.era.forEach(mark => {
        expect(mark.year, slug).toBeLessThan(0);
        LANGS.forEach(lang => expect(mark.label[lang].trim()).not.toBe(""));
      });
    }
    // A linha do tempo usa o ano como chave: não pode repetir entre movimentos.
    const years = Object.values(numbersInteractive).flatMap(s => s.era.map(m => m.year));
    expect(new Set(years).size).toBe(years.length);
  });

  it("os lugares novos não repetem o gazetteer, caem dentro do mapa-base e têm nome nos 6 idiomas", () => {
    for (const [id, place] of Object.entries(numbersPlaces)) {
      expect(basePlaces[id], `${id} já existe em places.ts`).toBeUndefined();
      expect(place.id).toBe(id);
      expect(place.openBibleId, id).toMatch(/^a[0-9a-f]{6}$/);
      const [x, y] = projectLonLat(place.lon, place.lat);
      expect(x, id).toBeGreaterThanOrEqual(0); expect(x, id).toBeLessThanOrEqual(MAP_WIDTH);
      expect(y, id).toBeGreaterThanOrEqual(0); expect(y, id).toBeLessThanOrEqual(MAP_HEIGHT);
      LANGS.forEach(lang => expect(place.names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("as pessoas novas não repetem journeyPeople e têm nome nos 6 idiomas", () => {
    for (const [id, names] of Object.entries(numbersPeople)) {
      expect(basePeople[id], `${id} já existe em journeyPeople`).toBeUndefined();
      LANGS.forEach(lang => expect(names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("tem 36 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildNumbersChapters();
    expect(chapters).toHaveLength(36);
    const numbers = (await journeyCatalogRepository.getBook("numbers"))!;
    expect(numbers.chapters.map(c => c.content["pt-PT"].title)).toEqual(chapters.map(c => c.content["pt-PT"].title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = numbers.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title.trim());
      expect(new Set(titles).size, lang).toBe(36);
      const sectionTitles = numbers.sections.map(s => s.content[lang].title);
      chapters.forEach(chapter => {
        const { title, description, reflectionPrompt } = chapter.content[lang];
        expect(title, `${chapter.number}/${lang}`).not.toMatch(/·|\d/);
        expect(sectionTitles).not.toContain(title);
        expect(description.trim(), `${chapter.number}/${lang}`).not.toBe("");
        expect(description).not.toBe(title);
        expect(reflectionPrompt.trim()).not.toBe("");
      });
    }
  });
});
