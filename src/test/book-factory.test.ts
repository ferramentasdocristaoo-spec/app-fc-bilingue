import { describe, expect, it } from "vitest";
import { createJourneyBook, commonUnknownAuthors } from "@/features/bible-journey/book-factory";

describe("Bible Journey book factory", () => {
  it("creates complete localized chapter ranges", () => {
    const same = <T>(value: T) => [value, value, value, value, value, value] as [T, T, T, T, T, T];
    const book = createJourneyBook({ slug: "sample", bibleBookId: 40, chapterCount: 3, position: 40, category: "gospel", names: same("Sample"), descriptions: same("Description"), prompts: same("Prompt"), authors: commonUnknownAuthors, origins: same("Origin"), themes: same(["Theme"]), characters: same(["Character"]), date: "test", stages: [{ slug: "one", start: 1, end: 3, titles: same("Stage") }] });
    expect(book.testament).toBe("new-testament");
    expect(book.chapters).toHaveLength(3);
    expect(book.chapters.every(chapter => Object.keys(chapter.content).length === 6)).toBe(true);
  });
});
