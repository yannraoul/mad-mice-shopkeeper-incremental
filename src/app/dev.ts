/** Developer hooks from the URL query string, e.g. `?seed=12&unlocks=oven,clerk&stage=2`. */
export interface DevOptions {
  /** True when any hook is present: the game is then a throwaway that never touches the real save. */
  active: boolean;
  seed?: number;
  unlocks: string[];
  /** Start in stage N (1-based). */
  stage?: number;
}

export function parseDevOptions(search: string): DevOptions {
  const p = new URLSearchParams(search);
  const seed = Number(p.get('seed')) || undefined;
  const stage = Number(p.get('stage')) || undefined;
  return {
    active: p.has('seed') || p.has('unlocks') || p.has('stage'),
    seed,
    unlocks: (p.get('unlocks') ?? '').split(',').filter(Boolean),
    stage,
  };
}
