/**
 * Esboços no aparelho: o trabalho aberto na Oficina ("fc-oficina-atual") e a lista de Meus Esboços ("fc-sermoes").
 * Ponto único para a Oficina e Meus Esboços não divergirem no formato.
 */

import { partesParaTexto, resultadoParaPartes, textoParaPartes, type Parte } from "@/lib/sermon-parts";

export const PROGRESS_KEY = "fc-oficina-atual";
export const SERMOES_KEY = "fc-sermoes";

export interface EsbocoResult {
  titulo: string;
  texto_base: string;
  introducao: { gancho: string; contextualizacao: string };
  pontos: { titulo: string; conteudo: string; versiculos: string[] }[];
  aplicacao_pratica: string;
  conclusao: string;
}

/** Trabalho aberto na Oficina. `origemData` = data do esboço de Meus Esboços que está sendo continuado. */
export type OficinaProgress = {
  titulo: string;
  textoBase: string;
  tema: string;
  tipo: string;
  tempoIdx: number[];
  resultado: EsbocoResult | null;
  conteudoEditavel: string;
  modoEdicao: boolean;
  origemData?: string;
  /** Esboço em partes (edição na folha, anotações, PDF). Ausente em trabalhos antigos: deriva de `resultado`. */
  partes?: Parte[] | null;
};

export interface Sermao {
  titulo: string;
  textoBase: string;
  tema: string;
  tipo: string;
  conteudo: string;
  status: string;
  /** Data de criação; serve também de identificador do esboço. */
  data: string;
  /** Última gravação (para a cópia de segurança decidir qual versão fica). */
  atualizadoEm?: string;
  /** Partes com anotações; o `conteudo` continua sendo o texto corrido equivalente. */
  partes?: Parte[];
}

export type EsbocoLabels = { introduction: string; application: string; conclusion: string };

export function esbocoParaTexto(r: EsbocoResult, labels: EsbocoLabels): string {
  let text = `${r.titulo}\n${r.texto_base}\n\n`;
  text += `${labels.introduction.toUpperCase()}\n${r.introducao.gancho}\n${r.introducao.contextualizacao}\n\n`;
  r.pontos.forEach((p, i) => {
    text += `${i + 1}. ${p.titulo}\n${p.conteudo}\n${p.versiculos.join(", ")}\n\n`;
  });
  text += `${labels.application.toUpperCase()}\n${r.aplicacao_pratica}\n\n`;
  text += `${labels.conclusion.toUpperCase()}\n${r.conclusao}`;
  return text;
}

export function readSermoes(): Sermao[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SERMOES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readProgress(): Partial<OficinaProgress> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Grava na lista. Se o esboço veio de Meus Esboços (`origemData`), substitui o mesmo item em vez de duplicar
 * (mantém a data original como identificador). Devolve a lista nova.
 */
export function salvarSermao(sermao: Omit<Sermao, "data" | "atualizadoEm">, origemData?: string): Sermao[] {
  const lista = readSermoes();
  const idx = origemData ? lista.findIndex((s) => s.data === origemData) : -1;
  const agora = new Date().toISOString();
  const limpo = { ...sermao };
  if (!limpo.partes?.length) delete limpo.partes;
  if (idx >= 0) lista[idx] = { ...limpo, data: lista[idx].data, atualizadoEm: agora };
  else lista.push({ ...limpo, data: agora, atualizadoEm: agora });
  localStorage.setItem(SERMOES_KEY, JSON.stringify(lista));
  return lista;
}

/**
 * Guarda em Meus Esboços o trabalho aberto na Oficina, se houver texto e se ele mudou.
 * Esboço que veio de Meus Esboços (origemData) mantém o status e os campos originais; sem mudança, nada é gravado.
 */
export function guardarTrabalhoAberto(labels: EsbocoLabels): void {
  const atual = readProgress();
  const original = atual.origemData ? readSermoes().find((s) => s.data === atual.origemData) : undefined;
  const titulo = atual.resultado?.titulo || atual.titulo || original?.titulo || "";
  const textoBase = atual.resultado?.texto_base || atual.textoBase || original?.textoBase || "";
  const partes = atual.modoEdicao ? null : atual.partes ?? (atual.resultado ? resultadoParaPartes(atual.resultado) : null);
  const textoAtual = atual.modoEdicao
    ? atual.conteudoEditavel ?? ""
    : partes?.length
      ? partesParaTexto(titulo, textoBase, partes, labels)
      : atual.resultado
        ? esbocoParaTexto(atual.resultado, labels)
        : "";
  if (!textoAtual.trim()) return;
  if (original && original.conteudo === textoAtual) return;
  salvarSermao(
    {
      titulo,
      textoBase,
      tema: atual.tema || original?.tema || "",
      tipo: atual.tipo || original?.tipo || "",
      conteudo: textoAtual,
      status: original?.status ?? "rascunho",
      partes: partes?.length ? partes : atual.modoEdicao ? partesDoTexto(textoAtual, labels, titulo, textoBase) : undefined,
    },
    original ? atual.origemData : undefined,
  );
}

/** Partes lidas do texto corrido, só se ele tiver a estrutura de esboço (senão fica só o texto). */
export function partesDoTexto(texto: string, labels: EsbocoLabels, titulo = "", textoBase = ""): Parte[] | undefined {
  const partes = textoParaPartes(texto, labels, titulo, textoBase);
  return partes.some((p) => p.tipo !== "secao") ? partes : undefined;
}

/**
 * Abre um esboço salvo na Oficina, em modo de edição de texto. Se havia outro trabalho aberto e não salvo na
 * Oficina, ele é guardado antes em Meus Esboços — nada se perde. Se o próprio esboço já está aberto, a edição
 * em andamento é mantida (não volta ao texto salvo).
 */
export function continuarNaOficina(sermao: Sermao, labels: EsbocoLabels): void {
  const atual = readProgress();
  if (atual.origemData === sermao.data && (atual.modoEdicao || atual.partes?.length)) return;
  guardarTrabalhoAberto(labels);
  // Com estrutura de esboço (salvo em partes ou texto no formato da Oficina): abre na folha, editável por partes.
  const partes = sermao.partes?.length ? sermao.partes : partesDoTexto(sermao.conteudo, labels, sermao.titulo, sermao.textoBase);
  const progress: OficinaProgress = {
    titulo: sermao.titulo,
    textoBase: sermao.textoBase,
    tema: sermao.tema ?? "",
    tipo: sermao.tipo ?? "",
    tempoIdx: Array.isArray(atual.tempoIdx) ? atual.tempoIdx : [2],
    resultado: null,
    conteudoEditavel: sermao.conteudo,
    modoEdicao: !partes,
    origemData: sermao.data,
    partes: partes ?? null,
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

/** "Pregar" a partir da Bíblia: guarda o trabalho aberto e começa um pedido novo com a passagem. */
export function novoPedidoNaOficina(textoBase: string, labels: EsbocoLabels): void {
  guardarTrabalhoAberto(labels);
  const atual = readProgress();
  const progress: OficinaProgress = {
    titulo: "", textoBase, tema: "", tipo: "",
    tempoIdx: Array.isArray(atual.tempoIdx) ? atual.tempoIdx : [2],
    resultado: null, conteudoEditavel: "", modoEdicao: false, partes: null,
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ---------- Cópia de segurança (arquivo .json, sem banco) ----------

export const BACKUP_APP = "ferramentas-do-cristao/esbocos";

export interface CopiaSeguranca {
  app: typeof BACKUP_APP;
  versao: 1;
  exportadoEm: string;
  sermoes: Sermao[];
}

export function criarCopiaSeguranca(agora = new Date()): CopiaSeguranca {
  return { app: BACKUP_APP, versao: 1, exportadoEm: agora.toISOString(), sermoes: readSermoes() };
}

function sermaoValido(s: unknown): s is Sermao {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return typeof o.data === "string" && typeof o.conteudo === "string" && typeof o.titulo === "string";
}

/** Lê o arquivo de cópia. Aceita também uma lista pura de esboços (formato do localStorage). null = inválido. */
export function lerCopiaSeguranca(texto: string): Sermao[] | null {
  let dados: unknown;
  try {
    dados = JSON.parse(texto.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
  const lista = Array.isArray(dados)
    ? dados
    : dados && typeof dados === "object" && (dados as CopiaSeguranca).app === BACKUP_APP && Array.isArray((dados as CopiaSeguranca).sermoes)
      ? (dados as CopiaSeguranca).sermoes
      : null;
  if (!lista) return null;
  const validos = lista.filter(sermaoValido).map((s) => ({
    titulo: s.titulo,
    textoBase: typeof s.textoBase === "string" ? s.textoBase : "",
    tema: typeof s.tema === "string" ? s.tema : "",
    tipo: typeof s.tipo === "string" ? s.tipo : "",
    conteudo: s.conteudo,
    status: s.status === "finalizado" ? "finalizado" : "rascunho",
    data: s.data,
    ...(typeof s.atualizadoEm === "string" ? { atualizadoEm: s.atualizadoEm } : {}),
    ...(Array.isArray(s.partes) && s.partes.length ? { partes: s.partes } : {}),
  }));
  return lista.length > 0 && validos.length === 0 ? null : validos;
}

export type ResultadoRestauracao = { novos: number; atualizados: number; iguais: number; lista: Sermao[] };

/**
 * Junta a cópia com o que já está no aparelho, sem duplicar. O identificador é a data de criação: se o esboço
 * já existe, fica a versão gravada por último (atualizadoEm); empate ou sem data de gravação = fica a do aparelho.
 */
export function restaurarCopiaSeguranca(importados: Sermao[]): ResultadoRestauracao {
  const lista = readSermoes();
  let novos = 0;
  let atualizados = 0;
  let iguais = 0;
  for (const imp of importados) {
    const idx = lista.findIndex((s) => s.data === imp.data);
    if (idx < 0) {
      lista.push(imp);
      novos += 1;
      continue;
    }
    const local = lista[idx];
    if ((imp.atualizadoEm ?? "") > (local.atualizadoEm ?? "") && JSON.stringify(imp) !== JSON.stringify(local)) {
      lista[idx] = imp;
      atualizados += 1;
    } else {
      iguais += 1;
    }
  }
  lista.sort((a, b) => a.data.localeCompare(b.data));
  localStorage.setItem(SERMOES_KEY, JSON.stringify(lista));
  return { novos, atualizados, iguais, lista };
}

/** Pede ao navegador para não apagar os dados do app sozinho (quando falta espaço). Sem suporte: segue normal. */
export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
