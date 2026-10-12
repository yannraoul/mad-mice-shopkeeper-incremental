import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import type { State } from '../engine/types.ts';
import { parseDevOptions } from './dev.ts';
import { GameSession, type Persistence } from './session.ts';

const c = loadContent(readContentFiles(false));

function memoryStore(initial: State | null = null) {
  const store = { saved: initial as State | null, saves: 0, clears: 0 };
  const persistence: Persistence = {
    load: () => store.saved,
    save: (s) => {
      store.saved = s;
      store.saves += 1;
    },
    clear: () => {
      store.saved = null;
      store.clears += 1;
    },
  };
  return { store, persistence };
}

describe('dev options', () => {
  it('reads seed, unlocks and stage, and is inactive without any hook', () => {
    expect(parseDevOptions('')).toMatchObject({ active: false, unlocks: [] });
    expect(parseDevOptions('?seed=7&unlocks=oven,clerk&stage=2')).toMatchObject({
      active: true,
      seed: 7,
      unlocks: ['oven', 'clerk'],
      stage: 2,
      completed: false,
    });
    expect(parseDevOptions('?stage=3').active).toBe(true);
    expect(parseDevOptions('?money=250&completed=1')).toMatchObject({ active: true, money: 250, completed: true });
    expect(parseDevOptions('?money=-5&completed=0')).toMatchObject({ money: undefined, completed: false });
  });
});

describe('game session', () => {
  it('starts a game from its options (seed, unlocks, stage hook)', () => {
    const s = new GameSession({ content: c, start: { seed: 5, unlocks: ['oven'], stage: 2 } });
    expect(s.state.unlocks).toEqual(['oven']);
    expect(s.state.stage.index).toBe(1);
    expect(s.persistent).toBe(false);
  });
  it('can start with coins and the final stage cleared (developer hooks)', () => {
    const s = new GameSession({ content: c, start: { seed: 1, money: 300, completed: true } });
    expect(s.state.money).toBe(300);
    expect(s.state.completed).toBe(true);
    expect(new GameSession({ content: c, start: { seed: 1 } }).state.money).toBe(0);
  });
  it('is deterministic for a seed', () => {
    const a = new GameSession({ content: c, start: { seed: 9 } });
    const b = new GameSession({ content: c, start: { seed: 9 } });
    expect(a.state).toEqual(b.state);
  });
  it('dispatch updates state, keeps the feed, records refusals and notifies subscribers', () => {
    const s = new GameSession({ content: c, start: { seed: 1 } });
    let calls = 0;
    const stop = s.subscribe(() => (calls += 1));
    expect(s.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' })).toBe(true);
    expect(s.state.stock['candy-cane:plain']).toBe(4);
    expect(s.dispatch({ type: 'serve', customer: 1, quality: 'plain' })).toBe(false);
    expect(s.error).toEqual({ code: 'wrong-phase', params: { phase: 'afternoon' } });
    expect(calls).toBe(2);
    stop();
    s.dispatch({ type: 'endPhase' });
    expect(calls).toBe(2); // unsubscribed
    expect(s.error).toBeNull(); // a success clears the refusal
  });
  it('the feed collects sales and restarts with each phase', () => {
    const s = new GameSession({ content: c, start: { seed: 3 } });
    s.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' });
    s.dispatch({ type: 'endPhase' });
    const cu = s.state.queue[0]!;
    s.dispatch({ type: 'serve', customer: cu.id, quality: 'plain' });
    expect(s.feed[0]).toMatchObject({ type: 'sold' });
    s.dispatch({ type: 'endPhase' });
    // a new phase starts a new feed: only what that transition itself produced (walk-outs) is in it
    expect(s.feed.every((e) => e.type === 'left')).toBe(true);
  });
  it('saves after every change when persistent, and loads the saved game on start', () => {
    const { store, persistence } = memoryStore();
    const a = new GameSession({ content: c, persistence, start: { seed: 2 } });
    a.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' });
    expect(store.saves).toBe(1);
    const b = new GameSession({ content: c, persistence, start: { seed: 99 } });
    expect(b.state).toEqual(a.state); // resumed, the start options are ignored
    expect(b.persistent).toBe(true);
  });
  it('a throwaway session (no persistence) never saves', () => {
    const s = new GameSession({ content: c, start: { seed: 2 } });
    expect(() => s.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' })).not.toThrow();
  });
  it('newGame clears the save and starts again, reproducibly with a seed', () => {
    const { store, persistence } = memoryStore();
    const s = new GameSession({ content: c, persistence, start: { seed: 2 } });
    s.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' });
    s.newGame({ seed: 42 });
    expect(store.clears).toBe(1);
    expect(s.state.day).toBe(1);
    expect(s.state.stock).toEqual({});
    const first = structuredClone(s.state);
    s.newGame({ seed: 42 });
    expect(s.state).toEqual(first);
    s.newGame(); // random seed
    expect(s.state.day).toBe(1);
  });
  it('export then import restores the same game; bad text is refused with a code', () => {
    const s = new GameSession({ content: c, start: { seed: 4 } });
    s.dispatch({ type: 'craft', station: 0, candy: 'candy-cane', quality: 'plain' });
    const text = s.exportSave();
    const before = structuredClone(s.state);
    s.newGame({ seed: 1 });
    expect(s.importSave(text)).toBeNull();
    expect(s.state).toEqual(before);
    expect(s.importSave('nonsense')).toBe('not-a-save');
    expect(s.state).toEqual(before); // untouched by a failed import
  });
});
