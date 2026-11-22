"""Viral hook library (data/hooks.json) and a best-fit picker.

`suggest(text, kind)` scores each pattern against the topic or source text and returns the best matches, so the agent (or the studio) offers the hooks
that fit the concept instead of the whole list. Patterns are creative starting points with [placeholders]; fill them with the real topic and real numbers."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); PATH = os.path.join(os.path.dirname(HERE), 'data', 'hooks.json')

def load():
    return json.load(open(PATH, encoding='utf-8'))

def _words(t): return set(re.findall(r"[a-z][a-z'-]+", t.lower()))

def suggest(text, kind='carousel', n=5):
    """kind: 'carousel' (first-slide formulas) or 'line' (opening lines for a post, Reel or GIF). Returns [{category, text, score}] best first."""
    lib = load(); w = _words(text); low = ' ' + re.sub(r'\s+', ' ', text.lower()) + ' '; out = []
    for it in lib['carousel' if kind == 'carousel' else 'line']:
        sc = sum(2 for f in it['fits'] if f in w) + sum(1 for f in it['fits'] if f not in w and (' ' + f) in low)
        if re.search(r'\b\d{1,3}(?:,\d{3})*\b', text) and re.search(r'list|number|resources|top|tools|steps', ' '.join(it['fits']) + it['category'].lower()): sc += 1
        out.append({'category': it['category'], 'text': it.get('template') or it['hook'], 'score': sc})
    if kind != 'carousel':                          # opening lines: best three categories, two lines each
        by = {}
        for o in out: by.setdefault(o['category'], []).append(o)
        top = sorted(by.values(), key=lambda g: -g[0]['score'])[:max(1, n // 2)]
        return [dict(x, score=g[0]['score']) for g in top for x in g[:2]][:n]
    out.sort(key=lambda x: -x['score']); seen, res = set(), []
    for o in out:                                   # one per category first so the picks differ in kind
        if o['category'] in seen: continue
        seen.add(o['category']); res.append(o)
        if len(res) == n: break
    return res
