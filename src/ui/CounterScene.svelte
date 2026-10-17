<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '../i18n/i18n.svelte.ts';
  import type { CustomerCard } from '../view/serve.ts';
  import { game } from './game.svelte.ts';
  import { customerColor } from './customerColor.ts';
  import ImageSlot from './ImageSlot.svelte';

  // PLACEHOLDER counter scene (MMSIM-26): a top-down shop drawn with plain rectangles, in the units of a 256 x 176 scene
  // (the size the art will have). The queue lane runs from the door up to the counter, two customers wide; tables stand
  // on both sides. Customers walk in from the door, wait in the lane, and click to be picked (the list beside the scene
  // is where the decisions are made). A served customer walks to a table and stays for the next TURNS_SEATED turns (a turn
  // is a customer served or turned away, like everything else in the game); anyone else leaves by the door. Only the
  // walking is real time.
  let {
    customers,
    outside,
    clerks,
    selected,
    onselect,
  }: {
    customers: CustomerCard[];
    outside: { n: number; text: string };
    clerks: { id: string; active: boolean }[];
    selected: number | null;
    onselect: (id: number | null) => void;
  } = $props();

  const W = 256;
  const H = 176;
  const SIZE = 32;
  const SEATED = 22;
  const DOOR_Y = H + 4;
  const TURNS_SEATED = 2;
  const SLOTS = 8;
  const slotAt = (i: number) => ({ x: 88 + (i % 2) * 48, y: 40 + Math.floor(i / 2) * 34 });
  // Four tables, two seats each.
  const TABLES = [
    { x: 6, y: 44 }, { x: 6, y: 108 }, { x: 202, y: 44 }, { x: 202, y: 108 },
  ];
  const TABLE_W = 48;
  const TABLE_H = 52;
  const seatAt = (k: number) => {
    const tb = TABLES[Math.floor(k / 2) % TABLES.length]!;
    return { x: tb.x + 2 + (k % 2) * 24, y: tb.y + 15 };
  };
  const SEATS = TABLES.length * 2;
  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;

  // Customers that have just arrived start at the door and walk to their place on the next frame.
  let arrived = $state<number[]>([]);
  type Spot = { x: number; y: number; size: number; out: boolean };
  type Ghost = { key: number; type: string; from: Spot; tgt: Spot; moved: boolean; seat: number | null; until: number };
  let ghosts = $state<Ghost[]>([]);
  let known = new Map<number, { type: string; slot: number }>();
  let turn = 0;

  const leave = (g: Ghost): Ghost => ({ ...g, seat: null, tgt: { x: g.tgt.x, y: DOOR_Y, size: SEATED, out: true } });

  $effect(() => {
    const list = customers;
    untrack(() => {
      const ids = new Set(list.map((c) => c.id));
      const gone = [...known].filter(([id]) => !ids.has(id));
      if (gone.length > 0) {
        turn += 1;
        const fate = new Map(game.events.map((e) => [e.type === 'sold' || e.type === 'refused' || e.type === 'left' ? e.customer : -1, e.type]));
        // Whoever has had their turns leaves first; then the newly served sit down.
        const done = ghosts.filter((g) => g.seat !== null && g.until < turn).map((g) => g.key);
        ghosts = ghosts.map((g) => (done.includes(g.key) ? leave(g) : g));
        for (const [id, info] of gone) {
          const sits = fate.get(id) === 'sold';
          const p = slotAt(info.slot);
          const from: Spot = { x: p.x, y: p.y, size: SIZE, out: false };
          let seat: number | null = null;
          if (sits) {
            const taken = new Set(ghosts.filter((g) => g.seat !== null).map((g) => g.seat));
            seat = [...Array(SEATS).keys()].find((k) => !taken.has(k)) ?? null;
            if (seat === null) {
              // Every seat is taken: the longest seated customer makes room.
              const oldest = ghosts.filter((g) => g.seat !== null).sort((a, b) => a.until - b.until)[0]!;
              seat = oldest.seat;
              ghosts = ghosts.map((g) => (g.key === oldest.key ? leave(g) : g));
            }
          }
          const tgt: Spot = seat !== null ? { ...seatAt(seat), size: SEATED, out: false } : { x: p.x, y: DOOR_Y, size: SIZE, out: true };
          const g: Ghost = { key: id, type: info.type, from, tgt, moved: false, seat, until: turn + TURNS_SEATED };
          ghosts = [...ghosts, g];
          setTimeout(() => (ghosts = ghosts.map((x) => (x.key === id ? { ...x, moved: true } : x))), 40);
          if (seat === null) setTimeout(() => (ghosts = ghosts.filter((x) => x.key !== id)), 1300);
        }
        // A customer who left for the door is dropped once they are out of sight.
        setTimeout(() => (ghosts = ghosts.filter((x) => !(x.tgt.out && x.seat === null && x.moved))), 1400);
      }
      known = new Map(list.map((c, i) => [c.id, { type: c.type, slot: i }]));
      const fresh = list.filter((c) => !arrived.includes(c.id)).map((c) => c.id);
      if (fresh.length > 0) setTimeout(() => (arrived = [...arrived, ...fresh]), 40);
    });
  });

  const hidden = $derived(Math.max(0, customers.length - SLOTS) + outside.n);
</script>

<div class="scene" role="group" aria-label={t('serve.title')}>
  <div class="counter" style:left={pctX(24)} style:top={pctY(6)} style:width={pctX(208)} style:height={pctY(24)}></div>
  {#each clerks as cl (cl.id)}
    <div class="clerk" class:off={!cl.active} style:left={pctX(114)} style:top={pctY(4)} style:width={pctX(28)} style:height={pctY(26)} title={cl.id}>C</div>
  {/each}
  {#each TABLES as tb}
    <div class="table" style:left={pctX(tb.x)} style:top={pctY(tb.y)} style:width={pctX(TABLE_W)} style:height={pctY(TABLE_H)}></div>
  {/each}
  <div class="door" style:left={pctX(108)} style:top={pctY(H - 6)} style:width={pctX(40)} style:height={pctY(6)}></div>
  {#if hidden > 0}<span class="more">{outside.n > 0 && customers.length <= SLOTS ? outside.text : `+${hidden}`}</span>{/if}

  {#each ghosts as g (g.key)}
    {@const p = g.moved ? g.tgt : g.from}
    <div
      class="cust ghost"
      class:seated={g.moved && g.seat !== null}
      class:gone={g.moved && p.out}
      style:left={pctX(p.x)}
      style:top={pctY(p.y)}
      style:width={pctX(p.size)}
      style:height={pctY(p.size)}
      style:background={customerColor(g.type)}
      aria-hidden="true"
    ></div>
  {/each}

  {#each customers.slice(0, SLOTS) as cu, i (cu.id)}
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
      style:background={customerColor(cu.type)}
      aria-pressed={selected === cu.id}
      aria-label={`${cu.name}: ${cu.wants}, ${cu.minQuality}`}
      onclick={() => onselect(selected === cu.id ? null : cu.id)}
    >
      <span class="initial" aria-hidden="true">{cu.name[0]}</span>
      <span class="want" aria-hidden="true">{#if cu.art}<ImageSlot id={cu.art} width={14} />{:else}★{/if}</span>
    </button>
  {/each}
</div>

<style>
  .scene { position: relative; aspect-ratio: 256 / 176; width: 100%; overflow: hidden; border-radius: 12px; background: linear-gradient(#e7d3a8 0 17%, #d9bf8c 17%); container-type: inline-size; }
  .counter { position: absolute; background: #a8743f; border-bottom: 4px solid #4d3220; border-radius: 6px; }
  .clerk { position: absolute; display: grid; place-items: center; background: #7b5cb0; color: #fff; font: 700 14px/1 var(--body); border-radius: 6px; z-index: 1; }
  .clerk.off { opacity: 0.35; }
  .table { position: absolute; background: #7a4f30; border-radius: 12px; opacity: 0.85; }
  .door { position: absolute; background: #4d3220; border-radius: 6px 6px 0 0; }
  .more { position: absolute; right: 8px; bottom: 6px; padding: 2px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.6); color: #fff; font: 700 12px/1.3 var(--body); }

  .cust {
    position: absolute; padding: 0; border: 2px solid #4d3220; border-radius: 8px; color: #2b1c0e; min-height: 0; display: block;
    transition: left 0.9s ease-in-out, top 0.9s ease-in-out, width 0.9s ease-in-out, height 0.9s ease-in-out, opacity 0.6s; cursor: pointer;
  }
  .initial { position: absolute; inset: 0; display: grid; place-items: center; font: 700 clamp(10px, 4cqw, 20px)/1 var(--body); }
  .want {
    position: absolute; right: -4px; bottom: -4px; display: grid; place-items: center; min-width: 14px; min-height: 14px; padding: 1px;
    border-radius: 4px; background: #fff7e0; border: 1px solid #4d3220; font: 700 10px/1 var(--body); color: #2b1c0e; overflow: hidden;
  }
  .want :global(img) { display: block; width: 14px; height: auto; }
  .cust.ghost { cursor: default; pointer-events: none; }
  .cust.ghost.seated { border-radius: 6px; }
  .cust.ghost.gone { opacity: 0; }
  .cust.can { box-shadow: 0 0 0 3px var(--ok); }
  .cust.urgent { animation: nudge 0.7s ease-in-out infinite; }
  .cust.sel { outline: 3px solid var(--accent); outline-offset: 2px; z-index: 3; }
  .cust:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; z-index: 3; }
  @keyframes nudge { 50% { transform: translateX(3px); } }
  @media (prefers-reduced-motion: reduce) { .cust { transition: none; } .cust.urgent { animation: none; } }
</style>
