import type { Lang } from '../content/schema.ts';

// Framework-free translation. Any UI (Svelte, canvas, a native shell...) can build a `Translate`
// from the content's string tables; view models only ever receive one, never import a UI store.

export type Params = Record<string, string | number>;

/** Looks a string key up in one language, replacing `{name}` placeholders. */
export interface Translate {
  (key: string, params?: Params): string;
  /** The language it translates into (used, for example, to lower-case names mid-sentence). */
  readonly locale: Lang;
}

export type StringTables = Record<Lang, Record<string, string>>;

export function translateKey(strings: StringTables, lang: Lang, key: string, params: Params = {}): string {
  const text = strings[lang][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

export function createTranslate(strings: StringTables, lang: Lang): Translate {
  const t = (key: string, params?: Params) => translateKey(strings, lang, key, params);
  return Object.defineProperty(t, 'locale', { value: lang, enumerable: true }) as Translate;
}
