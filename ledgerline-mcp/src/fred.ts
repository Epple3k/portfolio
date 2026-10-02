const ALIASES: Record<string, { id: string; label: string }> = {
  fed_funds: { id: "FEDFUNDS", label: "Federal Funds Effective Rate" },
  inflation: { id: "CPIAUCSL", label: "Consumer Price Index" },
  unemployment: { id: "UNRATE", label: "Unemployment Rate" },
  ten_year: { id: "DGS10", label: "10-Year Treasury Rate" },
  two_year: { id: "DGS2", label: "2-Year Treasury Rate" },
  yield_curve: { id: "T10Y2Y", label: "10Y–2Y Treasury Spread" },
  high_yield_spread: { id: "BAMLH0A0HYM2", label: "US High Yield Option-Adjusted Spread" },
  mortgage_rate: { id: "MORTGAGE30US", label: "30-Year Fixed Mortgage Rate" },
  gdp: { id: "GDP", label: "Gross Domestic Product" },
  payrolls: { id: "PAYEMS", label: "Total Nonfarm Payrolls" },
  job_openings: { id: "JTSJOL", label: "Job Openings" },
  housing_starts: { id: "HOUST", label: "Housing Starts" },
}

function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const [date, value] = line.split(",")
    const n = Number(value)
    return { date, value: Number.isFinite(n) ? n : null }
  }).filter(row => row.value !== null)
}

export function macroCatalog() {
  return Object.entries(ALIASES).map(([alias, data]) => ({ alias, ...data }))
}

export async function getMacroSeries(series: string, observations = 120) {
  const key = series.trim().toLowerCase().replaceAll(" ", "_")
  const resolved = ALIASES[key] ?? { id: series.toUpperCase(), label: series.toUpperCase() }
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(resolved.id)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED request failed ${res.status}`)
  const data = parseCsv(await res.text()).slice(-Math.max(1, Math.min(observations, 1000)))
  return { ...resolved, source: "FRED", data }
}