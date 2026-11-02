import type { JourneyBook, JourneyProgressState, JourneySection } from "@/features/bible-journey/types";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
export const roman = (index: number) => ROMAN[index] ?? String(index + 1);
export const chapterRange = (start: number, end: number) => start === end ? `${start}` : `${start}–${end}`;

export function sectionProgress(state: JourneyProgressState, bookSlug: string, section: JourneySection) {
  const total = section.endChapter - section.startChapter + 1;
  let done = 0;
  for (let chapter = section.startChapter; chapter <= section.endChapter; chapter += 1) {
    if (state.chapters[`${bookSlug}:${chapter}`]?.completed) done += 1;
  }
  return { done, total, percentage: Math.round((done / total) * 100) };
}

/** Movimento a abrir por defeito: o do primeiro capítulo por ler, se já houver progresso; senão o primeiro. */
export function defaultSectionSlug(book: JourneyBook, state: JourneyProgressState) {
  const started = book.chapters.some(chapter => state.chapters[`${book.slug}:${chapter.number}`]?.completed);
  if (!started) return book.sections[0]?.slug;
  const next = book.chapters.find(chapter => !state.chapters[`${book.slug}:${chapter.number}`]?.completed);
  return next?.sectionSlug ?? book.sections[book.sections.length - 1]?.slug;
}
