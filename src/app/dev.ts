/** Developer hooks from the URL query string, e.g. `?seed=12&unlocks=oven,clerk&stage=2&money=300&completed=1`. */
export interface DevOptions {
  /** True when any hook is present: the game is then a throwaway that never touches the real save. */
  active: boolean;
  seed?: number;
  unlocks: string[];
  /** Start in stage N (1-based). */
  stage?: number;
  /** Starting coins (to see the evening screen with affordable upgrades). */
  money?: number;
  /** Start with the final stage already cleared (to see the ending state). */
  completed?: boolean;
}

export function parseDevOptions(search: string): DevOptions {
  const p = new URLSearchParams(search);
  const seed = Number(p.get('seed')) || undefined;
  const stage = Number(p.get('stage')) || undefined;
  const money = Number(p.get('money')) || undefined;
  return {
    active: ['seed', 'unlocks', 'stage', 'money', 'completed'].some((k) => p.has(k)),
    seed,
    unlocks: (p.get('unlocks') ?? '').split(',').filter(Boolean),
    stage,
    money: money && money > 0 ? money : undefined,
    completed: p.has('completed') && p.get('completed') !== '0',
  };
}
