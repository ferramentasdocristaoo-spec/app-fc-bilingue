import type { JourneyProgressRepository, JourneyProgressState } from "./types";

const STORAGE_KEY = "fc-bible-journey-progress-v1";
const emptyState = (): JourneyProgressState => ({ version: 1, chapters: {} });
const keyFor = (bookSlug: string, chapter: number) => `${bookSlug}:${chapter}`;

function read(): JourneyProgressState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || emptyState(); }
  catch { return emptyState(); }
}

function write(state: JourneyProgressState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

export const journeyProgressRepository: JourneyProgressRepository = {
  getState: read,
  openChapter(bookSlug, chapter) {
    const state = read(); const key = keyFor(bookSlug, chapter);
    state.lastLocation = { bookSlug, chapter };
    state.chapters[key] = { ...state.chapters[key], lastOpenedAt: new Date().toISOString() };
    write(state);
  },
  setCompleted(bookSlug, chapter, completed) {
    const state = read(); const key = keyFor(bookSlug, chapter);
    state.chapters[key] = { ...state.chapters[key], completed, completedAt: completed ? new Date().toISOString() : undefined };
    write(state);
  },
  saveNote(bookSlug, chapter, note) {
    const state = read(); const key = keyFor(bookSlug, chapter);
    state.chapters[key] = { ...state.chapters[key], note };
    write(state);
  },
};

export const journeyProgressForBook = (state: JourneyProgressState, bookSlug: string, chapterCount: number) => {
  const completed = Array.from({ length: chapterCount }, (_, index) => state.chapters[keyFor(bookSlug, index + 1)]?.completed).filter(Boolean).length;
  return { completed, total: chapterCount, percentage: Math.round((completed / chapterCount) * 100) };
};
