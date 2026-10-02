import { createMcpHandler, McpServer } from "@modelcontextprotocol/server"
import { serveStdio } from "@modelcontextprotocol/server/stdio"
import { createMcpFastifyApp } from "@modelcontextprotocol/fastify"
import { toNodeHandler } from "@modelcontextprotocol/node"
import * as z from "zod/v4"
import {
  METRICS,
  companyLookup,
  compareCompanies,
  dilutionRadar,
  getFinancialSnapshot,
  getMetricHistory,
  getRecentFilings,
  insiderFilings,
  searchFilings,
  traceMetric,
  type MetricName,
} from "./sec.js"
import { getMacroSeries, macroCatalog } from "./fred.js"

const metricEnum = z.enum(Object.keys(METRICS) as [MetricName, ...MetricName[]])
const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value as Record<string, unknown>,
})

function buildServer() {
  const server = new McpServer(
    { name: "ledgerline", version: "0.1.0" },
    { instructions: "Use Ledgerline for public-company primary-source research. Prefer trace_value when a user asks where a reported number came from. Treat outputs as research data, not investment advice." },
  )

  server.registerTool("lookup_company", {
    title: "Look up a public company",
    description: "Resolve a ticker or company name to SEC company identity and CIK.",
    inputSchema: z.object({ query: z.string().min(1) }),
  }, async ({ query }) => json({ results: await companyLookup(query) }))

  server.registerTool("get_financials", {
    title: "Get financial snapshot",
    description: "Get primary-source SEC/XBRL financial metrics with latest/prior values and provenance metadata.",
    inputSchema: z.object({ company: z.string().min(1), metrics: z.array(metricEnum).max(12).optional() }),
  }, async ({ company, metrics }) => json(await getFinancialSnapshot(company, metrics)))

  server.registerTool("get_metric_history", {
    title: "Get metric history",
    description: "Return historical reported values for one financial metric, including XBRL concept, form, accession, unit, and period.",
    inputSchema: z.object({ company: z.string().min(1), metric: metricEnum, periods: z.number().int().min(1).max(24).default(8) }),
  }, async ({ company, metric, periods }) => json(await getMetricHistory(company, metric, periods)))

  server.registerTool("get_filings", {
    title: "List recent SEC filings",
    description: "List recent SEC filings for a public company, optionally filtered by form type.",
    inputSchema: z.object({ company: z.string().min(1), form: z.string().optional(), limit: z.number().int().min(1).max(50).default(20) }),
  }, async ({ company, form, limit }) => json(await getRecentFilings(company, form, limit)))

  server.registerTool("search_filings", {
    title: "Search filing text",
    description: "Search recent primary SEC filing text for a phrase or topic and return source-linked snippets.",
    inputSchema: z.object({
      company: z.string().min(1),
      query: z.string().min(2),
      forms: z.array(z.string()).max(8).default(["10-K", "10-Q", "8-K"]),
      filing_limit: z.number().int().min(1).max(10).default(5),
    }),
  }, async ({ company, query, forms, filing_limit }) => json(await searchFilings(company, query, forms, filing_limit)))

  server.registerTool("compare_periods", {
    title: "Compare reported periods",
    description: "Compare the last two reported values for selected financial metrics and return computed percentage changes with source facts.",
    inputSchema: z.object({ company: z.string().min(1), metrics: z.array(metricEnum).min(1).max(12) }),
  }, async ({ company, metrics }) => json(await getFinancialSnapshot(company, metrics)))

  server.registerTool("get_dilution", {
    title: "Run dilution radar",
    description: "Inspect diluted share history, stock-based compensation, and filing-text signals for convertibles, warrants, shelves, and ATM issuance.",
    inputSchema: z.object({ company: z.string().min(1) }),
  }, async ({ company }) => json(await dilutionRadar(company)))

  server.registerTool("get_insider_filings", {
    title: "Get insider filings",
    description: "Return recent SEC Form 4 filing metadata and source links for a company.",
    inputSchema: z.object({ company: z.string().min(1), limit: z.number().int().min(1).max(30).default(12) }),
  }, async ({ company, limit }) => json(await insiderFilings(company, limit)))

  server.registerTool("compare_companies", {
    title: "Compare companies",
    description: "Compare latest primary-source financial metrics across up to eight public companies.",
    inputSchema: z.object({ companies: z.array(z.string().min(1)).min(2).max(8), metrics: z.array(metricEnum).min(1).max(10) }),
  }, async ({ companies, metrics }) => json(await compareCompanies(companies, metrics)))

  server.registerTool("trace_value", {
    title: "Trace a reported value",
    description: "Trace the latest value of a metric back to its XBRL concept, reporting period, form, accession number, and SEC filing URL.",
    inputSchema: z.object({ company: z.string().min(1), metric: metricEnum }),
  }, async ({ company, metric }) => json(await traceMetric(company, metric)))

  server.registerTool("list_macro_series", {
    title: "List macro series",
    description: "List built-in aliases for useful FRED macroeconomic series.",
    inputSchema: z.object({}),
  }, async () => json({ series: macroCatalog() }))

  server.registerTool("get_macro_series", {
    title: "Get macro series",
    description: "Retrieve a FRED macroeconomic time series by Ledgerline alias or raw FRED series ID.",
    inputSchema: z.object({ series: z.string().min(1), observations: z.number().int().min(1).max(1000).default(120) }),
  }, async ({ series, observations }) => json(await getMacroSeries(series, observations)))

  return server
}

const transport = process.env.MCP_TRANSPORT ?? "http"

if (transport === "stdio") {
  void serveStdio(buildServer)
} else {
  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? "127.0.0.1"
  const allowedHosts = process.env.LEDGERLINE_ALLOWED_HOSTS?.split(",").map(x => x.trim()).filter(Boolean)

  const app = createMcpFastifyApp({ host, ...(allowedHosts?.length ? { allowedHosts } : {}) })
  const handler = createMcpHandler(buildServer)

  app.get("/health", async () => ({ ok: true, service: "ledgerline", version: "0.1.0" }))
  app.all("/mcp", toNodeHandler(handler))

  await app.listen({ port, host })
  console.error(`Ledgerline MCP listening on http://${host}:${port}/mcp`)
}