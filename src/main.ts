import { mount } from 'svelte';
import App from './ui/App.svelte';
import { content } from './content/index.ts';

// Warm the cache with every art slot so images are ready the first time a screen shows them.
for (const slot of content.artSlots) new Image().src = `${import.meta.env.BASE_URL}${slot.file}`;

mount(App, { target: document.getElementById('app')! });
