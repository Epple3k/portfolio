import React, { useEffect, useMemo, useState } from "react"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type BlogTab = "professional" | "reviews" | "socials"

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

type Project = {
  id: string
  title: string
  eyebrow: string
  year: string
  url: string
  role: string
  summary: string
  stack: string[]
  signals: string[]
  problem: string
  built: string
  evidence: string
  next: string
}

const PROJECTS: Project[] = [
  {
    id: "01",
    title: "Research Atlas",
    eyebrow: "Research interface · data visualization",
    year: "2026",
    url: "https://epple3k.github.io/fsu-research-atlas-2/",
    role: "Product design · interface engineering · data modeling",
    summary:
      "An interactive research-discovery system that turns a large scholarly corpus into an explorable map of ideas, evidence, fields, and change over time.",
    stack: ["OpenAlex", "React", "data visualization", "provenance UI"],
    signals: ["38,879 works", "26 fields", "5,430 interdisciplinary works"],
    problem:
      "Search works well when you already know what you are looking for. It gets weaker when a question spans disciplines, terminology changes over time, or the useful signal lives in relationships between sources rather than one result.",
    built:
      "I designed a research surface around an editable central claim, provenance evidence, yearly change, field distribution, and a network view. The interaction is meant to let a researcher move between a high-level pattern and the evidence beneath it without losing context.",
    evidence:
      "The current corpus contains 38,879 works, including 5,430 interdisciplinary records, modeled across 26 fields. The interface is structured around keeping those relationships legible rather than flattening them into a conventional results list.",
    next:
      "Tighten the query-to-evidence loop, add stronger uncertainty cues, and test whether first-time users can explain why a recommendation or relationship appears before expanding the feature set.",
  },
  {
    id: "02",
    title: "Ledgerline",
    eyebrow: "Fintech · conversational data product",
    year: "2026",
    url: "https://ledgerline-finance.onrender.com/",
    role: "Product concept · interface design · implementation",
    summary:
      "A finance-native ChatGPT plugin for exploring company fundamentals, filings, macro data, and source-linked financial analysis inside the conversation.",
    stack: ["MCP", "Node.js", "financial data", "chat-native UI"],
    signals: ["Live MCP prototype", "Source-linked analysis", "Financial data in chat"],
    problem:
      "Financial research is usually split across terminals, filings, spreadsheets, dashboards, and search. The handoff cost between those surfaces becomes part of the analytical work.",
    built:
      "I treated the assistant as an interaction layer rather than a replacement for financial data. Ledgerline exposes structured finance tools to the conversation, keeps source context close to the answer, and explores how charts and financial objects can live directly in a chat workflow.",
    evidence:
      "The project includes a deployed service, a packaged plugin surface, finance-specific interaction concepts, and supporting documentation. It is also a test bed for harder questions around trust, provenance, and what should stay deterministic when an LLM is involved.",
    next:
      "Narrow the product around a smaller set of high-value workflows, improve failure handling, and measure task completion against a conventional research workflow.",
  },
  {
    id: "03",
    title: "Aural Field",
    eyebrow: "Interaction design · generative audio",
    year: "2026",
    url: "https://epple3k.github.io/aural-field/",
    role: "Product design · interaction design · frontend",
    summary:
      "A generative ambient sound instrument built around spatial interaction, restrained controls, and a visual form that responds to the sound being shaped.",
    stack: ["Web Audio", "React", "interaction prototyping", "responsive UI"],
    signals: ["Generative audio", "Spatial controls", "Web + desktop exploration"],
    problem:
      "Most generative music tools expose the system as knobs, panels, and synthesis terminology. I wanted the interaction to feel closer to sculpting a space than configuring a synthesizer.",
    built:
      "The interface reduces the control surface, lets position and gesture influence sound, and uses a central visual form as feedback. Iterations focused on lingering effects, fade behavior, control density, responsive layout, and keeping the experience usable without turning it into a conventional DAW.",
    evidence:
      "Aural Field has gone through multiple interaction and packaging iterations rather than stopping at a single visual prototype. The work is useful precisely because the design problem is deciding what to remove, what should respond immediately, and what can remain ambiguous without becoming confusing.",
    next:
      "Add lightweight session recording, test whether first-time users can intentionally reproduce a sound state, and document the interaction model with short before-and-after clips.",
  },
]

const EXPERIMENTS = [
  {
    title: "Attention Field",
    description:
      "A live visualization of shifting attention, clustering, gravity, and motion across a changing information field.",
    href: "https://epple3k.github.io/attention-field/",
    tags: ["visualization", "interaction", "web"],
  },
  {
    title: "Finance product prototypes",
    description:
      "Experiments in financial interfaces, simulations, conversational finance, and systems that make future obligations visible before a decision is made.",
    href: "#work",
    tags: ["fintech", "product", "systems"],
  },
  {
    title: "Human-centered AI research",
    description:
      "Prototype and interview work around how AI can support participation, explanation, tradeoffs, and evidence without replacing stakeholder judgment.",
    href: "#about",
    tags: ["HCI", "AI", "research"],
  },
]

const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/emit-rice/" },
  { label: "GitHub", href: "https://github.com/Epple3k" },
  {
    label: "Resume",
    href: "https://drive.google.com/file/d/1T0kGhrBbBjQcRAYVWHMlaBru_YGmZLZA/view?usp=sharing",
  },
  { label: "Email", href: "mailto:rice.emit3k@gmail.com" },
]

const BLOG_API_URL =
  import.meta.env.VITE_BLOG_API_URL ?? "https://api.emitrice.com"

const isInternalTraffic = () => {
  try {
    return window.localStorage.getItem("portfolio_internal") === "1"
  } catch {
    return false
  }
}

const track = (
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
) => {
  if (isInternalTraffic()) return
  window.gtag?.("event", eventName, params)
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="border-t border-black/20 py-10 md:py-14">
      <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
        <div>
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
            <span>{project.id} / selected work</span>
            <span>{project.year}</span>
          </div>
          <h3 className="mt-5 text-5xl leading-[0.92] tracking-[-0.055em] md:text-7xl">
            {project.title}
          </h3>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] opacity-55">
            {project.eyebrow}
          </p>
        </div>

        <div>
          <p className="max-w-3xl text-xl leading-snug tracking-[-0.02em] md:text-2xl">
            {project.summary}
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {project.signals.map((signal) => (
              <div
                key={signal}
                className="border border-black/15 bg-white/45 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.1em]"
              >
                {signal}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em]"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("project_visit", {
                  project_id: project.id,
                  project_title: project.title,
                  destination: project.url,
                })
              }
              className="border border-black bg-black px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#c8ff00] transition-transform hover:-translate-y-0.5"
            >
              Open live project ↗
            </a>
            <span className="border border-black/20 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">
              {project.role}
            </span>
          </div>

          <details
            className="group mt-7 border-t border-black/15 pt-5"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                track("case_study_expand", {
                  project_id: project.id,
                  project_title: project.title,
                })
              }
            }}
          >
            <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.12em]">
              <span className="group-open:hidden">Read case study +</span>
              <span className="hidden group-open:inline">Close case study −</span>
            </summary>
            <div className="mt-7 grid gap-7 md:grid-cols-2">
              {[
                ["Problem", project.problem],
                ["What I built", project.built],
                ["Evidence", project.evidence],
                ["Next", project.next],
              ].map(([label, body]) => (
                <div key={label}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-45">
                    {label}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{body}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [activeBlogTab, setActiveBlogTab] = useState<BlogTab>("professional")
  const [subscriberEmail, setSubscriberEmail] = useState("")
  const [subscribeState, setSubscribeState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [subscribeMessage, setSubscribeMessage] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("internal") === "1") {
      try {
        window.localStorage.setItem("portfolio_internal", "1")
      } catch {}
    }

    if (params.get("external") === "1") {
      try {
        window.localStorage.removeItem("portfolio_internal")
      } catch {}
    }

    track("portfolio_view", {
      application_source: params.get("utm_source") ?? undefined,
      application_medium: params.get("utm_medium") ?? undefined,
      application_campaign: params.get("utm_campaign") ?? undefined,
      page_path: window.location.pathname,
    })

    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(base + "notes.json").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch(base + "social-feed.json").then((response) =>
        response.ok ? response.json() : [],
      ),
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

  const blogEntries = useMemo(() => {
    return [
      ...notes.map((note, index) => ({
        key: "note-" + note.date + "-" + index,
        label: "blog",
        title: note.title,
        date: note.date,
        summary: note.summary,
        tabs: note.tabs?.length ? note.tabs : (["professional"] as BlogTab[]),
        url: undefined as string | undefined,
      })),
      ...socialPosts.map((post, index) => ({
        key: "social-" + post.platform + "-" + index,
        label: post.platform,
        title: post.title ?? post.text,
        date: post.date ?? "",
        summary: post.text,
        tabs: post.tabs?.length
          ? post.tabs
          : post.platform === "letterboxd" ||
              post.platform === "goodreads" ||
              post.platform === "rateyourmusic"
            ? (["reviews"] as BlogTab[])
            : (["socials"] as BlogTab[]),
        url: post.url,
      })),
    ].sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  }, [notes, socialPosts])

  const visibleBlogEntries = blogEntries
    .filter((entry) => entry.tabs.includes(activeBlogTab))
    .slice(0, 6)

  const handleBlogSubscribe = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const email = subscriberEmail.trim().toLowerCase()
    if (!email || subscribeState === "loading") return

    setSubscribeState("loading")
    setSubscribeMessage("")

    try {
      const response = await fetch(BLOG_API_URL + "/api/blog/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, company: "" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not subscribe right now.")
      }
      setSubscribeState("success")
      setSubscribeMessage("You are on the list.")
      setSubscriberEmail("")
      track("blog_subscribe", { source: "writing_section" })
    } catch (error) {
      setSubscribeState("error")
      setSubscribeMessage(
        error instanceof Error ? error.message : "Could not subscribe right now.",
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5ef] text-[#101010] selection:bg-black selection:text-[#c8ff00]">
      <header className="sticky top-0 z-40 border-b border-black/15 bg-[#f4f5ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-4 py-4 md:px-8">
          <a
            href="#top"
            className="text-lg font-medium tracking-[-0.03em]"
            onClick={() => track("nav_click", { destination: "top" })}
          >
            emit rice
          </a>
          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.12em] sm:gap-5 sm:text-[10px]"
          >
            <a href="#work" className="hover:underline">Work</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#writing" className="hover:underline">Writing</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-[1500px] px-4 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
                Product design · design engineering · HCI
              </div>
              <h1 className="mt-6 max-w-6xl text-[clamp(3.9rem,9vw,9.5rem)] leading-[0.82] tracking-[-0.075em]">
                I design and build interfaces for complex systems.
              </h1>
            </div>

            <div className="pb-2">
              <p className="max-w-xl text-lg leading-relaxed tracking-[-0.02em] md:text-xl">
                Data-heavy, AI-enabled products where the hard part is not adding
                more information. It is making the right structure visible.
              </p>
              <div className="mt-7 inline-flex border border-black bg-[#c8ff00] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]">
                Summer 2027 · product / design engineering / HCI
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-3 border-t border-black/20 pt-5 font-mono text-[9px] uppercase tracking-[0.12em] opacity-55 sm:grid-cols-2 md:grid-cols-4">
            <span>MIS + Finance</span>
            <span>HCI research</span>
            <span>Product design</span>
            <span>Interface engineering</span>
          </div>
        </section>

        <section id="work" className="scroll-mt-24 border-y border-black/20">
          <div className="mx-auto max-w-[1500px] px-4 md:px-8">
            <div className="flex items-end justify-between gap-6 py-8">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
                  Selected work
                </div>
                <h2 className="mt-3 text-4xl tracking-[-0.045em] md:text-5xl">
                  Three projects, all the way down.
                </h2>
              </div>
              <p className="hidden max-w-sm text-right text-sm leading-relaxed opacity-55 md:block">
                Each project shows the problem, my role, the system underneath,
                evidence, and what I would change next.
              </p>
            </div>
            {PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-20">
          <div className="grid gap-8 md:grid-cols-[0.6fr_1.4fr]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
                Experiments
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-60">
                Smaller prototypes and ongoing investigations live here so the
                flagship work can stay legible.
              </p>
            </div>
            <div className="grid gap-3">
              {EXPERIMENTS.map((experiment) => (
                <a
                  key={experiment.title}
                  href={experiment.href}
                  target={experiment.href.startsWith("http") ? "_blank" : undefined}
                  rel={experiment.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group grid gap-5 border border-black/15 p-5 transition-colors hover:bg-black hover:text-[#c8ff00] sm:grid-cols-[1fr_auto]"
                  onClick={() =>
                    track("experiment_open", {
                      experiment_title: experiment.title,
                    })
                  }
                >
                  <div>
                    <h3 className="text-2xl tracking-[-0.035em]">
                      {experiment.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-65">
                      {experiment.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap content-start gap-1.5 sm:max-w-[190px] sm:justify-end">
                    {experiment.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-current/25 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-[#101010] text-white">
          <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-16 md:grid-cols-[0.65fr_1.35fr] md:px-8 md:py-24">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#c8ff00]">
              About
            </div>
            <div>
              <h2 className="max-w-5xl text-4xl leading-[1.02] tracking-[-0.045em] md:text-6xl">
                I am interested in the point where data, AI, and institutional
                complexity have to become understandable to a person making a decision.
              </h2>
              <div className="mt-9 grid gap-7 text-base leading-relaxed text-white/70 md:grid-cols-2">
                <p>
                  I study Management Information Systems and Finance at Florida State
                  and work in HCI research. My projects move between research discovery,
                  civic AI, finance, generative interfaces, and visualization.
                </p>
                <p>
                  The domain changes. The recurring problem is the same: what
                  information should be visible, what can be automated, and what still
                  needs human judgment? I am looking for product design, design
                  engineering, HCI, and adjacent roles where I can contribute to the
                  interface and the system underneath it.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="border border-white/25 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors hover:border-[#c8ff00] hover:bg-[#c8ff00] hover:text-black"
                    onClick={() =>
                      track(link.label.toLowerCase() + "_click", {
                        destination: link.href,
                      })
                    }
                  >
                    {link.label} {link.href.startsWith("mailto:") ? "→" : "↗"}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="writing" className="scroll-mt-24 mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-20">
          <div className="grid gap-8 md:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
                Writing + updates
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-60">
                Professional work is the default. Reviews and social posts stay
                available without sitting in the recruiter path.
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                {([
                  ["professional", "Professional work"],
                  ["reviews", "Reviews & media"],
                  ["socials", "Social posts"],
                ] as [BlogTab, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveBlogTab(id)
                      track("blog_tab_open", { blog_tab: id })
                    }}
                    className={
                      "border border-black px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] " +
                      (activeBlogTab === id
                        ? "bg-black text-[#c8ff00]"
                        : "hover:bg-black hover:text-[#c8ff00]")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-6 divide-y divide-black/15 border-y border-black/15">
                {visibleBlogEntries.length ? (
                  visibleBlogEntries.map((entry) => {
                    const content = (
                      <>
                        <div className="flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.12em] opacity-45">
                          <span>{entry.label}</span>
                          <span>{entry.date}</span>
                        </div>
                        <h3 className="mt-3 text-2xl tracking-[-0.035em] md:text-3xl">
                          {entry.title}
                        </h3>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed opacity-65">
                          {entry.summary}
                        </p>
                      </>
                    )

                    return entry.url ? (
                      <a
                        key={entry.key}
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-6 transition-transform hover:translate-x-1"
                        onClick={() =>
                          track("writing_open", { source: entry.label })
                        }
                      >
                        {content}
                      </a>
                    ) : (
                      <article key={entry.key} className="py-6">
                        {content}
                      </article>
                    )
                  })
                ) : (
                  <div className="py-8 text-sm opacity-50">
                    No posts in this section yet.
                  </div>
                )}
              </div>

              <form
                onSubmit={handleBlogSubscribe}
                className="mt-8 grid gap-3 border border-black/15 p-4 sm:grid-cols-[1fr_auto] sm:items-end"
              >
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.12em] opacity-55">
                    New professional posts → inbox
                  </span>
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
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full border-b border-black bg-transparent px-0 py-2 text-lg outline-none placeholder:text-black/30 focus:border-b-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={subscribeState === "loading"}
                  className="border border-black bg-black px-4 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#c8ff00] disabled:opacity-50"
                >
                  {subscribeState === "loading" ? "Joining…" : "Subscribe"}
                </button>
                {subscribeMessage && (
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] sm:col-span-2">
                    {subscribeMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="scroll-mt-24 bg-[#c8ff00] text-black">
        <div className="mx-auto max-w-[1500px] px-4 py-14 md:px-8 md:py-20">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em]">Contact</div>
          <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <a
              href="mailto:rice.emit3k@gmail.com"
              className="max-w-5xl text-[clamp(3rem,7vw,7rem)] leading-[0.86] tracking-[-0.07em] hover:italic"
              onClick={() =>
                track("email_click", { destination: "rice.emit3k@gmail.com" })
              }
            >
              Let’s build something that needs explaining.
            </a>
            <div className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em]">
              Tallahassee · NYC / ATL / Boston
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black/20 pt-4 font-mono text-[9px] uppercase tracking-[0.12em] opacity-60">
            <span>© 2026 Emit Rice</span>
            <span>Clarity &gt; efficiency &gt; consistency &gt; beauty</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
