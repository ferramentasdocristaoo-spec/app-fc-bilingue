import type { AppLanguage } from './geo-language';

export interface AppLanguageOption {
  code: AppLanguage;
  /** Sigla curta mostrada ao lado da bandeira (PT, EN…). */
  short: string;
  /** Emoji: só para listas de texto (menu lateral antigo). No topo entram as bandeiras em SVG (`components/flags/Flag.tsx`), porque o Windows não mostra emoji de bandeira. */
  flag: string;
  /** Nome do idioma, escrito no próprio idioma. */
  name: string;
}

/** Idiomas do app, na ordem do seletor; o topo (bandeiras), o Dock e os Ajustes usam a mesma lista. */
export const APP_LANGUAGES: readonly AppLanguageOption[] = [
  { code: 'pt-PT', short: 'PT', flag: '🇵🇹', name: 'Português' },
  { code: 'en', short: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'es', short: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', short: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'it', short: 'IT', flag: '🇮🇹', name: 'Italiano' },
  { code: 'de', short: 'DE', flag: '🇩🇪', name: 'Deutsch' },
];

/** Idioma da lista que corresponde ao idioma atual do i18n ("pt" → "pt-PT"; desconhecido → pt-PT). */
export function matchAppLanguage(current: string): AppLanguage {
  const exact = APP_LANGUAGES.find((lang) => lang.code === current);
  if (exact) return exact.code;
  const base = current.split('-')[0];
  return APP_LANGUAGES.find((lang) => lang.code.split('-')[0] === base)?.code ?? 'pt-PT';
}

/**
 * TRAVA FUTURA DE IDIOMAS — ponto único.
 * Este app é a versão internacional, vendida por assinatura com preço próprio; mais tarde
 * haverá uma versão só para o Brasil. Quando a cobrança existir, é AQUI que se decide quais
 * idiomas o utilizador atual pode usar (ex.: pelo plano da conta). As bandeiras do topo e os
 * seletores leem esta função: um idioma fora da lista aparece apagado e não troca.
 * Hoje não há pagamento nem trava: devolve todos.
 */
export function idiomasLiberados(): readonly AppLanguage[] {
  return APP_LANGUAGES.map((lang) => lang.code);
}
