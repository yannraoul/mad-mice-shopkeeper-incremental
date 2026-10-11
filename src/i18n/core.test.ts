import { describe, expect, it } from 'vitest';
import { createTranslate, translateKey } from './core.ts';

const strings = {
  en: { hello: 'Hello {name}, day {n}', plain: 'Plain' },
  fr: { hello: 'Bonjour {name}, jour {n}' },
};

describe('translation core', () => {
  it('replaces placeholders and leaves unknown ones visible', () => {
    expect(translateKey(strings, 'en', 'hello', { name: 'Mouse', n: 3 })).toBe('Hello Mouse, day 3');
    expect(translateKey(strings, 'en', 'hello', { name: 'Mouse' })).toBe('Hello Mouse, day {n}');
  });
  it('falls back to the key when a string is missing', () => {
    expect(translateKey(strings, 'fr', 'plain')).toBe('plain');
  });
  it('createTranslate binds a language and exposes its locale', () => {
    const fr = createTranslate(strings, 'fr');
    expect(fr('hello', { name: 'Souris', n: 1 })).toBe('Bonjour Souris, jour 1');
    expect(fr.locale).toBe('fr');
    expect(createTranslate(strings, 'en').locale).toBe('en');
  });
});
