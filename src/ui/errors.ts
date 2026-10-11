import { i18n, t } from '../i18n/i18n.svelte.ts';
import type { FailCode } from '../engine/types.ts';

/** Player-facing text for an engine refusal: `error.<code>` with ids turned into names. */
export function describeFail(code: FailCode, params: Record<string, string> = {}): string {
  const names: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    // Names sit mid-sentence, so they are lower-cased ("Not enough honey.").
    const name =
      k === 'ingredient' ? t(`ingredient.${v}`)
      : k === 'quality' ? t(`quality.${v}`)
      : k === 'candy' ? t(`candy.${v}`)
      : k === 'phase' ? t(`phase.${v}`)
      : v;
    names[k] = name.toLocaleLowerCase(i18n.lang);
  }
  return t(`error.${code}`, names);
}
