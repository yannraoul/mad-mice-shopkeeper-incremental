import { readContentFiles } from './lib/readContent.ts';
import { loadContent } from '../src/content/load.ts';
import { createTranslate } from '../src/i18n/core.ts';

// Prints the game's elements as Markdown tables, straight from the content files, so documents
// about the game (design briefs, wikis) never drift from the data: `npm run catalog`.

const c = loadContent(readContentFiles(true));
const t = createTranslate(c.strings, 'en');
const row = (...cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
const table = (head: string[], rows: (string | number)[][]) =>
  [row(...head), row(...head.map(() => '---')), ...rows.map((r) => row(...r))].join('\n');
const out: string[] = [];
const section = (title: string, body: string) => out.push(`### ${title}\n\n${body}\n`);

const effectText = (e: (typeof c.skillNodes)[number]['effects'][number]) =>
  e.type === 'unlock' ? `unlocks \`${e.id}\``
  : e.type === 'addStation' ? `adds station ${t(`station.${e.station}`)}`
  : `${e.add > 0 ? '+' : ''}${e.add} ${e.stat}`;

section('Ingredients', table(['Name', 'Delivered each morning (base)', 'Unlocked by', 'Notes'],
  c.ingredients.map((i) => [t(i.nameKey), i.dailySupply, i.unlock ? `\`${i.unlock}\`` : 'from the start', i.alternateOf ? `rare alternate of ${t(`ingredient.${i.alternateOf}`)}: each delivered unit has a ${Math.round(i.chance * 100)}% chance to arrive as this instead` : ''])));
const costText = (list: { ingredient: string; qty: number }[]) => list.map((i) => `${i.qty} ${t(`ingredient.${i.ingredient}`)}`).join(' + ');
section('Candies (recipes)', table(['Name', 'Base price', 'Plain batch', 'Extra per quality', 'Opens when'],
  c.candies.map((x) => [t(x.nameKey), x.basePrice, costText(x.ingredients), Object.entries(x.extra).map(([q, l]) => `${t(`quality.${q}`)}: +${costText(l)}`).join('; ') || '-', x.unlock ? `\`${x.unlock}\` and its ingredients are unlocked` : 'all its ingredients are unlocked'])));
section('Qualities (ordered)', table(['Rank', 'Name', 'Price multiplier', 'Cost rule', 'Extra craft step', 'Unlocked by'],
  [...c.qualities].sort((a, b) => a.rank - b.rank).map((q) => [q.rank, t(q.nameKey), `x${q.priceMult}`, q.alternates ? 'plain recipe, every ingredient replaced by its alternate' : q.rank === 0 ? 'the plain recipe' : 'plain recipe plus the candy extra units', q.extraSteps.map((s) => t(s.nameKey)).join(', ') || '-', q.unlock ?? 'from the start'])));
section('Stations', table(['Name', 'Candies per batch', 'Batches per day', 'Behaviour'], c.stations.map((s) => [t(s.nameKey), s.capacity, s.batchesPerDay, s.auto ? 'automatic every morning' : 'crafted by hand'])));
section('Customer types', table(['Name', 'Asks for', 'Minimum quality', 'Budget', 'Patience (actions)', 'How common', 'Appears'],
  c.customerTypes.map((x) => [t(x.nameKey), x.want.kind === 'candy' ? 'one specific recipe they can afford' : x.want.kind === 'ingredient' ? `a craving: any candy with ${x.want.from ? x.want.from.map((id) => t(`ingredient.${id}`)).join(' or ') : 'an unlocked ingredient'}` : `any candy with ${x.want.minIngredients}+ ingredients`, t(`quality.${x.minQuality}`), x.budget, x.patience, x.weight, x.unlock ? `after errand reward \`${x.unlock}\`` : 'from the start'])));
section('Workers', table(['Name', 'Hired by', 'Serves'], c.workers.map((w) => [t(w.nameKey), `\`${w.unlock}\``, w.serves.map((id) => t(`customer.${id}`)).join(', ')])));
section('Daily forecasts (shown in the morning, never exact)', table(['Text', 'Busyness'], c.forecasts.map((f) => [t(f.nameKey), `x${f.arrivalsMult}`])));
section('Skill tree', ['kitchen', 'shop', 'temple'].map((b) => `**${t(`branch.${b}`)}**\n\n` + table(['Upgrade', 'Levels', 'Cost per level', 'Requires', 'Effect', 'Description'],
  c.skillNodes.filter((n) => n.branch === b).map((n) => [t(n.nameKey), n.costs.length, n.costs.join(' / '), n.requires.map((r) => t(`node.${r}`)).join(', ') || '-', n.effects.map(effectText).join('; '), t(n.descKey)]))).join('\n\n'));
section('Weekly stages', table(['Stage', 'Days', 'Revenue target', 'Customer volume', 'Rival hive'],
  c.stages.map((s) => [t(s.nameKey), s.days, s.target, `x${s.arrivalsMult}`, s.rival ? `steals ${s.rival.amount} ${t(`ingredient.${s.rival.ingredient}`)} per morning from day ${s.rival.startsOnDay}` : '-'])));
section('Errands', table(['Name', 'Kind', 'Needs', 'Appears from stage', 'Reward / effect', 'Description'],
  c.errands.map((e) => [t(e.nameKey), e.kind === 'mission' ? `mission: ${t(`worker.${e.mission!.worker}`)} away ${e.mission!.days} days` : 'deliver goods',
    [...e.requires.map((r) => `\`${r}\``), ...e.deliver.map((d) => `${d.qty} ${t(`candy.${d.candy}`)} (${t(`quality.${d.quality}`)})`)].join(', '), e.minStage + 1,
    e.reward.map(effectText).join('; '), t(e.descKey)])));
section('Map places', table(['Place', 'Revealed at stage'], c.places.map((p) => [t(p.nameKey), p.minStage + 1])));
section('Art slots (placeholders today: final pixel sizes, swappable files)', table(['Slot id', 'Size (px)', 'What it shows'],
  c.artSlots.map((a) => [`\`${a.id}\``, `${a.width} x ${a.height}`, t(a.altKey)])));
section('Key numbers', table(['Setting', 'Value'], [
  ['Customers waiting at the counter at once', c.settings.counterSpace],
  ['Customers the shop welcomes per day = counter space x', c.settings.customersPerSpace],
  ['Hand-made batches before the clerk can sell a recipe', c.settings.delegateAfterBatches],
  ['Base customers per day (stage 1)', c.settings.baseArrivals],
]));

console.log(out.join('\n'));
