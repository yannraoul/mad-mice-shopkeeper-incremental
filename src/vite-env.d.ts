/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The secret that signs the finale code (see src/view/finaleCode.ts); set in .env.local, never committed. */
  readonly VITE_FINALE_SECRET?: string;
}

declare module 'virtual:content' {
  import type { RawFile } from './content/load.ts';
  const files: RawFile[];
  export default files;
}
