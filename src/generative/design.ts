/**
 * Procedural art direction for the alternate portfolio.
 * Every family is curated; the seed changes composition without breaking readability.
 * No content, API, analytics, or subscription logic lives here.
 */
export type Layout = "ribbon" | "magazine" | "index" | "gallery"
export type Motif = "orbits" | "contours" | "stripes" | "symbols"

type Palette = { paper: string; ink: string; panel: string; accent: string; secondary: string }
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
    name: "Signal Index",
    layouts: ["index", "ribbon"],
    motif: "symbols",
    display: '"Space Grotesk", "Arial", sans-serif',
    body: '"DM Sans", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#f0f3dc", ink: "#192521", panel: "#fcfdf4", accent: "#d95131", secondary: "#337a71" },
      { paper: "#e6eff6", ink: "#182637", panel: "#f9fcff", accent: "#e05f3e", secondary: "#386eb5" },
    ],
  },
  {
    id: "atelier",
    name: "Paper Atelier",
    layouts: ["magazine", "gallery"],
    motif: "stripes",
    display: '"Instrument Serif", Georgia, serif',
    body: '"DM Sans", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#f5e9d9", ink: "#302126", panel: "#fffaf0", accent: "#bf4d41", secondary: "#416f73" },
      { paper: "#ebe5ed", ink: "#2d263d", panel: "#faf7fd", accent: "#aa3d6f", secondary: "#51776b" },
    ],
  },
  {
    id: "kinetic",
    name: "Kinetic Type",
    layouts: ["gallery", "index"],
    motif: "orbits",
    display: '"Archivo Black", Impact, sans-serif',
    body: '"Space Grotesk", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#f6f3ec", ink: "#212329", panel: "#fffdfa", accent: "#f05b39", secondary: "#3a65ca" },
      { paper: "#ecf2e9", ink: "#26332a", panel: "#fafff7", accent: "#d14e32", secondary: "#4964c0" },
    ],
  },
  {
    id: "field",
    name: "Field Notes",
    layouts: ["ribbon", "magazine"],
    motif: "contours",
    display: '"Fraunces", Georgia, serif',
    body: '"DM Sans", Arial, sans-serif',
    mono: '"IBM Plex Mono", monospace',
    palettes: [
      { paper: "#e8f0e9", ink: "#19332f", panel: "#f8fcf5", accent: "#ab4a32", secondary: "#427e91" },
      { paper: "#f3ebdf", ink: "#2e3228", panel: "#fffaf2", accent: "#a9494f", secondary: "#377e73" },
    ],
  },
]

/** Hash any shareable seed into a stable 32-bit number. */
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
  // A stable shuffle retains every project, its content, links, and analytics identifiers.
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
    artTilt: -25 + random() * 50,
    artScale: 0.8 + random() * 0.6,
    artOffset: 10 + Math.round(random() * 75),
    typeScale: 0.88 + random() * 0.36,
    spacing: 12 + Math.round(random() * 12),
  }
}

export type GeneratedDesign = ReturnType<typeof createDesign>

export function shareableUrl(seed: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set("seed", seed)
  return url.toString()
}
