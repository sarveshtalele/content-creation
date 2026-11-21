"""pick: deterministic choice of the GIF diagram template from the shape of the source. usage: studio.py pick DIR
Scores per 1000 words of: process markers (pipeline), layer/stack words (lanes), product/category catalogue words + list density (columns),
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
      'lanes': 5 * _c(r'\b(layer|layers|stack|tier|tiers|architecture|ecosystem|platform|infrastructure|foundation|runtime|framework|frameworks)\b', t) * k,
      'columns': (3 * _c(r'\b(models?|products?|tools?|plans?|pricing|features?|categories|category|catalog|catalogue|lineup|family|families|variants|offerings|services|options)\b', t) + .7 * items + 1.5 * heads + 6 * lists3) * k,
      'hub': (1.5 * _c(r'\b(directory|folder|folders|files?|config|configuration|settings|repo|repository|readme|monorepo|workspace)\b', t) + 3 * _c(r'\.(json|md|yaml|yml|toml|py|js|ts)\b', t) + 8 * _c(r'[├└│]', full) + 3 * _c(r'\b(components?|parts|pillars|guarantees|properties|building blocks|consists? of|made up of|gives you|at the center|core)\b', t)) * k,
    }
    if meta and 'github.com' in (meta.get('url') or ''): s['hub'] += 20
    s = {a: round(b, 1) for a, b in s.items()}
    best = max(s, key=lambda a: (s[a], a == 'hub'))
    if s[best] < 12: best = 'hub'
    return {'template': best, 'scores': s, 'why': {'pipeline': 'the source describes ordered steps or a flow', 'lanes': 'the source describes layers or a stack', 'columns': 'the source lists things grouped by category', 'hub': 'one central thing made of named parts (files, settings, components)'}[best]}
