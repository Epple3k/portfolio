# Generative Portfolio · alternate edition

This branch is a **non-destructive, seeded generative redesign** of the original portfolio. It deliberately preserves the source of content, API requests, event instrumentation, project links, live-preview iframes, and all blog/subscription interactions.

## What changes on each page load?

Without a `seed` query parameter, every page load draws a cryptographic random seed and creates a new design. A seed determines one of four art-directed visual families, an accessible color palette, type choices, vector artwork, a layout, spacing/typographic scale, and project presentation order. It does **not** change, delete, or generate biographical/project/blog content.

Families:
- **Signal Index:** graphic symbols, measured layouts, technical typography
- **Paper Atelier:** editorial serif type, stripe compositions, warm paper palettes
- **Kinetic Type:** oversized grotesk type, orbit drawings, punchy composition
- **Field Notes:** organic contour lines, expressive serif display, research-journal palettes

Supported layouts: `ribbon`, `magazine`, `index`, `gallery`. Curated families select appropriate layout pairings, so not all combinations appear.

## Controls / permalinks

- **new edition ↻:** generate a new seed without navigating away or altering any live content.
- **copy edition:** copy a permalink containing `?seed=...` to reopen the exact design; this keeps `?blog=1` and other URL parameters if present.
- **Page refresh:** generate another design by default. For an edition permalink with `?seed=...`, a refresh reproduces the same result intentionally.
- **Tab / keyboard:** project cards can be opened with Enter or Space. All controls have visible focus.
- **Reduced motion:** honors `prefers-reduced-motion` and retains the original static/project-preview behavior.

## How to run

```bash
pnpm install
pnpm dev
pnpm exec tsc --noEmit
node --experimental-strip-types --test scripts/test-generative.mjs
pnpm build
```

The new code is isolated in `src/generative/`, with a small integration in `src/App.tsx` and stylesheet import in `src/main.tsx`. Fonts load from Google Fonts, with system font fallbacks. SVG graphics use no external art dependencies.

## Deployment boundary

The existing GitHub Pages workflow deploys only pushes to `main`. This branch and any draft PR should not change the live production site. Merge/deploy only after reviewing the responsive experience and subscribing/blog behavior.

The branch doesn't include an automatic separate public preview, since the existing workflow isn't configured for branch previews.
