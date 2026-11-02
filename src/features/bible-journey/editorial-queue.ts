import type { EditorialGenerationResult } from "./editorial-generator";
import type { JourneyBook, JourneyLanguage } from "./types";
import { cleanBibleText } from "@/lib/bible-text";
import { fetchBibleChapter } from "@/lib/content-api";

export type EditorialQueueStatus = "pending" | "generating" | "generated" | "reviewed" | "published" | "failed";

export interface EditorialQueueItem {
  id: string;
  bookSlug: string;
  bookName: string;
  bibleBookId: number;
  chapter: number;
  language: JourneyLanguage;
  sourceVersion: string;
  status: EditorialQueueStatus;
  result?: EditorialGenerationResult;
  error?: string;
  updatedAt: string;
}

export interface EditorialQueueState { version: 1; items: EditorialQueueItem[] }

const STORAGE_KEY = "fc-journey-editorial-queue-v1";
export const JOURNEY_LANGUAGES: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];
export const BIBLE_SOURCE_BY_LANGUAGE: Record<JourneyLanguage, string> = {
  "pt-PT": "OL", en: "KJV", es: "RV1960", fr: "FRLSG", it: "NR06", de: "KJV",
};

const emptyState = (): EditorialQueueState => ({ version: 1, items: [] });
const itemId = (bookSlug: string, chapter: number, language: JourneyLanguage) => `${bookSlug}:${chapter}:${language}`;

export function getEditorialQueueState(): EditorialQueueState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as EditorialQueueState | null;
    return parsed?.version === 1 && Array.isArray(parsed.items) ? parsed : emptyState();
  } catch { return emptyState(); }
}

export function saveEditorialQueueState(state: EditorialQueueState): EditorialQueueState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function enqueueEditorialRange(state: EditorialQueueState, book: JourneyBook, language: JourneyLanguage, start: number, end: number): EditorialQueueState {
  const existing = new Set(state.items.map(item => item.id));
  const additions: EditorialQueueItem[] = [];
  const from = Math.max(1, Math.min(start, end));
  const to = Math.min(book.chapterCount, Math.max(start, end));
  for (let chapter = from; chapter <= to; chapter += 1) {
    const id = itemId(book.slug, chapter, language);
    if (!existing.has(id)) additions.push({
      id, bookSlug: book.slug, bookName: book.overview[language].title, bibleBookId: book.bibleBookId,
      chapter, language, sourceVersion: BIBLE_SOURCE_BY_LANGUAGE[language], status: "pending", updatedAt: new Date().toISOString(),
    });
  }
  return { ...state, items: [...state.items, ...additions] };
}

export function updateEditorialQueueItem(state: EditorialQueueState, id: string, changes: Partial<EditorialQueueItem>): EditorialQueueState {
  return { ...state, items: state.items.map(item => item.id === id ? { ...item, ...changes, id: item.id, updatedAt: new Date().toISOString() } : item) };
}

export function removeEditorialQueueItem(state: EditorialQueueState, id: string): EditorialQueueState {
  return { ...state, items: state.items.filter(item => item.id !== id) };
}

export async function fetchEditorialScripture(item: EditorialQueueItem): Promise<string> {
  let data: Array<{ verse?: number; text?: string }>;
  try {
    data = await fetchBibleChapter({ version: item.sourceVersion, bookId: item.bibleBookId, chapter: item.chapter }) as Array<{ verse?: number; text?: string }>;
  } catch {
    throw new Error("Não foi possível carregar o texto bíblico.");
  }
  const scripture = data.filter(verse => typeof verse.text === "string").map(verse => `${verse.verse ?? ""} ${cleanBibleText(verse.text || "")}`.trim()).join("\n");
  if (!scripture) throw new Error("O capítulo bíblico está vazio.");
  return scripture;
}
