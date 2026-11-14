import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { LanguageFlags } from "@/components/LanguageFlags";
import { APP_LANGUAGES, idiomasLiberados } from "@/i18n/app-languages";
import { MANUAL_LANGUAGE_KEY } from "@/i18n/geo-language";

// Radix Popover mede o gatilho com ResizeObserver, que o jsdom não tem.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}

describe("Bandeiras de idioma no topo", () => {
  beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("pt-PT"); });

  it("mostra as 6 bandeiras em SVG com o nome do idioma, a sigla e a atual marcada", () => {
    render(<LanguageFlags />);
    const group = screen.getByRole("group", { name: "Selecionar idioma" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Português", "English", "Español", "Français", "Italiano", "Deutsch"]);
    expect(buttons.map((b) => b.getAttribute("lang"))).toEqual(["pt-PT", "en", "es", "fr", "it", "de"]);
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
    // SVG próprio (não emoji: o Windows não mostra emoji de bandeira) e sigla legível ao lado.
    expect(group.querySelectorAll("svg")).toHaveLength(6);
    expect(group.textContent).toBe("PTENESFRITDE");
  });

  it("tocar numa bandeira troca o idioma e guarda a escolha igual ao seletor dos Ajustes", async () => {
    render(<LanguageFlags />);
    fireEvent.click(screen.getByRole("button", { name: "Français" }));
    await waitFor(() => expect(i18n.language).toBe("fr"));
    expect(localStorage.getItem(MANUAL_LANGUAGE_KEY)).toBe("fr");
    expect(screen.getByRole("button", { name: "Français" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "false");
    // O rótulo do grupo acompanha o idioma novo.
    expect(screen.getByRole("group", { name: "Sélectionner la langue" })).toBeInTheDocument();
  });

  it("celular: só a bandeira atual no topo; tocar abre a folha com as 6 e escolher uma fecha", async () => {
    render(<LanguageFlags variant="sheet" />);
    const trigger = screen.getByRole("button", { name: "Selecionar idioma · Português" });
    expect(trigger.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Deutsch" })).toBeNull();
    fireEvent.click(trigger);
    const deutsch = await screen.findByRole("button", { name: "Deutsch" });
    expect(within(screen.getByRole("group", { name: "Selecionar idioma" })).getAllByRole("button")).toHaveLength(6);
    fireEvent.click(deutsch);
    await waitFor(() => expect(i18n.language).toBe("de"));
    expect(localStorage.getItem(MANUAL_LANGUAGE_KEY)).toBe("de");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Deutsch" })).toBeNull());
    expect(screen.getByRole("button", { name: "Sprache wählen · Deutsch" })).toBeInTheDocument();
  });

  it("trava futura: hoje idiomasLiberados() devolve os 6 e nenhuma bandeira fica apagada", () => {
    expect(idiomasLiberados()).toEqual(APP_LANGUAGES.map((lang) => lang.code));
    render(<LanguageFlags />);
    expect(document.querySelectorAll(".lang-flag-btn.is-locked")).toHaveLength(0);
    expect(document.querySelectorAll(".lang-flag-btn:disabled")).toHaveLength(0);
  });
});
