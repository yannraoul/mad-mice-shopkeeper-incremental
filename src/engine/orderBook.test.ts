import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from './engine.ts';
import { autoQuality, openDemands } from './economy.ts';
import type { Action, Contract, State } from './types.ts';

// MMSIM-16: the Second cauldron's order book (open orders first, then the preferred candy) and the delivery mouse.
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
const contract = (over: Partial<Contract>): Contract => ({ id: 800, candy: 'candy-cane', quality: 'plain', qty: 4, deadlineDay: 9, reward: 40, ...over });
/** A game on day 1 with the Second cauldron and the given unlocks; the next three `end`s bring the dawn of day 2. */
function dayOne(unlocks: string[], contracts: Contract[] = []): State {
  const s = newGame(c, { seed: 1, unlocks: ['oven', 'sunflower', ...unlocks] });
  s.stations.push({ type: 'auto-cauldron', batchesLeft: 0 });
  s.contracts = contracts;
  return s;
}
const dawn = (s: State) => run(s, end, end, end);

describe('the Second cauldron without the order book', () => {
  it('makes plain candy cane, whatever is asked', () => {
    const s = dawn(dayOne([], [contract({ quality: 'fine' })]));
    expect(s.stock['candy-cane:plain']).toBe(8);
    expect(s.stock['candy-cane:fine']).toBeUndefined();
    expect(run(s, { type: 'endPhase' }).autoCandy).toBeNull();
    const r = step(c, s, { type: 'setAutoCandy', candy: 'sunflower-brittle' });
    expect(r.ok ? null : r.code).toBe('no-order-book');
  });
});

describe('the order book', () => {
  it('works first on an open contract with the cheapest quality that qualifies', () => {
    const s = dawn(dayOne(['order-book'], [contract({ quality: 'fine', qty: 4 })]));
    expect(s.stock['candy-cane:fine']).toBe(4);
    expect(s.stock['candy-cane:plain'] ?? 0).toBe(0); // the two honey went into the Fine batch
  });
  it('counts candies already in stock, and makes only what is missing', () => {
    const s0 = dayOne(['order-book'], [contract({ qty: 4 })]);
    s0.stock['candy-cane:plain'] = 4;
    const s = dawn(s0);
    // The 4 in stock cover the contract; both batches go to the preferred candy (candy cane).
    expect(s.stock['candy-cane:plain']).toBe(12);
  });
  it('makes the preferred candy with what the orders leave', () => {
    let s = dayOne(['order-book']);
    s = run(s, { type: 'setAutoCandy', candy: 'sunflower-brittle' });
    s = dawn(s);
    expect(s.stock['sunflower-brittle:plain']).toBeGreaterThan(0);
    expect(s.stock['candy-cane:plain'] ?? 0).toBe(0);
  });
  it('refuses a candy that is not unlocked or does not exist', () => {
    const s = dayOne(['order-book']);
    const a = step(c, s, { type: 'setAutoCandy', candy: 'nope' });
    expect(a.ok ? null : a.code).toBe('unknown-candy');
    const locked = c.candies.find((x) => x.ingredients.length > 1 && x.ingredients.some((i) => i.ingredient === 'milk'))!;
    const b = step(c, s, { type: 'setAutoCandy', candy: locked.id });
    expect(b.ok ? null : b.code).toBe('candy-locked');
  });
  it('never offers to make what only hands can: the whisper of a Perfect batch', () => {
    const all = c.qualities.map((q) => q.unlock).filter((x): x is string => !!x);
    expect(autoQuality(c, { unlocks: all }, 'perfect')).toBeNull();
    expect(autoQuality(c, { unlocks: all }, 'plain')).toBe('plain');
    expect(autoQuality(c, { unlocks: [] }, 'fine')).toBeNull(); // the oven is not there
  });
  it('lists the contracts first, soonest deadline first, then the deliveries under way', () => {
    const s = dayOne([], [contract({ id: 2, deadlineDay: 8 }), contract({ id: 1, deadlineDay: 5 })]);
    expect(openDemands(c, s).map((d) => d.id)).toEqual([1, 2]);
  });
});

describe('the delivery mouse', () => {
  it('hands in a contract as soon as the cauldron has made what it asks', () => {
    const s0 = dayOne(['order-book', 'delivery-mouse'], [contract({ quality: 'fine', qty: 4, reward: 50 })]);
    const money = s0.money;
    const s = dawn(s0);
    expect(s.contracts).toHaveLength(0);
    expect(s.money).toBeGreaterThan(money);
    expect(s.stock['candy-cane:fine'] ?? 0).toBe(0);
  });
  it('without it the contract waits for the player', () => {
    const s = dawn(dayOne(['order-book'], [contract({ quality: 'fine', qty: 4 })]));
    expect(s.contracts).toHaveLength(1);
    expect(s.stock['candy-cane:fine']).toBe(4);
  });
  it('also hands in after a batch made by hand', () => {
    let s = dawn(dayOne(['delivery-mouse'], [contract({ qty: 4, deadlineDay: 9 })]));
    // No order book: the cauldron's 8 plain canes already covered it at dawn.
    expect(s.contracts).toHaveLength(0);
    s = dayOne(['delivery-mouse']);
    s = run(s, end, end, end);
    s.contracts = [contract({ id: 801, qty: 4, candy: 'sunflower-brittle', deadlineDay: 9 })];
    s.supply['sunflower-seed'] = 1;
    s = run(s, { type: 'craft', station: 0, candy: 'sunflower-brittle', quality: 'plain' });
    expect(s.contracts).toHaveLength(0);
  });
});
