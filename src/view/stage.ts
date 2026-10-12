import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { currentStage, modifier, rivalPenalty } from '../engine/economy.ts';
import type { State } from '../engine/types.ts';
import { rivalErrands, unlockName } from './text.ts';

export interface StageView {
  /** "The first week: day 3 / 7 · 120 / 240 coins earned" */
  progress: string;
  name: string;
  day: number;
  days: number;
  earned: number;
  target: number;
  /** 0..100, for a progress bar. */
  pct: number;
  /** "day 3 / 7" and "120 / 240 coins earned", split so a UI can lay them out. */
  dayText: string;
  earnedText: string;
  /** One pip per day of the week; `rival` marks the day the rival hive starts stealing. */
  pips: { state: 'done' | 'current' | 'todo'; rival: boolean }[];
  /** Short form of the rival warning for a compact chip; the full text is `warning` + `hints`. */
  chip: { label: string; hintLabel: string } | null;
  /** The rival hive: stealing now, about to start, or coming next week (null when no threat). */
  warning: string | null;
  /** How the player can stop the threat: one line per relieving errand. */
  hints: string[];
  /** Result of the week that just closed, shown on the first day after it. */
  lastWeek: { passed: boolean; text: string } | null;
  /** Final stage cleared: the optional ending text (from a pack) or a generic line. */
  complete: string | null;
}

export function buildStageView(c: Content, s: State, t: Translate): StageView {
  const stage = currentStage(c, s);
  // Revenue shown includes today's sales so far (the week is judged after its last day).
  const earned = s.stage.revenue + s.report.revenue;
  const today = s.stage.day + 1;
  const rival = stage.rival;
  const relief = modifier(c, s, 'rivalRelief');
  const stolen = rival ? rivalPenalty(c, s, rival.ingredient) : 0;
  const ingredientName = (id: string) => t(`ingredient.${id}`).toLocaleLowerCase(t.locale);

  // The rival is announced before it starts (grace period) and a week ahead, so it is never a surprise.
  const startingSoon = rival && today < rival.startsOnDay && rival.amount - relief > 0 ? rival : null;
  const nextRival = c.stages[s.stage.index + 1]?.rival;
  const nextWeek = !rival && !!nextRival && today > stage.days - 3 && nextRival.amount - relief > 0;

  let warning: string | null = null;
  if (stolen > 0 && rival) warning = t('stage.rival', { amount: stolen, ingredient: ingredientName(rival.ingredient) });
  else if (startingSoon)
    warning = t('stage.rivalSoon', {
      amount: startingSoon.amount - relief,
      ingredient: ingredientName(startingSoon.ingredient),
      day: startingSoon.startsOnDay,
    });
  else if (nextWeek) warning = t('stage.rivalNextWeek');

  const hints: string[] = [];
  if (warning) {
    if (!s.unlocks.includes('errandsBoard')) hints.push(t('stage.rivalHelp.needBoard'));
    else
      for (const e of rivalErrands(c)) {
        if (s.errands[e.id]?.status === 'done') continue;
        const name = t(e.nameKey);
        if (s.errands[e.id]?.status === 'active') {
          hints.push(t('stage.rivalHelp.active', { name }));
          continue;
        }
        const missing = e.requires.filter((u) => !s.unlocks.includes(u));
        hints.push(
          missing.length > 0
            ? t('stage.rivalHelp.locked', { name, unlock: missing.map((u) => unlockName(c, t, u)).join(', ') })
            : t('stage.rivalHelp.available', { name }),
        );
      }
  }

  const chip = !warning
    ? null
    : {
        label:
          stolen > 0 ? t('stage.chip.active')
          : startingSoon ? t('stage.chip.soon', { day: startingSoon.startsOnDay })
          : t('stage.chip.nextWeek'),
        hintLabel: t('stage.hint'),
      };
  const rivalDay = startingSoon?.startsOnDay ?? (stolen > 0 ? rival?.startsOnDay : undefined);
  const shownDay = Math.min(today, stage.days);
  const week = s.stage.day === 0 ? s.lastWeek : null;
  const ending = c.strings[t.locale]['ending.text'];
  return {
    progress: t('stage.progress', {
      name: t(stage.nameKey),
      day: Math.min(today, stage.days),
      days: stage.days,
      revenue: earned,
      target: stage.target,
    }),
    name: t(stage.nameKey),
    day: Math.min(today, stage.days),
    days: stage.days,
    earned,
    target: stage.target,
    dayText: t('stage.dayOf', { week: s.stage.index + 1, day: shownDay, days: stage.days }),
    earnedText: t('stage.earned', { n: earned, target: stage.target }),
    pips: Array.from({ length: stage.days }, (_, i) => ({
      state: i + 1 < shownDay ? 'done' : i + 1 === shownDay ? 'current' : 'todo',
      rival: rivalDay === i + 1,
    })),
    chip,
    pct: Math.min(100, Math.round((earned / stage.target) * 100)),
    warning,
    hints,
    lastWeek: week
      ? {
          passed: week.passed,
          text: week.passed
            ? t('stage.lastWeekPassed')
            : t('stage.lastWeekMissed', { revenue: week.revenue, target: week.target }),
        }
      : null,
    complete: s.completed ? (ending ?? t('stage.complete')) : null,
  };
}
