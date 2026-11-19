import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import { FontSizeProvider } from "@/hooks/use-font-size";
import BibliaPage from "@/pages/BibliaPage";
import * as contentApi from "@/lib/content-api";

vi.spyOn(contentApi, "fetchBibleChapter").mockResolvedValue([
  { pk: 1, verse: 1, text: "No princípio criou Deus o céu e a terra." },
  { pk: 2, verse: 2, text: "E a terra era sem forma e vazia." },
  { pk: 3, verse: 3, text: "E disse Deus: Haja luz; e houve luz." },
]);

describe("Bíblia: Estante (66 Livros) e Leitura Direção A", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    await i18n.changeLanguage("pt-PT");
  });

  it("abre diretamente o livro e capítulo recebidos por bookId", async () => {
    render(
      <MemoryRouter initialEntries={["/biblia?bookId=43&chapter=3"]}>
        <FontSizeProvider>
          <BibliaPage />
        </FontSizeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/no princípio criou deus/i)).toBeInTheDocument();
    expect(contentApi.fetchBibleChapter).toHaveBeenCalledWith({
      version: "OL",
      bookId: 43,
      chapter: 3,
    }, expect.anything());
  });

  it("renderiza a estante com os grupos bíblicos e o cartão de continuar", () => {
    render(
      <BrowserRouter>
        <FontSizeProvider>
          <BibliaPage />
        </FontSizeProvider>
      </BrowserRouter>
    );

    // Deve mostrar as abas Estante e Leitura
    expect(screen.getByRole("button", { name: /estante \(66 livros\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^\s*leitura$/i })).toBeInTheDocument();

    // Deve mostrar grupos da estante
    expect(screen.getByText("Pentateuco")).toBeInTheDocument();
    expect(screen.getByText("Evangelhos e Atos")).toBeInTheDocument();

    // Deve ter a busca
    expect(screen.getByPlaceholderText(/procurar na estante/i)).toBeInTheDocument();
  });

  it("alterna para o modo leitor e exibe a barra flutuante ao tocar num versículo", async () => {
    render(
      <BrowserRouter>
        <FontSizeProvider>
          <BibliaPage />
        </FontSizeProvider>
      </BrowserRouter>
    );

    // Clica no botão de leitura
    fireEvent.click(screen.getByRole("button", { name: /^\s*leitura$/i }));

    // Deve carregar o título do capítulo e os versículos
    expect(await screen.findByText(/no princípio criou deus/i)).toBeInTheDocument();

    // Toca no versículo 1
    const v1 = screen.getByText(/no princípio criou deus/i);
    fireEvent.click(v1);

    // A barra flutuante de ações (.a-pop) deve aparecer com Raio-X, Pregar, Guardar e Partilhar
    expect(screen.getByRole("dialog", { name: /ações do versículo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /raio-x/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pregar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /partilhar/i })).toBeInTheDocument();

    // A pílula flutuante embaixo deve estar presente
    expect(screen.getByRole("navigation", { name: /navegação e leitura/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ouvir/i })).toBeInTheDocument();
  });
});
