# Carousel, resource carousel and the editor

## What you get
`studio.py build W --artifacts carousel` writes, in `W/out/`:
- `<slug>-carousel.pdf` (upload this as a LinkedIn document),
- `carousel/<slug>-carousel-NN.png` (1080x1350 per slide),
- `<slug>-carousel-comment.txt` (the first comment: every full link, plus your follow line).

Slide 1 is the title with the hook, the last slide is the closing CTA (your brand pill and avatar), and every slide has a CTA strip at the bottom that you can edit and rebuild.

## Slide types
| type | use it for |
|---|---|
| `points` | 3-5 numbered ideas |
| `grid` | numbered card poster: banner, legend, 4/6/9 cards each with a mini diagram (`kicker`, `legend[]`, `cards[]{motif,caption,title,sub,group}`) |
| `stat` | one number (ring gauge + 100-cell waffle) |
| `bars` | a few values compared |
| `compare` | two sides (before/after, generic/specific) |
| `flow` | 3-4 ordered steps |
| `big` | one statement |
| resources (from `carousel.resources`) | links, 3 per slide, balanced (5 becomes 3+2) |

## Hook styles (`carousel.hook_style`)
Paraphrased patterns, no third-party names.
- **contradiction**: two things that do not fit together create tension.
- **specificity**: speak to one person, not an audience.
- **timeframe**: a short, unexpected timeframe starts a curiosity loop.
- **pov**: a scenario that is really advice.
- **plain**: a direct statement.

## Resource carousel
```
python3 scripts/studio.py resources W https://github.com/org/repo1 https://github.com/org/repo2 ...
```
Each link is fetched once with the same guards as `ingest` (no private addresses, secrets redacted) and written to `W/source.md`. Write one line per link (`why`) from that page's own text; the check refuses lines that are not in the fetched pages. Set `closing.kind` to `comments` and the CTA to "Link in comments"; the links go in the first comment.

## Editing (you control everything)
- Change one slide's CTA: `studio.py cta W 3 "Save this for later" --build` (`all` sets the default).
- Change any field: `studio.py edit W carousel.slides[1].title "New title" --build carousel --slide 3`. The previous story is kept as `story.json.bak`.
- Rebuild one slide: `studio.py build W --artifacts carousel --slide 3` (the PDF is rebuilt from all slides).
- Browser editor: `studio.py editor W` prints a link (127.0.0.1 only, private token). It shows a form for every field of the story (carousel, GIF, Reel, post), a table of per-slide CTAs, brand fields, build buttons and previews. Nothing leaves your computer.

## Looks and slide types (2.8)
Themes: `paper`, `midnight`, `sunrise`, `mint` (`carousel.theme`). Title layouts: `classic`, `poster`, `terminal`.
Extra slide types: `loop{title,center,steps[3-4]}`, `stack{title,rows[3-5]}`, `terminal{title,prompt,lines[3-6]}`, `shot{title,image,host,url,why}`.
Screenshots: `studio.py shot W NAME URL` needs a page that loads with its styles in your network; otherwise `studio.py readercard W NAME spec.json` makes a labelled summary card. Run `studio.py e2e W` for the browser evaluation.
