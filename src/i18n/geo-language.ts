/**
 * Idioma inicial pelo país do visitante.
 * Prioridade: escolha manual salva > país (Cloudflare) > idiomas do navegador > en.
 */
export const SUPPORTED_LANGUAGES = ['pt-PT', 'pt-BR', 'es', 'en', 'fr', 'it', 'de'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const MANUAL_LANGUAGE_KEY = 'fc-idioma-manual';
export const COUNTRY_OVERRIDE_KEY = 'fc-pais-teste';
export const DEFAULT_LANGUAGE: AppLanguage = 'en';

// Brasil tem o seu próprio português; os outros países lusófonos ficam com o de Portugal.
const PT = ['PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'MO'];
const BR = ['BR'];
const ES = [
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'BO', 'VE', 'EC', 'UY', 'PY', 'CR', 'PA',
  'GT', 'HN', 'SV', 'NI', 'DO', 'CU', 'PR', 'GQ', 'AD',
];
const FR = [
  'FR', 'BE', 'LU', 'MC', 'SN', 'CI', 'CM', 'CD', 'CG', 'BJ', 'BF', 'ML', 'NE',
  'TG', 'GA', 'MG', 'HT', 'GN', 'TD', 'CF', 'BI', 'RW', 'DJ', 'KM', 'RE', 'GP',
  'MQ', 'GF', 'PF', 'NC', 'YT', 'PM', 'BL', 'MF', 'WF',
];
const IT = ['IT', 'SM', 'VA'];
const DE = ['DE', 'AT', 'CH', 'LI'];

const COUNTRY_MAP: Record<string, AppLanguage> = {};
for (const [list, lang] of [[PT, 'pt-PT'], [BR, 'pt-BR'], [ES, 'es'], [FR, 'fr'], [IT, 'it'], [DE, 'de']] as const) {
  for (const c of list) COUNTRY_MAP[c] = lang;
}

/** Países com mais de um idioma oficial: o navegador decide entre as opções. */
const MULTILINGUAL: Record<string, AppLanguage[]> = {
  CH: ['de', 'fr', 'it'],
  BE: ['fr', 'de'],
  LU: ['fr', 'de'],
  CA: ['en', 'fr'],
};

/** Normaliza um código qualquer (pt-BR, es-419, de_AT…) para um idioma do app. `pt-BR` fica pt-BR; `pt` sem região (ou pt-PT, pt-AO…) é pt-PT. */
export function normalizeLanguage(code?: string | null): AppLanguage | null {
  if (!code) return null;
  const [base, region = ''] = code.trim().replace('_', '-').toLowerCase().split('-');
  switch (base) {
    case 'pt': return region === 'br' ? 'pt-BR' : 'pt-PT';
    case 'es': return 'es';
    case 'en': return 'en';
    case 'fr': return 'fr';
    case 'it': return 'it';
    case 'de': return 'de';
    default: return null;
  }
}

export function languageFromNavigator(languages: readonly string[] = []): AppLanguage | null {
  for (const l of languages) {
    const n = normalizeLanguage(l);
    if (n) return n;
  }
  return null;
}

export function countryToLanguage(
  country?: string | null,
  navigatorLanguages: readonly string[] = [],
): AppLanguage | null {
  if (!country) return null;
  const c = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c) || c === 'XX' || c === 'T1') return null;
  const options = MULTILINGUAL[c];
  if (options) {
    for (const l of navigatorLanguages) {
      const n = normalizeLanguage(l);
      if (n && options.includes(n)) return n;
    }
    return options[0];
  }
  return COUNTRY_MAP[c] ?? 'en';
}

export function resolveInitialLanguage(opts: {
  manual?: string | null;
  country?: string | null;
  navigatorLanguages?: readonly string[];
}): AppLanguage {
  const nav = opts.navigatorLanguages ?? [];
  return (
    (SUPPORTED_LANGUAGES as readonly string[]).includes(opts.manual ?? '')
      ? (opts.manual as AppLanguage)
      : countryToLanguage(opts.country, nav) ?? languageFromNavigator(nav) ?? DEFAULT_LANGUAGE
  );
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function getManualLanguage(): AppLanguage | null {
  const v = safeGet(MANUAL_LANGUAGE_KEY);
  return v && (SUPPORTED_LANGUAGES as readonly string[]).includes(v) ? (v as AppLanguage) : null;
}

/**
 * Quem já usava o app tinha o idioma salvo pelo detector antigo (i18nextLng).
 * Esse valor vira escolha manual uma única vez, para ninguém ver o idioma mudar sozinho.
 */
export function migrateLegacyLanguage(): void {
  if (getManualLanguage()) return;
  const legacy = normalizeLanguage(safeGet('i18nextLng'));
  if (legacy) saveManualLanguage(legacy);
  try { localStorage.removeItem('i18nextLng'); } catch { /* ignore */ }
}

export function saveManualLanguage(lang: AppLanguage): void {
  try { localStorage.setItem(MANUAL_LANGUAGE_KEY, lang); } catch { /* modo privado */ }
}

/** País forçado para teste: ?pais=XX na URL (fica salvo) ou localStorage fc-pais-teste. */
export function getCountryOverride(search = typeof location !== 'undefined' ? location.search : ''): string | null {
  try {
    const q = new URLSearchParams(search).get('pais');
    if (q) {
      localStorage.setItem(COUNTRY_OVERRIDE_KEY, q.toUpperCase());
      return q.toUpperCase();
    }
  } catch { /* ignore */ }
  return safeGet(COUNTRY_OVERRIDE_KEY);
}

export function parseTraceCountry(trace: string): string | null {
  const m = trace.match(/^loc=([A-Z]{2})$/m);
  return m ? m[1] : null;
}

/** Descobre o país pela Cloudflare (/cdn-cgi/trace). Em localhost não existe: devolve null. */
export async function fetchCountry(timeoutMs = 2000): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('/cdn-cgi/trace', { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return null;
    return parseTraceCountry(await res.text());
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
