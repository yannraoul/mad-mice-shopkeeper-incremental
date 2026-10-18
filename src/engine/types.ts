import type { Phase } from './phases.ts';

/** What one customer asked for today (see `WantKind` in the content schema). */
export type Want =
  | { kind: 'candy'; candy: string }
  | { kind: 'ingredient'; ingredient: string }
  | { kind: 'rich'; minIngredients: number };

export interface Customer {
  id: number;
  type: string;
  want: Want;
  minQuality: string; // quality id
  /** Remaining number of other customers' actions they will wait through. */
  patience: number;
  budget: number;
  /** Turns spent at the counter with nothing in stock that satisfies them (absent = 0); they leave after a few. */
  stuck?: number;
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
  /** How many quests were done when the day was played. */
  stage: number;
  forecast: string;
  crafted: number;
  arrivals: number;
  served: number;
  /** Tips earned (already part of `revenue`). */
  tips: number;
  /** Coins from unused ingredients sold at closing (already part of `revenue`). */
  surplus: number;
  /** Coins paid by the places on the map this morning (already part of `revenue`). */
  income: number;
  /** Part of `served` that was sold by a worker. */
  autoServed: number;
  refused: number;
  /** Customers who left impatient or were still waiting when the afternoon ended. */
  lost: number;
  /** Sum over the customers served of how happy they were (hearts out of 3): the day's satisfaction score is this over the customers who came. */
  happy: number;
  contractsDone: number;
  contractsExpired: number;
  /** What the automatic cauldrons made this morning, by `candy:quality`. */
  autoMade: Record<string, number>;
  revenue: number;
}

export interface ErrandState {
  status: 'active' | 'done';
  /** Missions only: days until the worker is back. */
  daysLeft?: number;
}

export interface State {
  day: number;
  phase: Phase;
  /** PRNG state (see rng.ts); the whole game is deterministic given the seed. */
  rng: number;
  nextId: number;
  money: number;
  /** Quests done, by quest id, with the day each was completed. */
  quests: Record<string, number>;
  /** Map places bought with coins (those with a cost). */
  places: string[];
  /** Coins earned on the days that are over (today's are in `report.revenue`): the `earn` goals count both. */
  revenueTotal: number;
  /** True once the final quest was delivered (play can continue). */
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
  /** What was delivered this morning (before any use); only for display, so the shelf pips do not move when a bonus is bought mid-day. */
  supplyToday: Record<string, number>;
  /** Candy stock keyed `candy:quality`; carries over between days. */
  stock: Record<string, number>;
  forecast: string;
  contracts: Contract[];
  /** Customers who have not yet reached the counter. */
  pending: Customer[];
  /** Customer types handed over to a worker (see `delegate`). */
  delegated: string[];
  /** Crafting steps the player does by hand although a helper could (the others are automated once unlocked). */
  handSteps: string[];
  /** The candy the Second cauldron makes with what the open orders leave (needs the order book); null = the station's default. */
  autoCandy: string | null;
  /** The daily routine is running: the mice make candy and serve the counter by themselves (needs the foreman mouse). */
  /** The foreman mouse runs the morning and the afternoon (cooking, then serving). */
  routine: boolean;
  /** The accounting mouse buys the upgrades in the evening. */
  routineAccounting: boolean;
  /** The shop goes to sleep by itself when the evening's work is done. */
  routineSleep: boolean;
  /** The shop's rating, 0 to 100 (50 at the start): happy customers raise it, those who leave unserved lower it; it moves prices a little. */
  rating: number;
  /** Batches crafted by hand per candy id; workers can sell a recipe once enough exist. */
  batchesMade: Record<string, number>;
  /** Customers at the counter (bounded by settings.counterSpace). */
  queue: Customer[];
  report: DayReport;
  /** Reports of finished days. */
  history: DayReport[];
}

export type RoutinePart = 'day' | 'accounting' | 'sleep';

export type Action =
  | { type: 'craft'; station: number; candy: string; quality: string }
  | { type: 'fulfill'; contract: number }
  | { type: 'serve'; customer: number; candy: string; quality: string }
  | { type: 'refuse'; customer: number }
  | { type: 'setStepMode'; step: string; auto: boolean }
  | { type: 'setAutoCandy'; candy: string }
  /** `part` picks which of the three routine switches: the foreman's day (default), the accounting mouse, or auto sleep. */
  | { type: 'setRoutine'; on: boolean; part?: RoutinePart }
  | { type: 'buyPlace'; place: string }
  | { type: 'delegate'; customerType: string; on: boolean }
  | { type: 'buy'; node: string }
  | { type: 'acceptErrand'; errand: string }
  | { type: 'deliverErrand'; errand: string }
  | { type: 'endPhase' };

export type GameEvent =
  | { type: 'crafted'; candy: string; quality: string; qty: number }
  | { type: 'sold'; customer: number; customerType: string; candy: string; quality: string; price: number; tip: number; hearts: number; auto: boolean }
  | { type: 'surplusSold'; coins: number }
  | { type: 'incomePaid'; coins: number }
  | { type: 'refused'; customer: number; customerType: string }
  | { type: 'left'; customer: number; customerType: string }
  | { type: 'delegated'; customerType: string; on: boolean }
  | { type: 'bought'; node: string; level: number }
  | { type: 'errandAccepted'; errand: string }
  | { type: 'errandDone'; errand: string }
  | { type: 'questDone'; quest: string; coins: number }
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
  | 'wrong-candy'
  | 'cannot-delegate'
  | 'unknown-node'
  | 'node-maxed'
  | 'node-locked'
  | 'unlock-needed'
  | 'quest-locked'
  | 'cannot-automate'
  | 'no-order-book'
  | 'no-routine'
  | 'no-accountant'
  | 'unknown-place'
  | 'place-owned'
  | 'routine-needs-helpers'
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
