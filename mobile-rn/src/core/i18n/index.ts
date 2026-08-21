import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { cache } from '../storage/cache';

import enCore from './locales/en/core.json';
import enAuth from './locales/en/auth.json';
import enContent from './locales/en/content.json';
import enAi from './locales/en/ai.json';
import enSocial from './locales/en/social.json';
import frCore from './locales/fr/core.json';
import frAuth from './locales/fr/auth.json';
import frContent from './locales/fr/content.json';
import frAi from './locales/fr/ai.json';
import frSocial from './locales/fr/social.json';

const en = { ...enCore, ...enAuth, ...enContent, ...enAi, ...enSocial };
const fr = { ...frCore, ...frAuth, ...frContent, ...frAi, ...frSocial };

const LANG_KEY = 'pref_lang';

function initialLanguage(): string {
  const saved = cache.get<string>(LANG_KEY);
  if (saved === 'en' || saved === 'fr') return saved;
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Called by the profile language switcher after the backend confirms.
export function setAppLanguage(lng: 'en' | 'fr') {
  cache.set(LANG_KEY, lng);
  return i18n.changeLanguage(lng);
}

export default i18n;
