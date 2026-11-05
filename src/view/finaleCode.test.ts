import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkFinaleCode, hmacSha256, makeFinaleCode, normalizeName, payloadFrom, sha256 } from './finaleCode.ts';

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const P = { day: 41, seed: 0xbeef, revenue: 1234 };

describe('sha256 and hmac', () => {
  it('match Node for several lengths (padding edge cases)', () => {
    for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, 500]) {
      const data = new Uint8Array(n).map((_, i) => (i * 7 + n) & 255);
      expect(hex(sha256(data))).toBe(createHash('sha256').update(data).digest('hex'));
      expect(hex(hmacSha256(new TextEncoder().encode('k'.repeat(n % 90)), data))).toBe(
        createHmac('sha256', 'k'.repeat(n % 90)).update(data).digest('hex'),
      );
    }
  });
});

describe('finale code', () => {
  it('has four groups of four Crockford characters and is stable', () => {
    const code = makeFinaleCode('s3cret', 'Mira', P);
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(makeFinaleCode('s3cret', 'Mira', P)).toBe(code);
  });

  it('round-trips its payload for the right name and secret', () => {
    const code = makeFinaleCode('s3cret', 'Mira', P);
    expect(checkFinaleCode('s3cret', 'Mira', code)).toEqual({ ok: true, payload: P });
  });

  it('ignores case, accents, spacing and the look-alike letters when checking', () => {
    const code = makeFinaleCode('s3cret', 'Mira Oak', P);
    expect(checkFinaleCode('s3cret', '  MÏRA   oak ', code.toLowerCase().replace(/-/g, ' ')).ok).toBe(true);
    expect(normalizeName('  Mïra  Oak ')).toBe('mira oak');
  });

  it('rejects another name, another secret, an altered code and a malformed one', () => {
    const code = makeFinaleCode('s3cret', 'Mira', P);
    expect(checkFinaleCode('s3cret', 'Brin', code)).toEqual({ ok: false, reason: 'mismatch' });
    expect(checkFinaleCode('other', 'Mira', code)).toEqual({ ok: false, reason: 'mismatch' });
    const flipped = code.slice(0, 1) === '0' ? '1' + code.slice(1) : '0' + code.slice(1);
    expect(checkFinaleCode('s3cret', 'Mira', flipped).ok).toBe(false);
    expect(checkFinaleCode('s3cret', 'Mira', 'ABC')).toEqual({ ok: false, reason: 'format' });
    expect(checkFinaleCode('s3cret', 'Mira', 'UUUU-UUUU-UUUU-UUUU')).toEqual({ ok: false, reason: 'format' });
  });

  it('a different run (seed) or day gives a different code for the same name', () => {
    const a = makeFinaleCode('s3cret', 'Mira', P);
    expect(makeFinaleCode('s3cret', 'Mira', { ...P, seed: P.seed + 1 })).not.toBe(a);
    expect(makeFinaleCode('s3cret', 'Mira', { ...P, day: P.day + 1 })).not.toBe(a);
  });

  it('payloadFrom clamps to the field widths', () => {
    expect(payloadFrom({ day: 99999, revenue: 1e12 }, -1)).toEqual({ day: 1023, seed: 0xffff, revenue: 65535 });
    expect(payloadFrom({ day: 82, revenue: 12345 }, 7)).toEqual({ day: 82, seed: 7, revenue: 123 });
  });
});
