# Ledgerline

**Finance-native analysis and interactive financial visualization inside ChatGPT.**

Ledgerline is not a standalone finance dashboard. It is a ChatGPT plugin built as a remote MCP server with an MCP Apps UI resource.

Its role in the finance ecosystem is to provide the missing analysis layer between financial data sources and the conversation:

- primary-source SEC EDGAR / XBRL research
- FRED macroeconomic data
- dilution analysis
- filing-text search
- value provenance
- reusable finance calculations
- interactive charts, tables, and source inspection rendered directly inside ChatGPT
- a generic renderer for structured financial data already present in a conversation from another connected service or user-provided source

Ledgerline does **not** directly call or depend on other plugins. The model can use Ledgerline's `render_financial_view` tool after data from another connected source is already available in the conversation.

## Tools

| Tool | Purpose | UI |
| --- | --- | --- |
| `lookup_company` | Resolve company/ticker to SEC identity | No |
| `company_financials` | Retrieve and chart SEC/XBRL metric history | Yes |
| `macro_chart` | Retrieve and chart FRED series | Yes |
| `dilution_view` | Analyze share count, SBC, and filing-language dilution signals | Yes |
| `search_filings` | Search recent 10-K, 10-Q, and 8-K text | No |
| `trace_value` | Trace a reported metric to source metadata | No |
| `render_financial_view` | Visualize structured finance data already in the conversation | Yes |
| `calculate_financial_metrics` | Period growth, index, margin, variance, CAGR | No |

## In-chat finance canvas

The same MCP Apps component is shared by the visual tools. It supports:

- line charts
- bar charts
- waterfall-style views
- multi-series comparisons
- index-to-100 toggle
- latest-value cards
- tabular inspection
- clickable data points
- source links and notes
- fullscreen mode when supported by the host

The UI follows the MCP Apps bridge rather than relying on a separate web product.

## Local test

From this directory:

```bash
npm install
LEDGERLINE_USER_AGENT="Ledgerline/0.1 your-email@example.com" npm start
```

Then open MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Connect using Streamable HTTP:

```
http://localhost:8787/mcp
```

## Deploy to Render

The repository includes `render.yaml`.

1. Merge this branch.
2. In Render, create a Blueprint from `https://github.com/Epple3k/portfolio`.
3. Set `LEDGERLINE_USER_AGENT` to a descriptive SEC-compatible user agent with your contact email.
4. Leave `OPENAI_APPS_CHALLENGE` blank until the OpenAI submission portal gives you a domain-verification token.
5. Deploy.
6. Verify:
   - `https://ledgerline-finance.onrender.com/`
   - `https://ledgerline-finance.onrender.com/mcp`

If Render assigns a different hostname, update `mcp.json` before packaging the marketplace ZIP.

## Connect to ChatGPT for development

After deployment:

1. ChatGPT → Settings → Security and login → Developer mode.
2. Open ChatGPT Plugins and select **+**.
3. Add the public HTTPS endpoint ending in `/mcp`.
4. Create the connection.
5. Start a new chat and select Ledgerline.

Useful test prompts:

- “Compare NVDA revenue and operating income over the last 8 reported periods.”
- “Show me the dilution picture for PLTR.”
- “Chart the 10-year Treasury rate and unemployment rate together.”
- “Search SOFI's recent filings for credit losses.”
- “Render this as a Ledgerline chart: Revenue Jan 10, Feb 12, Mar 15; Costs Jan 7, Feb 8, Mar 9.”

## Public directory / marketplace

The `plugin.json` file includes listing metadata and the required five positive / three negative review cases.

Before public submission you still need to:

1. confirm the deployed MCP hostname and update `mcp.json` if necessary;
2. merge the legal/support docs so the HTTPS GitHub URLs in `plugin.json` resolve;
3. complete OpenAI individual or business publisher verification;
4. record a reviewer-accessible walkthrough video and add its URL in the submission portal (or manifest);
5. upload a ZIP whose root is this `ledgerline-plugin/` folder;
6. connect the MCP endpoint in the plugin submission portal;
7. when the portal displays its domain-verification token, set that exact value as the Render environment variable `OPENAI_APPS_CHALLENGE`, redeploy, and verify that `/.well-known/openai-apps-challenge` returns only that token as plain text;
8. run the automated checks and submit for review;
9. after approval, select **Publish plugin**.

OpenAI review is required before Ledgerline can appear in the universal ChatGPT/Codex plugin directory. Approval cannot be bypassed or pre-approved from the repository.

## Data and safety

Ledgerline v0.1 is read-only. It does not place trades or modify financial accounts.

SEC issuers do not all use identical XBRL concepts, so the metric layer includes common concept fallbacks but should still be treated as a prototype rather than a production market-data terminal. Material conclusions should be checked against the linked primary source.


## Portfolio blog email subscriptions

The portfolio Blog includes an email signup form. Subscribers are stored in a Resend Audience/Segment and the existing private publisher sends a Broadcast automatically after a new `public/notes.json` post is committed.

Configure these environment variables on the Render service:

- `RESEND_API_KEY` — Resend API key with contact + broadcast access.
- `RESEND_AUDIENCE_ID` — the Resend Audience/Segment ID used for blog subscribers.
- `BLOG_FROM_EMAIL` — sender identity, for example `Emit Rice <blog@emitrice.com>`.
- `BLOG_PUBLIC_URL` — link used in notification emails. Defaults to `https://emitrice.com/?blog=1`.

Before using `blog@emitrice.com`, verify `emitrice.com` in Resend and add the DNS records Resend provides.

Flow:

1. Visitor enters an email in the Blog header.
2. `POST /api/blog/subscribe` adds the address to the Resend list.
3. Publishing through `/blog-admin` still commits the post to GitHub first.
4. After that commit succeeds, the server creates and sends a Resend Broadcast.
5. The email contains Resend's unsubscribe URL, so opt-outs are handled by Resend.

If notification delivery fails, the blog post remains published and the publisher response includes a `notification.error` value for debugging.
