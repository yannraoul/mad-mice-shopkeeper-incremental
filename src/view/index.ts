import type { Phase } from '../engine/phases.ts';

// The view layer: pure functions from game state to ready-to-render models. Nothing here knows
// about Svelte, the DOM or any rendering technology.
export * from './header.ts';
export * from './stage.ts';
export * from './board.ts';
export * from './errands.ts';
export * from './map.ts';
export * from './serve.ts';
export * from './craft.ts';
export * from './evening.ts';
export * from './menu.ts';
export { describeFail, unlockName, rivalErrands } from './text.ts';

/** Which main screen belongs to the current phase of the day. */
export type Screen = 'craft' | 'serve' | 'evening';
export const screenFor = (phase: Phase): Screen =>
  phase === 'morning' ? 'craft' : phase === 'afternoon' ? 'serve' : 'evening';
