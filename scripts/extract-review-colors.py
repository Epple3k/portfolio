#!/usr/bin/env python3
"""Cache a readable cover-derived spine accent during feed publication."""
import io, json, math, urllib.request
from collections import Counter
from pathlib import Path
from PIL import Image

PATH = Path("public/social-feed.json")

def accent(url):
    if not url.startswith("https://"):
        return None
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; EmitPortfolio/1.0)"})
    with urllib.request.urlopen(request, timeout=12) as response:
        data = response.read(2_500_000)
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img.thumbnail((96, 96))
    bins = Counter()
    for r, g, b in img.getdata():
        mx, mn = max(r, g, b), min(r, g, b)
        if mx - mn < 24 or mx < 35 or mn > 226:
            continue
        key = (round(r / 24) * 24, round(g / 24) * 24, round(b / 24) * 24)
        bins[key] += 1
    if not bins:
        return None
    # Prefer plentiful, moderately saturated cover colors over tiny accents.
    color = max(bins.items(), key=lambda item: item[1] * (1 + (max(item[0]) - min(item[0])) / 255))[0]
    color = tuple(max(0, min(255, v)) for v in color)
    light = tuple((v / 255 / 12.92) if v / 255 <= .04045 else ((v / 255 + .055) / 1.055) ** 2.4 for v in color)
    luminance = .2126 * light[0] + .7152 * light[1] + .0722 * light[2]
    return "#%02x%02x%02x" % color, "#000000" if luminance > .179 else "#ffffff"

def main():
    posts = json.loads(PATH.read_text())
    for post in posts:
        if not post.get("coverUrl"):
            continue
        if post.get("spineColor") and post.get("spineColorCoverUrl") == post["coverUrl"]:
            continue
        try:
            result = accent(post["coverUrl"])
            if result:
                post["spineColor"], post["spineTextColor"] = result
                post["spineColorCoverUrl"] = post["coverUrl"]
                print("Artwork palette:", post.get("mediaTitle"), post["spineColor"])
        except Exception as exc:
            print("Palette unavailable:", post.get("title"), str(exc)[:140])
    PATH.write_text(json.dumps(posts, indent=2, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    main()
