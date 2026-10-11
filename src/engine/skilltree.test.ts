import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from './engine.ts';
import { priceOf } from './economy.ts';
import type { Action, State } from './types.ts';

const c = loadContent(readContentFiles(false));

function run(s: State, ...actions: Action[]): State {
  for (const a of actions) {
    const r = step(c, s, a);
    if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
    s = r.state;
  }
  return s;
}
const failCode = (s: State, a: Action) => {
  const r = step(c, s, a);
  return r.ok ? null : { code: r.code, params: r.params };
};
const buy = (node: string): Action => ({ type: 'buy', node });
const craft: Action = { type: 'craft', station: 0, candy: 'honey-drop', quality: 'plain' };
const end: Action = { type: 'endPhase' };

/** Day 1 evening with `money` coins. */
const evening = (money: number, unlocks: string[] = []): State => {
  const s = run(newGame(c, { seed: 1, unlocks }), end, end);
  s.money = money;
  return s;
};

describe('skill tree', () => {
  it('is bought in the evening only', () => {
    const s = newGame(c, { seed: 1 });
    s.money = 999;
    expect(failCode(s, buy('oven'))).toEqual({ code: 'wrong-phase', params: { phase: 'evening' } });
  });
  it('charges the level cost, unlocks and records the level', () => {
    const s = run(evening(100), buy('oven'));
    expect(s.money).toBe(100 - c.skillNodes.find((n) => n.id === 'oven')!.costs[0]!);
    expect(s.nodes.oven).toBe(1);
    expect(s.unlocks).toContain('oven');
    expect(failCode(s, buy('oven'))?.code).toBe('node-maxed');
  });
  it('refuses when poor, unknown, or missing a required node', () => {
    expect(failCode(evening(0), buy('oven'))?.code).toBe('not-enough-money');
    expect(failCode(evening(999), buy('nope'))?.code).toBe('unknown-node');
    expect(failCode(evening(999), buy('dark-garden'))).toEqual({ code: 'node-locked', params: { node: 'oven' } });
    expect(run(evening(999), buy('oven'), buy('dark-garden')).unlocks).toContain('dark-garden');
  });
  it('repeatable nodes cost more each level and stop at their cap', () => {
    const node = c.skillNodes.find((n) => n.id === 'honey-yield')!;
    let s = evening(10_000);
    for (let i = 0; i < node.costs.length; i++) s = run(s, buy('honey-yield'));
    expect(s.money).toBe(10_000 - node.costs.reduce((a, b) => a + b, 0));
    expect(failCode(s, buy('honey-yield'))?.code).toBe('node-maxed');
  });
  it('modifiers apply from the next morning: honey, batch size, counter, patience', () => {
    let s = evening(10_000);
    s = run(s, buy('honey-yield'), buy('cauldron-size'), buy('counter-space'), buy('patience'), end);
    expect(s.supply.honey).toBe(5);
    expect(run(s, craft).stock['honey-drop:plain']).toBe(5);
    s = run(s, end); // afternoon
    expect(s.queue.length).toBeLessThanOrEqual(5);
    for (const cu of [...s.queue, ...s.pending])
      expect(cu.patience).toBe(c.customerTypes.find((t) => t.id === cu.type)!.patience + 1);
  });
  it('the second cauldron is an automated station that makes plain drops each morning', () => {
    let s = evening(10_000);
    s = run(s, buy('honey-yield'), buy('auto-cauldron'));
    expect(s.stations.map((x) => x.type)).toEqual(['cauldron', 'auto-cauldron']);
    s = run(s, end);
    expect(s.stock['honey-drop:plain']).toBe(8); // 2 batches of 4 from 5 honey (2 each)
    expect(s.supply.honey).toBe(1);
    expect(failCode(s, { type: 'craft', station: 1, candy: 'honey-drop', quality: 'plain' })?.code).toBe('station-automated');
  });
  it('unlocked recipes can be crafted; locked ones cannot', () => {
    const brittle: Action = { type: 'craft', station: 0, candy: 'sunflower-brittle', quality: 'plain' };
    expect(failCode(newGame(c, { seed: 1 }), brittle)?.code).toBe('candy-locked');
    expect(run(newGame(c, { seed: 1, unlocks: ['recipe-2'] }), brittle).stock['sunflower-brittle:plain']).toBe(4);
  });
  it('customers only ask for unlocked, affordable recipes', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const open = run(newGame(c, { seed, unlocks: ['recipe-2', 'recipe-3'] }), end);
      for (const cu of [...open.queue, ...open.pending]) {
        const t = c.customerTypes.find((x) => x.id === cu.type)!;
        expect(priceOf(c, cu.wants, t.minQuality)).toBeLessThanOrEqual(t.budget);
      }
      const base = run(newGame(c, { seed }), end);
      for (const cu of [...base.queue, ...base.pending]) expect(cu.wants).toBe('honey-drop');
    }
  });
});
