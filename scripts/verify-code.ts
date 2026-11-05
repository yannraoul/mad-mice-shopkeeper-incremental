import { existsSync, readFileSync } from 'node:fs';
import { checkFinaleCode } from '../src/view/finaleCode.ts';

// The author's check of a finale code: npm run verify-code -- "Player name" XXXX-XXXX-XXXX-XXXX
// Prints what the code says (day of the finish, run id, revenue) or why it is not valid. The secret is the one the preview
// build was made with: VITE_FINALE_SECRET in the environment or in .env.local (the same place the build reads it).

function secret(): string {
  if (process.env.VITE_FINALE_SECRET) return process.env.VITE_FINALE_SECRET;
  if (existsSync('.env.local')) {
    const m = /^VITE_FINALE_SECRET=(.*)$/m.exec(readFileSync('.env.local', 'utf8'));
    if (m) return m[1]!.trim().replace(/^["']|["']$/g, '');
  }
  console.warn('No VITE_FINALE_SECRET found: using the development fallback (only valid for codes from a dev build).');
  return 'dev-secret';
}

const [name, code] = process.argv.slice(2);
if (!name || !code) {
  console.error('usage: npm run verify-code -- "Player name" XXXX-XXXX-XXXX-XXXX');
  process.exit(2);
}
const r = checkFinaleCode(secret(), name, code);
if (r.ok) {
  console.log(`VALID  ${name}: finished on day ${r.payload.day}, run ${r.payload.seed.toString(16).toUpperCase().padStart(4, '0')}, about ${r.payload.revenue * 100} coins earned`);
} else {
  console.log(r.reason === 'format' ? 'INVALID  not a 16-character code' : 'INVALID  the code does not match this name');
  process.exit(1);
}
