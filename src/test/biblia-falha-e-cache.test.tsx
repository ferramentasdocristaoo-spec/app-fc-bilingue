import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";
import i18n from "i18next";
import { FontSizeProvider } from "@/hooks/use-font-size";
import BibliaPage from "@/pages/BibliaPage";
import * as contentApi from "@/lib/content-api";

const { fetchBibleChapter, clearBibleChapterCache } = contentApi;

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
const status = (code: number) => new Response(JSON.stringify({ error: "x" }), { status: code });

describe("fetchBibleChapter: 429 do provedor e cache da sessão", () => {
  beforeEach(() => clearBibleChapterCache());
  afterEach(() => vi.restoreAllMocks());

  it("tenta de novo quando o bolls.life responde 429 e devolve o capítulo", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(status(429))
      .mockResolvedValueOnce(ok([{ verse: 1, text: "O Senhor é o meu pastor" }]));
    const data = await fetchBibleChapter({ version: "NVIPT", bookId: 19, chapter: 23 }, { retryDelaysMs: [1] });
    expect(data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("desiste depois das tentativas e não tenta de novo em 404", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => status(429));
    await expect(fetchBibleChapter({ version: "ARA", bookId: 1, chapter: 1 }, { retryDelaysMs: [1, 1] })).rejects.toThrow("bible_http_429");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockClear();
    fetchMock.mockImplementation(async () => status(404));
    await expect(fetchBibleChapter({ version: "XYZ", bookId: 1, chapter: 1 }, { retryDelaysMs: [1, 1] })).rejects.toThrow("bible_http_404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("o mesmo capítulo na mesma versão sai do cache, sem novo pedido", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => ok([{ verse: 1, text: "No princípio" }]));
    await fetchBibleChapter({ version: "ARA", bookId: 1, chapter: 1 });
    await fetchBibleChapter({ version: "ARA", bookId: 1, chapter: 1 });
    await fetchBibleChapter({ version: "ACF11", bookId: 1, chapter: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lista vazia conta como erro (não guarda no cache)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => ok([]));
    await expect(fetchBibleChapter({ version: "ARA", bookId: 1, chapter: 2 })).rejects.toThrow("bible_invalid_response");
  });
});

describe("Bíblia: falha ao carregar não deixa o texto anterior na tela", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("pt-BR");
  });
  afterEach(() => vi.restoreAllMocks());

  it("capítulo seguinte com erro mostra o aviso, não o capítulo anterior com o título novo", async () => {
    vi.spyOn(contentApi, "fetchBibleChapter")
      .mockResolvedValueOnce([{ pk: 1, verse: 1, text: "O Senhor é o meu pastor; nada me faltará." }])
      .mockRejectedValueOnce(new Error("bible_http_429"));
    render(
      <MemoryRouter initialEntries={["/biblia?bookId=19&chapter=23"]}>
        <FontSizeProvider><BibliaPage /></FontSizeProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/o meu pastor/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Próximo capítulo/i })[0]);
    await waitFor(() => expect(screen.queryByText(/o meu pastor/i)).not.toBeInTheDocument());
    expect(await screen.findByText(i18n.t("biblia.errorMessage"))).toBeInTheDocument();
  });
});
