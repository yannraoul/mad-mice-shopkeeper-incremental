import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { GameSession } from '../app/session.ts';
import { newGame, step } from './engine.ts';
import { nextRoutineAction, routineQualities } from './routine.ts';
import type { Action, State } from './types.ts';

// MMSIM-18: the daily routine (foreman mouse) plays the morning and the afternoon with the helpers the player has hired.
const c = loadContent(readContentFiles(false));
const HELPERS = ['auto-fill', 'auto-stir', 'auto-form'];
const run = (s: State, ...actions: Action[]) => {
  for (const a of actions) {
    const r = step(c, s, a);
    if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
    s = r.state;
  }
  return s;
};
const game = (unlocks: string[] = []) => ({ ...newGame(c, { seed: 1, unlocks: ['routine', ...HELPERS, ...unlocks] }), routine: true });

describe('switching the routine on', () => {
  it('needs the foreman mouse and a helper for every basic step', () => {
    const none = step(c, newGame(c, { seed: 1 }), { type: 'setRoutine', on: true });
    expect(none.ok ? null : none.code).toBe('no-routine');
    const partial = step(c, newGame(c, { seed: 1, unlocks: ['routine', 'auto-fill'] }), { type: 'setRoutine', on: true });
    expect(partial.ok ? null : partial.code).toBe('routine-needs-helpers');
    expect(run(game(), { type: 'setRoutine', on: true }).routine).toBe(true);
  });
  it('puts back to work a helper the player took back, as long as every helper is hired', () => {
    const hand = run(newGame(c, { seed: 1, unlocks: ['routine', ...HELPERS] }), { type: 'setStepMode', step: 'stir', auto: false }, { type: 'setStepMode', step: 'fill', auto: false });
    expect(hand.handSteps.sort()).toEqual(['fill', 'stir']);
    const on = run(hand, { type: 'setRoutine', on: true });
    expect(on.routine).toBe(true);
    expect(on.handSteps).toEqual([]);
  });
});

describe('what the routine makes', () => {
  it('only qualities whose every step has a helper, and never Perfect', () => {
    expect(routineQualities(c, game()).map((q) => q.id)).toEqual(['plain']);
    const withOven = game(['oven']); // Fine needs the oven helper too
    expect(routineQualities(c, withOven).map((q) => q.id)).toEqual(['plain']);
    expect(routineQualities(c, game(['oven', 'auto-oven'])).map((q) => q.id)).toEqual(['fine', 'plain']);
    expect(routineQualities(c, game(['oven', 'auto-oven', 'magic-cauldron'])).every((q) => q.id !== 'perfect')).toBe(true);
  });
  it('starts with what is asked, at the cheapest quality that qualifies', () => {
    const s = run(game(['oven', 'auto-oven']), { type: 'endPhase' }, { type: 'endPhase' }, { type: 'endPhase' });
    s.contracts = [{ id: 9, candy: 'sunflower-brittle', quality: 'fine', qty: 4, deadlineDay: 9, reward: 50 }];
    s.unlocks.push('sunflower');
    s.supply['sunflower-seed'] = 4;
    expect(nextRoutineAction(c, s)).toMatchObject({ type: 'craft', candy: 'sunflower-brittle', quality: 'fine' });
  });
  it('stops making a candy once enough of it is in stock', () => {
    const s = run(game(), { type: 'endPhase' }, { type: 'endPhase' }, { type: 'endPhase' });
    s.stock['candy-cane:plain'] = c.settings.routineStock;
    expect(nextRoutineAction(c, s)).toEqual({ type: 'endPhase' });
  });
});

describe('a whole day on routine', () => {
  it('makes candy, serves the counter, and waits for the player in the evening', () => {
    const session = new GameSession({ content: c, start: { seed: 4, unlocks: ['routine', ...HELPERS] } });
    session.dispatch({ type: 'setRoutine', on: true });
    let beats = 0;
    while (session.state.phase !== 'evening' && beats++ < 500) expect(session.tickRoutine()).toBe('acted');
    expect(session.state.phase).toBe('evening');
    expect(session.state.report.crafted).toBeGreaterThan(0);
    expect(session.state.report.served).toBeGreaterThan(0);
    expect(session.tickRoutine()).toBe('waiting'); // upgrades are the player's
    session.dispatch({ type: 'endPhase' });
    expect(session.state.phase).toBe('morning');
    expect(session.tickRoutine()).toBe('acted'); // and the next morning goes on by itself
  });
  it('switches itself off when a helper is taken back', () => {
    const session = new GameSession({ content: c, start: { seed: 4, unlocks: ['routine', ...HELPERS] } });
    session.dispatch({ type: 'setRoutine', on: true });
    session.dispatch({ type: 'setStepMode', step: 'stir', auto: false });
    expect(session.tickRoutine()).toBe('stopped');
    expect(session.state.routine).toBe(false);
    expect(session.tickRoutine()).toBe('off');
  });
});

describe('the accounting mouse and auto sleep', () => {
  // The evening of a game with the foreman, the accounting mouse and, as asked, accounting and auto sleep switched on.
  const evening = (money: number, flags: { routineAccounting?: boolean; routineSleep?: boolean }, unlocks: string[] = ['accountant']) => {
    const s = run(game(unlocks), { type: 'endPhase' }, { type: 'endPhase' });
    return { ...s, money, ...flags };
  };
  it('leaves the evening to the player with both switches off', () => {
    expect(nextRoutineAction(c, evening(5000, {}))).toBeNull();
  });
  it('buys the cheapest affordable upgrade while accounting is on', () => {
    const s = evening(40, { routineAccounting: true });
    const a = nextRoutineAction(c, s);
    expect(a).toMatchObject({ type: 'buy' });
    const node = c.skillNodes.find((n) => n.id === (a as { node: string }).node)!;
    expect(node.costs[s.nodes[node.id] ?? 0]).toBeLessThanOrEqual(40);
  });
  it('waits for the player when nothing is affordable unless auto sleep is on, then ends the day', () => {
    expect(nextRoutineAction(c, evening(0, { routineAccounting: true }))).toBeNull();
    expect(nextRoutineAction(c, evening(0, { routineAccounting: true, routineSleep: true }))).toEqual({ type: 'endPhase' });
    expect(nextRoutineAction(c, evening(5000, { routineSleep: true }))).toEqual({ type: 'endPhase' });
  });
  it('spends until nothing is left and sleeps, a whole evening in routine', () => {
    let s = evening(300, { routineAccounting: true, routineSleep: true });
    for (let i = 0; i < 50 && s.phase === 'evening'; i++) {
      const a = nextRoutineAction(c, s);
      if (!a) break;
      const r = step(c, s, a);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.phase).toBe('morning');
    expect(Object.keys(s.nodes).length).toBeGreaterThan(0);
  });
  it('is switched on and off one part at a time, each with its own hire', () => {
    const none = step(c, game(), { type: 'setRoutine', on: true, part: 'accounting' });
    expect(none.ok ? null : none.code).toBe('no-accountant');
    expect(run(game(['accountant']), { type: 'setRoutine', on: true, part: 'accounting' }).routineAccounting).toBe(true);
    const noForeman = step(c, newGame(c, { seed: 1 }), { type: 'setRoutine', on: true, part: 'sleep' });
    expect(noForeman.ok ? null : noForeman.code).toBe('no-routine');
    expect(run(game(), { type: 'setRoutine', on: true, part: 'sleep' }).routineSleep).toBe(true);
  });
  it('is played by the session without the foreman: the day stays with the player', () => {
    const session = new GameSession({ content: c, start: { seed: 4, unlocks: ['routine', 'accountant', ...HELPERS] } });
    session.dispatch({ type: 'setRoutine', on: true, part: 'accounting' });
    session.dispatch({ type: 'setRoutine', on: true, part: 'sleep' });
    expect(session.peekRoutine()).toBeNull(); // morning: the foreman is off
    session.dispatch({ type: 'endPhase' });
    session.dispatch({ type: 'endPhase' });
    expect(session.state.phase).toBe('evening');
    expect(session.peekRoutine()).toEqual({ type: 'endPhase' }); // nothing to buy with no coins: it sleeps
  });
});
