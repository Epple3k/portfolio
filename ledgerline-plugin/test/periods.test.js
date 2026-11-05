import test from "node:test";
import assert from "node:assert/strict";
import { filingIndexUrl, selectReportedPeriods, isInstantMetric } from "../financial-periods.js";
const mk = (start, end, val, accn = "0000320193-24-000123", form = "10-Q") =>
  ({ start, end, val, accn, form, filed: "2024-11-02", fy: 2024 });
test("instant balances keep each reported point in time", () => {
  assert.equal(isInstantMetric("assets"), true);
  assert.equal(isInstantMetric("revenue"), false);
  const result = selectReportedPeriods([
    mk(undefined, "2024-03-31", 10),
    mk(undefined, "2024-06-30", 12),
  ], { instant: true });
  assert.deepEqual(result.map((x) => x.val), [10, 12]);
});
test("flows exclude annual and nine-month cumulative figures from quarter series", () => {
  const r = selectReportedPeriods([
    mk("2024-01-01", "2024-03-31", 10),
    mk("2024-01-01", "2024-09-30", 39),
    mk("2024-01-01", "2024-12-31", 60, "0000320193-25-000079", "10-K"),
  ], { deriveQuarter4: false });
  assert.deepEqual(r.map((x) => x.val), [10]);
});
test("quarter four derives from annual minus nine-month flow, not annual total", () => {
  const r = selectReportedPeriods([
    mk("2024-01-01", "2024-09-30", 39),
    mk("2024-01-01", "2024-12-31", 60, "0000320193-25-000079", "10-K"),
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].val, 21);
  assert.equal(r[0].derived, true);
  assert.equal(r[0].derivation.nineMonthAccession, "0000320193-24-000123");
});
test("do not derive weighted-average shares or diluted EPS", () => {
  const r = selectReportedPeriods([
    mk("2024-01-01", "2024-09-30", 39),
    mk("2024-01-01", "2024-12-31", 60, "0000320193-25-000079", "10-K"),
  ], { deriveQuarter4: false });
  assert.equal(r.length, 0);
});
test("filing citation opens its actual accession index", () => {
  assert.equal(filingIndexUrl("0000320193", "0000320193-24-000123"),
    "https://www.sec.gov/Archives/edgar/data/320193/000032019324000123/0000320193-24-000123-index.htm");
});
test("duplicate periods prefer a later restated filing", () => {
  const a = mk("2024-01-01", "2024-03-31", 10);
  const b = { ...a, val: 12, filed: "2024-12-01" };
  const r = selectReportedPeriods([a,b]);
  assert.deepEqual(r.map((x) => x.val), [12]);
});
