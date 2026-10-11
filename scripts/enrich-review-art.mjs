// Cover artwork enrichment runs during the publishing job, never on a visitor's browser.
// No credentials required. Preserve manually chosen artwork and previously matched covers.
const KINDS = { letterboxd: "movie", rateyourmusic: "album", goodreads: "book" }
const safe = (value) => String(value || "").trim()
const normalized = (value) => safe(value).normalize("NFKD").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim()
const cleanTitle = (value) => safe(value).replace(/\s+[★½☆]+\s*$/, "").replace(/\s+\(\d{4}\)\s*$/, "").trim()
const yearFrom = (value) => safe(value).match(/\((\d{4})\)/)?.[1] || ""
const titleFrom = (post) => cleanTitle(safe(post.title).split(" — ")[0])
const creatorFrom = (post) => safe(post.title).split(" — ")[1]?.replace(/\s+[★½☆]+\s*$/, "").trim() || ""
const json = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(9000), headers: { "user-agent": "emitrice.com media-review-enricher/1.0", accept: "application/json" } })
  if (!response.ok) throw Error("HTTP " + response.status)
  return response.json()
}
const goodMatch = (candidate, target) => {
  const a = normalized(candidate), b = normalized(target)
  return !!a && !!b && (a === b || (a.length > 6 && b.length > 6 && (a.startsWith(b + " ") || b.startsWith(a + " "))))
}
function largerArtwork(value) {
  const url = safe(value)
  if (!/^https:\/\//i.test(url)) return ""
  // Apple supplies 100x100 thumbnails; substitute its documented CDN sizing convention.
  return url.replace(/\/\d+x\d+bb\./, "/600x600bb.").replace(/\/\d+x\d+-75\./, "/600x600-75.")
}
async function itunes(title, creator, kind, year) {
  const term = [title, creator].filter(Boolean).join(" ")
  const entity = kind === "movie" ? "movie" : kind === "album" ? "album" : "ebook"
  const data = await json("https://itunes.apple.com/search?" + new URLSearchParams({ term, media: kind === "movie" ? "movie" : kind === "album" ? "music" : "ebook", entity, limit: "20", country: "us" }))
  const candidates = (data.results || []).filter((r) => {
    const name = r.collectionName || r.trackName
    if (!goodMatch(name, title)) return false
    if (creator && !normalized(r.artistName).includes(normalized(creator)) && !normalized(creator).includes(normalized(r.artistName))) return false
    if (year && r.releaseDate && Math.abs(Number(r.releaseDate.slice(0, 4)) - Number(year)) > 2) return false
    return true
  })
  return largerArtwork(candidates[0]?.artworkUrl100 || candidates[0]?.artworkUrl60)
}
async function openLibrary(title, creator) {
  const query = new URLSearchParams({ title, author: creator, limit: "8", fields: "title,author_name,cover_i" })
  const data = await json("https://openlibrary.org/search.json?" + query)
  const match = (data.docs || []).find((x) => goodMatch(x.title, title) && (!creator || (x.author_name || []).some((a) => normalized(a).includes(normalized(creator)))))
  return match?.cover_i ? "https://covers.openlibrary.org/b/id/" + match.cover_i + "-L.jpg" : ""
}
async function wikipedia(title, kind) {
  // Wikipedia is a last resort for game box art, not an arbitrary web-image match.
  if (kind !== "game") return ""
  const search = await json("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", list: "search", srsearch: title + " video game", srlimit: "5", format: "json", origin: "*" }))
  const candidates = search.query?.search || []
  const match = candidates.find((x) => goodMatch(x.title.replace(/ \((?:video game|game)\)$/i, ""), title))
  if (!match) return ""
  const page = await json("https://en.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", prop: "pageimages", piprop: "thumbnail", pithumbsize: "700", pageids: String(match.pageid), format: "json", origin: "*" }))
  const image = page.query?.pages?.[match.pageid]?.thumbnail?.source || ""
  return /^https:\/\//i.test(image) ? image : ""
}
async function lookup(post) {
  const type = post.mediaType || KINDS[post.platform]
  const title = post.mediaTitle || titleFrom(post)
  const creator = post.creator || (type === "movie" ? "" : creatorFrom(post))
  const year = post.releaseYear || yearFrom(post.title)
  if (!title || !type) return { ...post }
  const next = { ...post, mediaType: type, mediaTitle: title, creator, releaseYear: year }
  if (post.coverUrl) return next
  try {
    let cover = ""
    if (type === "book") cover = await openLibrary(title, creator).catch(() => "") || await itunes(title, creator, "book", year).catch(() => "")
    else if (type === "movie" || type === "album") cover = await itunes(title, creator, type, year).catch(() => "")
    else if (type === "game") cover = await wikipedia(title, type).catch(() => "")
    if (cover) next.coverUrl = cover
    else console.warn("No confident artwork match:", type, title)
  } catch (error) { console.warn("Artwork lookup failed:", title, error.message) }
  return next
}
export async function enrichReviews(posts, previous = []) {
  const old = new Map(previous.filter((p) => p.url && p.coverUrl).map((p) => [p.url, p.coverUrl]))
  // Avoid excessive requests and preserve artwork even during intermittent API outages.
  const result = []
  for (const post of posts) {
    if (!post.tabs?.includes("reviews") && !KINDS[post.platform] && post.mediaType !== "game") { result.push(post); continue }
    const original = { ...post, coverUrl: post.coverUrl || old.get(post.url) || "" }
    result.push(await lookup(original))
  }
  return result
}
