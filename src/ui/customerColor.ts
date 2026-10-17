/** Placeholder look of a customer type until there are sprites: one colour per type, shared by the scene and the list. */
const HUES: Record<string, number> = { faithful: 28, traveler: 200, merchant: 285, bee: 48 };

export const customerColor = (type: string): string =>
  `hsl(${HUES[type] ?? [...type].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360} 55% 58%)`;
