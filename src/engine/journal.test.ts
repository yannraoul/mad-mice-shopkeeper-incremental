import { describe, expect, it } from 'vitest';
import { loadContent } from '../content/load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';
import { newGame } from './engine.ts';
import { journalKey } from './journal.ts';

const c = loadContent(readContentFiles(false));

describe('journal', () => {
  it('picks a matching specific line, else the fallback', () => {
    const s = newGame(c, { seed: 1 });
    s.day = 5;
    s.report.revenue = 30; // not quiet, not busy, nothing lost
    expect(journalKey(c, s)).toBe('journal.fallback');
    s.report.revenue = 5;
    expect(journalKey(c, s)).toBe('journal.quiet');
  });
  it('has a line for the first day', () => {
    const s = newGame(c, { seed: 1 });
    s.day = 1;
    s.report.revenue = 30;
    expect(journalKey(c, s)).toBe('journal.first');
  });
  it('is deterministic and only returns real string keys', () => {
    const s = newGame(c, { seed: 1 });
    s.day = 7;
    s.report.revenue = 120;
    s.report.autoServed = 3;
    const a = journalKey(c, s)!;
    expect(journalKey(c, s)).toBe(a);
    expect(c.strings.en[a]).toBeTruthy();
    expect(c.strings.fr[a]).toBeTruthy();
  });
  it('reacts to owned nodes', () => {
    const s = newGame(c, { seed: 1 });
    s.day = 9;
    s.report.revenue = 30;
    s.nodes['dark-garden'] = 1;
    expect(journalKey(c, s)).toBe('journal.garden');
  });
});
