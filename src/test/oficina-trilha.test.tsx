import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import OficinaPage from "@/pages/OficinaPage";

describe("Oficina de Sermões (Modelo Trilha Arredondado)", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("pt-PT");
  });

  it("renderiza o cabeçalho com link voltar e as 3 etapas da Trilha", () => {
    render(
      <BrowserRouter>
        <OficinaPage />
      </BrowserRouter>
    );

    // Link de voltar com o título
    expect(screen.getByRole("link", { name: /oficina de sermões/i })).toBeInTheDocument();

    // Faixa das 3 etapas
    const nav = screen.getByRole("navigation", { name: /etapas/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1 preparação/i })).toHaveClass("is-active");
  });

  it("renderiza o formulário com duração em segmentos e botão de montar o esboço", () => {
    render(
      <BrowserRouter>
        <OficinaPage />
      </BrowserRouter>
    );

    // Campos principais
    expect(screen.getByPlaceholderText(/a fé que atravessa o deserto/i)).toBeInTheDocument();
    expect(screen.getByText(/duração \(minutos\)/i)).toBeInTheDocument();

    // Segmentos de tempo
    expect(screen.getByRole("button", { name: "15" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "45" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60" })).toBeInTheDocument();

    // Botão de submeter
    expect(screen.getByRole("button", { name: /montar o esboço/i })).toBeInTheDocument();
  });

  it("traz dados das etapas anteriores quando existirem", () => {
    localStorage.setItem(
      "fc-sermoes",
      JSON.stringify([{ textoBase: "Êxodo 13:17-22", titulo: "A Coluna de Fogo" }])
    );

    render(
      <BrowserRouter>
        <OficinaPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Trazer das outras etapas")).toBeInTheDocument();
    expect(screen.getByText("Êxodo 13:17-22")).toBeInTheDocument();
  });
});
