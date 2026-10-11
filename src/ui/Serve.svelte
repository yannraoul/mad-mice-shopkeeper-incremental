<script lang="ts">
  import { content } from '../content/index.ts';
  import { t } from '../i18n/i18n.svelte.ts';
  import { priceOf, qualityRank, stockKey } from '../engine/economy.ts';
  import type { GameEvent } from '../engine/types.ts';
  import { game, dispatch } from './game.svelte.ts';
  import ImageSlot from './ImageSlot.svelte';

  const s = $derived(game.s);

  // For each customer at the counter: the stocked qualities that satisfy them, cheapest first.
  const cards = $derived(
    s.queue.map((cu) => {
      const min = qualityRank(content, cu.minQuality);
      const options = content.qualities
        .filter((q) => q.rank >= min && (s.stock[stockKey(cu.wants, q.id)] ?? 0) > 0)
        .sort((a, b) => a.rank - b.rank)
        .map((q) => ({ id: q.id, name: t(q.nameKey), price: priceOf(content, cu.wants, q.id) }));
      return { cu, options };
    }),
  );

  const workers = $derived(content.workers.filter((w) => s.unlocks.includes(w.unlock)));
  const need = content.settings.delegateAfterBatches;

  function line(e: GameEvent): string {
    switch (e.type) {
      case 'sold':
        return t(e.auto ? 'feed.sold.auto' : 'feed.sold', {
          type: t(`customer.${e.customerType}`),
          candy: t(`candy.${e.candy}`),
          quality: t(`quality.${e.quality}`),
          price: e.price,
        });
      case 'refused':
        return t('feed.refused', { type: t(`customer.${e.customerType}`) });
      case 'left':
        return t('feed.left', { type: t(`customer.${e.customerType}`) });
      default:
        return '';
    }
  }
</script>

<section class="panel serve">
  <h2>{t('serve.title')}</h2>
  <p class="muted">
    {t('serve.waiting', { n: s.queue.length, max: content.settings.counterSpace })} ·
    {t('serve.today', { served: s.report.served, lost: s.report.lost, revenue: s.report.revenue })}
  </p>

  {#each cards as { cu, options } (cu.id)}
    <article class="customer">
      <div class="who">
        <ImageSlot id={`candy-${cu.wants}`} />
        <div>
          <strong>{t(`customer.${cu.type}`)}</strong>
          <div>{t('serve.wants', { candy: t(`candy.${cu.wants}`) })}</div>
          <div class="muted">
            {t('serve.minQuality', { quality: t(`quality.${cu.minQuality}`) })} ·
            {t('serve.budget', { n: cu.budget })} ·
            {t('serve.patience', { n: cu.patience })}
          </div>
        </div>
      </div>
      <div class="row">
        {#each options as o (o.id)}
          <button
            class="primary"
            disabled={o.price > cu.budget}
            onclick={() => dispatch({ type: 'serve', customer: cu.id, quality: o.id })}
          >
            {t('serve.serve', { quality: o.name, price: o.price })}
          </button>
        {/each}
        <button onclick={() => dispatch({ type: 'refuse', customer: cu.id })}>{t('serve.refuse')}</button>
      </div>
      {#if options.length === 0}<p class="muted">{t('serve.nothingFits')}</p>{/if}
    </article>
  {:else}
    <p class="muted">{t('serve.nobody')}</p>
  {/each}

  {#if s.queue.length > 0}
    <p class="warn">{t('serve.closeWarning', { n: s.queue.length })}</p>
  {/if}

  {#each workers as w (w.id)}
    <div class="worker">
      <h3>{t(w.nameKey)}</h3>
      <div class="who">
        <ImageSlot id={`worker-${w.id}`} />
        <div>
          {#each w.serves as type (type)}
            <label class="check">
              <input
                type="checkbox"
                checked={s.delegated.includes(type)}
                onchange={(e) => dispatch({ type: 'delegate', customerType: type, on: e.currentTarget.checked })}
              />
              {t('clerk.handles', { type: t(`customer.${type}`) })}
            </label>
          {/each}
          {#each content.candies as cd (cd.id)}
            {@const made = s.batchesMade[cd.id] ?? 0}
            <div class="muted">
              {made >= need
                ? t('clerk.trained', { candy: t(cd.nameKey) })
                : t('clerk.training', { candy: t(cd.nameKey), n: made, need })}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/each}

  {#if game.feed.length > 0}
    <div class="feed">
      <h3>{t('feed.title')}</h3>
      {#each game.feed as e, i (i)}<div class:muted={i > 0}>{line(e)}</div>{/each}
    </div>
  {/if}
</section>

<style>
  .serve { display: grid; gap: var(--gap); }
  .customer { border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem; display: grid; gap: 0.5rem; }
  .who { display: flex; gap: var(--gap); align-items: center; }
  .warn { margin: 0; color: var(--warn); }
  .worker { border-top: 1px solid var(--line); padding-top: var(--gap); }
  .check { display: flex; gap: 0.5rem; align-items: center; min-height: 44px; }
  .check input { width: 1.4rem; height: 1.4rem; }
  .feed div { font-size: 0.9rem; }
</style>
