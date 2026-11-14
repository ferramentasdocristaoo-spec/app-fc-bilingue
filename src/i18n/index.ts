import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptPtTranslation from './locales/pt-PT/translation.json';
import ptBrTranslation from './locales/pt-BR/translation.json';
import enTranslation from './locales/en/translation.json';
import frTranslation from './locales/fr/translation.json';
import esTranslation from './locales/es/translation.json';
import itTranslation from './locales/it/translation.json';
import deTranslation from './locales/de/translation.json';
import {
  type AppLanguage,
  fetchCountry,
  getCountryOverride,
  getManualLanguage,
  migrateLegacyLanguage,
  resolveInitialLanguage,
  saveManualLanguage,
} from './geo-language';

const resources = {
  'pt-PT': { translation: ptPtTranslation },
  'pt-BR': { translation: ptBrTranslation },
  en: { translation: enTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  it: { translation: itTranslation },
  de: { translation: deTranslation },
};

const navigatorLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];

migrateLegacyLanguage();

// 1º render: escolha manual salva ou, sem ela, país forçado/navegador (sem esperar rede).
const override = getCountryOverride();
const initial = resolveInitialLanguage({
  manual: getManualLanguage(),
  country: override,
  navigatorLanguages: navigatorLanguages(),
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initial,
    // pt-BR só tem a interface traduzida; o que faltar cai primeiro no pt-PT (e só depois no inglês).
    fallbackLng: { 'pt-BR': ['pt-PT', 'en'], default: ['en'] },
    supportedLngs: ['pt-PT', 'pt-BR', 'en', 'fr', 'es', 'it', 'de'],
    interpolation: {
      escapeValue: false,
    },
  });

const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncHtmlLang(initial);
i18n.on('languageChanged', syncHtmlLang);

/** Troca feita pelo usuário: fica salva e passa a ter prioridade sobre o país. */
export function setLanguageManually(lang: AppLanguage) {
  saveManualLanguage(lang);
  return i18n.changeLanguage(lang);
}

// Sem escolha manual: pergunta o país à Cloudflare e ajusta (só se o usuário não trocou nesse meio-tempo).
if (!getManualLanguage() && !override) {
  void fetchCountry().then((country) => {
    if (!country || getManualLanguage()) return;
    const lang = resolveInitialLanguage({ country, navigatorLanguages: navigatorLanguages() });
    if (lang !== i18n.language) void i18n.changeLanguage(lang);
  });
}

export default i18n;
