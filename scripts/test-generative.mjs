import assert from "node:assert/strict"
import test from "node:test"

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

test("a valid URL seed reproduces an edition", () => {
  globalThis.window = { location: { search: "?blog=1&seed=shared2026" } }
  assert.equal(initialSeed(), "shared2026")
  globalThis.window = { location: { search: "?seed=%3Cinvalid%3E" } }
  assert.notEqual(initialSeed(), "<invalid>")
  delete globalThis.window
})
