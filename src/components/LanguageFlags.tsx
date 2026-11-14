import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Flag } from "@/components/flags/Flag";
import { setLanguageManually } from "@/i18n";
import { APP_LANGUAGES, idiomasLiberados, matchAppLanguage } from "@/i18n/app-languages";
import type { AppLanguage } from "@/i18n/geo-language";
import "./LanguageFlags.css";

interface LanguageFlagsProps {
  /**
   * "bar": fileira das 6 bandeiras no cabeçalho (desktop, ≥ 768 px).
   * "sheet": celular — só a bandeira atual, redonda; tocar abre a folha com as 6.
   */
  variant?: "bar" | "sheet";
  className?: string;
}

interface FlagListProps {
  current: AppLanguage;
  layout: "bar" | "sheet";
  onPick: (code: AppLanguage) => void;
}

/** As 6 bandeiras com a sigla. Mesma troca e mesma persistência do seletor dos Ajustes (`setLanguageManually`). */
const FlagList = ({ current, layout, onPick }: FlagListProps) => {
  const { t } = useTranslation();
  const liberados = idiomasLiberados();
  return (
    <ul className={`lang-flags lang-flags--${layout}`} role="group" aria-label={t("dashboard.selectLanguage")}>
      {APP_LANGUAGES.map((lang) => {
        const ativo = lang.code === current;
        // Trava futura: idioma fora de `idiomasLiberados()` fica apagado e não troca (ver app-languages.ts).
        const bloqueado = !liberados.includes(lang.code);
        return (
          <li key={lang.code}>
            <button
              type="button"
              lang={lang.code}
              aria-label={lang.name}
              title={lang.name}
              aria-pressed={ativo}
              disabled={bloqueado}
              className={`lang-flag-btn${ativo ? " is-active" : ""}${bloqueado ? " is-locked" : ""}`}
              onClick={() => onPick(lang.code)}
            >
              <Flag code={lang.code} className="lang-flag" />
              <span className="lang-flag-code" aria-hidden="true">{lang.short}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const LanguageFlags = ({ variant = "bar", className = "" }: LanguageFlagsProps) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = matchAppLanguage(i18n.resolvedLanguage || i18n.language || "pt-PT");
  const currentName = APP_LANGUAGES.find((lang) => lang.code === current)?.name ?? "";

  const pick = (code: AppLanguage) => {
    void setLanguageManually(code);
    setOpen(false);
  };

  if (variant === "bar") {
    return (
      <div className={`lang-flags-wrap ${className}`}>
        <FlagList current={current} layout="bar" onPick={pick} />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`lang-current-btn ${className}`}
          aria-label={`${t("dashboard.selectLanguage")} · ${currentName}`}
          title={currentName}
        >
          <Flag code={current} className="lang-flag" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} collisionPadding={8} className="lang-sheet w-[min(calc(100vw-16px),380px)] rounded-[18px] border-rule-soft bg-card p-2.5 text-foreground shadow-[0_1px_2px_hsl(216_60%_4%/0.10),0_16px_40px_-16px_hsl(216_60%_4%/0.45)]" aria-label={t("dashboard.selectLanguage")}>
        <FlagList current={current} layout="sheet" onPick={pick} />
      </PopoverContent>
    </Popover>
  );
};
