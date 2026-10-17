import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from '../engine/engine.ts';
import { botDay } from '../sim/bot.ts';
import { SAVE_VERSION, deserialize, exportString, importString, serialize } from './save.ts';

const c = loadContent(readContentFiles(false));
const played = () => {
  let s = newGame(c, { seed: 3 });
  for (let i = 0; i < 12; i++) s = botDay(c, s);
  return s;
};

describe('save', () => {
  it('round-trips a played game exactly', () => {
    const s = played();
    expect(deserialize(c, serialize(s))).toEqual({ ok: true, state: s });
  });
  it('a loaded game keeps playing identically to the original', () => {
    const s = played();
    const loaded = deserialize(c, serialize(s));
    if (!loaded.ok) throw new Error(loaded.error);
    expect(step(c, loaded.state, { type: 'endPhase' })).toEqual(step(c, s, { type: 'endPhase' }));
  });
  it('export string round-trips and tolerates surrounding whitespace', () => {
    const s = played();
    const text = exportString(s);
    expect(text.startsWith('CST1:')).toBe(true);
    expect(importString(c, `  ${text}\n`)).toEqual({ ok: true, state: s });
  });
  it('upgrades a v10 save: stage N cleared becomes quests q1..qN done, and the revenue total is rebuilt', () => {
    const s = played();
    const old = JSON.parse(serialize(s));
    old.v = 10;
    delete old.state.quests;
    delete old.state.revenueTotal;
    old.state.stage = { index: 3, day: 2, revenue: 50, misses: 1 };
    old.state.lastWeek = { stage: 2, passed: true, revenue: 1000, target: 900 };
    const r = deserialize(c, JSON.stringify(old));
    if (!r.ok) throw new Error(r.error);
    expect(Object.keys(r.state.quests)).toEqual(['q1', 'q2', 'q3']);
    expect(r.state).not.toHaveProperty('stage');
    expect(r.state).not.toHaveProperty('lastWeek');
    expect(r.state.revenueTotal).toBe(s.history.reduce((n, h) => n + h.revenue, 0));
  });
  it('upgrades a v2 save: the morning delivery is taken from the remaining stock', () => {
    const s = played();
    const old = JSON.parse(serialize(s));
    old.v = 2;
    delete old.state.supplyToday;
    const r = deserialize(c, JSON.stringify(old));
    expect(r).toEqual({ ok: true, state: { ...s, supplyToday: s.supply } });
  });
  it('upgrades a v4 save: customers get a candy want, days get tips', () => {
    const s = played();
    s.report.tips = 0; // an old save has no tips: they come back as 0
    for (const h of s.history) h.tips = 0;
    s.queue = [{ id: 7, type: 'faithful', want: { kind: 'candy', candy: 'candy-cane' }, minQuality: 'plain', patience: 3, budget: 6 }];
    const old = JSON.parse(serialize(s));
    old.v = 4;
    old.state.queue = [{ id: 7, type: 'faithful', wants: 'candy-cane', minQuality: 'plain', patience: 3, budget: 6 }];
    delete old.state.report.tips;
    for (const h of old.state.history) delete h.tips;
    const r = deserialize(c, JSON.stringify(old));
    expect(r).toEqual({ ok: true, state: s });
  });
  it('rejects garbage, wrong shapes, future versions and unknown content ids', () => {
    expect(deserialize(c, 'nope').ok).toBe(false);
    expect(deserialize(c, '{"v":1,"state":{}}').ok).toBe(false);
    expect(importString(c, 'hello').ok).toBe(false);
    expect(importString(c, 'CST1:%%%').ok).toBe(false);
    const s = played();
    const future = JSON.parse(serialize(s));
    future.v = SAVE_VERSION + 1;
    expect(deserialize(c, JSON.stringify(future))).toMatchObject({ ok: false, code: 'newer-version' });
    const bad = JSON.parse(serialize(s));
    bad.state.stations[0].type = 'ghost';
    expect(deserialize(c, JSON.stringify(bad))).toMatchObject({ ok: false, code: 'unknown-content', error: expect.stringMatching(/unknown station/) });
  });
});

describe('save migration', () => {
  it('upgrades a v1 save (before weekly stages) and keeps its progress', () => {
    const s = played();
    const env = JSON.parse(serialize(s));
    env.v = 1;
    for (const k of ['quests', 'revenueTotal', 'completed', 'errands']) delete env.state[k];
    for (const h of env.state.history) delete h.stage;
    delete env.state.report.stage;
    const r = deserialize(c, JSON.stringify(env));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.quests).toEqual({});
    expect(r.state.revenueTotal).toBe(s.history.reduce((n, h) => n + h.revenue, 0)); // rebuilt from the day reports
    expect(r.state.errands).toEqual({});
    expect(r.state.completed).toBe(false);
    expect(r.state.money).toBe(s.money);
    expect(r.state.nodes).toEqual(s.nodes);
    expect(r.state.history).toHaveLength(s.history.length);
  });
  it('upgrades a v12 save: the rating starts neutral and old day reports count as zero happy', () => {
    const env = JSON.parse(serialize(played()));
    env.v = 12;
    delete env.state.rating;
    delete env.state.report.happy;
    for (const h of env.state.history) delete h.happy;
    const r = deserialize(c, JSON.stringify(env));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.rating).toBe(50);
    expect(r.state.report.happy).toBe(0);
  });
});
