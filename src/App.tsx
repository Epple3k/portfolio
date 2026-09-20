import React, { useState } from "react"
import { flushSync } from "react-dom"

import image2 from "./imports/image-2.png"
import image3 from "./imports/image-1.png"

const PROJECTS = [
  {
    id: "01",
    title: "attention field",
    category: "Web Application",
    year: "2026",
    image: image2,
    description:
      "An interactive visualization that explores how attention shifts, clusters, and responds across a dynamic field.",
  },
  {
    id: "02",
    title: "research atlas",
    category: "Prototyping",
    year: "2026",
    image: image3,
    description:
      "An interactive tool for mapping ideas, sources, and connections to make complex research easier to explore.",
  },
]

export default function App() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleProjectClick = (id: string) => {
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
      <main className="relative z-10 w-full h-screen flex flex-col md:flex-row p-4 md:p-8 md:gap-8">
        {/* Left Column */}
        <div className="w-full md:w-1/2 h-full flex flex-col justify-between max-w-xl pb-8 md:pb-0">
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
                i make interfaces that connect people to information
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
                className="hover:italic hover:translate-x-2 transition-all duration-300"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Right Column (Ribbon) */}
        <div
          className="w-full md:w-1/2 h-full flex flex-col gap-2 md:gap-3"
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
                {/* Project Image */}
                <img
                  src={p.image}
                  alt={p.title}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out origin-center ${
                    isHovered
                      ? "grayscale-0 opacity-100 scale-100"
                      : "grayscale opacity-30 scale-105"
                  }`}
                />

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
          <img
            src={activeProject.image}
            alt={activeProject.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply"
          />

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