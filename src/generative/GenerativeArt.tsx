import React, { useMemo } from "react"
import { randomFromSeed, type GeneratedDesign } from "./design"

/**
 * Vector decorations generated from the same seed as the layout.
 * Deliberately decorative: never a replacement for project titles or content.
 * SVG keeps artwork crisp on retina/mobile without external graphics requests.
 */
export function GenerativeArt({ design }: { design: GeneratedDesign }) {
  const marks = useMemo(() => {
    const random = randomFromSeed(design.artSeed)
    const ink = design.palette.ink
    const accent = design.palette.accent
    const secondary = design.palette.secondary
    const shapes: React.ReactNode[] = []

    if (design.family.motif === "orbits") {
      for (let i = 0; i < 22; i++) {
        const radius = 68 + i * (18 + random() * 3)
        shapes.push(
          <ellipse key={`orbit-${i}`} cx="1150" cy="470" rx={radius * 1.25} ry={radius * 0.8}
            transform={`rotate(${-24 + i * 1.8} 1150 470)`}
            fill="none" stroke={i % 5 === 0 ? accent : ink} strokeWidth={i % 5 === 0 ? 4 : 1.1}
            opacity={i % 5 === 0 ? 0.7 : 0.18} />,
        )
      }
      for (let i = 0; i < 16; i++) {
        const angle = random() * Math.PI * 2
        const radius = 130 + random() * 500
        shapes.push(
          <circle key={`dot-${i}`} cx={1150 + Math.cos(angle) * radius}
            cy={470 + Math.sin(angle) * radius * 0.65}
            r={4 + random() * 24} fill={i % 3 ? secondary : accent} opacity="0.55" />,
        )
      }
    }

    if (design.family.motif === "contours") {
      for (let i = 0; i < 38; i++) {
        const y = 100 + i * 25
        let d = `M -100 ${y}`
        for (let x = -100; x <= 1800; x += 26) {
          const wave = Math.sin(x / (90 + i * 2.4) + i * 0.16) * (52 + i * 1.8)
          const secondaryWave = Math.sin(x / 190 + i * 0.36) * 33
          d += ` L ${x} ${(y + wave + secondaryWave).toFixed(1)}`
        }
        shapes.push(
          <path key={`contour-${i}`} d={d} fill="none"
            stroke={i % 8 === 0 ? accent : i % 3 === 0 ? secondary : ink}
            strokeWidth={i % 8 === 0 ? 4 : 1}
            opacity={i % 8 === 0 ? 0.58 : 0.17} />,
        )
      }
    }

    if (design.family.motif === "stripes") {
      for (let i = 0; i < 34; i++) {
        const x = -100 + i * 57
        const y = -180 + random() * 200
        const width = 8 + random() * 39
        const height = 750 + random() * 690
        shapes.push(
          <rect key={`strip-${i}`} x={x} y={y} width={width} height={height}
            rx={i % 6 === 0 ? 80 : 1}
            transform={`rotate(${-31 + design.artTilt * 0.25} ${x + width / 2} ${y + height / 2})`}
            fill={i % 5 === 0 ? accent : i % 3 === 0 ? secondary : ink}
            opacity={i % 5 === 0 ? 0.48 : 0.12 + random() * 0.12} />,
        )
      }
      for (let i = 0; i < 7; i++) {
        shapes.push(
          <circle key={`cutout-${i}`} cx={240 + i * 195} cy={120 + (i % 3) * 270}
            r={30 + random() * 105} fill="none" stroke={accent}
            strokeWidth={1 + random() * 9} opacity="0.28" />,
        )
      }
    }

    if (design.family.motif === "symbols") {
      for (let i = 0; i < 26; i++) {
        const x = (i % 7) * 230 + 45
        const y = Math.floor(i / 7) * 250 + 60
        const size = 25 + random() * 92
        const type = Math.floor(random() * 4)
        const color = i % 4 === 0 ? accent : i % 3 === 0 ? secondary : ink
        if (type === 0) {
          shapes.push(<circle key={i} cx={x} cy={y} r={size} fill="none"
            stroke={color} strokeWidth="3" opacity="0.32" />)
        } else if (type === 1) {
          shapes.push(<path key={i} d={`M ${x - size} ${y} H ${x + size} M ${x} ${y - size} V ${y + size}`}
            fill="none" stroke={color} strokeWidth="5" opacity="0.34" />)
        } else if (type === 2) {
          shapes.push(<rect key={i} x={x - size / 2} y={y - size / 2}
            width={size} height={size} transform={`rotate(45 ${x} ${y})`}
            fill="none" stroke={color} strokeWidth="3" opacity="0.3" />)
        } else {
          shapes.push(<path key={i}
            d={`M ${x - size} ${y + size / 2} L ${x} ${y - size} L ${x + size} ${y + size / 2} Z`}
            stroke={color} strokeWidth="2" fill="none" opacity="0.3" />)
        }
      }
    }
    return shapes
  }, [design])

  return (
    <svg className="gen-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"
      aria-hidden="true" focusable="false">
      <defs>
        <pattern id="generative-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none"
            stroke={design.palette.ink} strokeWidth="0.8" opacity="0.17" />
        </pattern>
      </defs>
      {design.family.motif === "symbols" && (
        <rect width="1600" height="1000" fill="url(#generative-grid)" />
      )}
      <g transform={`translate(${design.artOffset - 42} 0) scale(${design.artScale})`}>
        {marks}
      </g>
      <path d="M 30 35 h 70 M 30 35 v 70 M 1570 965 h -70 M 1570 965 v -70"
        stroke={design.palette.accent} strokeWidth="3" fill="none" opacity="0.7" />
    </svg>
  )
}
