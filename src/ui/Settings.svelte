<script lang="ts">
  import { content } from '../content/index.ts';
  import { setLang, t } from '../i18n/i18n.svelte.ts';
  import type { Lang } from '../content/schema.ts';
  import type { LoadErrorCode } from '../save/save.ts';
  import { buildMenuView, describeImportResult, parseSeedInput } from '../view/menu.ts';
  import { game, exportSave, importSave, newGameNow } from './game.svelte.ts';

  let { onclose }: { onclose: () => void } = $props();

  const v = $derived(buildMenuView(content, t, !game.devMode));

  let seedText = $state('');
  let seedBad = $state(false);
  let exported = $state('');
  let importText = $state('');
  // Stored as a code, translated at render time so it follows a language switch.
  let importResult = $state<null | 'ok' | LoadErrorCode>(null);
  const importLine = $derived(importResult ? describeImportResult(t, importResult) : null);

  function doNewGame() {
    const parsed = parseSeedInput(seedText);
    seedBad = !parsed.ok;
    if (!parsed.ok) return;
    if (!confirm(v.newGame.confirm)) return;
    newGameNow(parsed.seed);
    seedText = '';
    exported = '';
    importResult = null;
    onclose();
  }
  function doExport() {
    exported = exportSave();
    navigator.clipboard?.writeText(exported).catch(() => {});
  }
  function doImport() {
    const err = importSave(importText);
    importResult = err ?? 'ok';
    if (!err) {
      importText = '';
      onclose();
    }
  }
</script>

<div class="settings">
  <section class="panel">
    <div class="row head">
      <h2>{v.title}</h2>
      <button onclick={onclose}>{v.back}</button>
    </div>
    <label class="lang">
      {v.languageLabel}
      <select value={v.language} onchange={(e) => setLang(e.currentTarget.value as Lang)}>
        {#each v.languages as l}<option value={l.value}>{l.label}</option>{/each}
      </select>
    </label>
  </section>

  <section class="panel">
    <h2>{v.newGame.title}</h2>
    <label>
      {v.newGame.seedLabel}
      <input type="text" inputmode="numeric" bind:value={seedText} oninput={() => (seedBad = false)} />
    </label>
    <p class="muted">{v.newGame.seedHint}</p>
    {#if seedBad}<p class="bad">{t('save.seedInvalid')}</p>{/if}
    <div class="row"><button class="primary" onclick={doNewGame}>{v.newGame.button}</button></div>
  </section>

  <section class="panel">
    <h2>{v.save.title}</h2>
    <p class="muted">{v.save.note}</p>
    <div class="row"><button onclick={doExport}>{v.save.exportLabel}</button></div>
    {#if exported}<textarea readonly rows="3" value={exported} onfocus={(e) => e.currentTarget.select()}></textarea>{/if}
    <h3>{v.save.importTitle}</h3>
    <textarea rows="3" placeholder={v.save.importHint} bind:value={importText}></textarea>
    <div class="row"><button onclick={doImport} disabled={!importText.trim()}>{v.save.loadLabel}</button></div>
    {#if importLine}<p class={importLine.ok ? 'ok' : 'bad'}>{importLine.text}</p>{/if}
  </section>
</div>

<style>
  .settings { display: grid; gap: var(--gap); max-width: 40rem; }
  .head { justify-content: space-between; }
  .head h2 { margin: 0; }
  label { display: grid; gap: 0.2rem; font-size: 0.9rem; max-width: 20rem; }
  input[type='text'], textarea {
    width: 100%; font: inherit; background: var(--panel); color: inherit;
    border: 1px solid var(--line); border-radius: 8px; padding: 0.4rem;
  }
  textarea { font-size: 0.8rem; margin: 0.4rem 0; }
  .ok { color: var(--ok); margin: 0; }
  .bad { color: var(--warn); margin: 0; word-break: break-word; }
</style>
