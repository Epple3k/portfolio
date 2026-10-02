# Ledgerline MCP

**Evidence-first financial intelligence for conversational interfaces.**

Ledgerline exposes a compact MCP tool surface over public-company primary sources. It is designed around one HCI principle: an AI answer about finance should remain inspectably attached to the evidence used to produce it.

## What works in v0.1

- SEC company/ticker resolution
- XBRL financial snapshots
- metric history with filing provenance
- recent 10-K / 10-Q / 8-K / other filing metadata
- filing text search with source URLs
- period comparison
- dilution radar using diluted shares, stock-based compensation, and filing-language signals
- recent Form 4 metadata
- cross-company metric comparison
- value → XBRL concept → accession → filing tracing
- FRED macro series through a small alias catalog or raw series IDs
- Streamable HTTP MCP endpoint plus stdio mode

## Run locally

```bash
npm install
LEDGERLINE_USER_AGENT="Ledgerline/0.1 you@example.com" npm run dev
```

The SEC asks automated clients to identify themselves. Set `LEDGERLINE_USER_AGENT` to a descriptive value with a real contact address before sustained use.

Health check:

```bash
curl http://127.0.0.1:3000/health
```

MCP endpoint:

```text
http://127.0.0.1:3000/mcp
```

For stdio clients:

```bash
MCP_TRANSPORT=stdio npm run dev
```

For a public deployment, bind to `0.0.0.0` and set `LEDGERLINE_ALLOWED_HOSTS` to the deployed hostname(s).

## Tool surface

| Tool | Purpose |
|---|---|
| `lookup_company` | ticker/name → SEC identity |
| `get_financials` | latest/prior primary-source metrics |
| `get_metric_history` | reported metric history |
| `get_filings` | recent filing metadata |
| `search_filings` | targeted filing-text retrieval |
| `compare_periods` | structured period delta |
| `get_dilution` | share/SBC + financing-language scan |
| `get_insider_filings` | recent Form 4 metadata |
| `compare_companies` | cross-company fundamentals |
| `trace_value` | number → fact → filing provenance |
| `list_macro_series` | useful built-in FRED aliases |
| `get_macro_series` | macro time series |

## Example questions once connected

- “Why did NVDA operating margin move over the last six reported periods? Trace the values.”
- “Show me every dilution signal you can find for PLTR.”
- “Compare SOFI and HOOD revenue, net income, cash, and diluted share growth.”
- “Search the latest 10-Qs for customer concentration.”
- “Put the company’s revenue history next to the 10-year Treasury rate.”
- “Where exactly did that operating-income number come from?”

## Design note

The companion portfolio interface under `public/ledgerline/` is deliberately not a terminal clone. It visualizes *reasoning lineage*: metric nodes, period changes, and evidence objects can be traversed from an explanation back to the primary source.

## Prototype caveats

This is a research/portfolio prototype, not investment advice. XBRL taxonomy choices differ between issuers, so production-grade normalization needs issuer-specific fallbacks and tests. Filing text extraction is intentionally lightweight in v0.1. Form 4 transaction-level XML parsing, richer filing-section extraction, market prices, estimates, and transcript licensing are logical next layers.
