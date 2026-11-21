import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsSection from "@/components/admin/NotificationsSection";

/* Tela da Central de mensagens com tradução: escrever em pt-BR, marcar idiomas, Traduzir, editar,
   e o envio sai um por idioma, cada um com o seu texto e a sua confirmação. */

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
    case "enviar": return ok({ envio: 1, enviados: b.confirmar, falhas: 0, removidos: 0, status: "enviado" });
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
  beforeEach(() => { invoke.mockReset(); invoke.mockImplementation(servidor); falharTraducao = false; });
  afterEach(cleanup);

  it("traduz numa chamada só, mostra campos editáveis e envia um por idioma no texto certo", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByLabelText("Alemão"));
    fireEvent.click(screen.getByRole("button", { name: /Traduzir para 2 idioma/ }));

    const tituloEn = await screen.findByLabelText("Título em Inglês");
    expect(tituloEn).toHaveValue("[en] Rute no mapa");
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

  it("mesmo texto + mesmos idiomas: não chama a tradução de novo", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    const botao = screen.getByRole("button", { name: /Traduzir para 1 idioma/ });
    fireEvent.click(botao);
    await screen.findByLabelText("Título em Inglês");
    fireEvent.click(botao);
    await waitFor(() => expect(screen.getByLabelText("Título em Inglês")).toHaveValue("[en] Rute no mapa"));
    expect(chamadas("traduzir")).toHaveLength(1);
  });

  it("tradução falhou: erro claro, campos vazios e nada sai até o dono escrever", async () => {
    falharTraducao = true;
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByRole("button", { name: /Traduzir para 1 idioma/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A tradução não respondeu.");
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

  it("mudou o português depois de traduzir: pede para traduzir de novo antes de enviar", async () => {
    await montar();
    fireEvent.click(screen.getByLabelText("Inglês"));
    fireEvent.click(screen.getByRole("button", { name: /Traduzir para 1 idioma/ }));
    await screen.findByLabelText("Título em Inglês");
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Título em português"), { target: { value: "Rute e Noemi" } });
    expect(await screen.findByText(/mudou o texto em português depois de traduzir/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "As versões continuam certas" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled());
  });
});
