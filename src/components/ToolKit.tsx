import type { ReactNode } from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

interface ToolFormProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  /** Campo pode ficar vazio (Devocional). */
  optional?: boolean;
  examples?: string[];
  examplesLabel?: string;
}

/** Pedido às ferramentas de IA. Exemplo só preenche o campo: quem decide gastar a consulta é o leitor. */
export function ToolForm({ id, label, placeholder, value, onChange, onSubmit, submitLabel, loading, optional, examples, examplesLabel }: ToolFormProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = !loading && (optional || value.trim().length > 0);
  return (
    <>
      <form className="ed-tool-form" onSubmit={(event) => { event.preventDefault(); if (canSubmit) onSubmit(); }}>
        <label className="ed-label" htmlFor={id}>{label}</label>
        <input ref={inputRef} id={id} className="ed-field w-full px-1" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} enterKeyHint="search" autoComplete="off" />
        <button type="submit" className="ed-btn ed-btn-primary" disabled={!canSubmit}>{submitLabel}</button>
      </form>
      {examples && examples.length > 0 && (
        <p className="ed-examples">
          <span>{examplesLabel ?? t("tools.examples")}:</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => { onChange(example); inputRef.current?.focus(); }}>{example}</button>
          ))}
        </p>
      )}
    </>
  );
}

/** Antes do primeiro pedido: o que a ferramenta devolve, em vez de tela vazia. */
export function ToolPromise({ items }: { items: string[] }) {
  const { t } = useTranslation();
  return (
    <section className="ed-promise" aria-labelledby="ed-promise-title">
      <span id="ed-promise-title" className="ed-eyebrow">{t("tools.youGet")}</span>
      <ol>
        {items.map((item, index) => <li key={item}><span className="ed-num" aria-hidden>{ROMAN[index]}</span>{item}</li>)}
      </ol>
    </section>
  );
}

/** Espera com o desenho do resultado, não um spinner solto. */
export function ToolWait({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div className="ed-wait" role="status" aria-live="polite">
      <p>{label}</p>
      <small>{t("tools.slowHint")}</small>
      <div className="ed-wait-lines" aria-hidden>{Array.from({ length: 7 }).map((_, index) => <i key={index} />)}</div>
    </div>
  );
}

export function ToolError({ onRetry, children }: { onRetry?: () => void; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="ed-alert" role="alert">
      <p>{children ?? t("common.aiError")}</p>
      {onRetry && <button type="button" className="ed-btn ed-btn-ghost" onClick={onRetry}>{t("common.retry")}</button>}
    </div>
  );
}
