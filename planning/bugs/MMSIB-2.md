# MMSIB-2 — Craft screen: slot images show as broken icons

**Reported:** After clicking "Commencer", the shelf and cauldron showed broken-image icons with their alt text ("Miel", "Chaudron") instead of the placeholder art (French UI, screenshot from the user's machine).

**Root cause:** Not reproduced with the app at its root URL; the same files load fine there. What is established: `ImageSlot` used the page-relative path `art/<file>.svg`, and the dev server answers a path that does not resolve to a file with `200 text/html` (the SPA fallback, verified with `/art/does-not-exist.svg`), which an `<img>` treats as a decode error, so any path mismatch (page opened from a different path or base, or stale/foreign server) produces exactly this symptom. Images only mount after "Commencer", which is why the problem appeared then. The exact cause on the user's machine is unconfirmed.

**Fix:** Image URLs are built from `import.meta.env.BASE_URL` instead of the current page path. If an image still fails to load, the slot now renders a dashed box of the same fixed size labelled with the slot id and size (never a broken icon, no layout shift) and logs the resolved URL with `console.warn`, so the real cause is visible in the console.

**Verified:** With `ingredient-honey.svg` temporarily moved away (dev server): the honey slot rendered the 96px labelled fallback box, the other slot loaded normally, console warning printed; file restored. `npm run check` 0 errors, `npm test` 40 passing, build clean. Not verified: the user's own setup.

**Open follow-up:** Needs the user's page URL / how the app is launched (dev server, `vite preview`, opened `dist`) and the console warning text if it still happens. A real 404 for missing `public/` files would be clearer than the HTML fallback but is Vite's default behaviour.
