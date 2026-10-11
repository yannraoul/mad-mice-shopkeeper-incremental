import { content } from '../content/index.ts';
import { LANGS, type Lang } from '../content/schema.ts';

function initial(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  } catch {}
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
}

export const i18n = $state({ lang: initial() });

export function setLang(lang: Lang) {
  i18n.lang = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch {}
  document.documentElement.lang = lang;
}

/** Translate a string key; falls back to the key itself. */
export function t(key: string): string {
  return content.strings[i18n.lang][key] ?? key;
}
