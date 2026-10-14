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
const game = (unlocks: string[] = []) => newGame(c, { seed: 1, unlocks: ['routine', ...HELPERS, ...unlocks] });

describe('the scene view', () => {
  it('shows a mouse only where a helper does the step', () => {
    expect(buildSceneView(c, newGame(c, { seed: 1 }), t)!.actors).toEqual([]);
    expect(buildSceneView(c, game(), t)!.actors.map((a) => a.id).sort()).toEqual(['porter', 'sculptor', 'stirrer']);
    expect(buildSceneView(c, game(['oven', 'auto-oven']), t)!.actors.map((a) => a.id)).toContain('baker');
  });
  it('carries what a front end needs to draw it', () => {
    const v = buildSceneView(c, game(), t)!;
    expect([v.width, v.height]).toEqual([256, 144]);
    const a = v.actors[0]!;
    expect(a.idle.frames).toBeGreaterThan(0);
    expect(a.work.file).toMatch(/^art\/sprites\//);
  });
});

describe('describeBeat', () => {
  const craft = (quality: string) => ({ type: 'craft' as const, station: 0, candy: c.candies[0]!.id, quality });
  it('has each helper mouse work in turn for a batch: fill, stir, shape', () => {
    expect(describeBeat(c, game(), craft('plain')).map((x) => x.actor)).toEqual(['porter', 'stirrer', 'sculptor']);
  });
  it('adds the oven mouse between stir and shape for a baked quality', () => {
    expect(describeBeat(c, game(['oven', 'auto-oven']), craft('fine')).map((x) => x.actor)).toEqual(['porter', 'stirrer', 'baker', 'sculptor']);
  });
  it('skips a step the player does by hand, and has no animation for other actions', () => {
    const s = { ...game(), handSteps: ['stir'] };
    expect(describeBeat(c, s, craft('plain')).map((x) => x.actor)).toEqual(['porter', 'sculptor']);
    expect(describeBeat(c, game(), { type: 'endPhase' })).toEqual([]);
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
