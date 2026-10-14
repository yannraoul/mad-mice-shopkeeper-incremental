import { content } from '../content/index.ts';
import { parseDevOptions } from '../app/dev.ts';
import { GameSession, type Persistence } from '../app/session.ts';
import type { Action, GameEvent, State } from '../engine/types.ts';
import { describeBeat } from '../view/scene.ts';
import { clearSave, loadSaved, writeSave } from '../save/storage.ts';

// Svelte adapter around the framework-free `GameSession`: it mirrors the session's state into
// runes so components re-render, and passes every action straight through. No game logic here.
//
// Developer hooks (?seed=12&unlocks=oven,clerk&stage=2) start a throwaway game that never touches
// the real save.
const dev = parseDevOptions(location.search);

const browserSave: Persistence = {
  load: () => {
    const r = loadSaved(content);
    return r?.ok ? r.state : null;
  },
  save: writeSave,
  clear: clearSave,
};

export const session = new GameSession({
  content,
  persistence: dev.active ? undefined : browserSave,
  start: { seed: dev.seed, unlocks: dev.unlocks, stage: dev.stage, money: dev.money, completed: dev.completed },
});

// `$state.raw`: the engine state is immutable (every step returns a new one) and must stay a
// plain object, because the engine clones it with structuredClone, which rejects reactive proxies.
class Game {
  s = $state.raw<State>(session.state);
  events = $state.raw<GameEvent[]>([]);
  feed = $state.raw<GameEvent[]>([]);
  error = $state.raw(session.error);
  /** True for a throwaway developer-hook game (nothing is saved). */
  readonly devMode = !session.persistent;

  constructor() {
    session.subscribe(() => {
      this.s = session.state;
      this.events = session.events;
      this.feed = session.feed;
      this.error = session.error;
    });
  }
}
export const game = new Game();

export const dispatch = (a: Action): boolean => session.dispatch(a);
export const newGameNow = (seed?: number) => session.newGame({ seed });
export const exportSave = () => session.exportSave();
export const importSave = (text: string) => session.importSave(text);

/** The mice of the scene that are working right now (the scene reads this; nothing else does). */
class SceneClock {
  working = $state.raw<string[]>([]);
}
export const sceneClock = new SceneClock();

// The daily routine is paced by the scene: for an action that has an animation (a batch), the mice of each step work in
// turn and the action is applied when they are done, so the screen never shows a result before it is played. Actions
// without an animation (serving, ending a phase) keep the short fixed beat. Reduced motion skips the animation.
const BEAT_MS = 350;
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function beat() {
  const a = session.peekRoutine();
  const clips = a && !reducedMotion() ? describeBeat(content, session.state, a) : [];
  if (clips.length === 0) {
    session.tickRoutine();
    setTimeout(beat, BEAT_MS);
    return;
  }
  let i = 0;
  const play = () => {
    const clip = clips[i++];
    if (!clip) {
      sceneClock.working = [];
      session.tickRoutine();
      setTimeout(beat, BEAT_MS / 2);
      return;
    }
    sceneClock.working = [clip.actor];
    setTimeout(play, clip.ms);
  };
  play();
}
setTimeout(beat, BEAT_MS);
