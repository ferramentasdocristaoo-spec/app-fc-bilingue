import { describe, it, expect } from "vitest";
import { linhaDeReferencias, partesParaTexto, resultadoParaPartes, textoParaPartes, MARCA_ANOTACAO } from "@/lib/sermon-parts";
import { esbocoParaTexto, type EsbocoResult } from "@/lib/oficina-store";

const labels = { introduction: "Introdução", application: "Aplicação Prática", conclusion: "Conclusão e Apelo" };
const r: EsbocoResult = {
  titulo: "A fé que atravessa o deserto",
  texto_base: "Hebreus 11:1-6",
  introducao: { gancho: "Todos atravessamos desertos.", contextualizacao: "Hebreus 11 foi escrito para cansados." },
  pontos: [
    { titulo: "A fé enxerga", conteudo: "Confiança no caráter de Deus.", versiculos: ["Hebreus 11:1", "2 Coríntios 5:7"] },
    { titulo: "A fé obedece", conteudo: "Abraão saiu sem saber.", versiculos: [] },
  ],
  aplicacao_pratica: "Escreva o passo de obediência.",
  conclusao: "Venha à frente.",
};

describe("Esboço em partes", () => {
  it("converte o resultado da IA em introdução, tópicos, aplicação e conclusão", () => {
    const partes = resultadoParaPartes(r);
    expect(partes.map((p) => p.tipo)).toEqual(["introducao", "ponto", "ponto", "aplicacao", "conclusao"]);
    expect(partes[0].texto).toBe("Todos atravessamos desertos.\nHebreus 11 foi escrito para cansados.");
    expect(partes[1]).toMatchObject({ titulo: "A fé enxerga", versiculos: ["Hebreus 11:1", "2 Coríntios 5:7"], anotacoes: [] });
  });

  it("o texto corrido sem anotações tem o mesmo conteúdo do formato antigo", () => {
    const novo = partesParaTexto(r.titulo, r.texto_base, resultadoParaPartes(r), labels);
    const antigo = esbocoParaTexto(r, labels);
    const linhas = (s: string) => s.split("\n").filter((l) => l.trim());
    expect(linhas(novo)).toEqual(linhas(antigo));
  });

  it("ida e volta: partes → texto → partes preserva texto, versículos e anotações", () => {
    const partes = resultadoParaPartes(r);
    partes[0].anotacoes = ["Abrir com a história da irmã Lurdes."];
    partes[2].anotacoes = ["Pausa.", "Pedir que a igreja leia junto."];
    const texto = partesParaTexto(r.titulo, r.texto_base, partes, labels);
    expect(texto).toContain(`${MARCA_ANOTACAO} Abrir com a história da irmã Lurdes.`);
    const volta = textoParaPartes(texto, labels, r.titulo, r.texto_base);
    expect(volta.map((p) => ({ tipo: p.tipo, titulo: p.titulo, texto: p.texto, versiculos: p.versiculos, anotacoes: p.anotacoes }))).toEqual(
      partes.map((p) => ({ tipo: p.tipo, titulo: p.titulo, texto: p.texto, versiculos: p.versiculos, anotacoes: p.anotacoes })),
    );
  });

  it("reconhece linhas de referências e não confunde frases com elas", () => {
    expect(linhaDeReferencias("João 3:16, Romanos 5:8")).toEqual(["João 3:16", "Romanos 5:8"]);
    expect(linhaDeReferencias("1 Coríntios 13:4-7")).toEqual(["1 Coríntios 13:4-7"]);
    expect(linhaDeReferencias("Salmo 23")).toEqual(["Salmo 23"]);
    expect(linhaDeReferencias("Deus cuida de nós em 2 momentos")).toBeNull();
  });

  it("texto livre (sem estrutura) vira uma parte só, sem perder parágrafos", () => {
    const partes = textoParaPartes("Primeiro parágrafo.\n\nSegundo parágrafo.", labels);
    expect(partes).toHaveLength(1);
    expect(partes[0]).toMatchObject({ tipo: "secao", titulo: "", texto: "Primeiro parágrafo.\nSegundo parágrafo." });
  });

  it("rótulos em outro idioma também são lidos (pelos rótulos do idioma atual)", () => {
    const en = { introduction: "Introduction", application: "Practical Application", conclusion: "Conclusion and Call" };
    const texto = partesParaTexto("Faith", "Heb 11:1", resultadoParaPartes(r), en);
    expect(textoParaPartes(texto, en, "Faith", "Heb 11:1").map((p) => p.tipo)).toEqual(["introducao", "ponto", "ponto", "aplicacao", "conclusao"]);
  });
});
