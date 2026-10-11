<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { step } from '../engine/engine.ts';
  import { journalKey } from '../engine/journal.ts';
  import { game, dispatch, exportSave, importSave, newGameNow } from './game.svelte.ts';
  import { describeFail } from './errors.ts';
  import type { LoadErrorCode } from '../save/save.ts';

  const s = $derived(game.s);
  const r = $derived(s.report);
  const journal = $derived(journalKey(content, s));

  const branches = ['kitchen', 'shop', 'temple'] as const;

  // The engine decides what can be bought: dry-run each purchase and read its refusal.
  const nodes = $derived(
    content.skillNodes.map((n) => {
      const level = s.nodes[n.id] ?? 0;
      const probe = step(content, s, { type: 'buy', node: n.id });
      return {
        n,
        level,
        max: n.costs.length,
        cost: n.costs[level],
        buyable: probe.ok,
        why: probe.ok ? '' : describeFail(probe.code, probe.params),
        maxed: level >= n.costs.length,
      };
    }),
  );

  // Save panel
  let exported = $state('');
  let importText = $state('');
  // Stored as a code, translated at render time so it follows a language switch.
  let saveResult = $state<null | 'ok' | LoadErrorCode>(null);

  function doExport() {
    exported = exportSave();
    navigator.clipboard?.writeText(exported).catch(() => {});
  }
  function doImport() {
    const err = importSave(importText);
    saveResult = err ?? 'ok';
    if (!err) importText = '';
  }
  function doNew() {
    if (confirm(t('save.confirmNew'))) {
      newGameNow();
      exported = '';
      saveResult = null;
    }
  }
</script>

<div class="screen">
    <section class="panel report">
      <h2>{t('evening.report')}</h2>
      <div>{t('evening.revenue', { n: r.revenue })}</div>
      <div>{t('evening.served', { n: r.served, auto: r.autoServed })}</div>
      <div>{t('evening.lost', { n: r.lost })}</div>
      <div>{t('evening.refused', { n: r.refused })}</div>
      <div>{t('evening.contracts', { n: r.contractsDone, expired: r.contractsExpired })}</div>
    </section>

    {#if journal}
      <section class="panel journalbox">
        <h2>{t('journal.title')}</h2>
        <p class="journal">{t(journal)}</p>
      </section>
    {/if}

  <section class="panel tree">
    <h2>{t('tree.title')} · {t('ui.money', { n: s.money })}</h2>
    {#each branches as branch (branch)}
      <h3>{t(`branch.${branch}`)}</h3>
      <div class="nodes">
        {#each nodes.filter((x) => x.n.branch === branch) as { n, level, max, cost, buyable, why, maxed } (n.id)}
          <article class="node" class:owned={level > 0}>
            <strong>{t(n.nameKey)}</strong>
            <div class="muted">{t(n.descKey)}</div>
            <div>{max > 1 ? t('tree.level', { n: level, max }) : level > 0 ? t('tree.owned') : ''}</div>
            {#if maxed}
              <div class="muted">{max > 1 ? t('tree.maxed') : ''}</div>
            {:else}
              <button class="primary" disabled={!buyable} onclick={() => dispatch({ type: 'buy', node: n.id })}>
                {t('tree.buy', { cost: cost ?? 0 })}
              </button>
              {#if !buyable}<div class="muted why">{why}</div>{/if}
            {/if}
          </article>
        {/each}
      </div>
    {/each}
  </section>

    <section class="panel savebox">
      <h2>{t('save.title')}</h2>
      <p class="muted">{game.devMode ? t('save.devMode') : t('save.autosaved')}</p>
      <div class="row">
        <button onclick={doExport}>{t('save.export')}</button>
        <button onclick={doNew}>{t('save.new')}</button>
      </div>
      {#if exported}<textarea readonly rows="3" value={exported} onfocus={(e) => e.currentTarget.select()}></textarea>{/if}
      <h3>{t('save.import')}</h3>
      <textarea rows="3" placeholder={t('save.importHint')} bind:value={importText}></textarea>
      <div class="row">
        <button onclick={doImport} disabled={!importText.trim()}>{t('save.load')}</button>
      </div>
      {#if saveResult === 'ok'}
        <p class="ok">{t('save.loaded')}</p>
      {:else if saveResult}
        <p class="bad">{t('save.error', { error: t(`save.error.${saveResult}`) })}</p>
      {/if}
    </section>
</div>

<style>
  .screen { display: grid; gap: var(--gap); }
  @media (min-width: 800px) {
    .screen { grid-template-columns: 20rem 1fr; grid-template-rows: repeat(3, auto) 1fr; align-items: start; }
    .report { grid-column: 1; grid-row: 1; }
    .journalbox { grid-column: 1; grid-row: 2; }
    .savebox { grid-column: 1; grid-row: 3; }
    .tree { grid-column: 2; grid-row: 1 / span 4; }
  }
  .journal { font-style: italic; margin: 0; }
  .nodes { display: grid; gap: var(--gap); grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); margin-bottom: var(--gap); }
  .node { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem; display: grid; gap: 0.35rem; align-content: start; }
  .node.owned { border-color: var(--accent); }
  .why { font-size: 0.85rem; }
  textarea { width: 100%; font: inherit; font-size: 0.8rem; background: var(--panel); color: inherit; border: 1px solid var(--line); border-radius: 8px; padding: 0.4rem; margin: 0.4rem 0; }
  .ok { color: var(--ok); margin: 0; }
  .bad { color: var(--warn); margin: 0; word-break: break-word; }
</style>
