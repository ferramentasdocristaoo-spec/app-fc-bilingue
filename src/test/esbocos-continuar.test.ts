import { describe, it, expect, beforeEach } from "vitest";
import { PROGRESS_KEY, SERMOES_KEY, continuarNaOficina, readProgress, readSermoes, salvarSermao, type Sermao } from "@/lib/oficina-store";

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
});
