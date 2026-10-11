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
    const s = days(newGame(c, { seed: 1 }), 7, 30, events); // 210 >= 200
    expect(s.stage).toEqual({ index: 1, day: 0, revenue: 0 });
    expect(s.lastWeek).toEqual({ stage: 0, passed: true, revenue: 210, target: 200 });
    expect(events.filter((e) => e.type === 'weekEnded')).toHaveLength(1);
  });
  it('missing the target repeats the week and keeps everything (no fail state)', () => {
    const s0 = newGame(c, { seed: 1, unlocks: ['clerk'] });
    s0.nodes.oven = 1;
    s0.stock['honey-drop:plain'] = 5;
    const s = days(s0, 7, 10); // 70 < 200
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
    const passed = days(newGame(c, { seed: 1 }), 7, 30);
    expect(journalKey(c, passed)).toBe('journal.week-passed');
    const missed = days(newGame(c, { seed: 1 }), 7, 10);
    expect(journalKey(c, missed)).toBe('journal.week-missed');
    expect(journalKey(c, day(missed, 30))).not.toMatch(/week-/);
  });
});

describe('rival hive', () => {
  const morningSupply = (s: State) => run(s, end, end, end).supply.honey;
  const inStage2 = (): State => {
    const s = newGame(c, { seed: 1 });
    s.stage.index = 1;
    return s;
  };
  it('steals honey from stage 2 on, but never below the floor', () => {
    expect(run(newGame(c, { seed: 1 }), end, end, end).supply.honey).toBe(4); // stage 1: no rival
    expect(morningSupply(inStage2())).toBe(2);
    const rich = inStage2();
    rich.nodes['honey-yield'] = 4; // 8 honey: pressure applies in full
    expect(morningSupply(rich)).toBe(6);
    const poor = inStage2();
    poor.nodes['honey-yield'] = 0;
    const floorTest = structuredClone(poor);
    expect(morningSupply(floorTest)).toBeGreaterThanOrEqual(c.settings.rivalMinSupply);
  });
  it('is handled for good by the rival-hive errand', () => {
    const s = inStage2();
    s.errands['rival-hive'] = { status: 'done' };
    expect(morningSupply(s)).toBe(4);
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
