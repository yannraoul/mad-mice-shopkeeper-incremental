import type { Content } from '../content/schema.ts';
import { newGame } from '../engine/engine.ts';
import type { DayReport, WeekResult } from '../engine/types.ts';
import { botDay } from './bot.ts';

export interface SimOptions {
  days: number;
  seed: number;
  unlocks?: string[];
}

export interface SimResult {
  history: DayReport[];
  money: number;
  /** Stage index (0-based) the bot is in at the end, and whether the final stage was cleared. */
  stage: number;
  completed: boolean;
  weeks: WeekResult[];
}

/** Headless run: the bot plays `days` full days; returns one report per day. */
export function simulate(c: Content, opts: SimOptions): SimResult {
  let s = newGame(c, { seed: opts.seed, unlocks: opts.unlocks });
  const weeks: WeekResult[] = [];
  for (let d = 0; d < opts.days; d++) {
    s = botDay(c, s);
    // The day just played closed the week exactly when the week counter is back at 0.
    if (s.stage.day === 0 && s.lastWeek) weeks.push(s.lastWeek);
  }
  return { history: s.history, money: s.money, stage: s.stage.index, completed: s.completed, weeks };
}

/** Plain-text table of the revenue curve. */
export function formatReport(r: SimResult): string {
  const head = 'day  stg  forecast   crafted  arrivals  served  clerk  refused  lost  contracts  revenue';
  const rows = r.history.map(
    (d) =>
      `${String(d.day).padStart(3)}  ${String(d.stage + 1).padStart(3)}  ${d.forecast.padEnd(9)}  ${String(d.crafted).padStart(7)}  ` +
      `${String(d.arrivals).padStart(8)}  ${String(d.served).padStart(6)}  ${String(d.autoServed).padStart(5)}  ${String(d.refused).padStart(7)}  ` +
      `${String(d.lost).padStart(4)}  ${String(d.contractsDone).padStart(9)}  ${String(d.revenue).padStart(7)}`,
  );
  const total = r.history.reduce((n, d) => n + d.revenue, 0);
  const avg = r.history.length ? (total / r.history.length).toFixed(1) : '0';
  const weeks = r.weeks.map((w, i) => `week ${i + 1}: stage ${w.stage + 1} ${w.revenue}/${w.target} ${w.passed ? 'passed' : 'missed'}`);
  return [head, ...rows, ...weeks, `total revenue ${total} over ${r.history.length} days (avg ${avg}/day), now in stage ${r.stage + 1}${r.completed ? ', final stage cleared' : ''}`].join('\n');
}
