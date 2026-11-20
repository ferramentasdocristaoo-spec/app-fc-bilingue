/**
 * PDF do sermão com a marca do app, gerado no próprio aparelho (pdf-lib), com texto de verdade (pesquisável,
 * nítido em qualquer zoom). Funções puras: recebem as fontes e o logo em bytes e devolvem o arquivo. O carregador
 * do navegador fica em sermon-pdf-browser.ts; o script de prévias usa este mesmo arquivo no Node.
 */
import { PDFDocument, LineCapStyle, rgb, type PDFFont, type PDFImage, type PDFPage, type PDFEmbeddedPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Parte } from "@/lib/sermon-parts";
import { TEMAS_PDF, TEMA_PDF_PADRAO, hslParaRgb, type Hsl, type TemaPdf, type TemaPdfId } from "./pdf-temas";

const cor = (h: Hsl): RGB => {
  const [r, g, b] = hslParaRgb(h);
  return rgb(r, g, b);
};

type Bytes = Uint8Array | ArrayBuffer;

export interface FontesPdf {
  texto: Bytes; // Source Serif 4 400
  textoItalico: Bytes; // Source Serif 4 400 itálico
  textoNegrito: Bytes; // Source Serif 4 600
  titulo: Bytes; // Cormorant Garamond 600
  tituloItalico: Bytes; // Cormorant Garamond 500 itálico
  versalete: Bytes; // Cinzel 500
  versaleteNegrito: Bytes; // Cinzel 600
}

export interface RecursosPdf {
  fontes: FontesPdf;
  /** PNG do logo do app (o mesmo de appLogo(idioma)). */
  logo: Bytes;
}

export interface RotulosPdf {
  introducao: string;
  aplicacao: string;
  conclusao: string;
  anotacao: string;
  appName: string;
}

export interface DadosPdf {
  titulo: string;
  passagem: string;
  /** Data já escrita no idioma ("20 de novembro de 2026"). */
  data: string;
  idioma: string;
  partes: Parte[];
  rotulos: RotulosPdf;
}

// A4 em pontos.
export const LARGURA = 595.28;
export const ALTURA = 841.89;
const MX = 68;
const X0 = MX;
const X1 = LARGURA - MX;
const LARG = X1 - X0;
const LIMITE_INFERIOR = 84;

/** Corpo do texto: 12,5 pt (regra FC: ≥ 12 pt no PDF). Nada no arquivo fica abaixo de 10,5 pt (= 14 px). */
export const CORPO_PT = 12.5;
const ENTRELINHA = 19.5;
export const MENOR_TEXTO_PT = 10.5;

type Fontes = Record<keyof FontesPdf, PDFFont>;

const SUBSTITUTOS: Record<string, string> = {
  "\t": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  "′": "'",
  "″": '"',
  "‐": "-",
  "‑": "-",
  "‒": "–",
  "―": "—",
  "−": "-",
  "…": "...",
  [String.fromCodePoint(0x270e)]: "",
};

/** Troca o que a fonte não tem (emoji, símbolos raros) por equivalente ou tira o acento; senão remove. */
export function limparParaFonte(texto: string, temGlifo: (cp: number) => boolean): string {
  let saida = "";
  // Aspas retas viram tipográficas (“ ” ‘ ’), como num livro.
  const tipograficas = texto
    .replace(/(^|[\s([{—–-])"/gu, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s([{—–-])'/gu, "$1‘")
    .replace(/'/g, "’");
  for (const ch of tipograficas.normalize("NFC")) {
    const cp = ch.codePointAt(0) ?? 0;
    if (ch === "\n" || temGlifo(cp)) {
      saida += ch;
      continue;
    }
    const sub = SUBSTITUTOS[ch];
    if (sub !== undefined) {
      saida += [...sub].every((c) => temGlifo(c.codePointAt(0) ?? 0)) ? sub : "";
      continue;
    }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && base !== ch && [...base].every((c) => temGlifo(c.codePointAt(0) ?? 0))) saida += base;
  }
  return saida;
}

function alturaMaiuscula(font: PDFFont): number {
  // fontkit expõe capHeight/unitsPerEm; se faltar, vale a média das serifadas.
  const f = (font as unknown as { embedder?: { font?: { capHeight?: number; unitsPerEm?: number } } }).embedder?.font;
  const r = f?.capHeight && f?.unitsPerEm ? f.capHeight / f.unitsPerEm : 0.65;
  return r > 0.4 && r < 0.9 ? r : 0.65;
}

/** Gerador de números pseudoaleatórios com semente (textura idêntica a cada geração). */
function semente(n: number) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
export const romano = (n: number) => ROMANOS[n - 1] ?? String(n);

/** "João 3:16 — Porque Deus amou…" ou 'João 3:16: "Porque…"' → referência + texto; só referência → texto vazio. */
export function separarVersiculo(v: string): { ref: string; texto: string } {
  const m = /^(.{2,40}?\d{1,3}(?:[:.,]\d{1,3}(?:\s?[-–]\s?\d{1,3})?)?)\s*(?:[—–-]|:)\s*["“«]?(.+?)["”»]?$/u.exec(v.trim());
  if (m && m[2].length > 12) return { ref: m[1].trim(), texto: m[2].trim() };
  return { ref: v.trim(), texto: "" };
}

class Diagramador {
  pages: PDFPage[] = [];
  page!: PDFPage;
  /** Topo da próxima linha (coordenadas do PDF, de baixo para cima). */
  y = 0;
  private glifos = new Map<PDFFont, Set<number>>();
  /** Linhas que ainda correm ao lado da capitular (o parágrafo seguinte continua ao lado dela) e o recuo. */
  private capRestante = 0;
  private capRecuo = 0;

  constructor(
    readonly pdf: PDFDocument,
    readonly f: Fontes,
    readonly t: TemaPdf,
    readonly logo: PDFImage,
    readonly textura: PDFEmbeddedPage | null,
  ) {}

  // ---------- utilidades ----------
  c(h: TemaPdf["tinta"]): RGB {
    return cor(h);
  }

  limpo(texto: string, font: PDFFont): string {
    let set = this.glifos.get(font);
    if (!set) {
      set = new Set(font.getCharacterSet());
      this.glifos.set(font, set);
    }
    const s = set;
    return limparParaFonte(texto, (cp) => s.has(cp));
  }

  largura(texto: string, font: PDFFont, size: number, espaco = 0): number {
    return font.widthOfTextAtSize(texto, size) + espaco * Math.max(0, [...texto].length - 1);
  }

  /** Quebra em linhas; `larguraDaLinha(i)` permite recuo nas primeiras (capitular). */
  quebrar(texto: string, font: PDFFont, size: number, larguraDaLinha: (i: number) => number): string[] {
    return this.quebrarCom(texto, (s) => font.widthOfTextAtSize(s, size), larguraDaLinha);
  }

  quebrarCom(texto: string, medir: (s: string) => number, larguraDaLinha: (i: number) => number): string[] {
    const linhas: string[] = [];
    for (const bloco of texto.split("\n")) {
      const palavras = bloco.split(/\s+/).filter(Boolean);
      let atual = "";
      for (let palavra of palavras) {
        const max = larguraDaLinha(linhas.length);
        const tentativa = atual ? `${atual} ${palavra}` : palavra;
        if (medir(tentativa) <= max) {
          atual = tentativa;
          continue;
        }
        if (atual) {
          linhas.push(atual);
          atual = "";
        }
        // Palavra maior que a linha (link, referência longa): corta por letras.
        while (medir(palavra) > larguraDaLinha(linhas.length)) {
          let n = palavra.length - 1;
          while (n > 1 && medir(palavra.slice(0, n)) > larguraDaLinha(linhas.length)) n--;
          linhas.push(palavra.slice(0, n));
          palavra = palavra.slice(n);
        }
        atual = palavra;
      }
      if (atual) linhas.push(atual);
    }
    return linhas;
  }

  linhaBase(topo: number, entrelinha: number, size: number): number {
    return topo - entrelinha / 2 - size * 0.33;
  }

  espacado(texto: string, x: number, y: number, font: PDFFont, size: number, espaco: number, color: RGB) {
    let cx = x;
    for (const ch of texto) {
      this.page.drawText(ch, { x: cx, y, size, font, color });
      cx += font.widthOfTextAtSize(ch, size) + espaco;
    }
  }

  /**
   * Versalete de verdade com a fonte do texto: minúsculas viram maiúsculas menores (78%). Números ficam no
   * tamanho cheio e com o desenho claro da Source Serif (na Cinzel o "1" parece "I").
   */
  versaleteLargura(texto: string, font: PDFFont, size: number, espaco = 0.4): number {
    let w = 0;
    for (const ch of texto) {
      const up = ch.toLocaleUpperCase();
      const pequeno = up !== ch && up.length === 1;
      w += font.widthOfTextAtSize(pequeno ? up : ch, pequeno ? size * 0.78 : size) + espaco;
    }
    return Math.max(0, w - espaco);
  }

  versalete(texto: string, x: number, y: number, font: PDFFont, size: number, color: RGB, espaco = 0.4) {
    let cx = x;
    for (const ch of texto) {
      const up = ch.toLocaleUpperCase();
      const pequeno = up !== ch && up.length === 1;
      const s = pequeno ? size * 0.78 : size;
      const c = pequeno ? up : ch;
      if (c !== " ") this.page.drawText(c, { x: cx, y, size: s, font, color });
      cx += font.widthOfTextAtSize(c, s) + espaco;
    }
  }

  /** Desenho em coordenadas "de cima para baixo" (SVG), com origem no canto superior esquerdo da página. */
  svg(path: string, opts: { fill?: RGB; stroke?: RGB; width?: number; opacity?: number; page?: PDFPage }) {
    (opts.page ?? this.page).drawSvgPath(path, {
      x: 0,
      y: ALTURA,
      color: opts.fill,
      borderColor: opts.stroke,
      borderWidth: opts.stroke ? opts.width ?? 0.6 : 0,
      opacity: opts.opacity,
      borderOpacity: opts.opacity,
      borderLineCap: LineCapStyle.Round,
    });
  }

  losango(cx: number, cyTopo: number, r: number, opts: { fill?: RGB; stroke?: RGB; width?: number; page?: PDFPage }) {
    this.svg(`M ${cx} ${cyTopo - r} L ${cx + r} ${cyTopo} L ${cx} ${cyTopo + r} L ${cx - r} ${cyTopo} Z`, opts);
  }

  // ---------- página ----------
  novaPagina() {
    this.page = this.pdf.addPage([LARGURA, ALTURA]);
    this.pages.push(this.page);
    this.fundo();
    this.y = this.pages.length === 1 ? ALTURA - 56 : ALTURA - 104;
  }

  precisa(altura: number) {
    if (this.y - altura < LIMITE_INFERIOR) this.novaPagina();
  }

  get noTopo(): boolean {
    return this.pages.length > 1 && this.y >= ALTURA - 104;
  }

  fundo() {
    const p = this.page;
    const t = this.t;
    p.drawRectangle({ x: 0, y: 0, width: LARGURA, height: ALTURA, color: this.c(t.papel) });
    if (this.textura) p.drawPage(this.textura, { x: 0, y: 0, width: LARGURA, height: ALTURA });

    // Marca-d'água: o logo bem suave.
    if (t.marcaDagua === "centro") {
      const w = 330;
      const h = (w * this.logo.height) / this.logo.width;
      p.drawImage(this.logo, { x: (LARGURA - w) / 2, y: (ALTURA - h) / 2 - 24, width: w, height: h, opacity: 0.045 });
    } else {
      const w = 128;
      const h = (w * this.logo.height) / this.logo.width;
      p.drawImage(this.logo, { x: X1 - w + 18, y: 70, width: w, height: h, opacity: 0.045 });
    }
    this.moldura();
  }

  moldura() {
    const t = this.t;
    const ouro = this.c(t.ouro);
    const W = LARGURA;
    const H = ALTURA;
    if (t.moldura === "fio") {
      const i = 28;
      this.svg(`M ${i} ${i} H ${W - i} V ${H - i} H ${i} Z`, { stroke: ouro, width: 0.6 });
      return;
    }
    if (t.moldura === "ornamentada") {
      const o = 20;
      const i = 26;
      const r = 15;
      const k = 0.5523 * r;
      this.svg(`M ${o} ${o} H ${W - o} V ${H - o} H ${o} Z`, { stroke: ouro, width: 1.1 });
      // Fio interno com os cantos recortados em quarto de círculo (estilo livro antigo).
      const d = [
        `M ${i + r} ${i}`,
        `H ${W - i - r}`,
        `C ${W - i - r} ${i + k} ${W - i - k} ${i + r} ${W - i} ${i + r}`,
        `V ${H - i - r}`,
        `C ${W - i - k} ${H - i - r} ${W - i - r} ${H - i - k} ${W - i - r} ${H - i}`,
        `H ${i + r}`,
        `C ${i + r} ${H - i - k} ${i + k} ${H - i - r} ${i} ${H - i - r}`,
        `V ${i + r}`,
        `C ${i + k} ${i + r} ${i + r} ${i + k} ${i + r} ${i}`,
        "Z",
      ].join(" ");
      this.svg(d, { stroke: ouro, width: 0.55 });
      const cantos: [number, number, number, number][] = [
        [i, i, 1, 1],
        [W - i, i, -1, 1],
        [i, H - i, 1, -1],
        [W - i, H - i, -1, -1],
      ];
      for (const [cx, cy, sx, sy] of cantos) {
        this.losango(cx + sx * 4.5, cy + sy * 4.5, 3.4, { fill: ouro });
        // Volutas pequenas saindo do canto, ao longo dos dois lados.
        const volta = (ax: number, ay: number, bx: number, by: number) =>
          `M ${cx + sx * ax} ${cy + sy * ay} C ${cx + sx * (ax + bx * 6)} ${cy + sy * (ay + by * 6)} ${cx + sx * (ax + bx * 11 - by * 4)} ${cy + sy * (ay + by * 11 - bx * 4)} ${cx + sx * (ax + bx * 8 - by * 6)} ${cy + sy * (ay + by * 8 - bx * 6)}`;
        this.svg(volta(r + 2, 0, 1, 0), { stroke: ouro, width: 0.6 });
        this.svg(volta(0, r + 2, 0, 1), { stroke: ouro, width: 0.6 });
        this.svg(`M ${cx + sx * (r + 14)} ${cy - sy * 3} m -1 0 a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0`, { fill: ouro });
      }
      // Losangos no meio das bordas, entre os dois fios.
      for (const [mx, my] of [[W / 2, (o + i) / 2], [W / 2, H - (o + i) / 2], [(o + i) / 2, H / 2], [W - (o + i) / 2, H / 2]] as const) {
        this.losango(mx, my, 3.2, { fill: this.c(t.papel), stroke: ouro, width: 0.6 });
      }
      return;
    }
    // Dupla com cantoneiras (pergaminho).
    const sepia = this.c(t.ouroTinta);
    const o = 20;
    const i = 25;
    this.svg(`M ${o} ${o} H ${W - o} V ${H - o} H ${o} Z`, { stroke: sepia, width: 1.3, opacity: 0.85 });
    this.svg(`M ${i} ${i} H ${W - i} V ${H - i} H ${i} Z`, { stroke: sepia, width: 0.5, opacity: 0.85 });
    for (const [cx, cy] of [[(o + i) / 2, (o + i) / 2], [W - (o + i) / 2, (o + i) / 2], [(o + i) / 2, H - (o + i) / 2], [W - (o + i) / 2, H - (o + i) / 2]] as const) {
      const s = 8;
      this.svg(`M ${cx - s} ${cy - s} H ${cx + s} V ${cy + s} H ${cx - s} Z`, { fill: this.c(t.papelEscuro), stroke: sepia, width: 0.8 });
      this.svg(`M ${cx - 4} ${cy} a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`, { stroke: this.c(t.ouro), width: 0.6 });
      this.svg(`M ${cx - 1.8} ${cy} a 1.8 1.8 0 1 0 3.6 0 a 1.8 1.8 0 1 0 -3.6 0`, { fill: this.c(t.rubrica) });
    }
  }

  // ---------- ornamentos de texto ----------
  /** Divisor ornamental centrado; ocupa `altura` a partir de this.y. */
  divisor(altura = 30, escala = 1, cxIn = LARGURA / 2, yTopo?: number) {
    const t = this.t;
    const ouro = this.c(t.ouro);
    const cx = cxIn;
    const cy = yTopo ?? ALTURA - (this.y - altura / 2); // em coordenadas SVG
    const e = escala;
    if (t.divisor === "fleuron") {
      this.svg(`M ${cx - 92 * e} ${cy} H ${cx - 21 * e} M ${cx + 21 * e} ${cy} H ${cx + 92 * e}`, { stroke: ouro, width: 0.6 });
      this.losango(cx, cy, 3.6 * e, { fill: ouro });
      for (const s of [-1, 1]) this.svg(`M ${cx + s * 22 * e} ${cy} C ${cx + s * 26 * e} ${cy - 6 * e} ${cx + s * 33 * e} ${cy - 5 * e} ${cx + s * 31 * e} ${cy - 1.5 * e}`, { stroke: ouro, width: 0.55 });
      for (const s of [-1, 1]) {
        // Folha de cada lado do losango.
        this.svg(
          `M ${cx + s * 6.5 * e} ${cy} C ${cx + s * 9 * e} ${cy - 3.6 * e} ${cx + s * 14 * e} ${cy - 3 * e} ${cx + s * 20 * e} ${cy} C ${cx + s * 14 * e} ${cy + 3 * e} ${cx + s * 9 * e} ${cy + 3.6 * e} ${cx + s * 6.5 * e} ${cy} Z`,
          { fill: ouro },
        );
        this.svg(`M ${cx + s * 96 * e - 1.3} ${cy} a 1.3 1.3 0 1 0 2.6 0 a 1.3 1.3 0 1 0 -2.6 0`, { fill: ouro });
      }
    } else if (t.divisor === "losango") {
      this.svg(`M ${cx - 70 * e} ${cy} H ${cx - 8 * e} M ${cx + 8 * e} ${cy} H ${cx + 70 * e}`, { stroke: ouro, width: 0.5 });
      this.losango(cx, cy, 4.2 * e, { stroke: ouro, width: 0.7 });
    } else {
      // Ramo: haste curva com folhas alternadas e uma baga vinho no centro.
      this.svg(`M ${cx - 66 * e} ${cy + 1.5 * e} Q ${cx} ${cy - 4 * e} ${cx + 66 * e} ${cy + 1.5 * e}`, { stroke: ouro, width: 0.7 });
      const folha = (x: number, y: number, ang: number) => {
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const p = (u: number, v: number) => `${(x + (u * cs - v * sn) * e).toFixed(2)} ${(y + (u * sn + v * cs) * e).toFixed(2)}`;
        return `M ${p(0, 0)} C ${p(3, -3.6)} ${p(7, -3.6)} ${p(10, 0)} C ${p(7, 3.6)} ${p(3, 3.6)} ${p(0, 0)} Z`;
      };
      for (const s of [-1, 1]) {
        for (let n = 1; n <= 3; n++) {
          const x = cx + s * (12 + n * 15) * e;
          const y = cy - (1.6 - n * 0.6) * e;
          const cima = n % 2 === 1;
          const ang = s > 0 ? (cima ? -0.7 : 0.7) : Math.PI + (cima ? 0.7 : -0.7);
          this.svg(folha(x, y, ang), { fill: ouro });
        }
      }
      this.svg(`M ${cx - 2.6 * e} ${cy - 1.2 * e} a ${2.6 * e} ${2.6 * e} 0 1 0 ${5.2 * e} 0 a ${2.6 * e} ${2.6 * e} 0 1 0 ${-5.2 * e} 0`, { fill: this.c(t.rubrica) });
    }
    if (yTopo === undefined) this.y -= altura;
  }

  // ---------- blocos ----------
  paragrafo(
    texto: string,
    o: { font?: PDFFont; size?: number; entrelinha?: number; color?: RGB; capitular?: boolean; recuo?: number; depois?: number; justificar?: boolean },
  ) {
    const font = o.font ?? this.f.texto;
    const size = o.size ?? CORPO_PT;
    const lead = o.entrelinha ?? ENTRELINHA;
    const color = o.color ?? this.c(this.t.tinta);
    const recuo = o.recuo ?? 0;
    const justificar = o.justificar ?? this.t.justificado;
    let corpo = this.limpo(texto, font).trim();
    if (!corpo) return;

    let letra = "";
    let capW = 0;
    const linhasCap = 3;
    let capSize = 0;
    const capFont = this.f.titulo;
    if (o.capitular) {
      const m = /^(\p{L})(.*)$/su.exec(corpo);
      if (m) {
        letra = this.limpo(m[1].toLocaleUpperCase(), capFont);
        corpo = m[2];
      }
      if (letra) {
        const alturaCaixa = linhasCap * lead - 4;
        if (this.t.capitular === "simples") {
          // Da altura das maiúsculas da 1ª linha até a linha de base da 3ª.
          const alvo = (linhasCap - 1) * lead + size * 0.7;
          capSize = alvo / alturaMaiuscula(capFont);
          capW = capFont.widthOfTextAtSize(letra, capSize) + 8;
        } else {
          capSize = (alturaCaixa * 0.64) / alturaMaiuscula(capFont);
          capW = alturaCaixa + 10;
        }
      }
    }
    if (letra) {
      this.capRestante = linhasCap;
      this.capRecuo = capW;
    }
    const aoLado = this.capRestante;
    const larg = (i: number) => LARG - recuo - (i < aoLado ? this.capRecuo : 0);
    const linhas = this.quebrar(corpo.replace(/^\s+/, ""), font, size, larg);
    if (!linhas.length && !letra) return;

    if (!aoLado || letra) this.precisa(Math.min(linhas.length, letra ? linhasCap : 2) * lead);
    if (letra) this.desenharCapitular(letra, capFont, capSize, capW, lead, size);

    linhas.forEach((linha, i) => {
      // Sem viúva: a penúltima linha desce junto se só ela couber (nunca uma linha sozinha no topo da página).
      const viuva = i > 0 && i === linhas.length - 2 && this.y - 2 * lead < LIMITE_INFERIOR;
      if (i >= aoLado && (this.y - lead < LIMITE_INFERIOR || viuva)) this.novaPagina();
      const x = X0 + recuo + (i < aoLado ? this.capRecuo : 0);
      const base = this.linhaBase(this.y, lead, size);
      const ultima = i === linhas.length - 1;
      const palavras = linha.split(" ");
      const sobra = larg(i) - font.widthOfTextAtSize(linha, size);
      if (justificar && !ultima && palavras.length > 1 && sobra / (palavras.length - 1) < size * 0.9) {
        const extra = sobra / (palavras.length - 1);
        const esp = font.widthOfTextAtSize(" ", size);
        let cx = x;
        for (const p of palavras) {
          this.page.drawText(p, { x: cx, y: base, size, font, color });
          cx += font.widthOfTextAtSize(p, size) + esp + extra;
        }
      } else {
        this.page.drawText(linha, { x, y: base, size, font, color });
      }
      this.y -= lead;
    });
    this.capRestante = Math.max(0, aoLado - linhas.length);
    // Ainda ao lado da capitular: o próximo parágrafo continua na mesma grade, sem o espaço entre parágrafos.
    if (!this.capRestante) this.y -= o.depois ?? 8;
  }

  /** Fim da parte: se o texto acabou antes da capitular, desce até o pé dela. */
  fecharCapitular() {
    if (!this.capRestante) return;
    this.y -= this.capRestante * ENTRELINHA + 8;
    this.capRestante = 0;
  }

  desenharCapitular(letra: string, font: PDFFont, size: number, capW: number, lead: number, corpo: number) {
    const t = this.t;
    const topo = this.y;
    if (t.capitular === "simples") {
      const base = this.linhaBase(topo - 2 * lead, lead, corpo);
      this.page.drawText(letra, { x: X0 - 2, y: base, size, font, color: this.c(t.tinta) });
      return;
    }
    const h = 3 * lead - 4;
    const x = X0;
    const yTopoSvg = ALTURA - topo + 3;
    const caixa = `M ${x} ${yTopoSvg} h ${h} v ${h} h ${-h} Z`;
    const interna = `M ${x + 3} ${yTopoSvg + 3} h ${h - 6} v ${h - 6} h ${-(h - 6)} Z`;
    if (t.capitular === "caixa") {
      this.svg(caixa, { fill: this.c(t.papelEscuro), stroke: this.c(t.ouro), width: 0.9 });
      this.svg(interna, { stroke: this.c(t.ouro), width: 0.35 });
    } else {
      this.svg(caixa, { fill: this.c(t.papelEscuro), stroke: this.c(t.ouroTinta), width: 1 });
      this.svg(interna, { stroke: this.c(t.ouro), width: 0.5 });
      for (const [dx, dy] of [[3, 3], [h - 3, 3], [3, h - 3], [h - 3, h - 3]]) this.losango(x + dx, yTopoSvg + dy, 2.2, { fill: this.c(t.ouro) });
    }
    const w = font.widthOfTextAtSize(letra, size);
    const capH = alturaMaiuscula(font) * size;
    const baseSvg = yTopoSvg + (h + capH) / 2;
    this.page.drawText(letra, { x: x + (h - w) / 2, y: ALTURA - baseSvg, size, font, color: this.c(t.capitular === "caixa" ? t.ouroTinta : t.rubrica) });
    void capW;
  }

  /** Rótulo de seção fixa (Introdução, Aplicação, Conclusão) ou de seção livre. */
  rotulo(texto: string) {
    const t = this.t;
    const font = this.f.versaleteNegrito;
    const size = 12;
    const esp = 1.6;
    const limpo = this.limpo(texto.toLocaleUpperCase(), font);
    const linhas = this.quebrar(limpo, font, size, () => LARG - 60);
    this.precisa(linhas.length * 20 + 3 * ENTRELINHA + 8);
    const color = this.c(t.rubrica);
    for (const linha of linhas) {
      const w = this.largura(linha, font, size, esp);
      const base = this.linhaBase(this.y, 20, size);
      if (t.cabecalho === "editorial") {
        this.espacado(linha, X0, base, font, size, esp, color);
        this.page.drawLine({ start: { x: X0 + w + 12, y: base + 4 }, end: { x: X1, y: base + 4 }, thickness: 0.5, color: this.c(t.ouro) });
      } else {
        const x = (LARGURA - w) / 2;
        this.espacado(linha, x, base, font, size, esp, color);
        const ySvg = ALTURA - base - 4.2;
        this.losango(x - 12, ySvg, 2.4, { fill: this.c(t.ouro) });
        this.losango(x + w + 12, ySvg, 2.4, { fill: this.c(t.ouro) });
      }
      this.y -= 20;
    }
    this.y -= 8;
  }

  /** Título de tópico com a numeração da direção (medalhão, algarismo grande ou rubrica). */
  topico(n: number, titulo: string) {
    const t = this.t;
    const font = this.f.titulo;
    const size = 19;
    const lead = 23;
    const texto = this.limpo(titulo, font);
    let recuo = 38;
    let numW = 0;
    if (t.numeracao === "algarismo") {
      numW = this.f.textoNegrito.widthOfTextAtSize(String(n), 26);
      recuo = numW + 14;
    } else if (t.numeracao === "rubrica") {
      numW = this.f.versaleteNegrito.widthOfTextAtSize(`${romano(n)}.`, 15);
      recuo = numW + 10;
    }
    const linhas = this.quebrar(texto, font, size, () => LARG - recuo);
    this.precisa(Math.max(linhas.length * lead, 34) + 2 * ENTRELINHA + 6);
    const topo = this.y;
    const base1 = this.linhaBase(topo, lead, size);
    if (t.numeracao === "medalhao") {
      const cx = X0 + 14;
      const cy = ALTURA - (base1 + 6);
      const ouro = this.c(t.ouro);
      this.svg(`M ${cx - 14} ${cy} a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0`, { stroke: ouro, width: 0.9, fill: this.c(t.papelEscuro) });
      this.svg(`M ${cx - 11.3} ${cy} a 11.3 11.3 0 1 0 22.6 0 a 11.3 11.3 0 1 0 -22.6 0`, { stroke: ouro, width: 0.35 });
      const r = romano(n);
      const rs = r.length > 2 ? 10.5 : 11.5;
      const w = this.f.versaleteNegrito.widthOfTextAtSize(r, rs);
      this.page.drawText(r, { x: cx - w / 2, y: ALTURA - cy - rs * 0.36, size: rs, font: this.f.versaleteNegrito, color: this.c(t.rubrica) });
    } else if (t.numeracao === "algarismo") {
      this.page.drawText(String(n), { x: X0, y: base1 - 2, size: 26, font: this.f.textoNegrito, color: this.c(t.ouroTinta) });
    } else {
      this.page.drawText(`${romano(n)}.`, { x: X0, y: base1 + 1, size: 15, font: this.f.versaleteNegrito, color: this.c(t.rubrica) });
    }
    for (const linha of linhas) {
      this.page.drawText(linha, { x: X0 + recuo, y: this.linhaBase(this.y, lead, size), size, font, color: this.c(t.tinta) });
      this.y -= lead;
    }
    if (linhas.length === 1 && t.numeracao === "medalhao") this.y -= 4;
    this.y -= 9;
  }

  /** Caixa de versículos: fundo um tom mais escuro do papel, fio lateral dourado, referência em versalete. */
  versiculos(lista: string[]) {
    const itens = lista.map(separarVersiculo).filter((v) => v.ref);
    if (!itens.length) return;
    const t = this.t;
    const pad = 12;
    const padX = 16;
    const largura = LARG - padX * 2 - 4;
    const refFont = this.f.texto;
    const refSize = 12;
    const blocos: { tipo: "ref" | "texto"; linhas: string[] }[] = [];
    const soRefs = itens.filter((i) => !i.texto).map((i) => this.limpo(i.ref, refFont));
    for (const i of itens.filter((v) => v.texto)) {
      blocos.push({ tipo: "texto", linhas: this.quebrar(`“${this.limpo(i.texto, this.f.textoItalico)}”`, this.f.textoItalico, 12, () => largura) });
      blocos.push({ tipo: "ref", linhas: [this.limpo(i.ref, refFont)] });
    }
    if (soRefs.length) blocos.push({ tipo: "ref", linhas: this.quebrarCom(soRefs.join("  ·  "), (s) => this.versaleteLargura(s, refFont, refSize), () => largura) });
    const leadT = 18;
    const leadR = 17;
    const altura = pad * 2 + blocos.reduce((s, b) => s + b.linhas.length * (b.tipo === "texto" ? leadT : leadR) + 2, -2);
    this.precisa(altura + 10);
    const topo = this.y - 2;
    this.page.drawRectangle({ x: X0, y: topo - altura, width: LARG, height: altura, color: this.c(t.papelEscuro) });
    this.page.drawRectangle({ x: X0, y: topo - altura, width: 2.6, height: altura, color: this.c(t.ouro) });
    let y = topo - pad;
    for (const b of blocos) {
      for (const linha of b.linhas) {
        if (b.tipo === "texto") {
          this.page.drawText(linha, { x: X0 + padX + 4, y: this.linhaBase(y, leadT, 12), size: 12, font: this.f.textoItalico, color: this.c(t.tinta) });
          y -= leadT;
        } else {
          this.versalete(linha, X0 + padX + 4, this.linhaBase(y, leadR, refSize), refFont, refSize, this.c(t.ouroTinta));
          y -= leadR;
        }
      }
      y -= 2;
    }
    this.y = topo - altura - 12;
  }

  anotacao(texto: string, rotulo: string) {
    const t = this.t;
    const recuo = 16;
    const font = this.f.textoItalico;
    const corpo = this.limpo(texto, font).trim();
    if (!corpo) return;
    const linhas = this.quebrar(corpo, font, 12, () => LARG - recuo);
    this.precisa(18 + Math.min(linhas.length, 2) * 18);
    const topoBloco = this.y;
    const r = this.limpo(rotulo.toLocaleUpperCase(), this.f.versaleteNegrito);
    this.espacado(r, X0 + recuo, this.linhaBase(this.y, 18, 10.5), this.f.versaleteNegrito, 10.5, 1, this.c(t.rubrica));
    this.y -= 18;
    let inicioFio = topoBloco;
    linhas.forEach((linha) => {
      if (this.y - 18 < LIMITE_INFERIOR) {
        this.fioAnotacao(inicioFio, this.y);
        this.novaPagina();
        inicioFio = this.y;
      }
      this.page.drawText(linha, { x: X0 + recuo, y: this.linhaBase(this.y, 18, 12), size: 12, font, color: this.c(t.tinta) });
      this.y -= 18;
    });
    this.fioAnotacao(inicioFio, this.y);
    this.y -= 8;
  }

  fioAnotacao(de: number, ate: number) {
    this.page.drawLine({ start: { x: X0 + 3, y: de - 3 }, end: { x: X0 + 3, y: ate + 3 }, thickness: 1, color: this.c(this.t.ouro), dashArray: [3, 2.5] });
  }

  // ---------- cabeçalho e rodapé ----------
  cabecalhoPrimeira(d: DadosPdf) {
    const t = this.t;
    const titulo = this.limpo(d.titulo, this.f.titulo);
    const passagem = this.limpo(d.passagem, this.f.textoNegrito);
    const vsF = this.f.textoNegrito;
    const data = this.limpo(d.data, this.f.textoItalico);
    if (t.cabecalho === "editorial") {
      const h = 46;
      const w = (h * this.logo.width) / this.logo.height;
      this.page.drawImage(this.logo, { x: X0, y: this.y - h, width: w, height: h });
      const nome = this.limpo(d.rotulos.appName.toLocaleUpperCase(), this.f.versalete);
      const baseNome = this.y - h / 2 - 4;
      this.espacado(nome, X0 + w + 12, baseNome, this.f.versalete, 11, 1.2, this.c(t.tinta2));
      if (data) {
        const dw = this.f.textoItalico.widthOfTextAtSize(data, 12);
        this.page.drawText(data, { x: X1 - dw, y: baseNome, size: 12, font: this.f.textoItalico, color: this.c(t.tinta2) });
      }
      this.y -= h + 34;
      for (const linha of this.quebrar(titulo, this.f.titulo, 32, () => LARG)) {
        this.page.drawText(linha, { x: X0, y: this.linhaBase(this.y, 36, 32), size: 32, font: this.f.titulo, color: this.c(t.tinta) });
        this.y -= 36;
      }
      if (passagem) {
        this.y -= 4;
        for (const linha of this.quebrarCom(passagem, (s) => this.versaleteLargura(s, vsF, 13.5, 0.8), () => LARG)) {
          this.versalete(linha, X0, this.linhaBase(this.y, 20, 13.5), vsF, 13.5, this.c(t.ouroTinta), 0.8);
          this.y -= 20;
        }
      }
      this.y -= 10;
      this.page.drawLine({ start: { x: X0, y: this.y }, end: { x: X1, y: this.y }, thickness: 0.8, color: this.c(t.ouro) });
      this.page.drawLine({ start: { x: X0, y: this.y - 3 }, end: { x: X1, y: this.y - 3 }, thickness: 0.3, color: this.c(t.ouro) });
      this.y -= 26;
      return;
    }
    const h = 74;
    const w = (h * this.logo.width) / this.logo.height;
    this.page.drawImage(this.logo, { x: (LARGURA - w) / 2, y: this.y - h, width: w, height: h });
    this.y -= h + 18;
    for (const linha of this.quebrar(titulo, this.f.titulo, 30, () => LARG - 40)) {
      const lw = this.f.titulo.widthOfTextAtSize(linha, 30);
      this.page.drawText(linha, { x: (LARGURA - lw) / 2, y: this.linhaBase(this.y, 34, 30), size: 30, font: this.f.titulo, color: this.c(t.tinta) });
      this.y -= 34;
    }
    if (passagem) {
      this.y -= 2;
      for (const linha of this.quebrarCom(passagem, (s) => this.versaleteLargura(s, vsF, 13.5, 0.8), () => LARG - 60)) {
        const lw = this.versaleteLargura(linha, vsF, 13.5, 0.8);
        this.versalete(linha, (LARGURA - lw) / 2, this.linhaBase(this.y, 20, 13.5), vsF, 13.5, this.c(t.rubrica), 0.8);
        this.y -= 20;
      }
    }
    if (data) {
      const dw = this.f.textoItalico.widthOfTextAtSize(data, 12);
      this.page.drawText(data, { x: (LARGURA - dw) / 2, y: this.linhaBase(this.y, 20, 12), size: 12, font: this.f.textoItalico, color: this.c(t.tinta2) });
      this.y -= 20;
    }
    this.y -= 4;
    this.divisor(30, 1.15);
    this.y -= 6;
  }

  cabecalhosEhRodapes(d: DadosPdf) {
    const t = this.t;
    const total = this.pages.length;
    const nome = this.limpo(d.rotulos.appName, this.f.versalete);
    const tituloCurto = this.limpo(d.titulo, this.f.tituloItalico);
    this.pages.forEach((page, i) => {
      this.page = page;
      if (i > 0) {
        const h = 24;
        const w = (h * this.logo.width) / this.logo.height;
        page.drawImage(this.logo, { x: X0, y: ALTURA - 50 - h, width: w, height: h });
        let tt = tituloCurto;
        const max = LARG - w - 14;
        while (tt.length > 3 && this.f.tituloItalico.widthOfTextAtSize(tt, 14) > max) tt = `${tt.slice(0, -2).trimEnd()}…`;
        const tw = this.f.tituloItalico.widthOfTextAtSize(tt, 14);
        page.drawText(tt, { x: X1 - tw, y: ALTURA - 50 - h + 7, size: 14, font: this.f.tituloItalico, color: this.c(t.tinta2) });
        page.drawLine({ start: { x: X0, y: ALTURA - 82 }, end: { x: X1, y: ALTURA - 82 }, thickness: 0.5, color: this.c(t.ouro) });
      }
      // Rodapé: nome do app à esquerda, ornamento no centro, número da página à direita.
      const base = 46;
      this.espacado(nome.toLocaleUpperCase(), X0, base, this.f.versalete, MENOR_TEXTO_PT, 0.8, this.c(t.tinta2));
      const num = total > 1 ? `${i + 1} / ${total}` : `${i + 1}`;
      const nw = this.f.texto.widthOfTextAtSize(num, 11);
      page.drawText(num, { x: X1 - nw, y: base, size: 11, font: this.f.texto, color: this.c(t.tinta2) });
      this.divisor(0, 0.42, LARGURA / 2, ALTURA - base - 3.5);
      page.drawLine({ start: { x: X0, y: base + 16 }, end: { x: X1, y: base + 16 }, thickness: 0.35, color: this.c(t.ouro) });
    });
  }
}

/** Fibras e manchas de pergaminho, desenhadas uma vez e reaproveitadas em todas as páginas. */
async function criarTextura(pdf: PDFDocument, t: TemaPdf): Promise<PDFEmbeddedPage | null> {
  if (t.textura <= 0) return null;
  const aux = await PDFDocument.create();
  const p = aux.addPage([LARGURA, ALTURA]);
  const rnd = semente(1977);
  const sepia = cor(t.ouroTinta);
  const k = t.textura;
  // Vinheta: bordas um pouco mais escuras, em degraus bem finos para não marcar retângulos.
  if (k >= 0.6) {
    for (let i = 0; i < 40; i++) {
      const inset = i * 1.6;
      p.drawRectangle({ x: inset, y: inset, width: LARGURA - inset * 2, height: ALTURA - inset * 2, borderColor: sepia, borderWidth: 1.6, borderOpacity: Math.round(27 * k * (1 - i / 40)) / 1000 });
    }
  }
  for (let i = 0; i < Math.round(650 * k); i++) {
    const s = 0.35 + rnd() * 1.2;
    p.drawEllipse({ x: rnd() * LARGURA, y: rnd() * ALTURA, xScale: s, yScale: s * (0.6 + rnd() * 0.6), color: sepia, opacity: [0.035, 0.05, 0.065][Math.floor(rnd() * 3)] });
  }
  for (let i = 0; i < Math.round(180 * k); i++) {
    const x = rnd() * LARGURA;
    const y = rnd() * ALTURA;
    const len = 6 + rnd() * 22;
    const ang = (rnd() - 0.5) * 0.9;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    p.drawSvgPath(`M ${x} ${ALTURA - y} Q ${(x + x2) / 2 + (rnd() - 0.5) * 6} ${ALTURA - (y + y2) / 2 + (rnd() - 0.5) * 6} ${x2} ${ALTURA - y2}`, {
      x: 0,
      y: ALTURA,
      borderColor: sepia,
      borderWidth: 0.3,
      borderOpacity: 0.06,
    });
  }
  // Manchas grandes de borda difusa (várias elipses concêntricas quase transparentes), só no pergaminho.
  if (k >= 0.6) {
    for (let i = 0; i < 7; i++) {
      const s = 50 + rnd() * 80;
      const x = rnd() * LARGURA;
      const y = rnd() * ALTURA;
      const ry = 0.55 + rnd() * 0.4;
      for (let j = 0; j < 10; j++) {
        const f = 1 - j / 10;
        p.drawEllipse({ x, y, xScale: s * f, yScale: s * ry * f, color: sepia, opacity: 0.0028 * k });
      }
    }
  }
  return pdf.embedPage(p);
}

export async function gerarSermaoPdf(d: DadosPdf, recursos: RecursosPdf, temaId: TemaPdfId = TEMA_PDF_PADRAO): Promise<Uint8Array> {
  const t = TEMAS_PDF[temaId] ?? TEMAS_PDF[TEMA_PDF_PADRAO];
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const embed = (b: Bytes) => pdf.embedFont(b, { subset: true });
  const fr = recursos.fontes;
  const [texto, textoItalico, textoNegrito, titulo, tituloItalico, versalete, versaleteNegrito] = await Promise.all([
    embed(fr.texto),
    embed(fr.textoItalico),
    embed(fr.textoNegrito),
    embed(fr.titulo),
    embed(fr.tituloItalico),
    embed(fr.versalete),
    embed(fr.versaleteNegrito),
  ]);
  const logo = await pdf.embedPng(recursos.logo);
  const textura = await criarTextura(pdf, t);
  const g = new Diagramador(pdf, { texto, textoItalico, textoNegrito, titulo, tituloItalico, versalete, versaleteNegrito }, t, logo, textura);

  g.novaPagina();
  g.cabecalhoPrimeira(d);

  const rot = d.rotulos;
  let n = 0;
  let primeiraIntro = true;
  d.partes.forEach((p, idx) => {
    const temConteudo = p.texto.trim() || p.versiculos.length || p.anotacoes.some((a) => a.trim()) || p.titulo.trim();
    if (!temConteudo) return;
    if (idx > 0) {
      // Divisor só se couber junto com o começo da parte; no topo de página nova, dispensa.
      if (g.y - (30 + 88) < LIMITE_INFERIOR) g.novaPagina();
      if (!g.noTopo) g.divisor(30);
    }
    if (p.tipo === "ponto") {
      n += 1;
      g.topico(n, p.titulo);
    } else {
      const r = p.tipo === "introducao" ? rot.introducao : p.tipo === "aplicacao" ? rot.aplicacao : p.tipo === "conclusao" ? rot.conclusao : p.titulo;
      if (r.trim()) g.rotulo(r);
    }
    const paragrafos = p.texto.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    paragrafos.forEach((par, i) => {
      const capitular = (p.tipo === "introducao" || (p.tipo === "secao" && idx === 0)) && i === 0 && primeiraIntro;
      if (capitular) primeiraIntro = false;
      g.paragrafo(par, { capitular });
    });
    g.fecharCapitular();
    g.versiculos(p.versiculos);
    for (const a of p.anotacoes) g.anotacao(a, rot.anotacao);
  });

  g.cabecalhosEhRodapes(d);

  pdf.setTitle(d.titulo || rot.appName);
  pdf.setAuthor(rot.appName);
  pdf.setCreator(rot.appName);
  pdf.setProducer(rot.appName);
  pdf.setLanguage(d.idioma);
  if (d.passagem) pdf.setSubject(d.passagem);
  return pdf.save();
}
