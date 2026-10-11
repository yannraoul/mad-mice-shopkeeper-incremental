import { describe, expect, it } from 'vitest';
import { loadContent } from './load.ts';
import { readContentFiles } from '../../scripts/lib/readContent.ts';

describe('content', () => {
  it('core + packs load and validate', () => {
    expect(() => loadContent(readContentFiles(true))).not.toThrow();
  });
  it('core alone (preview) loads', () => {
    expect(() => loadContent(readContentFiles(false))).not.toThrow();
  });
  it('rejects a missing FR string', () => {
    const files = readContentFiles(false).map((f) =>
      f.path === 'strings/fr.json' ? { ...f, data: { 'game.title': 'x' } } : f,
    );
    expect(() => loadContent(files)).toThrow(/strings\/fr: missing key/);
  });
  it('rejects an unknown quality reference', () => {
    const files = readContentFiles(false).map((f) =>
      f.path === 'customerTypes.json'
        ? { ...f, data: [{ id: 'x', nameKey: 'customer.faithful', minQuality: 'nope', patience: 1, budget: 1, weight: 1 }] }
        : f,
    );
    expect(() => loadContent(files)).toThrow(/unknown quality/);
  });
});
