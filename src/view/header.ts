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
  /** The routine switches that are available: the foreman (morning and afternoon), the accounting mouse (upgrades), auto sleep. */
  routines: { part: 'day' | 'accounting' | 'sleep'; label: string; on: boolean; status: string; action: Action }[];
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
    routines: routineSwitches(s, t),
    languages: LANGS.map((l) => ({ value: l, label: l.toUpperCase() })),
    language: t.locale,
    languageLabel: t('ui.language'),
    settingsLabel: t('settings.open'),
  };
}

const routineSwitches = (s: State, t: Translate): HeaderView['routines'] => {
  const day = s.phase !== 'evening';
  const rows = [
    { part: 'day', on: s.routine, has: s.unlocks.includes('routine'), status: s.routine && day ? t(`routine.status.${s.phase}`) : '' },
    { part: 'accounting', on: s.routineAccounting, has: s.unlocks.includes('accountant'), status: s.routineAccounting && !day ? t('routine.status.eveningAccounting') : '' },
    { part: 'sleep', on: s.routineSleep, has: s.unlocks.includes('routine'), status: '' },
  ] as const;
  return rows
    .filter((r) => r.has)
    .map((r) => ({ part: r.part, label: t(`routine.${r.part}`), on: r.on, status: r.status, action: { type: 'setRoutine', on: !r.on, part: r.part } }));
};
