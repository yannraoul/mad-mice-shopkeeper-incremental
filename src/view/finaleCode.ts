// The finale code of the preview build (MMSIM-38): what a player sends back to prove the campaign was finished.
//
// 16 characters of Crockford base32 (80 bits) in four groups: 42 bits of readable payload (the day of the finish, the seed
// of the run, the lifetime revenue) and a 38-bit HMAC-SHA256 of the payload and the player's name. The author's verifier
// (`npm run verify-code`) decodes the payload and recomputes the HMAC. The secret has to ship in the build, so this stops
// guessing, typing a made-up code and passing one player's code to another (the name would not match), not someone who
// reads the bundle. Pure: no browser or Node API, so the game and the verifier share it.

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function sha256(data: Uint8Array): Uint8Array {
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const len = data.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor((len * 8) / 0x100000000));
  view.setUint32(padded.length - 4, (len * 8) >>> 0);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h as [number, number, number, number, number, number, number, number];
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i]! + w[i]!) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    const next = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i++) h[i] = (h[i]! + next[i]!) >>> 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  h.forEach((x, i) => ov.setUint32(i * 4, x));
  return out;
}

export function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const k = key.length > 64 ? sha256(key) : key;
  const ipad = new Uint8Array(64).fill(0x36);
  const opad = new Uint8Array(64).fill(0x5c);
  k.forEach((b, i) => {
    ipad[i]! ^= b;
    opad[i]! ^= b;
  });
  const inner = sha256(Uint8Array.from([...ipad, ...msg]));
  return sha256(Uint8Array.from([...opad, ...inner]));
}

const utf8 = (s: string) => new TextEncoder().encode(s);
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford: no I, L, O, U

export interface FinalePayload {
  /** The day of the finish (0 to 1023). */
  day: number;
  /** The low 16 bits of the seed of the run. */
  seed: number;
  /** Lifetime revenue at the finish, in hundreds of coins (0 to 65535). */
  revenue: number;
}

const DAY_BITS = 10;
const SEED_BITS = 16;
const REV_BITS = 16;
const MAC_BITS = 38;

/** The name as it is compared: letters without accents, lowercase, spaces collapsed. "  Mïra  Oak " is "mira oak". */
export const normalizeName = (name: string): string =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** From the numbers the game keeps (`finale` and `seed` of the state) to the fields of the code, clamped to their widths. */
export function payloadFrom(finale: { day: number; revenue: number }, seed: number): FinalePayload {
  return {
    day: Math.min((1 << DAY_BITS) - 1, Math.max(0, Math.floor(finale.day))),
    seed: (seed >>> 0) & ((1 << SEED_BITS) - 1),
    revenue: Math.min((1 << REV_BITS) - 1, Math.max(0, Math.floor(finale.revenue / 100))),
  };
}

const packPayload = (p: FinalePayload): bigint =>
  (BigInt(p.day) << BigInt(SEED_BITS + REV_BITS)) | (BigInt(p.seed) << BigInt(REV_BITS)) | BigInt(p.revenue);

function mac(secret: string, name: string, payload: bigint): bigint {
  const digest = hmacSha256(utf8(secret), utf8(`${normalizeName(name)}|${payload.toString(16)}`));
  let v = 0n;
  for (let i = 0; i < 5; i++) v = (v << 8n) | BigInt(digest[i]!);
  return v >> BigInt(40 - MAC_BITS);
}

const group = (s: string) => s.match(/.{4}/g)!.join('-');

/** The code for this player: `XXXX-XXXX-XXXX-XXXX`. */
export function makeFinaleCode(secret: string, name: string, p: FinalePayload): string {
  const payload = packPayload(p);
  let v = (payload << BigInt(MAC_BITS)) | mac(secret, name, payload);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out = ALPHABET[Number(v & 31n)] + out;
    v >>= 5n;
  }
  return group(out);
}

export type FinaleCheck = { ok: true; payload: FinalePayload } | { ok: false; reason: 'format' | 'mismatch' };

/** The author's check: is this code the one the game makes for this name? Letters are read as Crockford does (O is 0, I and L are 1). */
export function checkFinaleCode(secret: string, name: string, code: string): FinaleCheck {
  const clean = code.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (clean.length !== 16 || [...clean].some((ch) => !ALPHABET.includes(ch))) return { ok: false, reason: 'format' };
  let v = 0n;
  for (const ch of clean) v = (v << 5n) | BigInt(ALPHABET.indexOf(ch));
  const payload = v >> BigInt(MAC_BITS);
  if (mac(secret, name, payload) !== (v & ((1n << BigInt(MAC_BITS)) - 1n))) return { ok: false, reason: 'mismatch' };
  const day = Number(payload >> BigInt(SEED_BITS + REV_BITS));
  const seed = Number((payload >> BigInt(REV_BITS)) & ((1n << BigInt(SEED_BITS)) - 1n));
  const revenue = Number(payload & ((1n << BigInt(REV_BITS)) - 1n));
  return { ok: true, payload: { day, seed, revenue } };
}
