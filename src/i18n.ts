import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import de from 'locales/de.json';
import en from 'locales/en.json';

import { LanguageE } from 'types/enums';

const resources = {
  de: {
    translation: de,
  },
  en: {
    translation: en,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: LanguageE.EN,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
