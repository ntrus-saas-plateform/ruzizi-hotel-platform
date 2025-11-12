'use client';

import { ReactNode } from 'react';
import { I18nContext, useLocale } from '@/lib/i18n/useTranslation';

interface I18nProviderProps {
  children: ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const { locale, setLocale, t } = useLocale();

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
