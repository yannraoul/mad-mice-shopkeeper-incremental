import type { Content } from '../content/schema.ts';
import type { State } from '../engine/types.ts';
import { deserialize, serialize, type LoadResult } from './save.ts';

// Browser storage can be missing or blocked (private windows, quota), so every call is guarded:
// the game must keep running without it.
const KEY = 'cst.save';

export function loadSaved(c: Content): LoadResult | null {
  try {
    const text = localStorage.getItem(KEY);
    return text === null ? null : deserialize(c, text);
  } catch {
    return null;
  }
}

export function writeSave(state: State): void {
  try {
    localStorage.setItem(KEY, serialize(state));
  } catch {}
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
