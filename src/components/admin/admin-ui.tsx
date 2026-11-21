import type { LucideIcon } from "lucide-react";
import { Inbox, SearchX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/* Peças comuns do painel (padrão do app novo). Estilos em AdminShell.css. */

export const fmt = (n: number | null | undefined) => (n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toLocaleString("pt-BR"));
export const fmtData = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");
export const fmtDataHora = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/** "hoje", "ontem", "há 3 dias" — para quem lê de relance no celular. */
export function quando(d: string | null | undefined): string {
  if (!d) return "—";
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(new Date()) - dia(new Date(d))) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return fmtData(d);
}

export const SectionHead = ({ eyebrow, title, lede, children }: { eyebrow?: string; title: string; lede?: string; children?: ReactNode }) => (
  <header className="adm-head">
    {eyebrow && <span className="adm-eyebrow">{eyebrow}</span>}
    <h1 className="adm-h1">{title}</h1>
    {lede && <p className="adm-lede">{lede}</p>}
    {children}
  </header>
);

export const Kpi = ({ icon: Icon, label, value, hint, wide, onClick, children }: {
  icon?: LucideIcon; label: string; value?: ReactNode; hint?: ReactNode; wide?: boolean; onClick?: () => void; children?: ReactNode;
}) => {
  const conteudo = (
    <>
      <span className="adm-kpi-label">{Icon && <Icon aria-hidden="true" />}{label}</span>
      {value !== undefined && <span className="adm-kpi-value">{value}</span>}
      {hint && <span className="adm-kpi-hint">{hint}</span>}
      {children}
    </>
  );
  const cls = `adm-card adm-kpi${wide ? " adm-kpi-wide" : ""}`;
  return onClick ? <button type="button" className={cls} onClick={onClick}>{conteudo}</button> : <div className={cls}>{conteudo}</div>;
};

export const Periodo = ({ dias, opcoes, onChange }: { dias: number; opcoes: number[]; onChange: (d: number) => void }) => (
  <div className="adm-chips" role="group" aria-label="Período">
    <span>Período:</span>
    {opcoes.map((d) => (
      <button key={d} type="button" className="adm-chip" aria-pressed={dias === d} onClick={() => onChange(d)}>{d} dias</button>
    ))}
  </div>
);

/** Esqueleto no formato do conteúdo (em vez de um ícone girando). */
export const Esqueleto = ({ linhas = 3, altura = 18, label = "Carregando" }: { linhas?: number; altura?: number; label?: string }) => (
  <div role="status" aria-label={label} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
    {Array.from({ length: linhas }, (_, i) => (
      <span key={i} className="adm-sk" style={{ height: altura, width: `${[92, 70, 82, 60][i % 4]}%` }} />
    ))}
  </div>
);

export const EsqueletoKpis = ({ n = 4 }: { n?: number }) => (
  <div className="adm-kpis" role="status" aria-label="Carregando números">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className={`adm-card adm-kpi${i === 0 ? " adm-kpi-wide" : ""}`}>
        <span className="adm-sk" style={{ height: 16, width: "60%" }} />
        <span className="adm-sk" style={{ height: 34, width: "45%", marginTop: 12 }} />
      </div>
    ))}
  </div>
);

/** Três vazios diferentes: sem dados, busca sem resultado e erro (cada um com a sua saída). */
export const Vazio = ({ tipo = "sem-dados", titulo, texto, acao }: {
  tipo?: "sem-dados" | "busca" | "erro"; titulo: string; texto?: string; acao?: ReactNode;
}) => {
  const Icon = tipo === "erro" ? TriangleAlert : tipo === "busca" ? SearchX : Inbox;
  return (
    <div className={`adm-empty${tipo === "erro" ? " adm-empty-error" : ""}`} role={tipo === "erro" ? "alert" : undefined}>
      <span className="adm-tile"><Icon aria-hidden="true" /></span>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {acao}
    </div>
  );
};
