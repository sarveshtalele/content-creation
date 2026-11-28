"""cover: the designed Reel cover (1080x1920), not a frame grabbed from the video.

`data(story)` turns a story.json into the cover's content, using only words already in the story (the hook scene, list and flow
scenes, a big-statement scene). Five layouts; each one is offered only when the story has what it needs:
  hero      hook + a mini flow diagram of 3-4 steps          (needs a flow or list scene)
  question  giant hook with a highlighted last phrase + chips (always)
  number    one big figure from the story + what it counts    (needs a real figure in the hook, sub or big scene; never a count we made up)
  split     two panels from two list scenes, joined by an arrow (needs two list scenes)
  face      your avatar large, hook under it, chips           (always)
Text stays inside y 300..1560 so the 4:5 and 3:4 grid crops and the Reels UI (bottom 20%, right rail) never cut it."""
import re

LAYOUTS = ('hero', 'question', 'number', 'split', 'face')
NUM = re.compile(r'(?<![\w.])(\d[\d,.]*\s?(?:%|x|k|m|b|K|M|B)?)(?![\w])')


def _items(p):
    return [{'title': (i.get('label') or i.get('title') or '')[:28], 'sub': (i.get('sub') or '')[:48], 'icon': i.get('icon') or ''} for i in (p.get('steps') or p.get('items') or []) if isinstance(i, dict)]


def data(story, hook=None, layout=None):
    sc = [s.get('p', {}) for s in story.get('scenes', [])]
    first = next((p for p in sc if p.get('q')), {})
    cv = (story.get('reel') or {}).get('cover') or {}
    hook = hook or cv.get('hook') or first.get('q') or (story.get('gif') or {}).get('title') or story['meta']['title']
    sub = cv.get('sub', first.get('sub', ''))
    chips = [c if isinstance(c, str) else c.get('label', '') for c in first.get('chips', [])][:4]
    lists = [p for p in sc if (p.get('items') or p.get('steps')) and p.get('title')]
    flow = next((p for p in sc if p.get('steps') and p.get('title')), lists[0] if lists else None)
    big = next((p for p in sc if p.get('big')), None)
    num = None
    for t in [hook, sub] + ([big['big'], big.get('sub', '')] if big else []):
        m = NUM.search(t or '')
        v = m.group(1).strip() if m else ''
        if m and (v[-1:] in '%xkmbKMB' or float(re.sub(r'[^\d.]', '', v) or 0) >= 10): num = {'value': v, 'label': t}; break   # small bare numbers (1, 1.3) are versions or counts, not headline figures
    out = {'hook': hook, 'sub': sub, 'kicker': cv.get('kicker', ''), 'chips': chips, 'icons': [i['icon'] for p in lists for i in _items(p) if i['icon']][:4]}
    if flow: out['flow'] = {'title': flow['title'], 'steps': _items(flow)[:4]}
    if num: out['number'] = num
    pair = [p for p in lists if p.get('items')] if len([p for p in lists if p.get('items')]) >= 2 else lists   # compare two lists, not the step flow, when the story has them
    if len(pair) >= 2: out['split'] = [{'head': p['title'], 'items': [i['title'] for i in _items(p)][:3]} for p in pair[:2]]
    avail = [l for l in LAYOUTS if l in ('question', 'face') or (l == 'hero' and 'flow' in out) or (l in out)]
    pick = layout or cv.get('layout') or 'hero'
    out['layouts'] = avail; out['chosen'] = pick if pick in avail else avail[0]
    return out


# —— thumbnails and blog covers (engine/thumb.js) ——
THUMB_SIZES = {'youtube': (1280, 720), 'og': (1200, 630), 'newsletter': (1920, 1080), 'devto': (1000, 420), 'hashnode': (1600, 840)}   # newsletter = LinkedIn newsletter / article cover
THUMB_LAYOUTS = ('face', 'number', 'diagram', 'versus', 'editorial', 'banner')
def thumb_data(story, size, text=None, layouts=None):
    """Words for a thumbnail or blog cover, from the story (thumb.text, else the hook). Layouts offered only when the story has what they need."""
    th = story.get('thumb') or {}
    if not story.get('scenes') and th:   # a stand-alone thumb section: its own words, steps and two lists
        story = {**story, 'scenes': [{'p': {'q': th.get('text') or story['meta']['title'], 'sub': th.get('sub', ''), 'chips': th.get('chips', [])}}]
                 + ([{'p': {'title': th.get('kicker') or 'How it works', 'steps': [{'label': x} for x in th['steps']]}}] if th.get('steps') else [])
                 + [{'p': {'title': l['head'], 'items': [{'label': x} for x in l['items']]}} for l in th.get('lists', [])]}
    cd = data(story)
    out = {'platform': size, 'chips': cd.get('chips', []), 'text': text or th.get('text') or cd['hook'], 'kicker': th.get('kicker', cd.get('kicker') or (cd.get('flow') or {}).get('title', '')), 'sub': cd.get('sub', '')}
    if cd.get('flow') and len(cd['flow']['steps']) >= 2: out['flow'] = cd['flow']
    m = NUM.search(out['text']); v = m.group(1).strip() if m else ''
    if m and (v[-1:] in '%xkmbKMB' or float(re.sub(r'[^\d.]', '', v) or 0) >= 10): out['number'] = {'value': v, 'label': out['text']}   # the thumbnail's own figure first
    elif cd.get('number'): out['number'] = cd['number']
    if cd.get('split'): out['split'] = cd['split']
    if isinstance(story.get('banner'), dict): out['banner'] = story['banner']   # the newsletter banner template (engine/thumb.js banner)
    ok = [l for l in THUMB_LAYOUTS if l in ('face', 'editorial') or (l == 'diagram' and 'flow' in out) or (l == 'number' and 'number' in out) or (l == 'versus' and 'split' in out) or (l == 'banner' and 'banner' in out)]
    out['layouts'] = [l for l in ok if not layouts or l in layouts] or ok
    out['words'] = len(out['text'].split())
    return out
