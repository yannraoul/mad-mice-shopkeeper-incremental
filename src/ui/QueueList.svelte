<script lang="ts">
  import type { CustomerCard } from '../view/serve.ts';
  import { dispatch } from './game.svelte.ts';
  import { customerColor } from './customerColor.ts';
  import { tokenSrc } from './tokenArt.ts';
  import ImageSlot from './ImageSlot.svelte';
  import Pips from './Pips.svelte';

  // The customers at the counter, those who would pay most right now first. One line each: who, what they want, the least
  // quality, what we would earn from them, and their patience in turns. "Serve" hands over the best offer in one click;
  // opening a row shows the other offers and the Refuse button.
  let {
    ranked,
    selected,
    onselect,
    serveLabel,
    nobody,
    pick,
  }: { ranked: CustomerCard[]; selected: number | null; onselect: (id: number | null) => void; serveLabel: string; nobody: string; pick: string } = $props();

  // Picking a customer in the scene opens their row: bring it into view if the list is scrolled elsewhere.
  $effect(() => {
    if (selected === null) return;
    const id = selected;
    queueMicrotask(() => document.getElementById(`queue-row-${id}`)?.scrollIntoView({ block: 'nearest' }));
  });

  // Customer pictures that exist (art/tokens/customer-<type>-<n>.png): their chip shows the token instead of a coloured letter.
  let faces = $state<Record<string, boolean>>({});
  const base = import.meta.env.BASE_URL;

  const tierColor = { ok: 'var(--ok)', low: 'var(--accent)', urgent: 'var(--warn)' } as const;
</script>

{#if ranked.length === 0}
  <p class="muted empty">{nobody}</p>
{:else}
  <ul class="list" aria-label={pick}>
    {#each ranked as cu (cu.id)}
      {@const m = cu.patienceMeter}
      <li class="row" id="queue-row-{cu.id}" class:sel={selected === cu.id} class:urgent={m.tier === 'urgent'}>
        <div class="line">
          <button class="who" aria-expanded={selected === cu.id} onclick={() => onselect(selected === cu.id ? null : cu.id)}>
            <span class="chip" class:face={faces[cu.type]} style:background={customerColor(cu.type)} aria-hidden="true">
              {cu.name[0]}<img src={tokenSrc(base, cu.type, cu.id)} alt="" onload={() => (faces[cu.type] = true)} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            </span>
            <span class="want">
              {#if cu.art}<ImageSlot id={cu.art} width={26} />{:else}<b class="star" aria-hidden="true">★</b>{/if}
              <span class="wname"><b>{cu.candyName}</b><span class="muted small">{cu.name} · {cu.bubble.quality}+ · {cu.budgetText}</span></span>
            </span>
          </button>
          <span class="pay mono" class:none={!cu.best} title={cu.budgetText}>{cu.best ? cu.best.text : '—'}</span>
          <span class="pat" role="meter" aria-valuemin="0" aria-valuemax={m.max} aria-valuenow={m.left} aria-label={m.label} title={m.label}>
            <Pips n={m.left} total={m.max} color={tierColor[m.tier]} height={8} />
          </span>
          <button class="btn serve" disabled={!cu.best} onclick={() => cu.best && dispatch(cu.best.action)}>{serveLabel}</button>
        </div>
        {#if selected === cu.id}
          <div class="more">
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
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty { padding: 12px; }
  .list { list-style: none; margin: 0; padding: 0 4px 0 0; display: flex; flex-direction: column; gap: 6px; }
  .row { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 6px 8px; }
  .row.sel { border-color: var(--accent); background: var(--panel2); }
  .row.urgent { border-color: var(--warn); }
  .line { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; gap: 8px; }
  .who { display: flex; align-items: center; gap: 8px; min-width: 0; background: transparent; border: 0; padding: 0; color: var(--ink); text-align: left; min-height: 40px; }
  .chip { position: relative; flex: none; width: 32px; height: 32px; border-radius: 6px; border: 2px solid #4d3220; display: grid; place-items: center; font: 700 12px/1 var(--body); color: #2b1c0e; }
  .chip img { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
  .chip.face { background: transparent !important; border-color: transparent; font-size: 0; }
  .want { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .star { font-size: 20px; width: 26px; text-align: center; }
  .wname { display: flex; flex-direction: column; min-width: 0; font-size: 14px; line-height: 1.2; }
  .wname b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .small { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pay { min-width: 46px; text-align: right; font-size: 16px; font-weight: 700; color: var(--accent); }
  .pay.none { color: var(--muted); font-weight: 400; }
  .pat { display: flex; }
  .serve { min-height: 36px; padding: 0 12px; font-size: 14px; }
  .more { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 0 2px; }
  .opt { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; min-height: 40px; font-size: 14px; }
  .hearts { letter-spacing: 1px; }
  .tip { font-size: 12px; opacity: 0.85; }
  .reason { flex: 1; font-size: 13px; color: var(--muted); display: flex; gap: 6px; min-width: 120px; }
  .refuse { margin-left: auto; min-height: 40px; }
  @media (max-width: 640px) {
    .line { grid-template-columns: minmax(0, 1fr) auto auto; }
    .pat { grid-column: 1 / 3; grid-row: 2; }
    .serve { grid-column: 3; grid-row: 1 / 3; min-height: 44px; }
    .pay { grid-column: 2; grid-row: 1; }
  }
</style>
