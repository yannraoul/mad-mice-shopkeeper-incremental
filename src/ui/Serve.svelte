<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildServeView } from '../view/serve.ts';
  import { game, dispatch } from './game.svelte.ts';
  import { media } from './media.svelte.ts';
  import Board from './Board.svelte';
  import ImageSlot from './ImageSlot.svelte';
  import Pips from './Pips.svelte';

  const v = $derived(buildServeView(content, game.s, t, game.feed));
  const tierColor = { ok: 'var(--ok)', low: 'var(--accent)', urgent: 'var(--warn)' } as const;
  let clerkOpen = $state(false);
</script>

{#snippet clerk()}
  {#each v.workers as w (w.id)}
    <section class="card clerk" class:collapsed={media.narrow && !clerkOpen}>
      {#if media.narrow}
        <div class="clerkhead">
          <button class="exp" aria-expanded={clerkOpen} onclick={() => (clerkOpen = !clerkOpen)}>
            <span class="who"><b class="title">{w.name}</b>{#if w.toggles[0]}<span class="muted small">{w.toggles[0].shortLabel}</span>{/if}</span>
            <span aria-hidden="true">{clerkOpen ? '▴' : '▾'}</span>
          </button>
          {#each w.toggles as tg (tg.customerType)}
            <label class="switch" aria-label={tg.label}>
              <input type="checkbox" role="switch" checked={tg.on} onchange={(e) => dispatch(e.currentTarget.checked ? tg.setOn : tg.setOff)} />
              <span class="track"><span class="knob"></span></span>
            </label>
          {/each}
        </div>
      {/if}
      {#if !media.narrow || clerkOpen}
        <div class="clerkbody">
          <div class="top">
            <span class="clerkart"><ImageSlot id={w.art} /></span>
            <div class="side">
              {#if !media.narrow}<h3>{w.name}</h3>{/if}
              {#each w.toggles as tg (tg.customerType)}
                <label class="switch withlabel">
                  <input type="checkbox" role="switch" checked={tg.on} onchange={(e) => dispatch(e.currentTarget.checked ? tg.setOn : tg.setOff)} />
                  <span class="track"><span class="knob"></span></span>
                  <span class="lbl">{tg.label}</span>
                </label>
              {/each}
            </div>
          </div>
          {#each w.training.filter((x) => x.trained) as tr (tr.candy)}<div class="muted small">{tr.text}</div>{/each}
          {#each w.training.filter((x) => !x.trained) as tr (tr.candy)}
            <div class="bar">
              <div class="barhead"><span>{tr.name}</span><span class="mono muted">{tr.byHand}</span></div>
              <Pips n={tr.made} total={tr.need} height={6} />
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
{/snippet}

{#snippet latest()}
  {#if v.feed && !media.narrow}
    <section class="card latest">
      <h3>{v.feed.title}</h3>
      {#each v.feed.lines as line, i (i)}
        <div class="line" class:dim={i > 0}><span class:acc={i === 0} aria-hidden="true">●</span>{line}</div>
      {/each}
    </section>
  {/if}
{/snippet}

<div class="cols">
  {#if media.narrow}<Board variant="serve" feed={v.feed} />{/if}

  <section class="frame counter" aria-labelledby="counter-title">
    <div class="head">
      <h2 id="counter-title">{v.title}</h2>
      <span class="muted summary">{v.summary}</span>
    </div>

    <div class="grid">
      {#each v.customers as cu (cu.id)}
        {@const m = cu.patienceMeter}
        <article class="cust" class:urgent={m.tier === 'urgent'}>
          <div class="body">
            <ImageSlot id={cu.portrait} />
            <div class="main">
              <div class="who">
                <b class="type">{cu.name}</b>
                <span class="mono muted small">{cu.budgetText}</span>
              </div>
              <div class="wants">
                {#if cu.art}<ImageSlot id={cu.art} width={48} />{/if}
                <div class="wtext">
                  <span class="muted small">{cu.wantsLabel}</span>
                  <b>{cu.candyName}</b>
                  <span class="small">{cu.atLeastLabel} <b>{cu.qualityName}</b></span>
                </div>
              </div>
              <div class="meter" role="meter" aria-valuemin="0" aria-valuemax={m.max} aria-valuenow={m.left} aria-label={m.label}>
                <span class="mlabel" style:color={tierColor[m.tier]}>{m.label}</span>
                <Pips n={m.left} total={m.max} color={tierColor[m.tier]} height={10} />
              </div>
            </div>
          </div>
          <div class="acts">
            {#each cu.options as o (o.candy + o.quality)}
              <button class="btn opt" disabled={!o.enabled} onclick={() => dispatch(o.action)}>
                <span>{o.label}</span>
                <span class="hearts" aria-hidden="true">{o.heartsText}</span>
                {#if o.tipText}<span class="tip">{o.tipText}</span>{/if}
              </button>
            {/each}
            {#if cu.nothingFits}<span class="reason"><span aria-hidden="true">⊘</span>{cu.nothingFits}</span>{/if}
            <button class="btn3 refuse" onclick={() => dispatch(cu.refuse.action)}>{cu.refuse.label}</button>
          </div>
        </article>
      {:else}
        <p class="muted">{v.nobody}</p>
      {/each}
    </div>

    {#if v.closeWarning}<p class="warn"><span aria-hidden="true">▲</span>{v.closeWarning}</p>{/if}
  </section>

  <aside class="rail">
    {@render clerk()}
    {#if !media.narrow}<Board variant="serve" />{/if}
    {@render latest()}
  </aside>
</div>

<style>
  .cols { display: flex; flex-wrap: wrap; gap: var(--gap); align-items: flex-start; }
  .cols > :global(.today) { flex: 1 1 100%; }
  .counter { flex: 3 1 560px; display: flex; flex-direction: column; gap: 18px; }
  .rail { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .summary { font-size: 14px; }
  .small { font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .cust { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .cust.urgent { border-color: var(--warn); box-shadow: 0 0 0 3px color-mix(in srgb, var(--warn) 22%, transparent); }
  .body { display: flex; gap: 14px; align-items: flex-start; }
  .main { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
  .who { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .type { font: 400 20px/1.2 var(--display); }
  .wants { display: flex; align-items: center; gap: 10px; background: var(--panel2); border-radius: 12px; padding: 8px; }
  .wtext { display: flex; flex-direction: column; font-size: 14px; min-width: 0; }
  .meter { display: flex; align-items: center; gap: 8px; }
  .mlabel { font: 700 12px/1.2 var(--body); min-width: 70px; }
  .acts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .reason { flex: 1; font-size: 13px; color: var(--muted); line-height: 1.3; display: flex; gap: 6px; min-width: 120px; }
  .refuse { margin-left: auto; }
  .opt { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .hearts { letter-spacing: 1px; }
  .tip { font-size: 12px; opacity: 0.85; }
  .warn { color: var(--warn); font-size: 14px; display: flex; gap: 8px; }

  .card { display: flex; flex-direction: column; gap: 12px; }
  .clerk .top { display: flex; gap: 12px; align-items: center; }
  .clerkart :global(.slot) { background: var(--slotC); border-radius: 14px; }
  .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .side h3 { font-size: 20px; }
  .switch { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; position: relative; }
  .switch input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .track { width: 46px; height: 26px; border-radius: 999px; background: var(--line); position: relative; flex: none; transition: background 0.12s; }
  .knob { position: absolute; left: 3px; top: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--ink); transition: left 0.12s; }
  input:checked + .track { background: var(--accent); }
  input:checked + .track .knob { left: 23px; background: var(--accentInk); }
  input:focus-visible + .track { box-shadow: var(--focusRing); }
  .lbl { font-size: 13px; line-height: 1.25; }
  .bar { display: flex; flex-direction: column; gap: 4px; }
  .barhead { display: flex; justify-content: space-between; font-size: 13px; gap: 8px; }
  .clerkbody { display: flex; flex-direction: column; gap: 12px; }
  .clerkhead { display: flex; align-items: center; gap: 12px; }
  .exp { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; background: transparent; border: 0; padding: 0; text-align: left; color: var(--ink); }
  .exp .who { display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; }
  .exp .title { font: 400 18px/1.2 var(--display); }
  .clerk.collapsed { min-height: 60px; justify-content: center; padding: 8px 14px; }

  .latest { gap: 8px; }
  .latest .line { font-size: 14px; display: flex; gap: 8px; }
  .latest .line.dim { color: var(--muted); }
  .latest .acc { color: var(--accent); }

  @media (max-width: 640px) {
    .counter { flex-basis: 100%; }
    .rail { flex-basis: 100%; }
    .grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .cust { background: var(--panel2); border-radius: 16px; }
    .type { font-size: 19px; }
    .acts .btn { flex: 1; min-height: 48px; }
    .refuse { min-height: 48px; }
  }
</style>
