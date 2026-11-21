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
  /** Tamanho do texto guardado (bytes do JSON dos capítulos). */
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

const DB_NAME = "fc-biblia-offline";
const DB_VERSION = 1;
const CHAPTERS = "capitulos";
const VERSIONS = "versoes";

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("idb_abort"));
  });
}

export function createIndexedDbBackend(idb: IDBFactory): OfflineBibleBackend {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const open = () => {
    if (!dbPromise) {
      dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = idb.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(CHAPTERS)) db.createObjectStore(CHAPTERS);
          if (!db.objectStoreNames.contains(VERSIONS)) db.createObjectStore(VERSIONS, { keyPath: "version" });
        };
        req.onsuccess = () => {
          const db = req.result;
          // Outra aba abriu uma versão nova do banco: fecha esta conexão e abre de novo no próximo uso.
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        req.onerror = () => { dbPromise = null; reject(req.error); };
        req.onblocked = () => { dbPromise = null; reject(new Error("idb_blocked")); };
      });
    }
    return dbPromise;
  };

  return {
    async getChapter(version, bookId, chapter) {
      const db = await open();
      const tx = db.transaction(CHAPTERS, "readonly");
      const value = await promisify(tx.objectStore(CHAPTERS).get(chapterKey(version, bookId, chapter)));
      return Array.isArray(value) && value.length > 0 ? (value as RawVerse[]) : null;
    },
    async listVersions() {
      const db = await open();
      const tx = db.transaction(VERSIONS, "readonly");
      const all = await promisify(tx.objectStore(VERSIONS).getAll());
      return (all as OfflineVersionInfo[]).filter((v) => v && typeof v.version === "string");
    },
    async putVersion(info, chapters) {
      const db = await open();
      const tx = db.transaction([CHAPTERS, VERSIONS], "readwrite");
      const store = tx.objectStore(CHAPTERS);
      // Restos de uma versão antiga (ou de um download interrompido) saem antes.
      store.delete(IDBKeyRange.bound(`${info.version}|`, `${info.version}|￿`));
      chapters.forEach((verses, key) => store.put(verses, key));
      tx.objectStore(VERSIONS).put(info);
      await done(tx);
    },
    async deleteVersion(version) {
      const db = await open();
      const tx = db.transaction([CHAPTERS, VERSIONS], "readwrite");
      tx.objectStore(CHAPTERS).delete(IDBKeyRange.bound(`${version}|`, `${version}|￿`));
      tx.objectStore(VERSIONS).delete(version);
      await done(tx);
    },
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
