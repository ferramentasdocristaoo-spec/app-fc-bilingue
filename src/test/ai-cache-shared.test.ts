import { describe, expect, it, vi } from "vitest";
import {
  BRASIL_TIMEOUT_MS,
  CACHE_TTL_MS,
  SHARED_ACTIONS,
  brasilCacheKey,
  isBrasilLanguage,
  localCacheKey,
  readSharedCache,
  usesBrasilCache,
  writeSharedCache,
  type CacheStore,
} from "../../supabase/functions/ai-assistant/shared-cache";

/** Fórmula literal da função ai-assistant do FC Brasil (payload sem idioma). */
const chaveFcBrasil = (payload: Record<string, unknown>) => JSON.stringify(payload, Object.keys(payload).sort());

/** Payloads exatamente como as páginas dos dois apps mandam (o bilíngue acrescenta `lang` no hook). */
const PAYLOADS_BRASIL: Record<string, Record<string, string>> = {
  "raio-x": { referencia: "João 3:16" },
  "nomes": { nome: "Débora" },
  "devocional": { tema: "Esperança em meio à dor" },
  "garimpo": { categoria: "Promessas de provisão" },
  "gerar-esboco": { titulo: "A fé que vence", textoBase: "Hebreus 11:1-6", tema: "Fé", tipo: "Expositivo", tempo: "15 minutos" },
};

describe("chave do cache compartilhado com o FC Brasil", () => {
  it("em pt-BR, a chave do Brasil é igual à que a função do FC Brasil gera (payload sem lang)", () => {
    for (const [action, payload] of Object.entries(PAYLOADS_BRASIL)) {
      const doBilingue = { ...payload, lang: "pt-BR" };
      expect(brasilCacheKey(doBilingue), action).toBe(chaveFcBrasil(payload));
    }
  });

  it("a chave local continua a antiga do bilíngue (com lang, chaves ordenadas)", () => {
    const payload = { referencia: "João 3:16", lang: "pt-BR" };
    expect(localCacheKey(payload)).toBe('{"lang":"pt-BR","referencia":"João 3:16"}');
    expect(localCacheKey(payload)).toBe(JSON.stringify(payload, Object.keys(payload).sort()));
  });

  it("a ordem das chaves do payload não muda a chave", () => {
    const a = brasilCacheKey({ lang: "pt-BR", tipo: "Temático", titulo: "X", tema: "Y", textoBase: "Z", tempo: "30 minutos" });
    const b = brasilCacheKey({ titulo: "X", tema: "Y", textoBase: "Z", tipo: "Temático", tempo: "30 minutos", lang: "pt-BR" });
    expect(a).toBe(b);
    expect(a).toBe('{"tema":"Y","tempo":"30 minutos","textoBase":"Z","tipo":"Temático","titulo":"X"}');
  });

  it("a chave do Brasil não leva idioma, então pt-BR e um pedido igual do FC Brasil batem", () => {
    expect(brasilCacheKey({ referencia: "Sl 23", lang: "pt-BR" })).toBe(chaveFcBrasil({ referencia: "Sl 23" }));
    expect(brasilCacheKey({ referencia: "Sl 23", lang: "pt-BR" })).not.toContain("lang");
  });

  it("TTL de 30 dias, igual ao dos dois projetos", () => {
    expect(CACHE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(BRASIL_TIMEOUT_MS).toBeGreaterThan(0);
  });
});

describe("quem usa o cache do Brasil", () => {
  it("pt-BR em qualquer grafia; os outros idiomas não", () => {
    for (const l of ["pt-BR", "pt-br", "pt_BR", " pt-BR "]) expect(isBrasilLanguage(l), l).toBe(true);
    for (const l of ["pt-PT", "pt", "en", "es", "", undefined, null, 7]) expect(isBrasilLanguage(l), String(l)).toBe(false);
  });

  it("só as 5 ações que existem no FC Brasil; Jornada (só do bilíngue) fica no cache local", () => {
    expect([...SHARED_ACTIONS]).toEqual(["gerar-esboco", "raio-x", "devocional", "garimpo", "nomes"]);
    for (const action of SHARED_ACTIONS) expect(usesBrasilCache(action, "pt-BR"), action).toBe(true);
    expect(usesBrasilCache("jornada-capitulo", "pt-BR")).toBe(false);
    expect(usesBrasilCache("raio-x", "pt-PT")).toBe(false);
    expect(usesBrasilCache("raio-x", "en")).toBe(false);
  });
});

const store = (name: string, impl: Partial<CacheStore> = {}): CacheStore => ({
  name,
  read: vi.fn(async () => null),
  write: vi.fn(async () => undefined),
  ...impl,
});

describe("leitura com reserva: falha no Brasil nunca derruba a resposta", () => {
  const RESULTADO = { titulo: "ok" };

  it("acerto no Brasil vem do Brasil e nem consulta o local", async () => {
    const brasil = store("fc-brasil", { read: vi.fn(async () => RESULTADO) });
    const local = store("local");
    const hit = await readSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "raio-x");
    expect(hit).toEqual({ result: RESULTADO, source: "fc-brasil" });
    expect(local.read).not.toHaveBeenCalled();
    expect(brasil.read).toHaveBeenCalledWith("raio-x", "b");
  });

  it("Brasil sem a chave cai no local", async () => {
    const brasil = store("fc-brasil");
    const local = store("local", { read: vi.fn(async () => RESULTADO) });
    const hit = await readSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "raio-x");
    expect(hit).toEqual({ result: RESULTADO, source: "local" });
    expect(local.read).toHaveBeenCalledWith("raio-x", "l");
  });

  it("Brasil com erro registra e cai no local", async () => {
    const log = vi.fn();
    const brasil = store("fc-brasil", { read: vi.fn(async () => { throw new Error("projeto pausado"); }) });
    const local = store("local", { read: vi.fn(async () => RESULTADO) });
    const hit = await readSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "raio-x", { log });
    expect(hit).toEqual({ result: RESULTADO, source: "local" });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain("fc-brasil");
    expect(log.mock.calls[0][0]).toContain("projeto pausado");
  });

  it("Brasil demorando além do limite cai no local", async () => {
    const log = vi.fn();
    const brasil = store("fc-brasil", { read: vi.fn(() => new Promise(() => { /* nunca responde */ })) });
    const local = store("local", { read: vi.fn(async () => RESULTADO) });
    const hit = await readSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "raio-x", { timeoutMs: 20, log });
    expect(hit).toEqual({ result: RESULTADO, source: "local" });
    expect(log.mock.calls[0][0]).toMatch(/tempo esgotado/);
  });

  it("sem Brasil (outros idiomas ou secrets ausentes) usa só o local", async () => {
    const local = store("local", { read: vi.fn(async () => RESULTADO) });
    const hit = await readSharedCache({ brasil: null, local: { store: local, key: "l" } }, "raio-x");
    expect(hit).toEqual({ result: RESULTADO, source: "local" });
  });

  it("nenhum acerto devolve null, e erro no local também não estoura", async () => {
    const local = store("local", { read: vi.fn(async () => { throw new Error("x"); }) });
    expect(await readSharedCache({ brasil: null, local: { store: local, key: "l" } }, "raio-x")).toBeNull();
    expect(await readSharedCache({ brasil: { store: store("fc-brasil"), key: "b" }, local: { store: store("local"), key: "l" } }, "raio-x")).toBeNull();
  });
});

describe("gravação nos dois caches", () => {
  it("grava no Brasil e no local com as respectivas chaves", async () => {
    const brasil = store("fc-brasil");
    const local = store("local");
    const gravados = await writeSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "nomes", { a: 1 }, "2026-12-14T00:00:00.000Z");
    expect(gravados).toEqual(["fc-brasil", "local"]);
    expect(brasil.write).toHaveBeenCalledWith("nomes", "b", { a: 1 }, "2026-12-14T00:00:00.000Z");
    expect(local.write).toHaveBeenCalledWith("nomes", "l", { a: 1 }, "2026-12-14T00:00:00.000Z");
  });

  it("falha no Brasil não impede a gravação local nem estoura", async () => {
    const log = vi.fn();
    const brasil = store("fc-brasil", { write: vi.fn(async () => { throw new Error("sem permissão"); }) });
    const local = store("local");
    const gravados = await writeSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "nomes", {}, "2026-12-14T00:00:00.000Z", { log });
    expect(gravados).toEqual(["local"]);
    expect(log.mock.calls[0][0]).toContain("sem permissão");
  });

  it("sem Brasil grava só no local", async () => {
    const local = store("local");
    expect(await writeSharedCache({ brasil: null, local: { store: local, key: "l" } }, "nomes", {}, "x")).toEqual(["local"]);
  });
});

describe("gravação: o limite de tempo é só do Brasil", () => {
  it("Brasil travado estoura o limite, mas o local lento é aguardado e gravado", async () => {
    const log = vi.fn();
    const brasil = store("fc-brasil", { write: vi.fn(() => new Promise<void>(() => { /* nunca responde */ })) });
    const local = store("local", { write: vi.fn(() => new Promise<void>((ok) => setTimeout(ok, 60))) });
    const gravados = await writeSharedCache({ brasil: { store: brasil, key: "b" }, local: { store: local, key: "l" } }, "nomes", {}, "x", { timeoutMs: 20, log });
    expect(gravados).toEqual(["local"]);
    expect(log.mock.calls[0][0]).toMatch(/fc-brasil.*tempo esgotado/);
  });
});
