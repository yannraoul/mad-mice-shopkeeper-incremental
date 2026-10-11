import type { Phase } from './phases.ts';

export interface Customer {
  id: number;
  type: string;
  wants: string; // candy id
  minQuality: string; // quality id
  /** Remaining number of other customers' actions they will wait through. */
  patience: number;
  budget: number;
}

export interface Contract {
  id: number;
  candy: string;
  /** Minimum quality id; a higher quality also satisfies it. */
  quality: string;
  qty: number;
  /** Last day (inclusive) on which it can be fulfilled. */
  deadlineDay: number;
  reward: number;
}

export interface StationInstance {
  type: string;
  batchesLeft: number;
}

export interface DayReport {
  day: number;
  /** Stage index (0-based) the day was played in. */
  stage: number;
  forecast: string;
  crafted: number;
  arrivals: number;
  served: number;
  /** Part of `served` that was sold by a worker. */
  autoServed: number;
  refused: number;
  /** Customers who left impatient or were still waiting when the afternoon ended. */
  lost: number;
  contractsDone: number;
  contractsExpired: number;
  revenue: number;
}

export interface ErrandState {
  status: 'active' | 'done';
  /** Missions only: days until the worker is back. */
  daysLeft?: number;
}

export interface WeekResult {
  stage: number;
  passed: boolean;
  revenue: number;
  target: number;
}

export interface State {
  day: number;
  phase: Phase;
  /** PRNG state (see rng.ts); the whole game is deterministic given the seed. */
  rng: number;
  nextId: number;
  money: number;
  /** Current weekly stage: index into `stages`, days played this week, revenue earned this week. */
  stage: { index: number; day: number; revenue: number };
  /** Outcome of the most recent finished week (null before the first). */
  lastWeek: WeekResult | null;
  /** True once the final stage has been cleared (play can continue). */
  completed: boolean;
  /** Errands taken or finished, by errand id. */
  errands: Record<string, ErrandState>;
  /** Skill tree levels owned, by node id. */
  nodes: Record<string, number>;
  /** Tree unlock ids (e.g. "oven", "contractBoard"). */
  unlocks: string[];
  stations: StationInstance[];
  /** Ingredient stock for today; reset every morning. */
  supply: Record<string, number>;
  /** Candy stock keyed `candy:quality`; carries over between days. */
  stock: Record<string, number>;
  forecast: string;
  contracts: Contract[];
  /** Customers who have not yet reached the counter. */
  pending: Customer[];
  /** Customer types handed over to a worker (see `delegate`). */
  delegated: string[];
  /** Batches crafted by hand per candy id; workers can sell a recipe once enough exist. */
  batchesMade: Record<string, number>;
  /** Customers at the counter (bounded by settings.counterSpace). */
  queue: Customer[];
  report: DayReport;
  /** Reports of finished days. */
  history: DayReport[];
}

export type Action =
  | { type: 'craft'; station: number; candy: string; quality: string }
  | { type: 'fulfill'; contract: number }
  | { type: 'serve'; customer: number; quality: string }
  | { type: 'refuse'; customer: number }
  | { type: 'delegate'; customerType: string; on: boolean }
  | { type: 'buy'; node: string }
  | { type: 'acceptErrand'; errand: string }
  | { type: 'deliverErrand'; errand: string }
  | { type: 'endPhase' };

export type GameEvent =
  | { type: 'crafted'; candy: string; quality: string; qty: number }
  | { type: 'sold'; customer: number; customerType: string; candy: string; quality: string; price: number; auto: boolean }
  | { type: 'refused'; customer: number; customerType: string }
  | { type: 'left'; customer: number; customerType: string }
  | { type: 'delegated'; customerType: string; on: boolean }
  | { type: 'bought'; node: string; level: number }
  | { type: 'errandAccepted'; errand: string }
  | { type: 'errandDone'; errand: string }
  | ({ type: 'weekEnded' } & WeekResult)
  | { type: 'contractDone'; contract: number; reward: number }
  | { type: 'contractExpired'; contract: number }
  | { type: 'contractPosted'; contract: number }
  | { type: 'phase'; phase: Phase; day: number };

/** Machine-readable reason an action was refused; the UI translates `code` (+ `params`). */
export type FailCode =
  | 'wrong-phase'
  | 'no-station'
  | 'unknown-candy'
  | 'unknown-quality'
  | 'quality-locked'
  | 'no-batches'
  | 'not-enough-ingredient'
  | 'no-contract'
  | 'not-enough-stock'
  | 'no-customer'
  | 'quality-too-low'
  | 'not-in-stock'
  | 'over-budget'
  | 'cannot-delegate'
  | 'unknown-node'
  | 'node-maxed'
  | 'node-locked'
  | 'not-enough-money'
  | 'candy-locked'
  | 'station-automated'
  | 'unknown-errand'
  | 'errand-taken'
  | 'errand-unavailable'
  | 'errand-not-active';

export interface Fail {
  code: FailCode;
  /** Ids only (ingredient, quality, candy, phase), never display text. */
  params: Record<string, string>;
  /** English text for logs and tests; never shown to players. */
  message: string;
}

export type StepResult =
  | { ok: true; state: State; events: GameEvent[] }
  | { ok: false; error: string; code: FailCode; params: Fail['params'] };
