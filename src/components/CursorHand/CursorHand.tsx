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
 * click.
 *
 * There's deliberately no `matchMedia("(pointer: fine)")` gate here —
 * some hybrid/touchscreen laptops report a coarse *primary* pointer
 * even while a mouse or trackpad is actively driving the page, which
 * would silently disable this outright. Instead it relies on natural
 * behavior: if the device never fires `mousemove`, the hand simply
 * never becomes visible (it starts at opacity 0 and only turns on
 * inside the move handler below).
 *
 * Following the mouse is a direct, user-driven response rather than
 * ambient/autoplaying motion, so prefers-reduced-motion doesn't turn
 * it off outright either — instead it only removes the decorative
 * flourishes (the eased hover press and the click bounce), see the
 * media query in CursorHand.module.css.
 *
 * Position updates bypass React state on purpose — mousemove fires far
 * too often for that — and instead write directly to the DOM node via
 * a ref, batched to one write per animation frame.
 */
export default function CursorHand({ asset = defaultHandAsset }: CursorHandProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const hand = handRef.current;
    if (!wrap || !hand) return;

    // REPLACE ASSET: set via background-image (not <img src>) — an
    // <img src="data:..."> inside a zero-size wrapper was confirmed to
    // silently fail to render on the live site, while a background
    // image on a normally-sized div rendered reliably.
    hand.style.backgroundImage = `url("${asset}")`;

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
  }, [asset]);

  return (
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      <div ref={handRef} className={styles.hand} />
    </div>
  );
}
