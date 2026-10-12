import type { Content, Lang } from '../content/schema.ts';
import { LANGS } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { LoadErrorCode } from '../save/save.ts';

export interface MenuView {
  title: string;
  back: string;
  languageLabel: string;
  languages: { value: Lang; label: string }[];
  language: Lang;
  /** New game */
  newGame: {
    title: string;
    seedLabel: string;
    seedHint: string;
    button: string;
    /** "Start over…" and the line under it (asks to confirm, replaces the save). */
    startOver: string;
    note: string;
    /** Ask this before throwing the current game away. */
    confirm: string;
  };
  /** Save tools */
  save: {
    title: string;
    /** "Your game saves automatically..." or the developer-mode note. */
    note: string;
    exportLabel: string;
    importTitle: string;
    importHint: string;
    loadLabel: string;
  };
}

/** The settings page. `persistent` is false for throwaway developer-hook games. */
export function buildMenuView(_c: Content, t: Translate, persistent: boolean): MenuView {
  return {
    title: t('settings.title'),
    back: t('settings.close'),
    languageLabel: t('ui.language'),
    languages: LANGS.map((l) => ({ value: l, label: l.toUpperCase() })),
    language: t.locale,
    newGame: {
      title: t('settings.newGame'),
      seedLabel: t('save.seed'),
      seedHint: t('save.seedHint'),
      button: t('save.new'),
      startOver: t('settings.startOver'),
      note: t('save.newNote'),
      confirm: t('save.confirmNew'),
    },
    save: {
      title: t('save.title'),
      note: persistent ? t('save.autosaved') : t('save.devMode'),
      exportLabel: t('save.export'),
      importTitle: t('save.import'),
      importHint: t('save.importHint'),
      loadLabel: t('save.load'),
    },
  };
}

/** Interpret the seed field: empty means "random" (ok, no seed); otherwise a whole number >= 0. */
export function parseSeedInput(text: string): { ok: true; seed: number | undefined } | { ok: false } {
  const v = text.trim();
  if (v === '') return { ok: true, seed: undefined };
  if (!/^\d{1,10}$/.test(v)) return { ok: false };
  const n = Number(v);
  return n >= 0 && n < 2 ** 31 ? { ok: true, seed: n } : { ok: false };
}

export const seedError = (t: Translate) => t('save.seedInvalid');

/** Result line under the import box: success or a translated reason. */
export function describeImportResult(t: Translate, result: 'ok' | LoadErrorCode): { ok: boolean; text: string } {
  return result === 'ok'
    ? { ok: true, text: t('save.loaded') }
    : { ok: false, text: t('save.error', { error: t(`save.error.${result}`) }) };
}
