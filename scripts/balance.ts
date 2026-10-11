import { readContentFiles } from './lib/readContent.ts';
import { loadContent } from '../src/content/load.ts';
import { cheapBot, type Bot } from '../src/sim/bot.ts';
import { casualBot, smartBot } from '../src/sim/smartBot.ts';
import { ablate, formatSummary, runBalance } from '../src/sim/balance.ts';

// npm run balance -- [--seeds 40] [--days 84] [--bot smart|casual|cheap|both]
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
};

const content = loadContent(readContentFiles(true));
const seeds = Array.from({ length: Number(opt('seeds', '40')) }, (_, i) => i + 1);
const days = Number(opt('days', '84'));
const which = opt('bot', 'both');
const all: Record<string, Bot> = { smart: smartBot, casual: casualBot, cheap: cheapBot };
const bots: Bot[] = which === 'both' ? [smartBot, casualBot] : [all[which] ?? smartBot];

if (args.includes('--ablate')) {
  const rows = ablate(content, smartBot, seeds, days).sort((a, b) => a.revenuePct - b.revenuePct);
  console.log('Without this upgrade (smart bot): revenue change, delay of the final stage');
  for (const r of rows)
    console.log(`  ${r.node.padEnd(15)} ${r.revenuePct.toFixed(1).padStart(6)}%   final stage ${r.finalStageDelay === null ? 'not always cleared' : (r.finalStageDelay >= 0 ? '+' : '') + r.finalStageDelay + ' days'}`);
  process.exit(0);
}
for (const bot of bots) console.log(formatSummary(content, runBalance(content, bot, seeds, days)) + '\n');
