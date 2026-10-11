import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { FailCode } from '../engine/types.ts';

// Small text helpers shared by every view model.

/** Player-facing text for an engine refusal: `error.<code>` with ids turned into names. */
export function describeFail(t: Translate, code: FailCode, params: Record<string, string> = {}): string {
  const names: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    // Names sit mid-sentence, so they are lower-cased ("Not enough honey.").
    const name =
      k === 'ingredient' ? t(`ingredient.${v}`)
      : k === 'quality' ? t(`quality.${v}`)
      : k === 'candy' ? t(`candy.${v}`)
      : k === 'phase' ? t(`phase.${v}`)
      : k === 'customerType' ? t(`customer.${v}`)
      : k === 'node' ? t(`node.${v}`)
      : v;
    names[k] = name.toLocaleLowerCase(t.locale);
  }
  return t(`error.${code}`, names);
}

/** Name of the upgrade that grants an unlock id, for "Needs: ..." lines (falls back to the id). */
export function unlockName(c: Content, t: Translate, id: string): string {
  const node = c.skillNodes.find((n) => n.effects.some((ef) => ef.type === 'unlock' && ef.id === id));
  return node ? t(node.nameKey) : id;
}

/** Errands whose reward relieves the rival hive: the way out of its honey theft. */
export const rivalErrands = (c: Content): Content['errands'] =>
  c.errands.filter((e) => e.reward.some((r) => r.type === 'modifier' && r.stat === 'rivalRelief'));
