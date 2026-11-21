// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { gerarSermaoPdf, limparParaFonte, separarVersiculo, romano, CORPO_PT, MENOR_TEXTO_PT, LARGURA, ALTURA, type DadosPdf, type RecursosPdf } from "@/lib/pdf/sermon-pdf";
import { TEMAS_PDF, contraste, type TemaPdfId } from "@/lib/pdf/pdf-temas";
import { resultadoParaPartes } from "@/lib/sermon-parts";

const raiz = path.resolve(__dirname, "../..");
const fonte = (p: string) => new Uint8Array(readFileSync(path.join(raiz, "node_modules/@fontsource", p)));
const recursos: RecursosPdf = {
  fontes: {
    texto: fonte("source-serif-4/files/source-serif-4-latin-400-normal.woff"),
    textoItalico: fonte("source-serif-4/files/source-serif-4-latin-400-italic.woff"),
    textoNegrito: fonte("source-serif-4/files/source-serif-4-latin-600-normal.woff"),
    titulo: fonte("cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff"),
    tituloItalico: fonte("cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff"),
    versalete: fonte("cinzel/files/cinzel-latin-500-normal.woff"),
    versaleteNegrito: fonte("cinzel/files/cinzel-latin-600-normal.woff"),
  },
  logo: new Uint8Array(readFileSync(path.join(raiz, "public/pwa-icon-192.png"))),
};

const rotulos = { introducao: "Introdução", aplicacao: "Aplicação Prática", conclusao: "Conclusão e Apelo", anotacao: "Anotação", appName: "Ferramentas do Cristão" };
const partes = resultadoParaPartes({
  titulo: "A fé",
  texto_base: "Hebreus 11:1",
  introducao: { gancho: "Todos nós atravessamos desertos.", contextualizacao: "Contexto." },
  pontos: [{ titulo: "A fé enxerga", conteudo: "Confiança.", versiculos: ["Hebreus 11:1"] }],
  aplicacao_pratica: "Aplique.",
  conclusao: "Venha.",
});
partes[1].anotacoes = ["Contar a história da irmã Lurdes 🙏."];
const curto: DadosPdf = { titulo: "A fé que atravessa o deserto 🔥", passagem: "Hebreus 11:1-6", data: "20 de novembro de 2026", idioma: "pt-BR", partes, rotulos };

describe("PDF do sermão (modelo com a marca)", () => {
  it.each(Object.keys(TEMAS_PDF) as TemaPdfId[])("direção %s: gera um PDF A4 válido, com título e idioma", async (tema) => {
    const bytes = await gerarSermaoPdf(curto, recursos, tema);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeCloseTo(LARGURA, 1);
    expect(height).toBeCloseTo(ALTURA, 1);
    expect(doc.getTitle()).toBe("A fé que atravessa o deserto 🔥");
    expect(doc.getAuthor()).toBe("Ferramentas do Cristão");
  }, 30_000);

  it("sermão longo quebra em várias páginas", async () => {
    const longo: DadosPdf = {
      ...curto,
      partes: curto.partes.map((p) => ({ ...p, texto: Array.from({ length: 14 }, () => "Um parágrafo de exemplo com bastante texto para ocupar a linha inteira da folha A4 e testar a quebra de página.").join("\n") })),
    };
    const doc = await PDFDocument.load(await gerarSermaoPdf(longo, recursos, "classica"));
    expect(doc.getPageCount()).toBeGreaterThan(3);
  }, 30_000);

  it("legibilidade FC: corpo ≥ 12 pt e nada abaixo de 10,5 pt (14 px)", () => {
    expect(CORPO_PT).toBeGreaterThanOrEqual(12);
    expect(MENOR_TEXTO_PT).toBeGreaterThanOrEqual(10.5);
  });

  it.each(Object.values(TEMAS_PDF).map((t) => [t.id, t] as const))("contraste 7:1 ou mais nos textos da direção %s", (_id, t) => {
    for (const fundo of [t.papel, t.papelEscuro]) {
      for (const texto of [t.tinta, t.tinta2, t.ouroTinta, t.rubrica]) expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(7);
    }
  });

  it("troca o que a fonte não tem: emoji some, aspas retas viram tipográficas, acentos ficam", () => {
    const temGlifo = (cp: number) => cp < 0x2000 || [0x201c, 0x201d, 0x2018, 0x2019, 0x2014, 0x2013].includes(cp);
    expect(limparParaFonte('Ele disse "não" 🙏 — d\'água', temGlifo)).toBe("Ele disse “não”  — d’água");
    expect(limparParaFonte("Coração", temGlifo)).toBe("Coração");
  });

  it("separa referência e texto do versículo quando vêm juntos", () => {
    expect(separarVersiculo("Hebreus 11:1 — Ora, a fé é o firme fundamento das coisas")).toEqual({ ref: "Hebreus 11:1", texto: "Ora, a fé é o firme fundamento das coisas" });
    expect(separarVersiculo("1 Coríntios 13:4-7")).toEqual({ ref: "1 Coríntios 13:4-7", texto: "" });
    expect(romano(4)).toBe("IV");
  });
});
