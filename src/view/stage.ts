import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import { dayOfWeek, DAYS_PER_WEEK, goalProgress, modifier, openQuests, rivalPenalty, shopQuest, weekOf } from '../engine/economy.ts';
import type { State } from '../engine/types.ts';
import { rivalErrands, unlockName } from './text.ts';

export interface StageView {
  /** The quest in progress ("The first steps"), or "Every goal is reached". */
  name: string;
  /** "week 3 · day 2 / 7": the calendar. */
  dayText: string;
  /** "120 / 240 coins earned" for the open quest's goal (empty when there is none). */
  earnedText: string;
  /** 0..100, for a progress bar. */
  pct: number;
  /** "+1 more goal(s)" when several quests are open at once. */
  more: string | null;
  /** Every open quest with its goals and reward, for the expandable list. */
  open: QuestRow[];
  /** One pip per day of the week; `rival` marks the day the rival hive starts stealing. */
  pips: { state: 'done' | 'current' | 'todo'; rival: boolean }[];
  /** Short form of the rival warning for a compact chip; the full text is `warning` + `hints`. */
  chip: { label: string; hintLabel: string } | null;
  /** The rival hive: stealing now, about to start, or coming when the open quest is reached (null when no threat). */
  warning: string | null;
  /** How the player can stop the threat: one line per relieving errand. */
  hints: string[];
  /** "New: Sunflower patch, Errands board." for what the latest quest opened (null otherwise). */
  newThings: string | null;
  /** Final quest delivered: the optional ending text (from a pack) or a generic line. */
  complete: string | null;
}

export interface QuestRow {
  id: string;
  name: string;
  desc: string;
  goals: { text: string; pct: number; done: boolean }[];
  /** "Reward: 120 coins · +50 more coins if done within 7 days of opening" (empty when there is none). */
  reward: string;
}

function questRow(c: Content, s: State, t: Translate, q: Content['quests'][number]): QuestRow {
  const goals = q.goals.map((g) => {
    const p = goalProgress(c, s, g);
    const text =
      g.type === 'earn' ? t('quest.earned', { n: p.have, target: p.need })
      : g.type === 'own' ? t('quest.goal.own', { node: t(`node.${g.node}`) })
      : g.type === 'errand' ? t('quest.goal.errand', { errand: t(c.errands.find((e) => e.id === g.errand)!.nameKey) })
      : t('quest.goal.day', { day: g.day });
    return { text, pct: Math.round(Math.min(1, p.have / p.need) * 100), done: p.have >= p.need };
  });
  const reward = [q.coins > 0 ? t('quest.reward', { n: q.coins }) : '', q.bonus ? t('quest.bonus', { n: q.bonus.coins, days: q.bonus.days }) : ''].filter(Boolean).join(' · ');
  return { id: q.id, name: t(q.nameKey), desc: t(q.descKey), goals, reward };
}

export function buildStageView(c: Content, s: State, t: Translate): StageView {
  const today = dayOfWeek(s.day);
  const open = openQuests(c, s);
  const quest = open[0];
  const rival = shopQuest(c, s)?.rival;
  const relief = modifier(c, s, 'rivalRelief');
  const stolen = rival ? rivalPenalty(c, s, rival.ingredient) : 0;
  const ingredientName = (id: string) => t(`ingredient.${id}`).toLocaleLowerCase(t.locale);

  // Progress of the open quest: the average of its goals (the chain only uses coins for now).
  const progress = quest ? quest.goals.map((g) => goalProgress(c, s, g)) : [];
  const pct = progress.length === 0 ? 100 : Math.round((progress.reduce((n, p) => n + Math.min(1, p.have / p.need), 0) / progress.length) * 100);
  const earnGoal = quest?.goals.find((g) => g.type === 'earn');
  const earnProgress = earnGoal ? goalProgress(c, s, earnGoal) : null;

  // The rival is announced before it starts (grace period) and before the quest that brings it, so it is never a surprise.
  const startingSoon = rival && today < rival.startsOnDay && rival.amount - relief > 0 ? rival : null;
  const nextRival = quest?.rival;
  const comingSoon = !rival && !!nextRival && pct >= 60 && nextRival.amount - relief > 0;

  let warning: string | null = null;
  if (stolen > 0 && rival) warning = t('stage.rival', { amount: stolen, ingredient: ingredientName(rival.ingredient) });
  else if (startingSoon)
    warning = t('stage.rivalSoon', {
      amount: startingSoon.amount - relief,
      ingredient: ingredientName(startingSoon.ingredient),
      day: startingSoon.startsOnDay,
    });
  else if (comingSoon) warning = t('stage.rivalNextWeek');

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
  const ending = c.strings[t.locale]['ending.text'];
  return {
    name: quest ? t(quest.nameKey) : t('quest.none'),
    dayText: t('stage.dayOf', { week: weekOf(s.day), day: today, days: DAYS_PER_WEEK }),
    earnedText: earnProgress ? t('quest.earned', { n: earnProgress.have, target: earnProgress.need }) : '',
    pct,
    more: open.length > 1 ? t('quest.more', { n: open.length - 1 }) : null,
    open: open.map((q) => questRow(c, s, t, q)),
    pips: Array.from({ length: DAYS_PER_WEEK }, (_, i) => ({
      state: i + 1 < today ? 'done' : i + 1 === today ? 'current' : 'todo',
      rival: rivalDay === i + 1,
    })),
    chip,
    warning,
    hints,
    newThings: newThings(c, s, t),
    complete: s.completed ? (ending ?? t('stage.complete')) : null,
  };
}

/** What the latest quest (done today or yesterday) opened: upgrades, errands and places gated behind it. */
function newThings(c: Content, s: State, t: Translate): string | null {
  const fresh = Object.entries(s.quests).filter(([, day]) => day >= s.day - 1).map(([id]) => id);
  if (fresh.length === 0) return null;
  const names = [
    ...c.skillNodes.filter((n) => n.quest && fresh.includes(n.quest)).map((n) => t(n.nameKey)),
    ...c.errands.filter((e) => e.quest && fresh.includes(e.quest)).map((e) => t(e.nameKey)),
    ...c.places.filter((p) => p.quest && fresh.includes(p.quest)).map((p) => t(p.nameKey)),
  ];
  return names.length > 0 ? t('stage.new', { list: names.join(', ') }) : null;
}
