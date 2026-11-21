import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsSection from "@/components/admin/NotificationsSection";

/* Tela da Central de mensagens com tradução: escrever em pt-BR, marcar idiomas, a tradução sai sozinha
   (1,5 s depois), editar, e o envio sai um por idioma, cada um com o seu texto e a sua confirmação. */

const ESPERA = { timeout: 4000 };

type Corpo = Record<string, unknown> & { acao: string };
const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (nome: string, o: { body: Corpo }) => invoke(nome, o.body) } },
}));
vi.mock("@/lib/firebase-config", () => ({ firebaseConfigurado: () => true }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}

const PESSOAS: Record<string, number> = { "pt-BR": 5, en: 2, de: 1, outros: 3 };
let falharTraducao = false;
let deMudou = false; // 1ª vez que o alemão é enviado, o público mudou no meio (409)

function servidor(_nome: string, b: Corpo) {
  const ok = (d: Record<string, unknown>) => Promise.resolve({ data: { ok: true, ...d }, error: null });
  switch (b.acao) {
    case "status": return ok({ configurado: true, projeto: "ferramentas-do-cristao", aparelhos: 11 });
    case "historico": return ok({ envios: [] });
    case "contar": {
      const p = b.publico as { tipo: string; idiomas?: string[]; foraIdiomas?: string[] };
      const n = p.tipo === "email" ? 1 : p.foraIdiomas ? PESSOAS.outros : PESSOAS[p.idiomas?.[0] ?? ""] ?? 0;
      return ok({ pessoas: n, aparelhos: n, rotulo: "Todos com acesso" });
    }
    case "traduzir":
      if (falharTraducao) return Promise.resolve({ data: { ok: false, error: "traducao_falhou" }, error: null });
      return ok({
        cache: false,
        traducoes: Object.fromEntries((b.idiomas as string[]).map((l) => [l, { titulo: `[${l}] ${b.titulo}`, texto: `[${l}] ${b.texto}` }])),
      });
    case "enviar":
      if (deMudou && (b.publico as { idiomas?: string[] }).idiomas?.[0] === "de") {
        deMudou = false;
        return Promise.resolve({ data: { ok: false, error: "confirmacao_diferente", pessoas: 1, aparelhos: 1 }, error: null });
      }
      return ok({ envio: 1, enviados: b.confirmar, falhas: 0, removidos: 0, status: "enviado" });
  }
  return Promise.resolve({ data: { ok: false, error: "acao_desconhecida" }, error: null });
}

const chamadas = (acao: string) => invoke.mock.calls.map((c) => c[1] as Corpo).filter((b) => b.acao === acao);

async function montar() {
  render(<NotificationsSection creds={{ _admin_email: "dono@fc.com", _admin_password: "" }} onUnauthorized={() => {}} />);
  await screen.findByText(/Firebase pronto/);
  fireEvent.change(screen.getByLabelText("Título em português"), { target: { value: "Rute no mapa" } });
  fireEvent.change(screen.getByLabelText("Mensagem em português"), { target: { value: "Toque para abrir 🙏" } });
  fireEvent.click(screen.getByLabelText("Todos com acesso"));
}

describe("Central de mensagens · tradução", () => {
  beforeEach(() => { invoke.mockReset(); invoke.mockImplementation(servidor); falharTraducao = false; deMudou = false; });
  afterEach(cleanup);

  it("traduz numa chamada só, mostra campos editáveis e envia um por idioma no texto certo", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByLabelText("Alemão"));

    // Sem tocar em nada: a tradução automática faz uma chamada só para os dois idiomas.
    await waitFor(() => expect(screen.getByLabelText("Título em Inglês")).toHaveValue("[en] Rute no mapa"), ESPERA);
    const tituloEn = screen.getByLabelText("Título em Inglês");
    expect(chamadas("traduzir")).toHaveLength(1);
    expect(chamadas("traduzir")[0]).toMatchObject({ titulo: "Rute no mapa", idiomas: ["en", "de"] });

    // O dono corrige a versão em inglês antes de enviar.
    fireEvent.change(tituloEn, { target: { value: "Ruth is on the map" } });

    // Prévia por idioma.
    fireEvent.click(screen.getByRole("button", { name: "de" }));
    expect(screen.getAllByText("[de] Rute no mapa").length).toBeGreaterThan(0);

    await waitFor(() => expect(screen.getByTestId("push-contagem")).toHaveTextContent("Vai para 8 pessoa(s)"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    const dialogo = await screen.findByRole("alertdialog");
    expect(dialogo).toHaveTextContent("Tem certeza? Vai para 8 pessoa(s).");
    fireEvent.click(within(dialogo).getByRole("button", { name: /Sim, enviar para 8/ }));

    await waitFor(() => expect(chamadas("enviar")).toHaveLength(3));
    const envios = chamadas("enviar");
    expect(envios.map((e) => (e.publico as { idiomas: string[] }).idiomas)).toEqual([["pt-BR"], ["en"], ["de"]]);
    expect(envios[0]).toMatchObject({ titulo: "Rute no mapa", texto: "Toque para abrir 🙏", confirmar: 5 });
    expect(envios[1]).toMatchObject({ titulo: "Ruth is on the map", confirmar: 2 });
    expect(envios[2]).toMatchObject({ titulo: "[de] Rute no mapa", confirmar: 1 });
    expect(new Set(envios.map((e) => e.chave)).size).toBe(3);
  });

  it("mesmo texto + mesmos idiomas: 'Traduzir de novo' não chama a tradução outra vez", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    await screen.findByLabelText("Título em Inglês", {}, ESPERA);
    fireEvent.click(screen.getByRole("button", { name: /Traduzir de novo \(1 idioma/ }));
    await waitFor(() => expect(screen.getByLabelText("Título em Inglês")).toHaveValue("[en] Rute no mapa"));
    expect(chamadas("traduzir")).toHaveLength(1);
  });

  it("tradução falhou: erro claro, campos vazios e nada sai até o dono escrever", async () => {
    falharTraducao = true;
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    expect(await screen.findByRole("alert", {}, ESPERA)).toHaveTextContent("A tradução não respondeu.");
    expect(screen.getByLabelText("Título em Inglês")).toHaveValue("");
    await waitFor(() => expect(screen.getByTestId("push-erros-lote")).toHaveTextContent("Inglês: Escreva o título."));
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Título em Inglês"), { target: { value: "Ruth" } });
    fireEvent.change(screen.getByLabelText("Mensagem em Inglês"), { target: { value: "Tap to open" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
  });

  it("idioma não marcado não recebe; 'outros em português' manda a versão pt-BR para eles", async () => {
    await montar();
    await waitFor(() => expect(screen.getByTestId("push-contagem")).toHaveTextContent("Vai para 5 pessoa(s)"));
    fireEvent.click(screen.getByLabelText("Enviar em português para quem usa os outros idiomas"));
    await waitFor(() => expect(screen.getByTestId("push-contagem")).toHaveTextContent("Vai para 8 pessoa(s)"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Sim, enviar/ }));
    await waitFor(() => expect(chamadas("enviar")).toHaveLength(2));
    const [pt, outros] = chamadas("enviar");
    expect(pt.publico).toMatchObject({ idiomas: ["pt-BR"] });
    expect(outros).toMatchObject({ titulo: "Rute no mapa", publico: { foraIdiomas: ["pt-BR"] }, confirmar: 3 });
  });

  it("mudou o português depois de traduzir: bloqueia o envio e traduz de novo sozinho", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    await screen.findByLabelText("Título em Inglês", {}, ESPERA);
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Título em português"), { target: { value: "Rute e Noemi" } });
    expect(await screen.findByText(/mudou o texto em português depois de traduzir/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    await waitFor(() => expect(screen.getByLabelText("Título em Inglês")).toHaveValue("[en] Rute e Noemi"), ESPERA);
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
    expect(chamadas("traduzir")).toHaveLength(2);
  });

  it("marcou um idioma a mais: traduz só o novo e não apaga a correção feita à mão", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    await screen.findByLabelText("Título em Inglês", {}, ESPERA);
    fireEvent.change(screen.getByLabelText("Título em Inglês"), { target: { value: "Ruth is on the map" } });
    fireEvent.click(screen.getByLabelText("Alemão"));
    await waitFor(() => expect(screen.getByLabelText("Título em Alemão")).toHaveValue("[de] Rute no mapa"), ESPERA);
    expect(screen.getByLabelText("Título em Inglês")).toHaveValue("Ruth is on the map");
    expect(chamadas("traduzir")[1]).toMatchObject({ idiomas: ["de"] });
  });

  it("parou no meio: confirmar de novo manda só o idioma que faltou, com a mesma chave", async () => {
    deMudou = true;
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByLabelText("Alemão"));
    await screen.findByLabelText("Título em Alemão", {}, ESPERA);
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Sim, enviar/ }));
    await waitFor(() => expect(chamadas("enviar")).toHaveLength(3));
    await waitFor(() => expect(screen.getByTestId("push-contagem")).toHaveTextContent("Inglês: já enviado"));
    expect(screen.getByTestId("push-contagem")).toHaveTextContent("Vai para 1 pessoa(s)");

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: /Sim, enviar para 1/ }));
    await waitFor(() => expect(chamadas("enviar")).toHaveLength(4));
    const envios = chamadas("enviar");
    expect((envios[3].publico as { idiomas: string[] }).idiomas).toEqual(["de"]);
    expect(envios[3].chave).toBe(envios[2].chave);
  });

  it("desmarcou, mudou o português e remarcou: o idioma é traduzido do texto novo, não volta o antigo", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByLabelText("Alemão"));
    await waitFor(() => expect(screen.getByLabelText("Título em Alemão")).toHaveValue("[de] Rute no mapa"), ESPERA);
    fireEvent.click(screen.getByLabelText("Alemão"));
    fireEvent.change(screen.getByLabelText("Título em português"), { target: { value: "Rute e Noemi" } });
    await waitFor(() => expect(screen.getByLabelText("Título em Inglês")).toHaveValue("[en] Rute e Noemi"), ESPERA);
    fireEvent.click(screen.getByLabelText("Alemão"));
    await waitFor(() => expect(screen.getByLabelText("Título em Alemão")).toHaveValue("[de] Rute e Noemi"), ESPERA);
  });
});
