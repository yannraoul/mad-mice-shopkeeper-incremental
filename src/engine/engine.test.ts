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
const fails = (s: State, a: Action) => {
  const r = step(c, s, a);
  expect(r.ok).toBe(false);
  return r.ok ? '' : r.error;
};
const failCode = (s: State, a: Action) => {
  const r = step(c, s, a);
  return r.ok ? null : { code: r.code, params: r.params };
};
const craft = (quality = 'plain'): Action => ({ type: 'craft', station: 0, candy: 'honey-drop', quality });
/** Morning of day 1, then advance to the afternoon with some stock. */
function afternoon(seed = 1, unlocks: string[] = ['oven'], crafts: Action[] = [craft(), craft()]) {
  return run(newGame(c, { seed, unlocks }), ...crafts, { type: 'endPhase' });
}

describe('new game', () => {
  it('starts on day 1 morning with supply and batches from content', () => {
    const s = newGame(c, { seed: 1 });
    expect(s.day).toBe(1);
    expect(s.phase).toBe('morning');
    expect(s.supply.honey).toBe(4);
    expect(s.stations).toEqual([{ type: 'cauldron', batchesLeft: 3 }]);
    expect(c.forecasts.map((f) => f.id)).toContain(s.forecast);
  });
  it('is deterministic for a seed and differs across seeds', () => {
    expect(newGame(c, { seed: 7 })).toEqual(newGame(c, { seed: 7 }));
    const a = afternoon(1);
    const b = afternoon(2);
    expect(a.pending.length + a.queue.length).not.toBe(0);
    expect(a).not.toEqual(b);
  });
  it('step does not mutate its input', () => {
    const s = newGame(c, { seed: 1 });
    const frozen = structuredClone(s);
    step(c, s, craft());
    expect(s).toEqual(frozen);
  });
});

describe('crafting', () => {
  it('consumes ingredients and adds station capacity to stock', () => {
    const s = run(newGame(c, { seed: 1 }), craft());
    expect(s.supply.honey).toBe(2);
    expect(s.stock['honey-drop:plain']).toBe(4);
    expect(s.stations[0]!.batchesLeft).toBe(2);
    expect(s.report.crafted).toBe(4);
  });
  it('is limited by ingredient supply', () => {
    const s = run(newGame(c, { seed: 1 }), craft(), craft());
    expect(fails(s, craft())).toMatch(/not enough honey/);
  });
  it('is limited by batches per day', () => {
    const s = newGame(c, { seed: 1 });
    s.stations[0]!.batchesLeft = 0;
    expect(fails(s, craft())).toMatch(/no batches/);
  });
  it('refuses locked qualities and allows them once unlocked', () => {
    expect(fails(newGame(c, { seed: 1 }), craft('fine'))).toMatch(/locked/);
    const s = run(newGame(c, { seed: 1, unlocks: ['oven'] }), craft('fine'));
    expect(s.stock['honey-drop:fine']).toBe(4);
  });
  it('charges extra ingredients for perfect', () => {
    const s = run(newGame(c, { seed: 1, unlocks: ['dark-garden'] }), craft('perfect'));
    expect(s.supply['dark-seed']).toBe(1);
  });
  it('only works in the morning', () => {
    expect(fails(afternoon(), craft())).toMatch(/morning/);
  });
});

describe('failures are machine-readable', () => {
  it('carry a code and id params the UI can translate', () => {
    const s = run(newGame(c, { seed: 1 }), craft(), craft());
    expect(failCode(s, craft())).toEqual({ code: 'not-enough-ingredient', params: { ingredient: 'honey' } });
    expect(failCode(newGame(c, { seed: 1 }), craft('fine'))).toEqual({ code: 'quality-locked', params: { quality: 'fine' } });
    expect(failCode(afternoon(), craft())).toEqual({ code: 'wrong-phase', params: { phase: 'morning' } });
  });
});

describe('serving', () => {
  it('pays the price and consumes stock', () => {
    const s0 = afternoon();
    const cu = s0.queue[0]!;
    const s1 = run(s0, { type: 'serve', customer: cu.id, quality: 'plain' });
    expect(s1.money).toBe(priceOf(c, cu.wants, 'plain'));
    expect(s1.stock['honey-drop:plain']).toBe(7);
    expect(s1.report.served).toBe(1);
    expect(s1.queue.find((x) => x.id === cu.id)).toBeUndefined();
  });
  it('rejects quality below the customer minimum, over-budget and out-of-stock', () => {
    const s = afternoon();
    s.queue[0] = { ...s.queue[0]!, minQuality: 'fine', budget: 100 };
    expect(fails(s, { type: 'serve', customer: s.queue[0]!.id, quality: 'plain' })).toMatch(/too low/);
    s.queue[0] = { ...s.queue[0]!, minQuality: 'plain', budget: 1 };
    expect(fails(s, { type: 'serve', customer: s.queue[0]!.id, quality: 'plain' })).toMatch(/budget/);
    s.stock['honey-drop:plain'] = 0;
    s.queue[0] = { ...s.queue[0]!, budget: 100 };
    expect(fails(s, { type: 'serve', customer: s.queue[0]!.id, quality: 'plain' })).toMatch(/not in stock/);
  });
  it('lets a better quality satisfy a lower requirement', () => {
    const s = afternoon(1, ['oven'], [craft('fine')]);
    s.queue[0] = { ...s.queue[0]!, wants: 'honey-drop', minQuality: 'plain', budget: 100 };
    const r = run(s, { type: 'serve', customer: s.queue[0]!.id, quality: 'fine' });
    expect(r.money).toBe(priceOf(c, 'honey-drop', 'fine'));
  });
  it('drains patience of waiting customers when another is handled, and they leave at 0', () => {
    const s = afternoon();
    expect(s.queue.length).toBeGreaterThanOrEqual(2);
    s.queue[1]!.patience = 1;
    const waiting = s.queue[1]!.id;
    const r = run(s, { type: 'refuse', customer: s.queue[0]!.id });
    expect(r.queue.find((x) => x.id === waiting)).toBeUndefined();
    expect(r.report.lost).toBe(1);
    expect(r.report.refused).toBe(1);
  });
  it('refills the counter from pending up to counterSpace', () => {
    const s = afternoon();
    expect(s.queue.length).toBeLessThanOrEqual(c.settings.counterSpace);
    const total = s.queue.length + s.pending.length;
    expect(total).toBe(s.report.arrivals);
    if (s.pending.length > 0) expect(s.queue.length).toBe(c.settings.counterSpace);
  });
  it('is only possible in the afternoon', () => {
    expect(fails(newGame(c, { seed: 1 }), { type: 'serve', customer: 1, quality: 'plain' })).toMatch(/afternoon/);
  });
});

describe('day cycle', () => {
  it('carries stock over, resets supply and records the report', () => {
    const s0 = afternoon();
    const left = s0.stock['honey-drop:plain']!;
    const s1 = run(s0, { type: 'endPhase' }, { type: 'endPhase' });
    expect(s1.day).toBe(2);
    expect(s1.phase).toBe('morning');
    expect(s1.stock['honey-drop:plain']).toBe(left);
    expect(s1.supply.honey).toBe(4);
    expect(s1.stations[0]!.batchesLeft).toBe(3);
    expect(s1.history).toHaveLength(1);
    expect(s1.history[0]!.day).toBe(1);
  });
  it('counts customers still waiting at the end of the afternoon as lost', () => {
    const s0 = afternoon();
    const waiting = s0.queue.length + s0.pending.length;
    const s1 = run(s0, { type: 'endPhase' });
    expect(s1.report.lost).toBe(waiting);
    expect(s1.queue).toEqual([]);
  });
  it('does not spawn customers whose minimum quality is locked', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = afternoon(seed, []);
      for (const cu of [...s.queue, ...s.pending]) expect(cu.type).not.toBe('merchant');
    }
  });
});

describe('contracts', () => {
  const withContract = (): State => {
    const s = newGame(c, { seed: 3, unlocks: ['contractBoard'] });
    s.contracts.push({ id: 900, candy: 'honey-drop', quality: 'plain', qty: 5, deadlineDay: 2, reward: 40 });
    return s;
  };
  it('pays the reward and takes the stock', () => {
    const s = run(withContract(), craft(), craft(), { type: 'fulfill', contract: 900 });
    expect(s.money).toBe(40);
    expect(s.stock['honey-drop:plain']).toBe(3);
    expect(s.contracts.find((x) => x.id === 900)).toBeUndefined();
    expect(s.report.contractsDone).toBe(1);
  });
  it('needs enough stock', () => {
    expect(fails(run(withContract(), craft()), { type: 'fulfill', contract: 900 })).toMatch(/stock/);
  });
  it('expires after its deadline day', () => {
    let s = withContract();
    s = run(s, { type: 'endPhase' }, { type: 'endPhase' }, { type: 'endPhase' }); // day 2
    expect(s.contracts.find((x) => x.id === 900)).toBeDefined();
    s = run(s, { type: 'endPhase' }, { type: 'endPhase' }, { type: 'endPhase' }); // day 3
    expect(s.contracts.find((x) => x.id === 900)).toBeUndefined();
    expect(s.report.contractsExpired).toBeGreaterThanOrEqual(1);
  });
  it('are only posted once the contract board is unlocked', () => {
    const posted = (unlocks: string[]) => {
      let s = newGame(c, { seed: 5, unlocks });
      let n = 0;
      for (let i = 0; i < 90; i++) {
        const r = step(c, s, { type: 'endPhase' });
        if (!r.ok) throw new Error(r.error);
        n += r.events.filter((e) => e.type === 'contractPosted').length;
        s = r.state;
      }
      return n;
    };
    expect(posted([])).toBe(0);
    expect(posted(['contractBoard'])).toBeGreaterThan(0);
  });
});
