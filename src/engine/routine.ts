import type { Content } from '../content/schema.ts';
import { isStepAutomated, openDemands, qualityRank, routineBlockers, serveChoices, stockedAtLeast, stockKey, unlockedCandies, unlockedQualities } from './economy.ts';
import { step } from './engine.ts';
import type { Action, State } from './types.ts';

// The daily routine ("foreman mouse"): the next thing the mice would do, as a pure function of the state, so the app can
// play a whole day by asking for one action at a time. It only uses what the player has hired: a quality is made only
// when every one of its steps has a helper (the whisper of Perfect never has), and rare ingredients are never spent.
// Three switches, three jobs: the foreman runs the morning and the afternoon, the accounting mouse buys the cheapest upgrade
// the shop can afford in the evening (until none is left), and auto sleep ends the evening when the work is done. Without
// them the evening is the player's.

const total = (s: State, candy: string) =>
  Object.entries(s.stock).reduce((n, [k, v]) => n + (k.startsWith(`${candy}:`) ? v : 0), 0);

/** Qualities the helpers can make start to finish, best first. Empty while a basic step is still by hand. */
export function routineQualities(c: Content, s: State) {
  if (routineBlockers(c, s).length > 0) return [];
  return unlockedQualities(c, s)
    .filter((q) => !q.alternates && q.extraSteps.every((x) => isStepAutomated(c, s, x.id)))
    .sort((a, b) => b.rank - a.rank);
}

/** The batch the routine would start next, or null (nothing wanted, nothing affordable, or no hand station free). */
function nextCraft(c: Content, s: State): Action | null {
  const station = s.stations.findIndex((st) => st.batchesLeft > 0 && !c.stations.find((x) => x.id === st.type)?.auto);
  if (station < 0) return null;
  const qualities = routineQualities(c, s);
  if (qualities.length === 0) return null;
  const tries: { candy: string; qualities: typeof qualities }[] = [];
  // What is being asked comes first, at the cheapest quality that qualifies.
  for (const d of openDemands(c, s)) {
    if (d.final) continue;
    const have = stockedAtLeast(c, s, d.candy, d.quality).reduce((n, q) => n + (s.stock[stockKey(d.candy, q.id)] ?? 0), 0);
    if (have >= d.qty) continue;
    tries.push({ candy: d.candy, qualities: qualities.filter((q) => q.rank >= qualityRank(c, d.quality)).reverse() });
  }
  // Then the candy there is least of, as good as can be made, while stock stays under the target.
  const candies = unlockedCandies(c, s)
    .filter((cd) => total(s, cd.id) < c.settings.routineStock)
    .sort((a, b) => total(s, a.id) - total(s, b.id));
  for (const cd of candies) tries.push({ candy: cd.id, qualities });
  for (const t of tries)
    for (const q of t.qualities) {
      const a: Action = { type: 'craft', station, candy: t.candy, quality: q.id };
      if (step(c, s, a).ok) return a;
    }
  return null;
}

/**
 * The next action of the routine for the current phase. Morning: hand in what stock covers, make batches, then end the
 * morning. Afternoon: serve the most impatient customer with the best payout, turn away those nothing fits, then end
 * the afternoon (both need the foreman switch on). Evening: the cheapest affordable upgrade while the accounting switch is on,
 * then the end of the day while auto sleep is on; null when there is nothing for the routine to do (the player picks upgrades
 * and ends the day).
 */
export function nextRoutineAction(c: Content, s: State): Action | null {
  if (s.phase !== 'evening' && !s.routine) return null;
  if (s.phase === 'morning') {
    for (const ct of s.contracts) {
      const a: Action = { type: 'fulfill', contract: ct.id };
      if (step(c, s, a).ok) return a;
    }
    for (const d of openDemands(c, s)) {
      if (d.kind !== 'errand' || d.final) continue;
      const a: Action = { type: 'deliverErrand', errand: d.id as string };
      if (step(c, s, a).ok) return a;
    }
    return nextCraft(c, s) ?? { type: 'endPhase' };
  }
  if (s.phase === 'afternoon') {
    if (s.queue.length === 0) return { type: 'endPhase' };
    const order = [...s.queue].sort((a, b) => a.patience - b.patience || b.budget - a.budget);
    for (const cu of order) {
      const best = serveChoices(c, s, cu)[0];
      if (best) return { type: 'serve', customer: cu.id, candy: best.candy, quality: best.quality };
    }
    return { type: 'refuse', customer: s.queue[0]!.id };
  }
  if (s.routineAccounting && s.unlocks.includes('accountant')) {
    const next = c.skillNodes
      .map((n) => ({ n, cost: n.costs[s.nodes[n.id] ?? 0] }))
      .filter((x): x is { n: (typeof c.skillNodes)[number]; cost: number } => x.cost !== undefined && x.cost <= s.money)
      .sort((a, b) => a.cost - b.cost);
    for (const { n } of next) {
      const a: Action = { type: 'buy', node: n.id };
      if (step(c, s, a).ok) return a;
    }
  }
  return s.routineSleep ? { type: 'endPhase' } : null;
}
