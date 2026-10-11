import React from "react"
import type { GeneratedDesign } from "./design"

/**
 * The original portfolio is essentially a rich, continuous color gradient.
 * Keep that language intact. An edition only changes its stops, angle,
 * and the position of the subtle hover glow. No objects, patterns, or SVG art.
 */
export function GenerativeArt({ design }: { design: GeneratedDesign }) {
  const { palette, angle, middleStop, glowX, glowY } = design

  return (
    <div className="gen-atmosphere" aria-hidden="true">
      <div
        className="gen-gradient"
        style={{
          background: `linear-gradient(${angle}deg, ${palette.paper} 0%, ${palette.middle} ${middleStop}%, ${palette.edge} 100%)`,
        }}
      />
      <div
        className="gen-wash"
        style={{
          background: `radial-gradient(ellipse at ${glowX}% ${glowY}%, ${palette.bloom} 0%, transparent 65%)`,
        }}
      />
      <div
        className="gen-hover-glow"
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${palette.secondary} 0%, transparent 62%)`,
        }}
      />
    </div>
  )
}
