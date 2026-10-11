import { describe, expect, it } from 'vitest';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentPlugin } from './contentPlugin.ts';
import { CONTENT_DIR } from './lib/readContent.ts';

// The one guarantee the preview build exists for: pack content must not be in the bundle.
// Runs two real Vite builds (preview and full) over a temporary copy of the content that has an
// extra pack with recognisable text, then reads the output files.

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function bundleText(contentDir: string, outDir: string, includePacks: boolean): Promise<string> {
  await build({
    root: ROOT,
    configFile: false,
    logLevel: 'silent',
    base: './',
    plugins: [svelte(), contentPlugin({ includePacks, contentDir })],
    build: { outDir, emptyOutDir: true },
  });
  return walk(outDir)
    .filter((f) => /\.(js|html|css)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

describe('preview build', () => {
  it('leaves pack content out of the bundle, while the full build includes it', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'cst-preview-'));
    try {
      const contentDir = join(tmp, 'content');
      cpSync(CONTENT_DIR, contentDir, { recursive: true });
      const pack = join(contentDir, 'packs', 'secret-plot', 'strings');
      mkdirSync(pack, { recursive: true });
      writeFileSync(join(pack, 'en.json'), JSON.stringify({ 'secret.line': 'SECRET-PLOT-MARKER-EN-9137' }));
      writeFileSync(join(pack, 'fr.json'), JSON.stringify({ 'secret.line': 'SECRET-PLOT-MARKER-FR-9137' }));

      const preview = await bundleText(contentDir, join(tmp, 'out-preview'), false);
      expect(preview).not.toContain('SECRET-PLOT-MARKER');
      // the real placeholder ending pack is excluded too
      expect(preview).not.toContain('the real ending is yours to write');
      expect(preview).toContain('Cult of Sweet Tooth'); // core content is there

      const full = await bundleText(contentDir, join(tmp, 'out-full'), true);
      expect(full).toContain('SECRET-PLOT-MARKER-EN-9137');
      expect(full).toContain('the real ending is yours to write');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 120_000);
});
