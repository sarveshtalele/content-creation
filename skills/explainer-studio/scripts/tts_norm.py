"""tts_norm: deterministic written->spoken text for Kokoro. A beat's optional 'tts' field overrides everything.
Reads config/pronounce.json. Same input -> same output."""
import re
from common import cfg
_P = None
def P():
    global _P
    if _P is None: _P = cfg('pronounce.json')
    return _P
def spell(tok): return ' '.join(tok)
def norm(text, override=None):
    if override: return override
    p = P(); s = text.replace('’', "'").replace('“', '"').replace('”', '"').replace('—', ', ').replace('–', ' to ').replace('→', ' to ').replace('&', ' and ').replace('%', ' percent').replace('…', '...')
    for k in sorted(p['exact'], key=len, reverse=True): s = s.replace(k, p['exact'][k])
    s = re.sub(r'\b([A-Za-z][\w-]*)\.([a-z]{1,5})\b(?!\s*[A-Z])', lambda m: f"{m.group(1)} dot {p['ext'][m.group(2)]}" if m.group(2) in p['ext'] else m.group(0), s)
    s = re.sub(r'(?<=[A-Z])/(?=[A-Z])', ' ', s)
    def caps(m):
        w = m.group(0)
        if w in p['word_forms']: return p['word_forms'][w]
        if w in p['as_word']: return w
        return spell(w)
    s = re.sub(r'\b[A-Z]{2,6}s?\b', lambda m: caps(m) if not m.group(0).endswith('s') or m.group(0) in p['word_forms'] else spell(m.group(0)[:-1]) + 's', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s
BAD = re.compile(r"[`*_#<>{}\\|~^@]|https?://|\w/\w")
def lint(say, override=None):
    """tokens the TTS would mangle if there is no override; returns list of problems"""
    if override: return []
    t = norm(say); return [f'unspeakable "{m.group(0)}" in: {say[:50]}' for m in BAD.finditer(t)]
