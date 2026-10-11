import { content } from '../content/index.ts';
import { LANGS, type Lang } from '../content/schema.ts';
import { translateKey, type Params, type Translate } from './core.ts';

// Svelte adapter around the framework-free translation core: it owns the reactive current
// language (and its persistence in the browser); the lookup itself lives in `core.ts`.

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

/**
 * Translate a string key; falls back to the key itself. Reads the reactive language, so a Svelte
 * `$derived` that calls it (directly or through a view model) re-runs when the language changes.
 */
export const t: Translate = Object.defineProperty(
  (key: string, params?: Params) => translateKey(content.strings, i18n.lang, key, params),
  'locale',
  { get: () => i18n.lang, enumerable: true },
) as Translate;
