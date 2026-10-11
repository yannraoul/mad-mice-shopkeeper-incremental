import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { formatReport, simulate } from './simulate.ts';

const c = loadContent(readContentFiles(false));

describe('simulator', () => {
  it('is deterministic for a seed', () => {
    expect(simulate(c, { days: 20, seed: 4 })).toEqual(simulate(c, { days: 20, seed: 4 }));
  });
  it('plays the requested number of days and earns money', () => {
    const r = simulate(c, { days: 15, seed: 1 });
    expect(r.history).toHaveLength(15);
    expect(r.money).toBe(r.history.reduce((n, d) => n + d.revenue, 0));
    expect(r.money).toBeGreaterThan(0);
  });
  it('earns more with the oven, the garden and contracts unlocked', () => {
    const base = simulate(c, { days: 40, seed: 2 }).money;
    const rich = simulate(c, { days: 40, seed: 2, unlocks: ['oven', 'dark-garden', 'contractBoard'] }).money;
    expect(rich).toBeGreaterThan(base);
  });
  it('never makes an illegal move across many seeds', () => {
    for (let seed = 1; seed <= 25; seed++)
      expect(() => simulate(c, { days: 10, seed, unlocks: ['oven', 'dark-garden', 'contractBoard'] })).not.toThrow();
  });
  it('formats a table', () => {
    expect(formatReport(simulate(c, { days: 3, seed: 1 }))).toMatch(/total revenue/);
  });
});
