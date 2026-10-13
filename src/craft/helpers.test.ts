import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from '../engine/engine.ts';
import { isStepAutomated } from '../engine/economy.ts';
import type { Action, State } from '../engine/types.ts';
import { buildCraftView, craftReduce, initialCraftUi, type CraftEvent, type CraftUi } from '../view/craft.ts';
import { add, fillAll, isComplete, nextStep, placementDone, startSession, type CraftSession } from './session.ts';

// MMSIM-15: filling all at once, steps done by helpers (mice and machines), the choice to do them by hand again,
// and "Make another batch".
const c = loadContent(readContentFiles(false));
const en = (key: string, p: Record<string, string | number> = {}) =>
  (c.strings.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => String(p[k]));
const t = Object.assign((k: string, p?: Record<string, string | number>) => en(k, p), { locale: 'en' as const });

const game = (unlocks: string[] = []) => {
  const g = { s: newGame(c, { seed: 1, unlocks: ['oven', 'pulling-machine', ...unlocks] }) };
  g.s.supply.honey = 6;
  return g;
};
const start = (s: State, quality = 'fine'): CraftSession => {
  const r = startSession(c, s, 0, 'candy-cane', quality);
  if ('error' in r) throw new Error(r.error);
  return r;
};
function play(g: { s: State }, ui: CraftUi, ...events: CraftEvent[]) {
  const dispatch = (a: Action) => {
    const r = step(c, g.s, a);
    if (r.ok) g.s = r.state;
    return r.ok;
  };
  for (const ev of events) ui = craftReduce(c, g.s, ui, ev, dispatch);
  return ui;
}

describe('fill all', () => {
  it('puts every unit of the recipe in at once, and one by one still works', () => {
    const cs = start(game().s);
    expect(placementDone(cs)).toBe(false);
    const full = fillAll(cs);
    expect(full.placed).toEqual(cs.need);
    expect(nextStep(full)).toBe('stir');
    expect(fillAll(full)).toBe(full); // nothing more to put in
    expect(placementDone(add(add(cs, 'honey'), 'honey'))).toBe(true);
  });
});

describe('helpers do the steps they are hired for', () => {
  it('a hired porter fills the cauldron when the batch starts', () => {
    const cs = start(game(['auto-fill']).s);
    expect(cs.auto).toContain('fill');
    expect(placementDone(cs)).toBe(true);
    expect(nextStep(cs)).toBe('stir');
  });
  it('automated steps are skipped and only the others are left to the player', () => {
    const cs = start(game(['auto-fill', 'auto-stir', 'auto-form']).s, 'fine'); // stir, bake, shape
    expect(cs.done).toBe(1); // stirring was done for the player
    expect(nextStep(cs)).toBe('oven');
    expect(isComplete(cs)).toBe(false);
  });
  it('with every step automated the batch is crafted the moment it starts', () => {
    const g = game(['auto-fill', 'auto-stir', 'auto-form']);
    const ui = play(g, initialCraftUi(c), { type: 'start' });
    expect(ui.session).toBeNull();
    expect(g.s.stock['candy-cane:plain']).toBe(4);
    expect(ui.note).toMatchObject({ candy: 'candy-cane', quality: 'plain' });
  });
  it('a fine batch still waits for the oven unless the oven timer is hired too', () => {
    const half = game(['auto-fill', 'auto-stir', 'auto-form']);
    const ui = play(half, { ...initialCraftUi(c), quality: 'fine' }, { type: 'start' });
    expect(ui.session).not.toBeNull();
    expect(nextStep(ui.session!)).toBe('oven');
    const all = game(['auto-fill', 'auto-stir', 'auto-form', 'auto-oven']);
    const done = play(all, { ...initialCraftUi(c), quality: 'fine' }, { type: 'start' });
    expect(done.session).toBeNull();
    expect(all.s.stock['candy-cane:fine']).toBe(4);
  });
  it('the whisper of a perfect batch always stays with the player', () => {
    expect(c.craftSteps.find((x) => x.id === 'magic')!.automatedBy).toBeUndefined();
  });
});

describe('taking a step back by hand', () => {
  it('is remembered, and only possible once the helper exists', () => {
    const g = game();
    const refused = step(c, g.s, { type: 'setStepMode', step: 'stir', auto: true });
    expect(refused.ok ? null : refused.code).toBe('cannot-automate');
    const g2 = game(['auto-stir']);
    expect(isStepAutomated(c, g2.s, 'stir')).toBe(true);
    play(g2, initialCraftUi(c), { type: 'setStepMode', step: 'stir', auto: false });
    expect(g2.s.handSteps).toEqual(['stir']);
    expect(isStepAutomated(c, g2.s, 'stir')).toBe(false);
    expect(start(g2.s).auto).not.toContain('stir');
    play(g2, initialCraftUi(c), { type: 'setStepMode', step: 'stir', auto: true });
    expect(g2.s.handSteps).toEqual([]);
  });
  it('the idle view lists the hired helpers with their state, and the buttons flip it', () => {
    const g = game(['auto-stir', 'auto-fill']);
    const idle = buildCraftView(c, g.s, initialCraftUi(c), t).idle!;
    expect(idle.helpers.map((h) => [h.step, h.on, h.label])).toEqual([
      ['fill', true, 'Porter mouse: helping'],
      ['stir', true, 'Stirrer mouse: helping'],
    ]);
    expect(idle.helpers[1]!.action).toEqual({ type: 'setStepMode', step: 'stir', auto: false });
    play(g, initialCraftUi(c), { type: 'setStepMode', step: 'stir', auto: false });
    expect(buildCraftView(c, g.s, initialCraftUi(c), t).idle!.helpers[1]).toMatchObject({ on: false, label: 'Stirrer mouse: by hand' });
    expect(buildCraftView(c, newGame(c, { seed: 1 }), initialCraftUi(c), t).idle!.helpers).toEqual([]); // nobody hired
  });
});

describe('make another batch', () => {
  it('after a batch the selection stays and the start button offers another one', () => {
    const g = game(['auto-fill', 'auto-stir', 'auto-form']);
    const first = buildCraftView(c, g.s, initialCraftUi(c), t).idle!;
    expect(first.start.label).toBe('Start batch');
    let ui = play(g, initialCraftUi(c), { type: 'select', field: 'candy', value: 'sunflower-brittle' }, { type: 'start' });
    expect(g.s.stock['sunflower-brittle:plain']).toBeUndefined(); // sunflower is not unlocked: nothing was made
    ui = play(g, { ...initialCraftUi(c), quality: 'plain' }, { type: 'start' });
    const again = buildCraftView(c, g.s, ui, t).idle!;
    expect(again.start.label).toBe('Make another batch');
    expect(ui.candy).toBe('candy-cane'); // same recipe still selected
    ui = play(g, ui, { type: 'start' });
    expect(g.s.stock['candy-cane:plain']).toBe(8);
    expect(g.s.stations[0]!.batchesLeft).toBe(1);
  });
});
