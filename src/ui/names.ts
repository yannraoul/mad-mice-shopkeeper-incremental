import { content } from '../content/index.ts';
import { t } from '../i18n/i18n.svelte.ts';

/** Name of the upgrade that grants an unlock id, for "Needs: ..." lines (falls back to the id). */
export function unlockName(id: string): string {
  const node = content.skillNodes.find((n) => n.effects.some((ef) => ef.type === 'unlock' && ef.id === id));
  return node ? t(node.nameKey) : id;
}

/** Errands whose reward relieves the rival hive: the way out of its honey theft. */
export const rivalErrands = content.errands.filter((e) =>
  e.reward.some((r) => r.type === 'modifier' && r.stat === 'rivalRelief'),
);
