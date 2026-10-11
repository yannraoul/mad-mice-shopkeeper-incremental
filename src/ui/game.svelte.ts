import { content } from '../content/index.ts';
import { newGame, step } from '../engine/engine.ts';
import type { Action, FailCode, GameEvent, State } from '../engine/types.ts';

// The one place UI state meets the engine. Dev hooks: ?seed=12&unlocks=oven,dark-garden,contractBoard
// (until the skill tree exists in M4, this is how qualities and contracts are reached).
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || Math.floor(Math.random() * 2 ** 31);
const unlocks = (params.get('unlocks') ?? '').split(',').filter(Boolean);

// `$state.raw`: the engine state is immutable (every step returns a new one) and must stay a
// plain object, because the engine clones it with structuredClone, which rejects reactive proxies.
class Game {
  s = $state.raw<State>(newGame(content, { seed, unlocks }));
  events = $state.raw<GameEvent[]>([]);
  /** Sales/refusals/walk-outs of the current phase, newest first (capped). */
  feed = $state.raw<GameEvent[]>([]);
  /** Last refusal from the engine as a code + ids (translated at render time, so it follows the language). */
  error = $state.raw<{ code: FailCode; params: Record<string, string> } | null>(null);
}
export const game = new Game();

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
  return true;
}
