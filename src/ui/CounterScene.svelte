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
  const SEATED = 24;
  const DOOR_Y = H + 4;
  const TURNS_SEATED = 2;
  // The clerk stands behind the counter: a slice of the counter picture is drawn over the clerk's lower half, so the token does
  // not float above the counter. The slice is the middle of the counter, from its top edge down.
  const CLERK = { x: 112, y: 20 };
  const FRONT = { x: 104, y: 42, w: 48, h: 28 };
  const SLOTS = 6;
  // Two tokens wide down the middle, over the carpet that runs from the door up to the counter, three rows.
  const slotAt = (i: number) => ({ x: 92 + (i % 2) * 32, y: 72 + Math.floor(i / 2) * 32 });
  // Four round tables on rugs (centres at the picture's tables), two chairs each: left and right of the table.
  const TABLES = [
    { x: 52, y: 98 }, { x: 52, y: 146 }, { x: 204, y: 98 }, { x: 204, y: 146 },
  ];
  const TABLE_W = 56;
  const TABLE_H = 40;
  const seatAt = (k: number) => {
    const tb = TABLES[Math.floor(k / 2) % TABLES.length]!;
    return { x: tb.x - 37 + (k % 2) * 50, y: tb.y - 12 };
  };
  const SEATS = TABLES.length * 2;
  const pctX = (x: number) => `${(x / W) * 100}%`;
  const pctY = (y: number) => `${(y / H) * 100}%`;

  // Customers that have just arrived start at the door and walk to their place on the next frame.
  let arrived = $state<number[]>([]);
  type Spot = { x: number; y: number; size: number; out: boolean };
  type Ghost = { key: number; type: string; from: Spot; tgt: Spot; moved: boolean; seat: number | null; until: number; hearts: number };
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
        const fate = new Map(game.events.map((e) => [e.type === 'sold' || e.type === 'refused' || e.type === 'left' ? e.customer : -1, e]));
        // Whoever has had their turns leaves first; then the newly served sit down.
        const done = ghosts.filter((g) => g.seat !== null && g.until < turn).map((g) => g.key);
        ghosts = ghosts.map((g) => (done.includes(g.key) ? leave(g) : g));
        for (const [id, info] of gone) {
          const outcome = fate.get(id);
          const sits = outcome?.type === 'sold';
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
          const g: Ghost = { key: id, type: info.type, from, tgt, moved: false, seat, until: turn + TURNS_SEATED, hearts: outcome?.type === 'sold' ? outcome.hearts : 0 };
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

  const base = import.meta.env.BASE_URL;
  let hasBackground = $state(false);
  // Which token pictures exist (art/tokens/customer-<type>.png): a type with one drops its coloured circle and letter.
  let faces = $state<Record<string, boolean>>({});
  let clerkFace = $state(false);
  const hidden = $derived(Math.max(0, customers.length - SLOTS) + outside.n);
</script>

<div class="scene" class:art={hasBackground} role="group" aria-label={t('serve.title')}>
  <!-- The picture of the shop (256 x 176), when it exists: it replaces the placeholder counter, tables and door. -->
  <img class="bg" src="{base}art/scenes/counter.png" alt="" onload={() => (hasBackground = true)} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
  <div class="counter" style:left={pctX(42)} style:top={pctY(42)} style:width={pctX(174)} style:height={pctY(26)}></div>
  {#each clerks as cl (cl.id)}
    <div class="clerk" class:off={!cl.active} class:face={clerkFace} style:left={pctX(CLERK.x)} style:top={pctY(CLERK.y)} style:width={pctX(32)} style:height={pctY(32)} title={cl.id}>C<img class="face" src="{base}art/tokens/clerk.png" alt="" onload={() => (clerkFace = true)} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} /></div>
  {/each}
  {#if hasBackground}
    <!-- Same picture, cropped to the slice: background-size and -position are in percentages of the whole 256 x 176 picture. -->
    <div
      class="front"
      style:left={pctX(FRONT.x)}
      style:top={pctY(FRONT.y)}
      style:width={pctX(FRONT.w)}
      style:height={pctY(FRONT.h)}
      style:background-image="url({base}art/scenes/counter.png)"
      style:background-size="{(W / FRONT.w) * 100}% {(H / FRONT.h) * 100}%"
      style:background-position="{(FRONT.x / (W - FRONT.w)) * 100}% {(FRONT.y / (H - FRONT.h)) * 100}%"
      aria-hidden="true"
    ></div>
  {/if}
  {#each TABLES as tb}
    <div class="table" style:left={pctX(tb.x - TABLE_W / 2)} style:top={pctY(tb.y - TABLE_H / 2)} style:width={pctX(TABLE_W)} style:height={pctY(TABLE_H)}></div>
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
      class:face={faces[g.type]}
      style:background={customerColor(g.type)}
      aria-hidden="true"
    >
      <img class="face" src="{base}art/tokens/customer-{g.type}.png" alt="" onload={() => (faces[g.type] = true)} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
      {#if g.seat !== null && g.moved}<span class="mood">{'♥'.repeat(g.hearts)}</span>{/if}
    </div>
  {/each}

  {#each customers.slice(0, SLOTS) as cu, i (cu.id)}
    {@const here = arrived.includes(cu.id) ? slotAt(i) : { x: slotAt(i).x, y: DOOR_Y }}
    <button
      class="cust"
      class:sel={selected === cu.id}
      class:can={cu.bubble.canServe}
      class:urgent={cu.patienceMeter.tier === 'urgent'}
      class:face={faces[cu.type]}
      style:left={pctX(here.x)}
      style:top={pctY(here.y)}
      style:width={pctX(SIZE)}
      style:height={pctY(SIZE)}
      style:background={customerColor(cu.type)}
      style:--bob="{(cu.id % 7) * -0.4}s"
      aria-pressed={selected === cu.id}
      aria-label={`${cu.name}: ${cu.wants}, ${cu.minQuality}`}
      onclick={() => onselect(selected === cu.id ? null : cu.id)}
    >
      <span class="initial" aria-hidden="true">{cu.name[0]}</span>
      <img class="face" src="{base}art/tokens/customer-{cu.type}.png" alt="" onload={() => (faces[cu.type] = true)} onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
      {#if cu.patienceMeter.tier === 'urgent'}<span class="mood warn" aria-hidden="true">!</span>{/if}
      <span class="want" aria-hidden="true">{#if cu.art}<ImageSlot id={cu.art} width={14} />{:else}★{/if}</span>
    </button>
  {/each}
</div>

<style>
  .scene { position: relative; aspect-ratio: 256 / 176; width: 100%; overflow: hidden; border-radius: 12px; background: linear-gradient(#e7d3a8 0 17%, #d9bf8c 17%); container-type: inline-size; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
  .scene.art .counter, .scene.art .table, .scene.art .door { display: none; }
  .counter { position: absolute; background: #a8743f; border-bottom: 4px solid #4d3220; border-radius: 6px; }
  .clerk { position: absolute; display: grid; place-items: center; background: #7b5cb0; color: #fff; font: 700 14px/1 var(--body); border-radius: 6px; z-index: 1; }
  .clerk.off { opacity: 0.35; }
  .front { position: absolute; z-index: 2; image-rendering: pixelated; background-repeat: no-repeat; pointer-events: none; }
  .table { position: absolute; background: #7a4f30; border-radius: 12px; opacity: 0.85; }
  .door { position: absolute; background: #4d3220; border-radius: 6px 6px 0 0; }
  .more { position: absolute; right: 8px; bottom: 6px; padding: 2px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.6); color: #fff; font: 700 12px/1.3 var(--body); }

  .cust {
    position: absolute; padding: 0; border: 2px solid #4d3220; border-radius: 50%; color: #2b1c0e; min-height: 0; display: block;
    transition: left 0.9s ease-in-out, top 0.9s ease-in-out, width 0.9s ease-in-out, height 0.9s ease-in-out, opacity 0.6s; cursor: pointer;
  }
  .initial { position: absolute; inset: 0; display: grid; place-items: center; font: 700 clamp(10px, 4cqw, 20px)/1 var(--body); }
  .want {
    position: absolute; right: -4px; bottom: -4px; display: grid; place-items: center; min-width: 14px; min-height: 14px; padding: 1px;
    border-radius: 4px; background: #fff7e0; border: 1px solid #4d3220; font: 700 10px/1 var(--body); color: #2b1c0e; overflow: hidden;
  }
  .want :global(img) { display: block; width: 14px; height: auto; }
  .cust.ghost { cursor: default; pointer-events: none; }
  .cust.ghost.gone { opacity: 0; }
  .cust.can { box-shadow: 0 0 0 3px var(--ok); }
  /* A token waits with a small bob, each out of step with the next; one about to leave shakes. */
  button.cust:not(.urgent) { animation: bob 2.6s ease-in-out infinite; animation-delay: var(--bob, 0s); }
  .cust.urgent { animation: nudge 0.7s ease-in-out infinite; }
  /* Customer art, when there is some: art/tokens/customer-<type>.png, drawn over the coloured circle. */
  .face { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; object-fit: contain; }
  /* With its picture a token is just the picture (the green ring that says "can serve" stays). */
  .cust.face { background: transparent !important; border-color: transparent; }
  .cust.face .initial { display: none; }
  .clerk.face { background: transparent; font-size: 0; }
  .mood { position: absolute; top: -8px; left: 50%; transform: translateX(-50%); font: 700 10px/1 var(--body); color: #c4506b; white-space: nowrap; text-shadow: 0 1px 0 #fff7e0; }
  .mood.warn { color: #fff; background: var(--warn); border-radius: 50%; min-width: 14px; height: 14px; line-height: 14px; text-align: center; text-shadow: none; }
  @keyframes bob { 50% { transform: translateY(-2px); } }
  .cust.sel { outline: 3px solid var(--accent); outline-offset: 2px; z-index: 3; }
  .cust:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; z-index: 3; }
  @keyframes nudge { 50% { transform: translateX(3px); } }
  @media (prefers-reduced-motion: reduce) { .cust { transition: none; animation: none !important; } }
</style>
