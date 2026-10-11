import { content } from '../content/index.ts';
import { newGame, step } from '../engine/engine.ts';
import type { Action, FailCode, GameEvent, State } from '../engine/types.ts';
import { exportString, importString, type LoadErrorCode } from '../save/save.ts';
import { clearSave, loadSaved, writeSave } from '../save/storage.ts';

// The one place UI state meets the engine and the save. Dev hooks: ?seed=12&unlocks=oven,clerk&stage=2
// start a throwaway game and never touch the real save.
const params = new URLSearchParams(location.search);
const devMode = params.has('seed') || params.has('unlocks') || params.has('stage');
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const seed = Number(params.get('seed')) || randomSeed();
const unlocks = (params.get('unlocks') ?? '').split(',').filter(Boolean);

function initialState(): State {
  if (!devMode) {
    const saved = loadSaved(content);
    if (saved?.ok) return saved.state;
  }
  const fresh = newGame(content, { seed, unlocks });
  const stage = Number(params.get('stage')) || 0; // dev hook: start in stage N (1-based)
  return stage > 1 ? { ...fresh, stage: { ...fresh.stage, index: Math.min(stage, content.stages.length) - 1 } } : fresh;
}

// `$state.raw`: the engine state is immutable (every step returns a new one) and must stay a
// plain object, because the engine clones it with structuredClone, which rejects reactive proxies.
class Game {
  s = $state.raw<State>(initialState());
  events = $state.raw<GameEvent[]>([]);
  /** Sales/refusals/walk-outs of the current phase, newest first (capped). */
  feed = $state.raw<GameEvent[]>([]);
  /** Last refusal from the engine as a code + ids (translated at render time, so it follows the language). */
  error = $state.raw<{ code: FailCode; params: Record<string, string> } | null>(null);
  readonly devMode = devMode;
}
export const game = new Game();

const persist = () => {
  if (!devMode) writeSave(game.s);
};

/** Apply an action; returns true on success, otherwise records the engine's reason. */
export function dispatch(a: Action): boolean {
  const r = step(content, game.s, a);
  if (!r.ok) {
    game.error = { code: r.code, params: r.params };
    return false;
  }
  const newPhase = r.state.phase !== game.s.phase;
  const news = r.events.filter((e) => e.type === 'sold' || e.type === 'refused' || e.type === 'left').reverse();
  game.feed = [...news, ...(newPhase ? [] : game.feed)].slice(0, 6);
  game.s = r.state;
  game.events = r.events;
  game.error = null;
  persist();
  return true;
}

function replace(state: State) {
  game.s = state;
  game.events = [];
  game.feed = [];
  game.error = null;
  persist();
}

export function newGameNow() {
  if (!devMode) clearSave();
  replace(newGame(content, { seed: randomSeed() }));
}

export const exportSave = () => exportString(game.s);

/** Load an exported save; returns why it failed (a code the UI translates) or null on success. */
export function importSave(text: string): LoadErrorCode | null {
  const r = importString(content, text);
  if (!r.ok) return r.code;
  replace(r.state);
  return null;
}
