// Adapter: the phone breakpoint as a reactive flag, for the few places where the phone layout is a
// different structure (branch tabs, collapsible cards, bottom bar) and not just different CSS.
const query = typeof matchMedia === 'function' ? matchMedia('(max-width: 640px)') : null;

class Media {
  narrow = $state(query?.matches ?? false);
  constructor() {
    query?.addEventListener('change', (e) => (this.narrow = e.matches));
  }
}
export const media = new Media();
