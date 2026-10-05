interface Env {
  RESEND_API_KEY?: string
  BLOG_PUBLISH_TOKEN?: string
  RESEND_SEGMENT_NAME?: string
  BLOG_FROM_EMAIL?: string
  BLOG_REPLY_TO?: string
  BLOG_PUBLIC_URL?: string
  ALLOWED_ORIGINS?: string
}

const RESEND_BASE = "https://api.resend.com"

class ResendError extends Error {
  status: number
  payload: unknown

  constructor(status: number, payload: unknown) {
    const message =
      typeof payload === "object" && payload !== null
        ? String(
            (payload as Record<string, unknown>).message ??
              (payload as Record<string, unknown>).error ??
              `Resend API error ${status}`,
          )
        : `Resend API error ${status}`
    super(message)
    this.status = status
    this.payload = payload
  }
}

function json(payload: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  })
}

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max)
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function allowedOrigins(env: Env) {
  return (
    env.ALLOWED_ORIGINS ??
    "https://emitrice.com,https://www.emitrice.com,http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin")
  const allowed = allowedOrigins(env)
  const matched = origin && allowed.includes(origin) ? origin : allowed[0] ?? ""
  return {
    "Access-Control-Allow-Origin": matched,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

function requestOriginAllowed(request: Request, env: Env) {
  const origin = request.headers.get("origin")
  return !origin || allowedOrigins(env).includes(origin)
}

async function resend(env: Env, path: string, init: RequestInit = {}) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured")
  }

  const response = await fetch(`${RESEND_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  const raw = await response.text()
  let payload: unknown = {}
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = { message: raw }
    }
  }

  if (!response.ok) {
    throw new ResendError(response.status, payload)
  }
  return payload as Record<string, unknown>
}

async function ensureBlogSegment(env: Env) {
  const name = env.RESEND_SEGMENT_NAME ?? "Emit Rice Blog Updates"
  const list = await resend(env, "/segments")
  const segments = Array.isArray(list.data) ? list.data : []
  const found = segments.find(
    (segment) =>
      typeof segment === "object" &&
      segment !== null &&
      String((segment as Record<string, unknown>).name ?? "") === name,
  ) as Record<string, unknown> | undefined

  if (found?.id) return String(found.id)

  try {
    const created = await resend(env, "/segments", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    if (!created.id) throw new Error("Resend did not return a segment id")
    return String(created.id)
  } catch (error) {
    // If two first requests race to create the segment, re-read once.
    if (error instanceof ResendError && error.status === 409) {
      const retry = await resend(env, "/segments")
      const rows = Array.isArray(retry.data) ? retry.data : []
      const match = rows.find(
        (segment) =>
          typeof segment === "object" &&
          segment !== null &&
          String((segment as Record<string, unknown>).name ?? "") === name,
      ) as Record<string, unknown> | undefined
      if (match?.id) return String(match.id)
    }
    throw error
  }
}

async function subscribe(env: Env, email: string) {
  const segmentId = await ensureBlogSegment(env)

  try {
    await resend(env, "/contacts", {
      method: "POST",
      body: JSON.stringify({
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      }),
    })
  } catch (error) {
    if (!(error instanceof ResendError) || error.status !== 409) throw error

    // Contacts are global in Resend. If this address already exists, simply
    // attach it to the blog segment instead of failing the signup.
    await resend(
      env,
      `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "POST" },
    )
  }
}

function renderBroadcastHtml(input: {
  title: string
  summary: string
  date: string
  url: string
}) {
  const title = escapeHtml(input.title)
  const summary = escapeHtml(input.summary)
  const date = escapeHtml(input.date)
  const url = escapeHtml(input.url)

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5ef;color:#101010;font-family:Arial,Helvetica,sans-serif;">
    <div style="padding:36px 18px;">
      <div style="max-width:660px;margin:0 auto;border:1px solid rgba(16,16,16,.2);background:#f4f5ef;">
        <div style="background:#c8ff00;padding:18px 22px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;">
          emit rice / new writing
        </div>
        <div style="padding:32px 22px 26px;">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.55;margin-bottom:18px;">${date}</div>
          <h1 style="font-size:38px;line-height:1.02;letter-spacing:-.04em;margin:0 0 18px;font-weight:600;">${title}</h1>
          <p style="font-size:18px;line-height:1.55;margin:0 0 28px;color:#2c2c2c;">${summary}</p>
          <a href="${url}" style="display:inline-block;background:#101010;color:#c8ff00;padding:13px 17px;text-decoration:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Read on emitrice.com →</a>
          <p style="margin:38px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:1.6;opacity:.58;">
            You signed up for new professional posts from Emit Rice.
            <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#101010;">Unsubscribe</a>.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`
}

async function publish(env: Env, input: {
  title: string
  summary: string
  date: string
  url: string
}) {
  const segmentId = await ensureBlogSegment(env)
  const html = renderBroadcastHtml(input)
  const text = [
    "New writing from Emit Rice",
    "",
    input.title,
    input.date,
    "",
    input.summary,
    "",
    input.url,
    "",
    "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}",
  ].join("\n")

  const body: Record<string, unknown> = {
    segment_id: segmentId,
    from: env.BLOG_FROM_EMAIL ?? "Emit Rice <updates@contact.emitrice.com>",
    subject: `New writing: ${input.title}`,
    html,
    text,
    send: true,
  }

  if (env.BLOG_REPLY_TO) body.reply_to = env.BLOG_REPLY_TO

  return resend(env, "/broadcasts", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request, env)

    if (request.method === "OPTIONS") {
      if (!requestOriginAllowed(request, env)) return json({ error: "Origin not allowed" }, 403)
      return new Response(null, { status: 204, headers: cors })
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "emit-rice-mail",
        segment: env.RESEND_SEGMENT_NAME ?? "Emit Rice Blog Updates",
      })
    }

    if (request.method === "POST" && url.pathname === "/api/blog/subscribe") {
      if (!requestOriginAllowed(request, env)) {
        return json({ error: "Origin not allowed" }, 403, cors)
      }

      try {
        const body = (await request.json()) as Record<string, unknown>
        const honeypot = clean(body.company, 200)
        if (honeypot) return json({ ok: true }, 200, cors)

        const email = clean(body.email, 320).toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return json({ error: "Enter a valid email address." }, 400, cors)
        }

        await subscribe(env, email)
        return json({ ok: true }, 200, cors)
      } catch (error) {
        console.error("subscribe failed", error)
        return json({ error: "Could not subscribe right now." }, 500, cors)
      }
    }

    if (request.method === "POST" && url.pathname === "/api/blog/publish") {
      const auth = request.headers.get("authorization")
      if (!env.BLOG_PUBLISH_TOKEN || auth !== `Bearer ${env.BLOG_PUBLISH_TOKEN}`) {
        return json({ error: "Unauthorized" }, 401)
      }

      try {
        const body = (await request.json()) as Record<string, unknown>
        const title = clean(body.title, 180)
        const summary = clean(body.summary, 800)
        const date = clean(body.date, 30)
        const candidateUrl = clean(body.url, 2000)
        const fallbackUrl = env.BLOG_PUBLIC_URL ?? "https://emitrice.com/#writing"
        const publicUrl = /^https?:\/\//i.test(candidateUrl) ? candidateUrl : fallbackUrl

        if (!title || !summary) {
          return json({ error: "title and summary are required" }, 400)
        }

        const broadcast = await publish(env, {
          title,
          summary,
          date: date || new Date().toISOString().slice(0, 10),
          url: publicUrl,
        })

        return json({ ok: true, broadcast })
      } catch (error) {
        console.error("publish failed", error)
        return json(
          {
            error:
              error instanceof Error ? error.message : "Could not send blog update.",
          },
          500,
        )
      }
    }

    return json({ error: "Not found" }, 404)
  },
}
