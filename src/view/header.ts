import { LANGS, type Content, type Lang } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import type { Phase } from '../engine/phases.ts';

export interface HeaderView {
  title: string;
  /** "Day 3", "Morning", "12 coins": the status line, split so a UI can lay it out freely. */
  day: string;
  phase: string;
  phaseId: Phase;
  money: string;
  /** The button that moves the day along. */
  endPhase: { label: string; action: Action };
  languages: { value: Lang; label: string }[];
  language: Lang;
  languageLabel: string;
  settingsLabel: string;
}

const END_LABEL: Record<Phase, string> = {
  morning: 'ui.endMorning',
  afternoon: 'ui.endAfternoon',
  evening: 'ui.endEvening',
};

export function buildHeaderView(_c: Content, s: State, t: Translate): HeaderView {
  return {
    title: t('game.title'),
    day: t('ui.day', { n: s.day }),
    phase: t(`phase.${s.phase}`),
    phaseId: s.phase,
    money: t('ui.money', { n: s.money }),
    endPhase: { label: t(END_LABEL[s.phase]), action: { type: 'endPhase' } },
    languages: LANGS.map((l) => ({ value: l, label: l.toUpperCase() })),
    language: t.locale,
    languageLabel: t('ui.language'),
    settingsLabel: t('settings.open'),
  };
}
