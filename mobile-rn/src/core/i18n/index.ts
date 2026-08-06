import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';
import fr from './fr.json';

const deviceLang = getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
