import type { Content } from '../content/schema.ts';
import { newGame } from '../engine/engine.ts';
import { must, type Bot } from './bot.ts';

// Balance measurement: many seeded runs of one bot, summarised as pacing numbers.

export interface RunStats {
  seed: number;
  days: number;
  /** Day on which each quest was first done (null = not within the run). Index = quest, in content order. */
  clearedDay: (number | null)[];
  /** Day the final quest was delivered (null if never). */
  completedDay: number | null;
  revenue: number;
  /** Revenue of every day, in order. */
  revenueByDay: number[];
  /** First day each upgrade was bought. */
  boughtDay: Record<string, number>;
  arrivals: number;
  lost: number;
  refused: number;
  /** Base ingredient units (all unlocked ones) delivered but unused at the end of the morning, summed over days. */
  ingredientsUnused: number;
  ingredientsDelivered: number;
  /** Candies sitting in stock when the shop opens, summed over days. */
  stockOnOpen: number;
}

export function runOne(c: Content, bot: Bot, seed: number, days: number): RunStats {
  let s = newGame(c, { seed });
  const st: RunStats = {
    seed, days, clearedDay: c.quests.map(() => null), completedDay: null, revenue: 0,
    revenueByDay: [], boughtDay: {}, arrivals: 0, lost: 0, refused: 0, ingredientsUnused: 0, ingredientsDelivered: 0, stockOnOpen: 0,
  };
  for (let d = 1; d <= days; d++) {
    const base = c.ingredients.filter((i) => !i.alternateOf).map((i) => i.id); // alternates are rare extras, not stock to plan around
    const sumBase = (supply: Record<string, number>) => base.reduce((n, id) => n + (supply[id] ?? 0), 0);
    const atDawn = sumBase(s.supply);
    s = bot.morning(c, s);
    st.ingredientsDelivered += atDawn;
    st.ingredientsUnused += sumBase(s.supply);
    s = must(c, s, { type: 'endPhase' });
    st.stockOnOpen += Object.values(s.stock).reduce((n, v) => n + v, 0);
    s = bot.afternoon(c, s);
    s = must(c, s, { type: 'endPhase' });
    const report = s.report;
    st.revenue += report.revenue;
    st.revenueByDay.push(report.revenue);
    st.arrivals += report.arrivals;
    st.lost += report.lost;
    st.refused += report.refused;
    const before = { ...s.nodes };
    s = bot.evening(c, s);
    for (const id of Object.keys(s.nodes)) if (!(id in before) && !(id in st.boughtDay)) st.boughtDay[id] = d;
    s = must(c, s, { type: 'endPhase' });
    if (s.completed && st.completedDay === null) st.completedDay = d;
    c.quests.forEach((q, i) => {
      if (s.quests[q.id] !== undefined && st.clearedDay[i] === null) st.clearedDay[i] = d;
    });
  }
  return st;
}

export interface Dist {
  n: number;
  /** Runs where the value never happened (e.g. quest never done). */
  never: number;
  p10: number;
  median: number;
  p90: number;
}

function dist(values: (number | null)[]): Dist {
  const xs = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const at = (q: number) => (xs.length === 0 ? NaN : xs[Math.min(xs.length - 1, Math.floor(q * xs.length))]!);
  return { n: values.length, never: values.length - xs.length, p10: at(0.1), median: at(0.5), p90: at(0.9) };
}

export interface Summary {
  bot: string;
  runs: number;
  days: number;
  /** Per quest: the day it was first done. */
  questCleared: Dist[];
  /** Day the final quest was delivered. */
  completed: Dist;
  avgRevenuePerDay: number;
  /** Mean revenue per day, averaged within each week of play (index 0 = week 1). */
  revenueByWeek: number[];
  /** Day each upgrade was first bought (median); `never` counts runs that did not buy it. */
  bought: Record<string, Dist>;
  lostPct: number;
  refusedPct: number;
  ingredientsUnusedPct: number;
  avgStockOnOpen: number;
}

export function summarize(c: Content, bot: string, runs: RunStats[]): Summary {
  const days = runs[0]?.days ?? 0;
  const sum = (f: (r: RunStats) => number) => runs.reduce((n, r) => n + f(r), 0);
  const weeks = Math.floor(days / 7);
  const revenueByWeek = Array.from({ length: weeks }, (_, w) => {
    const all = runs.flatMap((r) => r.revenueByDay.slice(w * 7, w * 7 + 7));
    return all.reduce((n, v) => n + v, 0) / Math.max(1, all.length);
  });
  return {
    bot,
    runs: runs.length,
    days,
    questCleared: c.quests.map((_, i) => dist(runs.map((r) => r.clearedDay[i] ?? null))),
    completed: dist(runs.map((r) => r.completedDay)),
    avgRevenuePerDay: sum((r) => r.revenue) / Math.max(1, runs.length * days),
    revenueByWeek,
    bought: Object.fromEntries(c.skillNodes.map((n) => [n.id, dist(runs.map((r) => r.boughtDay[n.id] ?? null))])),
    lostPct: (100 * sum((r) => r.lost)) / Math.max(1, sum((r) => r.arrivals)),
    refusedPct: (100 * sum((r) => r.refused)) / Math.max(1, sum((r) => r.arrivals)),
    ingredientsUnusedPct: (100 * sum((r) => r.ingredientsUnused)) / Math.max(1, sum((r) => r.ingredientsDelivered)),
    avgStockOnOpen: sum((r) => r.stockOnOpen) / Math.max(1, runs.length * days),
  };
}

export function runBalance(c: Content, bot: Bot, seeds: number[], days: number): Summary {
  return summarize(c, bot.name, seeds.map((seed) => runOne(c, bot, seed, days)));
}

export interface Ablation {
  node: string;
  /** Change in average revenue per day when this upgrade cannot be bought, in percent. */
  revenuePct: number;
  /** Days later (median) the last quest is done without it (null = some runs never clear it). */
  lastQuestDelay: number | null;
}

/** Remove each upgrade in turn and see how much the competent player suffers: a measure of relevance. */
export function ablate(c: Content, bot: Bot, seeds: number[], days: number): Ablation[] {
  const base = runBalance(c, bot, seeds, days);
  const last = c.quests.length - 1;
  return c.skillNodes.map((n) => {
    const without = { ...c, skillNodes: c.skillNodes.filter((x) => x.id !== n.id) };
    const r = runBalance(without, bot, seeds, days);
    const a = base.questCleared[last]!;
    const b = r.questCleared[last]!;
    return {
      node: n.id,
      revenuePct: (100 * (r.avgRevenuePerDay - base.avgRevenuePerDay)) / base.avgRevenuePerDay,
      lastQuestDelay: b.never > a.never ? null : b.median - a.median,
    };
  });
}

const f = (n: number, d = 0) => (Number.isNaN(n) ? '-' : n.toFixed(d));

export function formatSummary(c: Content, r: Summary): string {
  const lines: string[] = [];
  lines.push(`== ${r.bot} bot: ${r.runs} runs x ${r.days} days ==`);
  lines.push(`avg revenue/day ${f(r.avgRevenuePerDay, 1)} | customers lost ${f(r.lostPct, 1)}% refused ${f(r.refusedPct, 1)}% | ingredients unused ${f(r.ingredientsUnusedPct, 1)}% | stock on open ${f(r.avgStockOnOpen, 1)}`);
  lines.push('quest done on day (p10 / median / p90, runs that never did it):');
  c.quests.forEach((q, i) => {
    const d = r.questCleared[i]!;
    const earn = q.goals.find((g) => g.type === 'earn');
    lines.push(`  ${i + 1} ${q.id.padEnd(4)} earn ${String(earn && earn.type === 'earn' ? earn.amount : '-').padStart(6)}  ${f(d.p10)} / ${f(d.median)} / ${f(d.p90)}   never: ${d.never}/${d.n}`);
  });
  lines.push(`  final quest delivered on day ${f(r.completed.p10)} / ${f(r.completed.median)} / ${f(r.completed.p90)}   never: ${r.completed.never}/${r.completed.n}`);
  lines.push('avg revenue/day by week: ' + r.revenueByWeek.map((v) => f(v)).join(' '));
  lines.push('upgrade bought on day (median, never):');
  lines.push(
    '  ' +
      c.skillNodes
        .map((n) => {
          const d = r.bought[n.id]!;
          return `${n.id} ${f(d.median)}${d.never ? ` (never ${d.never})` : ''}`;
        })
        .join(' | '),
  );
  return lines.join('\n');
}
