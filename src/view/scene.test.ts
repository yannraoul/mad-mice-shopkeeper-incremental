import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { createTranslate } from '../i18n/core.ts';
import { GameSession } from '../app/session.ts';
import { newGame } from '../engine/engine.ts';
import { buildSceneView, describeBeat } from './scene.ts';

// MMSIM-22: the animated workshop. The scene is data from the view layer; the routine is paced by what the scene plays.
const c = loadContent(readContentFiles(false));
const t = createTranslate(c.strings, 'en');
const HELPERS = ['auto-fill', 'auto-stir', 'auto-form'];
const working = (v: NonNullable<ReturnType<typeof buildSceneView>>) => v.actors.filter((a) => a.on).map((a) => a.id).sort();
const game = (unlocks: string[] = []) => newGame(c, { seed: 1, unlocks: ['routine', ...HELPERS, ...unlocks] });

describe('the scene view', () => {
  it('shows a mouse only where a helper does the step', () => {
    expect(buildSceneView(c, newGame(c, { seed: 1 }), t)!.actors).toEqual([]);
    expect(working(buildSceneView(c, game(), t)!)).toEqual(['porter', 'shaper', 'stirrer']);
    expect(working(buildSceneView(c, game(['oven', 'auto-oven', 'auto-pull']), t)!)).toEqual(['baker', 'porter', 'sculptor', 'shaper', 'stirrer']);
    expect(buildSceneView(c, newGame(c, { seed: 1 }), t)!.zones).toEqual([]);
  });
  it('carries what a front end needs to draw it', () => {
    const v = buildSceneView(c, game(), t)!;
    expect([v.width, v.height]).toEqual([256, 144]);
    const a = v.actors[0]!;
    expect(a.idle.frames).toBeGreaterThan(0);
    expect(a.work.file).toMatch(/^art\/sprites\//);
  });
});

describe('the zones', () => {
  it('exist only for hired helpers and carry the action that toggles the step', () => {
    const v = buildSceneView(c, game(), t)!;
    expect(v.zones.map((z) => z.step).sort()).toEqual(['fill', 'form', 'stir']);
    const stir = v.zones.find((z) => z.step === 'stir')!;
    expect(stir.on).toBe(true);
    expect(stir.action).toEqual({ type: 'setStepMode', step: 'stir', auto: false });
    const hand = buildSceneView(c, { ...game(), handSteps: ['stir'] }, t)!;
    expect(hand.zones.find((z) => z.step === 'stir')).toMatchObject({ on: false, action: { type: 'setStepMode', step: 'stir', auto: true }, actors: ['stirrer'] });
    expect(hand.actors.find((a) => a.id === 'stirrer')!.on).toBe(false);
  });
});

describe('describeBeat', () => {
  const craft = (quality: string) => ({ type: 'craft' as const, station: 0, candy: c.candies[0]!.id, quality });
  it('has each helper mouse work in turn for a batch: fill, stir, shape', () => {
    expect(describeBeat(c, game(), craft('plain')).map((x) => x.actor)).toEqual(['porter', 'stirrer', 'shaper']);
  });
  it('adds the oven mouse after stir for a baked quality, and the pulling mouse for a pulled one', () => {
    expect(describeBeat(c, game(['oven', 'auto-oven']), craft('fine')).map((x) => x.actor)).toEqual(['porter', 'stirrer', 'baker', 'shaper']);
    expect(describeBeat(c, game(['oven', 'auto-oven', 'auto-pull']), craft('excellent')).map((x) => x.actor)).toContain('sculptor');
  });
  it('skips a step the player does by hand, and has no animation for other actions', () => {
    const s = { ...game(), handSteps: ['stir'] };
    expect(describeBeat(c, s, craft('plain')).map((x) => x.actor)).toEqual(['porter', 'shaper']);
    expect(describeBeat(c, game(), { type: 'endPhase' })).toEqual([]);
  });
});

describe('the accounting mouse beats', () => {
  const evening = { ...game(['accountant']), phase: 'evening' as const, routineAccounting: true };
  it('has one beat for each upgrade bought and a minimum one for the end of the evening', () => {
    expect(describeBeat(c, evening, { type: 'buy', node: 'clerk' })).toEqual([{ actor: 'accountant', ms: c.settings.accountingStepMs }]);
    expect(describeBeat(c, evening, { type: 'endPhase' })).toEqual([{ actor: 'accountant', ms: c.settings.accountingMinMs }]);
    expect(describeBeat(c, { ...evening, routineAccounting: false }, { type: 'endPhase' })).toEqual([]);
  });
});

describe('peekRoutine', () => {
  it('names the next routine action without applying it', () => {
    const session = new GameSession({ content: c, start: { seed: 1, unlocks: ['routine', ...HELPERS] } });
    expect(session.peekRoutine()).toBeNull(); // the routine is off
    session.dispatch({ type: 'setRoutine', on: true });
    const before = session.state;
    const a = session.peekRoutine();
    expect(a).not.toBeNull();
    expect(session.state).toBe(before);
    expect(session.tickRoutine()).toBe('acted');
    expect(session.state).not.toBe(before);
  });
});
