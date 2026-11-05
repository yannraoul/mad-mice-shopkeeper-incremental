# ending pack

Optional pack: the true ending (text, art slots). Same file layout as `content/core/`
(`strings/en.json`, `strings/fr.json`, table files). Included in full builds only;
`npm run build:preview` excludes it at build time, so it never reaches the browser, and
`npm run verify:preview` checks that none of this pack's text is in `dist-preview/`.

Holds `ending.text` (EN/FR), shown on the stage bar once the final stage is cleared, and the lines of the ending sequence: `ending.title` and `ending.beat.1` to `ending.beat.6` (the last one says the game goes on), played over the workshop once the final offering is made (`src/ui/EndingSequence.svelte`; the sequence is skipped when these are absent, as in the preview build). All of it is placeholder text.
