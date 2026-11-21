/**
 * PDF do sermão no navegador: carrega (uma vez, sob demanda) o pdf-lib, as fontes do app e o logo do idioma,
 * gera o arquivo e entrega. No celular (iPhone/Android) abre a folha de compartilhar com o arquivo pronto
 * (Salvar em Arquivos, WhatsApp, Imprimir); no computador, ou se o compartilhar não existir, baixa direto.
 * Nada de janela de impressão: no iPhone ela não salva PDF de forma confiável dentro do app instalado.
 */
import serifUrl from "@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url";
import serifItalicUrl from "@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff?url";
import serifBoldUrl from "@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff?url";
import displayUrl from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff?url";
import displayItalicUrl from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff?url";
import capsUrl from "@fontsource/cinzel/files/cinzel-latin-500-normal.woff?url";
import capsBoldUrl from "@fontsource/cinzel/files/cinzel-latin-600-normal.woff?url";
import { appLogo } from "@/lib/branding";
import { sermonFileName } from "@/lib/sermon-export";
import type { DadosPdf, FontesPdf } from "./sermon-pdf";
import { TEMA_PDF_PADRAO, type TemaPdfId } from "./pdf-temas";

const FONTES: Record<keyof FontesPdf, string> = {
  texto: serifUrl,
  textoItalico: serifItalicUrl,
  textoNegrito: serifBoldUrl,
  titulo: displayUrl,
  tituloItalico: displayItalicUrl,
  versalete: capsUrl,
  versaleteNegrito: capsBoldUrl,
};

async function baixarBytes(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.arrayBuffer();
}

/** Logo reduzido para 320 px (o PNG original tem 250 KB; no PDF não precisa de mais). */
async function logoReduzido(url: string): Promise<ArrayBuffer> {
  const original = await baixarBytes(url);
  try {
    if (typeof createImageBitmap !== "function") return original;
    const bmp = await createImageBitmap(new Blob([original], { type: "image/png" }));
    const escala = Math.min(1, 320 / bmp.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
    return blob ? await blob.arrayBuffer() : original;
  } catch {
    return original;
  }
}

let fontesCache: Promise<FontesPdf> | null = null;
const logoCache = new Map<string, Promise<ArrayBuffer>>();
let geradorCache: Promise<typeof import("./sermon-pdf")> | null = null;

function carregarFontes(): Promise<FontesPdf> {
  if (!fontesCache) {
    const chaves = Object.keys(FONTES) as (keyof FontesPdf)[];
    fontesCache = Promise.all(chaves.map((k) => baixarBytes(FONTES[k]))).then(
      (bytes) => Object.fromEntries(chaves.map((k, i) => [k, bytes[i]])) as unknown as FontesPdf,
    );
    fontesCache.catch(() => {
      fontesCache = null;
    });
  }
  return fontesCache;
}

function carregarLogo(idioma: string): Promise<ArrayBuffer> {
  const url = appLogo(idioma);
  let p = logoCache.get(url);
  if (!p) {
    p = logoReduzido(url);
    logoCache.set(url, p);
    p.catch(() => logoCache.delete(url));
  }
  return p;
}

function carregarGerador() {
  if (!geradorCache) {
    geradorCache = import("./sermon-pdf");
    geradorCache.catch(() => {
      geradorCache = null;
    });
  }
  return geradorCache;
}

/**
 * Deixa tudo carregado antes do toque no botão. Importante no iPhone: o compartilhar só abre se for chamado
 * logo depois do toque; com as fontes já em memória, a geração leva menos de um segundo.
 */
export function prepararPdf(idioma: string): void {
  void Promise.all([carregarGerador(), carregarFontes(), carregarLogo(idioma)]).catch(() => undefined);
}

const TEMA_KEY = "fc-pdf-tema";

/** Direção de design escolhida (o dono decide; até lá, a A). Guardada no aparelho para testes. */
export function temaPdfAtual(): TemaPdfId {
  try {
    const v = localStorage.getItem(TEMA_KEY);
    if (v === "classica" || v === "editorial" || v === "pergaminho") return v;
  } catch {
    /* sem armazenamento */
  }
  return TEMA_PDF_PADRAO;
}

export async function gerarPdfNoNavegador(dados: DadosPdf, tema: TemaPdfId = temaPdfAtual()): Promise<Uint8Array> {
  const [gerador, fontes, logo] = await Promise.all([carregarGerador(), carregarFontes(), carregarLogo(dados.idioma)]);
  return gerador.gerarSermaoPdf(dados, { fontes, logo }, tema);
}

export type EntregaPdf = "compartilhado" | "baixado" | "cancelado";

function telaDeToque(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Entrega o arquivo: compartilhar no celular, download no computador (ou se o compartilhar falhar). */
export async function entregarPdf(bytes: Uint8Array, titulo: string): Promise<EntregaPdf> {
  const nome = `${sermonFileName(titulo)}.pdf`;
  const blob = new Blob([bytes], { type: "application/pdf" });
  if (telaDeToque() && typeof navigator.share === "function" && typeof File === "function") {
    const arquivo = new File([blob], nome, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: titulo });
        return "compartilhado";
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return "cancelado";
        // NotAllowedError (toque "expirou") ou outro erro: cai no download.
      }
    }
  }
  baixarArquivo(blob, nome);
  return "baixado";
}

export async function baixarSermaoPdf(dados: DadosPdf): Promise<EntregaPdf> {
  const bytes = await gerarPdfNoNavegador(dados);
  return entregarPdf(bytes, dados.titulo || dados.rotulos.appName);
}
