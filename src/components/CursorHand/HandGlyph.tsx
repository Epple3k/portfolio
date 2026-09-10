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
 * Geometry note: the index finger's base and the wrist must each sit
 * fully inside the fist body's x-range where they overlap it in y, or
 * you get a visible gap between that piece and the hand.
 *
 * Deliberately simplified silhouette: the palm and three curled
 * fingers are merged into one smooth rounded "fist" shape (no
 * separate knuckle bumps) — just fist + wrist + thumb + pointer
 * finger. The wrist is its own, narrower shape so it visibly tapers
 * in from the fist rather than being one uniform block.
 *
 * Only the index finger animates on click (see .indexFinger /
 * .indexPressed in CursorHand.module.css) — the fist and thumb are
 * static. It scales along Y anchored at its BASE (HAND_INDEX_BASE_VB,
 * where it meets the fist), so the base stays put and the tip —
 * pointing toward the top of the screen — is the part that visibly
 * retracts. Note this means the tip (== the cursor hotspot) does move
 * a few px during the ~130ms click animation; the real clickable point
 * is always the system's actual cursor position regardless, so this is
 * purely decorative and doesn't affect what you actually click.
 */

export const HAND_VB_WIDTH = 100;
export const HAND_VB_HEIGHT = 140;

// All the shapes below are drawn in their own local coordinates, then
// mirrored horizontally as one group (see MIRROR_TRANSFORM) so the
// whole hand — palm, thumb, curled fingers, pointer finger — flips
// left/right together without hand-recomputing every shape's x. Any
// coordinate meant to describe where something ends up ON SCREEN
// (i.e. HAND_HOTSPOT_VB, used outside this file) has to account for
// that mirror; anything used only for a shape's OWN transform-origin
// (i.e. HAND_INDEX_BASE_VB) does not, since transform-origin resolves
// in the element's local space before the ancestor mirror applies.
const MIRROR_TRANSFORM = `translate(${HAND_VB_WIDTH}, 0) scale(-1, 1)`;

// Tip of the extended index finger in LOCAL (pre-mirror) coordinates —
// see the index-finger <rect> below: x=58 width=22 means its
// horizontal center is 58+22/2=69, and its top edge is y=2. A rounded
// rect with rx = half its width has a true point-shaped apex at
// (center-x, top-y), so this is exact.
const HOTSPOT_LOCAL = { x: 69, y: 2 };

// The same point after the group mirror — this is what's actually
// aligned to the cursor, so it's what CursorHand.tsx imports.
export const HAND_HOTSPOT_VB = { x: HAND_VB_WIDTH - HOTSPOT_LOCAL.x, y: HOTSPOT_LOCAL.y };

// Base of the same finger, where it meets the fist (same x-center,
// bottom edge at y = 2 + height 70 = 72) — in LOCAL coordinates, used
// as that rect's own transform-origin (see below), which is unaffected
// by the ancestor mirror.
export const HAND_INDEX_BASE_VB = { x: 69, y: 72 };

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
      <g transform={MIRROR_TRANSFORM}>
        {/* Fist (palm + curled fingers) — spans wide enough that the
            index finger's base (58-80) and the thumb both land solidly
            inside it. */}
        <rect x="14" y="40" width="66" height="70" rx="28" fill={FILL} />
        {/* Wrist — its own, narrower shape (36 wide vs. the fist's 66),
            centered under the fist and overlapping its bottom by 10
            units for a seamless taper. */}
        <rect x="29" y="100" width="36" height="36" rx="14" fill={FILL} />
        {/* Thumb, tucked against the fist's right side (pre-mirror —
            ends up on the left in the final rendered hand), near the
            base of the index finger. Bigger and extending further out
            than before. */}
        <rect x="66" y="62" width="26" height="42" rx="13" fill={FILL} transform="rotate(22 79 83)" />
        {/* Extended index finger — flush against the fist's left edge
            (post-mirror) — and the only part that animates on click.
            Its tip is the hotspot (after the group mirror). */}
        <rect
          x="58"
          y="2"
          width="22"
          height="70"
          rx="11"
          fill={FILL}
          className={indexFingerClassName}
          style={{ transformOrigin: `${HAND_INDEX_BASE_VB.x}px ${HAND_INDEX_BASE_VB.y}px` }}
        />
      </g>
    </svg>
  );
}
