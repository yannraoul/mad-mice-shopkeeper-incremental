// Pure TypeScript: no UI, no DOM imports. Player-ended phases, no timers.
export const PHASES = ['morning', 'afternoon', 'evening'] as const;
export type Phase = (typeof PHASES)[number];

/** Next phase in the day cycle; evening rolls over to the next day's morning. */
export function nextPhase(p: Phase): { phase: Phase; newDay: boolean } {
  const i = PHASES.indexOf(p);
  const phase = PHASES[(i + 1) % PHASES.length]!;
  return { phase, newDay: phase === 'morning' };
}
