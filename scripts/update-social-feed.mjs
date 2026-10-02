import { readFile, writeFile } from "node:fs/promises";

const LETTERBOXD = "https://letterboxd.com/epple_3k/rss/";
const GOODREADS_READ = "https://www.goodreads.com/review/list_rss/204755541?shelf=read";
const MUSICBOARD_USERNAME = "epple";
const MUSICBOARD_API = "https://api.musicboard.app/v2";

const MAX_BOOKS = 3;
const MAX_FILMS = 3;
const MAX_MUSIC = 3;
const MIN_FILM_REVIEW_WORDS = 70;
const MIN_BOOK_REVIEW_WORDS = 70;
const MIN_MUSIC_REVIEW_WORDS = 70;

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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
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

function stripLetterboxdBoilerplate(s = "") {
  return s
    .replace(/^This review may contain spoilers\.\s*/i, "")
    .trim();
}

function wordCount(s = "") {
  return s.trim().split(/\s+/).filter(Boolean).length;
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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      ...headers,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
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
      const description = stripLetterboxdBoilerplate(cleanText(field(item, "description")));

      let body = description;
      if (body === film || body === `${film}, ${year}`) body = "";

      const ratingText = rating ? stars(rating) : "";
      const title = [film, year ? `(${year})` : "", ratingText].filter(Boolean).join(" ");

      return {
        platform: "letterboxd",
        title,
        text: body,
        body,
        url: link,
        date: isoDate(watched || field(item, "pubDate")),
        tabs: ["reviews"],
      };
    })
    .filter((post) => post.url && post.title && wordCount(post.body) >= MIN_FILM_REVIEW_WORDS)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, MAX_FILMS);
}

async function goodreads() {
  const xml = await fetchXml(GOODREADS_READ);

  return items(xml)
    .map((item) => {
      const title = cleanText(field(item, "book_title")) || cleanText(field(item, "title"));
      const author = cleanText(field(item, "author_name"));
      const rating = cleanText(field(item, "user_rating"));
      const readAt = field(item, "user_read_at");
      const link = cleanText(field(item, "link"));
      const review = extractGoodreadsReview(item);
      const ratingText = rating && rating !== "0" ? stars(rating) : "";

      const displayTitle = [title, author ? `— ${author}` : "", ratingText]
        .filter(Boolean)
        .join(" ");

      return {
        platform: "goodreads",
        title: displayTitle,
        text: review,
        body: review,
        url: link,
        date: isoDate(readAt || field(item, "pubDate")),
        tabs: ["reviews"],
      };
    })
    .filter((post) => post.url && post.title && wordCount(post.body) >= MIN_BOOK_REVIEW_WORDS)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

async function musicboard() {
  const user = await fetchJson(
    `${MUSICBOARD_API}/users/from_username/?username=${encodeURIComponent(MUSICBOARD_USERNAME)}`,
  );
  if (!user?.uid) throw new Error("Musicboard user lookup returned no uid");

  const listing = await fetchJson(
    `${MUSICBOARD_API}/reviews/?content_type=&limit=24&offset=0&creator=${encodeURIComponent(user.uid)}&genres__id=&styles__id=&release_date__year=&release_date__lte=&release_date__gte=&record_type=&private=&speedup=true`,
  );

  const candidates = Array.isArray(listing?.results) ? listing.results : [];
  const reviews = [];

  for (const item of candidates) {
    const slug = item?.review_url_slug || item?.url_slug;
    if (!slug) continue;

    try {
      const review = await fetchJson(
        `${MUSICBOARD_API}/reviews/from_url_slug/?url_slug=${encodeURIComponent(slug)}`,
      );
      const content = review?.rating?.content;
      const type = content?.type;
      if (!content || type === "artist") continue;

      const body = cleanText(review?.description ?? "");
      if (wordCount(body) < MIN_MUSIC_REVIEW_WORDS) continue;

      const artist = cleanText(content?.artist?.name ?? "");
      const release = cleanText(content?.title ?? "");
      const rating = Number(review?.rating?.rating);
      const ratingText = Number.isFinite(rating) ? stars(rating) : "";
      const title = [release, artist ? `— ${artist}` : "", ratingText]
        .filter(Boolean)
        .join(" ");

      reviews.push({
        platform: "musicboard",
        title,
        text: body,
        body,
        url: `https://musicboard.app/${MUSICBOARD_USERNAME}/reviews`,
        date: isoDate(review?.created_at || review?.rating?.listened_at),
        tabs: ["reviews"],
      });

      if (reviews.length >= MAX_MUSIC) break;
    } catch (err) {
      console.warn("Musicboard review detail failed:", err.message);
    }
  }

  return reviews
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, MAX_MUSIC);
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
  let previousFeed = [];
  try {
    const raw = await readFile("public/manual-social.json", "utf8");
    const parsed = JSON.parse(raw);
    manual = Array.isArray(parsed)
      ? parsed.map((post) => ({
          ...post,
          tabs: Array.isArray(post?.tabs) && post.tabs.length ? post.tabs : ["socials"],
        }))
      : [];
  } catch {}
  try {
    const raw = await readFile("public/social-feed.json", "utf8");
    const parsed = JSON.parse(raw);
    previousFeed = Array.isArray(parsed) ? parsed : [];
  } catch {}

  const [films, qualifyingBooks, fetchedMusic] = await Promise.all([
    safe("Letterboxd substantial reviews", letterboxd),
    safe("Goodreads substantial reviews", goodreads),
    safe("Musicboard substantial reviews", musicboard),
  ]);

  // Keep today's three legacy book entries until qualifying 70+ word reviews replace them.
  const legacyBooks = previousFeed.filter((post) => post?.platform === "goodreads");
  const books = [...qualifyingBooks, ...legacyBooks]
    .filter(
      (post, index, all) =>
        all.findIndex((other) => other.url === post.url && other.title === post.title) === index,
    )
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, MAX_BOOKS);

  const previousMusic = previousFeed
    .filter((post) => post?.platform === "musicboard")
    .slice(0, MAX_MUSIC);
  const music = fetchedMusic.length > 0 ? fetchedMusic : previousMusic;

  // Publisher-created/manual posts are never subject to the media caps.
  const merged = [...manual, ...films, ...books, ...music]
    .filter((post) => post?.url && (post?.title || post?.text))
    .filter(
      (post, index, all) =>
        all.findIndex((other) => other.url === post.url && other.title === post.title) === index,
    )
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  await writeFile("public/social-feed.json", JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} portfolio entries to public/social-feed.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
