# ending pack

Optional pack: the true ending (text, art slots). Same file layout as `content/core/`
(`strings/en.json`, `strings/fr.json`, table files). Included in full builds only;
`npm run build:preview` excludes it at build time, so it never reaches the browser.
