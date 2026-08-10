import { beforeEach, describe, expect, it } from "vitest";
import { journeyCatalogRepository, normalizeJourneyLanguage } from "@/features/bible-journey/catalog";
import { journeyProgressForBook, journeyProgressRepository } from "@/features/bible-journey/progress";

describe("Bible Journey architecture", () => {
  beforeEach(() => localStorage.clear());

  it("maps supported and regional languages", () => {
    expect(normalizeJourneyLanguage("pt-BR")).toBe("pt-PT");
    expect(normalizeJourneyLanguage("fr-FR")).toBe("fr");
    expect(normalizeJourneyLanguage("unknown")).toBe("en");
  });

  it("provides a complete Genesis chapter skeleton", async () => {
    const genesis = await journeyCatalogRepository.getBook("genesis");
    expect(genesis?.chapters).toHaveLength(50);
    expect(genesis?.sections[0]).toMatchObject({ startChapter: 1, endChapter: 2 });
    expect(genesis?.chapters[49]).toMatchObject({ number: 50, sectionSlug: "patriarchs" });
  });

  it("provides Exodus as the next complete journey", async () => {
    const exodus = await journeyCatalogRepository.getBook("exodus");
    expect(exodus?.bibleBookId).toBe(2);
    expect(exodus?.chapters).toHaveLength(40);
    expect(exodus?.sections).toHaveLength(5);
    expect(exodus?.chapters[39]).toMatchObject({ number: 40, sectionSlug: "tabernacle" });
  });

  it("provides the complete Leviticus structure", async () => {
    const leviticus = await journeyCatalogRepository.getBook("leviticus");
    expect(leviticus?.bibleBookId).toBe(3);
    expect(leviticus?.chapters).toHaveLength(27);
    expect(leviticus?.sections).toHaveLength(5);
  });

  it("provides the complete Numbers structure", async () => {
    const numbers = await journeyCatalogRepository.getBook("numbers");
    expect(numbers?.bibleBookId).toBe(4);
    expect(numbers?.chapters).toHaveLength(36);
    expect(numbers?.sections).toHaveLength(5);
  });

  it("completes the Pentateuch with Deuteronomy", async () => {
    const books = await journeyCatalogRepository.listBooks("old-testament");
    const deuteronomy = await journeyCatalogRepository.getBook("deuteronomy");
    expect(books.filter(book => book.category === "pentateuch")).toHaveLength(5);
    expect(deuteronomy?.bibleBookId).toBe(5);
    expect(deuteronomy?.chapters).toHaveLength(34);
  });
  it("starts the historical books with Joshua", async () => {
    const joshua = await journeyCatalogRepository.getBook("joshua");
    expect(joshua?.category).toBe("historical");
    expect(joshua?.chapters).toHaveLength(24);
  });
  it("continues the historical journey with Judges", async () => {
    const judges = await journeyCatalogRepository.getBook("judges");
    expect(judges?.bibleBookId).toBe(7);
    expect(judges?.chapters).toHaveLength(21);
    expect(judges?.sections).toHaveLength(5);
  });
  it("adds Ruth as a four-chapter redemption journey", async () => {
    const ruth = await journeyCatalogRepository.getBook("ruth");
    expect(ruth?.bibleBookId).toBe(8);
    expect(ruth?.chapters).toHaveLength(4);
    expect(ruth?.sections).toHaveLength(4);
  });
  it("adds First Samuel and the transition to monarchy", async () => {
    const book = await journeyCatalogRepository.getBook("1-samuel");
    expect(book?.bibleBookId).toBe(9);
    expect(book?.chapters).toHaveLength(31);
    expect(book?.sections).toHaveLength(6);
  });
  it("adds Second Samuel and David's reign", async () => {
    const book = await journeyCatalogRepository.getBook("2-samuel");
    expect(book?.bibleBookId).toBe(10);
    expect(book?.chapters).toHaveLength(24);
    expect(book?.sections).toHaveLength(6);
  });
  it("adds First Kings from Solomon to Elijah", async () => {
    const book = await journeyCatalogRepository.getBook("1-kings");
    expect(book?.bibleBookId).toBe(11);
    expect(book?.chapters).toHaveLength(22);
    expect(book?.sections).toHaveLength(6);
  });
  it("adds Second Kings through exile", async () => {
    const book = await journeyCatalogRepository.getBook("2-kings");
    expect(book?.bibleBookId).toBe(12);
    expect(book?.chapters).toHaveLength(25);
    expect(book?.sections).toHaveLength(6);
  });
  it("adds First Chronicles and David's worship legacy", async () => {
    const book = await journeyCatalogRepository.getBook("1-chronicles");
    expect(book?.bibleBookId).toBe(13);
    expect(book?.chapters).toHaveLength(29);
    expect(book?.sections).toHaveLength(6);
  });
  it("completes the historical books through Esther", async () => {
    const books = await journeyCatalogRepository.listBooks("old-testament");
    expect(books.filter(book => book.category === "historical")).toHaveLength(12);
    expect((await journeyCatalogRepository.getBook("esther"))?.chapters).toHaveLength(10);
  });
  it("adds all five wisdom books with 243 chapters", async () => {
    const books = (await journeyCatalogRepository.listBooks("old-testament")).filter(book => book.category === "wisdom");
    expect(books).toHaveLength(5);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(243);
  });
  it("adds all five major prophets with 183 chapters", async () => {
    const books = (await journeyCatalogRepository.listBooks("old-testament")).filter(book => book.category === "major_prophet");
    expect(books).toHaveLength(5);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(183);
  });
  it("completes the Old Testament with twelve minor prophets", async () => {
    const books = await journeyCatalogRepository.listBooks("old-testament");
    expect(books).toHaveLength(39);
    expect(books.filter(book => book.category === "minor_prophet")).toHaveLength(12);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(929);
  });
  it("adds the four Gospels and Acts with 117 chapters", async () => {
    const books = (await journeyCatalogRepository.listBooks("new-testament")).filter(book => book.category === "gospel" || book.category === "history");
    expect(books).toHaveLength(5);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(117);
  });
  it("adds all thirteen Pauline letters with 87 chapters", async () => {
    const books = (await journeyCatalogRepository.listBooks("new-testament")).filter(book => book.category === "pauline");
    expect(books).toHaveLength(13);
    expect(books.reduce((total, book) => total + book.chapterCount, 0)).toBe(87);
  });
  it("completes the New Testament and the entire Bible", async () => {
    const all = await journeyCatalogRepository.listBooks();
    const nt = await journeyCatalogRepository.listBooks("new-testament");
    expect(nt).toHaveLength(27);
    expect(nt.reduce((total, book) => total + book.chapterCount, 0)).toBe(260);
    expect(all).toHaveLength(66);
    expect(all.reduce((total, book) => total + book.chapterCount, 0)).toBe(1189);
    expect(all.map(book => book.bibleBookId)).toEqual(Array.from({ length: 66 }, (_, index) => index + 1));
  });

  it("persists chapter progress and notes", () => {
    journeyProgressRepository.openChapter("genesis", 1);
    journeyProgressRepository.saveNote("genesis", 1, "Creation note");
    journeyProgressRepository.setCompleted("genesis", 1, true);
    const state = journeyProgressRepository.getState();
    expect(state.lastLocation).toEqual({ bookSlug: "genesis", chapter: 1 });
    expect(state.chapters["genesis:1"]).toMatchObject({ completed: true, note: "Creation note" });
    expect(journeyProgressForBook(state, "genesis", 50)).toMatchObject({ completed: 1, percentage: 2 });
  });
});
