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
        if m: num = {'value': m.group(1).strip(), 'label': t}; break
    out = {'hook': hook, 'sub': sub, 'kicker': cv.get('kicker', ''), 'chips': chips, 'icons': [i['icon'] for p in lists for i in _items(p) if i['icon']][:4]}
    if flow: out['flow'] = {'title': flow['title'], 'steps': _items(flow)[:4]}
    if num: out['number'] = num
    if len(lists) >= 2: out['split'] = [{'head': p['title'], 'items': [i['title'] for i in _items(p)][:3]} for p in lists[:2]]
    avail = [l for l in LAYOUTS if l in ('question', 'face') or (l == 'hero' and 'flow' in out) or (l in out)]
    pick = layout or cv.get('layout') or 'hero'
    out['layouts'] = avail; out['chosen'] = pick if pick in avail else avail[0]
    return out
