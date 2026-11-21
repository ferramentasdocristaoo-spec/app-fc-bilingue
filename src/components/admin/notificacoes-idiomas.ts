/* Plano de envio por idioma da Central de mensagens (21/11/2026 · Noé).
   O dono escreve em pt-BR, marca os idiomas de saída e cada usuário recebe a versão do idioma do app dele:
   um envio (uma linha no histórico) por idioma. Quem usa um idioma não marcado não recebe, a menos que
   "outros idiomas em português" esteja ligado (aí recebe a versão pt-BR). Regras puras, sem React. */
import { IDIOMAS_PUSH, validarMensagem, type GrupoPlano, type Publico } from "../../../supabase/functions/push-send/publico";
import { IDIOMA_ORIGEM, type Versao } from "../../../supabase/functions/push-send/traducao";

export const NOME_IDIOMA: Record<string, string> = {
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  it: "Italiano",
  de: "Alemão",
};

/** Identificador do grupo "outros idiomas" (usuários fora dos idiomas marcados, recebem em pt-BR). */
export const OUTROS = "outros";

export type ItemEnvio = { id: string; rotulo: string; publico: Publico; titulo: string; texto: string };

/** Idiomas marcados, sem repetir, na ordem de IDIOMAS_PUSH. */
export function ordenarIdiomas(marcados: string[]): string[] {
  return IDIOMAS_PUSH.filter((l) => marcados.includes(l));
}

/** Idiomas marcados que precisam de tradução (todos menos pt-BR). */
export const idiomasTraduzidos = (marcados: string[]) => ordenarIdiomas(marcados).filter((l) => l !== IDIOMA_ORIGEM);

/** Um item por idioma marcado (+ "outros" se ligado), cada um com o público filtrado e o texto do idioma. */
export function planoDeEnvio(o: {
  tipo: "todos" | "plano"; plano: GrupoPlano; marcados: string[]; outrosEmPt: boolean;
  origem: Versao; versoes: Record<string, Versao>;
}): ItemEnvio[] {
  const base = o.tipo === "plano" ? ({ tipo: "plano", plano: o.plano } as const) : ({ tipo: "todos" } as const);
  const marcados = ordenarIdiomas(o.marcados);
  const itens: ItemEnvio[] = marcados.map((l) => {
    const v = l === IDIOMA_ORIGEM ? o.origem : o.versoes[l] ?? { titulo: "", texto: "" };
    return { id: l, rotulo: NOME_IDIOMA[l] ?? l, publico: { ...base, idiomas: [l] }, titulo: v.titulo, texto: v.texto };
  });
  if (o.outrosEmPt) {
    // Sem nenhum idioma marcado, "outros" seria todo mundo: aí vale o público inteiro em pt-BR.
    const publico: Publico = marcados.length ? { ...base, foraIdiomas: marcados } : { ...base };
    itens.push({ id: OUTROS, rotulo: "Outros idiomas (em português)", publico, titulo: o.origem.titulo, texto: o.origem.texto });
  }
  return itens;
}

/** Problemas que impedem o envio de um item (texto vazio, longo demais, link). null = pode enviar. */
export function erroDoItem(item: ItemEnvio, link: string): string | null {
  const v = validarMensagem({ titulo: item.titulo, texto: item.texto, link });
  return v.ok ? null : (v as { erro: string }).erro;
}

/** Chave da origem: muda quando o dono mexe no título/texto em português depois de traduzir. */
export const chaveOrigem = (v: Versao) => JSON.stringify([v.titulo.trim(), v.texto.trim()]);

/** Chave de idempotência de cada envio do lote (o servidor aceita [A-Za-z0-9-]{8,64}). */
export const chaveDoItem = (chaveLote: string, id: string) => `${chaveLote}-${id}`.replace(/[^A-Za-z0-9-]/g, "").slice(0, 64);
