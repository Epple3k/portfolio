import type { CSSProperties } from "react";
import defaultHandAsset from "../../assets/interactions/click-hand.svg";
import styles from "./ClickHand.module.css";

export interface ClickHandProps {
  /** Swap the icon by passing a different import here (SVG or PNG). */
  asset?: string;
  /** Which side of the trigger's content the hand sits on. */
  position?: "left" | "right";
  /** Set true while a click animation should be playing. */
  isClicking?: boolean;
  /** Called when the click animation finishes, so state can reset. */
  onAnimationEnd?: () => void;
  /**
   * "svg" animates via CSS transforms (default — works for any plain
   * SVG or PNG icon). "sprite" switches to a steps()-based sprite
   * sheet animation instead — see ClickHand.module.css for the knobs.
   */
  mode?: "svg" | "sprite";
  /** Sprite mode only: how many frames wide the sheet is. */
  spriteFrames?: number;
  /** Sprite mode only: width/height in px of a single frame. */
  spriteFrameSize?: number;
  className?: string;
}

/**
 * Purely presentational click-hand icon. Use <ClickHandTrigger> to wire
 * this up to hover/click behavior on a real interactive element — this
 * component just renders the asset and reacts to the props it's given.
 */
export default function ClickHand({
  asset = defaultHandAsset, // REPLACE ASSET: swap the default import above instead of this fallback.
  position = "right",
  isClicking = false,
  onAnimationEnd,
  mode = "svg",
  spriteFrames = 4,
  spriteFrameSize = 24,
  className,
}: ClickHandProps) {
  const isSprite = mode === "sprite";

  return (
    <span
      aria-hidden="true"
      className={[
        styles.hand,
        position === "left" ? styles["hand--left"] : styles["hand--right"],
        isSprite ? styles["hand--sprite"] : "",
        isClicking ? styles.isClicking : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
      style={
        isSprite
          ? ({
              "--sprite-url": `url(${asset})`,
              "--sprite-frames": spriteFrames,
              "--sprite-frame-size": `${spriteFrameSize}px`,
            } as CSSProperties)
          : undefined
      }
      onAnimationEnd={onAnimationEnd}
    >
      {!isSprite && (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={asset} alt="" width="100%" height="100%" draggable={false} />
      )}
    </span>
  );
}
