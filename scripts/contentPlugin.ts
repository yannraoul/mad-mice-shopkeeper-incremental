import type { Plugin } from 'vite';
import { CONTENT_DIR, readContentFiles } from './lib/readContent.ts';
import { loadContent } from '../src/content/load.ts';

const ID = 'virtual:content';
const RESOLVED = '\0' + ID;

/** Serves content/*.json as `virtual:content` and fails the build if it is invalid. */
export function contentPlugin(opts: { includePacks: boolean; contentDir?: string }): Plugin {
  return {
    name: 'content',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null;
      const files = readContentFiles(opts.includePacks, opts.contentDir);
      loadContent(files); // throws on schema / cross-ref / FR-EN string errors
      return `export default ${JSON.stringify(files)};`;
    },
    configureServer(server) {
      server.watcher.add(opts.contentDir ?? CONTENT_DIR);
      server.watcher.on('change', (f) => {
        if (f.replace(/\\/g, '/').includes('/content/')) {
          const mod = server.moduleGraph.getModuleById(RESOLVED);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
