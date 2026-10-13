import type { Content } from '../content/schema.ts';
import type { State } from './types.ts';

/** For tests: mark the first `n` quests of the chain as done today (what reaching stage n + 1 used to mean). */
export function reachQuests(c: Content, s: State, n: number): State {
  for (const q of c.quests.slice(0, n)) s.quests[q.id] = s.day;
  return s;
}
