import { readContentFiles } from './lib/readContent.ts';
import { loadContent } from '../src/content/load.ts';

// Validates the full content (core + every pack) and the preview content (core only).
for (const includePacks of [true, false]) {
  const label = includePacks ? 'full' : 'preview';
  try {
    const c = loadContent(readContentFiles(includePacks));
    console.log(
      `content OK (${label}): ${c.candies.length} candies, ${c.customerTypes.length} customer types, ` +
        `${Object.keys(c.strings.en).length} EN / ${Object.keys(c.strings.fr).length} FR strings`,
    );
  } catch (e) {
    console.error(`content INVALID (${label}):\n${(e as Error).message}`);
    process.exit(1);
  }
}
