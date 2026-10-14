# Generative portfolio: editorial sheets

The \`feature/generative-portfolio\` branch presents the existing portfolio projects in a changing collection of **minimal editorial page layouts**, based on landscape graphic-design portfolio spreads.

## Visual direction

- White paper, black typography, acid-yellow picture fields.
- Wide margins, small project indices, thin rules, measured captions.
- Dramatic shifts in relative tile size: one-picture covers, mirrored covers, three-up strips, dual panels, narrow text rails, asymmetrical mosaics and stacked image spreads.
- Eight reproducible compositions: \`split\`, \`flip\`, \`banner\`, \`runway\`, \`scatter\`, \`poster\`, \`mosaic\`, and \`sideways\`.
- Every seeded edition preserves **all four real projects**, but changes their order and page geometry.

The same homepage, blog, case-study overlays, analytics, subscriber form and external project destinations remain connected. A corner reload control generates a new page composition. Permalinks with \`?seed=...\` retain an edition.

## Scrollable project canvases

The oversized yellow tiles are not static placeholders. They contain scrollable covers, project descriptions, and live-preview windows. Different compositions assign scrolling directions:

- **Vertical:** for tall feature tiles, drag/scroll down inside the image area.
- **Horizontal:** for wide panoramas, swipe sideways or use an ordinary mouse wheel while hovering inside the canvas.
- Small secondary tiles are direct project-opening targets, with a separate text link to open the corresponding project.

Scroll regions are keyboard-focusable, carry accessible labels and use scroll snapping; reduced-motion settings are respected. Project previews only mount while the associated tile is active to avoid loading multiple interactive websites unnecessarily.

## Responsiveness

On phones and smaller tablets, the designs become legible one- or two-column stacks, with the media and captions for **every project** still present and no horizontal page overflow.

## Source

- \`src/generative/EditorialHome.tsx\`: editorial layout and interactive scroll areas.
- \`src/generative/editorial.css\`: white-paper visual styling, eight desktop formats and responsive rules.
- \`src/generative/design.ts\`: seeded edition and project-order selection.
- \`src/App.tsx\`: original data, blog, actions and overlays.
- \`scripts/test-generative.mjs\`: deterministic generation and editorial interaction assertions.

## QA

\`\`\`bash
pnpm install
pnpm exec tsc --noEmit
node --experimental-strip-types --test scripts/test-generative.mjs
pnpm build
\`\`\`

Only the generative feature branch is changed here. The production homepage continues to build from \`main\` until these changes are deliberately merged.
