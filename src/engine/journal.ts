import type { Content } from '../content/schema.ts';
import type { State } from './types.ts';

/**
 * Journal line (string key) for today's report. Lines with conditions that match win over
 * unconditional ones; among the winners one is picked by day number, so the text rotates
 * deterministically (no randomness: it must not disturb the seeded game).
 */
export function journalKey(c: Content, s: State): string | null {
  const r = s.report;
  const matches = c.journal.filter(({ when: w }) => {
    return (
      (w.minDay === undefined || s.day >= w.minDay) &&
      (w.maxDay === undefined || s.day <= w.maxDay) &&
      (w.revenueAtLeast === undefined || r.revenue >= w.revenueAtLeast) &&
      (w.revenueBelow === undefined || r.revenue < w.revenueBelow) &&
      (w.lostAtLeast === undefined || r.lost >= w.lostAtLeast) &&
      (w.autoServedAtLeast === undefined || r.autoServed >= w.autoServedAtLeast) &&
      (w.node === undefined || (s.nodes[w.node] ?? 0) > 0)
    );
  });
  const specific = matches.filter((j) => Object.keys(j.when).length > 0);
  const pool = specific.length > 0 ? specific : matches;
  return pool.length === 0 ? null : pool[s.day % pool.length]!.textKey;
}
