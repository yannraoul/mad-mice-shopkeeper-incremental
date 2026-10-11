import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { contentPlugin } from './scripts/contentPlugin.ts';

// `--mode preview` builds WITHOUT the optional packs (ending, plot errands):
// anything shipped to the browser is readable, so they are excluded here.
export default defineConfig(({ mode }) => ({
  plugins: [svelte(), contentPlugin({ includePacks: mode !== 'preview' })],
  base: './',
}));
