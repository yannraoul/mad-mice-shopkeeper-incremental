import raw from 'virtual:content';
import { loadContent } from './load.ts';

/** Validated content, merged from core + whatever packs this build included. */
export const content = loadContent(raw);
