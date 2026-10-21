(async function generateSeoPages() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const ts = (await import("typescript")).default;
  const root = process.cwd();
  const base = "https://emitrice.com";

  function readConst(fileName, symbol) {
    const file = path.join(root, fileName);
    const source = ts.createSourceFile(fileName, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let found;
    const visit = (node) => {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === symbol) found = node.initializer;
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (!found) throw new Error(`Could not locate ${symbol} in ${fileName}`);

    function decode(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
      if (ts.isNumericLiteral(node)) return Number(node.text);
      if (ts.isArrayLiteralExpression(node)) return node.elements.map(decode);
      if (ts.isObjectLiteralExpression(node)) {
        const obj = {};
        for (const property of node.properties) {
          if (!ts.isPropertyAssignment(property)) throw new Error(`Unexpected property in ${symbol}`);
          const key = property.name.text;
          obj[key] = decode(property.initializer);
        }
        return obj;
      }
      throw new Error(`Unsupported expression in ${symbol}: ${ts.SyntaxKind[node.kind]}`);
    }
    return decode(found);
  }

  const projects = readConst("src/App.tsx", "PROJECTS");
  const studies = readConst("src/CaseStudy.tsx", "CASE_STUDIES");
  const labels = {
    "attention-field": "Live Wikipedia Data Visualization",
    "research-atlas": "Interdisciplinary Research Discovery Interface",
    "aural-field": "Generative Ambient Audio Design",
    "ledgerline": "Financial Research and AI Interface",
    "little-mind": "Human-AI Interaction and Model Sampling",
  };
  const html = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const section = (index, title, contents, dark = false) => `<section class="section ${dark ? "wash" : ""}"><div class="section-label">${index} / ${html(title)}</div><div class="section-content">${contents}</div></section>`;
  const paragraph = (value) => `<p>${html(value)}</p>`;
  const projectHref = (p) => `${base}/projects/${p.slug}/`;
  const sitemap = [base + "/", ...projects.map(projectHref)];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`Unsafe project slug ${p.slug}`);
    const study = studies[p.id];
    if (!study) throw new Error(`No case study found for ${p.id}`);
    const name = p.title === "a little mind" ? "A Little Mind" : p.title.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    const label = labels[p.slug] || p.category;
    const url = projectHref(p);
    const title = `${name} | ${label} | Emit Rice`;
    const description = `${name}: ${p.description} Explore the design approach, key decisions, and working project by Emit Rice.`;
    const next = projects[(i + 1) % projects.length];
    const schema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: name,
      description: p.description,
      url,
      author: { "@type": "Person", name: "Emit Rice", url: base + "/" },
      about: [label, p.category],
      inLanguage: "en",
    }).replace(/</g, "\\u003c");

    const steps = study.steps.map((s, j) => `<article class="step"><div class="step-num">${String(j + 1).padStart(2, "0")}</div><div><h3>${html(s.title)}</h3>${paragraph(s.detail)}</div></article>`).join("\n");
    const decisions = study.decisions.map((d) => `<article class="decision"><h3>${html(d.title)}</h3>${paragraph(d.detail)}</article>`).join("\n");
    const related = projects.filter((other) => other.id !== p.id).map((other) => `<a href="/projects/${html(other.slug)}/">${html(other.title)} <span aria-hidden="true">↗</span></a>`).join("");
    const content = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#00ff00">
<title>${html(title)}</title>
<meta name="description" content="${html(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${html(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${html(title)}">
<meta property="og:description" content="${html(description)}">
<meta property="og:url" content="${html(url)}">
<meta property="og:image" content="${base}/og-preview.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${schema}</script>
<style>
:root{color-scheme:light;--green:#00ff00;--pale:#efffef;--ink:#101010}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--green);color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
a:focus-visible{outline:3px solid #080808;outline-offset:4px}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:22px clamp(18px,4vw,70px);border-bottom:2px solid var(--ink);font:12px/1.4 monospace;letter-spacing:.09em;text-transform:uppercase;gap:20px}
.topbar a{text-decoration:none}
.topbar a:hover{text-decoration:underline}
.hero{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid var(--ink);min-height:480px}
.hero-main{padding:clamp(28px,4vw,72px);border-right:2px solid var(--ink);display:flex;flex-direction:column;justify-content:space-between;gap:55px}
.eyebrow,.section-label,.mini{font:12px/1.5 monospace;letter-spacing:.1em;text-transform:uppercase}
h1{font-size:clamp(4.2rem,9.5vw,10rem);font-weight:500;letter-spacing:-.085em;line-height:.78;margin:0;overflow-wrap:anywhere;text-transform:lowercase}
.hero-right{padding:clamp(28px,4vw,72px);display:flex;flex-direction:column;justify-content:space-between;gap:42px;background:var(--pale)}
.deck{font-size:clamp(1.45rem,2.5vw,2.9rem);line-height:1.13;letter-spacing:-.045em;margin:0}
.links{display:flex;flex-wrap:wrap;gap:12px}
.button{border:2px solid var(--ink);padding:16px 20px;text-decoration:none;font:12px/1.3 monospace;text-transform:uppercase;letter-spacing:.04em}
.button.primary{background:var(--ink);color:var(--green)}
.button:hover{background:#276b27;color:#fff}
.section{display:grid;grid-template-columns:minmax(190px,30%) 1fr;border-bottom:2px solid var(--ink)}
.section-label{padding:clamp(24px,3vw,55px);border-right:2px solid var(--ink)}
.section-content{padding:clamp(24px,3vw,55px);max-width:1150px}
.section-content>p{font-size:clamp(1.2rem,2.1vw,1.95rem);line-height:1.37;letter-spacing:-.024em;margin:0 0 24px}
.section.wash{background:var(--pale)}
.question{font-size:clamp(2rem,4.4vw,4rem)!important;line-height:1.07!important;letter-spacing:-.055em!important}
.metadata{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;padding-top:25px;margin-top:35px;border-top:1px solid #0005}
.metadata dt{opacity:.63;font:11px/1.5 monospace;text-transform:uppercase;margin-bottom:8px}
.metadata dd{margin:0;font-size:16px;line-height:1.4}
.step{display:grid;grid-template-columns:75px 1fr;gap:24px;padding:27px 0;border-top:1px solid #0006}
.step:first-child{border-top:0;padding-top:0}
.step-num{font:13px monospace;opacity:.55}
h2,h3{font-weight:500;letter-spacing:-.045em}
.step h3,.decision h3{font-size:clamp(1.5rem,2.4vw,2.1rem);margin:0 0 10px}
.step p,.decision p,.small{font-size:17px;line-height:1.5;max-width:760px;margin:0}
.decision{display:grid;grid-template-columns:1fr 1.4fr;gap:25px;padding:26px 0;border-top:1px solid #0005}
.decision:first-child{border-top:0;padding-top:0}
.boundary{border-left:3px solid var(--ink);padding-left:18px;margin-top:28px;font-size:16px;line-height:1.5}
.related{display:flex;flex-wrap:wrap;gap:10px}
.related a{display:inline-block;border:1px solid currentColor;padding:12px;text-decoration:none;font:12px/1.3 monospace;text-transform:uppercase}
.related a:hover{background:#000;color:var(--green)}
.footer{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:28px clamp(18px,4vw,70px);font:13px monospace;background:#101010;color:var(--green)}
.footer a:hover{text-decoration:none}
@media(max-width:800px){.hero,.section{grid-template-columns:1fr}.hero-main,.section-label{border-right:0;border-bottom:2px solid var(--ink)}.hero{min-height:0}.hero-main{gap:30px}.metadata{grid-template-columns:1fr}.decision{grid-template-columns:1fr;gap:8px}.step{grid-template-columns:35px 1fr;gap:16px}.footer{flex-direction:column}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<nav class="topbar" aria-label="Main navigation"><a href="/">← emit rice / selected work</a><span>case study ${html(p.id)} / ${String(projects.length).padStart(2,"0")}</span></nav>
<main>
<header class="hero"><div class="hero-main"><div class="eyebrow">${html(p.category)} / ${html(p.year)}</div><h1>${html(p.title)}</h1><div class="mini">Product design · Interaction · Engineering</div></div><div class="hero-right"><p class="deck">${html(p.description)}</p><div class="links"><a class="button primary" href="${html(p.url)}" target="_blank" rel="noopener noreferrer">Open live project ↗</a><a class="button" href="${html(study.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source &amp; documentation ↗</a></div></div></header>
${section("01", "The question", `<p class="question">${html(study.question)}</p>`)}
${section("02", "Why it matters", `${paragraph(study.significance)}${paragraph(study.context)}<dl class="metadata"><div><dt>Role</dt><dd>${html(study.role)}</dd></div><div><dt>Discipline</dt><dd>${html(study.disciplines)}</dd></div><div><dt>Status</dt><dd>${html(study.stage)}</dd></div></dl>`,true)}
${section("03", "Approach / how it works", steps)}
${section("04", "Key decisions", decisions,true)}
${section("05", "Outcome / next questions", `${paragraph(study.outcome)}<div class="boundary"><div class="mini">What this does not claim</div>${paragraph(study.boundary)}</div>`)}
${section("06", "More selected work", `<nav class="related" aria-label="Other case studies">${related}</nav>`,true)}
</main>
<footer class="footer"><a href="/">← all projects / emitrice.com</a><a href="/Emit_Rice_Resume.pdf">résumé ↗</a><a href="https://www.linkedin.com/in/emit-rice/">linkedin ↗</a></footer>
</body></html>
`;
    const dir = path.join(root, "public", "projects", p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), content);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((url) => `  <url><loc>${html(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "public", "sitemap.xml"), xml);
  console.log(`Generated ${projects.length} static case study pages and sitemap.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
