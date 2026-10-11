import type { Content } from '../content/schema.ts';
import { newGame } from '../engine/engine.ts';
import type { DayReport } from '../engine/types.ts';
import { botDay } from './bot.ts';

export interface SimOptions {
  days: number;
  seed: number;
  unlocks?: string[];
}

export interface SimResult {
  history: DayReport[];
  money: number;
}

/** Headless run: the bot plays `days` full days; returns one report per day. */
export function simulate(c: Content, opts: SimOptions): SimResult {
  let s = newGame(c, { seed: opts.seed, unlocks: opts.unlocks });
  for (let d = 0; d < opts.days; d++) s = botDay(c, s);
  return { history: s.history, money: s.money };
}

/** Plain-text table of the revenue curve. */
export function formatReport(r: SimResult): string {
  const head = 'day  forecast   crafted  arrivals  served  clerk  refused  lost  contracts  revenue';
  const rows = r.history.map(
    (d) =>
      `${String(d.day).padStart(3)}  ${d.forecast.padEnd(9)}  ${String(d.crafted).padStart(7)}  ` +
      `${String(d.arrivals).padStart(8)}  ${String(d.served).padStart(6)}  ${String(d.autoServed).padStart(5)}  ${String(d.refused).padStart(7)}  ` +
      `${String(d.lost).padStart(4)}  ${String(d.contractsDone).padStart(9)}  ${String(d.revenue).padStart(7)}`,
  );
  const total = r.history.reduce((n, d) => n + d.revenue, 0);
  const avg = r.history.length ? (total / r.history.length).toFixed(1) : '0';
  return [head, ...rows, `total revenue ${total} over ${r.history.length} days (avg ${avg}/day)`].join('\n');
}
