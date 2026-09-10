/*
 * HandGlyph — the actual hand artwork, as inline SVG.
 *
 * REPLACE/EDIT THE SHAPE HERE if you want a different silhouette. The
 * only thing that matters for the rest of the system is:
 *   - HAND_VB_WIDTH / HAND_VB_HEIGHT must match the <svg> viewBox.
 *   - HAND_HOTSPOT_VB must point at the exact pixel (in viewBox units)
 *     that should align with the real cursor — here, the tip of the
 *     extended index finger.
 * CursorHand.tsx converts those into a rendered-pixel offset itself;
 * you never need to hand-tune an offset in px.
 *
 * Geometry note: the index finger's base (x:56-78) must sit fully
 * inside the palm's x-range (x:12-80) where they overlap in y, or you
 * get a visible gap between the finger and the hand — that was the
 * bug in the previous version, where the palm only reached x=74.
 */

export const HAND_VB_WIDTH = 100;
export const HAND_VB_HEIGHT = 140;

// Tip of the extended index finger — see the index-finger <rect>
// below: x=56 width=22 means its horizontal center is 56+22/2=67, and
// its top edge is y=2. A rounded rect with rx = half its width has a
// true point-shaped apex at (center-x, top-y), so this is exact.
export const HAND_HOTSPOT_VB = { x: 67, y: 2 };

const FILL = "#ff4500";

export default function HandGlyph({
  pressed,
  className,
}: {
  pressed: boolean;
  className?: string;
}) {
  // Curled fingers tighten toward their own base line (y=70, where all
  // three meet the palm) on press, independent of the outer hand-level
  // squash CursorHand.tsx applies. Written as translate/scale/translate
  // (all in viewBox units) so it doesn't depend on CSS transform-origin
  // behavior inside an SVG.
  const fingersTransform = pressed ? "translate(38 70) scale(1 0.8) translate(-38 -70)" : undefined;

  return (
    <svg
      viewBox={`0 0 ${HAND_VB_WIDTH} ${HAND_VB_HEIGHT}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Wrist */}
      <rect x="28" y="108" width="36" height="28" rx="10" fill={FILL} />
      {/* Palm — wide enough that the index finger's base (56-78) and the
          curled fingers' base (16-59) both land fully inside it. */}
      <rect x="12" y="60" width="68" height="56" rx="24" fill={FILL} />
      {/* Thumb, tucked against the palm's left side */}
      <rect x="4" y="66" width="20" height="34" rx="10" fill={FILL} transform="rotate(-18 14 83)" />
      {/* Curled fingers (pinky, ring, middle) — contiguous, shortest to
          tallest, all based at y=70 (sunk into the palm, which starts
          at y=60, for a solid seam). */}
      <g transform={fingersTransform}>
        <rect x="16" y="44" width="13" height="26" rx="6.5" fill={FILL} />
        <rect x="29" y="38" width="15" height="32" rx="7.5" fill={FILL} />
        <rect x="44" y="36" width="15" height="34" rx="7.5" fill={FILL} />
      </g>
      {/* Extended index finger — the pointing finger. Its base (y:2-72)
          overlaps the middle finger by 3 units and sinks 10 units into
          the palm (palm starts y=60) so there's no seam. Its tip is
          the hotspot. */}
      <rect x="56" y="2" width="22" height="70" rx="11" fill={FILL} />
    </svg>
  );
}
