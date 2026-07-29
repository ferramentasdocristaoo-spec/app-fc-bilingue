import { cleanBibleText } from "@/lib/bible-text";

// Versículos clássicos que rodam por dia do ano (numeração de livros da bolls.life).
const VERSES: { book: number; chapter: number; verse: number }[] = [
  { book: 43, chapter: 3, verse: 16 },   // João 3:16
  { book: 19, chapter: 23, verse: 1 },   // Salmos 23:1
  { book: 50, chapter: 4, verse: 13 },   // Filipenses 4:13
  { book: 24, chapter: 29, verse: 11 },  // Jeremias 29:11
  { book: 45, chapter: 8, verse: 28 },   // Romanos 8:28
  { book: 19, chapter: 46, verse: 1 },   // Salmos 46:1
  { book: 23, chapter: 41, verse: 10 },  // Isaías 41:10
  { book: 40, chapter: 6, verse: 33 },   // Mateus 6:33
  { book: 20, chapter: 3, verse: 5 },    // Provérbios 3:5
  { book: 6, chapter: 1, verse: 9 },     // Josué 1:9
  { book: 19, chapter: 119, verse: 105 },// Salmos 119:105
  { book: 46, chapter: 10, verse: 13 },  // 1 Coríntios 10:13
  { book: 48, chapter: 5, verse: 22 },   // Gálatas 5:22
  { book: 58, chapter: 11, verse: 1 },   // Hebreus 11:1
  { book: 59, chapter: 1, verse: 5 },    // Tiago 1:5
  { book: 60, chapter: 5, verse: 7 },    // 1 Pedro 5:7
  { book: 19, chapter: 37, verse: 5 },   // Salmos 37:5
  { book: 23, chapter: 40, verse: 31 },  // Isaías 40:31
  { book: 40, chapter: 11, verse: 28 },  // Mateus 11:28
  { book: 45, chapter: 12, verse: 2 },   // Romanos 12:2
  { book: 49, chapter: 2, verse: 8 },    // Efésios 2:8
  { book: 55, chapter: 1, verse: 7 },    // 2 Timóteo 1:7
  { book: 19, chapter: 121, verse: 2 },  // Salmos 121:2
  { book: 43, chapter: 14, verse: 6 },   // João 14:6
  { book: 25, chapter: 3, verse: 22 },   // Lamentações 3:22
];

const VERSION_BY_LANG: Record<string, string> = {
  pt: "OL",
  en: "KJV",
  es: "RV1960",
  fr: "FRLSG",
  it: "NR06",
  de: "LUT",
};

export interface DailyVerse {
  text: string;
  book: number;
  chapter: number;
  verse: number;
}

export async function fetchDailyVerse(language: string): Promise<DailyVerse | null> {
  const lang = language.toLowerCase().split("-")[0];
  const version = VERSION_BY_LANG[lang] ?? "OL";
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const ref = VERSES[dayOfYear % VERSES.length];

  const cacheKey = `fc-daily-verse:${today.toDateString()}:${version}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
    if (cached?.text) return cached;
  } catch { /* cache inválido é ignorado */ }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(
      `${supabaseUrl}/functions/v1/bible-proxy?version=${version}&bookId=${ref.book}&chapter=${ref.chapter}`,
      { headers: { Authorization: `Bearer ${supabaseKey}` } },
    );
    if (!res.ok) return null;
    const verses = await res.json();
    const found = Array.isArray(verses) ? verses.find((v) => v.verse === ref.verse) : null;
    if (!found?.text) return null;
    const result: DailyVerse = { text: cleanBibleText(found.text), ...ref };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}
