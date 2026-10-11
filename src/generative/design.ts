/**
 * A family resemblance, not a collection of templates.
 * The original portfolio's split hero, glowing gradients and expanding
 * project ribbon remain constant. Seeds bend its color, type, composition
 * and procedural artwork into new visual editions.
 */
export type Layout = "ribbon" | "offset" | "wide" | "cascade"
export type Motif = "liquid" | "orbit" | "prism" | "echo" | "bloom"

type Palette = {
  paper: string
  ink: string
  panel: string
  accent: string
  secondary: string
  bloom: string
  middle: string
  edge: string
}
type Family = {
  id: string
  name: string
  layouts: Layout[]
  motif: Motif
  display: string
  body: string
  mono: string
  palettes: Palette[]
}

const FAMILIES: Family[] = [
  {
    id: "signal",
    name: "Chromatic Signal",
    layouts: ["ribbon", "wide", "offset"],
    motif: "orbit",
    display: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    body: '"Space Grotesk", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#dfffe0", ink: "#102c22", panel: "#effff0", accent: "#00ad38", secondary: "#5cff00", bloom: "#e7ff9d", middle: "#91ff70", edge: "#00ed70" },
      { paper: "#cefff4", ink: "#08332e", panel: "#effff9", accent: "#0879a0", secondary: "#6bfff4", bloom: "#fff197", middle: "#5df7d4", edge: "#0bd0c6" },
    ],
  },
  {
    id: "liquid",
    name: "Liquid Spectrum",
    layouts: ["ribbon", "cascade", "offset"],
    motif: "liquid",
    display: '"Syne", "Helvetica Neue", sans-serif',
    body: '"DM Sans", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#ffe5f6", ink: "#401339", panel: "#fff1fa", accent: "#b8007d", secondary: "#ff65bd", bloom: "#ffd87e", middle: "#ff9acb", edge: "#c787ff" },
      { paper: "#d5e3ff", ink: "#1a2351", panel: "#f2f7ff", accent: "#5032bd", secondary: "#7af4ff", bloom: "#b6edff", middle: "#8cafff", edge: "#9f63ff" },
    ],
  },
  {
    id: "prism",
    name: "Soft Prism",
    layouts: ["wide", "offset", "cascade"],
    motif: "prism",
    display: '"Outfit", "Helvetica Neue", sans-serif',
    body: '"Outfit", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#ffe6d3", ink: "#392325", panel: "#fff7f0", accent: "#c7444e", secondary: "#fb725e", bloom: "#f8ff87", middle: "#ffad7e", edge: "#ff6083" },
      { paper: "#fff1b7", ink: "#342719", panel: "#fffae7", accent: "#ac4827", secondary: "#fc705c", bloom: "#dcff81", middle: "#ffcf61", edge: "#ff824c" },
    ],
  },
  {
    id: "echo",
    name: "Type Echo",
    layouts: ["ribbon", "wide", "cascade"],
    motif: "echo",
    display: '"Unbounded", "Arial Black", sans-serif',
    body: '"Space Grotesk", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#e3e0ff", ink: "#2b2054", panel: "#f3f0ff", accent: "#5c39ad", secondary: "#9d69fb", bloom: "#ffc0e7", middle: "#c0aaff", edge: "#7890ff" },
      { paper: "#ceecff", ink: "#152c4c", panel: "#ecf9ff", accent: "#2767b0", secondary: "#ff64a1", bloom: "#ffe5fb", middle: "#a2caff", edge: "#4abcf5" },
    ],
  },
  {
    id: "bloom",
    name: "Radiant Bloom",
    layouts: ["offset", "ribbon", "wide"],
    motif: "bloom",
    display: '"Instrument Serif", Georgia, serif',
    body: '"DM Sans", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#eaffed", ink: "#183b2e", panel: "#f3fff7", accent: "#176f49", secondary: "#00c97a", bloom: "#f6ffb4", middle: "#9afbc9", edge: "#60dbed" },
      { paper: "#fff0e6", ink: "#40262b", panel: "#fff9f4", accent: "#b73c62", secondary: "#ff77b7", bloom: "#fff1a0", middle: "#ffc0b8", edge: "#ffa0e6" },
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
  const random = randomFromSeed(hashSeed(seed))
  const family = FAMILIES[Math.floor(random() * FAMILIES.length)]
  const palette = family.palettes[Math.floor(random() * family.palettes.length)]
  const layout = family.layouts[Math.floor(random() * family.layouts.length)]
  const ids = ["01", "02", "03", "04"]

  // Change the browsing rhythm, never the content or links.
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }

  return {
    seed,
    family,
    palette,
    layout,
    order: ids,
    artSeed: Math.floor(random() * 0xffffffff),
    artTilt: -38 + random() * 76,
    artScale: 0.76 + random() * 0.68,
    artOffset: 10 + Math.round(random() * 70),
    typeScale: 0.85 + random() * 0.35,
    spacing: 8 + Math.round(random() * 10),
    // All gradient positions, opacity, and typographic rhythm share the seed.
    glowX: 56 + Math.round(random() * 36),
    glowY: 22 + Math.round(random() * 54),
    bloomX: 48 + Math.round(random() * 40),
    bloomY: 10 + Math.round(random() * 75),
    displayWeight: family.id === "bloom" ? 400 : family.id === "echo" ? 600 : 500,
    nameTreatment: Math.floor(random() * 3),
    wavePhase: random() * Math.PI * 2,
  }
}

export type GeneratedDesign = ReturnType<typeof createDesign>

export function shareableUrl(seed: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set("seed", seed)
  return url.toString()
}
