import { describe, it, expect, beforeEach } from "vitest";
import { PROGRESS_KEY, SERMOES_KEY, continuarNaOficina, novoPedidoNaOficina, readProgress, readSermoes, salvarSermao, type Sermao } from "@/lib/oficina-store";

const labels = { introduction: "Introdução", application: "Aplicação", conclusion: "Conclusão" };
const base: Sermao = { titulo: "A fé", textoBase: "Hb 11:1", tema: "Fé", tipo: "Temático", conteudo: "A fé\nHb 11:1\n\ntexto", status: "rascunho", data: "2026-11-19T10:00:00.000Z" };

describe("Meus Esboços → Continuar na Oficina", () => {
  beforeEach(() => localStorage.clear());

  it("abre o esboço salvo na Oficina, em edição de texto, ligado ao item original", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    continuarNaOficina(base, labels);
    const p = readProgress();
    expect(p).toMatchObject({ titulo: "A fé", textoBase: "Hb 11:1", conteudoEditavel: base.conteudo, modoEdicao: true, resultado: null, origemData: base.data });
    expect(readSermoes()).toHaveLength(1);
  });

  it("salvar de novo substitui o mesmo item (sem duplicar) e mantém a data original", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    const lista = salvarSermao({ ...base, conteudo: "editado", status: "finalizado" }, base.data);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ conteudo: "editado", status: "finalizado", data: base.data });
  });

  it("sem origem, salvar acrescenta um item novo", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    expect(salvarSermao({ ...base, titulo: "Outro" })).toHaveLength(2);
  });

  it("trabalho aberto e não salvo na Oficina vira rascunho antes de ser trocado", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      titulo: "Esperança", textoBase: "", tema: "", tipo: "", tempoIdx: [3], modoEdicao: false, conteudoEditavel: "",
      resultado: { titulo: "Esperança viva", texto_base: "1Pe 1:3", introducao: { gancho: "g", contextualizacao: "c" }, pontos: [{ titulo: "P1", conteudo: "x", versiculos: ["Rm 5:5"] }], aplicacao_pratica: "a", conclusao: "z" },
    }));
    continuarNaOficina(base, labels);
    const lista = readSermoes();
    expect(lista).toHaveLength(2);
    expect(lista[1]).toMatchObject({ titulo: "Esperança viva", textoBase: "1Pe 1:3", status: "rascunho" });
    expect(lista[1].conteudo).toContain("INTRODUÇÃO");
    expect(lista[1].conteudo).toContain("1. P1");
    expect(readProgress()).toMatchObject({ origemData: base.data, tempoIdx: [3] });
  });

  it("reabrir o mesmo esboço que já está aberto não cria cópia", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    continuarNaOficina(base, labels);
    continuarNaOficina(base, labels);
    expect(readSermoes()).toHaveLength(1);
  });

  it("trocar de esboço sem editar não rebaixa o finalizado para rascunho", () => {
    const fin: Sermao = { ...base, status: "finalizado" };
    const outro: Sermao = { ...base, titulo: "Outro", data: "2026-11-19T11:00:00.000Z" };
    localStorage.setItem(SERMOES_KEY, JSON.stringify([fin, outro]));
    continuarNaOficina(fin, labels);
    continuarNaOficina(outro, labels);
    expect(readSermoes()[0]).toEqual(fin);
  });

  it("finalizado editado e trocado continua finalizado, com o texto novo", () => {
    const fin: Sermao = { ...base, status: "finalizado" };
    const outro: Sermao = { ...base, titulo: "Outro", data: "2026-11-19T11:00:00.000Z" };
    localStorage.setItem(SERMOES_KEY, JSON.stringify([fin, outro]));
    continuarNaOficina(fin, labels);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readProgress(), conteudoEditavel: "texto novo" }));
    continuarNaOficina(outro, labels);
    expect(readSermoes()).toHaveLength(2);
    expect(readSermoes()[0]).toMatchObject({ status: "finalizado", conteudo: "texto novo", tema: "Fé", data: fin.data });
  });

  it("reabrir o mesmo esboço mantém a edição em andamento", () => {
    localStorage.setItem(SERMOES_KEY, JSON.stringify([base]));
    continuarNaOficina(base, labels);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...readProgress(), conteudoEditavel: "editando" }));
    continuarNaOficina(base, labels);
    expect(readProgress().conteudoEditavel).toBe("editando");
  });

  it("'Pregar' da Bíblia guarda o trabalho aberto e começa um pedido com a passagem", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ titulo: "Paz", textoBase: "", tema: "", tipo: "", tempoIdx: [2], resultado: null, conteudoEditavel: "meu texto", modoEdicao: true }));
    novoPedidoNaOficina("João 3:16", labels);
    expect(readSermoes()).toHaveLength(1);
    expect(readSermoes()[0]).toMatchObject({ titulo: "Paz", conteudo: "meu texto", status: "rascunho" });
    expect(readProgress()).toMatchObject({ textoBase: "João 3:16", modoEdicao: false, conteudoEditavel: "" });
  });
});
