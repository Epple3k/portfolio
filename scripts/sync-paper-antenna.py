#!/usr/bin/env python3
"""Synchronize Paper Antenna's public Substack RSS into portfolio notes.json.

Only inserts new posts, never updates or removes manually written portfolio posts.
This file-based update intentionally does not send subscriber notifications.
"""
import argparse
import html
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urlparse, urlunparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

FEED = "https://paperantenna.substack.com/feed"
NOTES = Path(__file__).resolve().parents[1] / "public" / "notes.json"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"


class TextFromHTML(HTMLParser):
    blocks = {"p", "div", "br", "h1", "h2", "h3", "h4", "h5", "h6",
              "blockquote", "li", "ul", "ol", "hr", "tr", "section", "article"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chunks = []
        self.ignore = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript"}:
            self.ignore += 1
        if self.ignore:
            return
        if tag in self.blocks:
            self.chunks.append("\n" if tag == "br" or tag == "li" else "\n\n")
        if tag == "li":
            self.chunks.append("• ")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript"}:
            self.ignore = max(0, self.ignore - 1)
        elif not self.ignore and tag in self.blocks:
            self.chunks.append("\n\n")

    def handle_data(self, data):
        if not self.ignore:
            self.chunks.append(data)

    def text(self):
        value = html.unescape("".join(self.chunks)).replace("\xa0", " ")
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r" *\n *", "\n", value)
        return re.sub(r"\n{3,}", "\n\n", value).strip()


def strip_html(value):
    parser = TextFromHTML()
    parser.feed(value or "")
    return parser.text()


def canonical(value):
    parsed = urlparse((value or "").strip())
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(),
                       parsed.path.rstrip("/"), "", "", ""))


def items_from_rss(payload):
    root = ET.fromstring(payload)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("The feed is missing its RSS channel")
    items = []
    for entry in channel.findall("item"):
        title = (entry.findtext("title") or "").strip()
        link = canonical(entry.findtext("link") or "")
        parsed = urlparse(link)
        if (not title or parsed.hostname != "paperantenna.substack.com"
                or not parsed.path.startswith("/p/")):
            continue
        body = strip_html(entry.findtext(CONTENT) or entry.findtext("description"))
        if not body:
            continue
        desc = strip_html(entry.findtext("description"))
        summary = desc if 0 < len(desc) <= 260 else body
        if len(summary) > 260:
            summary = summary[:240].rsplit(" ", 1)[0] + "…"
        pub_date = entry.findtext("pubDate")
        if not pub_date:
            raise ValueError(f"RSS article missing publication date: {title}")
        date = parsedate_to_datetime(pub_date).astimezone(timezone.utc).date().isoformat()
        items.append({
            "title": title, "date": date, "summary": summary, "body": body,
            "url": link, "tags": ["paper antenna", "essay"], "tabs": ["professional"]
        })
    if not items:
        raise ValueError("No public Paper Antenna posts found; no changes made")
    return items


def rss2json_to_xml(response):
    """Convert a public RSS2JSON mirror to the same RSS shape as the source."""
    payload = json.loads(response)
    if payload.get("status") != "ok":
        raise ValueError(f"RSS2JSON failed: {payload.get('message', payload.get('status'))}")
    root = ET.Element("rss")
    channel = ET.SubElement(root, "channel")
    for article in payload.get("items", []):
        item = ET.SubElement(channel, "item")
        for name, value in (
            ("title", article.get("title", "")),
            ("link", article.get("link", "")),
            ("description", article.get("description", "")),
            (CONTENT, article.get("content", "") or article.get("description", "")),
        ):
            ET.SubElement(item, name).text = value
        pub = article.get("pubDate", "")
        if pub:
            parsed = datetime.fromisoformat(pub.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            ET.SubElement(item, "pubDate").text = parsed.strftime("%a, %d %b %Y %H:%M:%S %z")
    return ET.tostring(root, encoding="utf-8")


def main():
    args = argparse.ArgumentParser()
    args.add_argument("--feed-file", help="Use local RSS fixture instead of network")
    options = args.parse_args()
    if options.feed_file:
        feed_data = Path(options.feed_file).read_bytes()
    else:
        request = Request(FEED, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
            "Accept-Language": "en-US,en;q=0.9"
        })
        try:
            with urlopen(request, timeout=30) as response:
                feed_data = response.read(8_000_000)
        except Exception as direct_error:
            print(f"Substack direct RSS unavailable ({direct_error}); trying RSS2JSON mirror")
            mirror = "https://api.rss2json.com/v1/api.json?rss_url=" + quote(FEED, safe="")
            with urlopen(Request(mirror, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as response:
                feed_data = rss2json_to_xml(response.read(8_000_000))

    incoming = items_from_rss(feed_data)
    existing = json.loads(NOTES.read_text(encoding="utf-8"))
    if not isinstance(existing, list):
        raise ValueError("Portfolio notes.json was not a list")
    known = {canonical(note.get("url", "")) for note in existing
             if isinstance(note, dict) and note.get("url")}
    additions = []
    for item in incoming:
        if item["url"] not in known:
            additions.append(item)
            known.add(item["url"])

    if not additions:
        print("No new Paper Antenna posts")
        return
    merged = additions + existing
    merged.sort(key=lambda note: note.get("date", ""), reverse=True)
    NOTES.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
                     encoding="utf-8")
    print(f"Imported {len(additions)} new article(s): " +
          ", ".join(note["title"] for note in additions))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Paper Antenna sync failed: {exc}", file=sys.stderr)
        raise
