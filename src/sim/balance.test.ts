import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { cheapBot } from './bot.ts';
import { casualBot, smartBot } from './smartBot.ts';
import { runBalance } from './balance.ts';

// Balance guards: if a content edit moves campaign pacing outside these bands, a test fails and
// someone has to decide on purpose. Deterministic (fixed seeds). Re-measure with `npm run balance`.
// Targets: a competent player finishes the nine stages and the final quest in about 9 weeks, an average one a few weeks later,
// every upgrade matters to the competent player, and the shop is not drowning in unsold candy.

const c = loadContent(readContentFiles(false));
const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
const DAYS = 98;

describe('balance: pacing of the campaign', () => {
  const smart = runBalance(c, smartBot, seeds, DAYS);
  const casual = runBalance(c, casualBot, seeds, DAYS);
  const cheap = runBalance(c, cheapBot, seeds, DAYS);

  it('a competent player clears stage 1 in the first two weeks, and the nine stages take about nine weeks', () => {
    const [s1, , , , , , , s8, s9] = smart.stageCleared;
    expect(s1!.never).toBe(0);
    expect(s1!.median).toBeLessThanOrEqual(14);
    expect(s8!.never).toBe(0);
    expect(s9!.never).toBe(0);
    expect(s9!.median).toBeGreaterThanOrEqual(56); // a stage is at least a week, so nine stages cannot go faster than 63 days
    expect(s9!.median).toBeLessThanOrEqual(84);
  });
  it('and delivers the final quest soon after reaching the last stage', () => {
    expect(smart.completed.never).toBe(0);
    expect(smart.completed.median).toBeGreaterThanOrEqual(50);
    expect(smart.completed.median).toBeLessThanOrEqual(84);
  });
  it('an average player also finishes, a few weeks later, and sometimes repeats a week', () => {
    expect(casual.completed.never).toBeLessThanOrEqual(2);
    expect(casual.completed.median).toBeLessThanOrEqual(91);
    expect(casual.completed.median).toBeGreaterThanOrEqual(smart.completed.median);
    expect(casual.weeksMissedPerRun).toBeGreaterThan(0.5);
  });
  it('a careless player still gets through the early stages (a missed week only repeats, with a lower target)', () => {
    expect(cheap.stageCleared[2]!.never).toBeLessThanOrEqual(1);
  });
  it('income grows through the game instead of plateauing early', () => {
    const w = smart.revenueByWeek;
    expect(w[0]!).toBeLessThan(w[3]!);
    expect(w[3]!).toBeLessThan(w[6]!);
  });
  it('every upgrade gets bought by the competent player within the campaign', () => {
    for (const n of c.skillNodes) expect(smart.bought[n.id]!.never, n.id).toBeLessThanOrEqual(1);
  });
  it('production is kept in step with demand: no mountain of stock, and ingredients are not all wasted', () => {
    // Batches and customers, not ingredients, limit a late game shop (about half the ingredients go unused),
    // so this only catches a collapse. The tension the redesign wants (qualities, alternates) comes with MMSIM-12.
    expect(smart.ingredientsUnusedPct).toBeLessThan(60);
    expect(smart.avgStockOnOpen).toBeLessThan(250);
  });
  it('customers are rarely lost for a competent player', () => {
    expect(smart.lostPct).toBeLessThan(12);
  });
});
