'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useI18nStore } from '../store/i18nStore';

export default function ClientInitializer() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  useEffect(() => {
    initAuth();
    initTheme();
    // Re-sync language preferences
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as any;
      if (savedLang) {
        setLanguage(savedLang);
      }
    }
  }, [initAuth, initTheme, setLanguage]);

  return null;
}
