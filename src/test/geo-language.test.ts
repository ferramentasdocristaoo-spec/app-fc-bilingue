import { beforeEach, describe, expect, it } from 'vitest';
import {
  countryToLanguage,
  getCountryOverride,
  getManualLanguage,
  languageFromNavigator,
  MANUAL_LANGUAGE_KEY,
  migrateLegacyLanguage,
  normalizeLanguage,
  parseTraceCountry,
  resolveInitialLanguage,
  saveManualLanguage,
} from '@/i18n/geo-language';

describe('mapa país → idioma', () => {
  it.each([
    ['PT', 'pt-PT'], ['BR', 'pt-BR'], ['AO', 'pt-PT'], ['MZ', 'pt-PT'], ['CV', 'pt-PT'],
    ['ES', 'es'], ['MX', 'es'], ['AR', 'es'], ['CO', 'es'], ['CL', 'es'], ['PE', 'es'],
    ['BO', 'es'], ['VE', 'es'],
    ['FR', 'fr'], ['BE', 'fr'], ['SN', 'fr'],
    ['IT', 'it'], ['SM', 'it'],
    ['DE', 'de'], ['AT', 'de'], ['CH', 'de'],
    ['US', 'en'], ['GB', 'en'], ['JP', 'en'], ['NG', 'en'],
  ])('%s → %s', (country, lang) => {
    expect(countryToLanguage(country)).toBe(lang);
  });

  it('aceita minúsculas e espaços', () => {
    expect(countryToLanguage(' br ')).toBe('pt-BR');
    expect(countryToLanguage(' pt ')).toBe('pt-PT');
  });

  it('país inválido ou desconhecido da Cloudflare devolve null', () => {
    expect(countryToLanguage(null)).toBeNull();
    expect(countryToLanguage('XX')).toBeNull();
    expect(countryToLanguage('T1')).toBeNull();
    expect(countryToLanguage('Brasil')).toBeNull();
  });

  it('Suíça italiana/francesa usa o idioma do navegador', () => {
    expect(countryToLanguage('CH', ['it-CH'])).toBe('it');
    expect(countryToLanguage('CH', ['fr-CH', 'de'])).toBe('fr');
    expect(countryToLanguage('CH', ['en-US'])).toBe('de');
    expect(countryToLanguage('BE', ['nl-BE', 'de-BE'])).toBe('de');
    expect(countryToLanguage('CA', ['fr-CA'])).toBe('fr');
  });
});

describe('navegador', () => {
  it('normaliza códigos', () => {
    expect(normalizeLanguage('pt-BR')).toBe('pt-BR');
    expect(normalizeLanguage('pt_BR')).toBe('pt-BR');
    expect(normalizeLanguage('pt')).toBe('pt-PT');
    expect(normalizeLanguage('pt-PT')).toBe('pt-PT');
    expect(normalizeLanguage('pt-AO')).toBe('pt-PT');
    expect(normalizeLanguage('es-419')).toBe('es');
    expect(normalizeLanguage('de_AT')).toBe('de');
    expect(normalizeLanguage('ja')).toBeNull();
  });
  it('pega o primeiro suportado', () => {
    expect(languageFromNavigator(['ja', 'it-IT', 'en'])).toBe('it');
    expect(languageFromNavigator(['ja', 'ko'])).toBeNull();
  });
});

describe('prioridade', () => {
  it('escolha manual vence país e navegador', () => {
    expect(resolveInitialLanguage({ manual: 'fr', country: 'BR', navigatorLanguages: ['de'] })).toBe('fr');
    expect(resolveInitialLanguage({ manual: 'pt-BR', country: 'PT' })).toBe('pt-BR');
  });
  it('país vence navegador', () => {
    expect(resolveInitialLanguage({ country: 'MX', navigatorLanguages: ['en-US'] })).toBe('es');
    expect(resolveInitialLanguage({ country: 'BR', navigatorLanguages: ['pt-PT'] })).toBe('pt-BR');
    expect(resolveInitialLanguage({ country: 'PT', navigatorLanguages: ['pt-BR'] })).toBe('pt-PT');
  });
  it('sem país usa navegador; sem nada usa en', () => {
    expect(resolveInitialLanguage({ country: null, navigatorLanguages: ['it'] })).toBe('it');
    expect(resolveInitialLanguage({ country: null, navigatorLanguages: ['pt-BR', 'en'] })).toBe('pt-BR');
    expect(resolveInitialLanguage({})).toBe('en');
  });
  it('manual inválido é ignorado', () => {
    expect(resolveInitialLanguage({ manual: 'xx', country: 'DE' })).toBe('de');
  });
});

describe('armazenamento', () => {
  beforeEach(() => localStorage.clear());
  it('salva e lê a escolha manual', () => {
    expect(getManualLanguage()).toBeNull();
    saveManualLanguage('it');
    expect(localStorage.getItem(MANUAL_LANGUAGE_KEY)).toBe('it');
    expect(getManualLanguage()).toBe('it');
  });
  it('idioma salvo pelo detector antigo vira escolha manual', () => {
    localStorage.setItem('i18nextLng', 'es-ES');
    migrateLegacyLanguage();
    expect(getManualLanguage()).toBe('es');
    expect(localStorage.getItem('i18nextLng')).toBeNull();
  });
  it('escolha manual existente não é sobrescrita pela antiga', () => {
    saveManualLanguage('de');
    localStorage.setItem('i18nextLng', 'fr');
    migrateLegacyLanguage();
    expect(getManualLanguage()).toBe('de');
  });
  it('país forçado via ?pais=', () => {
    expect(getCountryOverride('?pais=es')).toBe('ES');
    expect(getCountryOverride('')).toBe('ES');
  });
  it('lê loc do /cdn-cgi/trace', () => {
    expect(parseTraceCountry('fl=1\nip=1.2.3.4\nloc=BR\ntls=TLSv1.3')).toBe('BR');
    expect(parseTraceCountry('fl=1')).toBeNull();
  });
});
