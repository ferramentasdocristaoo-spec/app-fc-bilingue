import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import {
  PROGRESS_KEY,
  SERMOES_KEY,
  continuarNaOficina,
  criarCopiaSeguranca,
  lerCopiaSeguranca,
  readProgress,
  readSermoes,
  restaurarCopiaSeguranca,
  salvarSermao,
  type Sermao,
} from "@/lib/oficina-store";
import { partesParaTexto, resultadoParaPartes } from "@/lib/sermon-parts";
import FolhaPartes from "@/components/oficina/FolhaPartes";
import OficinaPage from "@/pages/OficinaPage";
import EsbocosPage from "@/pages/EsbocosPage";

const labels = { introduction: "Introdução", application: "Aplicação Prática", conclusion: "Conclusão e Apelo" };
const resultado = {
  titulo: "A fé",
  texto_base: "Hebreus 11:1",
  introducao: { gancho: "Gancho da introdução.", contextualizacao: "Contexto." },
  pontos: [{ titulo: "A fé enxerga", conteudo: "Conteúdo do tópico.", versiculos: ["Hebreus 11:1"] }],
  aplicacao_pratica: "Aplique.",
  conclusao: "Venha.",
};
const sermao = (o: Partial<Sermao> = {}): Sermao => ({
  titulo: "A fé",
  textoBase: "Hb 11:1",
  tema: "",
  tipo: "",
  conteudo: "texto",
  status: "rascunho",
  data: "2026-11-19T10:00:00.000Z",
  ...o,
});

describe("Cópia de segurança dos esboços", () => {
  beforeEach(() => localStorage.clear());

  it("a cópia leva todos os esboços com as anotações e volta igual", () => {
    const partes = resultadoParaPartes(resultado);
    partes[1].anotacoes = ["Minha anotação"];
    salvarSermao({ titulo: "A fé", textoBase: "Hb 11:1", tema: "", tipo: "", conteudo: "x", status: "rascunho", partes });
    const copia = criarCopiaSeguranca(new Date("2026-11-20T12:00:00Z"));
    expect(copia).toMatchObject({ app: "ferramentas-do-cristao/esbocos", versao: 1, exportadoEm: "2026-11-20T12:00:00.000Z" });
    const lidos = lerCopiaSeguranca(JSON.stringify(copia));
    expect(lidos).toHaveLength(1);
    expect(lidos![0].partes![1].anotacoes).toEqual(["Minha anotação"]);
  });

  it("restaurar não duplica: o que já existe fica, o que é novo entra", () => {
    const a = sermao();
    const b = sermao({ titulo: "Outro", data: "2026-11-20T10:00:00.000Z" });
    localStorage.setItem(SERMOES_KEY, JSON.stringify([a]));
    const r = restaurarCopiaSeguranca([a, b]);
    expect(r).toMatchObject({ novos: 1, atualizados: 0, iguais: 1 });
    expect(readSermoes()).toHaveLength(2);
    restaurarCopiaSeguranca([a, b]);
    expect(readSermoes()).toHaveLength(2);
  });

  it("se o esboço existe nos dois, fica a versão gravada por último", () => {
    const local = sermao({ conteudo: "velho", atualizadoEm: "2026-11-19T10:00:00.000Z" });
    const daCopia = sermao({ conteudo: "novo", atualizadoEm: "2026-11-20T10:00:00.000Z" });
    localStorage.setItem(SERMOES_KEY, JSON.stringify([local]));
    expect(restaurarCopiaSeguranca([daCopia]).atualizados).toBe(1);
    expect(readSermoes()[0].conteudo).toBe("novo");
    // Cópia mais antiga não apaga a edição feita depois no aparelho.
    restaurarCopiaSeguranca([local]);
    expect(readSermoes()[0].conteudo).toBe("novo");
  });

  it("arquivo que não é cópia do app é recusado", () => {
    expect(lerCopiaSeguranca("não é json")).toBeNull();
    expect(lerCopiaSeguranca(JSON.stringify({ outra: "coisa" }))).toBeNull();
    expect(lerCopiaSeguranca(JSON.stringify([{ foo: 1 }]))).toBeNull();
    // Lista pura (formato do armazenamento do app) também serve.
    expect(lerCopiaSeguranca(JSON.stringify([sermao()]))).toHaveLength(1);
  });

  it("Meus Esboços: explica que fica no aparelho, pede armazenamento persistente e restaura pelo arquivo", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "storage", { configurable: true, value: { persist, persisted: vi.fn().mockResolvedValue(false) } });
    await i18n.changeLanguage("pt-BR");
    render(
      <BrowserRouter>
        <EsbocosPage />
      </BrowserRouter>,
    );
    expect(screen.getByText(/ficam salvos neste aparelho/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer cópia de segurança" })).toBeInTheDocument();
    await waitFor(() => expect(persist).toHaveBeenCalled());

    const arquivo = new File([JSON.stringify(criarCopiaSegurancaCom([sermao({ titulo: "Restaurado" })]))], "esbocos.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("restaurar-arquivo"), { target: { files: [arquivo] } });
    expect(await screen.findByText("Restaurado")).toBeInTheDocument();
    expect(readSermoes()).toHaveLength(1);
  });
});

function criarCopiaSegurancaCom(sermoes: Sermao[]) {
  return { app: "ferramentas-do-cristao/esbocos", versao: 1, exportadoEm: "2026-11-20T00:00:00.000Z", sermoes };
}

describe("Edição por partes", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("pt-BR");
  });

  it("esboço salvo com estrutura abre na folha (por partes), não no texto corrido", () => {
    const partes = resultadoParaPartes(resultado);
    const s = sermao({ conteudo: partesParaTexto("A fé", "Hb 11:1", partes, labels) });
    localStorage.setItem(SERMOES_KEY, JSON.stringify([s]));
    continuarNaOficina(s, labels);
    const p = readProgress();
    expect(p.modoEdicao).toBe(false);
    expect(p.partes?.map((x) => x.tipo)).toEqual(["introducao", "ponto", "aplicacao", "conclusao"]);
  });

  it("na folha: editar uma parte e acrescentar anotação", () => {
    const partes = resultadoParaPartes(resultado);
    const onChange = vi.fn();
    const { rerender } = render(<FolhaPartes partes={partes} labels={labels} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "＋ Anotação: A fé enxerga" }));
    const comNota = onChange.mock.calls.at(-1)![0];
    expect(comNota[1].anotacoes).toEqual([""]);
    rerender(<FolhaPartes partes={comNota} labels={labels} onChange={onChange} />);
    const campo = screen.getByPlaceholderText("Escreva sua anotação…");
    expect(campo).toHaveFocus();
    fireEvent.change(campo, { target: { value: "Contar a história" } });
    expect(onChange.mock.calls.at(-1)![0][1].anotacoes).toEqual(["Contar a história"]);

    fireEvent.click(screen.getByRole("button", { name: "Editar esta parte: Introdução" }));
    expect(onChange).toHaveBeenCalled();
  });

  it("Oficina: anotação feita na folha vai para Meus Esboços (texto e partes)", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ titulo: "A fé", textoBase: "", tema: "", tipo: "", tempoIdx: [2], resultado, conteudoEditavel: "", modoEdicao: false }));
    render(
      <BrowserRouter>
        <OficinaPage />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "＋ Anotação: Introdução" }));
    fireEvent.change(screen.getByPlaceholderText("Escreva sua anotação…"), { target: { value: "Ler o salmo de pé" } });
    fireEvent.click(screen.getByRole("button", { name: /Concluir/ }));
    expect(screen.getByText("Ler o salmo de pé")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    const [salvo] = readSermoes();
    expect(salvo.conteudo).toContain("✎ Ler o salmo de pé");
    expect(salvo.partes?.[0].anotacoes).toEqual(["Ler o salmo de pé"]);
  });

  it("Oficina: o texto corrido continua disponível e volta para a folha sem perder a edição", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ titulo: "A fé", textoBase: "", tema: "", tipo: "", tempoIdx: [2], resultado, conteudoEditavel: "", modoEdicao: false }));
    render(
      <BrowserRouter>
        <OficinaPage />
      </BrowserRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar texto" }));
    const area = screen.getByRole("textbox", { name: "Editar texto" }) as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: area.value.replace("Aplique.", "Aplique hoje mesmo.") } });
    fireEvent.click(screen.getByRole("button", { name: /Editar na folha/ }));
    expect(screen.getByText("Aplique hoje mesmo.")).toBeInTheDocument();
    expect(readProgress().partes?.find((p) => p.tipo === "aplicacao")?.texto).toBe("Aplique hoje mesmo.");
  });
});
