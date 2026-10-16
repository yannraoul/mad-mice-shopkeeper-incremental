import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { cheapBot } from './bot.ts';
import { casualBot, smartBot } from './smartBot.ts';
import { runBalance } from './balance.ts';

// Balance guards: if a content edit moves campaign pacing outside these bands, a test fails and
// someone has to decide on purpose. Deterministic (fixed seeds). Re-measure with `npm run balance`.
// Targets: a competent player finishes the quest chain and the final quest in about 7 weeks, an average one a little later,
// every upgrade matters to the competent player, and the shop is not drowning in unsold candy.

const c = loadContent(readContentFiles(false));
const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
const DAYS = 98;

describe('balance: pacing of the campaign', () => {
  const smart = runBalance(c, smartBot, seeds, DAYS);
  const casual = runBalance(c, casualBot, seeds, DAYS);
  const cheap = runBalance(c, cheapBot, seeds, DAYS);

  it('a competent player does the first quest in the first two weeks, and the whole chain in about seven', () => {
    const q = smart.questCleared;
    expect(q[0]!.never).toBe(0);
    expect(q[0]!.median).toBeLessThanOrEqual(14);
    expect(q[q.length - 1]!.never).toBe(0);
    expect(q[q.length - 1]!.median).toBeGreaterThanOrEqual(35);
    expect(q[q.length - 1]!.median).toBeLessThanOrEqual(84);
  });
  it('and delivers the final quest soon after the chain is done', () => {
    expect(smart.completed.never).toBe(0);
    expect(smart.completed.median).toBeGreaterThanOrEqual(40);
    expect(smart.completed.median).toBeLessThanOrEqual(84);
  });
  it('an average player also finishes, a few days later', () => {
    expect(casual.completed.never).toBeLessThanOrEqual(2);
    expect(casual.completed.median).toBeLessThanOrEqual(91);
    expect(casual.completed.median).toBeGreaterThanOrEqual(smart.completed.median);
  });
  it('a careless player still gets through the early quests', () => {
    expect(cheap.questCleared[2]!.never).toBeLessThanOrEqual(1);
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
    // Batches and customers, not ingredients, limit a late game shop (more than half the ingredients go unused with four of them),
    // so this only catches a collapse. The tension the redesign wants (qualities, alternates) comes with MMSIM-12.
    expect(smart.ingredientsUnusedPct).toBeLessThan(75);
    expect(smart.avgStockOnOpen).toBeLessThan(280); // was 250 before MMSIM-24 (the fourth daily batch makes more stock)
  });
  it('customers are rarely lost for a competent player', () => {
    expect(smart.lostPct).toBeLessThan(12);
  });
});
