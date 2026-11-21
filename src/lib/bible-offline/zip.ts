/**
 * Leitor mínimo de ZIP para o arquivo da tradução completa do bolls.life
 * (`/static/translations/<VERSÃO>.zip`, um único `<VERSÃO>.json` dentro).
 *
 * Usa o diretório central (tamanhos certos mesmo com "data descriptor") e o
 * DecompressionStream("deflate-raw") do próprio navegador (Safari 16.4+, Chrome 103+),
 * sem biblioteca nova no app.
 */

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

export type ZipEntry = { name: string; method: number; compressedSize: number; dataStart: number };

export function zipSupported(): boolean {
  if (typeof DecompressionStream === "undefined") return false;
  try {
    new DecompressionStream("deflate-raw" as CompressionFormat);
    return true;
  } catch {
    return false;
  }
}

/** Lista as entradas do ZIP (só o necessário para extrair). */
export function readZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // O registro final fica nos últimos 22 bytes + comentário (até 64 KB).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("zip_invalido");
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== CENTRAL_SIG) throw new Error("zip_invalido");
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== LOCAL_SIG) throw new Error("zip_invalido");
    const localNameLen = view.getUint16(localOffset + 26, true);
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    if (dataStart + compressedSize > bytes.length) throw new Error("zip_invalido");
    entries.push({ name, method, compressedSize, dataStart });
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(data); c.close(); } });
  const stream = source.pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Extrai o primeiro arquivo .json do ZIP e devolve o texto. */
export async function extractFirstJson(bytes: Uint8Array): Promise<string> {
  const entry = readZipEntries(bytes).find((e) => e.name.toLowerCase().endsWith(".json"));
  if (!entry) throw new Error("zip_sem_json");
  const data = bytes.subarray(entry.dataStart, entry.dataStart + entry.compressedSize);
  let raw: Uint8Array;
  if (entry.method === 0) raw = data;
  else if (entry.method === 8) raw = await inflateRaw(data);
  else throw new Error("zip_metodo_desconhecido");
  return new TextDecoder().decode(raw);
}

/** Igual a extractFirstJson, mas já devolve o JSON lido (sem guardar o texto inteiro numa string à parte). */
export async function parseFirstJson(bytes: Uint8Array): Promise<unknown> {
  const entry = readZipEntries(bytes).find((e) => e.name.toLowerCase().endsWith(".json"));
  if (!entry) throw new Error("zip_sem_json");
  const data = bytes.subarray(entry.dataStart, entry.dataStart + entry.compressedSize);
  if (entry.method === 0) return new Response(data).json();
  if (entry.method !== 8) throw new Error("zip_metodo_desconhecido");
  const source = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(data); c.close(); } });
  return new Response(source.pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat))).json();
}
