import { escapeHtml } from "@/lib/utils";

/** Nome de arquivo seguro em qualquer sistema, mantendo acentos. */
export function sermonFileName(title: string, fallback = "sermao"): string {
  const clean = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 80)
    .trim();
  return clean || fallback;
}

/** Baixa o texto como .txt (UTF-8 com BOM, para abrir certo no Bloco de Notas). */
export function downloadSermonTxt(title: string, text: string): void {
  const blob = new Blob(["﻿", text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sermonFileName(title)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copySermonText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Blocos: linha em maiúsculas vira rótulo de seção; "1. Título" vira ponto; o resto, parágrafo. */
export function sermonPrintBody(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const safe = escapeHtml(line);
      if (line === line.toLocaleUpperCase() && /\p{L}/u.test(line) && line.length < 80) return `<h2>${safe}</h2>`;
      if (/^\d+\.\s/.test(line)) return `<h3>${safe}</h3>`;
      return `<p>${safe}</p>`;
    })
    .join("\n");
}

export function sermonPrintHtml(title: string, subtitle: string, text: string, lang: string): string {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 22mm 20mm; }
  body { font-family: Georgia, "Times New Roman", serif; max-width: 42rem; margin: 40px auto; padding: 0 20px; font-size: 12pt; line-height: 1.6; color: #16243a; }
  header { margin-bottom: 24pt; padding-bottom: 12pt; border-bottom: 2px solid #16243a; }
  h1 { margin: 0; font-size: 24pt; font-weight: normal; line-height: 1.15; }
  header p { margin: 6pt 0 0; font-style: italic; color: #6b5220; }
  h2 { margin: 20pt 0 6pt; font: normal 9.5pt/1.4 Georgia, serif; letter-spacing: .12em; color: #6b5220; break-after: avoid; }
  h3 { margin: 16pt 0 4pt; font-size: 13pt; break-after: avoid; }
  p { margin: 0 0 8pt; orphans: 3; widows: 3; }
</style></head>
<body><header><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}</header>
${sermonPrintBody(text)}
</body></html>`;
}

/** Abre a janela de impressão (nela o usuário escolhe "Guardar como PDF"). false = navegador bloqueou. */
export function printSermon(title: string, subtitle: string, text: string, lang: string): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(sermonPrintHtml(title, subtitle, text, lang));
  win.document.close();
  setTimeout(() => win.print(), 400);
  return true;
}
