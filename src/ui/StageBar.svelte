<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { buildStageView } from '../view/stage.ts';
  import { game } from './game.svelte.ts';

  const v = $derived(buildStageView(content, game.s, t));
</script>

<section class="panel stage">
  <div class="line">{v.progress}</div>
  <progress max="100" value={v.pct} aria-label={v.name}></progress>

  {#if v.warning}<p class="warn">{v.warning}</p>{/if}
  {#each v.hints as line}<p class="hint">{line}</p>{/each}
  {#if v.lastWeek}
    <p class={v.lastWeek.passed ? 'ok' : 'note'}>{v.lastWeek.text}</p>
  {/if}
  {#if v.complete}<p class="ok">{v.complete}</p>{/if}
</section>

<style>
  .stage { display: grid; gap: 0.4rem; }
  progress { width: 100%; height: 0.7rem; accent-color: var(--accent); }
  p { margin: 0; }
  .ok { color: var(--ok); }
  .warn { color: var(--warn); }
  .hint { color: var(--accent); }
  .note { color: var(--muted); }
</style>
