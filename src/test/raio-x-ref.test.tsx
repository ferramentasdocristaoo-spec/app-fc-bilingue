import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import RaioXPage from "@/pages/RaioXPage";

const callAi = vi.fn(async () => ({
  referencia: "João 3:16", versoes: [{ sigla: "ARA", texto: "Porque Deus amou o mundo" }], palavras_chave: [],
  contexto_historico: "h", contexto_literario: "l", aplicacao: "a",
}));
vi.mock("@/hooks/use-ai", () => ({ useAi: () => ({ callAi, loading: false, failed: false }) }));

describe("Raio-X aberto pela barra do versículo (?ref=)", () => {
  beforeEach(async () => { callAi.mockClear(); await i18n.changeLanguage("pt-BR"); });

  it("preenche a referência e analisa sozinho, uma vez", async () => {
    const Loc = () => <p data-testid="loc">{useLocation().search}</p>;
    render(<StrictMode><MemoryRouter initialEntries={["/raio-x?ref=Jo%C3%A3o%203%3A16"]}><RaioXPage /><Loc /></MemoryRouter></StrictMode>);
    await waitFor(() => expect(callAi).toHaveBeenCalledWith("raio-x", { referencia: "João 3:16" }));
    expect(screen.getByDisplayValue("João 3:16")).toBeInTheDocument();
    expect(await screen.findByText(/Porque Deus amou o mundo/)).toBeInTheDocument();
    expect(callAi).toHaveBeenCalledTimes(1);
    // O ?ref sai da URL: voltar/recarregar não chama a IA de novo.
    expect(screen.getByTestId("loc").textContent).toBe("");
  });

  it("sem ?ref não chama a IA ao abrir", async () => {
    render(<MemoryRouter initialEntries={["/raio-x"]}><RaioXPage /></MemoryRouter>);
    await new Promise((r) => setTimeout(r, 20));
    expect(callAi).not.toHaveBeenCalled();
  });
});
