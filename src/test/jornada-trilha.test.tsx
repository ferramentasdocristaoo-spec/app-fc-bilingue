import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import JornadaPage from "@/pages/JornadaPage";

describe("Jornada pela Bíblia (Modelo Trilha Arredondado)", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("pt-PT");
  });

  it("renderiza o cabeçalho, a faixa das 3 etapas e o mapa da Trilha", async () => {
    render(
      <BrowserRouter>
        <JornadaPage />
      </BrowserRouter>
    );

    // Faixa das 3 etapas com a etapa 2 (Estudo e biblioteca) ativa
    const nav = screen.getByRole("navigation", { name: /etapas/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /2 estudo e biblioteca/i })).toHaveClass("is-active");

    // Mapa com os lugares principais
    expect(await screen.findByText("Egito")).toBeInTheDocument();
    expect(await screen.findByText("Mar Vermelho")).toBeInTheDocument();
    expect(await screen.findByText("Sinai")).toBeInTheDocument();

    // Botão de alternar para lista
    expect(screen.getByRole("button", { name: /lista/i })).toBeInTheDocument();
  });

  it("permite alternar entre o modo Trilha e o modo Lista", () => {
    render(
      <BrowserRouter>
        <JornadaPage />
      </BrowserRouter>
    );

    const toggle = screen.getByRole("button", { name: /lista/i });
    fireEvent.click(toggle);

    // Agora deve exibir o botão para voltar para Trilha e o sumário da lista
    expect(screen.getByRole("button", { name: /trilha/i })).toBeInTheDocument();
    expect(screen.getByText(/1\.189/i)).toBeInTheDocument();
  });
});
