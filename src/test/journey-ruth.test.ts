import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { basePeople, journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { basePlaces, journeyPlaces } from "@/features/bible-journey/places";
import { MAP_HEIGHT, MAP_WIDTH, projectLonLat } from "@/features/bible-journey/map/projection";
import { ruthInteractive, ruthReviewStatus } from "@/features/bible-journey/ruth-interactive";
import { ruthPlaces } from "@/features/bible-journey/ruth-places";
import { ruthPeople } from "@/features/bible-journey/ruth-people";
import { buildRuthChapters } from "@/features/bible-journey/ruth-content";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const places = { ...journeyPlaces, ...ruthPlaces };
const people = { ...journeyPeople, ...ruthPeople };

describe("Jornada interativa: Rute", () => {
  it("está marcado como pendente de revisão humana", () => {
    expect(ruthReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 4 movimentos com paradas, quiz e textos nos 6 idiomas", async () => {
    const ruth = (await journeyCatalogRepository.getBook("ruth"))!;
    expect(Object.keys(ruthInteractive).sort()).toEqual(ruth.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(ruthInteractive)) {
      const range = ruth.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(2);
      expect(section.stops.length, slug).toBeLessThanOrEqual(5);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      for (const stop of section.stops) {
        if (stop.placeId) expect(places[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(people[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("ruth");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          if (stop.title) expect(stop.title[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      expect(quiz.ref.book).toBe("ruth");
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

  it("a família segue Rt 4:18-22: dez gerações de Perez a Davi", () => {
    const line: string[] = [];
    let node: FamilyNode | undefined = ruthInteractive.restoration.family!.root;
    while (node) { line.push(node.person); node = node.children?.[0]; }
    expect(line).toEqual(["perez", "hezron", "ram", "amminadab", "nahshon", "salmon", "boaz", "obed", "jesse", "david"]);
  });

  it("as gravuras são de domínio público, com fonte no Commons e arquivo em public/", () => {
    const figures = Object.values(ruthInteractive).flatMap(section => section.figure ? [section.figure] : []);
    expect(figures.length).toBe(2);
    for (const figure of figures) {
      expect(figure.license).toBe("PD");
      expect(figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(figure.src).toMatch(/^\/jornada\/rute\/.+\.webp$/);
      expect(existsSync(resolve(process.cwd(), "public" + figure.src)), figure.src).toBe(true);
      expect(figure.width).toBeGreaterThan(0); expect(figure.height).toBeGreaterThan(0);
      LANGS.forEach(lang => expect(figure.title[lang].trim()).not.toBe(""));
    }
  });

  it("os lugares novos não repetem o gazetteer e caem dentro do mapa-base", () => {
    for (const [id, place] of Object.entries(ruthPlaces)) {
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
    for (const [id, names] of Object.entries(ruthPeople)) {
      expect(basePeople[id], `${id} já existe em journeyPeople`).toBeUndefined();
      LANGS.forEach(lang => expect(names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("tem 4 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildRuthChapters();
    const ruth = (await journeyCatalogRepository.getBook("ruth"))!;
    expect(chapters).toHaveLength(4);
    expect(ruth.chapters.map(c => c.content.en.title)).toEqual(chapters.map(c => c.content.en.title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = ruth.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(section, String(chapter.number)).toBeDefined();
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title);
      expect(new Set(titles).size, lang).toBe(4);
      titles.forEach((title, index) => {
        expect(title.trim()).not.toBe("");
        expect(title, lang).not.toMatch(/·\s*\d+$/);
        expect(title, lang).not.toBe(ruth.sections[index].content[lang].title);
      });
      chapters.forEach(c => {
        expect(c.content[lang].description.trim()).not.toBe("");
        expect(c.content[lang].reflectionPrompt.trim()).not.toBe("");
      });
    }
    LANGS.forEach(lang => expect(ruth.overview[lang].principles.length, lang).toBe(3));
  });

  it("formata as referências de Rute", () => {
    expect(formatBibleRef({ book: "ruth", chapter: 1, verse: 16 }, "pt-PT")).toBe("Rt 1:16");
    expect(formatBibleRef({ book: "ruth", chapter: 4, verse: 18, endVerse: 22 }, "de")).toBe("Rut 4,18–22");
  });
});
