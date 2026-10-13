import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame, step } from '../engine/engine.ts';
import { add, doStep, isComplete, nextStep, placementDone, startSession, type CraftSession } from './session.ts';

const c = loadContent(readContentFiles(false));
const start = (quality: string, unlocks: string[] = ['oven', 'pulling-machine', 'magic-cauldron', 'royal-jelly']) => {
  const s = newGame(c, { seed: 1, unlocks });
  s.supply.honey = 4;
  s.supply['royal-jelly'] = 1; // alternates arrive by chance: give one
  const r = startSession(c, s, 0, 'candy-cane', quality);
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('craft session', () => {
  it('needs the recipe ingredients and the quality steps in order', () => {
    expect(start('plain').need).toEqual({ honey: 1 });
    expect(start('plain').steps).toEqual(['stir', 'form']);
    expect(start('fine').steps).toEqual(['stir', 'oven', 'form']);
    expect(start('fine').need).toEqual({ honey: 2 }); // fine costs more than plain
    expect(start('excellent').steps).toEqual(['stir', 'oven', 'pull', 'form']);
    expect(start('excellent').need).toEqual({ honey: 3 });
    // Perfect: the plain quantities, every ingredient replaced by its alternate
    expect(start('perfect').need).toEqual({ 'royal-jelly': 1 });
    expect(start('perfect').steps).toEqual(['stir', 'magic', 'form']);
  });
  it('refuses to start what the engine would refuse', () => {
    expect(startSession(c, newGame(c, { seed: 1 }), 0, 'candy-cane', 'fine')).toMatchObject({
      code: 'quality-locked',
      params: { quality: 'fine' },
    });
  });
  it('reports which ingredient is missing', () => {
    let s = newGame(c, { seed: 1 });
    s.supply.honey = 0;
    expect(startSession(c, s, 0, 'candy-cane', 'plain')).toMatchObject({
      code: 'not-enough-ingredient',
      params: { ingredient: 'honey', need: '1', have: '0' },
    });
  });
  it('puts one unit in per tap, until the recipe has all it needs', () => {
    let cs = add(start('plain'), 'honey');
    expect(cs.placed.honey).toBe(1);
    expect(placementDone(cs)).toBe(true);
    expect(add(cs, 'honey')).toBe(cs); // plain needs one honey: nothing more goes in
    cs = add(start('fine'), 'honey');
    expect(cs.placed.honey).toBe(1);
    expect(placementDone(cs)).toBe(false); // fine needs two
    cs = add(cs, 'honey');
    expect(placementDone(cs)).toBe(true);
  });
  it('ignores an ingredient the recipe does not use', () => {
    const cs = start('plain');
    expect(add(cs, 'royal-jelly')).toBe(cs);
  });
  it('only allows steps in order and only after placement', () => {
    let cs: CraftSession = start('fine');
    expect(nextStep(cs)).toBeNull();
    expect(doStep(cs, 'stir')).toBe(cs);
    for (let i = 0; i < 2; i++) cs = add(cs, 'honey'); // fine needs 2 honey: 1 + 1 extra
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
