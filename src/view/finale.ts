import type { Content } from '../content/schema.ts';
import type { Translate } from '../i18n/core.ts';
import type { State } from '../engine/types.ts';
import { makeFinaleCode, normalizeName, payloadFrom } from './finaleCode.ts';

export interface FinaleView {
  /** The campaign is completed and this build has no ending pack: the finale card replaces the ending sequence. */
  available: boolean;
  /** It should show now, unasked: available and not yet acknowledged. */
  due: boolean;
  title: string;
  lines: string[];
  nameLabel: string;
  nameHint: string;
  codeLabel: string;
  copyLabel: string;
  copiedLabel: string;
  closeLabel: string;
  /** Where the code can be found again. */
  againNote: string;
  replayLabel: string;
  /** The code for a name, or null while the name is empty. Same name, same run: same code. */
  codeFor: (name: string) => string | null;
}

/** The end of the campaign in the preview build (no ending pack): no story, just a code to send back to the author. */
export function buildFinaleView(c: Content, s: State, t: Translate, secret: string): FinaleView {
  const hasPack = !!c.strings[t.locale]['ending.title'];
  const available = s.completed && s.finale !== null && !hasPack;
  return {
    available,
    due: available && !s.endingSeen,
    title: t('finale.title'),
    lines: [t('finale.line1'), t('finale.line2')],
    nameLabel: t('finale.name'),
    nameHint: t('finale.nameHint'),
    codeLabel: t('finale.code'),
    copyLabel: t('finale.copy'),
    copiedLabel: t('finale.copied'),
    closeLabel: t('finale.close'),
    againNote: t('finale.again'),
    replayLabel: t('finale.replay'),
    codeFor: (name) => (normalizeName(name) && s.finale ? makeFinaleCode(secret, name, payloadFrom(s.finale, s.seed)) : null),
  };
}
