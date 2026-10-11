import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from './engine.ts';
import { journalKey } from './journal.ts';
import type { Action, GameEvent, State } from './types.ts';

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
const failCode = (s: State, a: Action) => {
  const r = step(c, s, a);
  return r.ok ? null : r.code;
};
/** Play one day with a given revenue (set directly on the report) and collect the events. */
function day(s: State, revenue: number, events: GameEvent[] = []): State {
  s = run(s, end, end); // morning -> afternoon -> evening
  s.report.revenue = revenue;
  const r = step(c, s, end);
  if (!r.ok) throw new Error(r.error);
  events.push(...r.events);
  return r.state;
}
const days = (s: State, n: number, revenue: number, events: GameEvent[] = []) => {
  for (let i = 0; i < n; i++) s = day(s, revenue, events);
  return s;
};

describe('weekly stages', () => {
  it('start at stage 1, day 0', () => {
    expect(newGame(c, { seed: 1 }).stage).toEqual({ index: 0, day: 0, revenue: 0 });
  });
  it('count days and revenue toward the week', () => {
    const s = days(newGame(c, { seed: 1 }), 3, 40);
    expect(s.stage).toEqual({ index: 0, day: 3, revenue: 120 });
    expect(s.lastWeek).toBeNull();
  });
  it('reaching the target opens the next stage and reports the week', () => {
    const events: GameEvent[] = [];
    const perDay = Math.ceil(c.stages[0]!.target / 7) + 1;
    const s = days(newGame(c, { seed: 1 }), 7, perDay, events);
    expect(s.stage).toEqual({ index: 1, day: 0, revenue: 0 });
    expect(s.lastWeek).toEqual({ stage: 0, passed: true, revenue: perDay * 7, target: c.stages[0]!.target });
    expect(events.filter((e) => e.type === 'weekEnded')).toHaveLength(1);
  });
  it('missing the target repeats the week and keeps everything (no fail state)', () => {
    const s0 = newGame(c, { seed: 1, unlocks: ['clerk'] });
    s0.nodes.oven = 1;
    s0.stock['honey-drop:plain'] = 5;
    const s = days(s0, 7, 10); // 70 is far below any stage target
    expect(s.stage).toEqual({ index: 0, day: 0, revenue: 0 });
    expect(s.lastWeek).toMatchObject({ stage: 0, passed: false, revenue: 70 });
    expect(s.nodes.oven).toBe(1);
    expect(s.unlocks).toContain('clerk');
    expect(s.stock['honey-drop:plain']).toBe(5);
    expect(s.day).toBe(8);
  });
  it('clearing the final stage sets completed and play continues on that stage', () => {
    const last = c.stages.length - 1;
    const s0 = newGame(c, { seed: 1 });
    s0.stage.index = last;
    const s = days(s0, c.stages[last]!.days, 10_000);
    expect(s.completed).toBe(true);
    expect(s.stage.index).toBe(last);
    expect(failCode(s, end)).toBeNull();
  });
  it('later stages bring more customers', () => {
    const arrivals = (stage: number) => {
      let total = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const s0 = newGame(c, { seed });
        s0.stage.index = stage;
        total += run(s0, end).report.arrivals;
      }
      return total;
    };
    expect(arrivals(2)).toBeGreaterThan(arrivals(0) * 1.3);
  });
  it('shows the result of the week in the journal right after it closes', () => {
    const passed = days(newGame(c, { seed: 1 }), 7, Math.ceil(c.stages[0]!.target / 7) + 1);
    expect(journalKey(c, passed)).toBe('journal.week-passed');
    const missed = days(newGame(c, { seed: 1 }), 7, 10);
    expect(journalKey(c, missed)).toBe('journal.week-missed');
    expect(journalKey(c, day(missed, 30))).not.toMatch(/week-/);
  });
});

describe('rival hive', () => {
  const stageN = (index: number): State => {
    const s = newGame(c, { seed: 1 });
    s.stage.index = index;
    return s;
  };
  /** Honey delivered on morning `d` of the week (1-based), playing empty days up to it. */
  const honeyOnDay = (s: State, d: number) => {
    for (let i = 1; i < d; i++) s = run(s, end, end, end);
    return s.supply.honey;
  };
  it('does not exist in stage 1', () => {
    expect(run(newGame(c, { seed: 1 }), end, end, end).supply.honey).toBe(4);
  });
  it('gives a grace period: no theft before startsOnDay, then it steals', () => {
    const { startsOnDay, amount } = c.stages[1]!.rival!;
    expect(startsOnDay).toBeGreaterThan(1);
    expect(honeyOnDay(stageN(1), startsOnDay - 1)).toBe(4);
    expect(honeyOnDay(stageN(1), startsOnDay)).toBe(4 - amount);
  });
  it('never takes supply below the floor', () => {
    const supply = honeyOnDay(stageN(2), c.stages[2]!.rival!.startsOnDay + 1);
    expect(supply).toBeGreaterThanOrEqual(c.settings.rivalMinSupply);
  });
  it('is handled for good by the rival-hive errand', () => {
    const s = stageN(2);
    s.errands['rival-hive'] = { status: 'done' };
    expect(honeyOnDay(s, 4)).toBe(4);
  });
});

describe('errands', () => {
  const board = (extra: string[] = []): State => newGame(c, { seed: 2, unlocks: ['errandsBoard', ...extra] });
  const accept = (errand: string): Action => ({ type: 'acceptErrand', errand });
  const deliver = (errand: string): Action => ({ type: 'deliverErrand', errand });
  const tonic: Action = { type: 'craft', station: 0, candy: 'royal-tonic', quality: 'plain' };

  it('need the board unlock and the stage, and can only be taken once', () => {
    expect(failCode(newGame(c, { seed: 1 }), accept('queen-fever'))).toBe('errand-unavailable');
    expect(failCode(board(), accept('pilgrim-feast'))).toBe('errand-unavailable'); // stage 2 + oven
    expect(failCode(board(), accept('nope'))).toBe('unknown-errand');
    expect(failCode(run(board(), accept('queen-fever')), accept('queen-fever'))).toBe('errand-taken');
  });
  it('accepting unlocks the special recipe, which customers and contracts never ask for', () => {
    const s = run(board(), accept('queen-fever'));
    expect(s.unlocks).toContain('tonic-recipe');
    expect(run(s, tonic).stock['royal-tonic:plain']).toBe(4);
    for (let seed = 1; seed <= 20; seed++) {
      const g = newGame(c, { seed, unlocks: ['errandsBoard', 'tonic-recipe', 'contractBoard'] });
      const o = run(g, end);
      for (const cu of [...o.queue, ...o.pending]) expect(cu.wants).not.toBe('royal-tonic');
      expect(g.contracts.every((ct) => ct.candy !== 'royal-tonic')).toBe(true);
    }
  });
  describe('bees and the royal tonic', () => {
    const queenDone = (): State => {
      let s = run(board(), accept('queen-fever'), tonic);
      return run(s, deliver('queen-fever'));
    };
    const customersOver = (start: () => State, seeds: number): { type: string; wants: string }[] => {
      const out: { type: string; wants: string }[] = [];
      for (let seed = 1; seed <= seeds; seed++) {
        const g = start();
        g.rng = seed;
        const open = run(g, end);
        out.push(...[...open.queue, ...open.pending].map((cu) => ({ type: cu.type, wants: cu.wants })));
      }
      return out;
    };
    it('the tonic recipe stays available after the errand', () => {
      expect(run(queenDone(), tonic).stock['royal-tonic:plain']).toBe(4);
    });
    it('no bee comes before the queen is well, even once the recipe is unlocked', () => {
      const asked = customersOver(() => run(board(), accept('queen-fever')), 30);
      expect(asked.some((x) => x.type === 'bee')).toBe(false);
    });
    it('after the errand bees come sometimes, and they only ever ask for the tonic', () => {
      const asked = customersOver(queenDone, 40);
      const bees = asked.filter((x) => x.type === 'bee');
      expect(bees.length).toBeGreaterThan(0);
      expect(bees.every((b) => b.wants === 'royal-tonic')).toBe(true);
      expect(asked.filter((x) => x.type !== 'bee').every((x) => x.wants !== 'royal-tonic')).toBe(true);
      expect(bees.length).toBeLessThan(asked.length / 2); // sometimes, not most of the time
    });
    it('a bee pays for the tonic', () => {
      let s = run(queenDone(), tonic, end);
      const bee = { id: 9999, type: 'bee', wants: 'royal-tonic', minQuality: 'plain', patience: 5, budget: 10 };
      s.queue = [bee];
      s = run(s, { type: 'serve', customer: 9999, quality: 'plain' });
      expect(s.money).toBe(10);
    });
    it('contracts never ask for the tonic', () => {
      const g = queenDone();
      g.unlocks.push('contractBoard');
      for (let i = 0; i < 40; i++) {
        const next = run(structuredClone(g), end, end, end);
        expect(next.contracts.every((ct) => ct.candy !== 'royal-tonic')).toBe(true);
        g.rng = next.rng;
      }
    });
  });
  it('delivery takes the stock and pays a permanent reward from the next morning', () => {
    let s = run(board(), accept('queen-fever'), tonic);
    expect(failCode(run(board(), accept('queen-fever')), deliver('queen-fever'))).toBe('not-enough-stock');
    s = run(s, deliver('queen-fever'));
    expect(s.errands['queen-fever']).toEqual({ status: 'done' });
    expect(s.stock['royal-tonic:plain']).toBe(0);
    expect(run(s, end, end, end).supply.honey).toBe(6); // 4 base + 2 reward
    expect(failCode(s, deliver('queen-fever'))).toBe('errand-not-active');
  });
  it('cannot be delivered in the evening', () => {
    const s = run(board(), accept('queen-fever'), tonic, end, end);
    expect(failCode(s, deliver('queen-fever'))).toBe('wrong-phase');
  });
  describe('mission', () => {
    const ready = () => {
      const s = board(['clerk']);
      s.stage.index = 1;
      return s;
    };
    it('keeps the worker away for its duration, then pays out', () => {
      let s = run(ready(), accept('rival-hive'));
      expect(s.errands['rival-hive']).toEqual({ status: 'active', daysLeft: 2 });
      s = run(s, end, end, end); // day 2
      expect(s.errands['rival-hive']).toEqual({ status: 'active', daysLeft: 1 });
      s = run(s, end, end, end); // day 3
      expect(s.errands['rival-hive']).toEqual({ status: 'done' });
      expect(s.report.day).toBe(3);
    });
    it('the clerk does not sell while away', () => {
      const withClerk = (accepted: boolean) => {
        let s = ready();
        s.batchesMade['honey-drop'] = 2;
        if (accepted) s = run(s, accept('rival-hive'));
        s = run(s, { type: 'delegate', customerType: 'faithful', on: true });
        s = run(s, { type: 'craft', station: 0, candy: 'honey-drop', quality: 'plain' }, end);
        return s;
      };
      expect(withClerk(false).report.autoServed).toBeGreaterThan(0);
      expect(withClerk(true).report.autoServed).toBe(0);
    });
    it('is rewarded with permanent relief from the rival hive', () => {
      let s = run(ready(), accept('rival-hive'));
      s = run(s, end, end, end, end, end, end);
      expect(s.errands['rival-hive']?.status).toBe('done');
      expect(s.supply.honey).toBe(4); // rival would take 2 in stage 2
    });
  });
});
