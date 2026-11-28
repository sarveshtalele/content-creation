# Design Studio

A local web app with one workspace per media. The decision matrix ranks the options for your content, and you choose.

```
python3 skills/content-creation/scripts/studio.py studio          # background; prints the link
python3 skills/content-creation/scripts/studio.py studio --status # the link again
python3 skills/content-creation/scripts/studio.py studio --stop
```

The link works only on this computer. The app listens on 127.0.0.1, checks a random token on every request, refuses other Host headers and serves only its own files.

## Gallery (home)

Every design in every media (GIF templates, carousel covers, infographics, 21 charts, architecture styles, Reel covers, the Reel, walkthrough videos, thumbnails) in one filterable grid: media tabs with counts, a category filter, search, and **Best fit first** once you paste your source (the decision matrix marks the top three). Cards with motion play the real GIF, Reel or walkthrough clip on hover or keyboard focus.

Open a card for its side panel: a large preview, the **ID** to give your agent (with a copy button), what it is for and why it fits your content, and what you can do with it:

| Design | Panel action |
|---|---|
| GIF templates, the Reel | prepare a ready request for your agent with this design |
| Carousel covers, infographics, charts, architecture | edit the fields and render it here, or "Use in a carousel" |
| Reel covers | write the hook and render every supported layout |
| Thumbnails and blog covers | write 3-6 words and render all five sizes (YouTube, Open Graph, LinkedIn newsletter, dev.to, Hashnode), each with your photo, name and tagline. The **newsletter banner** card prepares a request for your agent, which writes the banner from your source |
| Walkthrough video | open the walkthrough builder |

The editors (GIF, Carousel, Reel, Reel cover, Walkthrough video, Post) stay in the sidebar for longer edits.

Architecture cards include the five styles: sketch, cloud (an AWS RAG app with official logos), swimlane (with the GitHub Actions logo), sequence, and the new stage panels. Any icon field takes `logo:NAME` ([LOGOS.md](LOGOS.md)).

Clicking build, render or cover in the Design Studio (or build in the editor) is your own action, so it counts as your approval of that job's plan ([APPROVAL_GATES.md](APPROVAL_GATES.md)). The approval hooks guard what your agent does, not your clicks.

## Workspaces

| Workspace | Flow | Builds here? |
|---|---|---|
| **Home** | Paste a source and click **Analyse**. You see its content shapes, the number of figures, and the top GIF templates, carousel slides, Reel motion and hooks | – |
| **GIF** | All 16 templates, ranked (#, fit bar, reason). Then pick an opening line and describe the GIF. You get a request to paste into your agent | via your agent |
| **Carousel** | Choose a cover, then up to 5 slides from the ranked gallery (cone funnel, 21 charts, stat, bars, stack, loop, compare, grid). Edit each design (chart data as JSON) and the closing slide, then build. Or switch to **One infographic image** | yes: PDF + PNGs |
| **Reel** | Pick the spoken hook, the opening visual, the Reel format and the look (Claude light by default). The motion the matrix chose is shown | via your agent |
| **Reel cover** | Write the hook, a line, tags and an optional mini diagram. Pick a preferred layout, then render. Every supported layout comes back | yes: PNG per layout |
| **Walkthrough video** | Name the guide and pick the device. Write the steps (open, click, type, press, hover, scroll, wait) with a check for each step. Then click **Run, verify and render**. Progress is live; you get the video, the poster and the E2E report | yes: MP4 + report |
| **Post** | Pick the hook and an optional image design. You get a request for your agent | via your agent |
| **Library** | Everything made on this computer, newest first, with previews and downloads | – |

Every output carries your brand CTA pill (photo, name, tagline) at the bottom.

## API (local, token required)

| Endpoint | Purpose |
|---|---|
| `GET /api/designs` | design catalogue, GIF styles, themes, icons, brand |
| `POST /api/analyze {text}` | decision matrix and hook sets for the text |
| `POST /api/generate {mode, format, theme, items, closing}` | carousel or single image through the real build |
| `POST /api/cover {hook, sub, chips, steps, flow_title, layout}` | designed Reel covers |
| `POST /api/walk {spec, device}` → `GET /api/job?id=` | background Playwright walkthrough, its live log and files |
| `POST /api/request {kind, topic, source, notes, hook, design, extra}` | a ready-to-paste request for your agent |
| `GET /api/library`, `GET /api/ready` | library items; readiness from `studio.py doctor` |
| `GET /api/gallery` | every design with its preview, motion clip, aspect, category and panel action (scripts/gallery.py) |
| `POST /api/thumbs {text, kicker, sub, chips, steps, layouts, sizes}` | thumbnails and blog covers |
| `GET /catalog` | the design catalogue page (every design with its ID and sample) |

## Files

- Jobs are written under `~/.cache/content-creation/studio_jobs/`.
- The app is `studio/index.html` (shell and styles) plus `studio/js/app.js` (router, Home, Library), `core.js` (shared helpers) and `media.js` (workspaces).
- **Add a design:** append an entry to `scripts/designs.py` (fields, sample, build), then run `python3 scripts/studio_jobs.py` to render its thumbnail into `studio/samples/`.
- **Test it:** `node tests/e2e/app_tour.mjs OUT`, run from `runtime/`, drives every workspace and records `OUT/app/app-tour.mp4`.
