import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { Dock } from "@/components/Dock";
import { ThemeProvider } from "@/hooks/use-theme";
import { FontSizeProvider } from "@/hooks/use-font-size";
import { AuthProvider } from "@/hooks/use-auth";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })), signOut: vi.fn() } } }));

const mount = (path = "/") => render(
  <MemoryRouter initialEntries={[path]}>
    <ThemeProvider><FontSizeProvider><AuthProvider><Dock /></AuthProvider></FontSizeProvider></ThemeProvider>
  </MemoryRouter>,
);

describe("Dock (versão web)", () => {
  beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("pt-PT"); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("tem um ícone por ferramenta do menu, mais Ajustes, e marca a página atual", () => {
    mount("/biblia");
    const nav = screen.getByRole("navigation", { name: "Barra de ferramentas" });
    // 13 ferramentas do menu lateral (Início + 3 + 6 + 3); Ajustes é botão.
    const links = nav.querySelectorAll("a.dock-btn");
    expect(links).toHaveLength(13);
    expect(screen.getByRole("link", { name: "Bíblia Sagrada" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Ajustes" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(nav.querySelectorAll('[role="separator"]')).toHaveLength(4);
  });

  it("parando ~300 ms em cima abre o balão com nome, descrição e atalhos que já existem", () => {
    mount("/");
    const biblia = screen.getByRole("link", { name: "Bíblia Sagrada" });
    fireEvent.pointerEnter(biblia, { pointerType: "mouse" });
    expect(screen.queryByRole("group", { name: "Bíblia Sagrada" })).toBeNull();
    act(() => { vi.advanceTimersByTime(HOVER); });
    const card = screen.getByRole("group", { name: "Bíblia Sagrada" });
    expect(card).toHaveTextContent("Lê a Bíblia em diferentes versões");
    expect(screen.getByRole("link", { name: "Antigo Testamento" })).toHaveAttribute("href", "/biblia?bookId=1");
    expect(screen.getByRole("link", { name: "OL - O Livro (Português Europeu)" })).toHaveAttribute("href", "/biblia?version=OL");
    expect(biblia).toHaveAttribute("aria-describedby", card.id);
  });

  it("mostra a passagem em preparação e os últimos esboços guardados no aparelho", () => {
    localStorage.setItem("fc-oficina-atual", JSON.stringify({ textoBase: "João 3:16" }));
    localStorage.setItem("fc-sermoes", JSON.stringify([{ titulo: "A graça" }, { titulo: "" }]));
    mount("/");
    fireEvent.focus(screen.getByRole("link", { name: "Oficina de Sermões" }));
    expect(screen.getByRole("group", { name: "Oficina de Sermões" })).toHaveTextContent("EM PREPARAÇÃO · João 3:16");
    expect(screen.getByRole("link", { name: "Continuar a preparar" })).toHaveAttribute("href", "/oficina");
    // "Os Meus Esboços" também é atalho no balão da Oficina: pega o ícone do Dock.
    fireEvent.focus(document.querySelector('a.dock-btn[aria-label="Os Meus Esboços"]')!);
    const card = screen.getByRole("group", { name: "Os Meus Esboços" });
    expect(card).toHaveTextContent("Sem título");
    expect(card).toHaveTextContent("A graça");
  });

  it("teclado: setas movem o foco, Escape fecha e devolve o foco ao ícone", () => {
    mount("/");
    const inicio = screen.getByRole("link", { name: "Início" });
    act(() => { inicio.focus(); });
    expect(screen.getByRole("group", { name: "Início" })).toBeInTheDocument();
    act(() => { fireEvent.keyDown(inicio, { key: "ArrowRight" }); });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Oficina de Sermões" }));
    act(() => { fireEvent.keyDown(document.activeElement!, { key: "End" }); });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ajustes" }));
    act(() => { fireEvent.keyDown(document.activeElement!, { key: "Escape" }); });
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("Ajustes abre um painel fixo com idioma, tamanho do texto, aparência e sair", () => {
    mount("/");
    fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
    const panel = screen.getByRole("dialog", { name: "Ajustes" });
    expect(panel).toHaveTextContent("Idioma");
    expect(panel).toHaveTextContent("Tamanho do texto");
    expect(panel.textContent).toMatch(/Modo Claro|Modo Escuro/);
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustes" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("as chaves novas do Dock existem nos 7 idiomas", () => {
    for (const lng of ["pt-PT", "pt-BR", "en", "es", "fr", "it", "de"]) {
      for (const key of ["label", "homeDescription", "settings", "settingsDescription", "shortcuts", "appearance", "language", "account", "current", "collections"]) {
        expect(i18n.exists(`dock.${key}`, { lng }), `${lng} dock.${key}`).toBe(true);
      }
    }
  });
});

const HOVER = 300;
