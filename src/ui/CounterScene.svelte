<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '../i18n/i18n.svelte.ts';
  import type { CustomerCard } from '../view/serve.ts';
  import { game } from './game.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  // PLACEHOLDER counter scene (MMSIM-26): a top-down shop drawn with plain rectangles, to feel how selling works before
  // there is art. Customers walk in from the door at the bottom, wait in line in front of the counter, and click to open
  // their order; a served one walks to a table and sits a while, anyone else leaves by the door. Everything is laid out in
  // the units of a 256 x 144 scene (the size the pixel art will have) and drawn as percentages.
  let {
    customers,
    clerks,
    selected,
    onselect,
  }: { customers: CustomerCard[]; clerks: { id: string; active: boolean }[]; selected: number | null; onselect: (id: number | null) => void } = $props();

  const W = 256;
  const H = 144;
  const SIZE = 32;
  const DOOR_Y = 150;
  const slotAt = (i: number) => ({ x: 14 + (i % 6) * 38, y: i < 6 ? 48 : 92 }); // two rows of six (more than twelve share the second)
  const TABLES = [28, 110, 192]; // left edge of each table, in scene units
  const seatAt = (k: number) => ({ x: TABLES[Math.floor(k / 2) % TABLES.length]! + (k % 2) * 22, y: 118 });
  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;
  const hue = (type: string) => ({ faithful: 28, traveler: 200, merchant: 285, bee: 48 })[type] ?? [...type].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  const color = (type: string) => `hsl(${hue(type)} 55% 58%)`;

  // Customers that have just arrived start at the door and walk to their place on the next frame.
  let arrived = $state<number[]>([]);
  // Customers that have just left the queue keep walking: to a table if served, out of the door otherwise.
  type Ghost = { key: number; type: string; from: { x: number; y: number }; to: { x: number; y: number }; sits: boolean; moved: boolean };
  let ghosts = $state<Ghost[]>([]);
  let known = new Map<number, { type: string; slot: number }>();
  let seat = 0;

  $effect(() => {
    const list = customers;
    untrack(() => {
      const ids = new Set(list.map((c) => c.id));
      const fate = new Map(game.events.map((e) => [e.type === 'sold' || e.type === 'refused' || e.type === 'left' ? e.customer : -1, e.type]));
      for (const [id, info] of known) {
        if (ids.has(id)) continue;
        const sits = fate.get(id) === 'sold';
        const from = slotAt(info.slot);
        const to = sits ? seatAt(seat++) : { x: from.x, y: DOOR_Y };
        const g: Ghost = { key: id, type: info.type, from, to, sits, moved: false };
        ghosts = [...ghosts, g];
        setTimeout(() => (ghosts = ghosts.map((x) => (x.key === id ? { ...x, moved: true } : x))), 40);
        setTimeout(() => (ghosts = ghosts.filter((x) => x.key !== id)), sits ? 5000 : 1300);
      }
      known = new Map(list.map((c, i) => [c.id, { type: c.type, slot: i }]));
      const fresh = list.filter((c) => !arrived.includes(c.id)).map((c) => c.id);
      if (fresh.length > 0) setTimeout(() => (arrived = [...arrived, ...fresh]), 40);
    });
  });
</script>

<div class="scene" role="group" aria-label={t('serve.title')}>
  <div class="counter" style:left={pctX(24)} style:top={pctY(8)} style:width={pctX(208)} style:height={pctY(26)}></div>
  {#each clerks as cl (cl.id)}
    <div class="clerk" class:off={!cl.active} style:left={pctX(112)} style:top={pctY(6)} style:width={pctX(28)} style:height={pctY(28)} title={cl.id}>C</div>
  {/each}
  {#each TABLES as x}
    <div class="table" style:left={pctX(x)} style:top={pctY(124)} style:width={pctX(40)} style:height={pctY(14)}></div>
  {/each}
  <div class="door" style:left={pctX(108)} style:top={pctY(138)} style:width={pctX(40)} style:height={pctY(6)}></div>

  {#each ghosts as g (g.key)}
    {@const p = g.moved ? g.to : g.from}
    <div class="cust ghost" class:leaving={g.moved && !g.sits} style:left={pctX(p.x)} style:top={pctY(p.y)} style:width={pctX(SIZE)} style:height={pctY(SIZE)} style:background={color(g.type)} aria-hidden="true">
      {g.type[0]!.toUpperCase()}
    </div>
  {/each}

  {#each customers as cu, i (cu.id)}
    {@const here = arrived.includes(cu.id) ? slotAt(i) : { x: slotAt(i).x, y: DOOR_Y }}
    <button
      class="cust"
      class:sel={selected === cu.id}
      class:can={cu.bubble.canServe}
      class:urgent={cu.patienceMeter.tier === 'urgent'}
      style:left={pctX(here.x)}
      style:top={pctY(here.y)}
      style:width={pctX(SIZE)}
      style:height={pctY(SIZE)}
      style:background={color(cu.type)}
      aria-pressed={selected === cu.id}
      aria-label={`${cu.name}: ${cu.wants}, ${cu.minQuality}`}
      onclick={() => onselect(selected === cu.id ? null : cu.id)}
    >
      <span class="initial" aria-hidden="true">{cu.name[0]}</span>
      <span class="bubble" aria-hidden="true">
        {#if cu.art}<ImageSlot id={cu.art} width={20} />{:else}<b>★</b>{/if}
        <i>{cu.bubble.quality}</i>
        <span class="pat" style:--n={cu.patienceMeter.left} style:--max={cu.patienceMeter.max}></span>
      </span>
    </button>
  {/each}
</div>

<style>
  .scene { position: relative; aspect-ratio: 16 / 9; width: 100%; overflow: hidden; border-radius: 12px; background: linear-gradient(#e7d3a8 0 28%, #d9bf8c 28%); container-type: inline-size; }
  .counter { position: absolute; background: #a8743f; border-bottom: 4px solid #4d3220; border-radius: 6px; }
  .clerk { position: absolute; display: grid; place-items: center; background: #7b5cb0; color: #fff; font: 700 14px/1 var(--body); border-radius: 6px; z-index: 1; }
  .clerk.off { opacity: 0.35; }
  .table { position: absolute; background: #7a4f30; border-radius: 50% / 40%; opacity: 0.85; }
  .door { position: absolute; background: #4d3220; border-radius: 6px 6px 0 0; }

  .cust {
    position: absolute; padding: 0; border: 2px solid #4d3220; border-radius: 8px; color: #2b1c0e; min-height: 0;
    display: block; transition: left 0.9s ease-in-out, top 0.9s ease-in-out, opacity 0.6s; cursor: pointer;
  }
  .cust .initial { position: absolute; inset: 0; display: grid; place-items: center; font: 700 clamp(10px, 4cqw, 20px)/1 var(--body); }
  .cust.ghost { cursor: default; pointer-events: none; display: grid; place-items: center; font: 700 clamp(10px, 4cqw, 20px)/1 var(--body); }
  .cust.ghost.leaving { opacity: 0; }
  .cust.can { box-shadow: 0 0 0 3px var(--ok); }
  .cust.urgent { animation: nudge 0.7s ease-in-out infinite; }
  .cust.sel { outline: 3px solid var(--accent); outline-offset: 2px; z-index: 3; }
  .cust:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; z-index: 3; }
  @keyframes nudge { 50% { transform: translateX(3px); } }

  /* What they want, at a glance: the candy (or a star for "something rich"), the least quality, and patience pips. */
  .bubble {
    position: absolute; left: 50%; bottom: calc(100% + 3px); transform: translateX(-50%); z-index: 2;
    display: flex; align-items: center; gap: 3px; padding: 2px 5px; border-radius: 8px; white-space: nowrap;
    background: #fff7e0; border: 2px solid #4d3220; font: 700 10px/1 var(--mono); color: #2b1c0e; pointer-events: none;
  }
  .can .bubble { border-color: var(--ok); }
  .bubble :global(img) { display: block; width: 20px; height: auto; border-radius: 3px; }
  .pat { width: 18px; height: 5px; border-radius: 3px; background: linear-gradient(to right, #c4506b calc(var(--n) / var(--max) * 100%), #cfc5b8 0); }
  @media (prefers-reduced-motion: reduce) { .cust { transition: none; } .cust.urgent { animation: none; } }
</style>
