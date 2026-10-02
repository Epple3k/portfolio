import { readFile, writeFile } from "node:fs/promises";

const USERNAME = "eppl";
const PROFILE_URL = `https://rateyourmusic.com/collection/${USERNAME}/reviews,ss.dd`;
const API_KEY = process.env.SCRAPINGBEE_API_KEY ?? "";
const MAX_REVIEWS = 3;
const MIN_WORDS = 70;

function clean(value = "") {
  return String(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wordCount(value = "") {
  return clean(value).split(/\s+/).filter(Boolean).length;
}

function isoDate(value = "") {
  const s = clean(value);
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function normalizeUrl(value = "") {
  const s = clean(value);
  if (!s) return PROFILE_URL;
  try {
    return new URL(s, "https://rateyourmusic.com").toString();
  } catch {
    return PROFILE_URL;
  }
}

function normalizeRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const whole = Math.floor(n);
  const half = n - whole >= 0.5;
  return "★".repeat(whole) + (half ? "½" : "");
}

async function fetchPage(page) {
  // Start with the primary reviews collection page. RYM's collection pagination
  // is brittle, so only move past page one after the first page is proven usable.
  const target = page === 1 ? `${PROFILE_URL}/` : `${PROFILE_URL}/?page=${page}`;

  const rules = {
    titles: {
      description: "Release title for each written review on the page, in page order.",
      type: "list",
    },
    artists: {
      description: "Artist name for each written review on the page, in the same order as titles.",
      type: "list",
    },
    ratings: {
      description: "The user's personal numeric rating from 0 to 5 for each written review, in the same order. Use an empty string when no rating is visible.",
      type: "list",
    },
    reviews: {
      description: "Full written review text for each review on the page, in the same order. Exclude entries that have a rating but no written review.",
      type: "list",
    },
    dates: {
      description: "Review date for each written review, in the same order. Use an empty string if no date is visible.",
      type: "list",
    },
    urls: {
      description: "Release or review URL for each written review, in the same order. Use an empty string if unavailable.",
      type: "list",
    },
  };

  const params = new URLSearchParams({
    api_key: API_KEY,
    url: target,
    mode: "auto",
    max_cost: "75",
    timeout: "140000",
    ai_extract_rules: JSON.stringify(rules),
  });

  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params.toString()}`, {
    headers: { Accept: "application/json,text/plain,*/*" },
  });

  const raw = (await res.text()).trim();
  console.log(
    `ScrapingBee page ${page}: HTTP ${res.status}, cost=${res.headers.get("spb-cost") ?? "?"}, auto=${res.headers.get("spb-auto-cost") ?? "?"}`,
  );

  if (!res.ok) {
    throw new Error(`ScrapingBee returned ${res.status}: ${raw.slice(0, 600)}`);
  }

  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `ScrapingBee returned non-JSON extraction output: ${raw.slice(0, 600)}`,
    );
  }

  const reviews = Array.isArray(parsed?.reviews) ? parsed.reviews : [];
  const titles = Array.isArray(parsed?.titles) ? parsed.titles : [];
  const artists = Array.isArray(parsed?.artists) ? parsed.artists : [];
  const ratings = Array.isArray(parsed?.ratings) ? parsed.ratings : [];
  const dates = Array.isArray(parsed?.dates) ? parsed.dates : [];
  const urls = Array.isArray(parsed?.urls) ? parsed.urls : [];

  return reviews.map((review, index) => ({
    review,
    title: titles[index] ?? "",
    artist: artists[index] ?? "",
    rating: ratings[index] ?? "",
    date: dates[index] ?? "",
    url: urls[index] ?? "",
  }));
}

async function readPrevious() {
  try {
    const parsed = JSON.parse(await readFile("public/rym-feed.json", "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  if (!API_KEY) {
    console.warn("SCRAPINGBEE_API_KEY is not configured; preserving existing RYM cache.");
    return;
  }

  const found = [];
  const seen = new Set();

  for (let page = 1; page <= 1 && found.length < MAX_REVIEWS; page += 1) {
    const rows = await fetchPage(page);
    if (!rows.length) break;

    for (const row of rows) {
      const body = clean(row?.review ?? row?.body ?? row?.text ?? "");
      if (wordCount(body) < MIN_WORDS) continue;

      const release = clean(row?.title ?? row?.release ?? "");
      const artist = clean(row?.artist ?? "");
      if (!release || !artist) continue;

      const url = normalizeUrl(row?.url);
      const dedupeKey = `${release.toLowerCase()}|${artist.toLowerCase()}|${body.slice(0, 80).toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const ratingText = normalizeRating(row?.rating);
      found.push({
        platform: "rateyourmusic",
        title: [release, `— ${artist}`, ratingText].filter(Boolean).join(" "),
        text: body,
        body,
        url,
        date: isoDate(row?.date),
        tabs: ["reviews"],
      });

      if (found.length >= MAX_REVIEWS) break;
    }
  }

  if (!found.length) {
    const previous = await readPrevious();
    if (previous.length) {
      console.warn("RYM scrape returned no qualifying reviews; preserving previous cache.");
      return;
    }
  }

  const next = found
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, MAX_REVIEWS);

  await writeFile("public/rym-feed.json", JSON.stringify(next, null, 2) + "\n");
  console.log(`Wrote ${next.length} Rate Your Music reviews to public/rym-feed.json`);
}

main().catch(async (err) => {
  console.error("RYM scrape failed:", err.message);
  const previous = await readPrevious();
  if (previous.length) {
    console.error("Keeping previous RYM cache.");
    process.exit(0);
  }
  process.exit(1);
});
