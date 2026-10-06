import React, { useEffect, useState } from "react"
import { flushSync } from "react-dom"
import { trackEvent } from "./analytics"

import image2 from "./imports/image-2.png"
import image3 from "./imports/image-1.png"

type BlogTab = "reviews" | "socials" | "professional"

type Note = {
  title: string
  date: string
  summary: string
  body?: string
  tags?: string[]
  tabs?: BlogTab[]
}

type SocialPost = {
  platform: "linkedin" | "instagram" | "letterboxd" | "goodreads" | "rateyourmusic" | "manual"
  title?: string
  text: string
  body?: string
  url: string
  date?: string
  tabs?: BlogTab[]
}

const PROJECTS = [
  {
    id: "01",
    title: "attention field",
    category: "Web Application",
    year: "2026",
    image: image2,
    previewUrl: "https://epple3k.github.io/attention-field/?portfolioPreview=1",
    url: "https://epple3k.github.io/attention-field/",
    description:
      "An interactive visualization that explores how attention shifts, clusters, and responds across a dynamic field.",
  },
  {
    id: "02",
    title: "research atlas",
    category: "Prototyping",
    year: "2026",
    image: image3,
    previewUrl: "https://epple3k.github.io/fsu-research-atlas-2/?portfolioPreview=1",
    url: "https://epple3k.github.io/fsu-research-atlas-2/",
    description:
      "An interactive tool for mapping ideas, sources, and connections to make complex research easier to explore.",
  },
  {
    id: "03",
    title: "aural field",
    category: "Generative Audio",
    year: "2026",
    previewUrl: "https://epple3k.github.io/aural-field/?portfolioPreview=1",
    idlePreviewUrl: "https://epple3k.github.io/aural-field/?portfolioPreview=1&portfolioStatic=1",
    url: "https://epple3k.github.io/aural-field/",
    description:
      "A generative ambient sound playground for sculpting evolving tones, textures, and spatial forms through a minimal visual interface.",
  },
  {
    id: "04",
    title: "ledgerline",
    category: "Finance / MCP",
    year: "2026",
    previewUrl: "https://ledgerline-finance.onrender.com/",
    url: "https://ledgerline-finance.onrender.com/",
    description:
      "A finance-native ChatGPT plugin for exploring company fundamentals, filings, macro data, and source-linked financial analysis directly in the conversation.",
  },
]

const HERO_SUBHEADINGS = [
  "i design interfaces that make complex information easier to think with",
  "i study information systems and finance at florida state",
  "i research how AI can support civic participation and public decision-making",
  "i prototype human-centered AI tools for research, finance, and public systems",
  "i turn messy systems into legible tools, visualizations, and interactions",
  "i build at the intersection of design, data, and emerging technology",
  "i care about how people understand, trust, and act on information",
]

const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL ?? "https://api.emitrice.com"

export default function App() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showBlog, setShowBlog] = useState(false)
  const [activeBlogKey, setActiveBlogKey] = useState<string | null>(null)
  const [activeBlogTab, setActiveBlogTab] = useState<BlogTab>("professional")
  const [notes, setNotes] = useState<Note[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [subscriberEmail, setSubscriberEmail] = useState("")
  const [subscribeState, setSubscribeState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subscribeMessage, setSubscribeMessage] = useState("")
  const [heroSubheadingIndex, setHeroSubheadingIndex] = useState(0)
  const [heroSubheadingVisible, setHeroSubheadingVisible] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("blog") === "1") {
      setShowBlog(true)
    }

    trackEvent("portfolio_view", {
      application_source: params.get("utm_source") ?? undefined,
      application_medium: params.get("utm_medium") ?? undefined,
      application_campaign: params.get("utm_campaign") ?? undefined,
      page_path: window.location.pathname,
    })

    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}notes.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${base}social-feed.json`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([noteData, socialData]) => {
        setNotes(Array.isArray(noteData) ? noteData : [])
        setSocialPosts(Array.isArray(socialData) ? socialData : [])
      })
      .catch(() => {
        setNotes([])
        setSocialPosts([])
      })
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) return

    let fadeTimer: number | undefined

    const rotateTimer = window.setInterval(() => {
      setHeroSubheadingVisible(false)

      fadeTimer = window.setTimeout(() => {
        setHeroSubheadingIndex((current) => (current + 1) % HERO_SUBHEADINGS.length)
        setHeroSubheadingVisible(true)
      }, 500)
    }, 5000)

    return () => {
      window.clearInterval(rotateTimer)
      if (fadeTimer) window.clearTimeout(fadeTimer)
    }
  }, [])

  const handleBlogSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = subscriberEmail.trim().toLowerCase()
    if (!email || subscribeState === "loading") return

    setSubscribeState("loading")
    setSubscribeMessage("")

    try {
      const response = await fetch(`${BLOG_API_URL}/api/blog/subscribe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company: "" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not subscribe right now.")
      }

      setSubscribeState("success")
      setSubscribeMessage("you’re on the list.")
      setSubscriberEmail("")
      trackEvent("blog_subscribe", { source: "blog_header" })
    } catch (error) {
      setSubscribeState("error")
      setSubscribeMessage(error instanceof Error ? error.message : "Could not subscribe right now.")
    }
  }
  const handleProjectClick = (id: string) => {
    const project = PROJECTS.find((p) => p.id === id)

    if (project) {
      trackEvent("project_open", {
        project_id: project.id,
        project_title: project.title,
        project_category: project.category,
      })
    }
    // @ts-ignore - startViewTransition is relatively new
    if (!document.startViewTransition) {
      setActiveId(id)
      return
    }

    // @ts-ignore
    document.startViewTransition(() => {
      flushSync(() => {
        setActiveId(id)
      })
    })
  }

  const handleBack = () => {
    // @ts-ignore
    if (!document.startViewTransition) {
      setActiveId(null)
      return
    }

    // @ts-ignore
    document.startViewTransition(() => {
      flushSync(() => {
        setActiveId(null)
      })
    })
  }

  const activeProject = PROJECTS.find((p) => p.id === activeId)
  const hoveredProject = PROJECTS.find((p) => p.id === hoveredId)

  const blogEntries = [
    ...notes.map((note, index) => ({
      key: `note-${note.date}-${index}`,
      type: "blog" as const,
      label: "blog",
      title: note.title,
      date: note.date,
      summary: note.summary,
      body: note.body ?? note.summary,
      tags: note.tags ?? [],
      tabs: note.tabs?.length ? note.tabs : ["professional" as BlogTab],
      url: undefined as string | undefined,
    })),
    ...socialPosts.map((post, index) => ({
      key: `social-${post.platform}-${index}`,
      type: "social" as const,
      label: post.platform,
      title: post.title ?? post.text,
      date: post.date ?? "",
      summary: post.text,
      body: post.body ?? post.text,
      tags: [] as string[],
      tabs:
        post.tabs?.length
          ? post.tabs
          : post.platform === "letterboxd" || post.platform === "goodreads" || post.platform === "rateyourmusic"
            ? ["reviews" as BlogTab]
            : ["socials" as BlogTab],
      url: post.url,
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""))

  const visibleBlogEntries = blogEntries.filter((entry) =>
    entry.tabs.includes(activeBlogTab),
  )

  const blogTabs: { id: BlogTab; label: string }[] = [
    { id: "professional", label: "professional work & updates" },
    { id: "reviews", label: "reviews & media" },
    { id: "socials", label: "social posts" },
  ]

  return (
    <div className="relative min-h-screen w-full font-sans text-black overflow-hidden flex selection:bg-black selection:text-[#1aff1a]">
      {/* Background Gradient Layer */}
      <div
        className="absolute inset-0 z-0 transition-all duration-700 ease-out"
        style={{
          background:
            "linear-gradient(90deg, #f0fff0 0%, #c2ffc2 45%, #00ff00 100%)",
          opacity: hoveredId ? 0.9 : 1,
        }}
      />

      {/* Dynamic Glow Shift based on Hover */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-700 ease-out mix-blend-overlay"
        style={{
          background:
            "radial-gradient(circle at 75% 50%, #00ff00 0%, transparent 60%)",
          opacity: hoveredId ? 0.8 : 0,
        }}
      />

      {/* Main Content Layout */}
      <main className="relative z-10 w-full h-screen flex flex-col md:flex-row p-4 md:p-8 md:gap-4">
        {/* Left Column */}
        <div className="w-full md:w-1/2 h-full flex flex-col justify-between max-w-[720px] pb-8 md:pb-0">
          <div className="flex flex-col gap-6 lg:gap-12 mt-4 md:mt-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-medium">
              emit rice
            </h1>

            <div className="relative h-32 md:h-48">
              <p
                className={`absolute inset-0 text-xl md:text-2xl lg:text-3xl leading-snug md:leading-snug transition-all duration-400 ease-out ${
                  hoveredProject
                    ? "opacity-0 translate-y-4 pointer-events-none"
                    : "opacity-100 translate-y-0"
                }`}
              >
                <span
                  className={`block transition-opacity duration-500 ease-in-out ${
                    heroSubheadingVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {HERO_SUBHEADINGS[heroSubheadingIndex]}
                </span>
              </p>

              <p
                className={`absolute inset-0 text-xl md:text-2xl lg:text-3xl leading-snug md:leading-snug transition-all duration-400 ease-out ${
                  hoveredProject
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                {hoveredProject?.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 text-xl md:text-2xl tracking-tight mt-auto md:ml-12 lg:ml-24">
            <button
              onClick={() => {
                setShowBlog(true)
                setActiveBlogKey(null)
                setActiveBlogTab("professional")
                trackEvent("blog_open")
              }}
              className="hover:italic hover:translate-x-2 transition-all duration-300 text-left"
            >
              blog
            </button>
            {[
              {
                label: "linkedin",
                href: "https://www.linkedin.com/in/emit-rice/",
              },
              {
                label: "github",
                href: "https://github.com/Epple3k",
              },
              {
                label: "email",
                href: "mailto:rice.emit3k@gmail.com",
              },
              {
                label: "resume",
                href: "https://drive.google.com/file/d/1T0kGhrBbBjQcRAYVWHMlaBru_YGmZLZA/view?usp=sharing",
              },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
                onClick={() =>
                  trackEvent(`${label}_click`, {
                    destination: href,
                  })
                }
                className="hover:italic hover:translate-x-2 transition-all duration-300"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Right Column (Ribbon) */}
        <div
          className="w-full md:w-1/2 lg:w-[54%] h-full flex flex-col gap-2 md:gap-3"
          onMouseLeave={() => setHoveredId(null)}
        >
          {PROJECTS.map((p) => {
            const isHovered = hoveredId === p.id
            const isAnyHovered = hoveredId !== null

            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onClick={() => handleProjectClick(p.id)}
                className="relative overflow-hidden cursor-pointer group will-change-transform"
                style={
                  {
                    flex: isHovered
                      ? "2.5"
                      : isAnyHovered
                        ? "0.75"
                        : "1",
                    transition:
                      "flex 400ms cubic-bezier(0.25, 1, 0.5, 1)",
                    backgroundColor: "#e5e5e5",
                    viewTransitionName: `project-${p.id}`,
                  } as React.CSSProperties
                }
              >
                {/* Project Visual
                    Live sites are mounted only while hovered. Unmounting the
                    iframe on mouse-leave guarantees off-hover previews stop
                    running instead of quietly animating in the background. */}
                {isHovered && "previewUrl" in p && p.previewUrl ? (
                  <iframe
                    key={`live-preview-${p.id}`}
                    src={p.previewUrl}
                    title={`${p.title} live preview`}
                    tabIndex={-1}
                    aria-hidden="true"
                    loading="eager"
                    className="absolute top-0 left-0 border-0 pointer-events-none grayscale-0 opacity-100"
                    style={{
                      width: "200%",
                      height: "200%",
                      transform: "scale(0.5)",
                      transformOrigin: "top left",
                    }}
                  />
                ) : "idlePreviewUrl" in p && p.idlePreviewUrl ? (
                  <iframe
                    key={`idle-preview-${p.id}`}
                    src={p.idlePreviewUrl}
                    title={`${p.title} paused preview`}
                    tabIndex={-1}
                    aria-hidden="true"
                    loading="eager"
                    className="absolute top-0 left-0 border-0 pointer-events-none grayscale opacity-30"
                    style={{
                      width: "200%",
                      height: "200%",
                      transform: "scale(0.5)",
                      transformOrigin: "top left",
                    }}
                  />
                ) : "image" in p && p.image ? (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#efffef] text-black p-6 flex flex-col justify-between grayscale opacity-40">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em]">
                      {p.category}
                    </div>
                    <div>
                      <div className="text-4xl md:text-5xl tracking-[-0.05em] leading-[0.9]">
                        {p.title}
                      </div>
                      <div className="mt-4 h-px bg-black/50" />
                      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                        live preview on hover
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay */}
                <div
                  className={`absolute inset-0 bg-[#d1d1d1] mix-blend-multiply transition-opacity duration-500 ${
                    isHovered ? "opacity-0" : "opacity-60"
                  }`}
                />

                {/* Scrim */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-400 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Metadata */}
                <div
                  className={`absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex justify-between items-end transition-all duration-400 transform ${
                    isHovered
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <div className="text-white mix-blend-exclusion">
                    <div className="text-xs md:text-sm font-mono opacity-80 mb-1">
                      {p.id}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-1">
                      {p.title}
                    </h2>

                    <div className="text-sm opacity-80">
                      {p.category}
                    </div>
                  </div>

                  <div className="text-white mix-blend-exclusion font-mono text-sm opacity-80">
                    {p.year}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showBlog && (
        <div className="fixed inset-0 z-50 bg-[#00ff00] text-black overflow-hidden flex flex-col">
          <div className="relative z-10 p-4 md:p-8 flex justify-between items-center w-full shrink-0">
            <button
              onClick={() => {
                setShowBlog(false)
                setActiveBlogKey(null)
              }}
              className="text-black text-xl hover:italic transition-all uppercase tracking-widest font-mono"
            >
              [ Close ]
            </button>
            <div className="font-mono text-xl">BLOG</div>
          </div>

          <div className="relative z-10 px-4 md:px-8 pb-4 shrink-0">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3 xl:gap-6">
              <div className="flex flex-wrap gap-2">
                {blogTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveBlogTab(tab.id)
                      setActiveBlogKey(null)
                      trackEvent("blog_tab_open", { blog_tab: tab.id })
                    }}
                    className={`font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] px-3 py-2 border border-black transition-colors ${
                      activeBlogTab === tab.id
                        ? "bg-black text-[#00ff00]"
                        : "bg-transparent text-black hover:bg-black hover:text-[#00ff00]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleBlogSubscribe}
                className="flex flex-col sm:flex-row sm:items-center gap-2 xl:min-w-[520px]"
              >
                <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] whitespace-nowrap">
                  new posts → inbox
                </div>
                <div className="flex min-w-0 flex-1">
                  <input
                    type="email"
                    value={subscriberEmail}
                    onChange={(event) => {
                      setSubscriberEmail(event.target.value)
                      if (subscribeState !== "idle") {
                        setSubscribeState("idle")
                        setSubscribeMessage("")
                      }
                    }}
                    placeholder="you@email.com"
                    aria-label="Email address for blog updates"
                    required
                    className="min-w-0 flex-1 border border-black border-r-0 bg-[#efffef] px-3 py-2 font-mono text-xs md:text-sm outline-none placeholder:text-black/40 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={subscribeState === "loading"}
                    className="border border-black bg-black text-[#00ff00] px-3 py-2 font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] hover:bg-transparent hover:text-black transition-colors disabled:opacity-50"
                  >
                    {subscribeState === "loading" ? "joining…" : "subscribe"}
                  </button>
                </div>
                {subscribeMessage && (
                  <div
                    className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
                      subscribeState === "error" ? "text-black" : "text-black/60"
                    }`}
                  >
                    {subscribeMessage}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="relative z-10 flex-1 min-h-0 px-4 md:px-8 pb-4 md:pb-8">
            <div className="h-full grid grid-cols-1 md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] gap-4 md:gap-8">
              <div className="hidden md:flex flex-col justify-end pb-2">
                <h1 className="text-6xl lg:text-8xl tracking-tighter leading-[0.9] mb-5">
                  things i’m<br />into.
                </h1>
                <p className="text-xl lg:text-2xl leading-tight max-w-sm opacity-75">
                  {activeBlogTab === "professional"
                    ? "projects, research, experiments, and the work i want people to actually hire me for."
                    : activeBlogTab === "reviews"
                      ? "books, films, music, and the things worth thinking about for more than a sentence."
                      : "posts from elsewhere, collected here without turning the whole site into a feed."}
                </p>
              </div>

              <div className="h-full overflow-y-auto pr-1 md:pr-3">
                <div className="flex flex-col gap-3 md:gap-4 pb-8">
                  {visibleBlogEntries.length > 0 ? (
                    visibleBlogEntries.map((entry, index) => {
                      const isOpen = activeBlogKey === entry.key

                      return (
                        <article
                          key={entry.key}
                          className={`w-full bg-[#efffef] transition-[min-height,background-color] duration-300 ease-out overflow-hidden ${
                            isOpen ? "min-h-[72vh]" : "min-h-[104px]"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActiveBlogKey(isOpen ? null : entry.key)
                              if (!isOpen) {
                                trackEvent("blog_entry_open", {
                                  blog_source: entry.label,
                                  blog_title: entry.title.slice(0, 80),
                                })
                              }
                            }}
                            className="w-full min-h-[104px] p-5 md:p-6 flex items-center justify-between gap-6 text-left"
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] opacity-55 mb-2">
                                {String(index + 1).padStart(2, "0")} / {entry.label}
                              </div>
                              <h2 className="text-2xl md:text-4xl tracking-tight leading-[1.02] font-medium line-clamp-2">
                                {entry.title}
                              </h2>
                            </div>

                            <div className="flex flex-col items-end gap-3 shrink-0">
                              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] opacity-55">
                                {entry.date}
                              </span>
                              <span className="font-mono text-lg">{isOpen ? "−" : "+"}</span>
                            </div>
                          </button>

                          {isOpen && (
                            <div
                              className="h-[calc(72vh-104px)] overflow-y-auto px-5 md:px-6 pb-10"
                              onWheel={(event) => {
                                const target = event.currentTarget
                                const atBottom =
                                  target.scrollHeight - target.scrollTop - target.clientHeight < 6

                                if (atBottom && event.deltaY > 0) {
                                  setActiveBlogKey(null)
                                }
                              }}
                            >
                              <div className="border-t border-black/15 pt-7">
                                <div className="max-w-3xl">
                                  <p className="text-xl md:text-2xl leading-[1.35] whitespace-pre-line">
                                    {entry.body}
                                  </p>

                                  {entry.tags.length > 0 && (
                                    <div className="mt-8 font-mono uppercase tracking-wider text-[10px] md:text-xs opacity-55">
                                      {entry.tags.join(" · ")}
                                    </div>
                                  )}

                                  {entry.url && (
                                    <a
                                      href={entry.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 mt-8 font-mono uppercase tracking-wider text-sm underline underline-offset-4 hover:italic"
                                    >
                                      Open source ↗
                                    </a>
                                  )}

                                  <div className="mt-12 pt-5 border-t border-black/15 font-mono text-[10px] uppercase tracking-[0.12em] opacity-45">
                                    keep scrolling to collapse
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </article>
                      )
                    })
                  ) : (
                    <div className="bg-[#efffef] p-6 min-h-[104px]">
                      <div className="font-mono text-xs uppercase tracking-wider mb-4">01 / blog</div>
                      <div className="text-3xl tracking-tight">first post coming soon.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Case Study Overlay */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#00ff00] overflow-hidden"
          style={
            {
              viewTransitionName: `project-${activeProject.id}`,
            } as React.CSSProperties
          }
        >
          {"previewUrl" in activeProject && activeProject.previewUrl ? (
            <iframe
              src={activeProject.previewUrl}
              title={`${activeProject.title} preview`}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-30"
            />
          ) : (
            <img
              src={activeProject.image}
              alt={activeProject.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply"
            />
          )}

          <div className="relative z-10 p-8 flex justify-between items-center w-full">
            <button
              onClick={handleBack}
              className="text-black text-xl hover:italic transition-all uppercase tracking-widest font-mono"
            >
              [ Close ]
            </button>

            <div className="font-mono text-xl">
              {activeProject.id}
            </div>
          </div>

          <div className="relative z-10 mt-auto p-8 md:p-16 max-w-4xl">
            <h1 className="text-6xl md:text-8xl tracking-tighter mb-4">
              {activeProject.title}
            </h1>

            <p className="text-2xl md:text-3xl leading-tight opacity-80 mb-8 max-w-2xl">
              {activeProject.description}
            </p>

            <a
              href={activeProject.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("project_visit", {
                  project_id: activeProject.id,
                  project_title: activeProject.title,
                  destination: activeProject.url,
                })
              }
              className="inline-flex items-center gap-2 mb-8 font-mono uppercase tracking-wider text-sm border border-black px-4 py-3 hover:bg-black hover:text-[#00ff00] transition-colors"
            >
              Open Project ↗
            </a>

            <div className="flex gap-8 font-mono uppercase tracking-wider text-sm border-t border-black/20 pt-8">
              <div>
                <span className="opacity-50 block mb-1">
                  Category
                </span>
                {activeProject.category}
              </div>

              <div>
                <span className="opacity-50 block mb-1">
                  Year
                </span>
                {activeProject.year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}