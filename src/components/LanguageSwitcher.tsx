import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { setLanguageManually } from '@/i18n';
import type { AppLanguage } from '@/i18n/geo-language';
import { APP_LANGUAGES, matchAppLanguage } from '@/i18n/app-languages';

const languages = APP_LANGUAGES;

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  /** Sigla em vez do nome em telas estreitas (topo do app). */
  compact?: boolean;
}

/**
 * "horizontal": um único seletor discreto em texto ("Português ▾"), em vez de 6 bandeiras.
 * "vertical": lista de botões (mantida para quem já usa).
 */
export const LanguageSwitcher = ({ className = '', variant = 'horizontal', compact = false }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const current = matchAppLanguage(i18n.resolvedLanguage || i18n.language || 'pt-PT');

  if (variant === 'horizontal') {
    return (
      <label className={`relative inline-flex h-11 min-w-11 items-center justify-center rounded-sm px-2 font-body text-sm font-medium text-ink-2 hover:text-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-ink ${className}`}>
        <span className="sr-only">{t('dashboard.selectLanguage')}</span>
        {/* O select fica por cima, invisível: abre a lista nativa; por baixo, o nome (ou a sigla, no celular). */}
        <span aria-hidden className="pointer-events-none flex items-center gap-1">
          <span className={compact ? 'sm:hidden' : 'hidden'}>{current.split('-')[0].toUpperCase()}</span>
          <span className={compact ? 'hidden sm:inline' : ''}>{languages.find((lang) => lang.code === current)?.name}</span>
          <span className="text-xs text-ink-3">▾</span>
        </span>
        <select
          value={current}
          onChange={(event) => void setLanguageManually(event.target.value as AppLanguage)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={current === lang.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => void setLanguageManually(lang.code)}
          title={lang.name}
          className="h-8 justify-start gap-2 px-2 text-sm"
        >
          <span aria-hidden>{lang.flag}</span>{lang.name}
        </Button>
      ))}
    </div>
  );
};
