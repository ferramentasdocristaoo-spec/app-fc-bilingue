/**
 * Esboços no aparelho: o trabalho aberto na Oficina ("fc-oficina-atual") e a lista de Meus Esboços ("fc-sermoes").
 * Ponto único para a Oficina e Meus Esboços não divergirem no formato.
 */

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
export function salvarSermao(sermao: Omit<Sermao, "data">, origemData?: string): Sermao[] {
  const lista = readSermoes();
  const idx = origemData ? lista.findIndex((s) => s.data === origemData) : -1;
  if (idx >= 0) lista[idx] = { ...sermao, data: lista[idx].data };
  else lista.push({ ...sermao, data: new Date().toISOString() });
  localStorage.setItem(SERMOES_KEY, JSON.stringify(lista));
  return lista;
}

/**
 * Guarda em Meus Esboços o trabalho aberto na Oficina, se houver texto e se ele mudou.
 * Esboço que veio de Meus Esboços (origemData) mantém o status e os campos originais; sem mudança, nada é gravado.
 */
export function guardarTrabalhoAberto(labels: EsbocoLabels): void {
  const atual = readProgress();
  const textoAtual = atual.modoEdicao ? atual.conteudoEditavel ?? "" : atual.resultado ? esbocoParaTexto(atual.resultado, labels) : "";
  if (!textoAtual.trim()) return;
  const original = atual.origemData ? readSermoes().find((s) => s.data === atual.origemData) : undefined;
  if (original && original.conteudo === textoAtual) return;
  salvarSermao(
    {
      titulo: atual.resultado?.titulo || atual.titulo || original?.titulo || "",
      textoBase: atual.resultado?.texto_base || atual.textoBase || original?.textoBase || "",
      tema: atual.tema || original?.tema || "",
      tipo: atual.tipo || original?.tipo || "",
      conteudo: textoAtual,
      status: original?.status ?? "rascunho",
    },
    original ? atual.origemData : undefined,
  );
}

/**
 * Abre um esboço salvo na Oficina, em modo de edição de texto. Se havia outro trabalho aberto e não salvo na
 * Oficina, ele é guardado antes em Meus Esboços — nada se perde. Se o próprio esboço já está aberto, a edição
 * em andamento é mantida (não volta ao texto salvo).
 */
export function continuarNaOficina(sermao: Sermao, labels: EsbocoLabels): void {
  const atual = readProgress();
  if (atual.origemData === sermao.data && atual.modoEdicao) return;
  guardarTrabalhoAberto(labels);
  const progress: OficinaProgress = {
    titulo: sermao.titulo,
    textoBase: sermao.textoBase,
    tema: sermao.tema ?? "",
    tipo: sermao.tipo ?? "",
    tempoIdx: Array.isArray(atual.tempoIdx) ? atual.tempoIdx : [2],
    resultado: null,
    conteudoEditavel: sermao.conteudo,
    modoEdicao: true,
    origemData: sermao.data,
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
    resultado: null, conteudoEditavel: "", modoEdicao: false,
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
