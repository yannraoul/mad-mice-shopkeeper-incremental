import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawFile } from '../../src/content/load.ts';

export const CONTENT_DIR = fileURLToPath(new URL('../../content/', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function readPack(packDir: string, pack: string): RawFile[] {
  if (!existsSync(packDir)) return [];
  return walk(packDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      pack,
      path: relative(packDir, f).replace(/\\/g, '/'),
      data: JSON.parse(readFileSync(f, 'utf8')),
    }));
}

/** Core pack always; every directory under content/packs/ only when includePacks. */
export function readContentFiles(includePacks: boolean, contentDir: string = CONTENT_DIR): RawFile[] {
  const files = readPack(join(contentDir, 'core'), 'core');
  if (includePacks) {
    const packsDir = join(contentDir, 'packs');
    if (existsSync(packsDir)) {
      for (const name of readdirSync(packsDir)) {
        files.push(...readPack(join(packsDir, name), name));
      }
    }
  }
  return files;
}
