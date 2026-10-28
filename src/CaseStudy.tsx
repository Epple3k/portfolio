import React from "react"
import { trackEvent } from "./analytics"

type Step = { title: string; detail: string }
type Decision = { title: string; detail: string }
type CaseStudyContent = {
  question: string
  significance: string
  context: string
  role: string
  stage: string
  disciplines: string
  steps: Step[]
  decisions: Decision[]
  outcome: string
  boundary: string
  sourceUrl: string
  research?: {
    headline: string
    note: string
    themes: Step[]
    pipeline: Step[]
    next: string
  }
}
type Project = {
  id: string
  slug: string
  title: string
  category: string
  year: string
  description: string
  url: string
  previewUrl?: string
  image?: string
}

const CASE_STUDIES: Record<string, CaseStudyContent> = {
  "01": {
    question: "What if live data could be felt and understood at a glance, instead of read one update at a time?",
    significance: "A conventional feed gives every update its own line and asks the viewer to assemble the larger picture. Attention Field approaches that problem spatially: busy articles carry more visual weight, related topics gather, and movement suggests shifting activity. The goal is an immediate, intuitive impression of the data, something you can sense before deciding what deserves a closer look.",
    context: "A live editorial-activity instrument built from English Wikipedia's public recent-change stream. It is an exploration of Wikipedia editing behavior, not a claim to measure public opinion.",
    role: "Independent concept, interaction design & engineering",
    stage: "Working public experiment",
    disciplines: "Data visualization / interaction / engineering",
    steps: [
      { title: "Follow the signal", detail: "Stream recent edits through Wikimedia EventStreams, with activity, topic classification, and edit history driving the display." },
      { title: "Make relationships perceptible", detail: "Use real shared Wikipedia categories to draw articles together with springs, repulsion, and collision. Proximity and motion make clusters readable without asking someone to compare rows in a table." },
      { title: "Interrogate the patterns", detail: "Analyze edit summaries with a lightweight pattern engine that looks for repeated language across distinct editors, and expose a second, index-based view of the same data." },
    ],
    decisions: [
      { title: "Intuition must mean something", detail: "Activity determines size, topics determine color, and genuine connections shape movement. An attractive but ungrounded glow was removed: visual immediacy is only useful if it expresses the underlying data." },
      { title: "Verification without guesswork", detail: "Standalone tests exercised the simulation against real data, catching physics errors before release; the topic palette was checked for accessibility." },
    ],
    outcome: "A live browser instrument that offers two complementary encounters with the same activity: FIELD for sensing emerging patterns quickly, and INDEX for inspecting the individual records behind them. It is a design experiment in making complex information approachable before making it analytical.",
    boundary: "An expressive view of a particular public editing stream, not a statistically representative account of what everyone is paying attention to.",
    sourceUrl: "https://github.com/Epple3k/attention-field",
  },
  "02": {
    question: "How can someone discover meaningful overlaps between thousands of research papers, then inspect the evidence without losing the larger pattern?",
    significance: "A publication search is useful when you already know what you want. A radial network can look fascinating but bury the precise relationships in a knot of lines. Research Atlas gives each pair of OpenAlex fields a legible intersection, revealing shared work at a glance and letting every selected crossing lead to the underlying papers.",
    context: "An exploratory instrument built from Florida State University's 2018–2026 OpenAlex publication data. The intended research strategist audience remains a design hypothesis, not a validated user group.",
    role: "Product concept, research framing & prototype implementation",
    stage: "Working redesign / usability evaluation pending",
    disciplines: "Human–AI interaction / information design / research",
    steps: [
      { title: "Find the right unit", detail: "Represent interdisciplinary overlap as a crossing between two research fields. Each tile denotes the publications tagged with both, not a decorative or inferred relationship." },
      { title: "Reveal the landscape", detail: "Use a searchable, relationship-ordered matrix. Strong crossings emerge through intensity; empty intersections stay visible. Switch to a qualified comparison of publication counts across two time windows." },
      { title: "Follow the evidence", detail: "Search fields and indexed paper titles, select an intersection, and inspect exact counts and source records in the same workspace. Optional AI queries cannot supply unverified numbers." },
    ],
    decisions: [
      { title: "The matrix has a job", detail: "A field-pair grid sacrifices some network spectacle for precise lookup, side-by-side comparison, and readable absence. The underlying field names remain visible on both axes." },
      { title: "Source first, AI second", detail: "The dataset loads immediately, even if the AI backend is asleep. Stored source IDs are capped at 60 per crossing, and the time comparison explicitly discloses unequal windows." },
    ],
    outcome: "A working search → crossing → comparison → paper workflow, with data-driven signals, interactive field-pair shading, and source-linked evidence. The design reasoning and proposed evaluation tasks are documented in the repository.",
    boundary: "Field co-occurrence is a proxy, not proof of researcher collaboration or annualized growth. The redesign has not yet been shown to improve user comprehension through formal testing.",
    sourceUrl: "https://github.com/Epple3k/fsu-research-atlas-2",
  },
  "03": {
    question: "Can background sound be something you shape, rather than content you have to choose?",
    significance: "Listening tools often introduce another stream of choices, feeds, and media management. Aural Field proposes a quieter relationship: an ambient instrument that can be nudged when needed and then left alone, with a visual language that actually describes the sound.",
    context: "A procedural ambient instrument available as a web demo and an unpacked Chrome side-panel extension. It runs locally, without accounts, music libraries, or access to browsing data.",
    role: "Independent concept, interface & sound system",
    stage: "Playable prototype / browser extension",
    disciplines: "Creative coding / audio / interface design",
    steps: [
      { title: "Reduce the surface", detail: "Use a small set of controls: density, space, motion, and a two-dimensional material selector, rather than a library of presets to browse." },
      { title: "Couple sight and sound", detail: "Drive procedural geometry and Web Audio synthesis with the same parameters, from stereo width and reverb to overtone density and harmonic movement." },
      { title: "Make it ambient by design", detail: "Keep the instrument in Chrome's side panel, preserve settings between sessions, and allow direct interventions such as dropping a note into the current harmonic world." },
    ],
    decisions: [
      { title: "One object, a few forces", detail: "Treat the interface like a small creative instrument, not a conventional music player with transport and content browsing." },
      { title: "Minimal permissions", detail: "The extension requests side-panel and local-storage access only; synthesis happens in the browser." },
    ],
    outcome: "A working procedural audio experiment, a web-accessible demo, and a Chrome extension implementation whose controls affect both what is heard and what is seen.",
    boundary: "This is an expressive design prototype. No formal study has established an effect on focus or productivity.",
    sourceUrl: "https://github.com/Epple3k/aural-field",
  },
  "04": {
    question: "How can financial analysis stay grounded in primary evidence while happening inside a conversation?",
    significance: "Financial figures are easy to quote and easy to strip of context. Ledgerline tries to close the gap between asking a question, seeing the underlying SEC or macroeconomic data, checking where a number came from, and manipulating an intelligible visualization.",
    context: "A read-only finance analysis plugin built as a remote Model Context Protocol server with interactive views inside ChatGPT. It focuses on company filings, macroeconomic data, and user-supplied financial series.",
    role: "Product architecture, plugin engineering & financial visualization",
    stage: "Deployed prototype / distribution review separate",
    disciplines: "Fintech / AI tools / data provenance",
    steps: [
      { title: "Start at the source", detail: "Retrieve issuer financials from SEC EDGAR/XBRL and macroeconomic series from FRED, including tools for filing search and value tracing." },
      { title: "Bring analysis into the conversation", detail: "Expose eight MCP tools for research, calculation, and presentation, with shared in-chat charts, tables, series comparisons, and source inspection." },
      { title: "Keep the user in control", detail: "Support reusable metric calculations and visualization of structured data already supplied in the conversation, without placing trades or changing accounts." },
    ],
    decisions: [
      { title: "Provenance is an interface feature", detail: "Data points and reported values should provide routes back to the source instead of requiring trust in a fluent summary." },
      { title: "Read-only by intention", detail: "Separate exploration from execution. This tool analyzes public or provided information; it does not trade, move money, or promise investment outcomes." },
    ],
    outcome: "A deployed MCP-backed prototype with tools for company research, macro series, dilution, filings, source tracing, calculations, and reusable in-chat visualizations.",
    boundary: "An early-stage financial research tool, not a full market-data terminal. Issuer XBRL conventions vary, and important figures still require primary-source verification.",
    sourceUrl: "https://github.com/Epple3k/portfolio/tree/main/ledgerline-plugin",
  },
  "05": {
    question: "What if the people behind a planning model could change the model themselves?",
    significance: "Public planning works in two languages. Residents describe the futures they want; analysts need factors, constraints, and relationships they can reason about. The translation between those languages is where assumptions can become invisible. 2030canvas makes that translation a shared, editable object. The AI can propose an interpretation, but participants and researchers must be able to challenge it.",
    context: "Part of ongoing human-centered AI and civic-participation research at Florida State University's School of Information, in the context of Leon County's long-range planning. The research explores how scenario-based conversations and inspectable representations might make planning trade-offs easier to discuss. This is a lab prototype, not an official county planning service.",
    role: "Undergraduate research assistant / interface and product prototyping within a research team",
    stage: "Working research prototypes / further interviews planned",
    disciplines: "Human-centered AI / civic technology / information design",
    steps: [
      { title: "Listen before modeling", detail: "The research began with 15 exploratory stakeholder interviews. Those conversations inform the questions and interaction requirements; they are not treated as a representative survey or evidence that the prototype works." },
      { title: "Make interpretation inspectable", detail: "Turn a planning scenario into candidate factors, constraints, and proposed causal links. The diagram exposes the research team's and AI's interpretation instead of presenting it as a finished explanation." },
      { title: "Give people a way to disagree", detail: "A manual interface supports direct edits. A conversational interface converts ordinary-language requests into proposed edits for review. A separate factor bank defines which parts of the representation can change and which must remain constrained." },
    ],
    decisions: [
      { title: "AI suggests; people decide", detail: "Natural-language interpretation is a proposal, not an authoritative reading of resident intent. Participants need to inspect, correct, and reject suggestions before they become part of a working diagram." },
      { title: "Constraints should be visible", detail: "The factor bank separates inputs and constraints, participant-adjustable factors, and outputs. That distinction makes room for participant agency without letting a demo silently rewrite the research team's assumptions." },
      { title: "Keep the research layers separate", detail: "The public canvas, factor definitions, manual edits, and conversational edits serve different functions. Their purpose is to support the interview process; downstream numerical modeling and validation are distinct research tasks." },
    ],
    outcome: "The current deliverable is a family of working prototypes that can support the next round of interviewer-guided walkthroughs. The interesting output is not a forecast. It is the revisions, disagreements, and explanations that appear when people can inspect the representation of their own priorities. Those observations can inform later design iterations and the modeling questions researchers choose to pursue.",
    boundary: "The first 15 interviews informed exploration and design; they are not a usability evaluation of these interfaces. Diagram links are hypotheses to discuss, not verified causal effects. The prototypes do not produce validated land-use predictions, and no participant-level interview data are published here.",
    sourceUrl: "https://github.com/Epple3k/2030canvas",
    research: {
      headline: "A planning diagram is most useful when someone can disagree with it.",
      note: "Research to date: 15 exploratory stakeholder interviews, early thematic analysis, and a shift toward prototype-supported scenario conversations. These are working design directions, not published or validated research findings.",
      themes: [
        { title: "Trust and participation", detail: "Early conversations raised questions about who gets heard, what meaningful input looks like, and whether public participation changes decisions." },
        { title: "Information and access", detail: "Complex planning language and uneven access to context make it hard to reason about trade-offs on equal footing." },
        { title: "Ambivalence about AI", detail: "AI can make complicated scenarios easier to approach, while raising doubts about whose assumptions the output carries." },
      ],
      pipeline: [
        { title: "01 / Listen", detail: "Scenario interviews surface residents' goals, concerns, and interpretations of local planning choices." },
        { title: "02 / Structure", detail: "Researchers organize candidate factors, definitions, constraints, and an initial causal representation in the factor bank and baseline canvas." },
        { title: "03 / Intervene", detail: "Participants review the diagram using direct manipulation or natural-language requests. Proposed changes remain inspectable and revisable." },
        { title: "04 / Learn", detail: "Researchers study what participants revise, challenge, or leave unclear to inform subsequent interviews, model assumptions, and interface design." },
      ],
      next: "Next research step: use the prototypes in guided interviews, examine whether participants can understand and revise the model, and learn where the representations or AI translations fail. Quantitative scenario simulation remains a separate, unvalidated downstream possibility.",
    },
  },
}

const SectionKicker = ({ number, children }: { number: string; children: React.ReactNode }) => (
  <div className="font-mono text-[11px] md:text-xs uppercase tracking-[0.12em] leading-relaxed">
    <span className="mr-4 opacity-45">{number}</span>{children}
  </div>
)

export default function CaseStudy({
  project, onClose, onNext, nextTitle,
}: {
  project: Project
  onClose: () => void
  onNext: () => void
  nextTitle: string
}) {
  const study = CASE_STUDIES[project.id]
  if (!study) return null

  const trackOutbound = (destination: string, kind: string) => {
    trackEvent("project_visit", {
      project_id: project.id,
      project_title: project.title,
      destination,
      link_kind: kind,
    })
  }

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#00ff00] text-black"
      style={{ viewTransitionName: "project-" + project.id } as React.CSSProperties}
    >
      <div className="relative z-20 flex shrink-0 items-center justify-between gap-4 border-b-2 border-black bg-[#00ff00] px-4 py-4 md:px-10">
        <button
          autoFocus
          type="button"
          onClick={onClose}
          className="font-mono text-xs md:text-sm uppercase tracking-[0.1em] hover:italic focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          ← Close / all projects
        </button>
        <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em]">
          Case study / {project.id} of 05
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-case-study-scroll>
        <header className="border-b-2 border-black px-4 pb-10 pt-10 md:px-10 md:pb-16 md:pt-14">
          <div className="mb-6 flex flex-wrap justify-between gap-3 font-mono text-xs uppercase tracking-[0.12em]">
            <span>{project.category}</span><span>{project.year} / Selected work</span>
          </div>
          <h1
            id="case-study-title"
            className="mb-8 max-w-[1400px] break-words text-[clamp(4rem,11vw,10rem)] font-medium lowercase leading-[0.78] tracking-[-0.075em]"
          >
            {project.title}
          </h1>
          <p className="max-w-4xl text-xl leading-[1.15] tracking-tight md:text-3xl lg:text-4xl">
            {project.description}
          </p>
        </header>

        <div className="grid grid-cols-1 border-b-2 border-black md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="flex flex-col justify-between border-b-2 border-black p-5 md:border-b-0 md:border-r-2 md:p-10">
            <SectionKicker number="01">The question</SectionKicker>
            <h2 className="mt-12 max-w-[850px] text-[clamp(2rem,4.8vw,4.8rem)] leading-[1.02] tracking-[-0.055em]">
              {study.question}
            </h2>
          </div>
          <div className="flex min-h-[380px] flex-col bg-[#efffef]">
            <div className="flex justify-between border-b border-black/30 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] md:px-8">
              <span>Project window</span><span>Live artifact ↗</span>
            </div>
            <div className="relative min-h-[280px] flex-1 overflow-hidden bg-[#dbefdb]">
              {project.previewUrl ? (
                <iframe
                  key={project.id}
                  src={project.previewUrl}
                  title={project.title + " project preview"}
                  tabIndex={-1}
                  aria-hidden="true"
                  loading="lazy"
                  className="pointer-events-none absolute left-0 top-0 border-0"
                  style={{ width: "200%", height: "200%", transform: "scale(0.5)", transformOrigin: "top left" }}
                />
              ) : project.image ? (
                <img className="absolute inset-0 h-full w-full object-cover" src={project.image} alt="" />
              ) : null}
            </div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOutbound(project.url, "live_project")}
              className="flex justify-between border-t border-black bg-black px-5 py-4 font-mono text-xs uppercase tracking-[0.1em] text-[#00ff00] transition-colors hover:bg-[#234123] md:px-8"
            >
              <span>Open live project</span><span>↗</span>
            </a>
          </div>
        </div>

        <section className="grid border-b-2 border-black bg-[#efffef] md:grid-cols-[minmax(200px,0.34fr)_minmax(0,1fr)]">
          <div className="border-b border-black/30 p-5 md:border-b-0 md:border-r md:p-10">
            <SectionKicker number="02">Why it matters</SectionKicker>
          </div>
          <div className="p-5 pb-12 md:p-10 md:pb-16">
            <p className="max-w-4xl text-2xl leading-[1.2] tracking-tight md:text-4xl">
              {study.significance}
            </p>
            <p className="mt-8 max-w-3xl text-base leading-relaxed md:mt-12 md:text-xl">
              {study.context}
            </p>
            <div className="mt-12 grid gap-6 border-t border-black/30 pt-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.06em] sm:grid-cols-3">
              <div><span className="mb-2 block opacity-50">Role</span>{study.role}</div>
              <div><span className="mb-2 block opacity-50">Discipline</span>{study.disciplines}</div>
              <div><span className="mb-2 block opacity-50">Status</span>{study.stage}</div>
            </div>
          </div>
        </section>

        <section className="border-b-2 border-black px-5 py-10 md:px-10 md:py-16">
          <SectionKicker number="03">Approach / how it works</SectionKicker>
          <h2 className="my-8 text-4xl leading-[0.95] tracking-[-0.055em] md:my-12 md:text-6xl">
            From question to interface.
          </h2>
          <div className="grid gap-0 border-t-2 border-black md:grid-cols-3">
            {study.steps.map((step, index) => (
              <div
                key={step.title}
                className="border-b border-black/40 py-7 md:border-b-0 md:border-r md:px-7 md:py-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
              >
                <div className="font-mono text-xs opacity-50">{String(index + 1).padStart(2, "0")}</div>
                <h3 className="mb-4 mt-8 text-2xl leading-[1.05] tracking-tight md:text-3xl">{step.title}</h3>
                <p className="max-w-lg text-base leading-relaxed md:text-lg">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {study.research && (
          <>
            <section className="border-b-2 border-black bg-[#efffef] px-5 py-10 md:px-10 md:py-16">
              <SectionKicker number="03A">Research to date / working themes</SectionKicker>
              <h2 className="my-8 max-w-5xl text-[clamp(2.5rem,5vw,5.5rem)] leading-[0.98] tracking-[-0.055em]">
                {study.research.headline}
              </h2>
              <p className="mb-10 max-w-4xl text-base leading-relaxed md:text-xl">{study.research.note}</p>
              <div className="grid gap-0 border-t-2 border-black md:grid-cols-3">
                {study.research.themes.map((theme, index) => (
                  <div key={theme.title} className="border-b border-black/40 py-6 md:border-b-0 md:border-r md:px-7 md:py-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                    <div className="font-mono text-xs opacity-50">{String(index + 1).padStart(2, "0")} / Working theme</div>
                    <h3 className="mt-5 text-2xl tracking-tight">{theme.title}</h3>
                    <p className="mt-4 max-w-lg text-base leading-relaxed md:text-lg">{theme.detail}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border-b-2 border-black px-5 py-10 md:px-10 md:py-16">
              <SectionKicker number="03B">The artifact's place in the R&D system</SectionKicker>
              <h2 className="my-8 max-w-5xl text-[clamp(2.5rem,5vw,5.5rem)] leading-[0.98] tracking-[-0.055em]">
                Research in. Revisions out.
              </h2>
              <div className="grid gap-px overflow-hidden border-2 border-black bg-black md:grid-cols-4">
                {study.research.pipeline.map((step) => (
                  <div key={step.title} className="flex flex-col bg-[#efffef] p-5 md:min-h-[280px] md:p-6">
                    <span className="font-mono text-xs uppercase tracking-[0.08em]">{step.title}</span>
                    <p className="mt-6 text-base leading-relaxed md:mt-auto md:pt-10 md:text-lg">{step.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-9 max-w-4xl border-l-2 border-black pl-5 text-base leading-relaxed md:text-xl">
                {study.research.next}
              </p>
            </section>
          </>
        )}

        <section className="grid border-b-2 border-black bg-[#efffef] md:grid-cols-[minmax(200px,0.34fr)_minmax(0,1fr)]">
          <div className="border-b border-black/30 p-5 md:border-b-0 md:border-r md:p-10">
            <SectionKicker number="04">Key decisions</SectionKicker>
          </div>
          <div className="p-5 md:p-10">
            {study.decisions.map((decision, index) => (
              <div key={decision.title} className={"grid gap-3 py-7 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] md:gap-10 " + (index > 0 ? "border-t border-black/25" : "pt-0")}>
                <h3 className="text-xl leading-tight tracking-tight md:text-2xl">{decision.title}</h3>
                <p className="text-base leading-relaxed md:text-lg">{decision.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid border-b-2 border-black md:grid-cols-[minmax(200px,0.34fr)_minmax(0,1fr)]">
          <div className="border-b border-black/30 p-5 md:border-b-0 md:border-r md:p-10">
            <SectionKicker number="05">Outcome / next questions</SectionKicker>
          </div>
          <div className="p-5 py-10 md:p-10 md:py-14">
            <p className="max-w-4xl text-2xl leading-[1.2] tracking-tight md:text-4xl">{study.outcome}</p>
            <div className="mt-10 border-l-2 border-black pl-5 md:mt-14">
              <span className="mb-3 block font-mono text-xs uppercase tracking-wider opacity-55">What this does not claim</span>
              <p className="max-w-3xl text-base leading-relaxed md:text-lg">{study.boundary}</p>
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutbound(project.url, "live_project")}
                className="border-2 border-black bg-black px-6 py-4 font-mono text-xs uppercase tracking-[0.08em] text-[#00ff00] transition-colors hover:bg-transparent hover:text-black"
              >Explore the project ↗</a>
              <a
                href={study.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutbound(study.sourceUrl, "source_code")}
                className="border-2 border-black px-6 py-4 font-mono text-xs uppercase tracking-[0.08em] transition-colors hover:bg-black hover:text-[#00ff00]"
              >Source & documentation ↗</a>
              <a
                href={`/projects/${project.slug}/`}
                className="border-2 border-black px-6 py-4 font-mono text-xs uppercase tracking-[0.08em] transition-colors hover:bg-black hover:text-[#00ff00]"
              >Shareable case study ↗</a>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={onNext}
          className="group flex w-full items-end justify-between gap-6 px-5 py-10 text-left transition-colors hover:bg-black hover:text-[#00ff00] focus-visible:outline-2 focus-visible:outline-offset-[-6px] md:px-10 md:py-16"
        >
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.1em]">Next case study ↗</span>
            <div className="mt-5 text-[clamp(2.8rem,7vw,7rem)] leading-none tracking-[-0.065em]">{nextTitle}</div>
          </div>
          <span aria-hidden="true" className="shrink-0 text-4xl transition-transform group-hover:translate-x-2 md:text-6xl">↗</span>
        </button>
      </div>
    </section>
  )
}
