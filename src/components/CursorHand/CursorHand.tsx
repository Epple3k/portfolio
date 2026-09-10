import { useEffect, useRef, useState } from "react";
import HandGlyph, { HAND_VB_WIDTH, HAND_VB_HEIGHT, HAND_HOTSPOT_VB } from "./HandGlyph";
import styles from "./CursorHand.module.css";

// REPLACE/TWEAK: overall rendered size of the hand, in px. Height
// follows automatically from the glyph's own aspect ratio.
const RENDER_WIDTH = 130;
const RENDER_HEIGHT = RENDER_WIDTH * (HAND_VB_HEIGHT / HAND_VB_WIDTH);

// The exact rendered-pixel position of the fingertip hotspot, derived
// from the glyph's own viewBox + hotspot — not eyeballed. This precise
// pixel is what gets aligned to the real clientX/clientY, and it's
// also what every gesture transform is anchored to, so animating the
// hand never shifts the point that's actually "clicking."
const HOTSPOT_X = (HAND_HOTSPOT_VB.x / HAND_VB_WIDTH) * RENDER_WIDTH;
const HOTSPOT_Y = (HAND_HOTSPOT_VB.y / HAND_VB_HEIGHT) * RENDER_HEIGHT;

/**
 * Site-wide custom cursor. Replaces the system pointer entirely (see
 * the global `cursor: none !important` rule in index.css) with a hand
 * whose index-fingertip is pixel-aligned to the real cursor position.
 *
 * Position tracking is direct and unsmoothed: every frame renders the
 * latest raw clientX/clientY, batched through requestAnimationFrame
 * only to avoid redundant style writes within the same frame — never
 * interpolated/eased, so there's no lag between the physical mouse and
 * the hand.
 */
export default function CursorHand() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const posRef = useRef({ x: -9999, y: -9999 });
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const applyPosition = () => {
      wrap.style.transform = `translate3d(${posRef.current.x - HOTSPOT_X}px, ${posRef.current.y - HOTSPOT_Y}px, 0)`;
      frameRef.current = null;
    };

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      wrap.style.opacity = "1";
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(applyPosition);
      }
    };

    // Leaving the page/window (or losing focus, e.g. alt-tab) hides
    // the hand immediately rather than letting it get stuck at the
    // last known position. It reappears the instant a fresh mousemove
    // arrives, already at the correct spot.
    const hide = () => {
      wrap.style.opacity = "0";
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{ width: RENDER_WIDTH, height: RENDER_HEIGHT }}
      aria-hidden="true"
    >
      <div className={styles.hand} style={{ width: RENDER_WIDTH, height: RENDER_HEIGHT }}>
        <HandGlyph
          className={styles.glyph}
          indexFingerClassName={`${styles.indexFinger} ${pressed ? styles.indexPressed : ""}`}
        />
      </div>
    </div>
  );
}
