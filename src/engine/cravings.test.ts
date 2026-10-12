import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from './engine.ts';
import { hearts, satisfies, serveChoices, tipFor } from './economy.ts';
import type { Action, Customer, State } from './types.ts';

const c = loadContent(readContentFiles(false));
const end: Action = { type: 'endPhase' };

function run(s: State, ...actions: Action[]): State {
  for (const a of actions) {
    const r = step(c, s, a);
    if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
    s = r.state;
  }
  return s;
}
const cust = (over: Partial<Customer>): Customer => ({
  id: 900, type: 'traveler', want: { kind: 'ingredient', ingredient: 'honey' }, minQuality: 'plain', patience: 5, budget: 12, ...over,
});
/** Afternoon with the given stock and one customer at the counter. */
function counter(stock: Record<string, number>, cu: Customer): State {
  const s = run(newGame(c, { seed: 1, unlocks: ['oven', 'pulling-machine', 'sunflower'] }), end);
  s.stock = stock;
  s.queue = [cu];
  s.pending = [];
  return s;
}

describe('what satisfies a customer', () => {
  it('a candy want takes only that candy, at or above their minimum quality', () => {
    const cu = cust({ type: 'faithful', want: { kind: 'candy', candy: 'candy-cane' }, minQuality: 'fine' });
    expect(satisfies(c, cu, 'candy-cane', 'fine')).toBe(true);
    expect(satisfies(c, cu, 'candy-cane', 'plain')).toBe(false);
    expect(satisfies(c, cu, 'sunflower-nougat', 'fine')).toBe(false);
  });
  it('a craving takes any candy containing the ingredient', () => {
    const cu = cust({});
    expect(satisfies(c, cu, 'candy-cane', 'plain')).toBe(true);
    expect(satisfies(c, cu, 'sunflower-nougat', 'plain')).toBe(true); // honey + sunflower
    expect(satisfies(c, cu, 'sunflower-brittle', 'plain')).toBe(false);
  });
  it('a rich customer wants a candy with enough ingredients', () => {
    const cu = cust({ type: 'merchant', want: { kind: 'rich', minIngredients: 2 }, minQuality: 'fine', budget: 30 });
    expect(satisfies(c, cu, 'sunflower-nougat', 'fine')).toBe(true);
    expect(satisfies(c, cu, 'candy-cane', 'fine')).toBe(false);
  });
});

describe('happiness and tips', () => {
  it('a craving counts the craved ingredient: more honey, happier', () => {
    const cu = cust({});
    expect(hearts(c, cu, 'candy-cane', 'plain')).toBe(1); // 1 honey
    expect(hearts(c, cu, 'candy-cane', 'fine')).toBe(2); // 2 honey
    expect(hearts(c, cu, 'candy-cane', 'excellent')).toBe(3); // 3 honey
  });
  it('the rare alternate counts for a lot', () => {
    expect(hearts(c, cust({}), 'candy-cane', 'perfect')).toBe(3); // 1 royal jelly = alternateUnits
  });
  it('a specific candy: one heart at the minimum, one more per quality above', () => {
    const cu = cust({ type: 'faithful', want: { kind: 'candy', candy: 'candy-cane' } });
    expect([hearts(c, cu, 'candy-cane', 'plain'), hearts(c, cu, 'candy-cane', 'fine'), hearts(c, cu, 'candy-cane', 'excellent')]).toEqual([1, 2, 3]);
  });
  it('a rich customer counts ingredients', () => {
    const cu = cust({ want: { kind: 'rich', minIngredients: 1 } });
    expect(hearts(c, cu, 'candy-cane', 'plain')).toBe(1);
    expect(hearts(c, cu, 'sunflower-nougat', 'plain')).toBe(2);
  });
  it('the tip is nothing at one heart and tipMax of the price at three', () => {
    expect(tipFor(c, 10, 1)).toBe(0);
    expect(tipFor(c, 10, 3)).toBe(Math.round(10 * c.settings.tipMax));
    expect(tipFor(c, 10, 2)).toBe(Math.round((10 * c.settings.tipMax) / 2));
  });
});

describe('serving a craving', () => {
  it('lists every satisfying stock, best payout first, and never what is over budget', () => {
    const s = counter({ 'candy-cane:plain': 4, 'candy-cane:excellent': 4, 'sunflower-nougat:plain': 4, 'sunflower-brittle:plain': 4 }, cust({}));
    const choices = serveChoices(c, s, s.queue[0]!);
    // nougat plain costs 14: over a budget of 12; brittle has no honey
    expect(choices.map((x) => `${x.candy}:${x.quality}`)).toEqual(['candy-cane:excellent', 'candy-cane:plain']);
    expect(choices[0]!.total).toBeGreaterThan(choices[1]!.total);
  });
  it('pays price plus tip, records the tip, and the budget caps the price only', () => {
    const s = counter({ 'candy-cane:excellent': 2 }, cust({ budget: 6 }));
    const choice = serveChoices(c, s, s.queue[0]!)[0]!;
    expect(choice).toMatchObject({ price: 6, hearts: 3, tip: 3, total: 9 }); // excellent costs 11, capped at 6; tip 50% of 6
    const r = run(s, { type: 'serve', customer: 900, candy: 'candy-cane', quality: 'excellent' });
    expect(r.money).toBe(9);
    expect(r.report.tips).toBe(3);
    expect(r.report.revenue).toBe(9);
  });
  it('refuses a candy that is not what they asked for', () => {
    const s = counter({ 'sunflower-brittle:plain': 2 }, cust({}));
    const r = step(c, s, { type: 'serve', customer: 900, candy: 'sunflower-brittle', quality: 'plain' });
    expect(r.ok ? null : r.code).toBe('wrong-candy');
  });
  it('the clerk sells the cheapest trained candy that satisfies the customer', () => {
    const s = run(newGame(c, { seed: 1, unlocks: ['oven', 'clerk'] }), { type: 'delegate', customerType: 'faithful', on: true }, end);
    s.batchesMade = { 'candy-cane': 2 };
    s.stock = { 'candy-cane:fine': 2, 'candy-cane:plain': 2 };
    s.queue = [];
    s.pending = [cust({ id: 901, type: 'faithful', want: { kind: 'candy', candy: 'candy-cane' }, budget: 6 })];
    // handing a customer type over again makes the clerk settle the counter
    const r = step(c, s, { type: 'delegate', customerType: 'faithful', on: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.stock['candy-cane:plain']).toBe(1); // the cheapest quality went, not the fine one
      expect(r.state.report.autoServed).toBe(1);
    }
  });
});

describe('reputation', () => {
  it('raises what customers pay and so the tip, by a percent per level', () => {
    const base = counter({ 'candy-cane:fine': 2 }, cust({ type: 'faithful', want: { kind: 'candy', candy: 'candy-cane' }, budget: 6 }));
    const noRep = serveChoices(c, base, base.queue[0]!)[0]!;
    const rich = structuredClone(base);
    rich.nodes.reputation = 5; // 5 levels of +4%
    const withRep = serveChoices(c, rich, rich.queue[0]!)[0]!;
    expect(noRep.price).toBe(6); // Fine costs 8, the budget is 6
    expect(withRep.price).toBe(8); // 6 coins +30%, rounded up
    expect(withRep.total).toBeGreaterThan(noRep.total);
  });
});

describe('who asks for what', () => {
  it('travelers and bees crave ingredients, faithful ask for a candy, merchants for something rich', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const s = run(newGame(c, { seed, unlocks: ['oven', 'sunflower', 'bee-customers'] }), end);
      for (const cu of [...s.queue, ...s.pending]) seen.add(`${cu.type}:${cu.want.kind}`);
    }
    expect([...seen].sort()).toEqual(['bee:ingredient', 'faithful:candy', 'merchant:rich', 'traveler:ingredient']);
  });
  it('bees only crave honey', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = run(newGame(c, { seed, unlocks: ['oven', 'sunflower', 'bee-customers'] }), end);
      for (const cu of [...s.queue, ...s.pending].filter((x) => x.type === 'bee'))
        expect(cu.want).toEqual({ kind: 'ingredient', ingredient: 'honey' });
    }
  });
});
