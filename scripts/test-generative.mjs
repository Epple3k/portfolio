import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

import { createDesign, hashSeed, randomFromSeed, initialSeed, nextEditionSeed } from "../src/generative/design.ts"

const projects = ["01", "02", "03", "04"]

test("the same seed always generates the same edition", () => {
  const first = createDesign("shareable-abc123")
  assert.deepEqual(first, createDesign("shareable-abc123"))
  assert.equal(hashSeed("shareable-abc123"), hashSeed("shareable-abc123"))
})

test("the RNG remains deterministic without depending on Math.random", () => {
  const sequence = (seed) => {
    const next = randomFromSeed(seed)
    return Array.from({ length: 10 }, () => next())
  }
  assert.deepEqual(sequence(42), sequence(42))
  assert.notDeepEqual(sequence(42), sequence(41))
})

test("every edition preserves all four original projects exactly once", () => {
  for (let i = 0; i < 500; i++) {
    const edition = createDesign(`portfolio-${i}`)
    assert.deepEqual([...edition.order].sort(), projects)
  }
})

function luminance(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const linear = rgb.map((n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function contrast(a, b) {
  const levels = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (levels[0] + 0.05) / (levels[1] + 0.05)
}

test("every generated palette has accessible editorial text contrast", () => {
  for (let i = 0; i < 500; i++) {
    const { palette } = createDesign(`contrast-${i}`)
    assert.ok(contrast(palette.paper, palette.ink) >= 7, "paper to ink must meet WCAG AAA")
    assert.ok(contrast(palette.panel, palette.ink) >= 7, "panel to ink must meet WCAG AAA")
  }
})

test("seed space contains five bright identities, motifs and ribbon arrangements", () => {
  const editions = Array.from({ length: 1000 }, (_, i) => createDesign(`edition-${i}`))
  assert.equal(new Set(editions.map((d) => d.family.id)).size, 5)
  assert.equal(new Set(editions.map((d) => d.family.motif)).size, 5)
  assert.equal(new Set(editions.map((d) => d.layout)).size, 8)
  assert.ok(new Set(editions.map((d) => d.palette.paper)).size >= 10)
})

test("the same content is always present in every composition", () => {
  const variants = new Set()
  for (let i = 0; i < 600; i++) {
    const d = createDesign(`layout-${i}`)
    variants.add(d.layout)
    assert.deepEqual([...d.order].sort(), projects)
    assert.ok(d.headlineScale >= .87 && d.headlineScale <= 1.32)
    assert.ok(d.descriptionScale >= .90 && d.descriptionScale <= 1.18)
    assert.ok(d.columnBias >= -40 && d.columnBias <= 40)
    assert.ok(d.projectTitleScale >= .85 && d.projectTitleScale <= 1.20)
  }
  assert.deepEqual([...variants].sort(), ["banner", "flip", "mosaic", "poster", "runway", "scatter", "sideways", "split"])
})

test("next edition avoids repeating its last layout", () => {
  for (const previous of ["split", "flip", "banner", "runway", "scatter", "poster", "mosaic", "sideways"]) {
    for (let i = 0; i < 12; i++) {
      assert.notEqual(createDesign(nextEditionSeed(previous)).layout, previous)
    }
  }
})

test("every composition retains the original content, navigation, and real previews", () => {
  const css = readFileSync(new URL("../src/generative/editorial.css", import.meta.url), "utf8")
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const home = readFileSync(new URL("../src/generative/EditorialHome.tsx", import.meta.url), "utf8")
  const base = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8")
  assert.ok(base.includes('editorial.css'))
  assert.match(app, /<EditorialHome/)
  assert.match(home, /<nav className="tile-links"/)
  assert.match(home, /aria-label="Explore and contact"/)
  assert.ok(home.includes("subheading"))
  assert.ok(home.includes("ProjectImage"))
  assert.ok(css.includes(".tile-links a:hover"))
  assert.ok(css.includes('"Helvetica Neue", Arial, sans-serif'))
  assert.ok(css.includes("linear-gradient(90deg, #f0fff0 0%, #c2ffc2 45%, #00ff00 100%)"))
  assert.ok(!css.includes("#faff00"), "Bright yellow placeholder palette must not return")
  assert.ok(!home.includes("FIELD NOTE"), "No filler editorial panels")
  for (const layout of ["split", "flip", "banner", "runway", "scatter", "poster", "mosaic", "sideways"]) {
    assert.ok(css.includes(".tile-layout-" + layout), "Missing tile composition " + layout)
    assert.ok(home.includes(layout + ': "'), "Missing scroll axis for " + layout)
  }
  for (const name of ["blog", "linkedin", "github", "email", "resume"]) {
    assert.match(home, new RegExp(name))
  }
  for (const id of projects) assert.match(app, new RegExp('id: "' + id + '"'))
})

test("large project canvas scrolls on both axes, using real project previews", () => {
  const home = readFileSync(new URL("../src/generative/EditorialHome.tsx", import.meta.url), "utf8")
  const css = readFileSync(new URL("../src/generative/editorial.css", import.meta.url), "utf8")
  assert.match(home, /split: "vertical"/)
  assert.match(home, /flip: "horizontal"/)
  assert.match(home, /poster: "vertical"/)
  assert.ok(home.includes('tabIndex={0}'))
  assert.ok(home.includes('addEventListener("wheel", onWheel, { passive: false })'))
  assert.ok(home.includes("project.previewUrl"))
  assert.ok(home.includes("project.idlePreviewUrl"))
  assert.ok(home.includes("onClick={() => onOpen(project.id)}"))
  assert.ok(css.includes("overflow-x: auto"))
  assert.ok(css.includes("overflow-y: auto"))
  assert.ok(css.includes("scroll-snap-type: x mandatory"))
  assert.ok(css.includes("scroll-snap-type: y mandatory"))
})

test("reload control replaces the old toolbar and triggers an actual page refresh", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8")
  const css = readFileSync(new URL("../src/generative/generative.css", import.meta.url), "utf8")
  assert.ok(app.includes('className="gen-reload"'))
  assert.ok(app.includes('window.location.reload()'))
  assert.ok(app.includes('url.searchParams.delete("seed")'))
  assert.ok(app.includes('aria-label="Reload site and generate a new design"'))
  assert.ok(!app.includes('className="gen-controls"'))
  assert.ok(!app.includes('copy edition'))
  assert.ok(css.includes('position: fixed;'))
  assert.ok(css.includes('left: max(12px, env(safe-area-inset-left))'))
})

test("a valid URL seed reproduces an edition", () => {
  globalThis.window = { location: { search: "?blog=1&seed=shared2026" } }
  assert.equal(initialSeed(), "shared2026")
  globalThis.window = { location: { search: "?seed=%3Cinvalid%3E" } }
  assert.notEqual(initialSeed(), "<invalid>")
  delete globalThis.window
})
