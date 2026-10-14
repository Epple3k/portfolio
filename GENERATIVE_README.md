# Generative portfolio: original design, changing tile layout

The `feature/generative-portfolio` edition is **the original portfolio in different compositions**, not a new visual identity.

## What stays identical to the original portfolio

- Helvetica Neue / Arial text styling, lower-case name, rotating description and familiar links.
- Original lime gradient: `linear-gradient(90deg, #f0fff0 0%, #c2ffc2 45%, #00ff00 100%)`.
- Real project previews and original grayscale-to-color hover effect.
- Attention Field, Research Atlas, Aural Field and Ledgerline with their actual destinations and descriptions.
- Blog, subscription, analytics and fullscreen project overlays.

**No acid-yellow blocks, white paper background, fake cover panels, decorative editorial labels, or placeholder graphics.**

## What changes

A randomly selected composition repositions and resizes project previews on a grid. These eight profiles follow the proportions of the provided layout reference: `split`, `flip`, `banner`, `runway`, `scatter`, `poster`, `mosaic`, `sideways`.

Every composition contains a big scrollable live-project canvas alongside four small project tiles. The large canvas can be vertical or horizontal, depending on the edition. Horizontal panels accept an ordinary mouse wheel, trackpad or swipe; vertical panels accept native scrolling. The previews remain real, clickable projects, not synthetic illustrations. Keyboard focus and scroll snapping are supported.

The corner reload control selects another composition, and `?seed=...` preserves a deterministic edition. Mobile displays a readable one- or two-column layout.

## Files

- `src/generative/EditorialHome.tsx`: the original content in scrollable tiles.
- `src/generative/editorial.css`: grid arrangements and original visual styling.
- `src/generative/design.ts`: seeded layout order.
- `src/App.tsx`: project metadata, original overlays and blog functionality.
- `scripts/test-generative.mjs`: deterministic generation, typography, palette and axis checks.

## Validation

```sh
pnpm install
pnpm exec tsc --noEmit
node --experimental-strip-types --test scripts/test-generative.mjs
pnpm run build
```

The public preview updates at `https://emitrice.com/generative/` after feature-branch commits; production `main` remains a separate homepage.
