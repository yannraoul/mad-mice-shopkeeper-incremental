<script lang="ts">
  import { t } from '../i18n/i18n.svelte.ts';
  import { game } from './game.svelte.ts';

  // A short, non-blocking flourish when the day moves on: a wooden sign drops in from the top saying Open (morning to afternoon)
  // or Closed (afternoon to evening); over the night the sun sets, the moon crosses the sky and the sun rises again, the two
  // sprites riding one wheel so both follow circular arcs. Pictures in public/art/ui; the play is untouched underneath and the
  // pointer passes straight through. Reduced motion skips it.
  type Kind = 'open' | 'close' | 'night';
  const MS: Record<Kind, number> = { open: 2400, close: 2400, night: 4200 };
  const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const base = import.meta.env.BASE_URL;
  let kind = $state<Kind | null>(null);
  let run = $state(0);
  let prevPhase = game.s.phase;
  let prevDay = game.s.day;
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const phase = game.s.phase;
    const day = game.s.day;
    let k: Kind | null = null;
    if (day === prevDay && prevPhase === 'morning' && phase === 'afternoon') k = 'open';
    else if (day === prevDay && prevPhase === 'afternoon' && phase === 'evening') k = 'close';
    else if (day === prevDay + 1 && prevPhase === 'evening' && phase === 'morning') k = 'night';
    prevPhase = phase;
    prevDay = day;
    if (!k || reducedMotion()) return;
    kind = k;
    run += 1;
    clearTimeout(timer);
    timer = setTimeout(() => (kind = null), MS[k]);
  });
</script>

{#key run}
  {#if kind === 'open' || kind === 'close'}
    <div class="overlay" aria-hidden="true">
      <img class="sign" src="{base}art/ui/sign-{kind === 'open' ? 'open' : 'closed'}.png" alt="" />
    </div>
  {:else if kind === 'night'}
    <div class="overlay" aria-hidden="true">
      <div class="sky"></div>
      <div class="wheel">
        <img class="body sun" src="{base}art/ui/sun.png" alt="" />
        <img class="body moon" src="{base}art/ui/moon.png" alt="" />
      </div>
    </div>
  {/if}
{/key}

<style>
  .overlay { position: fixed; inset: 0; z-index: 50; pointer-events: none; overflow: hidden; --s: 96px; }

  /* The sign (96 x 40, ropes at its top edge) drops in from above, sways a little, and goes back up. */
  .sign { position: absolute; left: 50%; top: 0; width: calc(var(--s) * 3); margin-left: calc(var(--s) * -1.5); image-rendering: pixelated; transform-origin: 50% 0; animation: drop 2.4s ease-in-out both; }
  @keyframes drop {
    0% { transform: translateY(-110%); }
    20% { transform: translateY(14vh) rotate(0); }
    26% { transform: translateY(14vh) rotate(2deg); }
    34% { transform: translateY(14vh) rotate(-1.5deg); }
    42%, 78% { transform: translateY(14vh) rotate(0); }
    100% { transform: translateY(-110%); }
  }

  /* Over the night: dusk falls and one wheel turns about the bottom centre of the screen. The sun at the top of it sets on the
     right, the moon comes up from below on the left and crosses, the sun rises again: both on circular arcs. The sprites are
     turned back as the wheel turns so they stay upright. */
  .sky { position: absolute; inset: 0; background: linear-gradient(#e8742c 0%, #4a3475 38%, #2f3f6b 100%); animation: sky 4.2s ease-in-out both; }
  @keyframes sky { 0% { opacity: 0; } 18%, 72% { opacity: 0.82; } 100% { opacity: 0; } }
  .wheel { position: absolute; left: 50%; bottom: 0; width: 0; height: 0; --r: min(72vh, 46vw); animation: spin 4.2s ease-in-out both; }
  .body { position: absolute; width: calc(var(--s) * 1); height: auto; left: calc(var(--s) / -2); top: calc(var(--s) / -2); image-rendering: pixelated; animation: unspin 4.2s ease-in-out both; }
  .sun { translate: 0 calc(var(--r) * -1); filter: drop-shadow(0 0 12px rgba(255, 210, 90, 0.7)); }
  .moon { translate: 0 var(--r); filter: drop-shadow(0 0 10px rgba(169, 200, 232, 0.6)); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes unspin { to { transform: rotate(-360deg); } }
  @media (max-width: 640px) { .overlay { --s: 64px; } }
</style>
