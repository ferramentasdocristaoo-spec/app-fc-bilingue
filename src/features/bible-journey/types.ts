export type JourneyLanguage = "pt-PT" | "en" | "es" | "fr" | "it" | "de";
export type TestamentSlug = "old-testament" | "new-testament";

export interface JourneyLocalizedText {
  title: string;
  description: string;
}

export interface JourneySection {
  slug: string;
  startChapter: number;
  endChapter: number;
  icon: string;
  content: Record<JourneyLanguage, JourneyLocalizedText>;
}

export interface JourneyChapter {
  number: number;
  sectionSlug: string;
  content: Record<JourneyLanguage, JourneyLocalizedText & { reflectionPrompt: string; editorial?: JourneyChapterEditorial }>;
}

export interface JourneyChapterEditorial {
  keyTheme: string;
  characters: string[];
  places: string[];
  relatedReferences: string[];
  previousConnection: string;
  nextConnection: string;
}

export interface JourneyBookOverview extends JourneyLocalizedText {
  author: string;
  date: string;
  nameOrigin: string;
  context: string;
  themes: string[];
  characters: string[];
  principles: string[];
}

export interface JourneyBook {
  slug: string;
  testament: TestamentSlug;
  category: string;
  bibleBookId: number;
  chapterCount: number;
  position: number;
  coverKey: string;
  overview: Record<JourneyLanguage, JourneyBookOverview>;
  sections: JourneySection[];
  chapters: JourneyChapter[];
}

export interface JourneyChapterProgress {
  completed: boolean;
  lastOpenedAt?: string;
  completedAt?: string;
  note?: string;
}

export interface JourneyProgressState {
  version: 1;
  lastLocation?: { bookSlug: string; chapter: number };
  chapters: Record<string, JourneyChapterProgress>;
}

export interface JourneyRepository {
  listBooks(testament?: TestamentSlug): Promise<JourneyBook[]>;
  getBook(slug: string): Promise<JourneyBook | null>;
}

export interface JourneyProgressRepository {
  getState(): JourneyProgressState;
  openChapter(bookSlug: string, chapter: number): void;
  setCompleted(bookSlug: string, chapter: number, completed: boolean): void;
  saveNote(bookSlug: string, chapter: number, note: string): void;
}
