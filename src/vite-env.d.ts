/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'virtual:content' {
  import type { RawFile } from './content/load.ts';
  const files: RawFile[];
  export default files;
}
