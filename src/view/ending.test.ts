import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { createTranslate } from '../i18n/core.ts';
import { endgameGame, newGame, step } from '../engine/engine.ts';
import { buildEndingView } from './ending.ts';

// The ending sequence is data from the view layer; its lines live in the optional ending pack.
const full = loadContent(readContentFiles(true));
const core = loadContent(readContentFiles(false));
const en = (c: typeof full) => createTranslate(c.strings, 'en');
const done = (c: typeof full) => ({ ...newGame(c, { seed: 1 }), completed: true });

describe('the ending view', () => {
  it('is not available before the campaign is completed', () => {
    const v = buildEndingView(full, newGame(full, { seed: 1 }), en(full));
    expect([v.available, v.due]).toEqual([false, false]);
  });
  it('is due once, when completed and not yet seen, with the lines of the pack and the workshop with every mouse', () => {
    const v = buildEndingView(full, done(full), en(full));
    expect([v.available, v.due]).toEqual([true, true]);
    expect(v.beats.length).toBeGreaterThanOrEqual(3);
    expect(v.title).not.toBe('');
    expect(v.scene!.actors.length).toBe(5);
    const seen = step(full, done(full), { type: 'ackEnding' });
    if (!seen.ok) throw new Error(seen.error);
    const again = buildEndingView(full, seen.state, en(full));
    expect([again.available, again.due]).toEqual([true, false]); // can be replayed, does not play by itself
  });
  it('is absent without the pack (the preview build): nothing to play, nothing to skip', () => {
    const v = buildEndingView(core, done(core), en(core));
    expect([v.available, v.due, v.beats]).toEqual([false, false, []]);
  });
  it('is not due in the developer end-game shop', () => {
    expect(endgameGame(full, { seed: 1 }).endingSeen).toBe(true);
  });
});
