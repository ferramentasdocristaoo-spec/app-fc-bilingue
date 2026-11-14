import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { Flag } from "@/components/flags/Flag";
import { setLanguageManually } from "@/i18n";
import { APP_LANGUAGES, idiomasLiberados, matchAppLanguage, usePlanoAtual } from "@/i18n/app-languages";
import type { AppLanguage } from "@/i18n/geo-language";
import { UPGRADE_IDIOMAS_URL } from "@/lib/planos";
import "./LanguageFlags.css";

interface LanguageFlagsProps {
  /**
   * "bar": fileira das 7 bandeiras no cabeçalho (desktop, ≥ 768 px).
   * "sheet": celular — só a bandeira atual, redonda; tocar abre a folha com as 7.
   */
  variant?: "bar" | "sheet";
  className?: string;
}

interface FlagListProps {
  current: AppLanguage;
  layout: "bar" | "sheet";
  onPick: (code: AppLanguage) => void;
  onLocked: (code: AppLanguage) => void;
}

// Cadeado pequeno no canto da bandeira fora do plano.
const Lock = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="lang-flag-lock">
    <rect x="3" y="7" width="10" height="7" rx="1.6" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

/** As 7 bandeiras com a sigla. Mesma troca e mesma persistência do seletor dos Ajustes (`setLanguageManually`). */
const FlagList = ({ current, layout, onPick, onLocked }: FlagListProps) => {
  const { t } = useTranslation();
  const plano = usePlanoAtual();
  const liberados = idiomasLiberados(plano);
  return (
    <ul className={`lang-flags lang-flags--${layout}`} role="group" aria-label={t("dashboard.selectLanguage")}>
      {APP_LANGUAGES.map((lang) => {
        const ativo = lang.code === current;
        // Trava por plano: idioma fora de `idiomasLiberados()` fica apagado; tocar abre o aviso do adicional (ver app-languages.ts).
        const bloqueado = !liberados.includes(lang.code);
        return (
          <li key={lang.code}>
            <button
              type="button"
              lang={lang.code}
              aria-label={bloqueado ? `${lang.name} · ${t("languages.lockedTitle")}` : lang.name}
              title={bloqueado ? `${lang.name} · ${t("languages.lockedTitle")}` : lang.name}
              aria-pressed={ativo}
              aria-disabled={bloqueado || undefined}
              data-locked={bloqueado || undefined}
              className={`lang-flag-btn${ativo ? " is-active" : ""}${bloqueado ? " is-locked" : ""}`}
              onClick={() => (bloqueado ? onLocked(lang.code) : onPick(lang.code))}
            >
              <span className="lang-flag-wrap">
                <Flag code={lang.code} className="lang-flag" />
                {bloqueado && <Lock />}
              </span>
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

  // Aviso curto do adicional de idiomas, com o link de ativar (placeholder em lib/planos.ts).
  const locked = (code: AppLanguage) => {
    const name = APP_LANGUAGES.find((lang) => lang.code === code)?.name ?? code;
    toast({
      title: t("languages.lockedTitle"),
      description: t("languages.lockedBody", { language: name }),
      action: (
        <ToastAction altText={t("languages.lockedAction")} asChild>
          <a href={UPGRADE_IDIOMAS_URL} target="_blank" rel="noopener noreferrer">{t("languages.lockedAction")}</a>
        </ToastAction>
      ),
    });
  };

  if (variant === "bar") {
    return (
      <div className={`lang-flags-wrap ${className}`}>
        <FlagList current={current} layout="bar" onPick={pick} onLocked={locked} />
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
        <FlagList current={current} layout="sheet" onPick={pick} onLocked={locked} />
      </PopoverContent>
    </Popover>
  );
};
