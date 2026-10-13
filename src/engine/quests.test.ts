import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from './engine.ts';
import { journalKey } from './journal.ts';
import { reachQuests } from './testkit.ts';
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

describe('quest chain', () => {
  const first = c.quests[0]!;
  const earn = (q: typeof first) => q.goals.find((g) => g.type === 'earn') as { amount: number };
  it('starts with nothing done and nothing earned', () => {
    const s = newGame(c, { seed: 1 });
    expect(s.quests).toEqual({});
    expect(s.revenueTotal).toBe(0);
  });
  it('a quest completes by itself the moment its coins are earned, with no deadline', () => {
    const s0 = run(newGame(c, { seed: 1 }), end, end);
    s0.report.revenue = earn(first).amount - 1;
    expect(run(s0, end).quests).toEqual({}); // one coin short: nothing happens, nothing is lost
    const s1 = structuredClone(s0);
    s1.money = 99;
    s1.report.revenue = earn(first).amount;
    const r = step(c, s1, { type: 'buy', node: 'counter-space' });
    expect(r.ok && r.events.filter((e) => e.type === 'questDone')).toEqual([{ type: 'questDone', quest: first.id }]);
  });
  it('the running total counts the finished days and today, and nothing resets', () => {
    const s = days(newGame(c, { seed: 1 }), 3, 100);
    expect(s.revenueTotal).toBe(300);
    expect(s.quests[first.id]).toBeDefined();
    expect(s.quests[c.quests[1]!.id]).toBeUndefined(); // the second quest wants more
  });
  it('a quest opens only once the quests it needs are done, and a big day can finish several', () => {
    const s = newGame(c, { seed: 1 });
    s.revenueTotal = earn(c.quests[1]!).amount + 1;
    const done = run(s, end);
    expect(Object.keys(done.quests)).toEqual([c.quests[0]!.id, c.quests[1]!.id]);
    expect(done.quests[c.quests[2]!.id]).toBeUndefined();
  });
  it('a missed stretch costs nothing: empty days only delay the next quest', () => {
    const s = days(newGame(c, { seed: 1, unlocks: ['clerk'] }), 14, 0);
    expect(s.quests).toEqual({});
    expect(s.day).toBe(15);
  });
  it('own and day goals, and rewards, work too', () => {
    const cx = {
      ...c,
      quests: [
        { id: 'a', nameKey: 'quest.q1', requires: [], goals: [{ type: 'own' as const, node: 'oven', level: 1 }, { type: 'day' as const, day: 2 }], reward: [{ type: 'unlock' as const, id: 'sunflower' }] },
        { id: 'b', nameKey: 'quest.q2', requires: ['a'], goals: [{ type: 'day' as const, day: 3 }], reward: [] },
      ],
    };
    let s = newGame(cx, { seed: 1 });
    s.money = 999;
    const go = (a: Action) => {
      const r = step(cx, s, a);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    };
    go(end); go(end); // evening of day 1
    go({ type: 'buy', node: 'oven' });
    expect(s.quests).toEqual({}); // the oven is owned but day 2 has not come
    go(end); // day 2 morning
    expect(Object.keys(s.quests)).toEqual(['a']);
    expect(s.unlocks).toContain('sunflower');
  });
  it('passing the last quest does not end the game: days go on until the final quest is delivered', () => {
    const s0 = newGame(c, { seed: 1 });
    reachQuests(c, s0, c.quests.length);
    const s = days(s0, 7, 10_000);
    expect(s.completed).toBe(false);
    expect(failCode(s, end)).toBeNull();
  });
  it('delivering the final quest completes the game', () => {
    const final = c.errands.find((e) => e.final)!;
    expect(final.quest).toBe(c.quests[c.quests.length - 1]!.id);
    let s = newGame(c, { seed: 1, unlocks: final.requires });
    reachQuests(c, s, c.quests.length);
    s.stock['sweet-tooth:perfect'] = 3;
    s = run(s, { type: 'acceptErrand', errand: final.id }, { type: 'deliverErrand', errand: final.id });
    expect(s.completed).toBe(true);
  });
  it('places on the map pay their income every morning once open', () => {
    const open = (map: boolean) => {
      const s = newGame(c, { seed: 1, unlocks: map ? ['map'] : [] });
      reachQuests(c, s, 3);
      return s;
    };
    const income = c.places.filter((p) => p.quest === undefined || ['q1', 'q2', 'q3'].includes(p.quest)).reduce((n, p) => n + p.income, 0);
    expect(income).toBeGreaterThan(0);
    const s1 = run(open(true), end, end, end);
    expect(s1.report.income).toBe(income);
    expect(s1.report.revenue).toBeGreaterThanOrEqual(income);
    expect(run(open(false), end, end, end).report.income).toBe(0); // no map, no places
  });
  it('later quests bring more customers', () => {
    const arrivals = (n: number) => {
      let total = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const s0 = newGame(c, { seed });
        reachQuests(c, s0, n);
        total += run(s0, end).report.arrivals;
      }
      return total;
    };
    expect(arrivals(2)).toBeGreaterThan(arrivals(0) * 1.3);
  });
  it('a quest done today is the news in the journal', () => {
    const s0 = run(newGame(c, { seed: 1 }), end, end);
    s0.day = 5;
    s0.money = 99;
    s0.report.revenue = earn(first).amount;
    const s = run(s0, { type: 'buy', node: 'counter-space' });
    const onlyQuestLine = { ...c, journal: c.journal.filter((j) => j.when.questToday !== undefined) };
    expect(journalKey(onlyQuestLine, s)).toBe('journal.quest-done');
    expect(journalKey(onlyQuestLine, day(newGame(c, { seed: 1 }), 30))).toBeNull();
  });
});

describe('rival hive', () => {
  const stageN = (index: number): State => {
    const s = newGame(c, { seed: 1 });
    reachQuests(c, s, index);
    s.nodes['honey-yield'] = 1; // 3 honey a day: the rival hive never cuts below 2
    return s;
  };
  /** Honey delivered on morning `d` of the week (1-based), playing empty days up to it. */
  const honeyOnDay = (s: State, d: number) => {
    for (let i = 1; i < d; i++) s = run(s, end, end, end);
    return s.supply.honey;
  };
  it('does not exist before the first quest', () => {
    expect(run(newGame(c, { seed: 1 }), end, end, end).supply.honey).toBe(2);
  });
  it('gives a grace period: no theft before startsOnDay, then it steals', () => {
    const { startsOnDay, amount } = c.quests[0]!.rival!;
    expect(startsOnDay).toBeGreaterThan(1);
    expect(honeyOnDay(stageN(1), startsOnDay - 1)).toBe(3);
    expect(honeyOnDay(stageN(1), startsOnDay)).toBe(3 - amount);
  });
  it('never takes supply below the floor', () => {
    const supply = honeyOnDay(stageN(2), c.quests[1]!.rival!.startsOnDay + 1);
    expect(supply).toBeGreaterThanOrEqual(c.settings.rivalMinSupply);
  });
  it('is handled for good by the rival-hive errand', () => {
    const s = stageN(2);
    s.errands['rival-hive'] = { status: 'done' };
    expect(honeyOnDay(s, 4)).toBe(3);
  });
});

describe('errands', () => {
  const board = (extra: string[] = []): State => {
    const s = newGame(c, { seed: 2, unlocks: ['errandsBoard', 'oven', ...extra] });
    reachQuests(c, s, 1); // the errands open with the second stage
    return s;
  };
  const accept = (errand: string): Action => ({ type: 'acceptErrand', errand });
  const deliver = (errand: string): Action => ({ type: 'deliverErrand', errand });
  const craft = (): Action => ({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' });
  const fineCane: Action = { type: 'craft', station: 0, candy: 'candy-cane', quality: 'fine' };

  it('need the board unlock and the stage, and can only be taken once', () => {
    expect(failCode(newGame(c, { seed: 1 }), accept('queen-fever'))).toBe('errand-unavailable');
    expect(failCode(newGame(c, { seed: 1, unlocks: ['errandsBoard'] }), accept('queen-fever'))).toBe('errand-unavailable'); // needs the oven too
    expect(failCode(board(), accept('pilgrim-feast'))).toBe('errand-unavailable'); // stage 2
    expect(failCode(board(), accept('nope'))).toBe('unknown-errand');
    expect(failCode(run(board(), accept('queen-fever')), accept('queen-fever'))).toBe('errand-taken');
  });
  describe('bees and royal jelly', () => {
    const queenDone = (): State => run(board(), accept('queen-fever'), fineCane, deliver('queen-fever'));
    const customersOver = (start: () => State, seeds: number): { type: string; wants: string }[] => {
      const out: { type: string; wants: string }[] = [];
      for (let seed = 1; seed <= seeds; seed++) {
        const g = start();
        g.rng = seed;
        const open = run(g, end);
        out.push(...[...open.queue, ...open.pending].map((cu) => ({ type: cu.type, wants: cu.want.kind === 'ingredient' ? cu.want.ingredient : cu.want.kind === 'candy' ? cu.want.candy : 'rich' })));
      }
      return out;
    };
    it('the queen reward brings the bees, not royal jelly: that comes later, with the hive gratitude', () => {
      expect(queenDone().unlocks).toContain('bee-customers');
      expect(queenDone().unlocks).not.toContain('royal-jelly');
      const gift = (): State => {
        const g = board(['magic-cauldron', 'sunflower']);
        reachQuests(c, g, 5);
        g.stock['sunflower-nougat:fine'] = 8;
        return run(g, accept('royal-gift'), deliver('royal-gift'));
      };
      expect(failCode(board(['sunflower']), accept('royal-gift'))).toBe('errand-unavailable'); // needs the magic cauldron
      expect(gift().unlocks).toContain('royal-jelly');
      let jelly = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const g = gift();
        g.rng = seed;
        jelly += run(g, end, end, end).supply['royal-jelly'] ?? 0;
      }
      expect(jelly).toBeGreaterThan(0);
    });
    it('no bee comes before the queen is well', () => {
      const asked = customersOver(() => run(board(), accept('queen-fever')), 30);
      expect(asked.some((x) => x.type === 'bee')).toBe(false);
    });
    it('after the errand bees come sometimes, and they only crave honey', () => {
      const asked = customersOver(queenDone, 40);
      const bees = asked.filter((x) => x.type === 'bee');
      expect(bees.length).toBeGreaterThan(0);
      expect(bees.every((b) => b.wants === 'honey')).toBe(true); // they crave honey, and nothing else
      expect(bees.length).toBeLessThan(asked.length / 2); // sometimes, not most of the time
    });
    it('a bee pays for candy', () => {
      const g = queenDone();
      g.supply.honey = 2; // the Fine batch for the quest used it all
      let s = run(g, craft(), end);
      const bee = { id: 9999, type: 'bee', want: { kind: 'ingredient', ingredient: 'honey' }, minQuality: 'plain', patience: 5, budget: 10 } as const;
      s.queue = [bee];
      s = run(s, { type: 'serve', customer: 9999, candy: 'candy-cane', quality: 'plain' });
      expect(s.money).toBe(5);
    });
  });
  it('delivery takes the stock and pays a permanent reward from the next morning', () => {
    let s = run(board(), accept('queen-fever'), fineCane);
    expect(failCode(run(board(), accept('queen-fever')), deliver('queen-fever'))).toBe('not-enough-stock');
    s = run(s, deliver('queen-fever'));
    expect(s.errands['queen-fever']).toEqual({ status: 'done' });
    expect(s.stock['candy-cane:fine']).toBe(0);
    const next = run(s, end, end, end).supply;
    expect(next.honey! + (next['royal-jelly'] ?? 0)).toBe(4); // 2 base + 2 reward (some may arrive as jelly)
    expect(failCode(s, deliver('queen-fever'))).toBe('errand-not-active');
  });
  it('cannot be delivered in the evening', () => {
    const s = run(board(), accept('queen-fever'), fineCane, end, end);
    expect(failCode(s, deliver('queen-fever'))).toBe('wrong-phase');
  });
  describe('mission', () => {
    const ready = () => {
      const s = board(['clerk']);
      s.nodes['honey-yield'] = 1; // 3 honey a day
      reachQuests(c, s, 1);
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
        s.batchesMade['candy-cane'] = 2;
        if (accepted) s = run(s, accept('rival-hive'));
        s = run(s, { type: 'delegate', customerType: 'faithful', on: true });
        s = run(s, { type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' }, end);
        return s;
      };
      expect(withClerk(false).report.autoServed).toBeGreaterThan(0);
      expect(withClerk(true).report.autoServed).toBe(0);
    });
    it('is rewarded with permanent relief from the rival hive', () => {
      let s = run(ready(), accept('rival-hive'));
      s = run(s, end, end, end, end, end, end);
      expect(s.errands['rival-hive']?.status).toBe('done');
      expect(s.supply.honey).toBe(3); // rival would take 2 in stage 2
    });
  });
});
