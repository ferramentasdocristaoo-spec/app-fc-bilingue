import type { JourneyLanguage } from "./types";

/** Referência bíblica: capítulo e versículos (opcionalmente até outro capítulo). */
export type BibleBookKey = "genesis" | "exodus" | "leviticus" | "numbers" | "deuteronomy";
export interface BibleRef { book?: BibleBookKey; chapter: number; verse?: number; endVerse?: number; endChapter?: number }

const bookAbbrev: Record<BibleBookKey, Record<JourneyLanguage, string>> = {
  genesis: { "pt-PT": "Gn", en: "Gen", es: "Gn", fr: "Gn", it: "Gen", de: "1. Mose" },
  exodus: { "pt-PT": "Êx", en: "Exod", es: "Éx", fr: "Ex", it: "Es", de: "2. Mose" },
  leviticus: { "pt-PT": "Lv", en: "Lev", es: "Lv", fr: "Lv", it: "Lv", de: "3. Mose" },
  numbers: { "pt-PT": "Nm", en: "Num", es: "Nm", fr: "Nb", it: "Nm", de: "4. Mose" },
  deuteronomy: { "pt-PT": "Dt", en: "Deut", es: "Dt", fr: "Dt", it: "Dt", de: "5. Mose" },
};
// pt-PT e en usam dois-pontos; es também (Gn 12:7); fr, it e de usam vírgula (Gn 12,7).
const separator: Record<JourneyLanguage, string> = { "pt-PT": ":", en: ":", es: ":", fr: ",", it: ",", de: "," };

/** Referência na convenção do idioma; sem `book`, Génesis. */
export function formatBibleRef(ref: BibleRef, language: JourneyLanguage) {
  const sep = separator[language];
  let body = String(ref.chapter);
  if (ref.verse) body += `${sep}${ref.verse}`;
  if (ref.endChapter && ref.endChapter !== ref.chapter) body += `–${ref.endChapter}${ref.endVerse ? `${sep}${ref.endVerse}` : ""}`;
  else if (ref.endVerse && ref.endVerse !== ref.verse) body += `–${ref.endVerse}`;
  return `${bookAbbrev[ref.book ?? "genesis"][language]} ${body}`;
}

export const formatGenesisRef = formatBibleRef;
