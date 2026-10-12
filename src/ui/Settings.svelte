<script lang="ts">
  import { content } from '../content/index.ts';
  import { setLang, t } from '../i18n/i18n.svelte.ts';
  import type { Lang } from '../content/schema.ts';
  import type { LoadErrorCode } from '../save/save.ts';
  import { buildMenuView, describeImportResult, parseSeedInput } from '../view/menu.ts';
  import { game, exportSave, importSave, newGameNow } from './game.svelte.ts';

  let { onclose }: { onclose: () => void } = $props();

  const v = $derived(buildMenuView(content, t, !game.devMode));
  const langNames: Record<Lang, string> = { en: 'English', fr: 'Français' };

  let seedText = $state('');
  let seedBad = $state(false);
  let exported = $state('');
  let importOpen = $state(false);
  let importText = $state('');
  // Stored as a code, translated at render time so it follows a language switch.
  let importResult = $state<null | 'ok' | LoadErrorCode>(null);
  const importLine = $derived(importResult ? describeImportResult(t, importResult) : null);

  // The confirmation is in the page: a native confirm() can be blocked by the browser and then the button does nothing.
  let confirming = $state(false);
  function askNewGame() {
    const parsed = parseSeedInput(seedText);
    seedBad = !parsed.ok;
    confirming = parsed.ok;
  }
  function doNewGame() {
    const parsed = parseSeedInput(seedText);
    seedBad = !parsed.ok;
    confirming = false;
    if (!parsed.ok) return;
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
      importOpen = false;
      onclose();
    }
  }
</script>

<section class="card settings" aria-labelledby="settings-title">
  <h2 id="settings-title">{v.title}</h2>

  <div class="group">
    <span class="overline" id="lang-label">{v.languageLabel}</span>
    <div class="seg" role="radiogroup" aria-labelledby="lang-label">
      {#each v.languages as l (l.value)}
        <button class="opt" class:on={l.value === v.language} role="radio" aria-checked={l.value === v.language} onclick={() => setLang(l.value)}>
          {langNames[l.value]}
        </button>
      {/each}
    </div>
  </div>

  <div class="group sep">
    <span class="overline">{v.newGame.title}</span>
    <div class="row">
      <input type="text" inputmode="numeric" placeholder={v.newGame.seedLabel} aria-label={v.newGame.seedLabel} bind:value={seedText} oninput={() => { seedBad = false; confirming = false; }} />
      {#if !confirming}<button class="btn3 warn big" onclick={askNewGame}>{v.newGame.startOver}</button>{/if}
    </div>
    {#if confirming}
      <div class="confirm" role="alertdialog" aria-label={v.newGame.confirm}>
        <span class="bad">{v.newGame.confirm}</span>
        <div class="row">
          <button class="btn3 warn big" onclick={doNewGame}>{v.newGame.button}</button>
          <button class="btn3 big" onclick={() => (confirming = false)}>{t('craft.cancel')}</button>
        </div>
      </div>
    {/if}
    <span class="note2">{v.newGame.seedHint}</span>
    <span class="note2">{v.newGame.note}</span>
    {#if seedBad}<span class="bad" role="alert">{t('save.seedInvalid')}</span>{/if}
  </div>

  <div class="group sep">
    <span class="overline">{v.save.title}</span>
    <div class="row two">
      <button class="btn3 big" onclick={doExport}>{v.save.exportLabel}</button>
      <button class="btn3 big" aria-expanded={importOpen} onclick={() => (importOpen = !importOpen)}>{v.save.importTitle}</button>
    </div>
    {#if exported}<textarea readonly rows="3" value={exported} aria-label={v.save.exportLabel} onfocus={(e) => e.currentTarget.select()}></textarea>{/if}
    {#if importOpen}
      <textarea rows="3" placeholder={v.save.importHint} aria-label={v.save.importTitle} bind:value={importText}></textarea>
      <div class="row"><button class="btn3" onclick={doImport} disabled={!importText.trim()}>{v.save.loadLabel}</button></div>
    {/if}
    {#if importLine}<span class={importLine.ok ? 'ok' : 'bad'} role="status">{importLine.text}</span>{/if}
    <span class="note2">{v.save.note}</span>
  </div>

  <button class="btn big back" onclick={onclose}>{v.back}</button>
</section>

<style>
  .settings { max-width: 620px; border-radius: 22px; padding: 24px 28px; display: flex; flex-direction: column; gap: 22px; }
  .group { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .sep { padding-top: 18px; border-top: 1px solid var(--line); }
  .seg { display: flex; background: var(--panel2); border-radius: 12px; padding: 4px; gap: 2px; align-self: flex-start; }
  .opt { min-height: 44px; padding: 0 22px; border: 0; border-radius: 9px; background: transparent; color: var(--ink); font: 500 15px/1.2 var(--body); }
  .opt.on { background: var(--btn); box-shadow: var(--btnShadow); color: var(--accentInk); font-weight: 700; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; }
  input[type='text'] {
    min-height: 48px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--ink);
    font: 500 15px var(--mono);
    width: 220px;
    max-width: 100%;
  }
  textarea { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 10px; background: var(--bg); color: var(--ink); font: 500 12px var(--mono); }
  .btn3.big { min-height: 48px; padding: 0 20px; }
  .note2 { font-size: 13px; color: var(--muted); }
  .ok { color: var(--ok); font-size: 14px; }
  .bad { color: var(--warn); font-size: 14px; word-break: break-word; }
  .confirm { display: flex; flex-direction: column; gap: 8px; }
  .back { align-self: flex-start; }
  @media (max-width: 640px) {
    .settings { padding: 18px 16px; }
    .seg { align-self: stretch; }
    .opt { flex: 1; padding: 0 8px; }
    .row.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    input[type='text'] { width: 100%; }
    .row .btn3.warn { width: 100%; }
    .back { align-self: stretch; }
  }
</style>
