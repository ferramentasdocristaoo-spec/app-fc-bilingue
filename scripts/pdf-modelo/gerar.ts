/**
 * Prévias do modelo de PDF do sermão: gera os PDFs de exemplo (curto e longo) em cada direção de design e a
 * 1ª página em PNG, com o mesmo código do app (src/lib/pdf/sermon-pdf.ts).
 *   npx vite-node scripts/pdf-modelo/gerar.ts -- <pasta de saída>
 * PNG: precisa do pdftoppm (poppler) instalado.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { gerarSermaoPdf, type RecursosPdf, type DadosPdf } from "../../src/lib/pdf/sermon-pdf";
import { TEMAS_PDF, type TemaPdfId } from "../../src/lib/pdf/pdf-temas";
import { EXEMPLO_CURTO, EXEMPLO_LONGO } from "./exemplos";

const raiz = path.resolve(__dirname, "../..");
const saida = path.resolve(process.argv.filter((a) => a !== "--").slice(2)[0] ?? path.join(raiz, "tmp-pdf-modelo"));
mkdirSync(saida, { recursive: true });

const fs = (p: string) => new Uint8Array(readFileSync(path.join(raiz, "node_modules/@fontsource", p)));
const recursos: RecursosPdf = {
  fontes: {
    texto: fs("source-serif-4/files/source-serif-4-latin-400-normal.woff"),
    textoItalico: fs("source-serif-4/files/source-serif-4-latin-400-italic.woff"),
    textoNegrito: fs("source-serif-4/files/source-serif-4-latin-600-normal.woff"),
    titulo: fs("cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff"),
    tituloItalico: fs("cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff"),
    versalete: fs("cinzel/files/cinzel-latin-500-normal.woff"),
    versaleteNegrito: fs("cinzel/files/cinzel-latin-600-normal.woff"),
  },
  // O app reduz o logo para 320 px antes de pôr no PDF (sermon-pdf-browser.ts); aqui o sips faz o mesmo.
  logo: (() => {
    const tmp = path.join(os.tmpdir(), "fc-logo-pdf-320.png");
    execFileSync("sips", ["-Z", "320", path.join(raiz, "src/assets/logo-pt.png"), "--out", tmp], { stdio: "ignore" });
    return new Uint8Array(readFileSync(tmp));
  })(),
};

const exemplos: [string, DadosPdf][] = [
  ["curto", EXEMPLO_CURTO],
  ["longo", EXEMPLO_LONGO],
];

const main = async () => {
  const feitos: { tema: TemaPdfId; exemplo: string; arquivo: string; png: string; paginas: number; kb: number }[] = [];
  for (const tema of Object.keys(TEMAS_PDF) as TemaPdfId[]) {
    for (const [nome, dados] of exemplos) {
      const bytes = await gerarSermaoPdf(dados, recursos, tema);
      const arquivo = `sermao-${nome}-${tema}.pdf`;
      writeFileSync(path.join(saida, arquivo), bytes);
      const png = `sermao-${nome}-${tema}-p1`;
      execFileSync("pdftoppm", ["-png", "-r", "110", "-f", "1", "-l", "1", "-singlefile", path.join(saida, arquivo), path.join(saida, png)]);
      const paginas = Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [path.join(saida, arquivo)]).toString())?.[1] ?? 0);
      feitos.push({ tema, exemplo: nome, arquivo, png: `${png}.png`, paginas, kb: Math.round(bytes.length / 1024) });
      if (nome === "longo") {
        execFileSync("pdftoppm", ["-png", "-r", "110", "-f", "2", "-l", "2", "-singlefile", path.join(saida, arquivo), path.join(saida, `sermao-${nome}-${tema}-p2`)]);
      }
      console.log(`${arquivo}: ${paginas} pág., ${Math.round(bytes.length / 1024)} KB`);
    }
  }
  console.log(`${feitos.length} PDFs em ${saida}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
