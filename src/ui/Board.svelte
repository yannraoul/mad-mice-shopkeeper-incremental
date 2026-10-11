<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { game, dispatch } from './game.svelte.ts';
  import Errands from './Errands.svelte';

  const forecast = $derived(content.forecasts.find((f) => f.id === game.s.forecast)!);
  const stockRows = $derived(
    Object.entries(game.s.stock)
      .filter(([, n]) => n > 0)
      .map(([key, n]) => {
        const [candy, quality] = key.split(':') as [string, string];
        return { key, n, candy: t(`candy.${candy}`), quality: t(`quality.${quality}`) };
      }),
  );
  const name = (kind: string, id: string) => {
    const row = (content as unknown as Record<string, { id: string; nameKey: string }[]>)[kind]!.find((r) => r.id === id)!;
    return t(row.nameKey);
  };
</script>

<div class="col">
<section class="panel">
  <h2>{t('board.title')}</h2>
  <p>{t(forecast.nameKey)}</p>

  <h3>{t('board.contracts')}</h3>
  {#each game.s.contracts as ct (ct.id)}
    <div class="row">
      <span>
        {t('board.contract', {
          qty: ct.qty,
          candy: name('candies', ct.candy),
          quality: name('qualities', ct.quality),
          day: ct.deadlineDay,
          reward: ct.reward,
        })}
      </span>
      <button onclick={() => dispatch({ type: 'fulfill', contract: ct.id })}>{t('board.deliver')}</button>
    </div>
  {:else}
    <p class="muted">{t('board.noContracts')}</p>
  {/each}

  <h3>{t('ui.stock')}</h3>
  {#each stockRows as r (r.key)}
    <div>{r.n} × {r.candy} ({r.quality})</div>
  {:else}
    <p class="muted">{t('ui.stockEmpty')}</p>
  {/each}
</section>

<Errands />
</div>

<style>
  .col { display: grid; gap: var(--gap); align-content: start; }
</style>
