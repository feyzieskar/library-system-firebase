import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

const resources = {
    en: { translation: en },
    tr: { translation: tr }
};

const savedLanguage = localStorage.getItem('library-lang') || 'tr';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes values
        }
    });

// Save to localStorage when language changes
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('library-lang', lng);
});

export default i18n;
