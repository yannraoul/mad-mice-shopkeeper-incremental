// Customer token pictures: art/tokens/customer-<type>-<n>.png. Each type has several variants (cut by scripts/art/cut_token_sheets.py,
// keep the counts in step); a customer's id picks one, so they look the same on the counter and in the queue.
const VARIANTS: Record<string, number> = { traveler: 7, faithful: 11, merchant: 9, bee: 20 };

export function tokenSrc(base: string, type: string, id: number): string {
  const n = VARIANTS[type] ?? 1;
  return `${base}art/tokens/customer-${type}-${Math.abs(id) % n}.png`;
}
