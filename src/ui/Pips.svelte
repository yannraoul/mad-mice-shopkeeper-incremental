<script lang="ts">
  // A row of pips: `n` filled out of `total`. Decorative; the number is always stated in text too.
  let {
    n,
    total,
    color = 'var(--accent)',
    height = 8,
    flex = true,
    round = false,
  }: { n: number; total: number; color?: string; height?: number; flex?: boolean; round?: boolean } = $props();
</script>

<span class="pips" aria-hidden="true" style:gap={round ? '4px' : '4px'}>
  {#each Array.from({ length: total }, (_, i) => i) as i (i)}
    <span
      class="pip"
      class:flex
      class:round
      style:height="{height}px"
      style:width={round ? `${height}px` : undefined}
      style:border-radius="{height / 2}px"
      style:background={i < n ? color : round ? 'transparent' : 'var(--line)'}
      style:border={round && i >= n ? '2px solid var(--line)' : undefined}
      style:box-sizing="border-box"
    ></span>
  {/each}
</span>

<style>
  .pips { display: flex; flex: 1; min-width: 0; }
  .pip { min-width: 8px; }
  .pip.flex { flex: 1; }
  .pip.round { min-width: 0; flex: none; }
  .pips:has(.round) { flex-wrap: wrap; }
</style>
