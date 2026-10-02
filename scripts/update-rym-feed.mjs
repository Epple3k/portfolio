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
  const target = page === 1 ? PROFILE_URL : `${PROFILE_URL}/${page}`;
  const params = new URLSearchParams({
    api_key: API_KEY,
    url: target,
    mode: "auto",
    max_cost: "75",
    ai_query:
      "Extract every written music review visible on this Rate Your Music collection page. Return JSON only as an array. For each review include: title (release title), artist, rating (numeric 0-5 if shown, otherwise null), review (full written review text), date (review date if shown, otherwise empty string), and url (the release or review URL if available). Do not include ratings without written review text.",
  });

  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params.toString()}`, {
    headers: { Accept: "application/json,text/plain,*/*" },
  });

  if (!res.ok) {
    throw new Error(`ScrapingBee returned ${res.status}: ${await res.text()}`);
  }

  const raw = (await res.text()).trim();
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/\[\s\S]*\]/);
    if (!fenced) throw new Error("ScrapingBee extraction did not return JSON");
    parsed = JSON.parse(fenced[0]);
  }

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.reviews)) return parsed.reviews;
  if (Array.isArray(parsed?.data)) return parsed.data;
  return [];
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

  for (let page = 1; page <= 6 && found.length < MAX_REVIEWS; page += 1) {
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
