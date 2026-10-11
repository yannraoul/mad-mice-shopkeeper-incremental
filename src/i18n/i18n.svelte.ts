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

function syncDocument() {
  document.documentElement.lang = i18n.lang;
  document.title = content.strings[i18n.lang]['game.title'] ?? '';
}
syncDocument();

export function setLang(lang: Lang) {
  i18n.lang = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch {}
  syncDocument();
}

/** Translate a string key, replacing `{name}` placeholders; falls back to the key itself. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = content.strings[i18n.lang][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}
