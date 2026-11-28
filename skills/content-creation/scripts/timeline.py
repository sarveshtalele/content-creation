"""timeline: story + TTS durations -> data.json for the engine (scene windows, per-part appear times, caption chunks). Deterministic."""
import re
from common import *
LEAD, GAP, SCENE_GAP, FIRST_PAD = 0.3, 0.22, 0.2, 0.2
def parts(sc):
    t, p = sc['type'], sc.get('p', {})
    return {'hook': 1 + bool(p.get('sub')) + len(p.get('chips', [])), 'flow': len(p.get('steps', [])) + bool(p.get('loop')), 'map': 1 + len(p.get('items', [])),
            'cards': len(p.get('items', [])), 'list': len(p.get('items', [])), 'chips': len(p.get('items', [])), 'dialog': len(p.get('turns', [])), 'big': 1 + bool(p.get('sub'))}[t]
def items_of(sc):
    p = sc.get('p', {}); t = sc['type']
    return {"hook": [None] * parts(sc), "flow": p.get("steps", []) + ([None] if p.get("loop") else []), "map": [None] + p.get("items", []),
            'cards': p.get('items', []), 'list': p.get('items', []), 'chips': p.get('items', []), 'dialog': p.get('turns', []), 'big': [None] * parts(sc)}[t]
def build(story, dur, tails=None, end_hold=2.8, last_tail=1.5):
    tails = tails or {}; beats = {b['id']: b for b in story['beats']}; order = [b['id'] for b in story['beats']]
    start, end = {}, {}; t = LEAD; scs = story['scenes']
    for i, sc in enumerate(scs):
        for bid in sc['beats']: start[bid] = t; end[bid] = t + dur[bid]; t = end[bid] + GAP
        tail = tails.get(sc['id'], 0.4) if i < len(scs) - 1 else last_tail + tails.get(sc['id'], 0)
        t = end[sc['beats'][-1]] + tail + SCENE_GAP
    last_end = end[order[-1]]
    end_t0 = last_end + last_tail + tails.get(scs[-1]['id'], 0)
    out = []
    for i, sc in enumerate(scs):
        t0 = 0 if i == 0 else start[sc['beats'][0]] - FIRST_PAD
        t1 = start[scs[i + 1]['beats'][0]] - FIRST_PAD if i < len(scs) - 1 else end_t0
        # part times
        bs = sc['beats']; P = parts(sc); items = items_of(sc); at = []
        for k in range(P):
            j = min(len(bs) - 1, k * len(bs) // max(P, 1)); b = bs[j]; grp = [x for x in range(P) if min(len(bs) - 1, x * len(bs) // max(P, 1)) == j]
            pos = grp.index(k); base = start[b] + 0.2 + (0.55 * dur[b]) * (pos / max(1, len(grp)))
            it = items[k] if k < len(items) else None
            if isinstance(it, dict) and it.get('cue'):
                for bb in bs:
                    say = beats[bb]['say'].lower(); ix = say.find(str(it['cue']).lower())
                    if ix >= 0: base = start[bb] + max(0, ix / max(1, len(say))) * dur[bb] * 0.95 - 0.12; break
            at.append(base)
        for k in range(len(at)): at[k] = max(at[k], (at[k - 1] + 0.28) if k else t0 + 0.25)
        out.append({'id': sc['id'], 'type': sc['type'], 'props': sc.get('p', {}), 't0': round(t0, 3), 't1': round(t1, 3), 'at': [round(x, 3) for x in at]})
    # caption chunks (proportional to characters inside each beat)
    chunks = []
    for bid in order:
        toks = beats[bid]['say'].split(' '); groups = []; cur = ''
        for i, w in enumerate(toks):
            nxt = (cur + ' ' + w) if cur else w
            if cur and len(nxt) > 62: groups.append(cur); cur = w
            else: cur = nxt
            if re.search(r'[,:.?!]$', w) and len(cur) >= 30 and i < len(toks) - 1: groups.append(cur); cur = ''
        if cur: groups.append(cur)
        if len(groups) > 1 and len(groups[-1]) < 22: l = groups.pop(); groups[-1] += ' ' + l
        total = sum(len(g) for g in groups); a = start[bid]
        for g in groups: d = dur[bid] * len(g) / total; chunks.append({'t0': round(a, 3), 't1': round(a + d, 3), 'text': g}); a += d
    url = story['meta'].get('url', '')
    endc = {'t0': round(end_t0, 3), 't1': round(end_t0 + end_hold, 3), 'title': story['meta']['title'], 'source_label': story['meta'].get('source_label') or ('Source: ' + (story['meta'].get('source_name') or 'the original article')), 'source_url': re.sub(r'^https?://(www\.)?', '', url).rstrip('/')[:60]}
    return {'DUR': endc['t1'], 'scenes': out, 'end': endc, 'chunks': chunks, 'voice': [{'id': b, 't': round(start[b], 3)} for b in order], 'start': start}
def gif_height(N, tagline):
    return 1350  # LinkedIn portrait 4:5 (1080x1350), fixed for every GIF; the 9-card layout fills it exactly
    CY = 560 if N >= 7 else 540; last = 1152 if N == 9 else (844 if N == 7 else CY - 120 + 240); gap = 20 if N == 9 else 28
    ribbon = CY + 176 + 44 + 24 if tagline else CY + 152 + 24
    return max(last + gap, ribbon) + 64 + 78 + 36
