import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export const LanguageSwitcher = ({ className = '', variant = 'horizontal' }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language.split('-')[0];

  return (
    <div className={`flex ${variant === 'horizontal' ? 'gap-2' : 'flex-col gap-1'} ${className}`}>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLanguage === lang.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.name}
          className={`h-8 w-8 p-0 text-lg ${
            currentLanguage === lang.code
              ? 'ring-2 ring-offset-2 ring-primary'
              : 'hover:bg-accent'
          }`}
        >
          {lang.flag}
        </Button>
      ))}
    </div>
  );
};
