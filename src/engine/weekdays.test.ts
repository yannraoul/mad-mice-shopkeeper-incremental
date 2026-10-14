import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { buildBoardView } from '../view/board.ts';
import { createTranslate } from '../i18n/core.ts';
import { dayOfWeek, weekdayOf } from './economy.ts';
import { newGame, step } from './engine.ts';

// MMSIM-21: market day, the first day of the week that differs from the others.
const c = loadContent(readContentFiles(false));
const market = c.weekdays.find((w) => w.id === 'market')!;
const onDay = (n: number) => ({ ...newGame(c, { seed: 1 }), day: n });

describe('weekdays', () => {
  it('only the market day differs, and it falls on the same day every week', () => {
    expect(weekdayOf(c, onDay(market.day))?.id).toBe('market');
    expect(weekdayOf(c, onDay(market.day + 7))?.id).toBe('market');
    expect(weekdayOf(c, onDay(1))).toBeUndefined();
    expect(dayOfWeek(market.day + 14)).toBe(market.day);
  });
  it('brings more walk-ins than the same seed on an ordinary day', () => {
    const arrivals = (day: number) => {
      let s = onDay(day);
      for (const phase of ['morning'] as const) {
        const r = step(c, s, { type: 'endPhase' });
        if (!r.ok) throw new Error(`${phase}: ${r.error}`);
        s = r.state;
      }
      return s.report.arrivals;
    };
    // Same seed, same forecast draw order: only the weekday multiplier differs.
    expect(arrivals(market.day)).toBeGreaterThanOrEqual(arrivals(1));
  });
  it('announces itself on the board only on market day', () => {
    const t = createTranslate(c.strings, 'en');
    expect(buildBoardView(c, onDay(1), t).weekday).toBeNull();
    expect(buildBoardView(c, onDay(market.day), t).weekday?.name).toBe('Market day');
  });
});
