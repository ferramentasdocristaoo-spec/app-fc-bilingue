import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FONT_SIZE_OPTIONS, useFontSize } from "@/hooks/use-font-size";
import "./FontSizeStepper.css";

/** A− / A+ à vista no topo (computador e tablet). Mesma escolha e persistência do "Aa" do celular e dos Ajustes do Dock. */
export function FontSizeStepper({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { fontSize, stepFontSize } = useFontSize();
  const index = FONT_SIZE_OPTIONS.findIndex((o) => o.value === fontSize);
  const names = t("fontSize.names", { returnObjects: true }) as string[];
  const name = names[index] ?? "";
  const abbr = t(`fontSize.${fontSize}`);

  return (
    <div className={`font-step ${className}`.trim()} role="group" aria-label={t("fontSize.label")}>
      <button
        type="button"
        className="font-step-btn"
        onClick={() => stepFontSize(-1)}
        disabled={index <= 0}
        aria-label={t("fontSize.decrease")}
        title={t("fontSize.decrease")}
      >
        <span aria-hidden="true" className="font-step-a is-small">A</span>
        <Minus aria-hidden="true" />
      </button>
      {/* Tamanho atual: sigla visível, nome completo para o leitor de tela e no balão do mouse. */}
      <span className="font-step-now" title={t("fontSize.current", { name })} aria-live="polite">
        <span aria-hidden="true">{abbr}</span>
        <span className="sr-only">{t("fontSize.current", { name })}</span>
      </span>
      <button
        type="button"
        className="font-step-btn"
        onClick={() => stepFontSize(1)}
        disabled={index >= FONT_SIZE_OPTIONS.length - 1}
        aria-label={t("fontSize.increase")}
        title={t("fontSize.increase")}
      >
        <span aria-hidden="true" className="font-step-a is-big">A</span>
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

export default FontSizeStepper;
