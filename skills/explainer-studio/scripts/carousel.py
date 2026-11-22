"""carousel: deck compiler (story.carousel -> list of slides), short links, first-comment text and a dependency-free PDF writer. Pure standard library."""
import math, os, re, struct, urllib.parse, zlib

HOOK_STYLES = ('contradiction', 'specificity', 'timeframe', 'pov', 'plain')
HOOKS = {   # patterns, not quotes: how each hook style is built from the source's own facts
  'contradiction': 'two true statements that pull against each other, resolved by the source ("X is simple. Doing it right is not.")',
  'specificity': 'one oddly specific moment a single reader recognises, then the promise ("If you have ever ..., this is for you")',
  'timeframe': 'a short, real timeframe taken from the source ("In 30 seconds ...", "Three months ago ..."). Never invent one',
  'pov': 'advice phrased as a scene ("POV: you finally ...") so the reader recognises themselves before being taught',
  'plain': 'a direct, concrete statement of the payoff, no trick',
}
PER_PAGE = 3
DEFAULT_CTA = {'title': 'Swipe for the next one', 'mid': 'Keep swiping', 'last_follow': 'Follow for more like this', 'last_comments': 'Links are in the comments'}

def pages(items, per=PER_PAGE):
    n = len(items); k = max(1, math.ceil(n / per)) if n else 0
    base, extra = (divmod(n, k) if k else (0, 0))                      # balanced pages: 5 items -> 3+2, 4 -> 2+2
    out, i = [], 0
    for p in range(k):
        m = base + (1 if p < extra else 0); out.append(items[i:i + m]); i += m
    return out

def deck_len(c):
    return 1 + len(c.get('slides') or []) + len(pages((c.get('resources') or {}).get('items') or [])) + 1

def short_url(u):
    p = urllib.parse.urlparse(u); host = (p.hostname or '').removeprefix('www.'); path = p.path.rstrip('/')
    s = host + path
    return s if len(s) <= 34 else s[:33] + '…'

def compile_deck(story):
    """-> list of slide dicts the page renders. Per-slide 'cta' falls back to carousel.cta_default, then to a built-in line."""
    c = story['carousel']; cd = c.get('cta_default'); deck = []
    t = dict(c['title']); deck.append({'type': 'title', 'hook': t['hook'], 'sub': t.get('sub', ''), 'kicker': t.get('kicker', ''), 'icon': t.get('icon', 'bolt'), 'layout': t.get('layout', 'classic'), 'prompt': t.get('prompt', ''), 'accent': t.get('accent', ''), 'photo': bool(t.get('photo')), 'chips': t.get('chips', []), 'window': t.get('window', ''), 'cta': t.get('cta') or cd or DEFAULT_CTA['title']})
    for s in c.get('slides') or []:
        d = dict(s); d['short'] = short_url(s['url']) if s.get('url') else ''; d['cta'] = s.get('cta') or cd or DEFAULT_CTA['mid']; deck.append(d)
    R = c.get('resources') or {}; its = R.get('items') or []; pg = pages(its); off = 0
    for k, grp in enumerate(pg):
        title = R.get('title', 'Resources') + (f' ({k + 1}/{len(pg)})' if len(pg) > 1 else '')
        deck.append({'type': 'resources', 'title': title, 'offset': off, 'items': [{'name': x['name'], 'why': x['why'], 'short': short_url(x['url'])} for x in grp], 'cta': R.get('cta') or cd or DEFAULT_CTA['mid']}); off += len(grp)
    cl = c['closing']; kind = cl.get('kind', 'follow')
    deck.append({'type': 'closing', 'title': cl['title'], 'lines': cl.get('lines', []), 'cta': cl.get('cta') or DEFAULT_CTA['last_comments' if kind == 'comments' else 'last_follow']})
    return deck

def comment_text(story, brand):
    """The first comment to paste under the post: every full link, numbered, plus the follow line."""
    c = story['carousel']; R = c.get('resources') or {}; out = []
    if c.get('comment'): out.append(c['comment'].strip())
    its = list(R.get('items') or []) + [{'name': x.get('title', ''), 'url': x['url']} for x in c.get('slides') or [] if x.get('type') == 'shot' and x.get('url')]
    if its:
        out.append((R.get('title') or c.get('links_title') or 'Links') + ':'); out += [f'{i}. {x["name"]} - {x["url"]}' for i, x in enumerate(its, 1)]
    out.append(f'{brand.get("follow", "Follow")} {brand["name"]} - {brand["tagline"]}')
    return '\n\n'.join(out[:1] + ['\n'.join(out[1:-1])] + out[-1:]) if len(out) > 2 else '\n\n'.join(out)

def write_pdf(jpegs, out, w=1080, h=1350):
    """One page per JPEG (page size = pixel size at 72 dpi, so the 4:5 shape is kept). Hand-written PDF 1.4: no dependency, deterministic bytes."""
    objs = []; add = lambda b: (objs.append(b), len(objs))[1]
    add(b'<< /Type /Catalog /Pages 2 0 R >>'); add(b'')                 # 1 catalog, 2 pages (filled below)
    kids = []
    for i, jp in enumerate(jpegs):
        data = open(jp, 'rb').read()
        img = add(b'<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n' % (w, h, len(data)) + data + b'\nendstream')
        content = b'q %d 0 0 %d 0 0 cm /Im0 Do Q' % (w, h)
        cs = add(b'<< /Length %d >>\nstream\n' % len(content) + content + b'\nendstream')
        kids.append(add(b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /XObject << /Im0 %d 0 R >> >> /Contents %d 0 R >>' % (w, h, img, cs)))
    objs[1] = b'<< /Type /Pages /Kids [' + b' '.join(b'%d 0 R' % k for k in kids) + b'] /Count %d >>' % len(kids)
    buf = bytearray(b'%PDF-1.4\n'); offs = []
    for i, o in enumerate(objs, 1): offs.append(len(buf)); buf += b'%d 0 obj\n' % i + o + b'\nendobj\n'
    x = len(buf); buf += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1) + b''.join(b'%010d 00000 n \n' % o for o in offs)
    buf += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, x)
    with open(out, 'wb') as f: f.write(buf)

def pdf_pages(path):
    """Page count of a PDF written by write_pdf (used by the review gate)."""
    return len(re.findall(rb'/Type /Page /', open(path, 'rb').read()))

def slide_path(c, num):
    """Where the CTA of deck slide `num` (1-based) lives in story.carousel: title, a content slide, the shared resources CTA, or the closing."""
    n_content = len(c.get('slides') or []); n_res = len(pages((c.get('resources') or {}).get('items') or []))
    if num == 1: return 'carousel.title.cta'
    if num <= 1 + n_content: return f'carousel.slides[{num - 2}].cta'
    if num <= 1 + n_content + n_res: return 'carousel.resources.cta'
    return 'carousel.closing.cta'
