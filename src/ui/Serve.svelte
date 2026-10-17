<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildServeView } from '../view/serve.ts';
  import { game, dispatch } from './game.svelte.ts';
  import Board from './Board.svelte';
  import CounterScene from './CounterScene.svelte';
  import ImageSlot from './ImageSlot.svelte';
  import Pips from './Pips.svelte';
  import QueueList from './QueueList.svelte';

  const v = $derived(buildServeView(content, game.s, t, game.feed));
  // The customer whose row is open (none once they have left or been served).
  let selectedId = $state<number | null>(null);
  const selected = $derived(v.customers.some((c) => c.id === selectedId) ? selectedId : null);
  // Today's board waits in a drawer so the counter has the room.
  let drawer = $state(false);
</script>

<section class="frame counter" aria-labelledby="counter-title">
  <div class="head">
    <h2 id="counter-title">{v.title}</h2>
    <span class="muted summary">{v.summary}</span>
    <button class="btn3 drawerbtn" onclick={() => (drawer = !drawer)}>{t('craft.openBoard')}</button>
  </div>

  <div class="top">
    <CounterScene
      customers={v.customers}
      outside={v.outside}
      clerks={v.workers.map((w) => ({ id: w.id, active: w.toggles.some((tg) => tg.on) }))}
      {selected}
      onselect={(id) => (selectedId = id)}
    />
    <div class="listcol">
      <QueueList ranked={v.ranked} {selected} onselect={(id) => (selectedId = id)} serveLabel={t('serve.serveBest')} nobody={v.nobody} pick={t('serve.pickOne')} />
    </div>
  </div>

  <div class="stock">
    <div class="shead"><span class="overline">{v.stock.title}</span><span class="mono muted legend">{v.stock.legend}</span></div>
    {#if v.stock.rows.length === 0}
      <span class="muted small">{v.stock.empty}</span>
    {:else}
      <div class="chips">
        {#each v.stock.rows as r (r.candy)}
          <span class="chip" title={r.name}><ImageSlot id={r.art} width={26} /><span class="mono">{r.text}</span></span>
        {/each}
      </div>
    {/if}
  </div>

  {#if v.closeWarning}<p class="warn"><span aria-hidden="true">▲</span>{v.closeWarning}</p>{/if}

  <div class="bottom">
    {#each v.workers as w (w.id)}
      {@const todo = w.training.filter((x) => !x.trained)}
      <section class="clerk">
        <div class="crow">
          <span class="art"><ImageSlot id={w.art} width={36} /></span>
          <b class="cname">{w.name}</b>
          {#each w.toggles as tg (tg.customerType)}
            <label class="switch" aria-label={tg.label} title={tg.label}>
              <input type="checkbox" role="switch" checked={tg.on} onchange={(e) => dispatch(e.currentTarget.checked ? tg.setOn : tg.setOff)} />
              <span class="track"><span class="knob"></span></span>
              <span class="lbl">{tg.shortLabel}</span>
            </label>
          {/each}
        </div>
        {#if todo.length > 0}
          <details class="train">
            <summary class="muted small">{todo[0]!.text}{todo.length > 1 ? ` (+${todo.length - 1})` : ''}</summary>
            {#each todo as tr (tr.candy)}
              <div class="bar">
                <div class="barhead"><span>{tr.name}</span><span class="mono muted">{tr.byHand}</span></div>
                <Pips n={tr.made} total={tr.need} height={6} />
              </div>
            {/each}
          </details>
        {/if}
      </section>
    {/each}
    {#if v.feed}
      <section class="latest" aria-label={v.feed.title}>
        {#each v.feed.lines.slice(0, 2) as line, i (i)}
          <div class="line" class:dim={i > 0}><span class:acc={i === 0} aria-hidden="true">●</span>{line}</div>
        {/each}
      </section>
    {/if}
  </div>
</section>

{#if drawer}
  <button class="scrim" aria-label={t('craft.closeBoard')} onclick={() => (drawer = false)}></button>
  <aside class="drawer" aria-label={t('craft.openBoard')}>
    <button class="btn3 close" onclick={() => (drawer = false)}>{t('craft.closeBoard')}</button>
    <Board variant="serve" feed={v.feed} />
  </aside>
{/if}

<style>
  .counter { display: flex; flex-direction: column; gap: 14px; }
  .head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .drawerbtn { margin-left: auto; align-self: center; }
  .summary { font-size: 14px; }
  .small { font-size: 13px; }
  /* The scene on the left and the queue list on the right; the list is as tall as the scene and scrolls inside it. */
  .top { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 16px; align-items: stretch; }
  .listcol { position: relative; min-height: 260px; }
  .listcol > :global(*) { position: absolute; inset: 0; overflow-y: auto; }

  .stock { display: flex; flex-direction: column; gap: 6px; }
  .shead { display: flex; align-items: baseline; justify-content: space-between; }
  .legend { font-size: 12px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px 3px 4px; border-radius: 10px; background: var(--panel2); border: 1px solid var(--line); font-size: 13px; }
  .warn { color: var(--warn); font-size: 14px; display: flex; gap: 8px; margin: 0; }

  .bottom { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; }
  .clerk { flex: 1 1 320px; display: flex; flex-direction: column; gap: 6px; background: var(--panel2); border: 1px solid var(--line); border-radius: 14px; padding: 8px 12px; min-width: 0; }
  .crow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .art :global(.slot), .art :global(img) { border-radius: 10px; }
  .cname { font: 400 17px/1.2 var(--display); }
  .switch { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; cursor: pointer; position: relative; }
  .switch input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .track { width: 46px; height: 26px; border-radius: 999px; background: var(--line); position: relative; flex: none; transition: background 0.12s; }
  .knob { position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--ink); transition: left 0.12s; }
  input:checked + .track { background: var(--accent); }
  input:checked + .track .knob { left: 23px; background: var(--accentInk); }
  input:focus-visible + .track { box-shadow: var(--focusRing); }
  .lbl { font-size: 13px; line-height: 1.25; }
  .train summary { cursor: pointer; }
  .bar { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
  .barhead { display: flex; justify-content: space-between; font-size: 13px; gap: 8px; }
  .latest { flex: 1 1 260px; display: flex; flex-direction: column; gap: 4px; padding: 8px 4px; min-width: 0; }
  .latest .line { font-size: 14px; display: flex; gap: 8px; }
  .latest .line.dim { color: var(--muted); }
  .latest .acc { color: var(--accent); }

  .scrim { position: fixed; inset: 0; z-index: 20; border: 0; background: rgba(0, 0, 0, 0.45); cursor: default; }
  .drawer {
    position: fixed; z-index: 21; top: 0; right: 0; bottom: 0; width: min(380px, 100%); overflow-y: auto; padding: 16px;
    background: var(--bg); display: flex; flex-direction: column; gap: 16px; box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4); animation: slide 0.2s ease-out;
  }
  .close { align-self: flex-end; }
  @keyframes slide { from { transform: translateX(100%); } }

  @media (max-width: 640px) {
    .top { grid-template-columns: minmax(0, 1fr); }
    .listcol { min-height: 0; }
    .listcol > :global(*) { position: static; }
    .drawer { top: auto; left: 0; width: auto; max-height: 85vh; border-radius: 16px 16px 0 0; animation-name: rise; }
    @keyframes rise { from { transform: translateY(100%); } }
  }
  @media (prefers-reduced-motion: reduce) { .drawer { animation: none; } }
</style>
