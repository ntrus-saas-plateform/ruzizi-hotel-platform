'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Locale, defaultLocale } from './config';
import { translate, getTranslations } from './index';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string) => key,
});

export function useTranslation() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  
  return context;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Load locale from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'fr' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  return { locale, setLocale, t };
}
