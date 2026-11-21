import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { deflateRawSync } from "node:zlib";
import "@/i18n";
import i18n from "i18next";
import { FontSizeProvider } from "@/hooks/use-font-size";
import BibliaPage from "@/pages/BibliaPage";
import { clearBibleChapterCache, fetchBibleChapter } from "@/lib/content-api";
import { extractFirstJson, readZipEntries } from "@/lib/bible-offline/zip";
import { buildTranslation } from "@/lib/bible-offline/build";
import { createMemoryBackend } from "@/lib/bible-offline/store";
import { ONLINE_ONLY_VERSIONS, bibleDownloadUrl, createOfflineManager, setOfflineBibleManager } from "@/lib/bible-offline/manager";
import { VERSIONS_BY_LANG } from "@/data/bible-versions";

/** ZIP de um arquivo só, igual ao do bolls.life (deflate, tamanhos no diretório central). */
function makeZip(name: string, content: string, method: 0 | 8 = 8): Uint8Array {
  const raw = new TextEncoder().encode(content);
  const data = method === 8 ? new Uint8Array(deflateRawSync(raw)) : raw;
  const nameBytes = new TextEncoder().encode(name);
  const local = new Uint8Array(30 + nameBytes.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true);
  lv.setUint16(8, method, true);
  lv.setUint32(18, data.length, true);
  lv.setUint32(22, raw.length, true);
  lv.setUint16(26, nameBytes.length, true);
  local.set(nameBytes, 30);
  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint16(10, method, true);
  cv.setUint32(20, data.length, true);
  cv.setUint32(24, raw.length, true);
  cv.setUint16(28, nameBytes.length, true);
  cv.setUint32(42, 0, true);
  central.set(nameBytes, 46);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, local.length + data.length, true);
  const out = new Uint8Array(local.length + data.length + central.length + eocd.length);
  out.set(local, 0);
  out.set(data, local.length);
  out.set(central, local.length + data.length);
  out.set(eocd, local.length + data.length + central.length);
  return out;
}

const TRADUCAO = [
  { pk: 1, translation: "ARA", book: 1, chapter: 1, verse: 2, text: "A terra era sem forma e vazia" },
  { pk: 0, translation: "ARA", book: 1, chapter: 1, verse: 1, text: "No princípio criou Deus os céus e a terra." },
  { pk: 5, translation: "ARA", book: 19, chapter: 23, verse: 1, text: "O <i>Senhor</i> é o meu pastor; nada me faltará." },
  { pk: 9, translation: "ARA", book: 67, chapter: 1, verse: 1, text: "Livro fora dos 66" },
  { pk: 10, translation: "ARA", book: 470, chapter: 16, verse: 17, text: "Número de livro errado" },
];

const semRemovidas = () => { let lista = new Set<string>(); return { get: () => new Set(lista), set: (l: Set<string>) => { lista = new Set(l); } }; };

const zipResponse = (bytes: Uint8Array) =>
  new Response(bytes, { status: 200, headers: { "Content-Length": String(bytes.length), "Content-Type": "application/zip" } });

describe("ZIP do bolls.life", () => {
  it("extrai o JSON com deflate e sem compressão", async () => {
    const json = JSON.stringify(TRADUCAO);
    expect(JSON.parse(await extractFirstJson(makeZip("ARA.json", json)))).toHaveLength(5);
    expect(await extractFirstJson(makeZip("ARA.json", json, 0))).toBe(json);
    expect(readZipEntries(makeZip("ARA.json", json))[0].name).toBe("ARA.json");
  });

  it("recusa arquivo que não é ZIP", async () => {
    await expect(extractFirstJson(new TextEncoder().encode("<html>erro</html>"))).rejects.toThrow("zip_invalido");
  });
});

describe("buildTranslation", () => {
  it("agrupa por capítulo, ordena os versículos e ignora livros fora dos 66", () => {
    const built = buildTranslation("ARA", TRADUCAO);
    expect([...built.chapters.keys()]).toEqual(["ARA|1|1", "ARA|19|23"]);
    expect(built.chapters.get("ARA|1|1")!.map((v) => v.verse)).toEqual([1, 2]);
    expect(built.verses).toBe(3);
    expect(built.bytes).toBeGreaterThan(50);
  });

  it("tradução vazia é erro", () => {
    expect(() => buildTranslation("ARA", [])).toThrow("traducao_vazia");
  });
});

describe("gerenciador da Bíblia offline", () => {
  it("baixa a versão inteira, mostra o progresso e guarda no aparelho", async () => {
    const backend = createMemoryBackend();
    const zip = makeZip("ARA.json", JSON.stringify(TRADUCAO));
    const fetchMock = vi.fn(async () => zipResponse(zip));
    const persist = vi.fn();
    const m = createOfflineManager({ backend: () => backend, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist, url: bibleDownloadUrl, removed: semRemovidas() });
    const estados: string[] = [];
    m.subscribe(() => estados.push(m.getSnapshot().versions.ARA?.status ?? "-"));
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
    expect(fetchMock).toHaveBeenCalledWith("https://bolls.life/static/translations/ARA.zip", expect.objectContaining({ cache: "no-store" }));
    expect(estados).toContain("downloading");
    expect(estados).toContain("saving");
    expect(persist).toHaveBeenCalledTimes(1);
    const state = m.getSnapshot().versions.ARA;
    expect(state?.status === "ready" && state.info).toMatchObject({ chapters: 2, verses: 3, downloadBytes: zip.length });
    expect(await m.readChapter("ARA", 19, 23)).toEqual([{ pk: 5, verse: 1, text: "O <i>Senhor</i> é o meu pastor; nada me faltará." }]);
    // Tocar de novo na mesma versão não baixa outra vez.
    await m.ensureVersion("ARA");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("um download por vez, na ordem em que a pessoa tocou", async () => {
    const backend = createMemoryBackend();
    const ordem: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      ordem.push(url);
      const v = url.split("/").pop()!.replace(".zip", "");
      return zipResponse(makeZip(`${v}.json`, JSON.stringify(TRADUCAO)));
    });
    const m = createOfflineManager({ backend: () => backend, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.ensureVersion("ARA");
    await m.ensureVersion("NAA");
    expect(m.getSnapshot().versions.NAA?.status).toBe("queued");
    await waitFor(() => expect(m.getSnapshot().versions.NAA?.status).toBe("ready"));
    expect(ordem.map((u) => u.split("/").pop())).toEqual(["ARA.zip", "NAA.zip"]);
  });

  it("sem internet não tenta baixar; com erro mostra o erro e deixa tentar de novo", async () => {
    const backend = createMemoryBackend();
    let online = false;
    const fetchMock = vi.fn(async () => new Response("x", { status: 503 }));
    const m = createOfflineManager({ backend: () => backend, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => online, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.ensureVersion("ARA");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(m.getSnapshot().versions.ARA).toBeUndefined();
    online = true;
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA).toEqual({ status: "error", reason: "network" }));
    fetchMock.mockImplementation(async () => zipResponse(makeZip("ARA.json", JSON.stringify(TRADUCAO))));
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
  });

  it("versões que o bolls.life não serve mais (NVI) não são baixadas", async () => {
    const fetchMock = vi.fn();
    const m = createOfflineManager({ backend: () => createMemoryBackend(), fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    for (const v of ONLINE_ONLY_VERSIONS) await m.ensureVersion(v);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(m.canDownload("NVIPT")).toBe(false);
    expect(m.canDownload("ARA")).toBe(true);
  });

  it("remover tira a versão do aparelho (e cancela o download em andamento)", async () => {
    const backend = createMemoryBackend();
    const m = createOfflineManager({ backend: () => backend, fetch: (async () => zipResponse(makeZip("ARA.json", JSON.stringify(TRADUCAO)))) as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
    await m.removeVersion("ARA");
    expect(m.getSnapshot().versions.ARA).toBeUndefined();
    expect(backend.chapters.size).toBe(0);
    expect(await m.readChapter("ARA", 1, 1)).toBeNull();

    // Cancelar no meio do download: nada fica guardado.
    let liberar: () => void = () => {};
    const lento = createOfflineManager({
      backend: () => backend,
      fetch: (async () => { await new Promise<void>((r) => { liberar = r; }); return zipResponse(makeZip("NAA.json", JSON.stringify(TRADUCAO))); }) as unknown as typeof fetch,
      supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas(),
    });
    await lento.ensureVersion("NAA");
    await waitFor(() => expect(lento.getSnapshot().versions.NAA?.status).toBe("downloading"));
    await lento.removeVersion("NAA");
    liberar();
    await new Promise((r) => setTimeout(r, 30));
    expect(lento.getSnapshot().versions.NAA).toBeUndefined();
    expect(backend.chapters.size).toBe(0);
  });

  it("versão tirada do celular não volta sozinha; só com um toque nela", async () => {
    const backend = createMemoryBackend();
    const fetchMock = vi.fn(async () => zipResponse(makeZip("ARA.json", JSON.stringify(TRADUCAO))));
    const m = createOfflineManager({ backend: () => backend, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.ensureVersion("ARA", { auto: true });
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
    await m.removeVersion("ARA");
    await m.ensureVersion("ARA", { auto: true });
    expect(m.getSnapshot().versions.ARA).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("economia de dados ligada: não baixa sozinho, só com toque", async () => {
    const fetchMock = vi.fn(async () => zipResponse(makeZip("ARA.json", JSON.stringify(TRADUCAO))));
    const m = createOfflineManager({ backend: () => createMemoryBackend(), fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas(), saveData: () => true });
    await m.ensureVersion("ARA", { auto: true });
    expect(fetchMock).not.toHaveBeenCalled();
    await m.ensureVersion("ARA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA?.status).toBe("ready"));
  });

  it("download parado (rede muda sem erro) vira erro e libera a fila", async () => {
    const parado = () => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1, 2, 3])); } }), { status: 200, headers: { "Content-Length": "1000" } });
    const fetchMock = vi.fn(async (url: string) => (url.endsWith("ARA.zip") ? parado() : zipResponse(makeZip("NAA.json", JSON.stringify(TRADUCAO)))));
    const m = createOfflineManager({ backend: () => createMemoryBackend(), fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas(), stallMs: 40 });
    await m.ensureVersion("ARA");
    await m.ensureVersion("NAA");
    await waitFor(() => expect(m.getSnapshot().versions.ARA).toEqual({ status: "error", reason: "network" }));
    await waitFor(() => expect(m.getSnapshot().versions.NAA?.status).toBe("ready"));
  });

  it("banco que não abre (modo privado): não baixa nada nesta sessão", async () => {
    const quebrado = { ...createMemoryBackend(), listVersions: () => Promise.reject(new Error("idb")) };
    const fetchMock = vi.fn();
    const m = createOfflineManager({ backend: () => quebrado, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.ensureVersion("ARA");
    expect(m.getSnapshot().supported).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lista as versões já guardadas ao abrir o app de novo", async () => {
    const backend = createMemoryBackend();
    const built = buildTranslation("ARA", TRADUCAO);
    await backend.putVersion({ version: "ARA", bytes: built.bytes, downloadBytes: 10, chapters: 2, verses: 3, savedAt: "2026-11-21" }, built.chapters);
    const m = createOfflineManager({ backend: () => backend, fetch: vi.fn() as unknown as typeof fetch, supported: () => true, isOnline: () => false, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() });
    await m.load();
    expect(m.getSnapshot().versions.ARA?.status).toBe("ready");
  });
});

describe("leitura: primeiro o aparelho, depois a internet", () => {
  beforeEach(() => clearBibleChapterCache());
  afterEach(() => {
    setOfflineBibleManager(null);
    vi.restoreAllMocks();
  });

  it("capítulo de versão guardada sai do aparelho sem pedir à internet", async () => {
    const backend = createMemoryBackend();
    const built = buildTranslation("ARA", TRADUCAO);
    await backend.putVersion({ version: "ARA", bytes: built.bytes, downloadBytes: 10, chapters: 2, verses: 3, savedAt: "x" }, built.chapters);
    setOfflineBibleManager(createOfflineManager({ backend: () => backend, fetch: vi.fn() as unknown as typeof fetch, supported: () => true, isOnline: () => false, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() }));
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const data = await fetchBibleChapter({ version: "ARA", bookId: 1, chapter: 1 });
    expect(data).toEqual([{ pk: 0, verse: 1, text: "No princípio criou Deus os céus e a terra." }, { pk: 1, verse: 2, text: "A terra era sem forma e vazia" }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("versão que não está no aparelho continua pela internet", async () => {
    setOfflineBibleManager(createOfflineManager({ backend: () => createMemoryBackend(), fetch: vi.fn() as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() }));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{ verse: 1, text: "online" }]), { status: 200 }));
    const data = await fetchBibleChapter({ version: "NAA", bookId: 1, chapter: 1 });
    expect(data).toEqual([{ verse: 1, text: "online" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("tela da Bíblia sem internet", () => {
  let onLine: PropertyDescriptor | undefined;
  beforeEach(async () => {
    localStorage.clear();
    clearBibleChapterCache();
    await i18n.changeLanguage("pt-BR");
    onLine = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
  });
  afterEach(() => {
    if (onLine) Object.defineProperty(Navigator.prototype, "onLine", onLine);
    setOfflineBibleManager(null);
    vi.restoreAllMocks();
  });

  const renderPage = (url: string) =>
    render(
      <FontSizeProvider>
        <MemoryRouter initialEntries={[url]}>
          <BibliaPage />
        </MemoryRouter>
      </FontSizeProvider>,
    );

  it("versão não guardada: aviso gentil e botão para ler na versão que está no celular", async () => {
    Object.defineProperty(Navigator.prototype, "onLine", { configurable: true, get: () => false });
    const backend = createMemoryBackend();
    const built = buildTranslation("NAA", TRADUCAO.map((r) => ({ ...r, translation: "NAA" })));
    await backend.putVersion({ version: "NAA", bytes: built.bytes, downloadBytes: 10, chapters: 2, verses: 3, savedAt: "x" }, built.chapters);
    setOfflineBibleManager(createOfflineManager({ backend: () => backend, fetch: vi.fn() as unknown as typeof fetch, supported: () => true, isOnline: () => false, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() }));
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    renderPage("/biblia?bookId=1&chapter=1&version=ARA");
    expect(await screen.findByText("Você está sem internet")).toBeInTheDocument();
    expect(screen.getByText(/ARA - Almeida Revista e Atualizada ainda não está salva no celular/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ler na NAA" }));
    expect(await screen.findByText("No princípio criou Deus os céus e a terra.")).toBeInTheDocument();
  });

  it("lista de versões: mostra 'No celular', o tamanho e deixa tirar do celular", async () => {
    const backend = createMemoryBackend();
    const built = buildTranslation("ARA", TRADUCAO);
    await backend.putVersion({ version: "ARA", bytes: 4_428_733, downloadBytes: 1_624_504, chapters: 2, verses: 3, savedAt: "x" }, built.chapters);
    const fetchMock = vi.fn(async () => new Promise<Response>(() => {}));
    setOfflineBibleManager(createOfflineManager({ backend: () => backend, fetch: fetchMock as unknown as typeof fetch, supported: () => true, isOnline: () => true, persist: () => {}, url: bibleDownloadUrl, removed: semRemovidas() }));

    renderPage("/biblia?bookId=1&chapter=1&version=ARA");
    expect(await screen.findByText("No princípio criou Deus os céus e a terra.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Versão: ARA/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(VERSIONS_BY_LANG["pt-BR"].length);
    expect(within(dialog).getByText(/No celular ✓ · 4,4 MB/)).toBeInTheDocument();
    expect(within(dialog).getByText(/1 versão no celular · 4,4 MB/)).toBeInTheDocument();

    // Tocar noutra versão já começa a guardar (sem botão "baixar").
    fireEvent.click(within(dialog).getByRole("button", { name: /NAA - Nova Almeida Atualizada/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("https://bolls.life/static/translations/NAA.zip", expect.anything()));

    fireEvent.click(screen.getByRole("button", { name: /Versão: NAA/ }));
    const dialog2 = await screen.findByRole("dialog");
    fireEvent.click(within(dialog2).getByRole("button", { name: "Tirar ARA - Almeida Revista e Atualizada do celular" }));
    fireEvent.click(within(dialog2).getByRole("button", { name: "Tirar do celular" }));
    await waitFor(() => expect(backend.chapters.size).toBe(0));
    expect(within(dialog2).queryByText(/No celular ✓/)).not.toBeInTheDocument();
  });
});
