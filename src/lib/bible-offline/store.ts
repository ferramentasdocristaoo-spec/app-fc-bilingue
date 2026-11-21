/**
 * Bíblia guardada no aparelho (IndexedDB).
 *
 * Banco `fc-biblia-offline`:
 *  - `capitulos`: chave "VERSÃO|livro|capítulo" → versículos crus do bolls.life ({pk, verse, text}),
 *    o mesmo formato do get-text; o app limpa com cleanBibleText na leitura, igual a hoje.
 *  - `versoes`: uma linha por versão completa (só é gravada no fim, na mesma transação dos capítulos;
 *    versão sem linha aqui não conta como baixada).
 */

export type RawVerse = { pk?: number; verse: number; text: string };

export type OfflineVersionInfo = {
  version: string;
  /** Tamanho do texto guardado (caracteres do JSON dos capítulos ≈ bytes). */
  bytes: number;
  /** Tamanho do arquivo baixado (ZIP). */
  downloadBytes: number;
  chapters: number;
  verses: number;
  savedAt: string;
};

export interface OfflineBibleBackend {
  getChapter(version: string, bookId: number, chapter: number): Promise<RawVerse[] | null>;
  listVersions(): Promise<OfflineVersionInfo[]>;
  putVersion(info: OfflineVersionInfo, chapters: Map<string, RawVerse[]>): Promise<void>;
  deleteVersion(version: string): Promise<void>;
}

export const chapterKey = (version: string, bookId: number, chapter: number) => `${version}|${bookId}|${chapter}`;
/** Todas as chaves de uma versão ("ARA|" até "ARA|￿"; não pega "ARAx|"). */
const versionRange = (version: string) => IDBKeyRange.bound(`${version}|`, `${version}|￿`);

const DB_NAME = "fc-biblia-offline";
const DB_VERSION = 1;
const CHAPTERS = "capitulos";
const VERSIONS = "versoes";
/** Abrir o banco não pode ficar esperando para sempre (já visto no Safari). */
const OPEN_TIMEOUT_MS = 4000;

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    // O erro do pedido (ex.: QuotaExceededError) chega antes de tx.error ser preenchido.
    tx.onerror = (e) => reject((e.target as IDBRequest | null)?.error ?? tx.error ?? new Error("idb_error"));
    tx.onabort = () => reject(tx.error ?? new Error("idb_abort"));
  });
}

export function createIndexedDbBackend(idb: IDBFactory): OfflineBibleBackend {
  let dbPromise: Promise<IDBDatabase> | null = null;

  const reset = () => {
    const old = dbPromise;
    dbPromise = null;
    old?.then((db) => { try { db.close(); } catch { /* já fechada */ } }, () => {});
  };

  const open = () => {
    if (!dbPromise) {
      dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = idb.open(DB_NAME, DB_VERSION);
        const timer = setTimeout(() => { dbPromise = null; reject(new Error("idb_timeout")); }, OPEN_TIMEOUT_MS);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(CHAPTERS)) db.createObjectStore(CHAPTERS);
          if (!db.objectStoreNames.contains(VERSIONS)) db.createObjectStore(VERSIONS, { keyPath: "version" });
        };
        req.onsuccess = () => {
          clearTimeout(timer);
          const db = req.result;
          // Outra aba abriu uma versão nova do banco, ou o iOS derrubou a conexão: reabre no próximo uso.
          db.onversionchange = () => { db.close(); dbPromise = null; };
          (db as IDBDatabase & { onclose: (() => void) | null }).onclose = () => { dbPromise = null; };
          resolve(db);
        };
        req.onerror = () => { clearTimeout(timer); dbPromise = null; reject(req.error); };
        // "blocked" não é fatal: espera o success/error (ou o tempo-limite acima).
      });
    }
    return dbPromise;
  };

  /**
   * No iPhone a conexão às vezes "se perde" quando o app volta do segundo plano
   * ("Connection to Indexed Database server lost"). Em erro: fecha, reabre e tenta mais uma vez.
   */
  async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    try {
      return await fn(await open());
    } catch (e) {
      if ((e as { name?: string } | null)?.name === "QuotaExceededError") throw e;
      reset();
      return fn(await open());
    }
  }

  return {
    getChapter: (version, bookId, chapter) =>
      withDb(async (db) => {
        const tx = db.transaction(CHAPTERS, "readonly");
        const value = await promisify(tx.objectStore(CHAPTERS).get(chapterKey(version, bookId, chapter)));
        return Array.isArray(value) && value.length > 0 ? (value as RawVerse[]) : null;
      }),
    listVersions: () =>
      withDb(async (db) => {
        const tx = db.transaction(VERSIONS, "readonly");
        const all = await promisify(tx.objectStore(VERSIONS).getAll());
        return (all as OfflineVersionInfo[]).filter((v) => v && typeof v.version === "string");
      }),
    putVersion: (info, chapters) =>
      withDb((db) => {
        // Tudo ou nada: restos antigos saem, os capítulos entram e a linha da versão vai por último.
        const tx = db.transaction([CHAPTERS, VERSIONS], "readwrite");
        const store = tx.objectStore(CHAPTERS);
        store.delete(versionRange(info.version));
        chapters.forEach((verses, key) => store.put(verses, key));
        tx.objectStore(VERSIONS).put(info);
        return done(tx);
      }),
    deleteVersion: (version) =>
      withDb((db) => {
        const tx = db.transaction([CHAPTERS, VERSIONS], "readwrite");
        tx.objectStore(CHAPTERS).delete(versionRange(version));
        tx.objectStore(VERSIONS).delete(version);
        return done(tx);
      }),
  };
}

/** Para testes (e aparelhos sem IndexedDB não usam nada: ver getOfflineBackend). */
export function createMemoryBackend(): OfflineBibleBackend & { chapters: Map<string, RawVerse[]> } {
  const chapters = new Map<string, RawVerse[]>();
  const versions = new Map<string, OfflineVersionInfo>();
  return {
    chapters,
    async getChapter(version, bookId, chapter) {
      return chapters.get(chapterKey(version, bookId, chapter)) ?? null;
    },
    async listVersions() {
      return [...versions.values()];
    },
    async putVersion(info, list) {
      for (const key of [...chapters.keys()]) if (key.startsWith(`${info.version}|`)) chapters.delete(key);
      list.forEach((v, k) => chapters.set(k, v));
      versions.set(info.version, info);
    },
    async deleteVersion(version) {
      for (const key of [...chapters.keys()]) if (key.startsWith(`${version}|`)) chapters.delete(key);
      versions.delete(version);
    },
  };
}

let backend: OfflineBibleBackend | null | undefined;

export function getOfflineBackend(): OfflineBibleBackend | null {
  if (backend === undefined) {
    backend = typeof indexedDB !== "undefined" && indexedDB ? createIndexedDbBackend(indexedDB) : null;
  }
  return backend;
}

/** Testes trocam o banco (null = aparelho sem IndexedDB). */
export function setOfflineBackend(next: OfflineBibleBackend | null | undefined) {
  backend = next;
}
