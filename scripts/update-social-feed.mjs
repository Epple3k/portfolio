import { readFile, writeFile } from "node:fs/promises";

const LETTERBOXD = "https://letterboxd.com/epple_3k/rss/";
const GOODREADS_READ = "https://www.goodreads.com/review/list_rss/204755541?shelf=read";
const GOODREADS_CURRENT = "https://www.goodreads.com/review/list_rss/204755541?shelf=currently-reading";

const headers = {
  "User-Agent": "EmitRicePortfolio/1.0 (+https://epple3k.github.io/portfolio/)",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

function decodeXml(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function field(item, name) {
  const escaped = name.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const match = item.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

function items(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
}

function isoDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function stars(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const whole = Math.floor(n);
  const half = n - whole >= 0.5;
  return "★".repeat(whole) + (half ? "½" : "");
}

async function fetchXml(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function letterboxd() {
  const xml = await fetchXml(LETTERBOXD);
  return items(xml).map((item) => {
    const film = field(item, "letterboxd:filmTitle") || field(item, "title");
    const year = field(item, "letterboxd:filmYear");
    const rating = field(item, "letterboxd:memberRating");
    const watched = field(item, "letterboxd:watchedDate");
    const link = field(item, "link");
    return {
      platform: "letterboxd",
      text: `watched ${film}${year ? ` (${year})` : ""}${rating ? ` · ${stars(rating)}` : ""}`,
      url: link,
      date: isoDate(watched || field(item, "pubDate")),
    };
  }).filter((p) => p.url && p.text);
}

async function goodreadsShelf(url, mode) {
  const xml = await fetchXml(url);
  return items(xml).map((item) => {
    const title = field(item, "book_title") || field(item, "title");
    const author = field(item, "author_name");
    const rating = field(item, "user_rating");
    const readAt = field(item, "user_read_at");
    const link = field(item, "link");
    const prefix = mode === "current" ? "currently reading" : "finished";
    return {
      platform: "goodreads",
      text: `${prefix} ${title}${author ? ` — ${author}` : ""}${rating && rating !== "0" ? ` · ${stars(rating)}` : ""}`,
      url: link,
      date: isoDate(readAt || field(item, "pubDate")),
    };
  }).filter((p) => p.url && p.text);
}

async function safe(label, fn) {
  try {
    const value = await fn();
    console.log(`${label}: ${value.length} items`);
    return value;
  } catch (err) {
    console.warn(`${label} failed:`, err.message);
    return [];
  }
}

async function main() {
  let manual = [];
  try {
    const raw = await readFile("public/manual-social.json", "utf8");
    const parsed = JSON.parse(raw);
    manual = Array.isArray(parsed) ? parsed : [];
  } catch {}

  const [films, read, current] = await Promise.all([
    safe("Letterboxd", letterboxd),
    safe("Goodreads read", () => goodreadsShelf(GOODREADS_READ, "read")),
    safe("Goodreads current", () => goodreadsShelf(GOODREADS_CURRENT, "current")),
  ]);

  const merged = [...manual, ...films, ...read, ...current]
    .filter((p) => p?.url && p?.text)
    .filter((p, i, all) => all.findIndex((q) => q.url === p.url && q.text === p.text) === i)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 40);

  await writeFile("public/social-feed.json", JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} items to public/social-feed.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
