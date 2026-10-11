import type { Content } from '../content/schema.ts';
import { newGame, step } from '../engine/engine.ts';
import type { Action, FailCode, GameEvent, State } from '../engine/types.ts';
import { exportString, importString, type LoadErrorCode } from '../save/save.ts';

// The framework-free heart of the application: one object that owns the current game, the latest
// feedback and the persistence, and tells subscribers when something changed. A Svelte store, a
// canvas renderer or a test all use it the same way; none of them reimplements the rules.

/** Where games are kept between visits. Absent = throwaway game (developer hooks, tests). */
export interface Persistence {
  load(): State | null;
  save(state: State): void;
  clear(): void;
}

export interface StartOptions {
  seed?: number;
  unlocks?: string[];
  /** Start in stage N (1-based); a developer hook. */
  stage?: number;
  /** Starting coins; a developer hook. */
  money?: number;
  /** Start with the final stage cleared; a developer hook. */
  completed?: boolean;
}

export interface SessionOptions {
  content: Content;
  persistence?: Persistence;
  start?: StartOptions;
  /** Source of random seeds (defaults to Math.random). */
  random?: () => number;
}

export interface Refusal {
  code: FailCode;
  params: Record<string, string>;
}

export const FEED_SIZE = 6;

export class GameSession {
  state: State;
  /** Events produced by the last successful action. */
  events: GameEvent[] = [];
  /** Sales, refusals and walk-outs of the current phase, newest first (capped at FEED_SIZE). */
  feed: GameEvent[] = [];
  /** The engine's reason for the last refused action (a code the UI translates), or null. */
  error: Refusal | null = null;
  /** True when games are saved between visits. */
  readonly persistent: boolean;

  private readonly content: Content;
  private readonly persistence: Persistence | undefined;
  private readonly random: () => number;
  private readonly listeners = new Set<() => void>();

  constructor(opts: SessionOptions) {
    this.content = opts.content;
    this.persistence = opts.persistence;
    this.persistent = !!opts.persistence;
    this.random = opts.random ?? Math.random;
    this.state = (this.persistence?.load() ?? null) || this.fresh(opts.start ?? {});
  }

  private randomSeed(): number {
    return Math.floor(this.random() * 2 ** 31);
  }

  private fresh(o: StartOptions): State {
    const game = newGame(this.content, { seed: o.seed ?? this.randomSeed(), unlocks: o.unlocks });
    const stage = o.stage ?? 1;
    return {
      ...game,
      money: o.money ?? game.money,
      completed: o.completed ?? game.completed,
      stage: stage > 1 ? { ...game.stage, index: Math.min(stage, this.content.stages.length) - 1 } : game.stage,
    };
  }

  /** Call `fn` after every change; returns the function that stops listening. */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed() {
    this.persistence?.save(this.state);
    for (const fn of this.listeners) fn();
  }

  /** Apply an action; true on success, otherwise `error` says why it was refused. */
  dispatch(action: Action): boolean {
    const r = step(this.content, this.state, action);
    if (!r.ok) {
      this.error = { code: r.code, params: r.params };
      for (const fn of this.listeners) fn();
      return false;
    }
    const newPhase = r.state.phase !== this.state.phase;
    const news = r.events.filter((e) => e.type === 'sold' || e.type === 'refused' || e.type === 'left').reverse();
    this.feed = [...news, ...(newPhase ? [] : this.feed)].slice(0, FEED_SIZE);
    this.state = r.state;
    this.events = r.events;
    this.error = null;
    this.changed();
    return true;
  }

  private replace(state: State) {
    this.state = state;
    this.events = [];
    this.feed = [];
    this.error = null;
    this.changed();
  }

  /** Throw the current game away and start a new one (random seed unless one is given). */
  newGame(opts: { seed?: number } = {}) {
    this.persistence?.clear();
    this.replace(newGame(this.content, { seed: opts.seed ?? this.randomSeed() }));
  }

  /** Copy-paste backup of the current game. */
  exportSave(): string {
    return exportString(this.state);
  }

  /** Load an exported save; returns why it failed (a code the UI translates) or null on success. */
  importSave(text: string): LoadErrorCode | null {
    const r = importString(this.content, text);
    if (!r.ok) return r.code;
    this.replace(r.state);
    return null;
  }
}
