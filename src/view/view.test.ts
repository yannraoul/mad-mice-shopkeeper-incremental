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
  buildMapView,
  buildMenuView,
  buildServeView,
  buildStageView,
  craftReduce,
  describeFail,
  describeImportResult,
  feedLine,
  initialCraftUi,
  parseSeedInput,
  screenFor,
  type CraftEvent,
  type CraftUi,
} from './index.ts';

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
/** An afternoon with honey drops (and Fine) in stock, so there are customers to serve. */
const afternoon = (seed = 1, unlocks: string[] = ['oven']) => run(newGame(c, { seed, unlocks }), craft(), craft(), end);

describe('text helpers', () => {
  it('describeFail translates ids, lower-cases names mid-sentence and follows the language', () => {
    expect(describeFail(en, 'not-enough-ingredient', { ingredient: 'honey', need: '3', have: '2' })).toBe('Not enough honey: this batch needs 3, you have 2.');
    expect(describeFail(fr, 'not-enough-ingredient', { ingredient: 'honey', need: '3', have: '2' })).toBe('Pas assez de miel : il en faut 3, vous en avez 2.');
    expect(describeFail(en, 'node-locked', { node: 'oven' })).toBe('Requires oven first.');
  });
});

describe('header, screens', () => {
  it('shows the day line and a button that ends the phase, whatever the phase', () => {
    const s = newGame(c, { seed: 1 });
    const h = buildHeaderView(c, s, en);
    expect(h.title).toBe('Cult of Sweet Tooth');
    expect(h.day).toBe('Day 1');
    expect(h.phase).toBe('Morning');
    expect(h.endPhase).toEqual({ label: 'Open the shop', action: { type: 'endPhase' } });
    expect(buildHeaderView(c, run(s, end), en).endPhase.label).toBe('Close the shop');
    expect(buildHeaderView(c, run(s, end, end), en).endPhase.label).toBe('Go to sleep');
    expect(h.languages.map((l) => l.value)).toEqual(['en', 'fr']);
    expect(buildHeaderView(c, s, fr).title).toBe('Culte de Bec Sucré');
  });
  it('maps each phase to its main screen', () => {
    expect([screenFor('morning'), screenFor('afternoon'), screenFor('evening')]).toEqual(['craft', 'serve', 'evening']);
  });
});

describe('board', () => {
  it('lists stock and contracts with ready-made actions', () => {
    const s = run(newGame(c, { seed: 1, unlocks: ['contractBoard'] }), craft());
    s.contracts.push({ id: 900, candy: 'honey-drop', quality: 'plain', qty: 3, deadlineDay: 4, reward: 20 });
    const b = buildBoardView(c, s, en);
    expect(b.stock).toEqual([
      { key: 'honey-drop:plain', count: 4, candy: 'Honey drop', quality: 'Plain', text: '4 × Honey drop (Plain)' },
    ]);
    const mine = b.contracts.find((x) => x.id === 900)!; // the engine may have posted one of its own too
    expect(mine.text).toContain('3 × Honey drop (Plain) by day 4, 20 coins');
    expect(mine.deliver.action).toEqual({ type: 'fulfill', contract: 900 });
    expect(b.errands).toBeNull(); // board not bought
  });
});

describe('serve view', () => {
  it('offers one button per stocked quality that satisfies the customer, with the price they will pay', () => {
    let s = run(newGame(c, { seed: 1, unlocks: ['oven'] }), craft('fine'), end);
    const v = buildServeView(c, s, en);
    const faithful = v.customers.find((x) => x.type === 'faithful')!;
    expect(faithful.options.map((o) => o.label)).toEqual(['Serve Fine · 6']); // Fine sold to a budget-6 customer
    expect(faithful.options[0]!.enabled).toBe(true);
    expect(faithful.options[0]!.action).toEqual({ type: 'serve', customer: faithful.id, quality: 'fine' });
    expect(faithful.refuse.action).toEqual({ type: 'refuse', customer: faithful.id });
    expect(faithful.details).toBe('At least Plain · Budget: 6 · Patience: 6');
    // every offered action is accepted by the engine
    for (const o of faithful.options) expect(step(c, s, o.action).ok).toBe(true);
    s = run(s, faithful.refuse.action);
  });
  it('says when nothing in stock fits, and warns before closing with people waiting', () => {
    const s = run(newGame(c, { seed: 1 }), end); // no stock
    const v = buildServeView(c, s, en);
    expect(v.customers.length).toBeGreaterThan(0);
    expect(v.customers.every((x) => x.options.length === 0 && x.nothingFits)).toBe(true);
    expect(v.closeWarning).toMatch(/will leave if you close now/);
    expect(v.summary).toMatch(/^At the counter: \d+ \/ 4 · Today: 0 served/);
  });
  it('shows the clerk panel with switches and training once the clerk is unlocked', () => {
    const s0 = afternoon(1, ['clerk']);
    const w = buildServeView(c, s0, en).workers[0]!;
    expect(w.name).toBe('Clerk');
    expect(w.art).toBe('worker-clerk');
    expect(w.toggles[0]).toMatchObject({ customerType: 'faithful', on: false, setOn: { type: 'delegate', customerType: 'faithful', on: true } });
    expect(w.training.find((x) => x.candy === 'honey-drop')!.text).toBe('Knows how to sell Honey drop.');
    expect(buildServeView(c, run(newGame(c, { seed: 1, unlocks: ['clerk'] }), end), en).workers[0]!.training[0]!.text).toBe(
      'Trained on Honey drop: 0 / 2 batches made by hand',
    );
    expect(buildServeView(c, newGame(c, { seed: 1 }), en).workers).toEqual([]);
  });
  it('builds feed lines from events', () => {
    expect(feedLine(en, { type: 'sold', customer: 1, customerType: 'faithful', candy: 'honey-drop', quality: 'plain', price: 5, auto: true })).toBe(
      'The clerk sold Honey drop (Plain) to Faithful for 5.',
    );
    expect(feedLine(fr, { type: 'refused', customer: 1, customerType: 'merchant' })).toBe('Vous avez refusé Marchand.');
    const v = buildServeView(c, afternoon(), en, [{ type: 'left', customer: 2, customerType: 'traveler' }]);
    expect(v.feed).toEqual({ title: 'Latest', lines: ['Traveler left, tired of waiting.'] });
  });
});

describe('evening view', () => {
  const evening = (money: number, unlocks: string[] = []) => {
    const s = run(newGame(c, { seed: 1, unlocks }), end, end);
    s.money = money;
    return s;
  };
  it('groups the tree by branch and says why something cannot be bought', () => {
    const v = buildEveningView(c, evening(0), en);
    expect(v.tree.branches.map((b) => b.id)).toEqual(['kitchen', 'shop', 'temple']);
    const oven = v.tree.branches[0]!.nodes.find((n) => n.id === 'oven')!;
    expect(oven.buy).toMatchObject({ enabled: false, why: 'Not enough coins.', cost: 60 });
    const garden = v.tree.branches[0]!.nodes.find((n) => n.id === 'dark-garden')!;
    expect(garden.buy!.why).toBe('Requires oven first.');
  });
  it('enabled purchases carry their action; owned and maxed nodes say so', () => {
    let s = evening(1000);
    const oven = buildEveningView(c, s, en).tree.branches[0]!.nodes.find((n) => n.id === 'oven')!;
    expect(oven.buy).toMatchObject({ enabled: true, action: { type: 'buy', node: 'oven' }, label: 'Buy · 60' });
    s = run(s, oven.buy!.action);
    const after = buildEveningView(c, s, en).tree.branches[0]!.nodes.find((n) => n.id === 'oven')!;
    expect(after).toMatchObject({ owned: true, maxed: true, buy: null, level: 'Owned' });
    const honey = buildEveningView(c, s, en).tree.branches[0]!.nodes.find((n) => n.id === 'honey-yield')!;
    expect(honey.level).toBe('Level 0 / 4');
  });
  it('report, journal and the title with the coins', () => {
    const v = buildEveningView(c, evening(12), en);
    expect(v.report.lines).toHaveLength(5);
    expect(v.journal?.text).toBeTruthy();
    expect(v.tree.title).toBe('Skill tree · 12 coins');
  });
  it('map and errands appear only once their upgrades are bought', () => {
    expect(buildMapView(c, evening(0), en)).toBeNull();
    const m = buildMapView(c, evening(0, ['map']), en)!;
    expect(m.art).toBe('map-strip');
    expect(m.places[0]!.text).toBe('Millpond');
    expect(m.places[1]!.text).toBe('🔒 Unknown place'); // stage 2 place, still stage 1
  });
});

describe('stage view', () => {
  const stage2 = (unlocks: string[] = [], day = 1) => {
    const s = newGame(c, { seed: 1, unlocks });
    s.stage.index = 1;
    s.stage.day = day - 1;
    return s;
  };
  it('shows progress and a heads-up before the rival starts', () => {
    const v = buildStageView(c, stage2(), en);
    expect(v.progress).toBe('Gathering pilgrims: day 1 / 7 · 0 / 800 coins earned');
    expect(v.pct).toBe(0);
    expect(v.warning).toBe('A rival hive will start stealing 1 honey each morning from day 3 of the week.');
    expect(v.hints).toEqual(['Errands can stop this: buy the Errands board (Temple branch).']);
  });
  it('names the errand that solves it and tracks its state', () => {
    expect(buildStageView(c, stage2(['errandsBoard']), en).hints).toEqual([
      'The errand "A splinter hive" can reduce it once you have: Hire a clerk.',
    ]);
    expect(buildStageView(c, stage2(['errandsBoard', 'clerk']), en).hints[0]).toBe('The errand "A splinter hive" can reduce it: take it on the Errands board.');
    const active = stage2(['errandsBoard', 'clerk']);
    active.errands['rival-hive'] = { status: 'active', daysLeft: 2 };
    expect(buildStageView(c, active, en).hints).toEqual(['The errand "A splinter hive" is under way.']);
    const done = stage2(['errandsBoard', 'clerk']);
    done.errands['rival-hive'] = { status: 'done' };
    expect(buildStageView(c, done, en)).toMatchObject({ warning: null, hints: [] });
  });
  it('announces the rival a week ahead and reports the stolen amount once it starts', () => {
    const late = newGame(c, { seed: 1 });
    late.stage.day = 5;
    expect(buildStageView(c, late, en).warning).toBe('Next week a rival hive will start stealing honey. Errands can stop it: prepare now.');
    const stealing = run(stage2(['errandsBoard'], 3), end, end, end);
    expect(buildStageView(c, stealing, en).warning).toBe('A rival hive steals 1 honey each morning.');
  });
  it('reports last week and the completed game (generic text when no ending pack is present)', () => {
    const s = newGame(c, { seed: 1 });
    s.lastWeek = { stage: 0, passed: false, revenue: 100, target: 240 };
    expect(buildStageView(c, s, en).lastWeek!.text).toMatch(/Target missed last week \(100 \/ 240\)/);
    s.completed = true;
    expect(buildStageView(c, s, en).complete).toBe('The final stage is complete. The shop runs on; the cult is pleased.');
    // with an ending pack the text from the pack is used
    const withEnding = { ...c, strings: { ...c.strings, en: { ...c.strings.en, 'ending.text': 'THE END' } } };
    expect(buildStageView(withEnding, s, en).complete).toBe('THE END');
  });
});

describe('errands view', () => {
  it('is null without the board, then lists each errand by status with ready actions', () => {
    const s = newGame(c, { seed: 1 });
    expect(buildErrandsView(c, s, en)).toBeNull();
    s.unlocks.push('errandsBoard');
    let v = buildErrandsView(c, s, en)!;
    const queen = v.items.find((i) => i.id === 'queen-fever')!;
    expect(queen).toMatchObject({ status: 'available', button: { label: 'Accept', enabled: true, action: { type: 'acceptErrand', errand: 'queen-fever' } } });
    expect(queen.requirements).toEqual(['4 × Royal tonic (Plain)']);
    expect(v.items.find((i) => i.id === 'rival-hive')).toMatchObject({ status: 'locked', tag: 'Against the rival hive', button: null });
    expect(v.items.find((i) => i.id === 'rival-hive')!.statusText).toBe('Requires Hire a clerk first.');
    const taken = run(s, { type: 'acceptErrand', errand: 'queen-fever' });
    v = buildErrandsView(c, taken, en)!;
    expect(v.items.find((i) => i.id === 'queen-fever')).toMatchObject({ status: 'deliver', button: { label: 'Deliver', enabled: false } });
    const made = run(taken, { type: 'craft', station: 0, candy: 'royal-tonic', quality: 'plain' });
    expect(buildErrandsView(c, made, en)!.items.find((i) => i.id === 'queen-fever')!.button!.enabled).toBe(true);
  });
});

describe('craft view and reducer', () => {
  /** Feed events through the reducer the way a UI would, dispatching crafts into `game`. */
  function play(game: { s: State }, ui: CraftUi, ...events: CraftEvent[]) {
    const dispatch = (a: Action) => {
      const r = step(c, game.s, a);
      if (r.ok) game.s = r.state;
      return r.ok;
    };
    for (const ev of events) ui = craftReduce(c, game.s, ui, ev, dispatch);
    return ui;
  }

  it('starts with a form: recipes, qualities, supplies; a locked quality blocks Start with a reason', () => {
    const game = { s: newGame(c, { seed: 1 }) };
    let ui = initialCraftUi(c);
    const idle = buildCraftView(c, game.s, ui, en).idle!;
    expect(idle.candies.map((x) => x.value)).toEqual(['honey-drop']);
    expect(idle.qualities.map((x) => x.value)).toEqual(['plain']);
    expect(idle.start.enabled).toBe(true);
    expect(idle.supplies).toEqual(['Honey: 4', 'Dark sunflower seed: 2']);
    expect(idle.batchesLeft).toBe('Batches left today: 3');
    ui = play(game, ui, { type: 'select', field: 'quality', value: 'fine' });
    const blocked = buildCraftView(c, game.s, ui, en).idle!;
    expect(blocked.start.enabled).toBe(false);
    expect(blocked.blocked).toBe('Cannot start: fine quality is not unlocked yet.');
    expect(play(game, ui, { type: 'start' }).session).toBeNull(); // start is a no-op when blocked
  });

  it('recipe costs follow the chosen quality, and the shelf pips keep the morning total after a bonus is bought', () => {
    const game = { s: newGame(c, { seed: 1, unlocks: ['oven'] }) };
    let ui = initialCraftUi(c);
    expect(buildCraftView(c, game.s, ui, en).idle!.recipes[0]!.costText).toBe('2 Honey');
    ui = play(game, ui, { type: 'select', field: 'quality', value: 'fine' });
    expect(buildCraftView(c, game.s, ui, en).idle!.recipes[0]!.costText).toBe('3 Honey');
    const total = () => buildCraftView(c, game.s, ui, en).scene.shelf.find((x) => x.ingredient === 'honey')!.total;
    const before = total();
    game.s = { ...game.s, nodes: { ...game.s.nodes, 'honey-yield': 1 } };
    expect(total()).toBe(before);
  });

  it('a full batch: start, pick, place, place, stir, shape crafts through the engine', () => {
    const game = { s: newGame(c, { seed: 1 }) };
    let ui = play(game, initialCraftUi(c), { type: 'start' });
    let v = buildCraftView(c, game.s, ui, en);
    expect(v.mode).toBe('bench');
    expect(v.bench!.hint).toBe('Tap an ingredient on the shelf to pick it up.');
    expect(v.bench!.steps.map((s) => s.id)).toEqual(['stir', 'form']);
    ui = play(game, ui, { type: 'tapShelf', ingredient: 'honey' });
    v = buildCraftView(c, game.s, ui, en);
    expect(v.bench!.stationArmed).toBe(true);
    expect(v.bench!.hint).toBe('Now tap the Cauldron to put it in.');
    ui = play(game, ui, { type: 'tapStation' }, { type: 'tapStation' });
    v = buildCraftView(c, game.s, ui, en);
    expect(v.bench!.contents).toEqual([{ ingredient: 'honey', placed: 2, need: 2, text: 'Honey: 2 / 2' }]);
    expect(v.bench!.hint).toBe('Next: Stir');
    expect(v.bench!.steps.map((s) => s.enabled)).toEqual([true, false]);
    // out-of-order step is ignored
    expect(play(game, ui, { type: 'step', id: 'form' }).session!.done).toBe(0);
    ui = play(game, ui, { type: 'step', id: 'stir' }, { type: 'step', id: 'form' });
    expect(ui.session).toBeNull();
    expect(game.s.stock['honey-drop:plain']).toBe(4);
    expect(game.s.supply.honey).toBe(2);
    expect(buildCraftView(c, game.s, ui, en).made).toBe('Made 4 × Honey drop (Plain).');
    expect(buildCraftView(c, game.s, ui, fr).made).toBe('4 × Goutte de miel (Simple) préparés.'); // follows the language
  });

  it('cancel drops the batch; the idle view says when no batches remain', () => {
    const game = { s: newGame(c, { seed: 1 }) };
    let ui = play(game, initialCraftUi(c), { type: 'start' }, { type: 'cancel' });
    expect(ui.session).toBeNull();
    game.s.stations[0]!.batchesLeft = 0;
    const v = buildCraftView(c, game.s, ui, en);
    expect(v).toMatchObject({ mode: 'idle', noBatches: 'Nothing more to craft today.', idle: null });
  });

  it('hides automated stations and offers a station choice only with several hand stations', () => {
    const s = newGame(c, { seed: 1 });
    s.stations.push({ type: 'auto-cauldron', batchesLeft: 2 });
    expect(buildCraftView(c, s, initialCraftUi(c), en).idle!.stations).toEqual([]);
    s.stations.push({ type: 'cauldron', batchesLeft: 3 });
    expect(buildCraftView(c, s, initialCraftUi(c), en).idle!.stations.map((x) => x.label)).toEqual(['Cauldron #1', 'Cauldron #3']);
  });
});

describe('menu', () => {
  it('describes the settings page and whether progress is saved', () => {
    expect(buildMenuView(c, en, true).save.note).toBe('Your game saves automatically in this browser.');
    expect(buildMenuView(c, en, false).save.note).toBe('Dev mode (URL parameters): progress is not saved.');
    const v = buildMenuView(c, fr, true);
    expect(v.title).toBe('Réglages');
    expect(v.newGame.button).toBe('Nouvelle partie');
    expect(v.language).toBe('fr');
  });
  it('seed field: empty means random, digits mean a seed, anything else is refused', () => {
    expect(parseSeedInput('')).toEqual({ ok: true, seed: undefined });
    expect(parseSeedInput('  ')).toEqual({ ok: true, seed: undefined });
    expect(parseSeedInput(' 42 ')).toEqual({ ok: true, seed: 42 });
    expect(parseSeedInput('0')).toEqual({ ok: true, seed: 0 });
    for (const bad of ['abc', '4.5', '-3', '12e3', '99999999999', '2147483648']) expect(parseSeedInput(bad).ok, bad).toBe(false);
  });
  it('import results are translated codes', () => {
    expect(describeImportResult(en, 'ok')).toEqual({ ok: true, text: 'Save loaded.' });
    expect(describeImportResult(fr, 'not-a-save')).toEqual({
      ok: false,
      text: "Impossible de charger cette sauvegarde : ce n'est pas une sauvegarde.",
    });
  });
});
