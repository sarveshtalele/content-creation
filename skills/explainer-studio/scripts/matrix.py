"""Decision matrix (data/matrix.json): what the content is shaped like, and which visual, motion and hook fit each format.

recommend(text) scores every content shape from the source (signal words per 1000 words, plus figures for data shapes; a data shape
needs at least two figures in the source), then ranks options for each format:
  gif       every GIF template, ranked (pick.py's structural scores + the matching shapes + a variety penalty for templates used in the
            last three builds). Shown to the person as a ranked gallery; the person chooses.
  carousel  chart/slide types from the top shapes (a data chart only when the source has figures)
  reel      motion techniques; cover layouts
  hooks     hook families (line + carousel), the visual hook and a carousel structure
Patterns and fits, not guaranteed results."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(os.path.dirname(HERE), 'data', 'matrix.json')
NUM = re.compile(r'\b\d[\d,]*(?:\.\d+)?\s?(?:%|x|k|m|b|million|billion)?\b', re.I)

def load(): return json.load(open(DATA, encoding='utf-8'))

def _hits(sig, low):
    if re.fullmatch(r"[a-z][a-z' -]*", sig): return len(re.findall(r'\b' + re.escape(sig) + (r'\w*' if len(sig) > 5 else r'\b'), low))
    return low.count(sig)

def shapes(text):
    low = ' ' + re.sub(r'\s+', ' ', text.lower()) + ' '; k = 1000 / max(300, len(low.split())); nums = len(NUM.findall(text)); out = []
    for s in load()['shapes']:
        hits = {g: _hits(g, low) for g in s['signals']}; hits = {g: n for g, n in hits.items() if n}
        sc = (2 * sum(hits.values()) + len(hits) * 3) * k
        if s['needs_numbers']: sc = sc + min(nums, 12) * k * 1.5 if nums >= 2 else 0
        out.append({'id': s['id'], 'label': s['label'], 'score': round(sc, 1), 'signals': sorted(hits, key=lambda g: -hits[g])[:5], 'needs_numbers': s['needs_numbers']})
    return sorted(out, key=lambda x: -x['score']), nums

def recent_templates(n=3):
    try:
        import studio as ST; dirs = json.load(open(os.path.join(ST.EH, 'library_dirs.json'), encoding='utf-8'))
    except Exception: return []
    out = []
    for d in reversed(dirs):
        try: t = json.load(open(os.path.join(d, 'story.json'), encoding='utf-8')).get('gif', {}).get('template')
        except Exception: t = None
        if t: out.append(t)
        if len(out) == n: break
    return out

def recommend(text, meta=None, recent=None):
    import pick as PK
    M = {s['id']: s for s in load()['shapes']}; ranked, nums = shapes(text); top = [r for r in ranked if r['score'] > 0][:4] or ranked[:2]
    base = PK.pick(text, meta)['scores']; mx = max(base.values()) or 1; recent = recent if recent is not None else recent_templates()
    gif = []
    for t in {g for s in M.values() for g in s['gif']} - set(base): base[t] = 0.0   # templates the structural picker does not score (chart)
    for t, v in base.items():
        sc = 60 * v / mx; why = [PK.WHY.get(t, '')]
        for r in top:
            if t in M[r['id']]['gif']: bonus = 25 * (1 - M[r['id']]['gif'].index(t) * .25) * min(1, r['score'] / (top[0]['score'] or 1)); sc += bonus; why.append('fits ' + r['label'].lower())
        if t in recent: sc *= .75; why.append('used in a recent build')
        gif.append({'template': t, 'score': round(sc, 1), 'why': '; '.join(w for w in why if w)})
    gif.sort(key=lambda g: -g['score'])
    car, seen = [], set()
    for r in top:
        for c in M[r['id']]['carousel']:
            if c not in seen: seen.add(c); car.append({'type': c, 'for': r['label']})
    lead = M[top[0]['id']]
    return {'shapes': top, 'figures_in_source': nums, 'gif': gif, 'carousel': car[:8], 'carousel_structure': lead['structure'],
            'reel': {'motion': list(dict.fromkeys(M[r['id']]['reel_motion'] for r in top))[:3], 'visual_hook': lead['visual_hook'], 'cover_layouts': ['hero', 'question', 'split', 'face'] + (['number (only if the hook or a big line holds a figure)'] if nums else [])},
            'hooks': {'line': list(dict.fromkeys(h for r in top for h in M[r['id']]['line_hooks']))[:4], 'carousel': list(dict.fromkeys(h for r in top for h in M[r['id']]['carousel_hooks']))[:4]}}

def report(R):
    L = ['Content shapes (strongest first):'] + [f"  {r['label']:<36} {r['score']:>6}  {', '.join(r['signals'])}" for r in R['shapes']]
    L += [f"Figures in source: {R['figures_in_source']}" + ('' if R['figures_in_source'] >= 2 else '  (no data charts: use non-data visuals)'), '', 'GIF templates, ranked (show the person the samples studio/samples/gif-<id>.jpg and let them choose):']
    L += [f"  {i + 1:>2}. {g['template']:<10} {g['score']:>6}  {g['why']}" for i, g in enumerate(R['gif'])]
    L += ['', 'Carousel slide types: ' + ', '.join(f"{c['type']} ({c['for'].lower()})" for c in R['carousel']), 'Carousel structure: ' + R['carousel_structure'],
          'Reel motion: ' + ' | '.join(R['reel']['motion']), 'Reel visual hook: ' + R['reel']['visual_hook'], 'Reel cover layouts: ' + ', '.join(R['reel']['cover_layouts']),
          'Hook families: line ' + ', '.join(R['hooks']['line']) + ' / carousel ' + ', '.join(R['hooks']['carousel']), '', 'The person makes the final choice for every format.']
    return '\n'.join(L)
