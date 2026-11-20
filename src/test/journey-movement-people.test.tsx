import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { JourneyMovement } from "@/components/journey/JourneyMovement";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";

describe("Jornada: personagens do cabeçalho do movimento", () => {
  beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("pt-PT"); });

  it("em Juízes · Sansão mostra quem aparece nas paradas, não os personagens do livro inteiro", async () => {
    const book = (await journeyCatalogRepository.getBook("judges"))!;
    const section = book.sections.find(item => item.slug === "samson")!;
    render(<MemoryRouter><JourneyMovement book={book} section={section} language="pt-PT" testament="old-testament" /></MemoryRouter>);
    const people = screen.getByText((_, el) => el?.tagName === "DD" && /Sansão/.test(el.textContent ?? "") && /Dalila/.test(el.textContent ?? ""));
    expect(people.textContent).not.toMatch(/Débora|Gideão|Jefté/);
    expect(people.textContent).not.toMatch(/\bDeus\b/);
  });
});
