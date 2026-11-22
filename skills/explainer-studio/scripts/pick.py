"""pick: deterministic choice of the GIF diagram template from the shape of the source. usage: studio.py pick DIR
Scores per 1000 words of (also ecosystem: platform/sections wording, framework: governance/policy/controls wording): process markers (pipeline), layer/stack words (lanes), product/category catalogue words + list density (columns),
files/config/structure words (hub). Highest wins; ties and weak signals fall back to hub. The agent may override with a reason."""
import re
from common import words
def _c(rx, t): return len(re.findall(rx, t))
def pick(full, meta=None):
    t = full.lower(); n = max(300, len(words(full))); k = 1000 / n
    items = _c(r'^\s*(?:[-*•]|\d+[.)])\s+', '\n'.join(l for l in full.split('\n')))
    heads = _c(r'^#{2,3} ', full) if '#' in full else 0
    strong = _c(r'\b(first|second|third|next|then|finally|step|steps|pipeline|workflow|handshake|stage|stages|phase|sequence)\b', t)
    weak = _c(r'\b(request|response|process|flow|flows|before|after|once)\b', t)
    numbered = _c(r'^\s*\d+[.)]\s', full)
    lists3 = _c(r',\s+and\s', t)                      # "X, Y, and Z" enumerations: what a catalogue looks like
    s = {
      'pipeline': (4 * strong + weak + 6 * numbered) * k,
      'lanes': 5 * _c(r'\b(layer|layers|stack|tier|tiers|architecture|ecosystem|platform|infrastructure|foundation|runtime)\b', t) * k,
      'exploded': (7 * _c(r'\b(anatomy|teardown|exploded|under the hood|inside|breakdown|components? of|made of|peel|layers? of)\b', t) + 3 * _c(r'\b(layer|layers|stack|stacked)\b', t)) * k * .6,
      'isoflow': (5 * _c(r'\b(pipeline|data flow|dataflow|ci/cd|deploy(?:ment)?|release|request path|hand ?off|route|routing)\b', t) + 2 * _c(r'\b(then|next|finally|after that)\b', t)) * k * .55,
      'orbit': (7 * _c(r'\b(around|orbit|surrounds?|revolves?|central|hub and spoke|at the center|at the centre|connects? to)\b', t) + 3 * _c(r'\b(integrations?|plugins?|partners?|apps?|connectors?)\b', t)) * k * .6,
      'stairs': (9 * _c(r'\b(levels?|maturity|roadmap|milestones?|stages? of growth|beginner|intermediate|advanced|ladder|progression|grow(?:s|th)?)\b', t)) * k * .6,
      'tower': (8 * _c(r'\b(floors?|storey|stories|building|tower|skyscraper|levels? of|layer by layer|top to bottom|bottom to top|foundation|rooftop|roof)\b', t) + 2 * _c(r'\b(stack|tiers?)\b', t)) * k * .6,
      'skyline': (8 * _c(r'\b(rank(?:s|ed|ing)?|biggest|largest|highest|tallest|top \d+|leaderboard|compare[sd]?|market share|growth of|vs\.?)\b', t) + 3 * _c(r'\b\d+(?:\.\d+)?\s?(?:%|x|k|m|b|million|billion)\b', t)) * k * .5,
      'conveyor': (8 * _c(r'\b(conveyor|assembly line|factory|queue|gate|gates|checkpoint|screening|review|approval|moderation|quality control|handoff|hand-off|production line)\b', t) + 2 * _c(r'\b(automat\w+|batch|inspect\w*)\b', t)) * k * .55,
      'funnel': (9 * _c(r'\b(funnel|conversion|convert(?:s|ed)?|drop|drops|biggest drop|become customers|drop[- ]?off|churn|retention|filter(?:s|ed)?|narrow(?:s|ing)?|pipeline of leads|signups?|sign-ups?|survive[sd]?|shortlist)\b', t) + 6 * _c(r'\b\d+(?:\.\d+)?\s?%', t) + 3 * _c(r'\b(of those|only \d+|reach(?:es|ed)?)\b', t)) * k * .8,
      'ecosystem': (6 * _c(r'\b(ecosystem|platform|fans? out|sections?|suite|portfolio)\b', t) + 2 * _c(r'\b(sources|ingestion|storage|processing|serving|deployment|governance)\b', t)) * k,
      'framework': (6 * _c(r'\b(framework|governance|policy|policies|compliance|principles|pillars|controls?|takeaways?|best practices)\b', t) + 3 * _c(r'\b(nine|eight|six|checklist|reuse|reusable)\b', t)) * k,
      'columns': (3 * _c(r'\b(models?|products?|tools?|plans?|pricing|features?|categories|category|catalog|catalogue|lineup|family|families|variants|offerings|services|options)\b', t) + .7 * items + 1.5 * heads + 6 * lists3) * k,
      'hub': (1.5 * _c(r'\b(directory|folder|folders|files?|config|configuration|settings|repo|repository|readme|monorepo|workspace)\b', t) + 3 * _c(r'\.(json|md|yaml|yml|toml|py|js|ts)\b', t) + 8 * _c(r'[├└│]', full) + 3 * _c(r'\b(components?|parts|pillars|guarantees|properties|building blocks|consists? of|made up of|gives you|at the center|core)\b', t)) * k,
    }
    if meta and 'github.com' in (meta.get('url') or ''): s['hub'] += 20
    s = {a: round(b, 1) for a, b in s.items()}
    best = max(s, key=lambda a: (s[a], a == 'hub'))
    if s[best] < 12: best = 'hub'
    return {'template': best, 'scores': s, 'why': {'funnel': 'the source describes stages that narrow, with shares or counts', 'pipeline': 'the source describes ordered steps or a flow', 'lanes': 'the source describes layers or a stack', 'columns': 'the source lists things grouped by category', 'hub': 'one central thing made of named parts (files, settings, components)', 'ecosystem': 'one core that fans out into several sections, each with parts', 'exploded': 'a thing made of layers or parts, shown pulled apart in 3D', 'isoflow': 'an ordered flow that reads well across 3D slabs', 'orbit': 'a core with 4-6 things around it (integrations, partners, parts)', 'stairs': 'levels, stages or a progression that climbs', 'tower': 'a building of floors or layers, each room showing a small scene', 'skyline': 'a ranking or size comparison shown as city towers', 'conveyor': 'items passing through checks, gates or hand-offs on a belt', 'framework': 'a framework of 6-9 parts, each easy to show as a small diagram, plus takeaways'}[best]}


# Minimal fill-in skeletons, printed by `studio.py pick` so the agent writes only the content (no schema reading). "…" = your words from the source.
_G = '"meta":{"title":"…","slug":"kebab-case"},"gif":{"template":"%s","title":"…","subtitle":"…",'
_I = '{"title":"…","sub":"…"}'
SKELETON = {
 'hub': _G % 'hub' + '"groups":{"blue":"…","green":"…","clay":"…"},"hub":{"title":"…","steps":["…","…"],"tagline":"…"},"cards":[{"title":"…","icon":"icon","group":"blue","body":"…"} x9]}',
 'columns': _G % 'columns' + '"hub":{"title":"…","tagline":"…"},"columns":[{"label":"…","icon":"icon","group":"blue","items":[{"title":"…","sub":"…","icon":"icon"} x2-3]} x3-4]}',
 'pipeline': _G % 'pipeline' + '"pipeline":{"start":{"title":"…","sub":"…","icon":"icon"},"stages":[{"label":"…","group":"blue","nodes":[%s x2-4]} x2-4],"result":{"title":"…","sub":"…","icon":"icon"}}}' % _I,
 'lanes': _G % 'lanes' + '"lanes":{"hub":{"title":"…","sub":"…","icon":"icon"},"lanes":[{"label":"…","icon":"icon","group":"blue","items":[%s x2-3]} x3-5]}}' % _I,
 'exploded': _G % 'exploded' + '"exploded":{"hub":{"title":"…"},"layers":[{"title":"…","sub":"…","icon":"icon","group":"blue"} x3-5]}}',
 'isoflow': _G % 'isoflow' + '"isoflow":{"stops":[{"title":"…","sub":"…","icon":"icon","group":"blue"} x3-5]}}',
 'orbit': _G % 'orbit' + '"orbit":{"hub":{"title":"…","sub":"…"},"items":[{"title":"…","sub":"…","icon":"icon","group":"blue"} x4-6]}}',
 'tower': _G % 'tower' + '"tower":{"hub":{"title":"…"},"floors":[{"title":"…","sub":"…","icon":"icon","group":"blue","scene":"screen|chart|chat|docs|gears|checklist|search|shield|cloud|people|rocket|database|bulb|target"} x3-5]}}',
 'skyline': _G % 'skyline' + '"skyline":{"buildings":[{"title":"…","sub":"…","value":"…","size":5,"icon":"icon","group":"blue"} x3-5]}}',
 'funnel': _G % 'funnel' + '"funnel":{"stages":[{"title":"…","sub":"…","value":"…","pct":100,"icon":"icon","group":"blue"} x3-5]}}',
 'conveyor': _G % 'conveyor' + '"conveyor":{"tally":"…","gates":[{"title":"…","sub":"…","icon":"icon","group":"blue","stat":{"value":"88%","pct":88}} x3-4]}}',
 'stairs': _G % 'stairs' + '"stairs":{"steps":[{"title":"…","sub":"…","icon":"icon","group":"blue"} x3-5]}}',
 'ecosystem': _G % 'ecosystem' + '"ecosystem":{"hub":{"title":"…","sub":"…","icon":"icon"},"sections":[{"label":"…","icon":"icon","group":"blue","items":[%s x2-3]} x3-5]}}' % _I,
 'framework': _G % 'framework' + '"framework":{"cards":[{"title":"…","body":"…","icon":"icon","group":"blue","caption":"…","viz":{"type":"steps|stack|tree|fan|table","root":"…(tree,fan)","items":["…" x2-4]}} x6|9],"takeaways":[{"title":"…","body":"…","icon":"icon"} x3-5]}}',
}
