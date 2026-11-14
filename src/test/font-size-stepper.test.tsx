import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import "@/i18n";
import i18n from "i18next";
import { FontSizeStepper } from "@/components/FontSizeStepper";
import { FontSizeProvider, useFontSize } from "@/hooks/use-font-size";

/** Mostra a classe que o layout aplica ao conteúdo, para conferir que o A−/A+ muda o app inteiro. */
const Escala = () => <output data-testid="escala">{useFontSize().fontSizeClass}</output>;
const montar = () => render(<FontSizeProvider><FontSizeStepper /><Escala /></FontSizeProvider>);

describe("A− / A+ do cabeçalho", () => {
  beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("pt-PT"); });

  it("tem dois botões com rótulo, o tamanho atual à vista e começa no Médio", () => {
    montar();
    const grupo = screen.getByRole("group", { name: "Tamanho do texto" });
    expect(grupo).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuir o texto" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Aumentar o texto" })).toBeEnabled();
    expect(grupo.querySelector(".font-step-now")).toHaveAttribute("title", "Tamanho atual: Médio");
    expect(screen.getByTestId("escala")).toHaveTextContent("font-scale-medium");
  });

  it("A+ sobe um degrau de cada vez, guarda igual aos Ajustes e desliga no maior", () => {
    montar();
    const mais = screen.getByRole("button", { name: "Aumentar o texto" });
    fireEvent.click(mais);
    expect(localStorage.getItem("fc-font-size")).toBe("large");
    expect(screen.getByTestId("escala")).toHaveTextContent("font-scale-large");
    fireEvent.click(mais);
    expect(localStorage.getItem("fc-font-size")).toBe("xlarge");
    expect(screen.getByRole("group").querySelector(".font-step-now")).toHaveAttribute("title", "Tamanho atual: Muito grande");
    expect(mais).toBeDisabled();
    fireEvent.click(mais); // na ponta não faz nada
    expect(localStorage.getItem("fc-font-size")).toBe("xlarge");
  });

  it("A− desce até ao Pequeno e aí desliga; a escolha guardada é lida ao abrir", () => {
    localStorage.setItem("fc-font-size", "large");
    montar();
    const menos = screen.getByRole("button", { name: "Diminuir o texto" });
    expect(screen.getByTestId("escala")).toHaveTextContent("font-scale-large");
    fireEvent.click(menos);
    fireEvent.click(menos);
    expect(localStorage.getItem("fc-font-size")).toBe("small");
    expect(menos).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aumentar o texto" })).toBeEnabled();
  });

  it("rótulos acompanham o idioma", async () => {
    await i18n.changeLanguage("de");
    montar();
    expect(screen.getByRole("group", { name: "Textgröße" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text vergrößern" })).toBeInTheDocument();
    expect(screen.getByRole("group").querySelector(".font-step-now")).toHaveAttribute("title", "Aktuelle Größe: Mittel");
  });
});
