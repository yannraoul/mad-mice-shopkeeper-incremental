<script lang="ts">
  import { t } from '../i18n/i18n.svelte.ts';
  import { game } from './game.svelte.ts';

  // A short, non-blocking flourish when the day moves on: the shop sign flips from closed to open (morning to afternoon)
  // and back (afternoon to evening); over the night the sun sets, the moon crosses the sky and the sun rises again.
  // Pure CSS placeholders: the play is untouched underneath and the pointer passes straight through. Reduced motion skips it.
  type Kind = 'open' | 'close' | 'night';
  const MS: Record<Kind, number> = { open: 2400, close: 2400, night: 4200 };
  const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      <div class="sign">
        <span class="string l"></span><span class="string r"></span>
        <div class="board">
          <div class="face front">{kind === 'open' ? t('transition.closed') : t('transition.open')}</div>
          <div class="face back">{kind === 'open' ? t('transition.open') : t('transition.closed')}</div>
        </div>
      </div>
    </div>
  {:else if kind === 'night'}
    <div class="overlay" aria-hidden="true">
      <div class="sky"></div>
      <div class="body sun set"></div>
      <div class="body moon"></div>
      <div class="body sun rise"></div>
    </div>
  {/if}
{/key}

<style>
  .overlay { position: fixed; inset: 0; z-index: 50; pointer-events: none; overflow: hidden; }

  /* The sign hangs from two strings, drops in, flips, and goes back up. */
  .sign { position: absolute; left: 50%; top: 14%; width: min(300px, 70vw); height: 110px; margin-left: calc(min(300px, 70vw) / -2); perspective: 600px; animation: drop 2.4s ease-in-out both; }
  .string { position: absolute; top: -200px; width: 3px; height: 200px; background: var(--cocoa, #4d3220); }
  .string.l { left: 22%; } .string.r { right: 22%; }
  .board { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; animation: flip 2.4s ease-in-out both; }
  .face {
    position: absolute; inset: 0; display: grid; place-items: center; backface-visibility: hidden;
    border: 4px solid #4d3220; border-radius: 10px; background: linear-gradient(#d19a5b, #a8743f);
    color: #fbe7b5; font: 400 34px/1 var(--display); letter-spacing: 0.04em; text-transform: uppercase;
    text-shadow: 0 2px 0 #2b1c0e; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }
  .back { transform: rotateX(180deg); }
  @keyframes drop {
    0% { transform: translateY(-160%); }
    18%, 82% { transform: translateY(0); }
    100% { transform: translateY(-160%); }
  }
  @keyframes flip {
    0%, 38% { transform: rotateX(0); }
    58%, 100% { transform: rotateX(180deg); }
  }

  /* Over the night: dusk falls, the sun sets, the moon crosses, the sun rises, the day returns. */
  .sky { position: absolute; inset: 0; background: linear-gradient(#e8742c 0%, #4a3475 38%, #2f3f6b 100%); animation: sky 4.2s ease-in-out both; }
  @keyframes sky { 0% { opacity: 0; } 18%, 72% { opacity: 0.82; } 100% { opacity: 0; } }
  .body { position: absolute; border-radius: 50%; width: 76px; height: 76px; }
  .sun { background: radial-gradient(#fff7e0, #ffd25a 55%, #e8742c); box-shadow: 0 0 40px 12px rgba(255, 210, 90, 0.55); }
  .moon { background: radial-gradient(circle at 35% 35%, #fff7e0, #cdeccb 60%, #a9c8e8); box-shadow: 0 0 30px 8px rgba(169, 200, 232, 0.5); }
  .sun.set { left: 18%; top: 20%; animation: setting 4.2s ease-in both; }
  .moon { left: 40%; top: 90%; animation: cross 4.2s ease-in-out both; }
  .sun.rise { left: 76%; top: 90%; animation: rising 4.2s ease-out both; }
  @keyframes setting { 0% { transform: translateY(0); opacity: 1; } 28% { transform: translateY(90vh); opacity: 1; } 29%, 100% { opacity: 0; transform: translateY(90vh); } }
  @keyframes cross { 0%, 22% { transform: translate(-10vw, 0); opacity: 0; } 30% { opacity: 1; } 50% { transform: translate(18vw, -62vh); opacity: 1; } 70% { transform: translate(46vw, 10vh); opacity: 1; } 74%, 100% { transform: translate(46vw, 20vh); opacity: 0; } }
  @keyframes rising { 0%, 68% { transform: translate(0, 0); opacity: 0; } 72% { opacity: 1; } 100% { transform: translate(-4vw, -70vh); opacity: 1; } }
  @media (max-width: 640px) { .body { width: 56px; height: 56px; } .face { font-size: 26px; } }
</style>
