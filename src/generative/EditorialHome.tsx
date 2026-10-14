import React from "react"
import { trackEvent } from "../analytics"
import type { Layout } from "./design"

export type EditorialProject = {
  id: string
  title: string
  category: string
  year: string
  description: string
  url: string
  previewUrl?: string
  idlePreviewUrl?: string
  image?: string
}

type Axis = "horizontal" | "vertical" | "static"

/* The large hero tiles are deliberately navigable in two directions.
 * Their axis belongs to the composition, so it is reproducible by seed. */
export const TILE_AXES: Record<Layout, readonly [Axis, Axis, Axis, Axis]> = {
  split: ["vertical", "static", "static", "static"],
  flip: ["horizontal", "static", "static", "static"],
  banner: ["static", "static", "static", "horizontal"],
  runway: ["horizontal", "vertical", "static", "static"],
  scatter: ["vertical", "static", "static", "static"],
  poster: ["horizontal", "vertical", "static", "static"],
  mosaic: ["vertical", "static", "static", "horizontal"],
  sideways: ["vertical", "horizontal", "static", "static"],
}

type Props = {
  layout: Layout
  projects: readonly EditorialProject[]
  hoveredId: string | null
  onHover: (id: string | null) => void
  onOpen: (id: string) => void
  onBlogOpen: () => void
  subheading: string
  subheadingVisible: boolean
}

const LINKS = [
  { label: "linkedin", href: "https://www.linkedin.com/in/emit-rice/" },
  { label: "github", href: "https://github.com/Epple3k" },
  { label: "email", href: "mailto:rice.emit3k@gmail.com" },
  { label: "resume", href: "https://drive.google.com/file/d/1T0kGhrBbBjQcRAYVWHMlaBru_YGmZLZA/view?usp=sharing" },
]

function TileSlide({
  project,
  stage,
  hovered,
  onOpen,
}: {
  project: EditorialProject
  stage: "cover" | "detail" | "preview"
  hovered: boolean
  onOpen: () => void
}) {
  if (stage === "cover") {
    return (
      <div className="editorial-slide editorial-slide-cover" role="group" aria-label={project.title + " cover"}>
        <span className="editorial-slide-index">{project.id} / {project.category} / {project.year}</span>
        <div className="editorial-slide-bottom">
          <strong className="editorial-slide-title">{project.title}</strong>
          <span className="editorial-slide-symbol" aria-hidden="true">↗</span>
        </div>
      </div>
    )
  }

  if (stage === "detail") {
    return (
      <div className="editorial-slide editorial-slide-detail" role="group" aria-label={project.title + " description"}>
        <span className="editorial-slide-index">FIELD NOTE / {project.id}</span>
        <p>{project.description}</p>
        <button className="editorial-slide-action" type="button" onClick={onOpen}>
          view project <span aria-hidden="true">↗</span>
        </button>
      </div>
    )
  }

  const liveUrl = project.idlePreviewUrl || project.previewUrl
  return (
    <div className="editorial-slide editorial-slide-live" role="group" aria-label={project.title + " live preview"}>
      <span className="editorial-slide-index">LIVE WINDOW / {project.id}</span>
      {hovered && liveUrl ? (
        <iframe
          src={liveUrl}
          title={project.title + " noninteractive live preview"}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          className="editorial-live-frame"
        />
      ) : (
        <div className="editorial-preview-placeholder">
          <span>{project.category}</span>
          <strong>{project.title}</strong>
          <span>hover to preview / open to explore</span>
        </div>
      )}
      <button className="editorial-slide-action editorial-live-action" type="button" onClick={onOpen}>
        open project <span aria-hidden="true">↗</span>
      </button>
    </div>
  )
}

function ProjectTile({
  project,
  axis,
  hovered,
  onHover,
  onOpen,
  index,
}: {
  project: EditorialProject
  axis: Axis
  hovered: boolean
  onHover: (id: string | null) => void
  onOpen: (id: string) => void
  index: number
}) {
  const open = () => onOpen(project.id)
  const scrollable = axis !== "static"

  const viewportRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (axis !== "horizontal") return
    const node = viewportRef.current
    if (!node) return

    // React's wheel listeners may be passive. Use a native non-passive
    // listener to turn an ordinary mouse wheel into horizontal tile browsing.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const max = node.scrollWidth - node.clientWidth
      const next = Math.max(0, Math.min(max, node.scrollLeft + event.deltaY))
      if (Math.abs(next - node.scrollLeft) > 0.5) {
        event.preventDefault()
        node.scrollLeft = next
      }
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    return () => node.removeEventListener("wheel", onWheel)
  }, [axis])

  return (
    <article
      className={"editorial-item editorial-item-" + (index + 1) + " editorial-axis-" + axis}
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(project.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) onHover(null)
      }}
    >
      <div className="editorial-media" style={{ viewTransitionName: "project-" + project.id } as React.CSSProperties}>
        {scrollable ? (
          <>
            <span className="editorial-scroll-cue" aria-hidden="true">
              {axis === "horizontal" ? "SCROLL ↔" : "SCROLL ↕"}
            </span>
            <div
              className="editorial-scroll-viewport"
              tabIndex={0}
              aria-label={project.title + " scrollable " + axis + " project gallery"}
              aria-roledescription="scrollable gallery"
              ref={viewportRef}
            >
              <TileSlide project={project} stage="cover" hovered={hovered} onOpen={open} />
              <TileSlide project={project} stage="detail" hovered={hovered} onOpen={open} />
              <TileSlide project={project} stage="preview" hovered={hovered} onOpen={open} />
            </div>
          </>
        ) : (
          <button type="button" className="editorial-static-tile" onClick={open} aria-label={"View " + project.title + " project"}>
            <TileSlide project={project} stage="cover" hovered={hovered} onOpen={open} />
          </button>
        )}
      </div>
      <div className="editorial-caption">
        <span className="editorial-caption-number">{project.id} / {project.year}</span>
        <button type="button" className="editorial-caption-title" onClick={open}>
          {project.title} <span aria-hidden="true">↗</span>
        </button>
        <span className="editorial-caption-type">{project.category}</span>
        <p>{project.description}</p>
      </div>
    </article>
  )
}

export function EditorialHome({
  layout,
  projects,
  hoveredId,
  onHover,
  onOpen,
  onBlogOpen,
  subheading,
  subheadingVisible,
}: Props) {
  return (
    <main className={"editorial-main editorial-" + layout}>
      <header className="editorial-intro">
        <div className="editorial-identity">
          <div className="editorial-eyebrow">
            <span>EMIT RICE®</span>
            <span>SELECTED WORK / 2026</span>
          </div>
          <h1 className="editorial-name">emit rice<span className="editorial-name-period">.</span></h1>
          <p className={"editorial-description" + (subheadingVisible ? "" : " editorial-description-fade")}>
            {subheading}
          </p>
        </div>

        <div className="editorial-intro-bottom">
          <div className="editorial-intro-rule" />
          <p className="editorial-overview">
            interfaces, research & systems.
            <span> florida state university</span>
          </p>
          <nav className="gen-links editorial-nav" aria-label="Explore and contact">
            <span className="gen-links-kicker">INDEX / CONNECT</span>
            <button type="button" onClick={onBlogOpen}>blog <span aria-hidden="true">↗</span></button>
            {LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                onClick={() => trackEvent(label + "_click", { destination: href })}
              >
                {label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
          <div className="editorial-folio">PORTFOLIO / 01–04</div>
        </div>
      </header>

      <section className="editorial-gallery" aria-label="Selected project portfolio">
        {projects.map((project, index) => (
          <ProjectTile
            key={project.id}
            project={project}
            index={index}
            axis={TILE_AXES[layout][index]}
            hovered={hoveredId === project.id}
            onHover={onHover}
            onOpen={onOpen}
          />
        ))}
      </section>
      <div className="editorial-footer" aria-hidden="true">
        <span>DESIGN / RESEARCH / TECHNOLOGY</span>
        <span>GENERATED EDITION • {layout.toUpperCase()}</span>
      </div>
    </main>
  )
}
