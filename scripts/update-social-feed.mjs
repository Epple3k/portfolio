import { readFile, writeFile } from "node:fs/promises";

const LETTERBOXD = "https://letterboxd.com/epple_3k/rss/";
const GOODREADS_READ = "https://www.goodreads.com/review/list_rss/204755541?shelf=read";
const GOODREADS_CURRENT = "https://www.goodreads.com/review/list_rss/204755541?shelf=currently-reading";

const headers = {
  "User-Agent": "EmitRicePortfolio/1.0 (+https://epple3k.github.io/portfolio/)",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

function decodeEntities(s = "") {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function unwrapCdata(s = "") {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function cleanText(s = "") {
  const raw = unwrapCdata(s)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(raw)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function field(item, name) {
  const escaped = name.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const match = item.match(
    new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"),
  );
  return unwrapCdata(match?.[1]?.trim() ?? "");
}

function items(xml) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
}

function isoDate(value) {
  if (!value) return "";
  const d = new Date(cleanText(value));
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

function extractGoodreadsReview(item) {
  const explicit = cleanText(field(item, "user_review"));
  if (explicit) return explicit;

  const description = field(item, "description");
  if (!description) return "";

  const reviewMatch = description.match(
    /<strong>\s*review:\s*<\/strong>\s*([\s\S]*?)(?:<br\s*\/?\s*>\s*<strong>|$)/i,
  );
  return cleanText(reviewMatch?.[1] ?? "");
}

async function letterboxd() {
  const xml = await fetchXml(LETTERBOXD);

  return items(xml)
    .map((item) => {
      const film = cleanText(field(item, "letterboxd:filmTitle")) || cleanText(field(item, "title"));
      const year = cleanText(field(item, "letterboxd:filmYear"));
      const rating = cleanText(field(item, "letterboxd:memberRating"));
      const watched = field(item, "letterboxd:watchedDate");
      const link = cleanText(field(item, "link"));
      const description = cleanText(field(item, "description"));

      // Letterboxd's RSS description includes the review text when the diary entry
      // has a written review. Keep it verbatim except for HTML cleanup.
      let body = description;
      if (body === film || body === `${film}, ${year}`) body = "";

      const ratingText = rating ? stars(rating) : "";
      const title = [film, year ? `(${year})` : "", ratingText].filter(Boolean).join(" ");

      return {
        platform: "letterboxd",
        title,
        text: body || title,
        body: body || title,
        url: link,
        date: isoDate(watched || field(item, "pubDate")),
      };
    })
    .filter((post) => post.url && post.title);
}

async function goodreadsShelf(url, mode) {
  const xml = await fetchXml(url);

  return items(xml)
    .map((item) => {
      const title = cleanText(field(item, "book_title")) || cleanText(field(item, "title"));
      const author = cleanText(field(item, "author_name"));
      const rating = cleanText(field(item, "user_rating"));
      const readAt = field(item, "user_read_at");
      const link = cleanText(field(item, "link"));
      const review = extractGoodreadsReview(item);
      const ratingText = rating && rating !== "0" ? stars(rating) : "";
      const status = mode === "current" ? "currently reading" : "read";

      const displayTitle = [title, author ? `— ${author}` : "", ratingText]
        .filter(Boolean)
        .join(" ");

      return {
        platform: "goodreads",
        title: displayTitle,
        text: review || `${status}: ${displayTitle}`,
        body: review || `${status}: ${displayTitle}`,
        url: link,
        date: isoDate(readAt || field(item, "pubDate")),
      };
    })
    .filter((post) => post.url && post.title);
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
    .filter((post) => post?.url && (post?.title || post?.text))
    .filter(
      (post, index, all) =>
        all.findIndex((other) => other.url === post.url && other.title === post.title) === index,
    )
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 60);

  await writeFile("public/social-feed.json", JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} real social entries to public/social-feed.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
