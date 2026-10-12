<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildEveningView, type TreeNode } from '../view/evening.ts';
  import { game, dispatch } from './game.svelte.ts';
  import { media } from './media.svelte.ts';
  import Errands from './Errands.svelte';
  import MapStrip from './MapStrip.svelte';
  import Pips from './Pips.svelte';

  const v = $derived(buildEveningView(content, game.s, t));
  const color = (id: string) => (id === 'kitchen' ? 'var(--kit)' : id === 'shop' ? 'var(--shop)' : 'var(--tem)');
  // Phone: one branch at a time, picked with tabs. Stored as an id; falls back to the first branch.
  let tab = $state('kitchen');
  const shown = $derived(media.narrow ? v.tree.branches.filter((b) => b.id === tab) : v.tree.branches);
  const legend = $derived([
    { text: t('tree.owned'), cls: 'own', glyph: '●' },
    { text: t('tree.state.afford'), cls: 'afford', glyph: '●' },
    { text: t('tree.legend.short'), cls: '', glyph: '◌' },
    { text: t('tree.state.locked'), cls: '', glyph: '🔒' },
  ]);
  const done = (n: TreeNode) => n.state === 'owned' || n.state === 'maxed';
</script>

<div class="cols">
  <div class="main">
    <div class="top">
      {#if v.journal}
        <section class="note journal">
          <span class="overline">{v.journal.title} · {v.journal.dayLine}</span>
          <p>{v.journal.text}</p>
        </section>
      {/if}
      <section class="card report">
        <h3>{v.report.title}</h3>
        <div class="stats">
          {#each v.report.stats as r, i (i)}
            <div class="stat"><span class="val" class:hl={r.highlight}>{r.value}</span><span class="cap">{r.label}</span></div>
          {/each}
        </div>
      </section>
    </div>

    <section class="frame tree" aria-labelledby="tree-title">
      <div class="thead">
        <h2 id="tree-title">{v.tree.title}</h2>
        <ul class="legend">
          {#each legend as l}<li class={l.cls}><span aria-hidden="true">{l.glyph}</span> {l.text}</li>{/each}
        </ul>
      </div>

      {#if media.narrow}
        <div class="tabs" role="tablist">
          {#each v.tree.branches as b (b.id)}
            <button
              role="tab"
              class="tab"
              class:active={tab === b.id}
              aria-selected={tab === b.id}
              style:--c={color(b.id)}
              onclick={() => (tab = b.id)}
            >
              <span class="glyph" aria-hidden="true">{b.glyph}</span>
              <b>{b.name}</b>
              <span class="small muted">{b.affordText}</span>
            </button>
          {/each}
        </div>
      {/if}

      <div class="branches">
        {#each shown as b (b.id)}
          {@const c = color(b.id)}
          <div class="branch" style:--c={c}>
            {#if !media.narrow}
              <div class="bhead"><span class="glyph" aria-hidden="true">{b.glyph}</span><b>{b.name}</b></div>
            {/if}
            {#each b.nodes as n (n.id)}
              <article class="node {n.state}">
                {#if done(n)}<span class="badge" aria-hidden="true">✓</span>{/if}
                <div class="nhead">
                  <b>{n.name}</b>
                  {#if n.stateLabel}<span class="state">{n.stateLabel}</span>{/if}
                </div>
                <p class="desc">{n.description}</p>
                {#if n.pips}
                  <div class="levels">
                    <Pips n={n.pips.level} total={n.pips.max} color={c} />
                    <span class="mono lv">{n.pips.level} / {n.pips.max}</span>
                  </div>
                {/if}
                {#if n.buy && n.state !== 'locked'}
                  {@const buy = n.buy}
                  <button class="buy" class:btn={n.state === 'afford'} disabled={!buy.enabled} onclick={() => dispatch(buy.action)}>{buy.label}</button>
                {/if}
                {#if n.shortBy}<p class="small muted">{n.shortBy}</p>{/if}
                {#if n.lockReason}<p class="small muted"><span aria-hidden="true">🔒</span> {n.lockReason}</p>{/if}
              </article>
            {/each}
          </div>
        {/each}
      </div>
    </section>
  </div>

  {#if v.map || v.errands}
    <aside class="rail">
      <MapStrip view={v.map} />
      <Errands view={v.errands} />
    </aside>
  {/if}
</div>

<style>
  .cols { display: flex; flex-wrap: wrap; gap: var(--gap); align-items: flex-start; }
  .main { flex: 3 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .rail { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .small { font-size: 12px; }
  .top { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 16px; }
  .journal { padding: 20px 24px; display: flex; flex-direction: column; gap: 6px; transform: rotate(-0.4deg); }
  .journal p { font: italic 400 22px/1.3 var(--display); }
  .report { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .stat { display: flex; flex-direction: column; }
  .val { font: 400 24px/1.1 var(--display); }
  .val.hl { color: var(--accent); }
  .cap { font-size: 12px; color: var(--muted); }

  .tree { display: flex; flex-direction: column; gap: 18px; padding: 20px 24px; }
  .thead { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px 14px; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0; padding: 0; list-style: none; font-size: 12px; color: var(--muted); }
  .legend .afford { color: var(--accent); }
  .branches { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
  .branch { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .bhead { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: var(--panel2); color: var(--c); border-bottom: 3px solid var(--c); }
  .bhead b { font: 400 18px/1.2 var(--display); }
  .glyph { font-size: 18px; }
  .node {
    position: relative;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .node.afford { border-color: var(--c); box-shadow: inset 3px 0 0 var(--c); }
  .node.locked { opacity: 0.6; }
  .node.owned, .node.maxed { border-color: var(--c); background: color-mix(in srgb, var(--c) 13%, var(--panel)); }
  .nhead { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
  .nhead b { font-size: 15px; }
  .state { font: 700 11px/1.2 var(--body); color: var(--accent); white-space: nowrap; }
  .locked .state { color: var(--muted); }
  .owned .state, .maxed .state { color: var(--c); }
  .desc { font-size: 13px; line-height: 1.35; color: var(--muted); }
  .levels { display: flex; align-items: center; gap: 6px; }
  .lv { font-size: 12px; color: var(--muted); margin-left: 6px; }
  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--c);
    color: var(--bg);
    display: grid;
    place-items: center;
    font: 700 13px/1 var(--body);
    box-shadow: 0 0 0 3px var(--bg);
  }
  .buy { min-height: 44px; border-radius: 10px; border: 1px dashed var(--line); background: transparent; color: var(--muted); font: 700 15px/1.2 var(--body); }
  .buy.btn { border: 0; background: var(--btn); color: var(--accentInk); }
  .node p { margin: 0; }

  .tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .tab { display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 64px; padding: 6px 4px; border: 0; border-bottom: 3px solid transparent; border-radius: 10px 10px 0 0; background: transparent; color: var(--ink); text-align: center; }
  .tab b { font-size: 13px; }
  .tab.active { background: var(--panel2); border-bottom-color: var(--c); }
  .tab .glyph { color: var(--c); }

  @media (max-width: 640px) {
    .main, .rail { flex-basis: 100%; }
    .top { grid-template-columns: minmax(0, 1fr); }
    .journal { padding: 16px 18px; }
    .journal p { font-size: 20px; }
    .tree { padding: 14px; }
    .branches { grid-template-columns: minmax(0, 1fr); }
    .buy { min-height: 48px; }
    .legend { display: none; }
  }
</style>
