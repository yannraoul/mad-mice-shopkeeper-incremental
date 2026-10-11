import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { cheapBot } from './bot.ts';
import { casualBot, smartBot } from './smartBot.ts';
import { runBalance } from './balance.ts';

// Balance guards: if a content edit moves campaign pacing outside these bands, a test fails and
// someone has to decide on purpose. Deterministic (fixed seeds). Re-measure with `npm run balance`.
// Targets: a competent player finishes the three stages in about 7 weeks, an average one in about 8,
// every upgrade matters to the competent player, and the shop is not drowning in unsold candy.

const c = loadContent(readContentFiles(false));
const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
const DAYS = 98;

describe('balance: pacing of the campaign', () => {
  const smart = runBalance(c, smartBot, seeds, DAYS);
  const casual = runBalance(c, casualBot, seeds, DAYS);
  const cheap = runBalance(c, cheapBot, seeds, DAYS);

  it('a competent player clears stage 1 in the first two weeks, stage 2 by about week 4, stage 3 by about week 8', () => {
    const [s1, s2, s3] = smart.stageCleared;
    expect(s1!.never).toBe(0);
    expect(s1!.median).toBeLessThanOrEqual(14);
    expect(s2!.never).toBe(0);
    expect(s2!.median).toBeGreaterThanOrEqual(14);
    expect(s2!.median).toBeLessThanOrEqual(42);
    expect(s3!.never).toBe(0);
    expect(s3!.median).toBeGreaterThanOrEqual(35);
    expect(s3!.median).toBeLessThanOrEqual(63);
  });
  it('an average player also finishes, only somewhat later', () => {
    const s3 = casual.stageCleared[2]!;
    expect(s3.never).toBeLessThanOrEqual(1);
    expect(s3.median).toBeLessThanOrEqual(77);
    expect(s3.median).toBeGreaterThanOrEqual(smart.stageCleared[2]!.median);
  });
  it('a careless player still gets through stage 2 (a missed week only repeats)', () => {
    expect(cheap.stageCleared[1]!.never).toBeLessThanOrEqual(1);
  });
  it('income grows through the game instead of plateauing early', () => {
    const w = smart.revenueByWeek;
    expect(w[0]!).toBeLessThan(w[3]!);
    expect(w[3]!).toBeLessThan(w[6]!);
  });
  it('every upgrade gets bought by the competent player within the campaign', () => {
    for (const n of c.skillNodes) expect(smart.bought[n.id]!.never, n.id).toBeLessThanOrEqual(1);
  });
  it('production is kept in step with demand: little wasted honey, no mountain of stock', () => {
    expect(smart.honeyUnusedPct).toBeLessThan(15);
    expect(smart.avgStockOnOpen).toBeLessThan(250);
  });
  it('customers are rarely lost for a competent player', () => {
    expect(smart.lostPct).toBeLessThan(12);
  });
});
