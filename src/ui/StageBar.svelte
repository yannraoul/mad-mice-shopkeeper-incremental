<script lang="ts">
  import { content } from '../content/index.ts';
  import { i18n, t } from '../i18n/i18n.svelte.ts';
  import { currentStage, rivalPenalty } from '../engine/economy.ts';
  import { game } from './game.svelte.ts';

  const s = $derived(game.s);
  const stage = $derived(currentStage(content, s));
  // Revenue shown includes today's sales so far (the week is judged after its last day).
  const earned = $derived(s.stage.revenue + s.report.revenue);
  const pct = $derived(Math.min(100, Math.round((earned / stage.target) * 100)));
  const dayNo = $derived(Math.min(s.stage.day + 1, stage.days));
  const rival = $derived(stage.rival);
  const stolen = $derived(rival ? rivalPenalty(content, s, rival.ingredient) : 0);
  const week = $derived(s.stage.day === 0 ? s.lastWeek : null);
  // The ending text lives in an optional content pack (absent from preview builds).
  const ending = $derived(content.strings[i18n.lang]['ending.text']);
</script>

<section class="panel stage">
  <div class="line">
    {t('stage.progress', { name: t(stage.nameKey), day: dayNo, days: stage.days, revenue: earned, target: stage.target })}
  </div>
  <progress max="100" value={pct} aria-label={t(stage.nameKey)}></progress>

  {#if stolen > 0 && rival}
    <p class="warn">
      {t('stage.rival', { amount: stolen, ingredient: t(`ingredient.${rival.ingredient}`).toLocaleLowerCase(i18n.lang) })}
    </p>
  {/if}
  {#if week}
    <p class={week.passed ? 'ok' : 'note'}>
      {week.passed
        ? t('stage.lastWeekPassed')
        : t('stage.lastWeekMissed', { revenue: week.revenue, target: week.target })}
    </p>
  {/if}
  {#if s.completed}<p class="ok">{ending ?? t('stage.complete')}</p>{/if}
</section>

<style>
  .stage { display: grid; gap: 0.4rem; }
  progress { width: 100%; height: 0.7rem; accent-color: var(--accent); }
  p { margin: 0; }
  .ok { color: var(--ok); }
  .warn { color: var(--warn); }
  .note { color: var(--muted); }
</style>
