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
 */

export const HAND_VB_WIDTH = 100;
export const HAND_VB_HEIGHT = 140;

// Tip of the extended index finger — see the index-finger <rect>
// below: x=64 width=22 means its horizontal center is 64+22/2=75, and
// its top edge is y=4. A rounded rect with rx = half its width has a
// true point-shaped apex at (center-x, top-y), so this is exact.
export const HAND_HOTSPOT_VB = { x: 75, y: 4 };

const FILL = "#ff4500";

export default function HandGlyph({
  pressed,
  className,
}: {
  pressed: boolean;
  className?: string;
}) {
  // Curled fingers tighten toward their own knuckle line on press,
  // independent of the outer hand-level squash CursorHand.tsx applies.
  // Written as translate/scale/translate (all in viewBox units) so it
  // doesn't depend on CSS transform-origin behavior inside an SVG.
  const fingersTransform = pressed ? "translate(38 70) scale(1 0.8) translate(-38 -70)" : undefined;

  return (
    <svg
      viewBox={`0 0 ${HAND_VB_WIDTH} ${HAND_VB_HEIGHT}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Wrist */}
      <rect x="30" y="108" width="34" height="28" rx="10" fill={FILL} />
      {/* Palm */}
      <rect x="14" y="64" width="60" height="52" rx="22" fill={FILL} />
      {/* Thumb, tucked against the palm's left side */}
      <rect x="4" y="70" width="20" height="34" rx="10" fill={FILL} transform="rotate(-18 14 87)" />
      {/* Curled fingers (pinky, ring, middle) — shortest to tallest */}
      <g transform={fingersTransform}>
        <rect x="20" y="48" width="13" height="24" rx="6.5" fill={FILL} />
        <rect x="34" y="42" width="14" height="30" rx="7" fill={FILL} />
        <rect x="49" y="40" width="15" height="32" rx="7.5" fill={FILL} />
      </g>
      {/* Extended index finger — the pointing finger. Its tip is the hotspot. */}
      <rect x="64" y="4" width="22" height="68" rx="11" fill={FILL} />
    </svg>
  );
}
