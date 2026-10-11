import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFile, checkTree } from './lib/architecture.ts';

// The code base keeps the game, the view layer and the application session free of any UI
// technology. Only the adapter files may touch Svelte, the DOM, localStorage or the build
// environment. See scripts/lib/architecture.ts for the rules.

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(SRC)
  .filter((f) => /\.(ts|svelte)$/.test(f))
  .map((f) => relative(SRC, f).split(sep).join('/'));

describe('architecture boundaries', () => {
  it('the real source tree respects the layers', () => {
    const violations = [
      ...checkTree(files),
      ...files.filter((f) => f.endsWith('.ts')).flatMap((f) => checkFile(f, readFileSync(join(SRC, f), 'utf8'))),
    ];
    expect(violations.map((v) => `${v.file}: ${v.reason}`)).toEqual([]);
  });

  it('the view and app layers exist and are not empty', () => {
    expect(files.filter((f) => f.startsWith('view/') && !f.endsWith('.test.ts')).length).toBeGreaterThan(5);
    expect(files).toContain('app/session.ts');
  });

  describe('the checker itself catches violations', () => {
    const reasons = (file: string, source: string) => checkFile(file, source).map((v) => v.reason);
    it('framework and browser use in a pure layer', () => {
      expect(reasons('engine/x.ts', `import { x } from 'svelte';`)).toContain('imports Svelte');
      expect(reasons('view/x.ts', `import A from '../ui/A.svelte';`).join()).toMatch(/Svelte file/);
      expect(reasons('view/x.ts', `let a = $state(0);`)).toContain('uses Svelte runes');
      expect(reasons('app/x.ts', `document.title = 'x';`)).toContain('touches the DOM (document)');
      expect(reasons('sim/x.ts', `localStorage.getItem('a');`)).toContain('uses localStorage');
      expect(reasons('view/x.ts', `const u = location.search;`)).toContain('uses location');
      expect(reasons('engine/x.ts', `import raw from 'virtual:content';`)).toContain('uses the build-time virtual content module');
      expect(reasons('engine/x.ts', `const b = import.meta.env.BASE_URL;`)).toContain('reads the build environment');
    });
    it('imports that go the wrong way', () => {
      expect(reasons('engine/x.ts', `import { v } from '../view/serve.ts';`).join()).toMatch(/must not import from "view"/);
      expect(reasons('view/x.ts', `import { g } from '../app/session.ts';`).join()).toMatch(/must not import from "app"/);
      expect(reasons('engine/x.ts', `import { s } from '../ui/game.svelte.ts';`).join()).toMatch(/adapter/);
      expect(reasons('view/x.ts', `import { c } from '../content/index.ts';`).join()).toMatch(/adapter/);
      expect(reasons('save/save.ts', `import { x } from '../sim/bot.ts';`).join()).toMatch(/must not import from "sim"/);
    });
    it('unknown packages and unclassified files', () => {
      expect(reasons('engine/x.ts', `import _ from 'lodash';`).join()).toMatch(/package "lodash"/);
      expect(reasons('engine/x.ts', `import { z } from 'zod';`)).toEqual([]);
      expect(reasons('mystery/x.ts', `export const a = 1;`).join()).toMatch(/not in a known layer/);
      expect(checkTree(['mystery/x.ts', 'engine/a.ts']).map((v) => v.file)).toEqual(['mystery/']);
    });
    it('allows what each layer is entitled to, ignores comments, tests and adapters', () => {
      expect(reasons('view/x.ts', `import type { State } from '../engine/types.ts'; import { c } from '../craft/session.ts';`)).toEqual([]);
      expect(reasons('app/x.ts', `import { v } from '../view/index.ts';`)).toEqual([]);
      expect(reasons('engine/x.ts', `// no document.title or localStorage here\n/* window.x */ export const a = 1;`)).toEqual([]);
      expect(reasons('engine/x.test.ts', `import { x } from 'svelte'; document.x;`)).toEqual([]);
      expect(reasons('ui/App.svelte.ts', `document.title;`)).toEqual([]);
      expect(reasons('save/storage.ts', `localStorage.getItem('a');`)).toEqual([]);
    });
  });
});
