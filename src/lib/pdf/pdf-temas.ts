/**
 * Direções de design do PDF do sermão. As cores saem dos tokens do tema claro do app (src/index.css, :root
 * claro): papel, papel-2, tinta, ouro, ouro-tinta, vinho. Nada inventado; só a mistura do tom do versículo.
 */
export type TemaPdfId = "classica" | "editorial" | "pergaminho";

/** [h, s%, l%] como nos tokens do CSS. */
export type Hsl = [number, number, number];

export const TOKENS_APP = {
  paper: [40, 47, 94] as Hsl,
  paper2: [41, 42, 89] as Hsl,
  card: [40, 50, 97] as Hsl,
  ink: [216, 45, 16] as Hsl,
  ink2: [218, 17, 28] as Hsl,
  gold: [40, 48, 47] as Hsl,
  goldInk: [40, 58, 22] as Hsl,
  goldSoft: [40, 45, 84] as Hsl,
  rule: [41, 39, 78] as Hsl,
  oxblood: [0, 44, 29] as Hsl,
};

export function hslParaRgb([h, s, l]: Hsl): [number, number, number] {
  const ss = s / 100;
  const ll = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminancia(c: [number, number, number]): number {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/** Contraste WCAG entre duas cores HSL. */
export function contraste(a: Hsl, b: Hsl): number {
  const la = luminancia(hslParaRgb(a));
  const lb = luminancia(hslParaRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface TemaPdf {
  id: TemaPdfId;
  nome: string;
  descricao: string;
  papel: Hsl;
  /** Fundo das caixas de versículo: um tom mais escuro do papel. */
  papelEscuro: Hsl;
  tinta: Hsl;
  tinta2: Hsl;
  /** Ouro decorativo (fios, ornamentos; nunca texto). */
  ouro: Hsl;
  /** Texto dourado (rótulos, referências): 7:1 ou mais. */
  ouroTinta: Hsl;
  /** Cor das rubricas (rótulos de seção, numeração, capitular). */
  rubrica: Hsl;
  moldura: "ornamentada" | "fio" | "dupla";
  divisor: "fleuron" | "losango" | "ramo";
  numeracao: "medalhao" | "algarismo" | "rubrica";
  capitular: "caixa" | "simples" | "iluminada";
  cabecalho: "centrado" | "editorial";
  marcaDagua: "centro" | "canto";
  /** 0 = papel liso; 1 = fibras e manchas de pergaminho. */
  textura: number;
  justificado: boolean;
}

export const TEMAS_PDF: Record<TemaPdfId, TemaPdf> = {
  classica: {
    id: "classica",
    nome: "A · Clássica dourada",
    descricao: "Moldura dupla dourada com cantos ornamentados, capitular em caixa, tópicos em medalhão (I, II, III) e fleurons entre as seções.",
    papel: TOKENS_APP.paper,
    papelEscuro: TOKENS_APP.paper2,
    tinta: TOKENS_APP.ink,
    tinta2: TOKENS_APP.ink2,
    ouro: TOKENS_APP.gold,
    ouroTinta: TOKENS_APP.goldInk,
    rubrica: TOKENS_APP.goldInk,
    moldura: "ornamentada",
    divisor: "fleuron",
    numeracao: "medalhao",
    capitular: "caixa",
    cabecalho: "centrado",
    marcaDagua: "centro",
    textura: 0.35,
    justificado: true,
  },
  editorial: {
    id: "editorial",
    nome: "B · Editorial limpa",
    descricao: "Papel claro, um fio fino, cabeçalho alinhado à esquerda, números grandes (1, 2, 3) e losango discreto entre as seções. A mais econômica de tinta.",
    papel: TOKENS_APP.card,
    papelEscuro: TOKENS_APP.paper2,
    tinta: TOKENS_APP.ink,
    tinta2: TOKENS_APP.ink2,
    ouro: TOKENS_APP.gold,
    ouroTinta: TOKENS_APP.goldInk,
    rubrica: TOKENS_APP.goldInk,
    moldura: "fio",
    divisor: "losango",
    numeracao: "algarismo",
    capitular: "simples",
    cabecalho: "editorial",
    marcaDagua: "canto",
    textura: 0,
    justificado: false,
  },
  pergaminho: {
    id: "pergaminho",
    nome: "C · Pergaminho",
    descricao: "Papel com fibras leves, moldura dupla com cantoneiras, capitular iluminada e rubricas em vinho, como nos manuscritos; ramos entre as seções.",
    papel: TOKENS_APP.paper,
    papelEscuro: TOKENS_APP.paper2,
    tinta: TOKENS_APP.ink,
    tinta2: TOKENS_APP.ink2,
    ouro: TOKENS_APP.gold,
    ouroTinta: TOKENS_APP.goldInk,
    rubrica: TOKENS_APP.oxblood,
    moldura: "dupla",
    divisor: "ramo",
    numeracao: "rubrica",
    capitular: "iluminada",
    cabecalho: "centrado",
    marcaDagua: "centro",
    textura: 1,
    justificado: true,
  },
};

export const TEMA_PDF_PADRAO: TemaPdfId = "editorial";
