import { describe, expect, it } from "vitest";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";
import { journeyCategoryLabel } from "@/features/bible-journey/category-labels";
import type { JourneyLanguage } from "@/features/bible-journey/types";
import { journeyAuthorAttributions } from "@/features/bible-journey/author-attributions";
import { buildEditorialPrompt, editorialResponseSchema } from "@/features/bible-journey/editorial-generator";

const languages: JourneyLanguage[] = ["pt-PT", "en", "es", "fr", "it", "de"];

describe("complete Bible Journey integrity", () => {
  it("contains the canonical 66-book and 1,189-chapter structure", async () => {
    const books = await journeyCatalogRepository.listBooks();
    expect(books).toHaveLength(66);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(1189);
    expect(books.map(book => book.position)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
    expect(books.map(book => book.bibleBookId)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
    expect(new Set(books.map(book => book.slug)).size).toBe(66);
    expect(books[0].slug).toBe("genesis");
    expect(books[65].slug).toBe("revelation");
  });

  it("covers every chapter exactly once with a narrative stage", async () => {
    const books = await journeyCatalogRepository.listBooks();
    for (const book of books) {
      expect(book.chapters).toHaveLength(book.chapterCount);
      expect(book.chapters.map(chapter => chapter.number)).toEqual(Array.from({ length: book.chapterCount }, (_, index) => index + 1));
      for (const chapter of book.chapters) {
        const matchingSections = book.sections.filter(section => chapter.number >= section.startChapter && chapter.number <= section.endChapter);
        expect(matchingSections).toHaveLength(1);
        expect(chapter.sectionSlug).toBe(matchingSections[0].slug);
      }
    }
  });

  it("has non-empty overview, stages and chapters in all six languages", async () => {
    const books = await journeyCatalogRepository.listBooks();
    for (const book of books) {
      for (const language of languages) {
        const overview = book.overview[language];
        expect(overview.title.trim()).not.toBe("");
        expect(overview.description.trim()).not.toBe("");
        expect(overview.themes.length).toBeGreaterThan(0);
        expect(journeyCategoryLabel(book.category, language)).not.toBe(book.category);
        for (const section of book.sections) expect(section.content[language].title.trim()).not.toBe("");
        for (const chapter of book.chapters) {
          expect(chapter.content[language].title.trim()).not.toBe("");
          expect(chapter.content[language].description.trim()).not.toBe("");
          expect(chapter.content[language].reflectionPrompt.trim()).not.toBe("");
        }
      }
    }
  });

  it("keeps the testament boundary and Bible reader identifiers correct", async () => {
    const books = await journeyCatalogRepository.listBooks();
    expect(books.slice(0, 39).every(book => book.testament === "old-testament")).toBe(true);
    expect(books.slice(39).every(book => book.testament === "new-testament")).toBe(true);
    for (const book of books) {
      const firstChapterUrl = `/biblia?bookId=${book.bibleBookId}&chapter=1`;
      expect(firstChapterUrl).toBe(`/biblia?bookId=${book.position}&chapter=1`);
    }
  });

  it("uses responsible book-specific authorship attributions", async () => {
    const books = await journeyCatalogRepository.listBooks();
    expect(books.find(book => book.slug === "psalms")?.overview["pt-PT"].author).toContain("David");
    expect(books.find(book => book.slug === "matthew")?.overview.en.author).toContain("Matthew");
    expect(books.find(book => book.slug === "hebrews")?.overview.fr.author).toBe("Auteur non identifié");
    expect(books.find(book => book.slug === "revelation")?.overview.de.author).toContain("Patmos");
    expect(Object.keys(journeyAuthorAttributions).length).toBeGreaterThan(35);
  });

  it("defines a grounded editorial generation contract and Genesis pilot", async () => {
    const genesis = await journeyCatalogRepository.getBook("genesis");
    for (const chapterNumber of [1, 2, 3]) {
      const chapter = genesis?.chapters[chapterNumber - 1];
      for (const language of languages) {
        expect(chapter?.content[language].editorial?.keyTheme).toBeTruthy();
        expect(chapter?.content[language].editorial?.relatedReferences.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(editorialResponseSchema.required).toContain("relatedReferences");
    expect(buildEditorialPrompt({ bookName: "Genesis", chapter: 1, language: "en", scriptureText: "In the beginning..." })).toContain("Do not invent");
  });
});
