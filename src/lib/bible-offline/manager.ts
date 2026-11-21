import { buildTranslation } from "./build";
import { getOfflineBackend, type OfflineBibleBackend, type OfflineVersionInfo, type RawVerse } from "./store";
import { extractFirstJson, zipSupported } from "./zip";

/**
 * Bíblia offline: ao tocar numa versão ela é baixada inteira (um ZIP do bolls.life, ~0,4–4,5 MB),
 * guardada no IndexedDB e daí em diante lida do aparelho. Gratuita: sem cobrança nem propaganda.
 *
 * Um download por vez (fila). O estado é global (sobrevive à troca de página dentro do app)
 * e a tela lê com useOfflineBible().
 */

/**
 * Versões que o bolls.life não serve mais: o arquivo completo e o get-text trazem, em todos os
 * versículos, um aviso de que a Biblica proibiu o uso da NVI/NIV (conferido em 21/11/2026).
 * Baixar seriam ~50 MB repetindo o aviso; ficam só pela internet até o dono decidir (ver PENDENTE).
 */
export const ONLINE_ONLY_VERSIONS = new Set(["NVIPT", "NIV2011", "NVI"]);

type Env = Record<string, string | undefined>;

export function bibleDownloadUrl(version: string, env: Env = import.meta.env as Env): string {
  const base = (env.VITE_BIBLE_OFFLINE_BASE ?? "").trim().replace(/\/+$/, "") || "https://bolls.life/static/translations";
  return `${base}/${encodeURIComponent(version)}.zip`;
}

export type VersionState =
  | { status: "queued" }
  | { status: "downloading"; progress: number | null }
  | { status: "saving" }
  | { status: "ready"; info: OfflineVersionInfo }
  | { status: "error"; reason: "network" | "quota" | "invalid" };

export type OfflineSnapshot = {
  /** Lista do aparelho já lida (antes disso não dá para dizer o que está guardado). */
  loaded: boolean;
  /** IndexedDB + descompressão disponíveis neste navegador. */
  supported: boolean;
  versions: Readonly<Record<string, VersionState>>;
};

type Listener = () => void;

export type OfflineManagerDeps = {
  backend: () => OfflineBibleBackend | null;
  fetch: typeof fetch;
  supported: () => boolean;
  isOnline: () => boolean;
  persist: () => void;
  url: (version: string) => string;
};

const defaultDeps = (): OfflineManagerDeps => ({
  backend: getOfflineBackend,
  fetch: (input, init) => fetch(input, init),
  supported: () => getOfflineBackend() !== null && zipSupported(),
  isOnline: () => typeof navigator === "undefined" || navigator.onLine !== false,
  persist: () => {
    // Pede ao navegador para não apagar sozinho (o Safari do iPhone limpa sites pouco usados).
    try { void navigator.storage?.persist?.(); } catch { /* sem suporte */ }
  },
  url: (version) => bibleDownloadUrl(version),
});

/** Leitura no IndexedDB não pode travar a Bíblia: passou disso, vai pela internet. */
const READ_TIMEOUT_MS = 2500;

export function createOfflineManager(overrides: Partial<OfflineManagerDeps> = {}) {
  const deps = { ...defaultDeps(), ...overrides };
  let snapshot: OfflineSnapshot = { loaded: false, supported: deps.supported(), versions: {} };
  const listeners = new Set<Listener>();
  const queue: string[] = [];
  let running: { version: string; controller: AbortController } | null = null;
  let loadPromise: Promise<void> | null = null;
  let persistAsked = false;

  const emit = () => listeners.forEach((l) => l());
  const setVersion = (version: string, state: VersionState | null) => {
    const versions = { ...snapshot.versions };
    if (state) versions[version] = state;
    else delete versions[version];
    snapshot = { ...snapshot, versions };
    emit();
  };

  function load(): Promise<void> {
    if (loadPromise) return loadPromise;
    const backend = deps.backend();
    if (!backend || !snapshot.supported) {
      snapshot = { ...snapshot, loaded: true };
      emit();
      return (loadPromise = Promise.resolve());
    }
    loadPromise = backend.listVersions().then(
      (list) => {
        const versions = { ...snapshot.versions };
        for (const info of list) if (!versions[info.version]) versions[info.version] = { status: "ready", info };
        snapshot = { ...snapshot, loaded: true, versions };
        emit();
      },
      () => {
        snapshot = { ...snapshot, loaded: true };
        emit();
      },
    );
    return loadPromise;
  }

  async function download(version: string, controller: AbortController) {
    const backend = deps.backend();
    if (!backend) throw new Error("sem_banco");
    const aborted = () => controller.signal.aborted;
    // Removida no meio do caminho: nenhum estado novo volta para a tela.
    const set = (state: VersionState) => { if (!aborted()) setVersion(version, state); };
    set({ status: "downloading", progress: 0 });
    // Sem cache HTTP: o arquivo já vai ficar no IndexedDB, não precisa de uma segunda cópia.
    const res = await deps.fetch(deps.url(version), { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw Object.assign(new Error(`http_${res.status}`), { reason: "network" as const });
    const total = Number(res.headers.get("Content-Length")) || 0;
    let bytes: Uint8Array;
    if (res.body && typeof res.body.getReader === "function") {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      let lastPercent = -1;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (aborted()) { void reader.cancel().catch(() => {}); throw new DOMException("aborted", "AbortError"); }
        chunks.push(value);
        received += value.length;
        const percent = total ? Math.min(99, Math.floor((received / total) * 100)) : null;
        if (percent !== lastPercent) {
          lastPercent = percent ?? -1;
          set({ status: "downloading", progress: percent });
        }
      }
      bytes = new Uint8Array(received);
      let at = 0;
      for (const c of chunks) { bytes.set(c, at); at += c.length; }
    } else {
      bytes = new Uint8Array(await res.arrayBuffer());
    }
    if (aborted()) throw new DOMException("aborted", "AbortError");
    set({ status: "saving" });
    let built;
    try {
      built = buildTranslation(version, JSON.parse(await extractFirstJson(bytes)));
    } catch {
      throw Object.assign(new Error("invalido"), { reason: "invalid" as const });
    }
    const info: OfflineVersionInfo = {
      version,
      bytes: built.bytes,
      downloadBytes: bytes.length,
      chapters: built.chapters.size,
      verses: built.verses,
      savedAt: new Date().toISOString(),
    };
    if (controller.signal.aborted) throw new DOMException("aborted", "AbortError");
    await backend.putVersion(info, built.chapters);
    // Removida enquanto gravava? Apaga de novo.
    if (controller.signal.aborted) {
      await backend.deleteVersion(version).catch(() => {});
      throw new DOMException("aborted", "AbortError");
    }
    set({ status: "ready", info });
  }

  async function pump() {
    if (running) return;
    const version = queue.shift();
    if (!version) return;
    const controller = new AbortController();
    running = { version, controller };
    try {
      await download(version, controller);
    } catch (e) {
      if (!controller.signal.aborted) {
        const err = e as { name?: string; reason?: "network" | "quota" | "invalid" };
        const reason = err?.reason ?? (err?.name === "QuotaExceededError" ? "quota" : "network");
        setVersion(version, { status: "error", reason });
      }
    } finally {
      running = null;
      void pump();
    }
  }

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    load,

    canDownload: (version: string) => snapshot.supported && !ONLINE_ONLY_VERSIONS.has(version),

    /** Baixa a versão se ainda não está no aparelho (sem internet não faz nada). */
    async ensureVersion(version: string) {
      if (!snapshot.supported || ONLINE_ONLY_VERSIONS.has(version)) return;
      await load();
      const state = snapshot.versions[version];
      if (state && state.status !== "error") return;
      if (!deps.isOnline()) return;
      if (!persistAsked) { persistAsked = true; deps.persist(); }
      queue.push(version);
      setVersion(version, { status: "queued" });
      void pump();
    },

    async removeVersion(version: string) {
      const qi = queue.indexOf(version);
      if (qi >= 0) queue.splice(qi, 1);
      if (running?.version === version) running.controller.abort();
      setVersion(version, null);
      const backend = deps.backend();
      if (backend) await backend.deleteVersion(version).catch(() => {});
    },

    /** Capítulo guardado no aparelho, ou null (não baixado, banco indisponível ou lento). */
    async readChapter(version: string, bookId: number, chapter: number): Promise<RawVerse[] | null> {
      const backend = deps.backend();
      if (!backend || !snapshot.supported) return null;
      await Promise.race([load(), new Promise((r) => setTimeout(r, READ_TIMEOUT_MS))]);
      if (snapshot.loaded && snapshot.versions[version]?.status !== "ready") return null;
      try {
        return await Promise.race([
          backend.getChapter(version, bookId, chapter),
          new Promise<null>((r) => setTimeout(() => r(null), READ_TIMEOUT_MS)),
        ]);
      } catch {
        return null;
      }
    },
  };
}

export type OfflineManager = ReturnType<typeof createOfflineManager>;

let manager: OfflineManager | null = null;
export function offlineBible(): OfflineManager {
  if (!manager) manager = createOfflineManager();
  return manager;
}
/** Testes trocam o gerenciador global. */
export function setOfflineBibleManager(next: OfflineManager | null) {
  manager = next;
}
