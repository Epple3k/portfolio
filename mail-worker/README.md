# Emit Rice mail worker

Cloudflare Worker for `emitrice.com` blog subscriptions and Resend broadcasts.

## What it does

- `POST /api/blog/subscribe` accepts public newsletter signups from `emitrice.com`.
- Contacts are stored in Resend's current global Contacts model and added to the `Emit Rice Blog Updates` Segment.
- The Segment is created automatically the first time it is needed.
- `POST /api/blog/publish` is private and sends a Resend Broadcast to that Segment.
- Broadcasts send from `Emit Rice <updates@contact.emitrice.com>` and contain Resend's managed unsubscribe link.
- `GET /health` is a lightweight deployment check.

The site never receives or exposes the Resend API key.

## Required Cloudflare secrets

Set these on the Worker after the first deploy:

```bash
cd mail-worker
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put BLOG_PUBLISH_TOKEN
```

- `RESEND_API_KEY`: a Resend API key with Contacts, Segments, and Broadcast access.
- `BLOG_PUBLISH_TOKEN`: a long random secret shared only with the private blog publisher.

Non-secret configuration lives in `wrangler.jsonc`.

## Deploy

The Worker is configured to claim `api.emitrice.com` as a Cloudflare Worker Custom Domain. Cloudflare creates the DNS record and certificate during deployment.

Manual:

```bash
cd mail-worker
npm install
npm run deploy
```

GitHub Actions can deploy it automatically after the repository has these Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The Resend key and blog publisher token stay in Cloudflare Worker secrets, not in the repository.

## Publisher configuration

The existing private blog publisher should use:

- `BLOG_MAILER_URL=https://api.emitrice.com`
- `BLOG_MAILER_TOKEN=<same value as BLOG_PUBLISH_TOKEN>`
- `BLOG_PUBLIC_URL=https://emitrice.com/#writing`

The publisher commits the post to GitHub first, then calls the Worker. A mail failure does not roll back the published post.

## Addresses

- Automated blog updates: `updates@contact.emitrice.com`
- Professional address reserved for direct correspondence: `hello@contact.emitrice.com`

The Worker deliberately does not turn `hello@` into a mailbox. Set up inbound routing/inbox handling separately before replacing the site's current contact address.
