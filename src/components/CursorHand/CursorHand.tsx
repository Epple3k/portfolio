import { useEffect, useRef } from "react";
import defaultHandAsset from "../../assets/interactions/click-hand.svg";
import styles from "./CursorHand.module.css";

// REPLACE/TWEAK: how far right/below the real cursor the hand sits.
const OFFSET_X = 10;
const OFFSET_Y = 14;

// Selector for anything that should trigger the "hovering" press.
const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, summary";

export interface CursorHandProps {
  /** Swap the icon by passing a different import here. */
  asset?: string;
}

/**
 * Mount this once, near the root of the app. It renders a hand that
 * follows the mouse everywhere, presses slightly on hovering any
 * interactive element, and plays a stronger one-shot animation on
 * click. Does nothing on touch devices (no real cursor to follow) or
 * when the user has requested reduced motion.
 *
 * Position updates bypass React state on purpose — mousemove fires far
 * too often for that — and instead write directly to the DOM node via
 * a ref, batched to one write per animation frame.
 */
export default function CursorHand({ asset = defaultHandAsset }: CursorHandProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<number | null>(null);
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const wrap = wrapRef.current;
    const hand = handRef.current;
    if (!wrap || !hand) return;

    const applyPosition = () => {
      wrap.style.transform = `translate3d(${posRef.current.x + OFFSET_X}px, ${posRef.current.y + OFFSET_Y}px, 0)`;
      frameRef.current = null;
    };

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      wrap.style.opacity = "1";
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(applyPosition);
      }
    };

    const onLeaveWindow = () => {
      wrap.style.opacity = "0";
    };

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest(INTERACTIVE_SELECTOR)) {
        hand.classList.add(styles.hovering);
      }
    };

    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest(INTERACTIVE_SELECTOR)) {
        hand.classList.remove(styles.hovering);
      }
    };

    const onDown = () => {
      hand.classList.add(styles.clicking);
    };

    const onAnimationEnd = () => {
      hand.classList.remove(styles.clicking);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    hand.addEventListener("animationend", onAnimationEnd);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      hand.removeEventListener("animationend", onAnimationEnd);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <img ref={handRef} src={asset} alt="" draggable={false} className={styles.hand} />
    </div>
  );
}
