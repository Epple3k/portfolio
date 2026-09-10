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
 * get a visible gap between the finger and the hand.
 *
 * Only the index finger animates on click (see .indexFinger /
 * .indexPressed in CursorHand.module.css) — the palm, thumb, and
 * curled fingers are static. It scales along Y anchored at the tip
 * (HAND_HOTSPOT_VB), so the base retracts toward the palm while the
 * tip — which is also the cursor hotspot — never moves.
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
  className,
  indexFingerClassName,
}: {
  className?: string;
  /** Class(es) applied to just the index-finger rect — see CursorHand.tsx. */
  indexFingerClassName?: string;
}) {
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
      {/* Thumb, tucked against the palm's right side, near the base of
          the index finger — mirrors a natural pointing-hand silhouette
          better than tucking it under the curled fingers on the left. */}
      <rect x="66" y="70" width="20" height="34" rx="10" fill={FILL} transform="rotate(20 76 87)" />
      {/* Curled fingers (pinky, ring, middle) — contiguous, shortest to
          tallest, all based at y=70 (sunk into the palm, which starts
          at y=60, for a solid seam). Always static. */}
      <rect x="16" y="44" width="13" height="26" rx="6.5" fill={FILL} />
      <rect x="29" y="38" width="15" height="32" rx="7.5" fill={FILL} />
      <rect x="44" y="36" width="15" height="34" rx="7.5" fill={FILL} />
      {/* Extended index finger — the only part that animates on click.
          Its tip is the hotspot. */}
      <rect
        x="56"
        y="2"
        width="22"
        height="70"
        rx="11"
        fill={FILL}
        className={indexFingerClassName}
        style={{ transformOrigin: `${HAND_HOTSPOT_VB.x}px ${HAND_HOTSPOT_VB.y}px` }}
      />
    </svg>
  );
}
