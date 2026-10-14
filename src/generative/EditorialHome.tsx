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

type Axis = "horizontal" | "vertical"

/** One featured canvas per composition. Only its scroll direction changes. */
export const TILE_AXES: Record<Layout, Axis> = {
  split: "vertical",
  flip: "horizontal",
  banner: "horizontal",
  runway: "horizontal",
  scatter: "vertical",
  poster: "vertical",
  mosaic: "horizontal",
  sideways: "vertical",
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

/* The real project is the visual. No replacement imagery, tinted covers,
   graphics or editorial filler is used for these cards. */
function ProjectImage({ project, hovered }: { project: EditorialProject; hovered: boolean }) {
  const url = hovered ? project.previewUrl : project.idlePreviewUrl ?? project.previewUrl
  if (url) {
    return (
      <iframe
        key={url}
        src={url}
        title={project.title + " project preview"}
        aria-hidden="true"
        tabIndex={-1}
        loading="lazy"
        className={"tile-preview-frame" + (hovered ? " tile-preview-active" : "")}
      />
    )
  }
  if (project.image) {
    return <img className="tile-preview-image" src={project.image} alt="" loading="lazy" />
  }
  return <div className="tile-preview-fallback">{project.title}</div>
}

function ProjectMeta({ project }: { project: EditorialProject }) {
  return (
    <div className="tile-meta">
      <span className="tile-meta-index">{project.id} / {project.year}</span>
      <strong className="tile-meta-title">{project.title}</strong>
      <span className="tile-meta-category">{project.category}</span>
    </div>
  )
}

function ProjectCard({
  project,
  index,
  hovered,
  onHover,
  onOpen,
}: {
  project: EditorialProject
  index: number
  hovered: boolean
  onHover: (id: string | null) => void
  onOpen: (id: string) => void
}) {
  return (
    <article
      className={"tile-card tile-item-" + (index + 1)}
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(project.id)}
      onBlur={() => onHover(null)}
    >
      <button type="button" className="tile-media" aria-label={"View " + project.title} onClick={() => onOpen(project.id)}>
        <ProjectImage project={project} hovered={hovered} />
        <div className={"tile-overlay" + (hovered ? " tile-overlay-active" : "")}>
          <ProjectMeta project={project} />
        </div>
      </button>
      <div className="tile-caption">
        <span>{project.id}</span>
        <button type="button" onClick={() => onOpen(project.id)}>{project.title} ↗</button>
        <span>{project.category}</span>
      </div>
    </article>
  )
}

function FeatureGallery({
  projects,
  axis,
  hoveredId,
  onHover,
  onOpen,
}: {
  projects: readonly EditorialProject[]
  axis: Axis
  hoveredId: string | null
  onHover: (id: string | null) => void
  onOpen: (id: string) => void
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || axis !== "horizontal") return

    // Mouse wheels move wide tiles sideways. Trackpads can scroll natively.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const max = viewport.scrollWidth - viewport.clientWidth
      const next = Math.max(0, Math.min(max, viewport.scrollLeft + event.deltaY))
      if (Math.abs(next - viewport.scrollLeft) > .5) {
        event.preventDefault()
        viewport.scrollLeft = next
      }
    }
    viewport.addEventListener("wheel", onWheel, { passive: false })
    return () => viewport.removeEventListener("wheel", onWheel)
  }, [axis])

  return (
    <section className={"tile-feature tile-axis-" + axis} aria-label={"Featured projects, scroll " + axis}>
      <div className="tile-feature-media">
        <div className="tile-scroll" ref={viewportRef} tabIndex={0} aria-label={"Scroll " + axis + " to browse projects"}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="tile-feature-slide"
              onMouseEnter={() => onHover(project.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(project.id)}
              onBlur={() => onHover(null)}
            >
              <ProjectImage project={project} hovered={hoveredId === project.id} />
              <div className="tile-feature-scrim" aria-hidden="true" />
              <div className="tile-feature-label">
                <span>{project.id} / {project.year}</span>
                <strong>{project.title}</strong>
                <span>{project.category}</span>
              </div>
              <button
                className="tile-feature-open"
                type="button"
                aria-label={"Open " + project.title}
                onClick={() => onOpen(project.id)}
              >
                ↗
              </button>
            </div>
          ))}
        </div>
        <span className="tile-scroll-hint" aria-hidden="true">{axis === "horizontal" ? "↔" : "↕"}</span>
      </div>
      <div className="tile-caption tile-feature-caption">
        <span>00</span>
        <span>selected work</span>
        <span>scroll {axis === "horizontal" ? "↔" : "↕"}</span>
      </div>
    </section>
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
  const hoveredProject = projects.find((project) => project.id === hoveredId)
  return (
    <main className={"tile-main tile-layout-" + layout}>
      <section className="tile-intro" aria-label="Introduction and navigation">
        <div>
          <h1 className="tile-name">emit rice</h1>
          <div className="tile-description" aria-live="off">
            {hoveredProject ? hoveredProject.description : (
              <span className={subheadingVisible ? "" : "tile-description-hidden"}>{subheading}</span>
            )}
          </div>
        </div>
        <nav className="tile-links" aria-label="Explore and contact">
          <button type="button" onClick={onBlogOpen}>blog</button>
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              onClick={() => trackEvent(label + "_click", { destination: href })}
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      <section className="tile-gallery" aria-label="Selected projects">
        <FeatureGallery
          projects={projects}
          axis={TILE_AXES[layout]}
          hoveredId={hoveredId}
          onHover={onHover}
          onOpen={onOpen}
        />
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            index={index}
            project={project}
            hovered={hoveredId === project.id}
            onHover={onHover}
            onOpen={onOpen}
          />
        ))}
      </section>
    </main>
  )
}
