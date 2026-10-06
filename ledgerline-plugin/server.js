import { createServer as createHttpServer } from "node:http";
import { readFileSync } from "node:fs";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";
const WIDGET_URI = "ui://ledgerline/finance-canvas.html";
const widgetHtml = readFileSync(new URL("./public/finance-canvas.html", import.meta.url), "utf8");
const siteHtml = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
const blogAdminHtml = readFileSync(new URL("./public/blog-admin.html", import.meta.url), "utf8");

const SEC_BASE = "https://data.sec.gov";
const SEC_WWW = "https://www.sec.gov";
const USER_AGENT =
  process.env.LEDGERLINE_USER_AGENT ??
  "Ledgerline/0.1 financial-research-plugin contact@example.com";

const BLOG_ADMIN_TOKEN = process.env.BLOG_ADMIN_TOKEN ?? "";
const GITHUB_CONTENT_TOKEN = process.env.GITHUB_CONTENT_TOKEN ?? "";
const CONTENT_REPO = "Epple3k/portfolio";
const CONTENT_BRANCH = "main";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";
const RESEND_SEGMENT_ID = process.env.RESEND_SEGMENT_ID ?? RESEND_AUDIENCE_ID;
const BLOG_FROM_EMAIL = process.env.BLOG_FROM_EMAIL ?? "Emit Rice <blog@emitrice.com>";
const BLOG_PUBLIC_URL = process.env.BLOG_PUBLIC_URL ?? "https://emitrice.com/?blog=1";

const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  return hit && hit.expires > Date.now() ? hit.value : undefined;
}
function cacheSet(key, value, ttl = 15 * 60_000) {
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}
async function getJson(url, ttl) {
  const hit = cacheGet(url);
  if (hit) return hit;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${url}`);
  return cacheSet(url, await res.json(), ttl);
}
async function getText(url, ttl) {
  const key = `text:${url}`;
  const hit = cacheGet(key);
  if (hit) return hit;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,text/plain,*/*",
      "Accept-Encoding": "gzip, deflate",
    },
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${url}`);
  return cacheSet(key, await res.text(), ttl);
}

const METRICS = {
  revenue: {
    label: "Revenue",
    concepts: [
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "Revenues",
      "SalesRevenueNet",
    ],
    units: ["USD"],
  },
  gross_profit: { label: "Gross profit", concepts: ["GrossProfit"], units: ["USD"] },
  operating_income: {
    label: "Operating income",
    concepts: ["OperatingIncomeLoss"],
    units: ["USD"],
  },
  net_income: { label: "Net income", concepts: ["NetIncomeLoss", "ProfitLoss"], units: ["USD"] },
  cash: {
    label: "Cash & equivalents",
    concepts: [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    ],
    units: ["USD"],
  },
  operating_cash_flow: {
    label: "Operating cash flow",
    concepts: ["NetCashProvidedByUsedInOperatingActivities"],
    units: ["USD"],
  },
  capex: {
    label: "Capital expenditures",
    concepts: ["PaymentsToAcquirePropertyPlantAndEquipment"],
    units: ["USD"],
  },
  stock_comp: {
    label: "Stock-based compensation",
    concepts: ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense"],
    units: ["USD"],
  },
  diluted_shares: {
    label: "Diluted shares",
    concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding"],
    units: ["shares"],
  },
  diluted_eps: {
    label: "Diluted EPS",
    concepts: ["EarningsPerShareDiluted"],
    units: ["USD/shares"],
  },
  assets: { label: "Assets", concepts: ["Assets"], units: ["USD"] },
  liabilities: { label: "Liabilities", concepts: ["Liabilities"], units: ["USD"] },
  equity: {
    label: "Stockholders' equity",
    concepts: ["StockholdersEquity"],
    units: ["USD"],
  },
  long_term_debt: {
    label: "Long-term debt",
    concepts: ["LongTermDebtNoncurrent", "LongTermDebt"],
    units: ["USD"],
  },
};

const FRED = {
  fed_funds: { id: "FEDFUNDS", label: "Federal funds rate", unit: "%" },
  inflation: { id: "CPIAUCSL", label: "Consumer price index", unit: "index" },
  unemployment: { id: "UNRATE", label: "Unemployment rate", unit: "%" },
  ten_year: { id: "DGS10", label: "10-year Treasury", unit: "%" },
  two_year: { id: "DGS2", label: "2-year Treasury", unit: "%" },
  yield_curve: { id: "T10Y2Y", label: "10Y–2Y Treasury spread", unit: "%" },
  high_yield_spread: { id: "BAMLH0A0HYM2", label: "High-yield spread", unit: "%" },
  mortgage_rate: { id: "MORTGAGE30US", label: "30-year mortgage rate", unit: "%" },
  payrolls: { id: "PAYEMS", label: "Nonfarm payrolls", unit: "thousands" },
  job_openings: { id: "JTSJOL", label: "Job openings", unit: "thousands" },
};

const metricEnum = z.enum(Object.keys(METRICS));
const pointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  note: z.string().optional(),
});
const seriesSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional(),
  points: z.array(pointSchema).min(1).max(200),
});
const sourceSchema = z.object({
  label: z.string(),
  url: z.string().url().optional(),
  detail: z.string().optional(),
});

async function lookupCompany(query) {
  const data = await getJson(
    `${SEC_WWW}/files/company_tickers.json`,
    24 * 60 * 60_000,
  );
  const q = query.trim().toLowerCase();
  return Object.values(data)
    .filter(
      (r) =>
        r.ticker.toLowerCase() === q ||
        r.ticker.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q),
    )
    .sort((a, b) =>
      a.ticker.toLowerCase() === q ? -1 : b.ticker.toLowerCase() === q ? 1 : 0,
    )
    .slice(0, 10)
    .map((r) => ({
      cik: String(r.cik_str).padStart(10, "0"),
      ticker: r.ticker,
      name: r.title,
    }));
}
async function company(query) {
  const rows = await lookupCompany(query);
  if (!rows.length) throw new Error(`No SEC company found for "${query}".`);
  return rows[0];
}
async function companyFacts(cik) {
  return getJson(`${SEC_BASE}/api/xbrl/companyfacts/CIK${cik}.json`);
}
function chooseUnit(units, preferred) {
  for (const u of preferred) if (units?.[u]) return [u, units[u]];
  const first = Object.entries(units ?? {})[0];
  return first ?? null;
}
function factScore(f) {
  let score = 0;
  if (f.frame) score += 5;
  if (/Q[1-4]$/.test(f.frame ?? "")) score += 8;
  if (f.form === "10-Q") score += 4;
  if (f.form === "10-K") score += 2;
  return score;
}
async function metricHistory(companyQuery, metric, periods = 8) {
  const c = await company(companyQuery);
  const facts = await companyFacts(c.cik);
  const def = METRICS[metric];
  let selected = null;
  for (const concept of def.concepts) {
    const node = facts.facts?.["us-gaap"]?.[concept];
    const picked = chooseUnit(node?.units, def.units);
    if (picked) {
      selected = { concept, unit: picked[0], facts: picked[1] };
      break;
    }
  }
  if (!selected) return { company: c, metric, label: def.label, points: [] };

  const byEnd = new Map();
  for (const f of selected.facts) {
    if (!["10-Q", "10-K", "20-F", "40-F"].includes(f.form)) continue;
    if (!Number.isFinite(f.val)) continue;
    const prev = byEnd.get(f.end);
    if (!prev || factScore(f) > factScore(prev) || f.filed > prev.filed) byEnd.set(f.end, f);
  }

  const points = [...byEnd.values()]
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(-Math.min(Math.max(periods, 1), 24))
    .map((f) => ({
      x: f.end,
      y: f.val,
      source: `${f.form} · ${f.accn}`,
      sourceUrl: `${SEC_WWW}/edgar/browse/?CIK=${c.cik}`,
      note: `${selected.concept} · ${selected.unit}`,
      meta: {
        concept: selected.concept,
        unit: selected.unit,
        accession: f.accn,
        form: f.form,
        filed: f.filed,
        fiscalYear: f.fy ?? null,
        fiscalPeriod: f.fp ?? null,
      },
    }));
  return { company: c, metric, label: def.label, unit: selected.unit, points };
}
async function recentFilings(companyQuery, form, limit = 10) {
  const c = await company(companyQuery);
  const data = await getJson(`${SEC_BASE}/submissions/CIK${c.cik}.json`);
  const r = data.filings?.recent ?? {};
  const out = [];
  for (let i = 0; i < (r.form?.length ?? 0); i++) {
    if (form && r.form[i] !== form) continue;
    const accession = r.accessionNumber[i];
    const noDash = accession.replaceAll("-", "");
    const cikNoZeros = String(Number(c.cik));
    out.push({
      form: r.form[i],
      filingDate: r.filingDate[i],
      reportDate: r.reportDate[i],
      accession,
      description: r.primaryDocDescription?.[i] ?? "",
      url: `${SEC_WWW}/Archives/edgar/data/${cikNoZeros}/${noDash}/${r.primaryDocument[i]}`,
    });
    if (out.length >= limit) break;
  }
  return { company: c, filings: out };
}
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
function snippets(text, query, max = 6) {
  const q = query.toLowerCase();
  const hay = text.toLowerCase();
  const needles = [q, ...q.split(/\s+/).filter((x) => x.length > 3)];
  const positions = [];
  for (const needle of needles) {
    let p = 0;
    while (positions.length < max * 3) {
      const i = hay.indexOf(needle, p);
      if (i < 0) break;
      positions.push(i);
      p = i + needle.length;
    }
  }
  return [...new Set(positions)]
    .sort((a, b) => a - b)
    .slice(0, max)
    .map((i) => text.slice(Math.max(0, i - 180), Math.min(text.length, i + 380)));
}
async function searchFilings(companyQuery, query, forms = ["10-K", "10-Q", "8-K"]) {
  const all = await recentFilings(companyQuery, undefined, 30);
  const targets = all.filings.filter((f) => forms.includes(f.form)).slice(0, 5);
  const results = [];
  for (const filing of targets) {
    const text = stripHtml(await getText(filing.url));
    const hits = snippets(text, query);
    if (hits.length) results.push({ ...filing, snippets: hits });
  }
  return { company: all.company, query, results };
}
async function fredSeries(series, observations = 120) {
  const key = series.trim().toLowerCase().replaceAll(" ", "_");
  const item = FRED[key] ?? { id: series.toUpperCase(), label: series.toUpperCase(), unit: "" };
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(item.id)}`;
  const csv = await getText(url);
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, value] = line.split(",");
      const y = Number(value);
      return Number.isFinite(y)
        ? {
            x: date,
            y,
            source: `FRED · ${item.id}`,
            sourceUrl: `https://fred.stlouisfed.org/series/${item.id}`,
          }
        : null;
    })
    .filter(Boolean)
    .slice(-Math.min(Math.max(observations, 1), 500));
  return { ...item, points: rows };
}

function formatCompact(n) {
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Number(n.toFixed(2)).toLocaleString();
}
function appReply(view, summary) {
  return {
    content: [{ type: "text", text: summary }],
    structuredContent: view,
  };
}
async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function jsonResponse(res, status, payload) {
  res
    .writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    })
    .end(JSON.stringify(payload));
}

function isAuthorized(req) {
  if (!BLOG_ADMIN_TOKEN) return false;
  const auth = req.headers.authorization ?? "";
  return auth === `Bearer ${BLOG_ADMIN_TOKEN}`;
}

async function githubApi(path, options = {}) {
  if (!GITHUB_CONTENT_TOKEN) {
    throw new Error("GITHUB_CONTENT_TOKEN is not configured");
  }
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_CONTENT_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "EmitRicePortfolioPublisher/1.0",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data?.message ?? `GitHub API error ${res.status}`);
  }
  return data;
}

async function readRepoJson(path) {
  const data = await githubApi(
    `/repos/${CONTENT_REPO}/contents/${path}?ref=${encodeURIComponent(CONTENT_BRANCH)}`,
  );
  const decoded = Buffer.from(data.content ?? "", "base64").toString("utf8");
  return {
    sha: data.sha,
    value: JSON.parse(decoded || "[]"),
  };
}

async function writeRepoJson(path, value, message, sha) {
  const content = Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8").toString("base64");
  return githubApi(`/repos/${CONTENT_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch: CONTENT_BRANCH,
    }),
  });
}

function cleanString(value, max = 20000) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function resendApi(path, options = {}) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const response = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data?.message ?? data?.error ?? `Resend API error ${response.status}`);
  }
  return data;
}

async function addBlogSubscriber(email) {
  if (!RESEND_AUDIENCE_ID) throw new Error("RESEND_AUDIENCE_ID is not configured");
  return resendApi(`/audiences/${encodeURIComponent(RESEND_AUDIENCE_ID)}/contacts`, {
    method: "POST",
    body: JSON.stringify({ email, unsubscribed: false }),
  });
}

async function notifyBlogSubscribers({ title, summary, date }) {
  if (!RESEND_SEGMENT_ID) throw new Error("RESEND_SEGMENT_ID is not configured");
  const safeTitle = escapeHtml(title);
  const safeSummary = escapeHtml(summary);
  const safeDate = escapeHtml(date);
  const safeUrl = escapeHtml(BLOG_PUBLIC_URL);
  const html = `
    <div style="background:#00ff00;color:#000;padding:32px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;">
        <div style="font-family:monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:28px;">emit rice / new post</div>
        <h1 style="font-size:38px;line-height:1.05;margin:0 0 18px;font-weight:600;">${safeTitle}</h1>
        <div style="font-family:monospace;font-size:12px;margin-bottom:22px;">${safeDate}</div>
        <p style="font-size:19px;line-height:1.5;margin:0 0 28px;">${safeSummary}</p>
        <a href="${safeUrl}" style="display:inline-block;background:#000;color:#00ff00;padding:13px 18px;text-decoration:none;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">read the post →</a>
        <p style="font-family:monospace;font-size:11px;line-height:1.5;margin-top:40px;opacity:.65;">You subscribed to new posts from emitrice.com. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#000;">Unsubscribe</a>.</p>
      </div>
    </div>`;

  return resendApi("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      segment_id: RESEND_SEGMENT_ID,
      from: BLOG_FROM_EMAIL,
      subject: `New post: ${title}`,
      html,
      send: true,
    }),
  });
}
const BLOG_TABS = ["reviews", "socials", "professional"];
function cleanTabs(value, fallback) {
  const tabs = Array.isArray(value)
    ? value.map((tab) => cleanString(tab, 30).toLowerCase()).filter((tab) => BLOG_TABS.includes(tab))
    : [];
  return [...new Set(tabs.length ? tabs : fallback)].slice(0, BLOG_TABS.length);
}

function createLedgerlineServer() {
  const server = new McpServer({
    name: "Ledgerline",
    version: "0.1.0",
    instructions:
      "Ledgerline is a finance-native analysis and visualization layer. Use its public SEC/FRED tools for primary-source market research. Use render_financial_view when structured financial data already exists in the conversation from another connector or user-provided source and an interactive chart, table, bridge, or provenance view would make the result clearer. Do not invent missing data. Preserve source labels and URLs when provided.",
  });

  registerAppResource(
    server,
    "Ledgerline Finance Canvas",
    WIDGET_URI,
    {},
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                resourceDomains: ["https://esm.sh"],
                connectDomains: [],
              },
            },
          },
        },
      ],
    }),
  );

  server.registerTool(
    "lookup_company",
    {
      title: "Look up public company",
      description: "Resolve a ticker or public-company name to SEC identity.",
      inputSchema: { query: z.string().min(1) },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ query }) => ({
      content: [{ type: "text", text: JSON.stringify(await lookupCompany(query), null, 2) }],
    }),
  );

  registerAppTool(
    server,
    "company_financials",
    {
      title: "Chart public-company financials",
      description:
        "Retrieve SEC/XBRL financial metrics for a public company and render them as an interactive in-chat financial view with source provenance.",
      inputSchema: {
        company: z.string().min(1),
        metrics: z.array(metricEnum).min(1).max(6),
        periods: z.number().int().min(2).max(24).default(8),
        chartType: z.enum(["line", "bar"]).default("line"),
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ company: q, metrics, periods, chartType }) => {
      const histories = await Promise.all(metrics.map((m) => metricHistory(q, m, periods)));
      const c = histories[0]?.company;
      const series = histories.map((h) => ({
        name: h.label,
        unit: h.unit,
        points: h.points.map((p) => ({
          x: p.x,
          y: p.y,
          source: p.source,
          sourceUrl: p.sourceUrl,
          note: p.note,
        })),
      }));
      const view = {
        kind: "financial-view",
        title: `${c?.ticker ?? q} financial history`,
        subtitle: c?.name ?? q,
        chartType,
        series,
        sources: [
          {
            label: "SEC EDGAR / XBRL",
            url: `${SEC_WWW}/edgar/browse/?CIK=${c?.cik ?? ""}`,
            detail: "Primary-source company facts and filing metadata.",
          },
        ],
      };
      return appReply(
        view,
        `Loaded ${metrics.length} SEC/XBRL metrics for ${c?.ticker ?? q}. The interactive Ledgerline view contains ${series.reduce((n, s) => n + s.points.length, 0)} sourced observations.`,
      );
    },
  );

  registerAppTool(
    server,
    "macro_chart",
    {
      title: "Chart macro data",
      description:
        "Retrieve one or more FRED macroeconomic series and render them inside ChatGPT.",
      inputSchema: {
        series: z.array(z.string().min(1)).min(1).max(4),
        observations: z.number().int().min(6).max(240).default(60),
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ series: requested, observations }) => {
      const data = await Promise.all(requested.map((s) => fredSeries(s, observations)));
      const view = {
        kind: "financial-view",
        title: data.length === 1 ? data[0].label : "Macro comparison",
        subtitle: "Federal Reserve Economic Data",
        chartType: "line",
        series: data.map((s) => ({ name: s.label, unit: s.unit, points: s.points })),
        sources: data.map((s) => ({
          label: `FRED · ${s.id}`,
          url: `https://fred.stlouisfed.org/series/${s.id}`,
          detail: s.label,
        })),
      };
      return appReply(view, `Loaded ${data.map((d) => d.label).join(", ")} from FRED.`);
    },
  );

  registerAppTool(
    server,
    "dilution_view",
    {
      title: "Analyze dilution",
      description:
        "Show diluted share-count history and stock-based compensation from SEC filings, plus recent filing-language signals for other dilution mechanisms.",
      inputSchema: { company: z.string().min(1), periods: z.number().int().min(4).max(16).default(8) },
      _meta: { ui: { resourceUri: WIDGET_URI } },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ company: q, periods }) => {
      const [shares, sbc, scan] = await Promise.all([
        metricHistory(q, "diluted_shares", periods),
        metricHistory(q, "stock_comp", periods),
        searchFilings(q, "convertible warrant at-the-market shelf registration stock compensation"),
      ]);
      const c = shares.company;
      const view = {
        kind: "financial-view",
        title: `${c.ticker} dilution radar`,
        subtitle: "Share count, SBC, and filing signals",
        chartType: "line",
        series: [
          { name: "Diluted shares", unit: shares.unit, points: shares.points },
          { name: "Stock-based compensation", unit: sbc.unit, points: sbc.points },
        ],
        sources: [
          {
            label: "SEC EDGAR",
            url: `${SEC_WWW}/edgar/browse/?CIK=${c.cik}`,
            detail: `${scan.results.length} recent filings contained matching dilution-language snippets.`,
          },
        ],
        notes: scan.results.slice(0, 4).map((r) => ({
          title: `${r.form} · ${r.filingDate}`,
          text: r.snippets[0]?.slice(0, 500) ?? "",
          url: r.url,
        })),
      };
      return appReply(
        view,
        `Loaded dilution indicators for ${c.ticker}: diluted shares, stock-based compensation, and ${scan.results.length} recent filing matches.`,
      );
    },
  );

  server.registerTool(
    "search_filings",
    {
      title: "Search SEC filings",
      description:
        "Search recent SEC 10-K, 10-Q, and 8-K filing text for a topic and return source-linked excerpts.",
      inputSchema: {
        company: z.string().min(1),
        query: z.string().min(2),
        forms: z.array(z.string()).max(6).default(["10-K", "10-Q", "8-K"]),
      },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ company: q, query, forms }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await searchFilings(q, query, forms), null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    "trace_value",
    {
      title: "Trace a financial value",
      description:
        "Trace the latest SEC/XBRL value of a supported metric to its reporting period, concept, form, accession number, and source URL.",
      inputSchema: { company: z.string().min(1), metric: metricEnum },
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
    },
    async ({ company: q, metric }) => {
      const h = await metricHistory(q, metric, 1);
      const p = h.points.at(-1);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                company: h.company,
                metric: h.label,
                value: p?.y ?? null,
                periodEnd: p?.x ?? null,
                source: p?.source ?? null,
                sourceUrl: p?.sourceUrl ?? null,
                note: p?.note ?? null,
                metadata: p?.meta ?? null,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "render_financial_view",
    {
      title: "Render financial analysis",
      description:
        "Render structured financial data already available in the conversation into an interactive in-chat chart/table/source view. Use this for data from other connected finance, accounting, banking, analytics, portfolio, or user-provided sources. Do not fabricate missing values.",
      inputSchema: {
        title: z.string().min(1).max(120),
        subtitle: z.string().max(180).optional(),
        chartType: z.enum(["line", "bar", "waterfall"]).default("line"),
        series: z.array(seriesSchema).min(1).max(8),
        sources: z.array(sourceSchema).max(20).optional(),
        notes: z
          .array(
            z.object({
              title: z.string(),
              text: z.string(),
              url: z.string().url().optional(),
            }),
          )
          .max(12)
          .optional(),
      },
      _meta: { ui: { resourceUri: WIDGET_URI } },
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    },
    async ({ title, subtitle, chartType, series, sources, notes }) => {
      const view = {
        kind: "financial-view",
        title,
        subtitle: subtitle ?? "",
        chartType,
        series,
        sources: sources ?? [],
        notes: notes ?? [],
      };
      return appReply(
        view,
        `Rendered ${series.length} financial series in Ledgerline. Sources preserved: ${sources?.length ?? 0}.`,
      );
    },
  );

  server.registerTool(
    "calculate_financial_metrics",
    {
      title: "Calculate financial metrics",
      description:
        "Calculate common finance transformations from user-supplied numeric series: period growth, indexed-to-100, margin, variance, or CAGR. This tool only computes from supplied values.",
      inputSchema: {
        operation: z.enum(["period_growth", "index_100", "margin", "variance", "cagr"]),
        values: z.array(z.number()).min(1).max(200),
        comparison: z.array(z.number()).max(200).optional(),
        years: z.number().positive().optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    },
    async ({ operation, values, comparison, years }) => {
      let result;
      if (operation === "period_growth") {
        result = values.map((v, i) => (i === 0 || values[i - 1] === 0 ? null : (v / values[i - 1] - 1) * 100));
      } else if (operation === "index_100") {
        const base = values[0];
        result = values.map((v) => (base === 0 ? null : (v / base) * 100));
      } else if (operation === "margin") {
        if (!comparison || comparison.length !== values.length) throw new Error("margin requires comparison with the same length");
        result = values.map((v, i) => (comparison[i] === 0 ? null : (v / comparison[i]) * 100));
      } else if (operation === "variance") {
        if (!comparison || comparison.length !== values.length) throw new Error("variance requires comparison with the same length");
        result = values.map((v, i) => v - comparison[i]);
      } else {
        if (!years || values.length < 2) throw new Error("cagr requires years and at least two values");
        result = (Math.pow(values.at(-1) / values[0], 1 / years) - 1) * 100;
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ operation, result }, null, 2) }],
      };
    },
  );

  return server;
}

const httpServer = createHttpServer(async (req, res) => {
  if (!req.url) return res.writeHead(400).end("Missing URL");
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(siteHtml);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ name: "Ledgerline", version: "0.1.0", status: "ok", mcp: MCP_PATH }));
    return;
  }

  if (req.method === "OPTIONS" && url.pathname === "/api/blog/subscribe") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/blog/subscribe") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const body = await readRequestJson(req);
      const email = cleanString(body.email, 320).toLowerCase();
      const honeypot = cleanString(body.company, 200);
      if (honeypot) {
        jsonResponse(res, 200, { ok: true });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        jsonResponse(res, 400, { error: "Enter a valid email address." });
        return;
      }
      await addBlogSubscriber(email);
      jsonResponse(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      const message = String(error?.message ?? "Subscription failed");
      const duplicate = /already exists|already.*contact|duplicate/i.test(message);
      if (duplicate) {
        jsonResponse(res, 200, { ok: true });
        return;
      }
      jsonResponse(res, 500, { error: "Could not subscribe right now." });
    }
    return;
  }
  if (req.method === "GET" && url.pathname === "/blog-admin") {
    res
      .writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      })
      .end(blogAdminHtml);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/blog/post") {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      const body = await readRequestJson(req);
      const title = cleanString(body.title, 180);
      const postBody = cleanString(body.body, 50000);
      if (!title || !postBody) {
        jsonResponse(res, 400, { error: "title and body are required" });
        return;
      }

      const date = cleanString(body.date, 10) || new Date().toISOString().slice(0, 10);
      const summary =
        cleanString(body.summary, 600) ||
        postBody.replace(/\s+/g, " ").slice(0, 240);
      const tags = Array.isArray(body.tags)
        ? body.tags.map((tag) => cleanString(tag, 40)).filter(Boolean).slice(0, 12)
        : [];
      const tabs = cleanTabs(body.tabs, ["professional"]);

      const file = await readRepoJson("public/notes.json");
      const posts = Array.isArray(file.value) ? file.value : [];
      const next = [
        { title, date, summary, body: postBody, tags, tabs },
        ...posts,
      ].slice(0, 200);

      const commit = await writeRepoJson(
        "public/notes.json",
        next,
        `Publish blog post: ${title.slice(0, 72)}`,
        file.sha,
      );

      let notification = { sent: false, error: null };
      try {
        await notifyBlogSubscribers({ title, summary, date });
        notification = { sent: true, error: null };
      } catch (notifyError) {
        console.error("Blog notification failed:", notifyError);
        notification = {
          sent: false,
          error: notifyError?.message ?? "Notification failed",
        };
      }

      jsonResponse(res, 200, {
        ok: true,
        commit: commit.commit?.sha ?? null,
        notification,
      });
    } catch (error) {
      console.error(error);
      jsonResponse(res, 500, { error: error.message ?? "Publish failed" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/blog/import") {
    if (!isAuthorized(req)) {
      jsonResponse(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      const body = await readRequestJson(req);
      const platform = cleanString(body.platform, 30).toLowerCase();
      const postBody = cleanString(body.body, 50000);
      const sourceUrl = cleanString(body.url, 2000);
      const title = cleanString(body.title, 180) || postBody.split(/\n/)[0].slice(0, 140);
      const date = cleanString(body.date, 10) || new Date().toISOString().slice(0, 10);
      const tabs = cleanTabs(body.tabs, ["socials"]);

      if (!["linkedin", "instagram", "manual"].includes(platform)) {
        jsonResponse(res, 400, { error: "unsupported platform" });
        return;
      }
      if (!postBody || !/^https?:\/\//i.test(sourceUrl)) {
        jsonResponse(res, 400, { error: "post text and a valid source URL are required" });
        return;
      }

      const file = await readRepoJson("public/manual-social.json");
      const posts = Array.isArray(file.value) ? file.value : [];
      const entry = {
        platform,
        title,
        text: postBody,
        body: postBody,
        url: sourceUrl,
        date,
        tabs,
      };
      const next = [
        entry,
        ...posts.filter((post) => post?.url !== sourceUrl),
      ].slice(0, 200);

      const commit = await writeRepoJson(
        "public/manual-social.json",
        next,
        `Import ${platform} post`,
        file.sha,
      );

      jsonResponse(res, 200, {
        ok: true,
        commit: commit.commit?.sha ?? null,
      });
    } catch (error) {
      console.error(error);
      jsonResponse(res, 500, { error: error.message ?? "Import failed" });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/.well-known/openai-apps-challenge") {
    const token = process.env.OPENAI_APPS_CHALLENGE;
    if (!token) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Challenge not configured");
      return;
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }).end(token);
    return;
  }

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (url.pathname === MCP_PATH && ["POST", "GET", "DELETE"].includes(req.method ?? "")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
    const server = createLedgerlineServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) res.writeHead(500).end("Internal server error");
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Ledgerline listening on http://0.0.0.0:${PORT}${MCP_PATH}`);
});
