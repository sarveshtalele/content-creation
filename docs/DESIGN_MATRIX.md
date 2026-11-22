# Design decision matrix (v3)

Source of truth: `skills/explainer-studio/data/matrix.json`. `studio.py pick DIR` scores every content shape from the source and prints ranked options for each format; `studio.py plan DIR` and `studio.py hooks DIR` use the same scores. The person makes the final choice: the GIF list is a ranked gallery, never a silent pick.

## A. Content shape to visual, motion and hook

| Content shape | Signals | Needs figures | Carousel slides | GIF templates | Reel motion | Hook families (line / carousel) | Visual hook | Carousel structure |
|---|---|---|---|---|---|---|---|---|
| Narrowing numbers | funnel, conversion, convert, drop, drop-off, dropoff | yes | cone, waffle, lollipop | funnel, conveyor | cone fills slice by slice; counters tick down | Proof, Curiosity / Evidence-led, Mistakes | Proof-first | Case study |
| Flow of volume between stages | flows, split, route, routed, sources, sinks | yes | sankey, alluvial | pipeline, conveyor | particles flow along ribbons; ribbons draw in with easing | Curiosity, Quick win / How-to, Curiosity gap | Start with the result | Diagnose to Decision |
| Ordered steps | step, steps, first, then, next, finally | no | flow, timeline, terminal | pipeline, isoflow, stairs | path tracing with staggered cards | Quick win, List / Framework, How-to | Screen recording | Step-by-Step Tutorial |
| Agent or AI workflow | agent, agents, tool call, loop, retry, verify | no | flowchart, loop, network | pipeline, conveyor, hub | node pulses travel the loop; decision diamond flips | Curiosity, Question / Beginner guide, Curiosity gap | Open mid-action | Product Walkthrough |
| Architecture and connections | mcp, server, client, api, integration, integrations | no | network, arc, stack | orbit, hub, ecosystem | network animation: links draw, nodes pop in, dots travel | Curiosity, Question / Beginner guide, Framework | Zoom reveal | Documentation Guide |
| Layers or a stack | layer, layers, stack, tier, tiers, runtime | no | stack, sunburst | lanes, exploded, tower | exploded parallax: layers pull apart | List, Curiosity / Beginner guide, Framework | Zoom reveal | Beginner Playbook |
| A versus B | vs, versus, instead of, compared, compare, old way | no | compare, dumbbell, slope | columns, skyline | split screen, then morph A into B | Question, Contrarian / Comparison, Contrarian | Split screen | Path A vs. Path B |
| Options scored on several criteria | benchmark, score, scores, rating, criteria, accuracy | yes | radar, heatmap, bullet | skyline, columns | radar draws axis by axis; heat cells fill | Proof, List / Comparison, Evidence-led | Proof-first | Decision Matrix |
| Ranking or sizes | rank, ranking, top, biggest, largest, leaderboard | yes | lollipop, bars | skyline | bar race with counters | List, Proof / Resource list, Evidence-led | Start with the result | Best Tools List |
| Part of a whole | share, percent, %, split, breakdown, portion | yes | donut, waffle, treemap | framework, grid | donut sweep; waffle cells fill in order | Proof, Curiosity / Evidence-led, Myth-busting | Proof-first | Three Metrics |
| Hierarchy or taxonomy | category, categories, type of, types of, kinds of, family | no | sunburst, treemap, mindmap | ecosystem, hub, columns | zoom reveal into one branch | List, Curiosity / Framework, Resource list | Zoom reveal | Content Principles |
| Choosing what to use | when to use, choose, which one, should you, depends, if you | no | decision, compare | framework, columns | branch highlight travels down the chosen path | Question, Quick win / Question, Comparison | Mistake demonstration | Diagnose to Decision |
| Time and history | year, years, version, release, released, launched | no | timeline, gantt | stairs, pipeline | camera pans along the timeline | Story, Curiosity / Transformation, Personal experience | Transformation | Founder Lesson |
| Plan or roadmap | week, weeks, month, months, quarter, milestone | no | gantt, timeline | stairs | bars grow along the time scale | Quick win, Story / Framework, How-to | Fast transitions | Roadmap |
| Change in a total | added, removed, net, saved, cost, costs | yes | waterfall, bars | skyline | bars step up and down to the total | Proof, Warning / Evidence-led, Mistakes | Before and after | Before and After |
| Trend over time | growth, grew, grow, trend, over time, per week | yes | line, slope | skyline, stairs | line draws with easing; end counter ticks up | Proof, Curiosity / Evidence-led, Transformation | Start with the result | Monthly Retrospective |
| Commands and setup | install, command, cli, terminal, npm, pip | no | terminal, flow | hub, pipeline | typed terminal with cursor | Quick win, Warning / How-to, Checklist | Screen recording | Step-by-Step Tutorial |
| Myth or strong opinion | myth, wrong, stop, never, overrated, actually | no | big, compare | - | kinetic typography: the claim builds word by word | Contrarian, Warning / Myth-busting, Contrarian | Text-first | Myth vs. Reality |
| Resource list | repo, repos, repository, github, article, resources | no | resources, grid, shot | grid, columns | card flip per resource | List, Save and share / Resource list, Practical template | Fast transitions | Resource Roundup |

## B. Format rules

| Format | Structure | Motion techniques | Hook rule |
|---|---|---|---|
| carousel | Pick a structure from hooks.json structures; every content slide gets a different chart family | - | First slide hook <= 60 chars from a carousel hook template; slide 2 re-hooks; last slide = save/share CTA |
| gif | One diagram, title hook | staggering, path tracing, masking reveal, looping, easing | Title = question or curiosity line |
| reel | Hook (0-3 s), stakes, answer, how, proof, takeaway, engage | kinetic typography, camera pan/zoom, morphing, animated counters, particle flow, parallax | Spoken hook + on-screen hook + visual hook chosen together |
| cover | Big hook, hero visual, avatar | - | Same family as the Reel hook; 6 words or fewer is best; safe for 4:5 crop |
| post | Hook question, bullets, CTA | - | Question or contrarian line; save/share CTA when the post has reference value |

## Scoring

- Shape score = (2 x signal-word hits + 3 x distinct signals) per 1000 words. Data shapes add figures in the source and score 0 when the source has fewer than two figures.
- GIF ranking = 60 x the structural score from `pick.py` (normalised) + up to 25 per matching top shape, x 0.75 for a template used in one of the last three builds (variety).
- Carousel slide types come from the top four shapes, in order, without repeats. Data charts are refused by the validator when a figure is not in the source.
- Hooks: `hooks.py` adds +3 to the hook families the matrix chose; patterns, not guaranteed results.
