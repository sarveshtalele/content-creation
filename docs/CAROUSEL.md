# Carousel, resource carousel and the editor

## What you get
`studio.py build W --artifacts carousel` writes, in `W/out/`:
- `<slug>-carousel.pdf` (upload this as a LinkedIn document),
- `carousel/<slug>-carousel-NN.png` (1080x1350 per slide),
- `<slug>-carousel-comment.txt` (the first comment: every full link, plus your follow line).

Slide 1 is the title with the hook, the last slide is the closing slide with your follow card, and every slide carries your brand CTA pill (photo, name, tagline) at the bottom. There is no per-slide CTA text.

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
Each link is fetched once with the same guards as `ingest` (no private addresses, secrets redacted) and written to `W/source.md`. Write one line per link (`why`) from that page's own text; the check refuses lines that are not in the fetched pages. Set `closing.kind` to `comments`; the links go in the first comment.

## Editing (you control everything)
- Change any field: `studio.py edit W carousel.slides[1].title "New title" --build carousel --slide 3`. The previous story is kept as `story.json.bak`.
- Rebuild one slide: `studio.py build W --artifacts carousel --slide 3` (the PDF is rebuilt from all slides).
- Browser editor: `studio.py editor W` prints a link (127.0.0.1 only, private token). It shows a form for every field of the story (carousel, GIF, Reel, post), a slide list with per-slide rebuild, brand fields, build buttons and previews. Nothing leaves your computer.

## Looks and slide types (2.8)
Themes: `paper`, `midnight`, `sunrise`, `mint` (`carousel.theme`). Title layouts: `classic`, `poster`, `terminal`.
Extra slide types: `loop{title,center,steps[3-4]}`, `stack{title,rows[3-5]}`, `terminal{title,prompt,lines[3-6]}`, `shot{title,image,host,url,why}`.
Screenshots: `studio.py shot W NAME URL` needs a page that loads with its styles in your network; otherwise `studio.py readercard W NAME spec.json` makes a labelled summary card. Run `studio.py e2e W` for the browser evaluation.

## Chart slides (v3)

Every slide below takes `type`, `title` (6-60 chars) and the fields shown. Data charts (marked *) show only numbers found in the source; `pct`, `start`, `end`, `target` set geometry only. Samples: `skills/explainer-studio/studio/samples/chart-<type>.jpg`.

| type | family | fields |
|---|---|---|
| `lollipop`* | comparison | `rows[3-6]{label, value, pct}` |
| `dumbbell`* | comparison | `legend{a,b}`, `rows[3-5]{label, a{value,pct}, b{value,pct}}` |
| `slope`* | comparison | same as dumbbell; a and b are two moments |
| `bullet`* | comparison | `rows[3-5]{label, value, pct, target?}`, `target_label?` |
| `radar`* | comparison | `axes[4-6]`, `series[1-2]{name, values[one per axis, 0-100]}` |
| `sankey`* | flow | `flows[3-10]{from, to, num, value?}` (no loops) |
| `alluvial`* | flow | sankey + `stages[2-4]` column headings |
| `network` | flow | `center`, `nodes[4-8]{title, icon?}`, `links?[[i,j]]` |
| `arc` | flow | `nodes[4-7]`, `arcs[2-8]{from, to (indexes), label?}` |
| `flowchart` | flow | `steps[3-6]{title, kind: step|decision, yes?, no?}`; a decision loops back on "no" |
| `donut`* | composition | `parts[2-5]{label, value, pct}`, `center?{value, label}` |
| `waffle`* | composition | `parts[1-4]{label, value, pct}`, `icon?` (pictogram) |
| `treemap`* | composition | `parts[3-7]{label, value, pct}` |
| `sunburst` | hierarchy | `root`, `branches[2-4]{title, pct?, children[1-3]}` |
| `mindmap` | hierarchy | `root`, `branches[3-6]{title, icon?, items[0-3]}` |
| `decision` | hierarchy | `q`, `options[2-3]{label, title, sub?, icon?}` |
| `timeline` | time | `events[3-6]{when, title, sub?, icon?}` |
| `gantt` | time | `scale[2-6]`, `tasks[3-6]{title, start, end}` (0-100) |
| `waterfall`* | time | `start{label,value,num}`, `steps[2-5]{label,value,num}`, `end{label,value}` |
| `line`* | time | `x[3-8]`, `series[1-3]{name, values}`, `kind?: line|area`, `unit?` |
| `heatmap`* | time | `rows[3-6]`, `cols[3-6]`, `cells[rows][cols]`, `unit?`, `legend?{lo,hi}` |
| `arch` | architecture | `style` sketch\|cloud\|flow\|sequence plus its fields (docs/TEMPLATES.md, Architecture diagrams) |
| `cone` | funnel | `steps[3-5]{title, sub?, value?, icon?}` (`ring`, `tower`, `funnel` draw as the cone) |
