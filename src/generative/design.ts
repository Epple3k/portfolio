/**
 * Editions of the original portfolio rather than interchangeable templates.
 * The site structure, projects, expanding ribbon, and interactions stay the
 * same. A seed controls only bold type, luminous gradients, and small shifts
 * in the layout's composition.
 */
export type Layout = "split" | "flip" | "banner" | "runway" | "scatter"
export const LAYOUTS: readonly Layout[] = ["split", "flip", "banner", "runway", "scatter"]
export type Motif = "gradient" | "gradient-soft" | "gradient-bright" | "gradient-deep" | "gradient-warm"

type Palette = {
  paper: string
  middle: string
  edge: string
  ink: string
  panel: string
  accent: string
  secondary: string
  bloom: string
}
type Family = {
  id: string
  name: string
  motif: Motif
  layouts: Layout[]
  display: string
  body: string
  mono: string
  weight: number
  palettes: Palette[]
}

const FAMILIES: Family[] = [
  {
    id: "grotesk", name: "grotesk", motif: "gradient",
    layouts: ["split", "flip", "banner", "runway", "scatter"],
    display: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    body: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace', weight: 700,
    palettes: [
      { paper: "#effff0", middle: "#b0ffa8", edge: "#12f520", ink: "#102510", panel: "#e5e5e5", accent: "#008e17", secondary: "#8cff79", bloom: "#bfffbb" },
      { paper: "#e4fff6", middle: "#8af6d4", edge: "#09d5a0", ink: "#103128", panel: "#e5e5e5", accent: "#02785e", secondary: "#69eac8", bloom: "#abffe9" },
    ],
  },
  {
    id: "heavy", name: "heavy", motif: "gradient-bright",
    layouts: ["split", "flip", "banner", "runway", "scatter"],
    display: '"Archivo Black", "Arial Black", Arial, sans-serif',
    body: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace', weight: 400,
    palettes: [
      { paper: "#fff1ee", middle: "#ffb4c7", edge: "#ff4f90", ink: "#341925", panel: "#e5e5e5", accent: "#a92356", secondary: "#f98aba", bloom: "#ffd2e0" },
      { paper: "#e9f7ff", middle: "#8cdbff", edge: "#1894ff", ink: "#10273c", panel: "#e5e5e5", accent: "#1265ad", secondary: "#85cfff", bloom: "#c3ecff" },
    ],
  },
  {
    id: "syne", name: "syne", motif: "gradient-deep",
    layouts: ["split", "flip", "banner", "runway", "scatter"],
    display: '"Syne", "Helvetica Neue", Arial, sans-serif',
    body: '"Syne", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace', weight: 800,
    palettes: [
      { paper: "#f3ecff", middle: "#cbb0ff", edge: "#8754fd", ink: "#25193f", panel: "#e5e5e5", accent: "#6037b2", secondary: "#b592ff", bloom: "#e0ccff" },
      { paper: "#fff2e4", middle: "#ffc58f", edge: "#ff7a36", ink: "#38271b", panel: "#e5e5e5", accent: "#ab4726", secondary: "#ffbd87", bloom: "#ffe0b5" },
    ],
  },
  {
    id: "rounded", name: "rounded", motif: "gradient-soft",
    layouts: ["split", "flip", "banner", "runway", "scatter"],
    display: '"Outfit", "Helvetica Neue", Arial, sans-serif',
    body: '"Outfit", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace', weight: 800,
    palettes: [
      { paper: "#f6f7ff", middle: "#b2bdff", edge: "#616ff4", ink: "#202645", panel: "#e5e5e5", accent: "#444cb0", secondary: "#b3bcff", bloom: "#dce2ff" },
      { paper: "#fffde6", middle: "#f2ff9e", edge: "#beff26", ink: "#253012", panel: "#e5e5e5", accent: "#597f00", secondary: "#e4fb6d", bloom: "#f5ffc7" },
    ],
  },
  {
    id: "wide", name: "wide", motif: "gradient-warm",
    layouts: ["split", "flip", "banner", "runway", "scatter"],
    display: '"Unbounded", "Arial Black", Arial, sans-serif',
    body: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace', weight: 700,
    palettes: [
      { paper: "#fdf0ff", middle: "#edb0fd", edge: "#ce48ec", ink: "#38213b", panel: "#e5e5e5", accent: "#9734a7", secondary: "#e39bff", bloom: "#f6d7ff" },
      { paper: "#e7fff9", middle: "#87f8f4", edge: "#20cadc", ink: "#173039", panel: "#e5e5e5", accent: "#09808b", secondary: "#9cf6fa", bloom: "#c8ffff" },
    ],
  },
]

export function hashSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function randomFromSeed(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let x = state
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function freshSeed(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(2)
    crypto.getRandomValues(values)
    return Array.from(values, (number) => number.toString(36)).join("-")
  }
  return Date.now().toString(36)
}

export function initialSeed(): string {
  const provided = new URLSearchParams(window.location.search).get("seed")
  return provided && /^[a-zA-Z0-9_-]{3,40}$/.test(provided) ? provided : freshSeed()
}

export function createDesign(seed: string) {
  const rnd = randomFromSeed(hashSeed(seed))
  const family = FAMILIES[Math.floor(rnd() * FAMILIES.length)]
  const palette = family.palettes[Math.floor(rnd() * family.palettes.length)]
  const layout = LAYOUTS[Math.floor(rnd() * LAYOUTS.length)]
  // Preserve all four projects and their metadata; only their order changes.
  const ids = ["01", "02", "03", "04"]
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }

  return {
    seed, family, palette, layout, order: ids,
    angle: 82 + Math.round(rnd() * 21),
    middleStop: 35 + Math.round(rnd() * 16),
    glowX: 60 + Math.round(rnd() * 28),
    glowY: 28 + Math.round(rnd() * 42),
    typeScale: .94 + rnd() * .19,
    spacing: 8 + Math.round(rnd() * 6),
    displayWeight: family.weight,
    nameTreatment: Math.floor(rnd() * 4),
    headlineScale: 0.87 + rnd() * .45,
    descriptionScale: 0.90 + rnd() * .28,
    headlineShift: Math.round((rnd() - .5) * 32),
    columnBias: Math.round((rnd() - .5) * 80),
    linkSpread: 7 + Math.round(rnd() * 12),
    titleTracking: -0.09 + rnd() * .045,
    projectTitleScale: 0.85 + rnd() * .35,
  }
}

export type GeneratedDesign = ReturnType<typeof createDesign>

export function shareableUrl(seed: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set("seed", seed)
  return url.toString()
}
