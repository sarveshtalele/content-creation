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
_ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
_TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
def say_int(n):
    if n < 20: return _ONES[n]
    if n < 100: return _TENS[n // 10] + ('' if n % 10 == 0 else ' ' + _ONES[n % 10])
    if n < 1000: return _ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + say_int(n % 100))
    if n < 1000000: return say_int(n // 1000) + ' thousand' + ('' if n % 1000 == 0 else ' ' + say_int(n % 1000))
    return str(n)
def numbers(s):
    s = re.sub(r'(?<![\w.])(\d+)\.(\d+)(x?)(?![\w.])', lambda m: say_int(int(m.group(1))) + ' point ' + ' '.join(_ONES[int(c)] for c in m.group(2)) + (' times' if m.group(3) else ''), s)   # 1.3 -> one point three
    s = re.sub(r'(?<![\w.])(\d{1,3})(,\d{3})+(?![\w])', lambda m: say_int(int(m.group(0).replace(',', ''))), s)
    s = re.sub(r'(?<![\w.])(\d+)x\b', lambda m: say_int(int(m.group(1))) + ' times', s)
    return re.sub(r'(?<![\w.])\d+(?![\w.])', lambda m: say_int(int(m.group(0))) if int(m.group(0)) < 1000000 else m.group(0), s)
_LEAD = re.compile(r'^(First|Second|Third|Next|Then|Finally|Now|So|And|But|Still|Instead|Meanwhile|Today|Here)\b(?![,.!?])')
def pauses(s):   # commas and full stops are where the voice breathes: make them explicit and consistent
    s = s.replace(';', ',').replace(': ', ', ')
    parts = re.split(r'(?<=[.!?])\s+', s)
    parts = [_LEAD.sub(lambda m: m.group(1) + ',', x, 1) if len(x.split()) > 5 else x for x in parts]
    return ' '.join(parts)
def norm(text, override=None):
    if override: return override
    p = P(); s = text.replace('’', "'").replace('“', '"').replace('”', '"').replace('—', ', ').replace('–', ' to ').replace('→', ' to ').replace('&', ' and ').replace('%', ' percent').replace('…', '...')
    for k in sorted(p['exact'], key=len, reverse=True): s = s.replace(k, p['exact'][k])
    s = re.sub(r'\b([A-Za-z][\w-]*)\.([a-z]{1,5})\b(?!\s*[A-Z])', lambda m: f"{m.group(1)} dot {p['ext'][m.group(2)]}" if m.group(2) in p['ext'] else m.group(0), s)
    s = re.sub(r'(?<=[A-Z])/(?=[A-Z])', ' ', s)
    sp = set(p.get('spell', []))
    def caps(m):
        w = m.group(0)
        if w in p['word_forms']: return p['word_forms'][w]
        if w in p['as_word']: return w
        base = w[:-1] if w.endswith('s') and w[:-1] in sp else w
        if base in sp: return spell(base) + ('s' if base != w else '')
        if len(w) >= 4 or re.search(r'[AEIOU]', w) and len(w) >= 3: return w.lower()   # shouted words and code names (SKILL, ONLY, NEVER) are read as words, never letter by letter
        return spell(w)
    s = re.sub(r'\b[A-Z]{2,6}s?\b', caps, s)
    s = re.sub(r'[`*#]+', '', s); s = re.sub(r'(?<=[A-Za-z])_(?=[A-Za-z])', ' ', s)     # code ticks and snake_case never reach the voice
    s = numbers(s); s = pauses(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s
BAD = re.compile(r"[`*_#<>{}\\|~^@]|https?://|\w/\w")
def lint(say, override=None):
    """tokens the TTS would mangle if there is no override; returns list of problems"""
    if override: return []
    t = norm(say); return [f'unspeakable "{m.group(0)}" in: {say[:50]}' for m in BAD.finditer(t)]
