import React, { useEffect, useRef, useState } from "react"
import { trackEvent } from "./analytics"
import "./reviews.css"

export type ReviewEntry = {
  key: string
  label: string
  title: string
  date: string
  body: string
  url?: string
  tags?: string[]
  mediaType?: string
  mediaTitle?: string
  creator?: string
  releaseYear?: string
  gamePlatform?: string
  coverUrl?: string
  spineColor?: string
  spineTextColor?: string
}

type MediaKind = "movie" | "album" | "game" | "book"

function reviewKind(entry: ReviewEntry): MediaKind {
  const explicit = (entry.mediaType || "").toLowerCase()
  if (explicit === "movie" || explicit === "film") return "movie"
  if (explicit === "music" || explicit === "album") return "album"
  if (explicit === "game" || explicit === "videogame" || explicit === "video game") return "game"
  if (explicit === "book") return "book"
  if (entry.label === "letterboxd") return "movie"
  if (entry.label === "rateyourmusic") return "album"
  if (entry.label === "goodreads") return "book"
  return "book"
}

function caseRatio(entry: ReviewEntry): number {
  const kind = reviewKind(entry)
  return kind === "album" ? 1 : kind === "book" ? .69 : kind === "game" ? .67 : .71
}

function caseDepth(entry: ReviewEntry): number {
  const kind = reviewKind(entry)
  return kind === "book" ? 37 : kind === "album" ? 19 : kind === "game" ? 24 : 25
}

function caseHeight(entry: ReviewEntry, shelfHeight: number): number {
  // An album is physically shorter than a book, DVD, or game case.
  return Math.round(shelfHeight * (reviewKind(entry) === "album" ? .77 : .98))
}

function displayTitle(entry: ReviewEntry): string {
  if (entry.mediaTitle) return entry.mediaTitle
  return entry.title
    .replace(/\s+[★½☆]+(?:\s+[★½☆]+)*\s*$/, "")
    .replace(/\s+\(\d{4}\)\s*$/, "")
    .split(" — ")[0]
    .trim()
}

function platformStyle(entry: ReviewEntry) {
  const name = (entry.gamePlatform || "").toLowerCase()
  if (name.includes("switch")) return { name: "NINTENDO SWITCH", style: "switch" }
  if (name.includes("playstation") || /\bps[345]\b/.test(name)) {
    return { name: entry.gamePlatform || "PLAYSTATION", style: "playstation" }
  }
  if (name.includes("xbox")) return { name: "XBOX", style: "xbox" }
  return { name: entry.gamePlatform || "VIDEO GAME", style: "generic" }
}

function ReviewCase({
  entry,
  enlarged = false,
  shelfCaseHeight,
}: {
  entry: ReviewEntry
  enlarged?: boolean
  shelfCaseHeight?: number
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const type = reviewKind(entry)
  const game = platformStyle(entry)
  const title = displayTitle(entry)
  const hasCover = Boolean(entry.coverUrl) && !imageFailed

  useEffect(() => setImageFailed(false), [entry.coverUrl])

  return (
    <div
      style={!enlarged && shelfCaseHeight ? ({
        "--case-h": `${shelfCaseHeight}px`,
        "--case-face-width": `${Math.round(shelfCaseHeight * caseRatio(entry))}px`,
        "--case-depth": `${caseDepth(entry)}px`,
      } as React.CSSProperties) : undefined}
      className={[
        "review-case",
        "review-case--" + type,
        type === "game" ? "review-case--" + game.style : "",
        enlarged ? "review-case--enlarged" : "",
      ].filter(Boolean).join(" ")}
    >
      <div
        className="review-case__spine"
        style={entry.spineColor && /^#[0-9a-fA-F]{6}$/.test(entry.spineColor) ? ({
          "--spine-accent": entry.spineColor,
          "--spine-ink": entry.spineTextColor === "#000000" ? "#000000" : "#ffffff",
        } as React.CSSProperties) : undefined}
      >
        <span className="review-case__spine-mark">
          {type === "game" ? game.name : type === "movie" ? "DVD" : type === "album" ? "COMPACT DISC" : "BOOK"}
        </span>
        <span className="review-case__spine-title">{title}</span>
      </div>
      <div className="review-case__front">
        {type === "game" && (
          <div className="review-case__format">{game.name}</div>
        )}
        {type === "movie" && (
          <div className="review-case__format review-case__format--dvd">DVD VIDEO <span>●</span></div>
        )}
        {hasCover ? (
          <img
            key={entry.coverUrl}
            src={entry.coverUrl}
            alt={"Cover artwork for " + title}
            loading={enlarged ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="review-case__placeholder">
            <span className="review-case__placeholder-type">{type === "album" ? "33⅓ RPM / STEREO" : type === "movie" ? "FEATURE FILM" : type === "book" ? "PRINT EDITION" : game.name}</span>
            <strong>{title}</strong>
            {entry.creator && <span>{entry.creator}</span>}
          </div>
        )}
      </div>
      <span className="review-case__edge" aria-hidden="true" />
    </div>
  )
}

export default function ReviewShelf({ entries }: { entries: ReviewEntry[] }) {
  const shelfRef = useRef<HTMLDivElement>(null)
  const shelfFrameRef = useRef<HTMLDivElement>(null)
  const [shelfSize, setShelfSize] = useState({ width: 0, height: 0 })
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const drag = useRef({ x: 0, left: 0, moved: false, down: false })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [hoveredReviewKey, setHoveredReviewKey] = useState<string | null>(null)

  const active = activeIndex === null ? null : entries[activeIndex] ?? null
  const hoveredReview = entries.find((entry) => entry.key === hoveredReviewKey) ?? null

  // Each object keeps its real front-cover aspect ratio and an independently
  // readable spine. The next object sits in front, hiding part of the previous
  // cover; its allocated slot is deliberately narrower than its painted width.
  const shelfHeight = Math.max(184, Math.min(760, (shelfSize.height || 490) - 16))
  const caseWidths = entries.map((entry) =>
    caseHeight(entry, shelfHeight) * caseRatio(entry) + caseDepth(entry)
  )
  const availableWidth = Math.max(240, (shelfSize.width || 1100) - 52)
  const lastWidth = caseWidths.at(-1) || 0
  const earlierWidths = caseWidths.slice(0, -1).reduce((sum, width) => sum + width, 0)
  // More space exposes more cover art. Small screens keep a meaningful sliver
  // visible and scroll instead of crushing covers and spine text.
  const overlapSpacing = earlierWidths > 0
    ? Math.max(.48, Math.min(.82, (availableWidth - lastWidth) / earlierWidths))
    : 1
  const shelfSlots = caseWidths.map((width, index) =>
    Math.round(index === entries.length - 1 ? width : width * overlapSpacing)
  )

  useEffect(() => {
    const element = shelfFrameRef.current
    if (!element) return
    const measure = () => {
      const width = Math.round(element.clientWidth)
      const height = Math.round(element.clientHeight)
      setShelfSize((previous) => previous.width === width && previous.height === height
        ? previous : { width, height })
    }
    measure()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener("resize", measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [entries.length])

  useEffect(() => {
    const el = shelfRef.current
    if (!el) return
    const update = () => {
      const distance = el.scrollWidth - el.clientWidth
      setCanScroll(distance > 8)
      setProgress(distance > 0 ? (el.scrollLeft / distance) * 100 : 0)
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const max = el.scrollWidth - el.clientWidth
      if (max < 8) return
      const next = Math.max(0, Math.min(max, el.scrollLeft + event.deltaY))
      if (Math.abs(next - el.scrollLeft) < 1) return
      event.preventDefault()
      el.scrollLeft = next
    }
    update()
    el.addEventListener("scroll", update, { passive: true })
    el.addEventListener("wheel", wheel, { passive: false })
    window.addEventListener("resize", update)
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update)
    resizeObserver?.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      el.removeEventListener("wheel", wheel)
      window.removeEventListener("resize", update)
      resizeObserver?.disconnect()
    }
  }, [entries.length])

  useEffect(() => {
    if (activeIndex === null) return
    closeRef.current?.focus()
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null)
      if (event.key === "ArrowRight") setActiveIndex((i) => i === null ? null : (i + 1) % entries.length)
      if (event.key === "ArrowLeft") setActiveIndex((i) => i === null ? null : (i - 1 + entries.length) % entries.length)
    }
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [activeIndex, entries.length])

  const close = () => {
    setActiveIndex(null)
    requestAnimationFrame(() => openerRef.current?.focus())
  }
  const open = (entry: ReviewEntry, index: number, element: HTMLElement) => {
    if (drag.current.moved) return
    openerRef.current = element
    setActiveIndex(index)
    trackEvent("blog_entry_open", { blog_source: entry.label, blog_title: entry.title.slice(0, 80) })
  }
  const scroll = (direction: -1 | 1) => {
    const el = shelfRef.current
    if (el) el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.74), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }

  return (
    <section className="review-gallery" aria-label="Media reviews">
      <div className="review-gallery__masthead">
        <div className="review-gallery__headline-stage">
          <span className="review-gallery__eyebrow">
            {hoveredReview ? `${reviewKind(hoveredReview).toUpperCase()} / ${hoveredReview.label.toUpperCase()}` : "AN ONGOING COLLECTION / REVIEWS & MEDIA"}
          </span>
          <div className="review-gallery__headline-window" aria-live="off">
            <div className={`review-gallery__headline-default ${hoveredReview ? "review-gallery__headline--hidden" : ""}`} aria-hidden={Boolean(hoveredReview)}>
              <h1>things on <em>my shelf.</em></h1>
              <p>an inventory of things i watched, played, read, and listened to. pick something up.</p>
            </div>
            <div className={`review-gallery__headline-review ${hoveredReview ? "review-gallery__headline--visible" : ""}`} aria-hidden={!hoveredReview}>
              {hoveredReview && (
                <>
                  <h1>{displayTitle(hoveredReview)}</h1>
                  <p className="review-gallery__headline-byline">
                    {hoveredReview.creator && <span>{hoveredReview.creator} / </span>}
                    {hoveredReview.date && <span>{hoveredReview.date} / </span>}
                    <span>{hoveredReview.title.match(/[★½☆]+/g)?.pop() ?? reviewKind(hoveredReview)}</span>
                  </p>
                  <p className="review-gallery__headline-teaser">{hoveredReview.body}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="review-gallery__tally">
          <strong>{String(entries.length).padStart(2, "0")}</strong>
          <span>OBJECTS<br />CATALOGUED</span>
        </div>
      </div>
      {entries.length ? (
        <>
          <div className="review-gallery__shelf-frame" ref={shelfFrameRef}>
            <div
              ref={shelfRef}
              className="review-gallery__track"
              tabIndex={0}
              aria-label="Review collection. Scroll sideways or use the arrow buttons."
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === "ArrowRight") { event.preventDefault(); scroll(1) }
                if (event.key === "ArrowLeft") { event.preventDefault(); scroll(-1) }
              }}
              onPointerDown={(event) => {
                if (event.pointerType !== "mouse" || event.button !== 0) return
                drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false, down: true }
              }}
              onPointerMove={(event) => {
                if (!drag.current.down || event.pointerType !== "mouse") return
                const dx = event.clientX - drag.current.x
                if (Math.abs(dx) > 7) drag.current.moved = true
                if (drag.current.moved) event.currentTarget.scrollLeft = drag.current.left - dx
              }}
              onPointerUp={() => {
                drag.current.down = false
                // Keep the click suppressed until the pointer-generated click fires.
                setTimeout(() => { drag.current.moved = false }, 0)
              }}
              onPointerCancel={() => { drag.current.down = false; drag.current.moved = false }}
              onPointerLeave={() => { drag.current.down = false }}
            >
              {entries.map((entry, index) => (
                <button
                  key={entry.key}
                  type="button"
                  className="review-gallery__item"
                  style={{ "--slot-width": `${shelfSlots[index]}px`, "--stack-order": index + 1 } as React.CSSProperties}
                  onMouseEnter={() => setHoveredReviewKey(entry.key)}
                  onMouseLeave={() => setHoveredReviewKey((previous) => previous === entry.key ? null : previous)}
                  onFocus={() => setHoveredReviewKey(entry.key)}
                  onBlur={() => setHoveredReviewKey((previous) => previous === entry.key ? null : previous)}
                  onClick={(event) => open(entry, index, event.currentTarget)}
                  aria-label={"Read review of " + displayTitle(entry)}
                >
                  <ReviewCase entry={entry} shelfCaseHeight={caseHeight(entry, shelfHeight)} />

                </button>
              ))}
            </div>
          </div>
          <div className="review-gallery__controls">
            <div className="review-gallery__instruction">DRAG / SCROLL TO BROWSE <span>↔</span></div>
            <div className="review-gallery__progress"><span style={{ width: Math.max(9, 100 - (canScroll ? 65 : 0)) + "%", left: (progress * (canScroll ? .65 : 0)) + "%" }} /></div>
            <div className="review-gallery__buttons">
              <button type="button" onClick={() => scroll(-1)} disabled={!canScroll} aria-label="Scroll reviews left">←</button>
              <button type="button" onClick={() => scroll(1)} disabled={!canScroll} aria-label="Scroll reviews right">→</button>
            </div>
          </div>
        </>
      ) : (
        <div className="review-gallery__empty">new reviews will find their place here.</div>
      )}

      {active && (
        <div className="review-reader" role="dialog" aria-modal="true" aria-label={"Review of " + displayTitle(active)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return
            const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')]
            if (!controls.length) return
            const first = controls[0], last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
          }}
        >
          <div className="review-reader__header">
            <span>THE COLLECTION / {String(activeIndex! + 1).padStart(2, "0")} OF {String(entries.length).padStart(2, "0")}</span>
            <button type="button" ref={closeRef} onClick={close}>[ CLOSE × ]</button>
          </div>
          <div className="review-reader__layout">
            <div className="review-reader__display">
              <div className="review-reader__display-inner"><ReviewCase entry={active} enlarged /></div>
              <span className="review-reader__catalogue">{reviewKind(active).toUpperCase()} / {active.gamePlatform || active.creator || "MEDIA ARCHIVE"}</span>
            </div>
            <div className="review-reader__copy">
              <div className="review-reader__micro">{active.label.toUpperCase()} / {active.date || "UNDATED"}</div>
              <h2>{displayTitle(active)}</h2>
              {active.creator && <p className="review-reader__creator">{active.creator}</p>}
              {/★|½/.test(active.title) && <div className="review-reader__rating">{active.title.match(/[★½☆]+/g)?.pop()}</div>}
              <div className="review-reader__rule" />
              <p className="review-reader__body">{active.body}</p>
              {active.tags && active.tags.length > 0 && <p className="review-reader__tags">{active.tags.join(" · ")}</p>}
              {active.url && <a href={active.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("review_source_click", { blog_source: active.label })}>ORIGINAL REVIEW ↗</a>}
              <div className="review-reader__footer">
                <button type="button" onClick={() => setActiveIndex((activeIndex! - 1 + entries.length) % entries.length)}>← PREVIOUS</button>
                <button type="button" onClick={() => setActiveIndex((activeIndex! + 1) % entries.length)}>NEXT →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
