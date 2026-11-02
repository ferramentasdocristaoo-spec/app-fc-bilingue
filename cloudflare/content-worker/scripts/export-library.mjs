#!/usr/bin/env node
// Exporta library_volumes (Supabase) para arquivos JSON no formato que o Worker lê do R2
// e, com --upload, envia cada arquivo para o bucket com wrangler.
//
// Uso (o dono roda, depois de aprovar):
//   SUPABASE_URL=https://rwyyggtsjbwnwzsnlkgy.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY="$(security find-generic-password -s <servico> -a <conta> -w)" \
//   node scripts/export-library.mjs [--upload] [--bucket fc-bilingue-content]
//
// A chave service role fica só na variável de ambiente desta execução — nunca em arquivo.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const upload = args.includes("--upload");
const bucket = args.includes("--bucket") ? args[args.indexOf("--bucket") + 1] : "fc-bilingue-content";
const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const outDir = join(process.cwd(), ".export");
const pageSize = 20; // volumes são grandes: páginas pequenas
let offset = 0;
let total = 0;
let bytes = 0;
const files = [];

for (;;) {
  const res = await fetch(
    `${url}/rest/v1/library_volumes?select=product_slug,volume_slug,language,title,content,word_count&order=product_slug,volume_slug,language&limit=${pageSize}&offset=${offset}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    console.error(`Erro ${res.status} ao ler library_volumes`);
    process.exit(1);
  }
  const rows = await res.json();
  for (const row of rows) {
    const r2Key = `library/${row.product_slug}/${row.volume_slug}/${row.language}.json`;
    const body = JSON.stringify({ title: row.title, content: row.content, language: row.language, word_count: row.word_count });
    const file = join(outDir, r2Key);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    files.push({ r2Key, file });
    total += 1;
    bytes += Buffer.byteLength(body);
  }
  if (rows.length < pageSize) break;
  offset += pageSize;
}
console.log(`Exportados ${total} volumes (${(bytes / 1024).toFixed(0)} KB) em ${outDir}`);

if (upload) {
  for (const { r2Key, file } of files) {
    const run = spawnSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${bucket}/${r2Key}`, "--file", file, "--content-type", "application/json; charset=utf-8", "--remote"],
      { stdio: "inherit" },
    );
    if (run.status !== 0) {
      console.error(`Falhou: ${r2Key}`);
      process.exit(1);
    }
  }
  console.log(`Enviados ${files.length} arquivos para r2://${bucket}`);
}
