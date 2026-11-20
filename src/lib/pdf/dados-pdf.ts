/** Monta os dados do PDF a partir do esboço e do idioma (sem carregar o pdf-lib). */
import type { TFunction } from "i18next";
import type { Parte } from "@/lib/sermon-parts";
import type { DadosPdf } from "./sermon-pdf";

export function dataPorExtenso(data: string | Date, idioma: string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(idioma, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  }
}

export function montarDadosPdf(o: {
  titulo: string;
  passagem: string;
  partes: Parte[];
  data: string | Date;
  idioma: string;
  t: TFunction;
}): DadosPdf {
  return {
    titulo: o.titulo.trim() || o.t("esbocos.defaultTitle"),
    passagem: o.passagem.trim(),
    data: dataPorExtenso(o.data, o.idioma),
    idioma: o.idioma,
    partes: o.partes,
    rotulos: {
      introducao: o.t("oficina.introduction"),
      aplicacao: o.t("oficina.application"),
      conclusao: o.t("oficina.conclusion"),
      anotacao: o.t("oficina.noteLabel"),
      appName: o.t("appName"),
    },
  };
}
