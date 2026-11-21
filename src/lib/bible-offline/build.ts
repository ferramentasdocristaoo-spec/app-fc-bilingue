import { chapterKey, type RawVerse } from "./store";

/**
 * Transforma o JSON da tradução completa do bolls.life (lista de
 * {pk, translation, book, chapter, verse, text}) em capítulos prontos para o IndexedDB.
 *
 * Só os livros 1–66 (os que a Bíblia do app mostra): KJV, WEB e PDV trazem também
 * deuterocanônicos (livros 67–88) e a NR06 tem um versículo com número de livro errado (470).
 */
export type BuiltTranslation = { chapters: Map<string, RawVerse[]>; bytes: number; verses: number };

export function buildTranslation(version: string, rows: unknown): BuiltTranslation {
  if (!Array.isArray(rows)) throw new Error("traducao_invalida");
  const chapters = new Map<string, RawVerse[]>();
  let verses = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const { pk, book, chapter, verse, text } = row as Record<string, unknown>;
    if (typeof book !== "number" || book < 1 || book > 66) continue;
    if (typeof chapter !== "number" || chapter < 1 || typeof verse !== "number" || typeof text !== "string") continue;
    const key = chapterKey(version, book, chapter);
    let list = chapters.get(key);
    if (!list) { list = []; chapters.set(key, list); }
    list.push(typeof pk === "number" ? { pk, verse, text } : { verse, text });
    verses++;
  }
  if (verses === 0) throw new Error("traducao_vazia");
  const encoder = new TextEncoder();
  let bytes = 0;
  chapters.forEach((list) => {
    list.sort((a, b) => a.verse - b.verse);
    bytes += encoder.encode(JSON.stringify(list)).length;
  });
  return { chapters, bytes, verses };
}
