import { LANGS, type Content, type Lang } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { Action, State } from '../engine/types.ts';
import type { Phase } from '../engine/phases.ts';
import { PHASES } from '../engine/phases.ts';
import { dayOfWeek, DAYS_PER_WEEK } from '../engine/economy.ts';

export interface HeaderView {
  title: string;
  /** "Day 3", "Morning", "12 coins": the status line, split so a UI can lay it out freely. */
  day: string;
  phase: string;
  phaseId: Phase;
  /** The three phases of the day, the current one flagged, for the phase pill. */
  phases: { id: Phase; label: string; active: boolean }[];
  /** "Day" overline and the day of the week: 3 of 7. */
  dayLabel: string;
  dayNo: number;
  dayOf: number;
  money: string;
  /** The coin count alone and its unit ("coins"), for a compact coin pill. */
  coins: number;
  coinsLabel: string;
  /** The button that moves the day along. */
  endPhase: { label: string; action: Action };
  /** The daily routine switch; null until the foreman mouse is hired. */
  routine: { label: string; on: boolean; status: string; action: Action } | null;
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

export function buildHeaderView(c: Content, s: State, t: Translate): HeaderView {
  return {
    title: t('game.title'),
    day: t('ui.day', { n: s.day }),
    phase: t(`phase.${s.phase}`),
    phaseId: s.phase,
    phases: PHASES.map((id) => ({ id, label: t(`phase.${id}`), active: id === s.phase })),
    dayLabel: t('ui.dayLabel'),
    dayNo: dayOfWeek(s.day),
    dayOf: DAYS_PER_WEEK,
    money: t('ui.money', { n: s.money }),
    coins: s.money,
    coinsLabel: t('ui.coins'),
    endPhase: { label: t(END_LABEL[s.phase]), action: { type: 'endPhase' } },
    routine: s.unlocks.includes('routine')
      ? {
          label: t(s.routine ? 'routine.on' : 'routine.off'),
          on: s.routine,
          status: s.routine ? t(`routine.status.${s.phase}`) : '',
          action: { type: 'setRoutine', on: !s.routine },
        }
      : null,
    languages: LANGS.map((l) => ({ value: l, label: l.toUpperCase() })),
    language: t.locale,
    languageLabel: t('ui.language'),
    settingsLabel: t('settings.open'),
  };
}
