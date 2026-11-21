/* Contas puras do Início do painel (21/11/2026, Aoliabe). Testadas em src/test/admin-numeros.test.ts.
   Usa as mesmas regras de plano da Central de mensagens (push-send/publico.ts): br_* = Brasil,
   intl_* = Internacional, vazio ou "manual" = lista antiga; bloqueado e vencido não contam como ativos. */

export type LinhaAcesso = { plan: string | null; bloqueado: boolean; expires_at: string | null };
export type ResumoPlanos = {
  ativos: number; brasil: number; internacional: number; listaAntiga: number; outros: number; vencidos: number; bloqueados: number; total: number;
};

export function resumirPlanos(linhas: LinhaAcesso[], agora = Date.now()): ResumoPlanos {
  const r: ResumoPlanos = { ativos: 0, brasil: 0, internacional: 0, listaAntiga: 0, outros: 0, vencidos: 0, bloqueados: 0, total: linhas.length };
  for (const l of linhas) {
    if (l.bloqueado) { r.bloqueados++; continue; }
    if (l.expires_at && new Date(l.expires_at).getTime() < agora) { r.vencidos++; continue; }
    r.ativos++;
    const p = (l.plan ?? "").toLowerCase();
    if (p.startsWith("br_")) r.brasil++;
    else if (p.startsWith("intl_")) r.internacional++;
    else if (p === "" || p === "manual") r.listaAntiga++;
    else r.outros++;
  }
  return r;
}

/** Saudação pela hora de Brasília do aparelho. */
export function saudacao(d = new Date()): string {
  const h = d.getHours();
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Soma de uma série diária e o valor de hoje (data local AAAA-MM-DD). */
export function somaSerie(serie: { day: string; n: number }[], hoje = new Date()): { total: number; hoje: number } {
  const chave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  let total = 0, deHoje = 0;
  for (const s of serie) {
    total += Number(s.n) || 0;
    if (String(s.day).slice(0, 10) === chave) deHoje += Number(s.n) || 0;
  }
  return { total, hoje: deHoje };
}
