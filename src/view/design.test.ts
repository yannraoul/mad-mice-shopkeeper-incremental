import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { createTranslate } from '../i18n/core.ts';
import { newGame, step } from '../engine/engine.ts';
import type { Action, State } from '../engine/types.ts';
import {
  buildBoardView,
  buildCraftView,
  buildErrandsView,
  buildEveningView,
  buildHeaderView,
  buildServeView,
  buildStageView,
  craftReduce,
  initialCraftUi,
  type CraftUi,
} from './index.ts';

// The presentation state added for the v2 design: phases, day pips, patience tiers, upgrade and
// errand states, stock chips, the craft scene and step track.
const c = loadContent(readContentFiles(false));
const en = createTranslate(c.strings, 'en');
const fr = createTranslate(c.strings, 'fr');
const end: Action = { type: 'endPhase' };

function run(s: State, ...actions: Action[]): State {
  for (const a of actions) {
    const r = step(c, s, a);
    if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
    s = r.state;
  }
  return s;
}
const craft = (quality = 'plain'): Action => ({ type: 'craft', station: 0, candy: 'honey-drop', quality });

describe('header and stage strip', () => {
  it('lists the three phases with the current one flagged and the day of the week', () => {
    const h = buildHeaderView(c, newGame(c, { seed: 1 }), en);
    expect(h.phases.map((p) => [p.label, p.active])).toEqual([['Morning', true], ['Afternoon', false], ['Evening', false]]);
    expect(h.dayNo).toBe(1);
    expect(h.dayOf).toBe(c.stages[0]!.days);
    expect(buildHeaderView(c, newGame(c, { seed: 1 }), fr).coinsLabel).toBe('pièces');
  });
  it('has one pip per day, the current one marked, and no chip while there is no rival', () => {
    const v = buildStageView(c, newGame(c, { seed: 1 }), en);
    expect(v.pips).toHaveLength(c.stages[0]!.days);
    expect(v.pips[0]!.state).toBe('current');
    expect(v.pips.filter((p) => p.state === 'current')).toHaveLength(1);
    expect(v.chip).toBeNull();
  });
  it('turns the rival warning into a short chip and marks the day it starts', () => {
    const s = newGame(c, { seed: 1 });
    s.stage.index = 1; // the week with the rival hive
    const v = buildStageView(c, s, en);
    expect(v.warning).not.toBeNull();
    expect(v.chip!.label.length).toBeLessThan(v.warning!.length);
    expect(v.chip!.hintLabel).toBe('hint');
    expect(v.pips.findIndex((p) => p.rival)).toBe(c.stages[1]!.rival!.startsOnDay - 1);
  });
});

describe('serve view', () => {
  const s = run(newGame(c, { seed: 1 }), craft(), craft(), end);
  it('describes patience as a segmented meter with a tier', () => {
    const v = buildServeView(c, s, en);
    expect(v.customers.length).toBeGreaterThan(0);
    for (const cu of v.customers) {
      const m = cu.patienceMeter;
      expect(m.max).toBeGreaterThanOrEqual(m.left);
      expect(m.tier).toBe(m.left <= 1 ? 'urgent' : m.left / m.max <= 0.5 ? 'low' : 'ok');
      expect(cu.portrait).toBe(`customer-${cu.type}`);
      expect(cu.budgetText).toBe(`${cu.budget} coins max`);
    }
  });
  it('shows "Leaving!" on the last unit of patience and a number otherwise', () => {
    const t = structuredClone(s);
    t.queue[0]!.patience = 1;
    expect(buildServeView(c, t, en).customers[0]!.patienceMeter).toMatchObject({ tier: 'urgent', label: 'Leaving!' });
    t.queue[0]!.patience = 2;
    expect(buildServeView(c, t, en).customers[0]!.patienceMeter.label).toBe('Patience 2');
  });
  it('exposes the clerk training counters', () => {
    const t = newGame(c, { seed: 1, unlocks: ['clerk'] });
    const w = buildServeView(c, t, en).workers[0]!;
    expect(w.training[0]).toMatchObject({ made: 0, need: c.settings.delegateAfterBatches });
    expect(w.training[0]!.byHand).toBe(`0 / ${c.settings.delegateAfterBatches} by hand`);
  });
});

describe('board stock chips', () => {
  it('has one chip per stocked candy with rings equal to the quality rank', () => {
    const s0 = newGame(c, { seed: 1, unlocks: ['oven'] });
    s0.supply.honey = 10;
    const s = run(s0, craft(), craft('fine'));
    const chips = buildBoardView(c, s, en).stockChips;
    expect(chips.map((x) => [x.art, x.rings])).toEqual([
      ['candy-honey-drop', 0],
      ['candy-honey-drop', 1],
    ]);
    expect(buildBoardView(c, newGame(c, { seed: 1 }), en).stockChips).toEqual([]);
  });
});

describe('errand presentation states', () => {
  const withBoard = (unlocks: string[] = []) => newGame(c, { seed: 1, unlocks: ['errandsBoard', ...unlocks] });
  it('goes available -> under way -> ready -> done with a chip and progress', () => {
    const e = c.errands.find((x) => x.kind === 'deliver' && x.requires.every((u) => u === 'errandsBoard'));
    expect(e).toBeDefined();
    let s = withBoard();
    const item = (st: State) => buildErrandsView(c, st, en)!.items.find((i) => i.id === e!.id)!;
    expect(item(s)).toMatchObject({ tone: 'available', chip: null, progress: null });
    s = run(s, { type: 'acceptErrand', errand: e!.id });
    expect(item(s)).toMatchObject({ tone: 'underway', chip: 'Under way' });
    expect(item(s).progress).toMatchObject({ label: 'In stock', n: 0, max: e!.deliver.reduce((n, d) => n + d.qty, 0) });
    for (const d of e!.deliver) s.stock[`${d.candy}:${d.quality}`] = d.qty;
    expect(item(s)).toMatchObject({ tone: 'ready', chip: 'Ready' });
    s = run(s, { type: 'deliverErrand', errand: e!.id });
    expect(item(s)).toMatchObject({ tone: 'done', chip: 'Done', statusText: 'Reward received.' });
  });
  it('shows a mission as "<worker> away" with day progress', () => {
    const m = c.errands.find((x) => x.kind === 'mission' && x.requires.every((u) => u === 'errandsBoard' || u === 'clerk'));
    expect(m).toBeDefined();
    let s = withBoard(['clerk']);
    s = run(s, { type: 'acceptErrand', errand: m!.id });
    const it = buildErrandsView(c, s, en)!.items.find((i) => i.id === m!.id)!;
    expect(it).toMatchObject({ tone: 'underway', chip: 'Clerk away' });
    expect(it.progress).toMatchObject({ label: 'Day', n: 0, max: m!.mission!.days });
  });
});

describe('evening: upgrade states', () => {
  const evening = (money: number) => {
    const s = run(newGame(c, { seed: 1 }), end, end);
    s.money = money;
    return s;
  };
  const nodes = (s: State) => buildEveningView(c, s, en).tree.branches.flatMap((b) => b.nodes);
  it('tells locked, short of coins and affordable apart, with the reason', () => {
    const poor = nodes(evening(0));
    expect(poor.some((n) => n.state === 'short' && n.shortBy?.startsWith('Short by '))).toBe(true);
    const locked = poor.find((n) => n.state === 'locked')!;
    expect(locked.lockReason).toMatch(/^Requires .+ first\.$/);
    expect(locked.stateLabel).toBe('Locked');
    const rich = nodes(evening(100000));
    expect(rich.some((n) => n.state === 'afford')).toBe(true);
    expect(rich.filter((n) => n.state === 'afford').every((n) => n.buy!.enabled && n.stateLabel === 'Can afford')).toBe(true);
  });
  it('marks a bought one-time unlock "owned" and a top level "maxed", and counts what can be afforded per branch', () => {
    let s = evening(100000);
    s = run(s, { type: 'buy', node: 'oven' });
    const oven = nodes(s).find((n) => n.id === 'oven')!;
    expect(oven).toMatchObject({ state: 'owned', stateLabel: 'Owned', pips: null, buy: null });
    const repeatable = nodes(s).find((n) => n.pips && n.state === 'afford')!;
    while (nodes(s).find((n) => n.id === repeatable.id)!.state !== 'maxed') s = run(s, { type: 'buy', node: repeatable.id });
    expect(nodes(s).find((n) => n.id === repeatable.id)).toMatchObject({ state: 'maxed', stateLabel: 'Maxed' });
    const kitchen = buildEveningView(c, s, en).tree.branches[0]!;
    expect(kitchen.affordText).toMatch(/^\d+ can afford$/);
    expect(kitchen.glyph).not.toBe('');
  });
  it('gives the report as figures with captions', () => {
    const r = buildEveningView(c, evening(0), en).report;
    expect(r.stats).toHaveLength(6);
    expect(r.stats[0]).toMatchObject({ label: 'Earned', highlight: true });
  });
});

describe('craft scene, recipes and step track', () => {
  const s0 = newGame(c, { seed: 1, unlocks: ['oven'] });
  const startUi = (quality: string): CraftUi => {
    const ui = craftReduce(c, s0, { ...initialCraftUi(c), quality }, { type: 'start' }, () => true);
    expect(ui.session).not.toBeNull();
    return ui;
  };
  it('describes the shelf, batches and recipes before a batch is started', () => {
    const v = buildCraftView(c, s0, initialCraftUi(c), en);
    expect(v.scene.shelf[0]).toMatchObject({ ingredient: 'honey', held: false, dimmed: false, enabled: false });
    expect(v.scene.batches.left).toBe(v.scene.batches.total);
    expect(v.scene.inCauldron).toBeNull();
    expect(v.idle!.recipes[0]).toMatchObject({ selected: true, costText: '2 Honey' });
    expect(v.idle!.qualityOptions.map((q) => [q.label, q.enabled])).toEqual([['Plain', true], ['Fine', true], ['Perfect', false]]);
    expect(v.idle!.qualityOptions[1]!.note).toBe('×1.6 · oven');
  });
  it('arms the cauldron while an ingredient is held', () => {
    let ui = startUi('plain');
    ui = craftReduce(c, s0, ui, { type: 'tapShelf', ingredient: 'honey' }, () => true);
    const v = buildCraftView(c, s0, ui, en);
    expect(v.scene.shelf[0]).toMatchObject({ held: true, dimmed: false });
    expect(v.scene.stationArmed).toBe(true);
    expect(v.scene.inCauldron!.lines).toEqual(['Honey 0 / 2']);
  });
  it('lays out Fill, Stir, Bake, Shape and dims Bake unless the quality needs the oven', () => {
    const plain = buildCraftView(c, s0, startUi('plain'), en).bench!.track;
    expect(plain.map((x) => x.label)).toEqual(['Fill', 'Stir', 'Bake', 'Shape']);
    expect(plain.map((x) => x.dimmed)).toEqual([false, false, true, false]);
    expect(plain[0]).toMatchObject({ state: 'current', note: '0 / 2 Honey' });
    const fine = buildCraftView(c, s0, startUi('fine'), en).bench!.track;
    expect(fine.map((x) => x.dimmed)).toEqual([false, false, false, false]);
  });
});
