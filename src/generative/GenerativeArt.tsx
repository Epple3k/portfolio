import React, { useMemo } from "react"
import { randomFromSeed, type GeneratedDesign } from "./design"

/**
 * Every edition has its own color field and procedurally drawn vector objects.
 * No image lookup or pre-rendered backgrounds: the seed determines every mark.
 */
export function GenerativeArt({ design }: { design: GeneratedDesign }) {
  const marks = useMemo(() => {
    const rnd = randomFromSeed(design.artSeed)
    const art: React.ReactNode[] = []
    const colors = [design.palette.accent, design.palette.secondary, design.palette.edge, design.palette.bloom]

    if (design.family.motif === "orbit") {
      const cx = 1080 + rnd() * 210
      const cy = 450 + rnd() * 160
      for (let i = 0; i < 24; i++) {
        const rx = 105 + i * (16 + rnd() * 6)
        const ry = 53 + i * (12 + rnd() * 3)
        art.push(
          <ellipse key={`ring-${i}`} cx={cx} cy={cy} rx={rx} ry={ry}
            transform={`rotate(${-40 + i * 3.5 + design.artTilt / 3} ${cx} ${cy})`}
            stroke={colors[i % colors.length]} strokeWidth={i % 5 === 0 ? 8 : 1.8}
            opacity={i % 5 === 0 ? 0.62 : 0.35} fill="none" />,
        )
      }
      for (let i = 0; i < 20; i++) {
        const angle = rnd() * Math.PI * 2
        const r = 80 + rnd() * 475
        art.push(<circle key={`sat-${i}`} cx={cx + Math.cos(angle) * r} cy={cy + Math.sin(angle) * r * 0.8}
          r={4 + rnd() * 20} fill={colors[i % colors.length]} opacity={0.25 + rnd() * 0.52} />)
      }
      art.push(<circle key="sun" cx={cx} cy={cy} r="130" fill="url(#gen-orb)" opacity=".65" />)
    }

    if (design.family.motif === "liquid") {
      for (let i = 0; i < 31; i++) {
        const y = 30 + i * 28
        let d = `M 555 ${y}`
        for (let x = 555; x <= 1780; x += 22) {
          const v = Math.sin(x / (118 + i * 2) + design.wavePhase + i * .22) * (60 + i * 1.4)
          const v2 = Math.sin(x / 61 + i * .11) * 16
          d += ` L ${x} ${(y + v + v2).toFixed(1)}`
        }
        art.push(<path key={`wave-${i}`} d={d} fill="none"
          stroke={i % 7 === 0 ? design.palette.accent : i % 3 === 0 ? design.palette.secondary : "#ffffff"}
          strokeWidth={i % 7 === 0 ? 11 : 3.1} opacity={i % 7 === 0 ? .35 : .30} />)
      }
      for (let i = 0; i < 9; i++) {
        art.push(<ellipse key={`bubble-${i}`} cx={660 + rnd() * 920} cy={70 + rnd() * 850}
          rx={30 + rnd() * 185} ry={20 + rnd() * 105}
          transform={`rotate(${design.artTilt} ${700 + i * 100} 440)`}
          stroke={colors[i % 4]} strokeWidth={2 + rnd() * 10} opacity=".35" fill="none" />)
      }
    }

    if (design.family.motif === "prism") {
      for (let i = 0; i < 16; i++) {
        const x = 650 + i * 66
        const lift = rnd() * 150
        art.push(<path key={`prism-${i}`}
          d={`M ${x} ${-100 + lift} L ${x + 250} ${-100 + lift} L ${x - 180} 1130 L ${x - 395} 1130 Z`}
          fill={colors[i % 4]} opacity={i % 4 === 0 ? .19 : .10}
          stroke="#fff" strokeOpacity=".26" strokeWidth="2" />)
      }
      for (let i = 0; i < 13; i++) {
        const x = 670 + rnd() * 960
        const y = rnd() * 960
        art.push(<circle key={`caustic-${i}`} cx={x} cy={y} r={18 + rnd() * 90}
          stroke="#ffffff" fill="none" strokeWidth={1 + rnd() * 4} opacity=".39" />)
      }
    }

    if (design.family.motif === "echo") {
      const glyphs = ["e", "r", "✳", "↗", "0", "8", "∞"]
      for (let i = 0; i < 17; i++) {
        const x = 540 + rnd() * 1030
        const y = -40 + rnd() * 1150
        const size = 110 + rnd() * 270
        art.push(<text key={`echo-${i}`} x={x} y={y}
          fontSize={size} fontFamily={design.family.display} fontWeight="700"
          transform={`rotate(${-42 + rnd() * 84} ${x} ${y})`}
          fill="none" stroke={colors[i % 4]} strokeWidth={1.3 + rnd() * 3}
          opacity={i % 3 === 0 ? .48 : .24}>{glyphs[Math.floor(rnd() * glyphs.length)]}</text>)
      }
    }

    if (design.family.motif === "bloom") {
      const cx = 1080 + rnd() * 210
      const cy = 420 + rnd() * 120
      for (let i = 0; i < 46; i++) {
        const theta = i * 137.50776 + design.artTilt
        const radial = 65 + i * 12.5
        const px = cx + Math.cos(theta * Math.PI / 180) * radial * 0.78
        const py = cy + Math.sin(theta * Math.PI / 180) * radial * 0.62
        art.push(<ellipse key={`petal-${i}`} cx={px} cy={py}
          rx={35 + rnd() * 110} ry={12 + rnd() * 55}
          transform={`rotate(${theta} ${px} ${py})`}
          fill={colors[i % colors.length]} opacity={.10 + rnd() * .21}
          stroke="#fff" strokeOpacity=".30" strokeWidth="2" />)
      }
      art.push(<circle key="heart" cx={cx} cy={cy} r="180" fill="url(#gen-orb)" opacity=".52" />)
    }
    return art
  }, [design])

  return (
    <div className="gen-atmosphere" aria-hidden="true">
      <svg className="gen-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="gen-field" x1="0" y1="0" x2="1" y2=".36">
            <stop offset="0%" stopColor={design.palette.paper} />
            <stop offset="39%" stopColor={design.palette.bloom} />
            <stop offset="72%" stopColor={design.palette.middle} />
            <stop offset="100%" stopColor={design.palette.edge} />
          </linearGradient>
          <radialGradient id="gen-orb">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset="25%" stopColor={design.palette.bloom} stopOpacity=".9" />
            <stop offset="65%" stopColor={design.palette.secondary} stopOpacity=".68" />
            <stop offset="100%" stopColor={design.palette.accent} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gen-glow">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".86" />
            <stop offset="43%" stopColor={design.palette.bloom} stopOpacity=".55" />
            <stop offset="100%" stopColor={design.palette.secondary} stopOpacity="0" />
          </radialGradient>
          <filter id="gen-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="60" />
          </filter>
          <filter id="gen-soft-blur" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <rect width="1600" height="1000" fill="url(#gen-field)" />
        <g className="gen-drift" filter="url(#gen-blur)" opacity=".75">
          <ellipse cx={design.glowX * 16} cy={design.glowY * 10} rx="560" ry="350"
            fill={design.palette.secondary} />
          <ellipse cx={design.bloomX * 16} cy={design.bloomY * 10} rx="330" ry="440"
            fill={design.palette.bloom} />
          <ellipse cx="1450" cy="950" rx="530" ry="260" fill={design.palette.edge} />
        </g>
        <ellipse cx={design.bloomX * 16} cy={design.bloomY * 10} rx="580" ry="400"
          fill="url(#gen-glow)" opacity=".38" />
        <g className="gen-motif" transform={`translate(${design.artOffset - 38} 0) scale(${design.artScale})`}>
          {marks}
        </g>
        <g opacity=".42" filter="url(#gen-soft-blur)">
          <path d="M 450 150 C 770 -40 970 50 1250 -30" stroke="#ffffff" strokeWidth="70" fill="none" />
        </g>
      </svg>
      <div className="gen-vignette" />
    </div>
  )
}
