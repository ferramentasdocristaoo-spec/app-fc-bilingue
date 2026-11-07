import { describe, expect, it } from "vitest";
import { sermonFileName, sermonPrintBody, sermonPrintHtml } from "@/lib/sermon-export";
import { parentPath } from "@/lib/parent-path";

describe("exportação de sermão", () => {
  it("limpa o nome do arquivo sem perder acentos", () => {
    expect(sermonFileName('A fé: "que" atravessa/o deserto?')).toBe("A fé que atravessa o deserto");
    expect(sermonFileName("  ... ")).toBe("sermao");
    expect(sermonFileName("x".repeat(200))).toHaveLength(80);
  });

  it("estrutura rótulos, pontos e parágrafos para impressão", () => {
    const html = sermonPrintBody("INTRODUÇÃO\nUm gancho.\n1. Primeiro ponto\nTexto João 3:16");
    expect(html).toContain("<h2>INTRODUÇÃO</h2>");
    expect(html).toContain("<h3>1. Primeiro ponto</h3>");
    expect(html).toContain("<p>Um gancho.</p>");
  });

  it("escapa o que o usuário digitou", () => {
    const html = sermonPrintHtml("<script>alert(1)</script>", "<b>x</b>", "<img src=x onerror=alert(1)>", "pt-PT");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>x");
  });
});

describe("seta do topo", () => {
  it("volta um nível", () => {
    expect(parentPath("/")).toBeNull();
    expect(parentPath("/oficina")).toBe("/");
    expect(parentPath("/jornada")).toBe("/");
    expect(parentPath("/jornada/fontes")).toBe("/jornada");
    expect(parentPath("/jornada/old-testament/genesis")).toBe("/jornada");
    expect(parentPath("/jornada/old-testament/genesis/capitulos/12")).toBe("/jornada/old-testament/genesis");
    expect(parentPath("/livraria")).toBe("/");
    expect(parentPath("/livraria/kit-do-pregador")).toBe("/livraria");
  });
});
