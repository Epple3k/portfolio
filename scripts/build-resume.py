#!/usr/bin/env python3
"""Rebuild the public, printable resume PDF for emitrice.com.

Run: python scripts/build-resume.py
Requires: reportlab
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "Emit_Rice_Resume.pdf"
W, H = letter
LEFT, RIGHT = 45, W - 45
WIDTH = RIGHT - LEFT
DARK = HexColor("#17212a")
MID = HexColor("#44515b")
ACCENT = HexColor("#285f6f")
RULE = HexColor("#bac6c9")
c = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
c.setTitle("Emit Rice | Resume")
c.setAuthor("Emit Rice")
y = H - 37

def paragraph(txt, *, x=LEFT, width=WIDTH, size=9, lead=12.8, color=DARK, font="Helvetica", after=0):
    global y
    style = ParagraphStyle("resume", fontName=font, fontSize=size,
                           leading=lead, textColor=color, spaceAfter=0)
    p = Paragraph(txt, style)
    _, h = p.wrap(width, H)
    p.drawOn(c, x, y-h)
    y -= h + after

def section(name):
    global y
    y -= 17
    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 8.4)
    c.drawString(LEFT, y, name.upper())
    c.setStrokeColor(RULE)
    c.setLineWidth(0.65)
    c.line(LEFT, y-3, RIGHT, y-3)
    y -= 15

def role(title, org, date, location=None, after=5):
    global y
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, y, title)
    c.setFillColor(MID)
    c.setFont("Helvetica", 8.6)
    c.drawRightString(RIGHT, y, date)
    y -= 13
    c.setFillColor(MID)
    c.setFont("Helvetica-Oblique", 8.8)
    c.drawString(LEFT, y, org + (f" | {location}" if location else ""))
    y -= 11 + after

def bullet(txt):
    global y
    c.setFillColor(ACCENT)
    c.circle(LEFT+3.3, y-5.9, 1.5, stroke=0, fill=1)
    paragraph(txt, x=LEFT+12, width=WIDTH-12, after=4)

def project(name, category, description):
    txt = f'<font color="#17212a"><b>{name}</b></font> <font color="#56656c">| {category}</font>: {description}'
    paragraph(txt, size=9, lead=12.5, after=6.7)

# Identity
c.setFillColor(DARK)
c.setFont("Helvetica-Bold", 20)
c.drawString(LEFT, y, "EMIT RICE")
y -= 17
c.setFillColor(ACCENT)
c.setFont("Helvetica-Bold", 8.1)
c.drawString(LEFT, y, "PRODUCT DESIGN  /  HUMAN-AI INTERACTION  /  INFORMATION SYSTEMS")
y -= 15
paragraph('Tallahassee, FL  |  (407) 885-3967  |  <link href="mailto:rice.emit3k@gmail.com" color="#285f6f">rice.emit3k@gmail.com</link>  |  <link href="https://emitrice.com" color="#285f6f">emitrice.com</link>  |  <link href="https://www.linkedin.com/in/emit-rice/" color="#285f6f">LinkedIn</link>  |  <link href="https://github.com/Epple3k" color="#285f6f">GitHub</link>', size=8.05, lead=10.1)

section("Education")
role("Florida State University",
     "B.S. Management Information Systems; pursuing second major in Finance",
     "Expected May 2028", "Tallahassee, FL", after=0)
y -= 1
paragraph("<b>Santa Fe College</b>  |  A.A., Business Administration  |  Aug 2026",
          size=8.85, lead=12)

section("Experience")
role("Undergraduate Research Assistant",
     "Florida State University, School of Information | Dr. Qunfang Wu",
     "Sep 2026 - Present", "Tallahassee, FL")
bullet("Translate findings from <b>15 stakeholder interviews</b> and county planning documents into requirements for an AI-supported civic-participation tool.")
bullet("Prototype scenario-based interfaces and inspectable causal diagrams to help residents examine planning tradeoffs, uncertainty, and AI-generated information.")
y -= 7
role("Founder & Editor", "Paper Antenna | Independent publication", "Oct 2026 - Present")
bullet("Founded and run an editorial publication connecting technology, product strategy, marketing, and the business narratives shaping contemporary culture.")
bullet("Developed the publication identity and Substack presence; published original essay <i>Products Are Promises</i> on how software companies market visions of the future.")
y -= 7
role("Finance Assistant", "First Baptist Winter Park", "Aug 2025 - Present",
     "Winter Park, FL / Remote")
bullet("Reconcile staff expenses and purchasing across Shelby Next Financials, FNBO, ChurchTeams, and spreadsheets; prepare budget, donor, and audit-support reports.")
bullet("Designed a staff-facing event compensation form and am developing its structured data-collection and approval workflow.")

section("Selected Projects")
project("Research Atlas", "Data visualization / research discovery",
        "Built a searchable explorer for <b>8,000 FSU publications across 26 disciplines</b>, surfacing research connections and traceable evidence.")
project("A Little Mind", "Human-AI interaction / React",
        "Designed an expressive interactive interface that visualizes LLM temperature, token sampling, and repetition controls through simulated feedback.")
project("Ledgerline", "Fintech / ChatGPT plugin",
        "Built a finance analysis interface connecting SEC EDGAR/XBRL and FRED data with source-linked financial visuals and fundamentals.")
project("Accessible Computing Interface", "Accessibility / HCI",
        "Interviewed users with accessibility needs and prototyped a hands-free Arduino/Python input system achieving <b>95% accuracy</b>.")

section("Leadership")
paragraph("<b>Vice President of Finance, Collegiate DECA</b>  |  Managed a <b>$4,500</b> chapter budget and expense reporting.  <b>Eagle Scout</b>  |  Directed a <b>120-hour</b> project with 25 volunteers and $1,800 raised.",
          size=8.85, lead=12.8)
section("Skills")
paragraph("<b>Product & Design:</b> Figma, UX research, interviews, human-centered design, prototyping, data visualization, Adobe Photoshop/Illustrator<br/><b>Technical & Analytics:</b> React, TypeScript, Python, SQL, Git/GitHub, HTML/CSS, Excel, Google Sheets, Power BI, Tableau",
          size=8.85, lead=12.8)
if y < 25:
    raise RuntimeError(f"Resume did not fit one page (remaining baseline: {y:.1f})")
c.save()
print(f"Built {OUTPUT} (one page, remaining baseline: {y:.1f})")
