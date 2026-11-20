import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { basePeople, journeyPeople, type FamilyNode } from "@/features/bible-journey/genesis-interactive";
import { basePlaces, journeyPlaces } from "@/features/bible-journey/places";
import { MAP_HEIGHT, MAP_WIDTH, projectLonLat } from "@/features/bible-journey/map/projection";
import { judgesInteractive, judgesReviewStatus } from "@/features/bible-journey/judges-interactive";
import { judgesPlaces } from "@/features/bible-journey/judges-places";
import { judgesPeople } from "@/features/bible-journey/judges-people";
import { buildJudgesChapters } from "@/features/bible-journey/judges-content";
import { formatBibleRef } from "@/features/bible-journey/references";
import type { JourneyLanguage } from "@/features/bible-journey/types";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
const places = { ...journeyPlaces, ...judgesPlaces };
const people = { ...journeyPeople, ...judgesPeople };

describe("Jornada interativa: Juízes", () => {
  it("está marcado como pendente de revisão humana", () => {
    expect(judgesReviewStatus).toBe("pendente-revisao-humana");
  });

  it("cobre os 5 movimentos com paradas, quiz e textos nos 6 idiomas", async () => {
    const judges = (await journeyCatalogRepository.getBook("judges"))!;
    expect(Object.keys(judgesInteractive).sort()).toEqual(judges.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(judgesInteractive)) {
      const range = judges.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThanOrEqual(3);
      expect(section.stops.length, slug).toBeLessThanOrEqual(6);
      expect(new Set(section.stops.map(s => s.id)).size, slug).toBe(section.stops.length);
      for (const stop of section.stops) {
        if (stop.placeId) expect(places[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(people[id], `${stop.id}/${id}`).toBeDefined());
        expect(stop.ref.book, stop.id).toBe("judges");
        expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => {
          expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
          if (stop.title) expect(stop.title[lang].trim(), `${stop.id}/${lang}`).not.toBe("");
        });
      }
      const quiz = section.checkpoint;
      expect(quiz.ref.book).toBe("judges");
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

  it("as gravuras são de domínio público, do Commons, e existem em public/", () => {
    const figures = Object.values(judgesInteractive).flatMap(section => section.figure ? [section.figure] : []);
    expect(figures.length).toBe(3);
    for (const figure of figures) {
      expect(figure.license).toBe("PD");
      expect(figure.artist).toBe("Julius Schnorr von Carolsfeld");
      expect(figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(figure.src).toMatch(/^\/jornada\/juizes\/.+\.webp$/);
      expect(existsSync(resolve(process.cwd(), "public", figure.src.slice(1))), figure.src).toBe(true);
      expect(figure.width).toBe(720);
      expect(figure.height).toBeGreaterThan(0);
      LANGS.forEach(lang => expect(figure.title[lang].trim()).not.toBe(""));
    }
  });

  it("os lugares novos não repetem o gazetteer e caem dentro do mapa-base", () => {
    for (const [id, place] of Object.entries(judgesPlaces)) {
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
    for (const [id, names] of Object.entries(judgesPeople)) {
      expect(basePeople[id], `${id} já existe em journeyPeople`).toBeUndefined();
      LANGS.forEach(lang => expect(names[lang].trim(), `${id}/${lang}`).not.toBe(""));
    }
  });

  it("tem 21 capítulos com títulos próprios, distintos e não genéricos", async () => {
    const chapters = buildJudgesChapters();
    const judges = (await journeyCatalogRepository.getBook("judges"))!;
    expect(chapters).toHaveLength(21);
    expect(judges.chapters.map(c => c.content.en.title)).toEqual(chapters.map(c => c.content.en.title));
    chapters.forEach((chapter, index) => {
      expect(chapter.number).toBe(index + 1);
      const section = judges.sections.find(s => s.slug === chapter.sectionSlug)!;
      expect(section, String(chapter.number)).toBeDefined();
      expect(chapter.number).toBeGreaterThanOrEqual(section.startChapter);
      expect(chapter.number).toBeLessThanOrEqual(section.endChapter);
    });
    for (const lang of LANGS) {
      const titles = chapters.map(c => c.content[lang].title);
      expect(new Set(titles).size, lang).toBe(21);
      titles.forEach(title => { expect(title.trim()).not.toBe(""); expect(title, lang).not.toMatch(/·\s*\d+$/); });
      chapters.forEach(c => {
        expect(c.content[lang].description.trim()).not.toBe("");
        expect(c.content[lang].reflectionPrompt.trim()).not.toBe("");
      });
    }
    LANGS.forEach(lang => expect(judges.overview[lang].principles.length, lang).toBe(3));
  });

  it("o português evita grafias só de Portugal", () => {
    const pt = [
      ...Object.values(judgesInteractive).flatMap(section => [
        ...section.stops.flatMap(stop => [stop.text["pt-PT"], stop.title?.["pt-PT"] ?? ""]),
        section.checkpoint.question["pt-PT"], section.checkpoint.explanation["pt-PT"], ...section.checkpoint.options["pt-PT"],
      ]),
      ...buildJudgesChapters().flatMap(c => [c.content["pt-PT"].title, c.content["pt-PT"].description]),
    ].join(" ");
    expect(pt.match(/\b(registo|facto|espias|ficheiro|equipa|connosco|Génesis|António)\b/g)).toBeNull();
  });

  it("formata as referências de Juízes", () => {
    expect(formatBibleRef({ book: "judges", chapter: 7, verse: 2, endVerse: 7 }, "pt-PT")).toBe("Jz 7:2–7");
    expect(formatBibleRef({ book: "judges", chapter: 21, verse: 25 }, "it")).toBe("Gdc 21,25");
    expect(formatBibleRef({ book: "judges", chapter: 4, verse: 15, endChapter: 5, endVerse: 21 }, "de")).toBe("Ri 4,15–5,21");
  });
});
