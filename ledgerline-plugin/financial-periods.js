// Normalize SEC companyfacts observations into comparable reporting periods.
const DAY = 86400000;
const INSTANT = new Set(["cash", "assets", "liabilities", "equity", "long_term_debt"]);
export const isInstantMetric = (metric) => INSTANT.has(metric);
const span = (start, end) => start && end
  ? Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1
  : NaN;
const valid = (f) => f && ["10-Q", "10-K", "20-F", "40-F"].includes(f.form)
  && typeof f.end === "string" && Number.isFinite(f.val)
  && typeof f.accn === "string";
const rank = (f) => (f.filed || "") + "|" +
  (f.frame ? "2" : "1") + "|" + (f.form === "10-Q" ? "2" : "1");
const better = (a, b) => !b || rank(a) > rank(b);
function bestByEnd(rows) {
  const result = new Map();
  for (const f of rows) if (better(f, result.get(f.end))) result.set(f.end, f);
  return result;
}
export function filingIndexUrl(cik, accession) {
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accession || "")) return null;
  return "https://www.sec.gov/Archives/edgar/data/" + Number(cik) +
    "/" + accession.replaceAll("-", "") + "/" + accession + "-index.htm";
}
export function selectReportedPeriods(allFacts, { instant = false, deriveQuarter4 = true } = {}) {
  const facts = (Array.isArray(allFacts) ? allFacts : []).filter(valid);
  if (instant) return [...bestByEnd(facts).values()]
    .sort((a, b) => a.end.localeCompare(b.end));

  // Duration facts may represent a quarter, YTD, or the entire fiscal year.
  // Accept only discrete 70–125-day periods as directly reported quarters.
  const discrete = facts.filter((f) => {
    const n = span(f.start, f.end);
    return n >= 70 && n <= 125;
  });
  const byEnd = bestByEnd(discrete);
  if (deriveQuarter4) {
    const annuals = bestByEnd(facts.filter((f) => {
      const n = span(f.start, f.end);
      return n >= 330 && n <= 380;
    }));
    const nineMonths = facts.filter((f) => {
      const n = span(f.start, f.end);
      return n >= 230 && n <= 315;
    });
    for (const annual of annuals.values()) {
      if (byEnd.has(annual.end)) continue;
      const ytd = nineMonths
        .filter((f) =>
          Math.abs(Date.parse(f.start) - Date.parse(annual.start)) <= 7 * DAY &&
          f.end < annual.end &&
          span(f.end, annual.end) >= 65 &&
          span(f.end, annual.end) <= 130)
        .sort((a, b) => (a.end === b.end ? rank(b).localeCompare(rank(a)) : b.end.localeCompare(a.end)))[0];
      if (!ytd) continue;
      byEnd.set(annual.end, {
        ...annual,
        start: ytd.end,
        val: annual.val - ytd.val,
        derived: true,
        derivation: {
          annualAccession: annual.accn,
          nineMonthAccession: ytd.accn,
        },
      });
    }
  }
  return [...byEnd.values()].sort((a, b) => a.end.localeCompare(b.end));
}
