# Portfolio professional-presentation cleanup

This branch is a recruiter-first cleanup pass. It intentionally leaves `main` untouched until the work is reviewed and merged.

## Done on this branch

- Reframed the homepage around one professional identity: product design, design engineering, and HCI for complex/data-heavy systems.
- Reduced the primary portfolio to three flagship projects: Research Atlas, Ledgerline, and Aural Field.
- Added role, stack, evidence, problem, build, and next-step context to each flagship.
- Moved smaller work into an Experiments section so breadth does not dilute the strongest work.
- Added a focused About section that connects MIS + Finance, HCI research, fintech, data visualization, and human-centered AI.
- Made professional writing the default while keeping reviews/media and social posts available.
- Preserved the existing blog feed and email subscription workflow.
- Added recruiter-useful analytics events for project opens, case-study expansion, writing, contact, and external links.
- Added a local self-traffic opt-out: visit `?internal=1` once to disable GA on that browser. Use `?external=1` to re-enable it.
- Replaced the fixed-height portfolio layout with normal scrolling and responsive sections.
- Added focus states and reduced-motion behavior.
- Updated page title, description, canonical URL, Open Graph metadata, Twitter metadata, and JSON-LD.
- Added favicon, manifest, robots.txt, sitemap.xml, and the custom-domain CNAME.

## Manual items before merge

1. **Professional email**
   - Keep Gmail until the new `emitrice.com` mailbox is actually receiving reliably.
   - Then replace every public `rice.emit3k@gmail.com` reference with the custom-domain address.

2. **Resume**
   - Put the current PDF at `public/resume.pdf` if you want a first-party `emitrice.com/resume.pdf` link instead of Google Drive.
   - Verify dates, titles, and project names match the portfolio exactly.

3. **Project media**
   - Add one strong 30-60 second screen recording or annotated image sequence to each flagship.
   - Research Atlas should show query → pattern → provenance.
   - Ledgerline should show a real financial question → tool/data → source-linked answer.
   - Aural Field should show interaction → sonic/visual response.

4. **Social preview image**
   - Add a polished 1200×630 PNG and wire it to `og:image` and `twitter:image`.

5. **Fact check**
   - Verify the Research Atlas counts before merge.
   - Verify every project-role statement describes work you personally owned.
   - Replace any evidence sentence that is still descriptive with a stronger measured result once testing data exists.

6. **Search**
   - Add Google Search Console verification.
   - Submit `https://emitrice.com/sitemap.xml`.

7. **Old URL**
   - Confirm the old GitHub Pages portfolio URL resolves or redirects cleanly to `emitrice.com`.
   - Update LinkedIn, resume, GitHub profile, application templates, and outreach templates to the custom domain.

## Definition of caught up

A recruiter should be able to answer these within 60 seconds:

- What does Emit do?
- What are his three strongest projects?
- What did he personally own?
- Is there evidence behind the work?
- Can I open a live artifact?
- How do I contact him or view his resume?

If any of those answers requires hunting, the portfolio is not finished yet.
