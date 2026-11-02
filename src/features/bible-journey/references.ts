import type { JourneyLanguage } from "./types";

/** Referência bíblica: capítulo e versículos (opcionalmente até outro capítulo). */
export interface BibleRef { chapter: number; verse?: number; endVerse?: number; endChapter?: number }

const bookAbbrev: Record<JourneyLanguage, string> = { "pt-PT": "Gn", en: "Gen", es: "Gn", fr: "Gn", it: "Gen", de: "1. Mose" };
// pt-PT e en usam dois-pontos; es também (Gn 12:7); fr, it e de usam vírgula (Gn 12,7).
const separator: Record<JourneyLanguage, string> = { "pt-PT": ":", en: ":", es: ":", fr: ",", it: ",", de: "," };

export function formatGenesisRef(ref: BibleRef, language: JourneyLanguage) {
  const sep = separator[language];
  let body = String(ref.chapter);
  if (ref.verse) body += `${sep}${ref.verse}`;
  if (ref.endChapter && ref.endChapter !== ref.chapter) body += `–${ref.endChapter}${ref.endVerse ? `${sep}${ref.endVerse}` : ""}`;
  else if (ref.endVerse && ref.endVerse !== ref.verse) body += `–${ref.endVerse}`;
  return `${bookAbbrev[language]} ${body}`;
}
