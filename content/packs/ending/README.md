# ending pack

Optional pack: the true ending (text, art slots). Same file layout as `content/core/`
(`strings/en.json`, `strings/fr.json`, table files). Included in full builds only;
`npm run build:preview` excludes it at build time, so it never reaches the browser, and
`npm run verify:preview` checks that none of this pack's text is in `dist-preview/`.

Currently holds `ending.text` (EN/FR), shown on the stage bar once the final stage is cleared. The text is a placeholder.
