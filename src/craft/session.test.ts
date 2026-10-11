import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from '../engine/engine.ts';
import { doStep, hold, isComplete, nextStep, place, placementDone, startSession, type CraftSession } from './session.ts';

const c = loadContent(readContentFiles(false));
const start = (quality: string, unlocks: string[] = ['oven', 'dark-garden']) => {
  const r = startSession(c, newGame(c, { seed: 1, unlocks }), 0, 'honey-drop', quality);
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('craft session', () => {
  it('needs the recipe ingredients and the quality steps in order', () => {
    expect(start('plain').need).toEqual({ honey: 2 });
    expect(start('plain').steps).toEqual(['stir', 'form']);
    expect(start('fine').steps).toEqual(['stir', 'oven', 'form']);
    expect(start('perfect').need).toEqual({ honey: 2, 'dark-seed': 1 });
  });
  it('refuses to start what the engine would refuse', () => {
    expect(startSession(c, newGame(c, { seed: 1 }), 0, 'honey-drop', 'fine')).toMatchObject({
      code: 'quality-locked',
      params: { quality: 'fine' },
    });
  });
  it('reports which ingredient is missing', () => {
    let s = newGame(c, { seed: 1 });
    s.supply.honey = 1;
    expect(startSession(c, s, 0, 'honey-drop', 'plain')).toMatchObject({
      code: 'not-enough-ingredient',
      params: { ingredient: 'honey' },
    });
  });
  it('places one unit per tap and keeps holding until the ingredient is complete', () => {
    let cs = hold(start('plain'), 'honey');
    expect(cs.held).toBe('honey');
    cs = place(cs);
    expect(cs.placed.honey).toBe(1);
    expect(cs.held).toBe('honey');
    cs = place(cs);
    expect(cs.placed.honey).toBe(2);
    expect(cs.held).toBeNull();
    expect(placementDone(cs)).toBe(true);
  });
  it('ignores placing with nothing held, and holding what is not needed', () => {
    const cs = start('plain');
    expect(place(cs)).toBe(cs);
    expect(hold(cs, 'dark-seed')).toBe(cs);
  });
  it('only allows steps in order and only after placement', () => {
    let cs: CraftSession = start('fine');
    expect(nextStep(cs)).toBeNull();
    expect(doStep(cs, 'stir')).toBe(cs);
    cs = place(hold(place(hold(cs, 'honey')), 'honey'));
    expect(nextStep(cs)).toBe('stir');
    expect(doStep(cs, 'oven')).toBe(cs);
    cs = doStep(cs, 'stir');
    expect(nextStep(cs)).toBe('oven');
    cs = doStep(doStep(cs, 'oven'), 'form');
    expect(isComplete(cs)).toBe(true);
  });
  it('a completed session maps onto the engine craft action', () => {
    const s0 = newGame(c, { seed: 1, unlocks: ['oven'] });
    const cs = start('fine');
    const r = step(c, s0, { type: 'craft', station: cs.station, candy: cs.candy, quality: cs.quality });
    expect(r.ok).toBe(true);
  });
});
