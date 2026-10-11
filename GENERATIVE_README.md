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

Five seeded composition profiles now **rearrange the page**, not merely adjust margins: `split` preserves the original placement; `flip` reverses projects and introduction; `banner` turns the name into a full-width masthead; `runway` moves the expanding project ribbon horizontally across the bottom; and `scatter` places a lower-left ribbon below an oversized headline, with introduction and navigation on the right. The heading, introduction, links, and projects are the same elements and remain functional. Mobile uses a readable stacked arrangement. Typography, project-title sizing, navigation weight and spacing also vary independently within deliberate bounds.

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
