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
  { code: 'pt-BR', short: 'BR', flag: '🇧🇷', name: 'Português (Brasil)' },
  { code: 'pt-PT', short: 'PT', flag: '🇵🇹', name: 'Português (Portugal)' },
  { code: 'en', short: 'EN', flag: '🇺🇸', name: 'English' },
  { code: 'es', short: 'ES', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', short: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'it', short: 'IT', flag: '🇮🇹', name: 'Italiano' },
  { code: 'de', short: 'DE', flag: '🇩🇪', name: 'Deutsch' },
];

/** Idioma da lista que corresponde ao idioma atual do i18n ("pt" sem região → "pt-PT"; "pt-BR" → "pt-BR"; desconhecido → pt-PT). */
export function matchAppLanguage(current: string): AppLanguage {
  const exact = APP_LANGUAGES.find((lang) => lang.code === current);
  if (exact) return exact.code;
  const base = current.split('-')[0];
  // "pt" sem região continua Portugal, mesmo com o Brasil em primeiro na lista (pedido do dono, 14/11).
  if (base === 'pt') return 'pt-PT';
  return APP_LANGUAGES.find((lang) => lang.code.split('-')[0] === base)?.code ?? 'pt-PT';
}

/**
 * TRAVA FUTURA DE IDIOMAS — ponto único.
 * Um app só (decisão do dono, 13/11/2026): o assinante brasileiro tem só o pt-BR no plano
 * base e os outros idiomas são um adicional pago; fora do Brasil, todos os idiomas entram.
 * Quando a cobrança existir, é AQUI que se decide quais idiomas o usuário atual pode usar
 * (ex.: pelo plano da conta). As bandeiras do topo e os seletores leem esta função: um idioma
 * fora da lista aparece apagado e não troca.
 * Hoje não há pagamento nem trava: devolve todos os 7.
 */
export function idiomasLiberados(): readonly AppLanguage[] {
  return APP_LANGUAGES.map((lang) => lang.code);
}
