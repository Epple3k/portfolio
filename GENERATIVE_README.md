# Generative edition of the original portfolio

This is the **same portfolio**, not a competing visual identity.

The live portfolio's proportions and interactive vocabulary stay recognizable:

- Left-hand name, rotating subheading, and the familiar links
- Right-hand stack of four expanding project panels
- Grayscale project previews that come alive on hover
- Original project overlays, blog tabs, subscriptions, links, and analytics
- A clean, continuous directional gradient instead of decorative illustrations

## What changes?

A page-load seed selects one of five **bold sans-serif font families**, one of ten rich palettes, a subtle gradient angle/stop/glow, typographic weight/spacing, and minor shifts to the location and proportion of **existing** elements. The four project cards can appear in a different order, but their content never changes.

The gradient editions are deliberately related to the original acid-green home page: **green**, **mint**, **pink**, **blue**, **purple**, **orange**, **lime**, **lavender**, **magenta**, and **aqua**. Each is a light-to-saturated field similar to the production gradient, rather than a graphic collage.

The four composition profiles (`original`, `high`, `low`, and `spread`) adjust the left/right balance, position of the name/intro, and links. They don't replace the project's familiar hover-expanding vertical ribbon.

## Edition controls

- Every ordinary page load generates a new edition.
- **new edition** immediately regenerates.
- **copy edition** provides a `?seed=` permalink that reproduces the exact version.
- No external procedural graphics libraries or stock illustrations are loaded.

## QA

```bash
pnpm install
pnpm exec tsc --noEmit
node --experimental-strip-types --test scripts/test-generative.mjs
pnpm build
```

The original homepage remains built from `main`. The alternate branch builds separately into the `/generative/` path by the existing GitHub Pages workflow.
