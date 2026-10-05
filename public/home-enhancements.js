(() => {
  const wanted = ["research atlas", "ledgerline", "aural field"];
  const slugs = {
    "research atlas": "research-atlas",
    "ledgerline": "ledgerline",
    "aural field": "aural-field",
    "attention field": "attention-field"
  };

  function enhanceHome() {
    const tagline = [...document.querySelectorAll("p")].find(p =>
      p.textContent?.trim() === "i make interfaces that connect people to information"
    );
    if (tagline && !tagline.querySelector("[data-pro-context]")) {
      const detail = document.createElement("span");
      detail.dataset.proContext = "1";
      detail.textContent = "MIS + Finance @ FSU · HCI research · product / design engineering";
      detail.style.cssText = "display:block;margin-top:16px;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.12em;opacity:.55";
      tagline.appendChild(detail);
    }

    const blog = [...document.querySelectorAll("button")].find(b => b.textContent?.trim().toLowerCase() === "blog");
    const links = blog?.parentElement;
    if (links && !links.querySelector("[data-pro-link]")) {
      const makeLink = (label, href, color) => {
        const a = document.createElement("a");
        a.dataset.proLink = "1";
        a.textContent = label;
        a.href = href;
        a.className = "hover:italic hover:translate-x-2 transition-all duration-300";
        if (color) a.style.color = color;
        return a;
      };
      links.insertBefore(makeLink("about", "/about.html", "#0047ff"), blog);
      links.insertBefore(makeLink("all work", "/work.html"), blog);
    }

    const ribbon = [...document.querySelectorAll("h2")]
      .map(h => ({ title: h.textContent?.trim().toLowerCase(), card: h.closest(".cursor-pointer.group") }))
      .filter(x => x.card && x.title);
    if (ribbon.length >= 4) {
      const parent = ribbon[0].card.parentElement;
      const byTitle = Object.fromEntries(ribbon.map(x => [x.title, x.card]));
      ribbon.forEach(x => { if (!wanted.includes(x.title)) x.card.style.display = "none"; });
      wanted.forEach(name => byTitle[name] && parent.appendChild(byTitle[name]));
    }
  }

  function enhanceOverlay() {
    for (const overlay of document.querySelectorAll("div.fixed.inset-0")) {
      if (overlay.dataset.caseLinked) continue;
      const title = overlay.querySelector("h1")?.textContent?.trim().toLowerCase();
      if (!title || !slugs[title]) continue;
      const open = [...overlay.querySelectorAll("a")].find(a => a.textContent?.includes("Open Project"));
      if (!open) continue;
      overlay.dataset.caseLinked = "1";
      const caseLink = document.createElement("a");
      caseLink.href = "/work.html#" + slugs[title];
      caseLink.textContent = "Read Case Study →";
      caseLink.className = open.className;
      caseLink.style.marginLeft = "10px";
      open.insertAdjacentElement("afterend", caseLink);
    }
  }

  const run = () => { enhanceHome(); enhanceOverlay(); };
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", run);
  setTimeout(run, 250);
})();