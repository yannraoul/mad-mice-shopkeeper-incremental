import { dirname, join, relative, resolve, sep } from 'node:path';

// The layering rules of the code base, as data, so a test can enforce them.
//
// Idea: the game rules and everything that decides what a screen shows are plain TypeScript with
// no knowledge of Svelte, the browser or the rendering technology. Only a few adapter files touch
// those. That is what lets a different front end (graphic, animated, native) be added later.

/** Folders under `src/` and the folders each one may import from (besides itself). */
export const LAYERS: Record<string, string[]> = {
  content: [],
  engine: ['content'],
  craft: ['content', 'engine'],
  save: ['content', 'engine'],
  sim: ['content', 'engine', 'craft'],
  i18n: ['content'],
  view: ['content', 'engine', 'craft', 'i18n', 'save'],
  app: ['content', 'engine', 'save', 'view', 'i18n'],
};

/** Files (relative to `src/`) that are allowed to touch the browser and Svelte: the adapters. */
export const ADAPTERS = [
  'content/index.ts', // reads the build-time `virtual:content` module
  'save/storage.ts', // localStorage
  'i18n/i18n.svelte.ts', // reactive language, localStorage, document title
  'main.ts',
  'vite-env.d.ts',
];
/** Whole folders of adapters (the Svelte components). */
export const ADAPTER_DIRS = ['ui'];

export const ALLOWED_PACKAGES = new Set(['zod']);

const FORBIDDEN: [RegExp, string][] = [
  [/from\s+['"]svelte/, 'imports Svelte'],
  [/['"][^'"]*\.svelte(\.ts)?['"]/, 'imports a Svelte file'],
  [/\$(state|derived|effect|props|bindable)\b/, 'uses Svelte runes'],
  [/\bdocument\s*\./, 'touches the DOM (document)'],
  [/\bwindow\s*\./, 'touches the DOM (window)'],
  [/\blocalStorage\b/, 'uses localStorage'],
  [/\bsessionStorage\b/, 'uses sessionStorage'],
  [/\bnavigator\s*\./, 'uses navigator'],
  [/\blocation\s*\./, 'uses location'],
  [/virtual:content/, 'uses the build-time virtual content module'],
  [/import\.meta\.env/, 'reads the build environment'],
];

/** Remove comments so prose such as "no DOM here" is not mistaken for code. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

export interface Violation {
  file: string;
  reason: string;
}

/**
 * Check one file. `file` is the path relative to `src/` using forward slashes (e.g. `engine/engine.ts`).
 * Test files are exempt; adapters are exempt from everything.
 */
export function checkFile(file: string, source: string): Violation[] {
  if (/\.test\.ts$/.test(file)) return [];
  if (ADAPTERS.includes(file) || ADAPTER_DIRS.some((d) => file.startsWith(`${d}/`))) return [];

  const layer = file.split('/')[0]!;
  const out: Violation[] = [];
  if (file.indexOf('/') < 0 || !(layer in LAYERS)) {
    out.push({ file, reason: `is not in a known layer (${Object.keys(LAYERS).join(', ')}) or an adapter: classify it in scripts/lib/architecture.ts` });
    return out;
  }

  const code = stripComments(source);
  for (const [re, why] of FORBIDDEN) if (re.test(code)) out.push({ file, reason: why });

  // Imports: relative ones must stay inside the folders this layer may use; packages must be allow-listed.
  // Only real import statements count (not strings that merely contain the word "import").
  const specs = [
    ...code.matchAll(/(?:^|\n)\s*(?:import|export)\b[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/g), // import/export ... from '...'
    ...code.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g), // import '...'
    ...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g), // import('...')
  ].map((m) => m[1]!);
  for (const spec of specs) {
    if (spec.startsWith('.')) {
      const target = relative('/src', resolve('/src', dirname(file), spec)).split(sep).join('/');
      const targetLayer = target.split('/')[0]!;
      const adapterTarget =
        ADAPTERS.includes(target) || ADAPTERS.includes(`${target}.ts`) || ADAPTER_DIRS.includes(targetLayer);
      if (adapterTarget) out.push({ file, reason: `imports an adapter file (${spec})` });
      else if (targetLayer !== layer && !LAYERS[layer]!.includes(targetLayer))
        out.push({ file, reason: `layer "${layer}" must not import from "${targetLayer}" (${spec})` });
    } else if (!spec.startsWith('node:') && !ALLOWED_PACKAGES.has(spec.split('/')[0]!)) {
      out.push({ file, reason: `imports package "${spec}" (allowed: ${[...ALLOWED_PACKAGES].join(', ')})` });
    }
  }
  return out;
}

/** Every layer folder must exist as a directory name we know; a new folder must be classified. */
export function checkTree(files: string[]): Violation[] {
  const folders = new Set(files.map((f) => f.split('/')[0]!).filter((f) => files.some((x) => x.startsWith(`${f}/`))));
  const known = new Set([...Object.keys(LAYERS), ...ADAPTER_DIRS]);
  return [...folders]
    .filter((f) => !known.has(f))
    .map((f) => ({ file: `${f}/`, reason: 'new folder under src/: add it to LAYERS or ADAPTER_DIRS' }));
}

export const srcPath = (root: string) => join(root, 'src');
