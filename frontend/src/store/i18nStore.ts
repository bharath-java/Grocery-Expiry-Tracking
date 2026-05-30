import { create } from 'zustand';
import { translations, Language } from '../utils/translations';

interface I18nState {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], variables?: Record<string, string | number>) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  lang: 'en',
  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
      // For RTL support in Arabic
      if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    }
    set({ lang });
  },
  t: (key, variables) => {
    const { lang } = get();
    let text = translations[lang]?.[key] || translations['en']?.[key] || '';

    if (variables) {
      Object.keys(variables).forEach((v) => {
        text = text.replace(`{${v}}`, variables[v].toString());
      });
    }

    return text;
  }
}));
export type { Language };
