#!/usr/bin/env node
// Copia as imagens do mural do Supabase Storage (bucket público prayer-images) para o R2
// e gera um SQL que troca image_url para o endereço do Worker.
//
//   SUPABASE_URL=https://rwyyggtsjbwnwzsnlkgy.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=... CONTENT_BASE_URL=https://<worker> \
//   node scripts/migrate-mural-images.mjs [--upload] [--bucket fc-bilingue-content]
//
// Saída: .export/mural/* e .export/mural-update.sql (rodar no SQL Editor depois de conferir).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const upload = args.includes("--upload");
const bucket = args.includes("--bucket") ? args[args.indexOf("--bucket") + 1] : "fc-bilingue-content";
const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const contentBase = (process.env.CONTENT_BASE_URL ?? "").replace(/\/$/, "");
if (!url || !key || !contentBase) {
  console.error("Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e CONTENT_BASE_URL no ambiente.");
  process.exit(1);
}

const prefix = `${url}/storage/v1/object/public/prayer-images/`;
const res = await fetch(`${url}/rest/v1/prayer_requests?select=id,image_url&image_url=like.${encodeURIComponent(prefix + "*")}`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) {
  console.error(`Erro ${res.status} ao ler prayer_requests`);
  process.exit(1);
}
const rows = await res.json();
const outDir = join(process.cwd(), ".export", "mural");
mkdirSync(outDir, { recursive: true });
const sql = ["BEGIN;"];
let bytes = 0;

for (const row of rows) {
  const name = decodeURIComponent(row.image_url.slice(prefix.length)).replace(/[^A-Za-z0-9._-]/g, "_");
  if (!/^[A-Za-z0-9]/.test(name)) continue;
  const img = await fetch(row.image_url);
  if (!img.ok) {
    console.warn(`Sem arquivo para ${row.id} (${img.status}) — mantido como está`);
    continue;
  }
  const data = Buffer.from(await img.arrayBuffer());
  bytes += data.length;
  const file = join(outDir, name);
  writeFileSync(file, data);
  const r2Key = `mural/legacy/${name}`;
  if (upload) {
    const run = spawnSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${bucket}/${r2Key}`, "--file", file, "--content-type", img.headers.get("content-type") ?? "application/octet-stream", "--cache-control", "public, max-age=31536000, immutable", "--remote"],
      { stdio: "inherit" },
    );
    if (run.status !== 0) {
      console.error(`Falhou: ${r2Key}`);
      process.exit(1);
    }
  }
  sql.push(`UPDATE public.prayer_requests SET image_url = '${contentBase}/v1/${r2Key}' WHERE id = '${row.id}';`);
}
sql.push("COMMIT;");
writeFileSync(join(process.cwd(), ".export", "mural-update.sql"), sql.join("\n") + "\n");
console.log(`${rows.length} pedidos com imagem, ${(bytes / 1048576).toFixed(1)} MB. SQL em .export/mural-update.sql`);
