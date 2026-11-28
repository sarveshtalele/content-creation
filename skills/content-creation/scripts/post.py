"""post: deterministic LinkedIn post from story.post + brand CTA + the source link (if the user shared one)."""
import re
from common import *
def build(story, brand):
    p = story['post']; url = story['meta'].get('url', '')
    lines = [p['hook'].strip(), '']
    lines += ['→ ' + b['t'].strip() for b in p['bullets']]
    if url: lines += ['', ('🔗 Repo: ' if re.match(r'https?://github\.com/[^/]+/[^/]+/?$', url) else '📖 Read: ') + url]
    lines += [''] + brand['post_cta']
    txt = '\n'.join(lines) + '\n'
    return txt
def lint(txt, story):
    errs = []; mx = 1100 + 330
    if len(txt) > mx: errs.append(f'post is {len(txt)} chars (max {mx} incl. CTA)')
    if not txt.strip().split('\n')[0].endswith('?'): errs.append('first line must be a question')
    if txt.count('\n→ ') + (1 if txt.split('\n')[2:3] and txt.split('\n')[2].startswith('→ ') else 0) < 3: errs.append('need ≥3 arrow bullets')
    return errs
