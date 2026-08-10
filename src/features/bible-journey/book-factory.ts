import type { JourneyBook, JourneyLanguage, JourneySection } from "./types";

export const journeyLanguages: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
export type Localized<T> = Record<JourneyLanguage, T>;
export type LocalizedValues<T> = [T, T, T, T, T, T];

export function journeyLocalized<T>(values: LocalizedValues<T>): Localized<T> {
  return Object.fromEntries(journeyLanguages.map((language, index) => [language, values[index]])) as Localized<T>;
}

export interface JourneyBookStage {
  slug: string;
  start: number;
  end: number;
  titles: LocalizedValues<string>;
  icon?: string;
}

export interface JourneyBookFactoryInput {
  slug: string;
  bibleBookId: number;
  chapterCount: number;
  position: number;
  category: string;
  names: LocalizedValues<string>;
  descriptions: LocalizedValues<string>;
  prompts: LocalizedValues<string>;
  authors: LocalizedValues<string>;
  origins: LocalizedValues<string>;
  themes: LocalizedValues<string[]>;
  characters: LocalizedValues<string[]>;
  date: string;
  stages: JourneyBookStage[];
}

export function createJourneyBook(input: JourneyBookFactoryInput): JourneyBook {
  const names = journeyLocalized(input.names), descriptions = journeyLocalized(input.descriptions), prompts = journeyLocalized(input.prompts);
  const authors = journeyLocalized(input.authors), origins = journeyLocalized(input.origins), themes = journeyLocalized(input.themes), characters = journeyLocalized(input.characters);
  const sections: JourneySection[] = input.stages.map(stage => ({
    slug: stage.slug, startChapter: stage.start, endChapter: stage.end, icon: stage.icon ?? "scroll",
    content: Object.fromEntries(journeyLanguages.map((language, index) => [language, { title: stage.titles[index], description: descriptions[language] }])) as JourneySection["content"],
  }));
  return {
    slug: input.slug, testament: input.bibleBookId <= 39 ? "old-testament" : "new-testament", category: input.category,
    bibleBookId: input.bibleBookId, chapterCount: input.chapterCount, position: input.position, coverKey: input.slug,
    overview: Object.fromEntries(journeyLanguages.map(language => [language, { title: names[language], description: descriptions[language], author: authors[language], date: input.date, nameOrigin: origins[language], context: descriptions[language], themes: themes[language], characters: characters[language], principles: [prompts[language]] }])) as JourneyBook["overview"],
    sections,
    chapters: Array.from({ length: input.chapterCount }, (_, index) => {
      const number = index + 1, section = sections.find(item => number >= item.startChapter && number <= item.endChapter)!;
      return { number, sectionSlug: section.slug, content: Object.fromEntries(journeyLanguages.map(language => [language, { title: `${section.content[language].title} · ${number}`, description: descriptions[language], reflectionPrompt: prompts[language] }])) as JourneyBook["chapters"][number]["content"] };
    }),
  };
}

export const commonUnknownAuthors: LocalizedValues<string> = [
  "Autor não identificado", "Author not identified", "Autor no identificado", "Auteur non identifié", "Autore non identificato", "Autor nicht identifiziert",
];
