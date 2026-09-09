import { useState, useEffect, useRef } from "react";
import attentionFieldImg from "./assets/project-attention-field.png";
import scrollInterfaceImg from "./assets/project-scroll-interface.png";
import dataTopographyImg from "./assets/project-data-topography.png";
import { ClickHandTrigger } from "./components/ClickHand";

const projects = [
  {
    num: "03",
    title: "ATTENTION FIELD",
    subtitle: "Interactive Attention System",
    description:
      "Interactive system for exploring relationships between information through attention, movement, and proximity.",
    category: "INTERACTION STUDY",
    year: "2026",
    image: dataTopographyImg,
    link: "https://epple3k.github.io/attention-field/",
  },
  {
    num: "02",
    title: "SCROLL INTERFACE",
    subtitle: "Kinetic Feedback Experiment",
    description:
      "A minimal interface built around continuous scroll-wheel interaction and kinetic feedback loops.",
    category: "INTERFACE STUDY",
    year: "2025",
    image: scrollInterfaceImg,
    link: "https://epple3k.github.io/contiunuum/",
  },
  {
    num: "01",
    title: "RESEARCH ATLAS",
    subtitle: "3D Multivariate Landscape",
    description:
      "Translating complex multivariate datasets into navigable 3D landscapes for exploratory analysis.",
    category: "DATA VISUALIZATION",
    year: "2026",
    image: attentionFieldImg,
    link: "https://epple3k.github.io/fsu-research-atlas-2/",
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function ProjectRow({ project, idx }: { project: typeof projects[0]; idx: number }) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className="w-full border-t border-[#1e1e1e] relative"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(32px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
    >
      {/* Project label bar */}
      <div className="flex items-center gap-0 border-b border-[#1e1e1e]">
        <div className="w-14 md:w-16 py-6 flex items-center justify-center border-r border-[#1e1e1e] shrink-0">
          <span className="font-mono text-[0.74rem] tracking-[0.15em] text-[#949494]">{project.num}</span>
        </div>
        <div className="flex-1 px-5 py-6 flex items-center gap-6">
          <h2 className="font-display font-black text-2xl md:text-3xl tracking-[-0.01em] text-[#f0efeb] uppercase">
            {project.title}
          </h2>
          <span className="font-mono text-[0.74rem] tracking-[0.18em] text-[#a8a8a8] uppercase">{project.category}</span>
          <span className="font-mono text-[0.74rem] tracking-[0.1em] text-[#6b6b6b]">—</span>
          <span className="font-mono text-[0.74rem] tracking-[0.1em] text-[#949494]">{project.year}</span>
        </div>
      </div>

      {/* Hero image — full bleed, very tall */}
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full overflow-hidden cursor-pointer"
        style={{ height: "clamp(340px, 65vh, 820px)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={project.image}
          alt={project.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: hovered ? "scale(1.04)" : "scale(1.0)",
            transition: "transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease",
            filter: hovered ? "brightness(0.55)" : "brightness(0.35) saturate(0.2)",
          }}
        />

        {/* Description revealed on hover */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14">
          <div
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? "none" : "translateY(8px)", transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s" }}
          >
            <p className="font-body text-base text-[#c4c4c4] max-w-sm font-light leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>

        {/* Corner tag */}
        <div className="absolute top-5 right-5 font-mono text-[0.68rem] tracking-[0.15em] text-[#949494]">
          IMG_{project.num}
        </div>

        {/* Arrow on hover */}
        <div
          className="absolute top-5 left-5 font-mono text-[0.85rem] tracking-[0.1em] text-[#ff4500]"
          style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease" }}
        >
          VIEW ↗
        </div>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0efeb] font-body overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-40 border-b border-[#1e1e1e] bg-[#0a0a0a]/90 backdrop-blur-md flex items-stretch">
        {/* Identity */}
        <div className="flex items-center gap-4 px-5 py-4 border-r border-[#1e1e1e]">
          <span className="font-mono text-[0.9rem] tracking-[0.25em] text-[#f0efeb] uppercase">Emit Rice</span>
        </div>
        <div className="flex items-center gap-1 px-5 py-4 border-r border-[#1e1e1e]">
          <span className="font-mono text-[0.82rem] tracking-[0.1em] text-[#949494]">Design Engineer</span>
        </div>
        <div className="flex-1" />
        {[
          { label: "WORK", href: "#work" },
          { label: "ABOUT", href: "#about" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center px-5 py-4 border-l border-[#1e1e1e] font-mono text-[0.9rem] tracking-[0.2em] text-[#a8a8a8] hover:text-[#f0efeb] transition-colors duration-150"
          >
            {item.label}
          </a>
        ))}
        <a
          href="mailto:rice.emit3k@gmail.com"
          className="flex items-center px-5 py-4 border-l border-[#1e1e1e] font-mono text-[0.9rem] tracking-[0.2em] text-[#ff4500] hover:bg-[#ff4500] hover:text-[#0a0a0a] transition-colors duration-150"
        >
          {/* Click-hand demo #1 — nav CTA */}
          <ClickHandTrigger>CONTACT ↗</ClickHandTrigger>
        </a>
      </nav>

      <div className="pt-[57px] w-full">

        {/* ── Hero / Identity Plate ─────────────────────────────────────────── */}
        <header className="w-full border-b border-[#1e1e1e] relative overflow-hidden" style={{ minHeight: "62vh" }}>

          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(#1e1e1e 1px, transparent 1px), linear-gradient(90deg, #1e1e1e 1px, transparent 1px)",
              backgroundSize: "80px 80px",
              opacity: 0.4,
            }}
          />

          <div className="relative z-10 flex flex-col justify-between h-full" style={{ minHeight: "inherit" }}>
            {/* Top row */}
            <div className="flex items-start border-b border-[#1e1e1e]">
              <div className="flex-1 p-6 md:p-10 lg:p-16 pb-0">
                <div className="font-mono text-[0.68rem] tracking-[0.25em] text-[#949494] uppercase mb-6">
                  Portfolio — 2026
                </div>
                <h1 className="font-display font-black uppercase leading-[0.82] tracking-[-0.02em] text-[#f0efeb]"
                  style={{ fontSize: "clamp(5.5rem, 15vw, 15rem)" }}>
                  Emit<br />Rice
                </h1>
              </div>

              {/* Side column */}
              <div className="hidden lg:flex flex-col w-64 xl:w-80 border-l border-[#1e1e1e] self-stretch divide-y divide-[#1e1e1e]">
                <div className="p-6">
                  <div className="font-mono text-[0.85rem] tracking-[0.2em] text-[#a8a8a8] uppercase mb-3">Field</div>
                  <div className="font-mono text-[1.15rem] tracking-wide text-[#e0e0e0] leading-relaxed">
                    Design<br />Data Visualization<br />Interaction
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-mono text-[0.85rem] tracking-[0.2em] text-[#a8a8a8] uppercase mb-3">Location</div>
                  <div className="font-mono text-[1.15rem] text-[#e0e0e0]">Orlando, FL</div>
                </div>
                <div className="p-6 mt-auto">
                  <div className="font-mono text-[0.85rem] tracking-[0.2em] text-[#a8a8a8] uppercase mb-4">Directory</div>
                  {[
                    { label: "GITHUB", href: "https://github.com/Epple3k" },
                    { label: "LINKEDIN", href: "https://www.linkedin.com/in/emit-rice/" },
                    { label: "EMAIL", href: "mailto:rice.emit3k@gmail.com" },
                    { label: "RESUME", href: "https://drive.google.com/file/d/1T0kGhrBbBjQcRAYVWHMlaBru_YGmZLZA/view?usp=sharing" },
                  ].map(({ label, href }) => (
                    <a key={label} href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      className="flex items-center justify-between py-2 border-b border-[#1e1e1e] font-mono text-[1rem] tracking-widest text-[#c4c4c4] hover:text-[#ff4500] hover:border-[#ff4500] transition-colors group last:border-none">
                      <span>{label}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#ff4500]">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom metadata strip */}
            <div className="flex items-stretch divide-x divide-[#1e1e1e] border-t border-[#1e1e1e]">
              <div className="px-5 py-3">
                <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[#949494]">DESIGN ENGINEER</span>
              </div>
              <div className="px-5 py-3">
                <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[#949494]">CREATIVE TECHNOLOGY</span>
              </div>
              <div className="px-5 py-3">
                <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[#949494]">DATA VISUALIZATION</span>
              </div>
              <div className="px-5 py-3 flex-1" />
              <div className="px-5 py-3">
                <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[#6b6b6b]">REV.04</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Work section label ──────────────────────────────────────────── */}
        <div id="work" className="flex items-center border-b border-[#1e1e1e]">
          <div className="w-14 md:w-16 py-3 border-r border-[#1e1e1e] shrink-0" />
          <div className="px-5 py-3 flex-1" />
          <div className="px-5 py-3 border-l border-[#1e1e1e]">
            <span className="font-mono text-[0.68rem] tracking-[0.2em] text-[#6b6b6b]">{projects.length.toString().padStart(2, "0")} PROJECTS</span>
          </div>
        </div>

        {/* ── Projects ──────────────────────────────────────────────────── */}
        <main>
          {projects.map((project, idx) => (
            <ProjectRow key={project.num} project={project} idx={idx} />
          ))}
        </main>

        {/* ── About / Info ────────────────────────────────────────────────── */}
        <section id="about" className="w-full border-t border-[#1e1e1e]">
          {/* Section label */}
          <div className="flex items-center border-b border-[#1e1e1e]">
            <div className="w-14 md:w-16 py-3 border-r border-[#1e1e1e] shrink-0" />
            <div className="px-5 py-3 flex-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1e1e1e]">
            {/* Left — meta */}
            <div className="col-span-1 lg:col-span-3 divide-y divide-[#1e1e1e]">
              {[
                { k: "Entity", v: "Emit Rice" },
                { k: "Role", v: "Design Engineer" },
                { k: "Base", v: "Orlando, FL" },
                { k: "Focus", v: "Human-AI · Experimental UI" },
              ].map(({ k, v }) => (
                <div key={k} className="px-6 py-5">
                  <div className="font-mono text-[0.68rem] tracking-[0.2em] text-[#949494] uppercase mb-2">{k}</div>
                  <div className="font-mono text-[0.85rem] text-[#c4c4c4]">{v}</div>
                </div>
              ))}
            </div>

            {/* Right — statement */}
            <div className="col-span-1 lg:col-span-9 p-8 md:p-12 lg:p-16 flex flex-col justify-between gap-12">
              <div>
                <div className="font-mono text-[0.68rem] tracking-[0.2em] text-[#949494] uppercase mb-6">Statement</div>
                <p className="font-display text-3xl md:text-4xl lg:text-5xl text-[#f0efeb] leading-[1.15] font-semibold tracking-[-0.01em]"
                  style={{ maxWidth: "38ch" }}>
                  I build interfaces that treat information as a physical material.
                </p>
                <p className="font-body text-base text-[#c4c4c4] leading-relaxed mt-6 max-w-prose">
                  By combining data engineering with spatial interaction design, I aim to create digital tools that feel less like software and more like well-calibrated instruments.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-[#1e1e1e] pt-8 -mx-8 md:-mx-12 lg:-mx-16 px-8 md:px-12 lg:px-16">
                {[
                  { label: "EMAIL ↗", href: "mailto:rice.emit3k@gmail.com" },
                  { label: "GITHUB ↗", href: "https://github.com/Epple3k" },
                  { label: "LINKEDIN ↗", href: "https://www.linkedin.com/in/emit-rice/" },
                  { label: "RESUME ↗", href: "https://drive.google.com/file/d/1T0kGhrBbBjQcRAYVWHMlaBru_YGmZLZA/view?usp=sharing" },
                ].map(({ label, href }) => (
                  <a key={label} href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="font-mono text-[0.74rem] tracking-[0.15em] text-[#949494] hover:text-[#ff4500] transition-colors py-3 pl-5 border-r border-[#1e1e1e] last:border-none">
                    {/* Click-hand demo #2 — one link in this grid, to show it works outside the nav too */}
                    {label === "GITHUB ↗" ? <ClickHandTrigger>{label}</ClickHandTrigger> : label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#1e1e1e] flex items-center divide-x divide-[#1e1e1e]">
          <div className="px-5 py-4 flex-1">
            <span className="font-mono text-[0.62rem] tracking-[0.2em] text-[#666666]">© 2026 EMIT RICE — ALL RIGHTS RESERVED</span>
          </div>
          <div className="px-5 py-4">
            <span className="font-mono text-[0.62rem] tracking-[0.2em] text-[#666666]">BUILT WITH REACT + VITE</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
