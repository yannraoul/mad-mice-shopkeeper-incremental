# Accounting mouse: the journal card illustration

Sits behind the journal note of the evening screen (`src/ui/Evening.svelte`, `.journal`). The picture fills the whole card and fades into the parchment at the bottom so the italic text stays readable. Palette: `sweet-tooth-32.hex` (see `palette.md`). Outlines `cocoa-900`, never black.

## Size
- Card on screen: about **410 x 250** on desktop (page at 1200), about **350 x 130** on a phone (it shrinks and the text wraps).
- Draw at **208 x 128** (13:8). Shown at x2 = 416 x 256 on desktop, cropped by a few pixels. On a phone it is cropped to the top part (the picture is anchored top), so **keep the mouse and the desk in the upper 60 %** and keep the bottom 40 % calm.
- Fade: the app adds a gradient from transparent to the parchment colour over the bottom third. Draw that third as plain warm desk surface (`butter` / `cream` tones, low contrast, no objects), so the fade is invisible.

## Prompt (with the mouse: the working version)
> Cozy pixel art, 16-bit, soft warm lighting, rounded shapes, dark cocoa outlines, clean pixels, no anti-aliasing, no text, no letters, no numbers. A small cute mouse accountant with round glasses and a little green eyeshade, in a waistcoat, seen from the front at three quarters, sitting at a big wooden desk and writing in a thick open ledger with a quill. Stacks of closed ledgers and a pile of coins on the desk, an inkwell, a small brass lamp with a warm glow, a tiny abacus. Warm cream and caramel colours, a dark cocoa wall behind. The mouse and the desk fill the upper two thirds of the picture; the lowest third is a plain empty wooden desk surface in cream and butter tones with nothing on it. 208x128.

Negative / avoid: black outlines, gradients, blurry edges, text or numbers on the ledgers (scribbled lines are fine), more than one mouse, a busy foreground.

## Prompt (the idle version: no mouse)
Generate from the picture above, same composition, and change only the mouse:
> Same scene and the same camera, but the chair is empty and pushed back a little, the quill rests in the inkwell, the ledger lies open with scribbled lines, the lamp is still lit. No mouse, no characters. 208x128.

Keep every other pixel identical (same desk, books, coins, lamp) so the two versions can be swapped, or cross-faded, without the scene jumping.

## Optional: a writing loop
If the tool animates: the quill hand and the glasses catching the light, 4 frames, 6 fps, the rest of the picture fixed. Export as a horizontal strip like the workshop sprites (`public/art/sprites/`), one strip for the mouse alone at the size of its frame, and I will place it over the idle background.

## Files
`public/art/scenes/accounting.png` (with the mouse) and `public/art/scenes/accounting-idle.png` (without), both 208 x 128.
