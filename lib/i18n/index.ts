import { fr } from './translations/fr';
import { en } from './translations/en';
import { Locale, defaultLocale } from './config';

const translations = {
  fr,
  en,
};

export function getTranslations(locale: Locale = defaultLocale) {
  return translations[locale] || translations[defaultLocale];
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const t = getTranslations(locale);
  const keys = key.split('.');
  let value: any = t;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

export { fr, en };
export * from './config';
