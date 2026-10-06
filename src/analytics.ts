import posthog from "posthog-js"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

// PostHog is configured at build time through the GitHub Pages repository variable.

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-05-30",
      capture_pageview: true,
      capture_pageleave: true,
    })

    const params = new URLSearchParams(window.location.search)
    const campaignProperties = Object.fromEntries(
      [
        ["utm_source", params.get("utm_source")],
        ["utm_medium", params.get("utm_medium")],
        ["utm_campaign", params.get("utm_campaign")],
        ["utm_content", params.get("utm_content")],
        ["utm_term", params.get("utm_term")],
      ].filter(([, value]) => value),
    )

    if (Object.keys(campaignProperties).length > 0) {
      posthog.register(campaignProperties)
    }
  }

  initialized = true
}

export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  )

  window.gtag?.("event", eventName, cleanParams)

  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.capture(eventName, cleanParams)
  }
}
