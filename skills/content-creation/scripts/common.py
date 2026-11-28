"""Shared text utilities. Pure standard library. Everything here is deterministic."""
import re, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE)
def data_home():
    """The person's data folder (brand, photo, library, runtime): $CONTENT_CREATION_HOME, else ~/.cache/content-creation.
    Before 4.0 it was ~/.cache/explainer-studio ($EXPLAINER_HOME): that is still honoured, and the old folder is moved once."""
    env = os.environ.get('CONTENT_CREATION_HOME') or os.environ.get('EXPLAINER_HOME')
    if env: return env
    new = os.path.join(os.path.expanduser('~'), '.cache', 'content-creation'); old = os.path.join(os.path.dirname(new), 'explainer-studio')
    if not os.path.exists(new) and os.path.isdir(old):
        try: os.rename(old, new)
        except OSError: return old   # cannot move it (another process holds it): keep using the old one
    link = os.path.join(SKILL, 'runtime', 'node_modules')   # setup linked the shared runtime from the old folder: point it at the new one
    if os.path.islink(link) and 'explainer-studio' in os.readlink(link) and os.path.isdir(os.path.join(new, 'node', 'node_modules')):
        try: os.remove(link); os.symlink(os.path.join(new, 'node', 'node_modules'), link, target_is_directory=True)
        except OSError: pass
    return new
STOP = set("""a an the and or but if then than so as at by for from in into of on onto to up with without over under about after before between through during is are was were be been being am do does did done have has had having it its it's this that these those there here they them their he she his her we our you your i me my not no nor can could will would shall should may might must just also very more most much many some any each every all both either neither other another such only own same too how what when where which who whom whose why""".split())
def clean_md(t):
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', t)
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace(' ', ' ').replace('…', '...')
    t = re.sub(r'[*_`#>]+', '', t)
    return t
def norm_q(t):   # for verbatim quote matching
    t = clean_md(t).lower(); t = re.sub(r'\\', '', t)
    return re.sub(r'\s+', ' ', t).strip()
def stem(w):
    for suf in ('ing', 'ies', 'ed', 'es', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3: return w[:-len(suf)] + ('y' if suf == 'ies' else '')
    return w
def words(t): return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", clean_md(t).lower())
def content_words(t): return [stem(w) for w in words(t) if w not in STOP and len(w) >= 3]
def load(p):
    with open(p, encoding='utf-8') as f: return json.load(f)
def dump(o, p):
    os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: json.dump(o, f, ensure_ascii=False, indent=1)
def cfg(name): return load(os.path.join(SKILL, 'config', name))
def icon_names():
    s = open(os.path.join(SKILL, 'engine', 'kit.js'), encoding='utf-8').read()
    blk = s[s.index('const I = {'): s.index('export const ICON_NAMES')]
    return sorted(set(re.findall(r"^\s{2}(\w+): '", blk, re.M)))
# entities that must exist in the source: numbers, code-like tokens, ALLCAPS, camelCase, mid-sentence Capitalised words
def entities(text):
    t = clean_md(text); out = set()
    for m in re.finditer(r"[A-Za-z0-9_~./\\-]*[A-Za-z0-9_][A-Za-z0-9_~./\\-]*", t):
        w = m.group(0).strip('.,;:!?)("\'-/')
        if not w: continue
        if re.search(r'\d', w): out.add(w.lower().rstrip('%')); continue
        if re.search(r'[._/~\\]', w) and len(w) > 2 and not re.fullmatch(r'[a-z]+(?:\.[a-z]+)?', w) or re.fullmatch(r'[A-Za-z]+\.[A-Za-z]{1,5}', w) and w.lower() != w:
            out.add(w.lower()); continue
        if re.fullmatch(r'[A-Z]{2,}[A-Za-z]*', w) or re.search(r'[a-z][A-Z]', w): out.add(w.lower())
    for sent in re.split(r'(?<=[.!?:])\s+|\n', t):
        toks = re.findall(r"[A-Za-z][A-Za-z'-]*", sent)
        for i, w in enumerate(toks):
            if i > 0 and w[0].isupper() and w.upper() != w and w.lower() not in STOP: out.add(w.lower())
    return out
def in_source(ent, src_norm, src_words):
    e = ent.lower()
    if re.search(r'[._/~\\\d%]', e): return e in src_norm
    return e in src_words or stem(e) in src_words or e in src_norm
def source_index(full):
    n = norm_q(full); ws = set(words(full)); ws |= {stem(w) for w in ws}; return n, ws
