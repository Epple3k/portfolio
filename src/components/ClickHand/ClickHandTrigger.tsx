import { useState, type ReactNode, type MouseEvent } from "react";
import ClickHand, { type ClickHandProps } from "./ClickHand";
import styles from "./ClickHand.module.css";

export interface ClickHandTriggerProps {
  children: ReactNode;
  className?: string;
  /** Forwarded to <ClickHand /> — asset, position, sprite mode, etc. */
  handProps?: Omit<ClickHandProps, "isClicking" | "onAnimationEnd">;
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void;
}

/**
 * Wrap any interactive element's contents (an <a>/<button>'s children)
 * with this to attach the click-hand animation:
 *
 *   <a href="...">
 *     <ClickHandTrigger>CONTACT ↗</ClickHandTrigger>
 *   </a>
 *
 * Hover is pure CSS (see .trigger:hover .hand in ClickHand.module.css).
 * Click plays a stronger one-shot animation via a briefly-toggled class,
 * so it isn't limited to how long the mouse button stays down.
 */
export default function ClickHandTrigger({
  children,
  className,
  handProps,
  onClick,
}: ClickHandTriggerProps) {
  const [isClicking, setIsClicking] = useState(false);

  return (
    <span
      className={[styles.trigger, className ?? ""].filter(Boolean).join(" ")}
      onClick={(e) => {
        setIsClicking(true);
        onClick?.(e);
      }}
    >
      {children}
      <ClickHand
        {...handProps}
        isClicking={isClicking}
        onAnimationEnd={() => setIsClicking(false)}
      />
    </span>
  );
}
