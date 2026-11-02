import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'pt-PT', flag: '🇵🇹', name: 'Português' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const matchLanguage = (current: string) => {
  const exact = languages.find((lang) => lang.code === current);
  if (exact) return exact.code;
  const base = current.split('-')[0];
  return languages.find((lang) => lang.code.split('-')[0] === base)?.code ?? 'pt-PT';
};

/**
 * "horizontal": um único seletor discreto em texto ("Português ▾"), em vez de 6 bandeiras.
 * "vertical": lista de botões (mantida para quem já usa).
 */
export const LanguageSwitcher = ({ className = '', variant = 'horizontal' }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const current = matchLanguage(i18n.resolvedLanguage || i18n.language || 'pt-PT');

  if (variant === 'horizontal') {
    return (
      <label className={`relative inline-flex items-center ${className}`}>
        <span className="sr-only">{t('dashboard.selectLanguage')}</span>
        <select
          value={current}
          onChange={(event) => i18n.changeLanguage(event.target.value)}
          className="h-9 appearance-none rounded-md border-0 bg-transparent py-1 pl-2 pr-6 font-body text-sm font-medium text-ink-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-popover text-popover-foreground">{lang.name}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-1.5 text-xs text-ink-3">▾</span>
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
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.name}
          className="h-8 justify-start gap-2 px-2 text-sm"
        >
          <span aria-hidden>{lang.flag}</span>{lang.name}
        </Button>
      ))}
    </div>
  );
};
