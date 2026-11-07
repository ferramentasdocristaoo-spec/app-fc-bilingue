import { beforeEach, describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { getJourneySectionDetails } from "@/features/bible-journey/journey-details";
import { genesisInteractive, journeyPeople } from "@/features/bible-journey/genesis-interactive";
import { journeyMapLabels, journeyPlaces } from "@/features/bible-journey/places";
import { MAP_HEIGHT, MAP_WIDTH, boxesTouch, dotBox, fitViewBox, labelBox, projectLonLat } from "@/features/bible-journey/map/projection";
import { exodusInteractive } from "@/features/bible-journey/exodus-interactive";
import { journeyInteractiveBooks, journeyPublicDomainFigures } from "@/features/bible-journey/interactive";
import { formatBibleRef, formatGenesisRef } from "@/features/bible-journey/references";
import { journeyCheckpointRepository } from "@/features/bible-journey/checkpoints";
import { defaultSectionSlug, sectionProgress } from "@/components/journey/journey-utils";
import type { FamilyNode } from "@/features/bible-journey/genesis-interactive";
import type { JourneyLanguage } from "@/features/bible-journey/types";
import ptPT from "@/i18n/locales/pt-PT/translation.json";
import en from "@/i18n/locales/en/translation.json";
import es from "@/i18n/locales/es/translation.json";
import fr from "@/i18n/locales/fr/translation.json";
import it_ from "@/i18n/locales/it/translation.json";
import de from "@/i18n/locales/de/translation.json";

const LANGS: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];

describe("Jornada interativa: dados de Génesis", () => {
  it("cobre os 6 movimentos de Génesis com paragens, quiz e textos nos 6 idiomas", async () => {
    const genesis = await journeyCatalogRepository.getBook("genesis");
    expect(Object.keys(genesisInteractive).sort()).toEqual(genesis!.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(genesisInteractive)) {
      const range = genesis!.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThan(0);
      for (const stop of section.stops) {
        if (stop.placeId) expect(journeyPlaces[stop.placeId], `${slug}/${stop.id}`).toBeDefined();
        else expect(stop.title, `${slug}/${stop.id} sem lugar precisa de título`).toBeDefined();
        stop.people.forEach(id => expect(journeyPeople[id], id).toBeDefined());
        expect(stop.ref.chapter).toBeGreaterThanOrEqual(range.startChapter);
        expect(stop.ref.chapter).toBeLessThanOrEqual(range.endChapter);
        LANGS.forEach(lang => expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe(""));
      }
      const quiz = section.checkpoint;
      LANGS.forEach(lang => {
        expect(quiz.question[lang].trim()).not.toBe("");
        expect(quiz.options[lang]).toHaveLength(quiz.options["pt-PT"].length);
        expect(quiz.explanation[lang].trim()).not.toBe("");
      });
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThan(quiz.options["pt-PT"].length);
      const walk = (node: FamilyNode): void => { expect(journeyPeople[node.person], node.person).toBeDefined(); node.spouses?.forEach(id => expect(journeyPeople[id]).toBeDefined()); node.children?.forEach(walk); };
      if (section.family) walk(section.family.root);
      if (section.figure) {
        expect(section.figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
        expect(section.figure.src).toMatch(/^\/jornada\/genesis\/.+\.webp$/);
      }
    }
  });

  it("todos os lugares e rótulos caem dentro do mapa-base e têm nome nos 6 idiomas", () => {
    for (const place of [...Object.values(journeyPlaces), ...journeyMapLabels]) {
      const [x, y] = projectLonLat(place.lon, place.lat);
      expect(x, place.id).toBeGreaterThanOrEqual(0); expect(x, place.id).toBeLessThanOrEqual(MAP_WIDTH);
      expect(y, place.id).toBeGreaterThanOrEqual(0); expect(y, place.id).toBeLessThanOrEqual(MAP_HEIGHT);
      LANGS.forEach(lang => expect(place.names[lang].trim(), `${place.id}/${lang}`).not.toBe(""));
    }
  });

  it("o enquadramento do mapa fica dentro dos limites e mantém a proporção", () => {
    const box = fitViewBox([projectLonLat(35.28, 32.21), projectLonLat(35.24, 31.92)], 140);
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(MAP_WIDTH + 0.001);
    expect(box.height / box.width).toBeCloseTo(MAP_HEIGHT / MAP_WIDTH, 5);
    expect(fitViewBox([])).toEqual({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
  });

  it("formata referências na convenção de cada idioma", () => {
    expect(formatGenesisRef({ chapter: 12, verse: 6, endVerse: 7 }, "pt-PT")).toBe("Gn 12:6–7");
    expect(formatGenesisRef({ chapter: 12, verse: 6, endVerse: 7 }, "de")).toBe("1. Mose 12,6–7");
    expect(formatGenesisRef({ chapter: 4, verse: 25, endChapter: 5, endVerse: 32 }, "fr")).toBe("Gn 4,25–5,32");
    expect(formatGenesisRef({ chapter: 29, endChapter: 31 }, "en")).toBe("Gen 29–31");
  });

  it("as chaves novas da jornada existem nos 6 ficheiros de tradução", () => {
    const files = { "pt-PT": ptPT, en, es, fr, it: it_, de } as Record<string, { journey: Record<string, unknown> }>;
    const keys = Object.keys(files["pt-PT"].journey);
    for (const [lang, file] of Object.entries(files)) expect(Object.keys(file.journey).sort(), lang).toEqual([...keys].sort());
  });
});

describe("Jornada interativa: progresso e quiz", () => {
  beforeEach(() => localStorage.clear());

  it("conta o progresso por movimento e abre no movimento do próximo capítulo", async () => {
    const genesis = (await journeyCatalogRepository.getBook("genesis"))!;
    const state = { version: 1 as const, chapters: { "genesis:1": { completed: true }, "genesis:2": { completed: true }, "genesis:3": { completed: true } } };
    expect(sectionProgress(state, "genesis", genesis.sections[0])).toEqual({ done: 2, total: 2, percentage: 100 });
    expect(defaultSectionSlug(genesis, state)).toBe("first-generations");
    expect(defaultSectionSlug(genesis, { version: 1, chapters: {} })).toBe("creation");
  });

  it("guarda, lê e apaga a resposta do ponto de paragem", () => {
    journeyCheckpointRepository.answer("genesis", "patriarchs", 1, true);
    expect(journeyCheckpointRepository.get("genesis", "patriarchs")).toMatchObject({ choice: 1, correct: true });
    journeyCheckpointRepository.reset("genesis", "patriarchs");
    expect(journeyCheckpointRepository.get("genesis", "patriarchs")).toBeUndefined();
  });
});

describe("Lugares por movimento (correção do Ester)", () => {
  it("Ester não herda os lugares do Êxodo", async () => {
    const esther = (await journeyCatalogRepository.getBook("esther"))!;
    for (const lang of LANGS) {
      for (const section of esther.sections) {
        const place = getJourneySectionDetails(esther, section, lang).place;
        expect(place, `${section.slug}/${lang}`).not.toMatch(/Mar Vermelho|Red Sea|Mar Rojo|Mer Rouge|Mar Rosso|Rotes Meer/);
        expect(place).toMatch(/Sus/);
      }
    }
  });

  it("o Êxodo continua com o Mar Vermelho no livramento", async () => {
    const exodus = (await journeyCatalogRepository.getBook("exodus"))!;
    const section = exodus.sections.find(s => s.slug === "deliverance")!;
    expect(getJourneySectionDetails(exodus, section, "pt-PT").place).toBe("Mar Vermelho · Deserto");
  });
});

describe("Jornada interativa: Êxodo", () => {
  it("cobre os 5 movimentos com paragens, quiz e textos nos 6 idiomas", async () => {
    const exodus = (await journeyCatalogRepository.getBook("exodus"))!;
    expect(Object.keys(exodusInteractive).sort()).toEqual(exodus.sections.map(s => s.slug).sort());
    for (const [slug, section] of Object.entries(exodusInteractive)) {
      const range = exodus.sections.find(s => s.slug === slug)!;
      expect(section.stops.length, slug).toBeGreaterThan(0);
      for (const stop of section.stops) {
        if (stop.placeId) expect(journeyPlaces[stop.placeId], stop.id).toBeDefined();
        else expect(stop.title, stop.id).toBeDefined();
        stop.people.forEach(id => expect(journeyPeople[id], id).toBeDefined());
        // Paragens do próprio Êxodo ficam no intervalo do movimento; Números e Deuteronómio são o "para lá do Êxodo".
        if (stop.ref.book === "exodus") {
          expect(stop.ref.chapter, stop.id).toBeGreaterThanOrEqual(range.startChapter);
          expect(stop.ref.endChapter ?? stop.ref.chapter, stop.id).toBeLessThanOrEqual(range.endChapter);
        }
        LANGS.forEach(lang => expect(stop.text[lang].trim(), `${stop.id}/${lang}`).not.toBe(""));
      }
      const quiz = section.checkpoint;
      LANGS.forEach(lang => {
        expect(quiz.question[lang].trim()).not.toBe("");
        expect(quiz.options[lang]).toHaveLength(3);
        expect(quiz.explanation[lang].trim()).not.toBe("");
      });
      expect(quiz.answer).toBeLessThan(3);
      if (section.figure) expect(section.figure.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });

  it("o Tabernáculo tem todas as partes localizadas e traduzidas", () => {
    const { parts } = exodusInteractive.tabernacle.tabernacle!;
    expect(new Set(parts.map(p => p.id)).size).toBe(parts.length);
    for (const part of parts) {
      expect(part.x !== undefined || part.plan !== undefined, part.id).toBe(true);
      if (part.x !== undefined) { expect(part.x).toBeGreaterThan(0); expect(part.x).toBeLessThan(100); expect(part.y).toBeGreaterThan(0); expect(part.y).toBeLessThan(100); }
      expect(part.refs.length, part.id).toBeGreaterThan(0);
      LANGS.forEach(lang => { expect(part.name[lang].trim()).not.toBe(""); expect(part.text[lang].trim()).not.toBe(""); });
    }
    // Êx 26:35: mesa ao norte, candelabro ao sul; com o leste à esquerda, o norte fica em baixo.
    const y = (id: string) => parts.find(p => p.id === id)!.plan!.y;
    expect(y("table")).toBeGreaterThan(y("lampstand"));
  });

  it("formata referências de outros livros e a linha do tempo do Êxodo tem nota própria", () => {
    expect(formatBibleRef({ book: "exodus", chapter: 27, verse: 16 }, "pt-PT")).toBe("Êx 27:16");
    expect(formatBibleRef({ book: "numbers", chapter: 13, verse: 26, endChapter: 14, endVerse: 34 }, "de")).toBe("4. Mose 13,26–14,34");
    expect(journeyInteractiveBooks.exodus.primeval).toBe(false);
    expect(journeyPublicDomainFigures().length).toBeGreaterThanOrEqual(10);
  });
});

describe("Mapa: rótulos", () => {
  it("detecta colisão entre o nome e um ponto vizinho", () => {
    const name = labelBox(100, 100, "Betel", 12, 7, 4);
    expect(boxesTouch(name, dotBox(120, 100, 9))).toBe(true);
    expect(boxesTouch(name, dotBox(100, 140, 9))).toBe(false);
  });
});
