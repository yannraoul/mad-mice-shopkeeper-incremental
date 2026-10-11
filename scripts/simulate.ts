import { readContentFiles } from './lib/readContent.ts';
import { loadContent } from '../src/content/load.ts';
import { formatReport, simulate } from '../src/sim/simulate.ts';

// npm run sim -- [--days 30] [--seed 1] [--unlocks oven,contractBoard]
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};

const content = loadContent(readContentFiles(true));
const result = simulate(content, {
  days: Number(opt('days', '30')),
  seed: Number(opt('seed', '1')),
  unlocks: opt('unlocks', '').split(',').filter(Boolean),
});
console.log(formatReport(result));
