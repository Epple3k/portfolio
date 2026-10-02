const SEC_BASE = "https://data.sec.gov"
const SEC_WWW = "https://www.sec.gov"
const USER_AGENT = process.env.LEDGERLINE_USER_AGENT ?? "Ledgerline/0.1 research-prototype contact@example.com"

const cache = new Map<string, { expires: number; value: unknown }>()

async function cachedJson<T>(url: string, ttlMs = 15 * 60_000): Promise<T> {
  const hit = cache.get(url)
  if (hit && hit.expires > Date.now()) return hit.value as T
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "application/json", "Accept-Encoding": "gzip, deflate" } })
  if (!res.ok) throw new Error(`SEC request failed ${res.status}: ${url}`)
  const value = await res.json() as T
  cache.set(url, { expires: Date.now() + ttlMs, value })
  return value
}

async function cachedText(url: string, ttlMs = 15 * 60_000): Promise<string> {
  const key = `text:${url}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value as string
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml,text/plain,*/*", "Accept-Encoding": "gzip, deflate" } })
  if (!res.ok) throw new Error(`SEC filing request failed ${res.status}: ${url}`)
  const value = await res.text()
  cache.set(key, { expires: Date.now() + ttlMs, value })
  return value
}

export type Company = { cik: string; ticker: string; title: string }
type TickerRecord = { cik_str: number; ticker: string; title: string }
type FilingRow = { accessionNumber: string; filingDate: string; reportDate: string; form: string; primaryDocument: string; primaryDocDescription?: string }
type FactUnit = { start?: string; end: string; val: number; accn: string; fy?: number; fp?: string; form: string; filed: string; frame?: string }
export type MetricPoint = FactUnit & { metric: string; concept: string; unit: string }

export const METRICS = {
  revenue: { label: "Revenue", concepts: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"], preferredUnits: ["USD"] },
  gross_profit: { label: "Gross profit", concepts: ["GrossProfit"], preferredUnits: ["USD"] },
  operating_income: { label: "Operating income", concepts: ["OperatingIncomeLoss"], preferredUnits: ["USD"] },
  net_income: { label: "Net income", concepts: ["NetIncomeLoss", "ProfitLoss"], preferredUnits: ["USD"] },
  cash: { label: "Cash and equivalents", concepts: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"], preferredUnits: ["USD"] },
  assets: { label: "Assets", concepts: ["Assets"], preferredUnits: ["USD"] },
  liabilities: { label: "Liabilities", concepts: ["Liabilities"], preferredUnits: ["USD"] },
  equity: { label: "Stockholders' equity", concepts: ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"], preferredUnits: ["USD"] },
  operating_cash_flow: { label: "Operating cash flow", concepts: ["NetCashProvidedByUsedInOperatingActivities"], preferredUnits: ["USD"] },
  capex: { label: "Capital expenditures", concepts: ["PaymentsToAcquirePropertyPlantAndEquipment"], preferredUnits: ["USD"] },
  stock_comp: { label: "Stock-based compensation", concepts: ["ShareBasedCompensation", "AllocatedShareBasedCompensationExpense"], preferredUnits: ["USD"] },
  diluted_shares: { label: "Diluted weighted-average shares", concepts: ["WeightedAverageNumberOfDilutedSharesOutstanding"], preferredUnits: ["shares"] },
  basic_shares: { label: "Basic weighted-average shares", concepts: ["WeightedAverageNumberOfSharesOutstandingBasic"], preferredUnits: ["shares"] },
  diluted_eps: { label: "Diluted EPS", concepts: ["EarningsPerShareDiluted"], preferredUnits: ["USD/shares"] },
  debt_current: { label: "Current debt", concepts: ["LongTermDebtCurrent", "ShortTermBorrowings"], preferredUnits: ["USD"] },
  debt_long_term: { label: "Long-term debt", concepts: ["LongTermDebtNoncurrent", "LongTermDebt"], preferredUnits: ["USD"] },
} as const

export type MetricName = keyof typeof METRICS

export async function companyLookup(query: string): Promise<Company[]> {
  const json = await cachedJson<Record<string, TickerRecord>>(`${SEC_WWW}/files/company_tickers.json`, 24 * 60 * 60_000)
  const q = query.trim().toLowerCase()
  return Object.values(json)
    .filter(row => row.ticker.toLowerCase() === q || row.title.toLowerCase().includes(q) || row.ticker.toLowerCase().includes(q))
    .sort((a, b) => (a.ticker.toLowerCase() === q ? -1 : b.ticker.toLowerCase() === q ? 1 : 0))
    .slice(0, 10)
    .map(row => ({ cik: String(row.cik_str).padStart(10, "0"), ticker: row.ticker, title: row.title }))
}

export async function resolveCompany(query: string): Promise<Company> {
  const matches = await companyLookup(query)
  if (!matches.length) throw new Error(`No SEC company match for: ${query}`)
  return matches[0]
}

async function getCompanyFacts(cik: string): Promise<any> {
  return cachedJson(`${SEC_BASE}/api/xbrl/companyfacts/CIK${cik}.json`)
}

export async function getRecentFilings(companyQuery: string, form?: string, limit = 20): Promise<{ company: Company; filings: FilingRow[] }> {
  const company = await resolveCompany(companyQuery)
  const data: any = await cachedJson(`${SEC_BASE}/submissions/CIK${company.cik}.json`)
  const recent = data.filings?.recent ?? {}
  const length = recent.accessionNumber?.length ?? 0
  const rows: FilingRow[] = []
  for (let i = 0; i < length; i++) {
    const row: FilingRow = {
      accessionNumber: recent.accessionNumber[i],
      filingDate: recent.filingDate[i],
      reportDate: recent.reportDate[i],
      form: recent.form[i],
      primaryDocument: recent.primaryDocument[i],
      primaryDocDescription: recent.primaryDocDescription?.[i],
    }
    if (!form || row.form.toUpperCase() === form.toUpperCase()) rows.push(row)
    if (rows.length >= limit) break
  }
  return { company, filings: rows }
}

function chooseUnit(units: Record<string, FactUnit[]>, preferred: readonly string[]): [string, FactUnit[]] | null {
  for (const unit of preferred) if (units[unit]) return [unit, units[unit]]
  const first = Object.entries(units)[0]
  return first ?? null
}

function frameRank(frame?: string) {
  if (!frame) return 0
  if (/Q[1-4]$/.test(frame)) return 4
  if (/CY\d{4}$/.test(frame)) return 3
  if (/Q[1-4]I$/.test(frame)) return 2
  return 1
}

export async function getMetricHistory(companyQuery: string, metric: MetricName, periods = 8): Promise<{ company: Company; metric: string; points: MetricPoint[] }> {
  const company = await resolveCompany(companyQuery)
  const facts = await getCompanyFacts(company.cik)
  const def = METRICS[metric]
  let chosen: { concept: string; unit: string; facts: FactUnit[] } | null = null

  for (const concept of def.concepts) {
    const node = facts.facts?.["us-gaap"]?.[concept]
    if (!node?.units) continue
    const unit = chooseUnit(node.units, def.preferredUnits)
    if (unit) { chosen = { concept, unit: unit[0], facts: unit[1] }; break }
  }
  if (!chosen) return { company, metric, points: [] }

  const filtered = chosen.facts
    .filter(f => ["10-Q", "10-K", "20-F", "40-F"].includes(f.form) && Number.isFinite(f.val))
    .sort((a, b) => a.end.localeCompare(b.end) || frameRank(a.frame) - frameRank(b.frame))

  const byEnd = new Map<string, FactUnit>()
  for (const fact of filtered) {
    const existing = byEnd.get(fact.end)
    if (!existing || frameRank(fact.frame) >= frameRank(existing.frame) || fact.filed > existing.filed) byEnd.set(fact.end, fact)
  }

  const points = [...byEnd.values()]
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(-Math.max(1, Math.min(periods, 24)))
    .map(f => ({ ...f, metric, concept: chosen!.concept, unit: chosen!.unit }))
  return { company, metric, points }
}

export async function getFinancialSnapshot(companyQuery: string, metrics: MetricName[] = ["revenue", "gross_profit", "operating_income", "net_income", "cash", "operating_cash_flow", "stock_comp", "diluted_shares"]) {
  const company = await resolveCompany(companyQuery)
  const rows = await Promise.all(metrics.map(async metric => {
    const history = await getMetricHistory(companyQuery, metric, 2)
    const latest = history.points.at(-1) ?? null
    const prior = history.points.at(-2) ?? null
    return { metric, label: METRICS[metric].label, latest, prior, changePct: latest && prior && prior.val !== 0 ? (latest.val - prior.val) / Math.abs(prior.val) : null }
  }))
  return { company, metrics: rows }
}

function filingUrl(company: Company, filing: FilingRow) {
  const cikNoZeros = String(Number(company.cik))
  const accn = filing.accessionNumber.replaceAll("-", "")
  return `${SEC_WWW}/Archives/edgar/data/${cikNoZeros}/${accn}/${filing.primaryDocument}`
}

function stripHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim()
}

function snippetsFor(text: string, query: string, max = 8) {
  const haystack = text.toLowerCase()
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const needles = [query.toLowerCase(), ...terms]
  const positions: number[] = []
  for (const needle of needles) {
    let start = 0
    while (positions.length < max * 3) {
      const i = haystack.indexOf(needle, start)
      if (i < 0) break
      positions.push(i)
      start = i + needle.length
    }
  }
  return [...new Set(positions)].sort((a, b) => a - b).slice(0, max).map(i => text.slice(Math.max(0, i - 240), Math.min(text.length, i + 420)).trim())
}

export async function searchFilings(companyQuery: string, query: string, forms: string[] = ["10-K", "10-Q", "8-K"], filingLimit = 5) {
  const company = await resolveCompany(companyQuery)
  const { filings } = await getRecentFilings(companyQuery, undefined, 40)
  const candidates = filings.filter(f => forms.includes(f.form)).slice(0, filingLimit)
  const results = []
  for (const filing of candidates) {
    const url = filingUrl(company, filing)
    const text = stripHtml(await cachedText(url))
    const snippets = snippetsFor(text, query)
    if (snippets.length) results.push({ ...filing, url, snippets })
  }
  return { company, query, results }
}

export async function traceMetric(companyQuery: string, metric: MetricName) {
  const { company, points } = await getMetricHistory(companyQuery, metric, 12)
  const latest = points.at(-1)
  if (!latest) return { company, metric, trace: null }
  const { filings } = await getRecentFilings(companyQuery, latest.form, 40)
  const filing = filings.find(f => f.accessionNumber === latest.accn)
  return {
    company, metric,
    trace: {
      value: latest.val, unit: latest.unit, concept: latest.concept, periodEnd: latest.end,
      frame: latest.frame ?? null, fiscalYear: latest.fy ?? null, fiscalPeriod: latest.fp ?? null,
      form: latest.form, filed: latest.filed, accessionNumber: latest.accn,
      filingUrl: filing ? filingUrl(company, filing) : `${SEC_WWW}/edgar/browse/?CIK=${company.cik}`,
    },
  }
}

export async function dilutionRadar(companyQuery: string) {
  const [shares, sbc, scan] = await Promise.all([
    getMetricHistory(companyQuery, "diluted_shares", 12),
    getMetricHistory(companyQuery, "stock_comp", 12),
    searchFilings(companyQuery, "convertible warrant at-the-market shelf registration stock compensation", ["10-K", "10-Q", "8-K"], 4),
  ])
  const shareLatest = shares.points.at(-1), sharePrior = shares.points.at(-2), sbcLatest = sbc.points.at(-1)
  return {
    company: shares.company,
    dilutedShares: shares.points,
    stockCompensation: sbc.points,
    latestShareGrowth: shareLatest && sharePrior && sharePrior.val ? (shareLatest.val - sharePrior.val) / Math.abs(sharePrior.val) : null,
    latestStockComp: sbcLatest ?? null,
    filingSignals: scan.results,
  }
}

export async function compareCompanies(companyQueries: string[], metrics: MetricName[]) {
  return { metrics, companies: await Promise.all(companyQueries.slice(0, 8).map(q => getFinancialSnapshot(q, metrics))) }
}

export async function insiderFilings(companyQuery: string, limit = 12) {
  const { company, filings } = await getRecentFilings(companyQuery, "4", limit)
  return {
    company,
    filings: filings.map(f => ({ ...f, url: filingUrl(company, f) })),
    note: "Form 4 metadata is exposed in v0.1; transaction-level XML parsing is the next implementation step.",
  }
}