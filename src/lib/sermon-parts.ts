/**
 * Esboço dividido em partes (introdução, tópicos, aplicação, conclusão), cada uma com texto, versículos e
 * anotações do pregador. É o formato da edição na folha e do PDF. O texto corrido continua existindo
 * (copiar, TXT, busca, modo "Editar texto") e as duas formas se convertem uma na outra.
 */
import type { EsbocoResult } from "@/lib/oficina-store";

export type ParteTipo = "introducao" | "ponto" | "aplicacao" | "conclusao" | "secao";

export interface Parte {
  id: string;
  tipo: ParteTipo;
  /** Título do tópico ou da seção livre; nas partes fixas fica vazio (o rótulo vem do idioma). */
  titulo: string;
  /** Parágrafos separados por quebra de linha. */
  texto: string;
  versiculos: string[];
  anotacoes: string[];
}

export type PartesLabels = { introduction: string; application: string; conclusion: string };

/** Marca das anotações no texto corrido (vale em qualquer idioma). */
export const MARCA_ANOTACAO = "✎";

let contador = 0;
export function novoIdParte(prefixo = "p"): string {
  contador += 1;
  return `${prefixo}-${Date.now().toString(36)}-${contador}`;
}

export function resultadoParaPartes(r: EsbocoResult): Parte[] {
  const intro = [r.introducao?.gancho, r.introducao?.contextualizacao].filter((s) => s && s.trim()).join("\n");
  return [
    { id: "intro", tipo: "introducao", titulo: "", texto: intro, versiculos: [], anotacoes: [] },
    ...(r.pontos ?? []).map((p, i) => ({
      id: `ponto-${i}`,
      tipo: "ponto" as const,
      titulo: p.titulo ?? "",
      texto: p.conteudo ?? "",
      versiculos: (p.versiculos ?? []).filter((v) => v && v.trim()),
      anotacoes: [],
    })),
    { id: "aplicacao", tipo: "aplicacao", titulo: "", texto: r.aplicacao_pratica ?? "", versiculos: [], anotacoes: [] },
    { id: "conclusao", tipo: "conclusao", titulo: "", texto: r.conclusao ?? "", versiculos: [], anotacoes: [] },
  ];
}

export function rotuloParte(p: Parte, labels: PartesLabels): string {
  if (p.tipo === "introducao") return labels.introduction;
  if (p.tipo === "aplicacao") return labels.application;
  if (p.tipo === "conclusao") return labels.conclusion;
  return p.titulo;
}

/** Texto corrido no mesmo formato de sempre (esbocoParaTexto), com as anotações marcadas por ✎. */
export function partesParaTexto(titulo: string, textoBase: string, partes: Parte[], labels: PartesLabels): string {
  const blocos: string[] = [];
  const cabecalho = [titulo, textoBase].filter((s) => s && s.trim()).join("\n");
  if (cabecalho) blocos.push(cabecalho);
  let n = 0;
  for (const p of partes) {
    const linhas: string[] = [];
    if (p.tipo === "ponto") {
      n += 1;
      linhas.push(`${n}. ${p.titulo}`.trim());
    } else {
      linhas.push(rotuloParte(p, labels).toLocaleUpperCase());
    }
    if (p.texto.trim()) linhas.push(p.texto.trim());
    if (p.versiculos.length) linhas.push(p.versiculos.join(", "));
    for (const a of p.anotacoes) if (a.trim()) linhas.push(`${MARCA_ANOTACAO} ${a.trim().replace(/\n+/g, " ")}`);
    blocos.push(linhas.join("\n"));
  }
  return blocos.join("\n\n");
}

const REF = /^(?:[1-3]\s?)?[\p{L}][\p{L}.]*(?:\s[\p{L}][\p{L}.]*){0,3}\s\d{1,3}(?:[:.,]\d{1,3}(?:\s?[-–]\s?\d{1,3})?)?$/u;

/** A linha é só uma lista de referências ("João 3:16, Romanos 5:8")? */
export function linhaDeReferencias(linha: string): string[] | null {
  const itens = linha.split(/\s*[,;]\s*(?=(?:[1-3]\s?)?\p{L})/u).map((s) => s.trim()).filter(Boolean);
  if (!itens.length || linha.length > 200) return null;
  return itens.every((i) => REF.test(i)) ? itens : null;
}

function ehRotulo(linha: string): boolean {
  return linha.length < 80 && /\p{L}/u.test(linha) && linha === linha.toLocaleUpperCase() && linha !== linha.toLocaleLowerCase();
}

/**
 * Lê o texto corrido de volta em partes. Reconhece o formato gerado por esbocoParaTexto/partesParaTexto
 * (rótulos em maiúsculas, "1. Tópico", linha de referências, "✎ anotação"); texto livre vira uma parte só.
 * `titulo`/`textoBase`: se as primeiras linhas forem iguais a eles, saem do corpo.
 */
export function textoParaPartes(texto: string, labels: PartesLabels, titulo = "", textoBase = ""): Parte[] {
  const linhas = texto.split("\n").map((l) => l.trim());
  while (linhas.length && !linhas[0]) linhas.shift();
  if (titulo && linhas[0] === titulo.trim()) {
    linhas.shift();
    if (textoBase && linhas[0] === textoBase.trim()) linhas.shift();
  }
  const fixo = (l: string): ParteTipo | null => {
    const up = l.toLocaleUpperCase();
    if (up === labels.introduction.toLocaleUpperCase()) return "introducao";
    if (up === labels.application.toLocaleUpperCase()) return "aplicacao";
    if (up === labels.conclusion.toLocaleUpperCase()) return "conclusao";
    return null;
  };
  const partes: Parte[] = [];
  let atual: Parte | null = null;
  let paragrafos: string[] = [];
  const fechar = () => {
    if (!atual) {
      if (paragrafos.length) partes.push({ id: novoIdParte(), tipo: "secao", titulo: "", texto: paragrafos.join("\n"), versiculos: [], anotacoes: [] });
    } else {
      atual.texto = paragrafos.join("\n");
      partes.push(atual);
    }
    paragrafos = [];
  };
  for (const linha of linhas) {
    if (!linha) continue;
    const tipoFixo = fixo(linha);
    const ponto = /^(\d{1,2})[.)]\s+(.+)$/.exec(linha);
    if (tipoFixo || ponto || ehRotulo(linha)) {
      fechar();
      atual = tipoFixo
        ? { id: novoIdParte(), tipo: tipoFixo, titulo: "", texto: "", versiculos: [], anotacoes: [] }
        : { id: novoIdParte(), tipo: ponto ? "ponto" : "secao", titulo: ponto ? ponto[2] : linha, texto: "", versiculos: [], anotacoes: [] };
      continue;
    }
    if (linha.startsWith(MARCA_ANOTACAO)) {
      const nota = linha.slice(MARCA_ANOTACAO.length).trim();
      if (!atual) {
        fechar();
        atual = { id: novoIdParte(), tipo: "secao", titulo: "", texto: "", versiculos: [], anotacoes: [] };
      }
      if (nota) atual.anotacoes.push(nota);
      continue;
    }
    const refs = atual && atual.tipo === "ponto" ? linhaDeReferencias(linha) : null;
    if (refs && atual) {
      atual.versiculos.push(...refs);
      continue;
    }
    paragrafos.push(linha);
  }
  fechar();
  return partes;
}

export function contarAnotacoes(partes: Parte[]): number {
  return partes.reduce((n, p) => n + p.anotacoes.filter((a) => a.trim()).length, 0);
}
