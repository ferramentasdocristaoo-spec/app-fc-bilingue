import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { BottomNav } from "@/components/BottomNav";
import { ThemeProvider } from "@/hooks/use-theme";
import { FontSizeProvider } from "@/hooks/use-font-size";
import { AuthProvider } from "@/hooks/use-auth";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn(), from: vi.fn(), auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe() {} } } })), signOut: vi.fn() } } }));

// Radix (Popover das bandeiras / Aa) mede com ResizeObserver, que o jsdom não tem.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}

const mount = (path = "/") => render(
  <MemoryRouter initialEntries={[path]}>
    <ThemeProvider><FontSizeProvider><AuthProvider><BottomNav /></AuthProvider></FontSizeProvider></ThemeProvider>
  </MemoryRouter>,
);
const openMenu = (name = "Menu") => fireEvent.click(screen.getByRole("button", { name, hidden: true }));
// O vaul mantém a folha no DOM até o fim da animação (que o jsdom não dispara) e, enquanto isso, o resto da página segue aria-hidden:
// fechada = aba Menu (lida com hidden: true) sem aria-expanded e folha com data-state="closed".
const expectClosed = () => waitFor(() => {
  expect(screen.getByRole("button", { name: /Menu|Menü/, hidden: true })).toHaveAttribute("aria-expanded", "false");
  const sheet = document.querySelector(".msheet");
  if (sheet) expect(sheet).toHaveAttribute("data-state", "closed");
});

describe("Menu do celular em cartõezinhos", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("fc-sermon-auth-email", "joao.pereira@exemplo.com");
    await i18n.changeLanguage("pt-PT");
  });

  it("a aba Menu abre uma folha (dialog) com o utilizador, os 3 grupos e 12 cartões com ícone", async () => {
    mount("/biblia");
    const tab = screen.getByRole("button", { name: "Menu" });
    expect(tab).toHaveAttribute("aria-haspopup", "dialog");
    expect(tab).toHaveAttribute("aria-expanded", "false");
    openMenu();
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(tab).toHaveAttribute("aria-expanded", "true");
    // Topo: nome a partir do e-mail, iniciais, idioma · Aa, Sair.
    expect(dialog).toHaveTextContent("Joao Pereira");
    expect(dialog.querySelector(".msheet-avatar")).toHaveTextContent("JP");
    expect(dialog.querySelector(".msheet-meta")).toHaveTextContent("Português (Portugal) · Aa");
    expect(within(dialog).getByRole("button", { name: "Sair" })).toBeInTheDocument();
    // Grupos iguais às etapas da Início.
    for (const name of ["Preparação", "Estudo e biblioteca", "Vida e comunidade"]) {
      expect(within(dialog).getByRole("region", { name })).toBeInTheDocument();
    }
    const cards = dialog.querySelectorAll("a.msheet-card");
    expect(cards).toHaveLength(12);
    // Cada cartão tem um ícone (SVG), não a inicial do nome.
    for (const card of cards) {
      expect(card.querySelector(".msheet-ico svg")).not.toBeNull();
      expect(card.querySelector(".msheet-ico")!.textContent).toBe("");
    }
    expect(within(dialog).getByRole("link", { name: /Bíblia Sagrada/ })).toHaveAttribute("aria-current", "page");
    expect(within(dialog).getByRole("link", { name: "Oficina de Sermões" })).not.toHaveAttribute("aria-current");
    expect(within(dialog).getByRole("link", { name: "Significado de Nomes" })).toHaveAttribute("href", "/nomes");
  });

  it("tem os ajustes compactos no fim: bandeiras, tamanho do texto, aparência e instalar", async () => {
    mount("/");
    openMenu();
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    const settings = within(dialog).getByRole("region", { name: "Ajustes" });
    expect(within(settings).getByRole("group", { name: "Selecionar idioma" }).querySelectorAll("button")).toHaveLength(7);
    expect(within(settings).getByRole("button", { name: "Tamanho do texto" })).toBeInTheDocument();
    expect(within(settings).getByRole("button", { name: /Modo Claro|Modo Escuro/ })).toBeInTheDocument();
    expect(within(settings).getByRole("button", { name: "Instalar" })).toBeInTheDocument();
    expect(settings).toHaveTextContent("joao.pereira@exemplo.com");
  });

  it("fecha no X, com Escape e ao tocar num cartão", async () => {
    mount("/");
    openMenu();
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }));
    await expectClosed();

    openMenu();
    await waitFor(() => expect(screen.getByRole("button", { name: "Menu", hidden: true })).toHaveAttribute("aria-expanded", "true"));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await expectClosed();

    openMenu();
    await waitFor(() => expect(screen.getByRole("button", { name: "Menu", hidden: true })).toHaveAttribute("aria-expanded", "true"));
    fireEvent.click(screen.getByRole("link", { name: "Mural de Oração" }));
    await expectClosed();
  });

  it("os nomes dos cartões não hifenizam nem quebram dentro da palavra", async () => {
    mount("/");
    openMenu();
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    const css = await import("fs").then((fs) => fs.readFileSync("src/components/MenuSheet.css", "utf8"));
    const rule = css.slice(css.indexOf(".msheet-name {"), css.indexOf("}", css.indexOf(".msheet-name {")));
    expect(rule).toMatch(/hyphens:\s*none/);
    expect(rule).toMatch(/overflow-wrap:\s*normal/);
    expect(rule).toMatch(/word-break:\s*normal/);
    expect(dialog.querySelectorAll(".msheet-name")).toHaveLength(12);
  });

  it("rótulos nos 7 idiomas (chaves já existentes)", async () => {
    for (const lng of ["pt-PT", "pt-BR", "en", "es", "fr", "it", "de"]) {
      for (const key of ["dashboard.menu", "workspace.groups.preparation", "workspace.groups.study", "workspace.groups.life", "sidebar.logout", "common.close", "dock.settings", "dock.language", "dock.appearance", "dock.current", "fontSize.label", "dashboard.install"]) {
        expect(i18n.exists(key, { lng }), `${lng} ${key}`).toBe(true);
      }
    }
    await i18n.changeLanguage("de");
    mount("/");
    openMenu("Menü");
    const dialog = await screen.findByRole("dialog", { name: "Menü" });
    expect(within(dialog).getByRole("link", { name: "Predigtwerkstatt" })).toBeInTheDocument();
    expect(within(dialog).getByRole("region", { name: "Vorbereitung" })).toBeInTheDocument();
  });
});
