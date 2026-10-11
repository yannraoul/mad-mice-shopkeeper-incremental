import { describe, expect, it } from 'vitest';
import { nextPhase } from './phases.ts';

describe('day cycle', () => {
  it('goes morning -> afternoon -> evening -> next morning', () => {
    expect(nextPhase('morning')).toEqual({ phase: 'afternoon', newDay: false });
    expect(nextPhase('afternoon')).toEqual({ phase: 'evening', newDay: false });
    expect(nextPhase('evening')).toEqual({ phase: 'morning', newDay: true });
  });
});
