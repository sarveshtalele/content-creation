# GIF templates

All templates draw on a fixed 1080x1350 canvas. Content lives between y=150 (below the title) and y=1216 (above the footer). Run `python3 scripts/studio.py pick DIR` to get the best fit and a fill-in skeleton, or `studio.py spec` for every limit.

| Template | Shape of the source | Block in story.json |
|---|---|---|
| `pipeline` | ordered steps, workflow | `gif.pipeline{start, stages[2-4]{label, group, nodes[2-4]}, result}` |
| `columns` | items grouped by category | `gif.hub{title, tagline}`, `gif.columns[3-4]{label, icon, group, items[2-3]}` |
| `lanes` | layers of a stack | `gif.lanes{hub, lanes[3-5]{label, icon, group, items[2-3]}}` |
| `hub` | one concept, nine parts | `gif.hub`, `gif.groups`, `gif.cards[9]` |
| `ecosystem` | one core, 3-5 sections | `gif.ecosystem{hub, sections[3-5]{label, icon, group, items[2-3]}}` |
| `framework` | 6 or 9 parts, each drawable | `gif.framework{cards[6|9]{title, body, icon, group, caption, viz}, takeaways[3-5]}` |
| `exploded` | a thing made of layers, pulled apart in 3D | `gif.exploded{hub{title}, layers[3-5]{title, sub, icon, group}}` (top layer first) |
| `isoflow` | an ordered flow across isometric slabs | `gif.isoflow{stops[3-5]{title, sub, icon, group}}` |
| `orbit` | a core with 4-6 things around it | `gif.orbit{hub{title, sub?}, items[4-6]{title, sub, icon, group}}` |
| `stairs` | levels or stages that climb | `gif.stairs{steps[3-5]{title, sub, icon, group}}` (lowest first) |
| `tower` | a building of floors, each room a small scene | `gif.tower{hub{title}, floors[3-5]{title, sub, icon, group, scene}}` (top floor first) |
| `skyline` | a ranking or size comparison | `gif.skyline{buildings[3-5]{title, sub, value, size 1-10, icon, group}}` (value is shown on the roof, e.g. `82%`) |
| `conveyor` | items passing through gates | `gif.conveyor{tally, gates[3-4]{title, sub, icon, group, stat{value, pct}}}` (first gate first; `stat` is the share that passes the gate, taken from the source, e.g. `88%` / `88`) |

`group` is a colour: `blue`, `green`, `clay` or `sand`. Icons come from `studio.py spec --icons`. Every text must reuse the source's words (checked).

## Framework mini-diagrams (`viz.type`)

| type | draws | fields |
|---|---|---|
| `steps` | boxes joined by flowing arrows | `items[2-4]` |
| `stack` | widening bars | `items[2-4]` |
| `tree` | a root over children | `root`, `items[2-4]` |
| `fan` | one source feeding outputs | `root`, `items[2-4]` |
| `table` | header row + rows | `items` as `"a|b|c"` rows, 2-3 cells |

## How the 3D templates work

The 3D is decoration, the words are flat. Plates and rings use real CSS 3D transforms (`rotateX`, `rotateZ`); isometric blocks are exact three-face polygons. Every label lives in a normal, axis-aligned card, so the same layout checks (overflow, overlap, empty cards, safe area) apply and the text stays crisp. Helpers are in `engine/gif_3d.js`: `plate`, `iso`, `rayRect`, `uniformSub` (one sub-text size for the whole diagram), `mix` (tints).

The picker favours the 2D templates unless the source clearly describes anatomy and layers, 3D flows, things around a centre, or levels. To force one, tell your agent: *"use the orbit template"*.

### Scenes (tower)

`scene` picks the small illustration inside a floor: `screen, chart, chat, docs, gears, checklist, search, shield, cloud, people, rocket, database, bulb, target`. Scenes are flat shapes that draw in part by part, so they are identical on every render. Add one in `engine/gif_scenes.js` and to `SCENES` in `scripts/validate_story.py`.

## Add a template

1. **Engine:** create `engine/gif_<name>.js` exporting `build<Name>(stage, D)`. Use the shared helpers: `scene`, `header`, `footer`, `finish`, `reveal`, `flow`, `layer`, `node`, `badge`. Rules: stay inside y 150..1216; create a `layer(S)` after any filled band and before the nodes so arrows show above the band; give every text a unique id via `tx()`.
2. **Register:** add it to the map in `engine/gif.js`.
3. **Spec:** add its limits to `SPEC['gif_templates']` and a validator `v_<name>` in `scripts/validate_story.py`; add the name to `TEMPLATES`.
4. **Picker:** add keyword signals in `scripts/pick.py` and a `SKELETON` entry.
5. **Fixture:** add `fixtures/<name>.md` and `<name>.story.json` (the selftest picks them up).
6. **Verify:** `python3 scripts/selftest.py`, then `studio.py build` and `review` on the fixture; fix any OVERFLOW / LEAK / OVERLAP lines and look at the contact sheet.

Design rules that keep output consistent: fixed canvas, text sized from content length with a floor of 14px, boxes sized to content (no large empty areas), one arrow per relationship, dots only on arrows.

To change the CTA, avatar or hook on an existing diagram, see [CUSTOMIZE.md](CUSTOMIZE.md).
