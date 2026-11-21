#!/usr/bin/env python3
"""ingest: any source (URL, GitHub repo, local file/dir, stdin) -> compact, citable chunks.  Pure standard library.
Writes <out>/source.md (agent reads THIS once), source.chunks.json, source_full.txt, source.meta.json. Deterministic: same input -> same bytes."""
import argparse, json, math, os, re, subprocess, sys, tempfile, shutil, urllib.request, urllib.parse
from html.parser import HTMLParser

CHUNK_MIN, CHUNK_MAX = 140, 900
SKIP = {'script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'noscript', 'svg', 'button', 'iframe'}

class H2T(HTMLParser):
    """HTML -> markdown-ish text: headings (#), paragraphs, list items, code blocks."""
    def __init__(s): super().__init__(convert_charrefs=True); s.out = []; s.skip = 0; s.pre = 0; s.title = ''; s.in_title = False; s.cur = []; s.main = False
    def flush(s, prefix=''):
        t = re.sub(r'[ \t\r\f\v]+', ' ', ''.join(s.cur)).strip() if not s.pre else ''.join(s.cur).strip('\n')
        if t: s.out.append(prefix + t)
        s.cur = []
    def handle_starttag(s, tag, a):
        if tag == 'title': s.in_title = True
        if tag in SKIP: s.skip += 1; return
        if s.skip: return
        if tag in ('h1', 'h2', 'h3', 'h4'): s.flush(); s.cur = []; s._h = '#' * int(tag[1]) + ' '
        elif tag in ('p', 'div', 'section', 'article', 'br', 'tr'): s.flush()
        elif tag == 'li': s.flush(); s._li = True
        elif tag == 'pre': s.flush(); s.pre += 1
    def handle_endtag(s, tag):
        if tag == 'title': s.in_title = False
        if tag in SKIP: s.skip = max(0, s.skip - 1); return
        if s.skip: return
        if tag in ('h1', 'h2', 'h3', 'h4'): s.flush(getattr(s, '_h', '## ')); s._h = ''
        elif tag in ('p', 'li', 'div', 'section', 'article', 'tr'): s.flush('- ' if tag == 'li' else '')
        elif tag == 'pre': s.flush('```\n'); s.out[-1:] = [s.out[-1] + '\n```'] if s.out else []; s.pre = max(0, s.pre - 1)
    def handle_data(s, d):
        if s.in_title: s.title += d
        elif not s.skip: s.cur.append(d)

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (explainer-studio ingest)', 'Accept': 'text/html,text/markdown,text/plain,*/*'})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read(8_000_000); ct = r.headers.get('Content-Type', '')
    enc = re.search(r'charset=([\w-]+)', ct); return raw.decode(enc.group(1) if enc else 'utf-8', 'replace'), ct

def html_to_md(html):
    p = H2T(); p.feed(html); p.flush(); return p.title.strip(), '\n\n'.join(p.out)

def norm_text(t):
    t = t.replace('\r\n', '\n').replace('\r', '\n').replace(' ', ' ')
    return re.sub(r'\n{3,}', '\n\n', t).strip()

def gh_parts(u):
    m = re.match(r'https?://github\.com/([^/]+)/([^/#?]+?)(?:\.git)?/?$', u)
    return (m.group(1), m.group(2)) if m else None

def read_repo(root, label):
    """README + docs + manifests + layout + entry points, in priority order."""
    parts, title = [], label
    def rd(path, cap=9000):
        try: return open(path, encoding='utf-8', errors='replace').read()[:cap]
        except Exception: return ''
    names = sorted(os.listdir(root))
    readme = next((n for n in names if n.lower().startswith('readme')), None)
    if readme: parts.append((f'README ({readme})', rd(os.path.join(root, readme), 14000)))
    for mf in ('package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml'):
        if mf in names:
            t = rd(os.path.join(root, mf), 2500)
            if mf == 'package.json':
                try: j = json.loads(t); t = json.dumps({k: j.get(k) for k in ('name', 'description', 'scripts', 'bin', 'keywords') if k in j}, indent=1)
                except Exception: pass
            parts.append((mf, t))
    docs = []
    for dp, dn, fn in os.walk(root):
        dn[:] = sorted(d for d in dn if not d.startswith('.') and d not in ('node_modules', 'vendor', 'dist', 'build', '__pycache__', 'venv'))
        for f in sorted(fn):
            rel = os.path.relpath(os.path.join(dp, f), root)
            if f.lower().endswith('.md') and rel.count(os.sep) <= 2 and not (readme and rel == readme) and f.upper() not in ('LICENSE.MD', 'CHANGELOG.MD'): docs.append(rel)
    for rel in docs[:10]: parts.append((rel, rd(os.path.join(root, rel), 6000)))
    tree = []
    for dp, dn, fn in os.walk(root):
        dn[:] = sorted(d for d in dn if not d.startswith('.') and d not in ('node_modules', 'vendor', 'dist', 'build', '__pycache__', 'venv'))
        depth = os.path.relpath(dp, root).count(os.sep) if dp != root else 0
        if depth > 1: dn[:] = []; continue
        for d in dn: tree.append(os.path.relpath(os.path.join(dp, d), root) + '/')
        for f in sorted(fn)[:30]: tree.append(os.path.relpath(os.path.join(dp, f), root))
    parts.append(('Repository layout', '\n'.join(tree[:90])))
    for cand in ('src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.py', 'main.py', 'app.py', 'index.js', 'cli.py', 'src/lib.rs', 'main.go'):
        if os.path.exists(os.path.join(root, cand)): parts.append((cand, '```\n' + '\n'.join(rd(os.path.join(root, cand), 3000).split('\n')[:70]) + '\n```')); break
    return title, parts

def split_chunks(blocks):
    """blocks: [(heading, text)] -> chunks [{h, text}] sized CHUNK_MIN..CHUNK_MAX, headings kept as context."""
    out = []
    for head, text in blocks:
        h = head; buf = ''
        def emit():
            nonlocal buf
            if buf.strip(): out.append({'h': h, 'text': buf.strip()})
            buf = ''
        for para in re.split(r'\n\s*\n', norm_text(text)):
            para = para.strip()
            if not para: continue
            m = re.match(r'^(#{1,4})\s+(.*)$', para)
            if m and '\n' not in para:
                emit(); h = (head + ' › ' if head and head != m.group(2) else '') + m.group(2).strip(); out.append({'h': h, 'text': m.group(2).strip(), 'heading': True}); continue
            if para.startswith('```'):
                emit(); out.append({'h': h, 'text': para[:CHUNK_MAX]}); continue
            if len(para) > CHUNK_MAX:
                emit()
                for s in re.split(r'(?<=[.!?])\s+', para):
                    if len(buf) + len(s) + 1 > CHUNK_MAX: emit()
                    buf += (' ' if buf else '') + s
                emit(); continue
            if buf and len(buf) + len(para) + 1 > CHUNK_MAX: emit()
            buf += ('\n' if buf else '') + para
            if len(buf) >= CHUNK_MIN and not para.endswith(':'): emit()
        emit()
    # merge bare headings into the next chunk, drop empties
    merged, i = [], 0
    while i < len(out):
        c = out[i]
        if c.get('heading') and i + 1 < len(out) and not out[i + 1].get('heading'):
            nxt = out[i + 1]; merged.append({'h': nxt['h'], 'text': nxt['text']}); i += 2; continue
        if c.get('heading') and len(c['text']) < 4: i += 1; continue
        merged.append({'h': c['h'], 'text': c['text']}); i += 1
    return merged

WORD = re.compile(r"[A-Za-z][A-Za-z0-9_.'-]{2,}")
STOP = set('the and for are but not you all can had her was one our out has have this that with from they been were will your what when which their there would about into than them these those then also more some such only over just like make made does did its it\'s how why who'.split())
def toks(t): return [w.lower() for w in WORD.findall(t) if w.lower() not in STOP]

def salience(chunks):
    n = len(chunks); df = {}
    for c in chunks:
        for w in set(toks(c['text'])): df[w] = df.get(w, 0) + 1
    out = []
    for i, c in enumerate(chunks):
        ws = toks(c['text']); tf = {}
        for w in ws: tf[w] = tf.get(w, 0) + 1
        sc = sum(math.log(1 + v) * math.log((n + 1) / (df[w])) for w, v in tf.items()) / math.sqrt(max(8, len(ws)))
        sc *= 1.25 if i < max(2, n // 8) else 1.0
        out.append(sc)
    return out

def build(title, blocks, url, out_dir, max_chars):
    chunks = split_chunks(blocks)
    full = '\n\n'.join(c['text'] for c in chunks)
    sal = salience(chunks)
    keep = list(range(len(chunks))); dropped = []
    if sum(len(c['text']) for c in chunks) > max_chars:
        order = sorted(range(len(chunks)), key=lambda i: (-sal[i], i)); used = 0; sel = set()
        for i in order:
            if used + len(chunks[i]['text']) > max_chars: continue
            sel.add(i); used += len(chunks[i]['text'])
        keep = sorted(sel); dropped = [i for i in range(len(chunks)) if i not in sel]
    items = []
    for n, i in enumerate(keep, 1): items.append({'id': f'c{n:02d}', 'h': chunks[i]['h'], 'text': chunks[i]['text'], 's': round(sal[i], 4)})
    k = min(14, max(3, math.ceil(.35 * len(items))))
    salient = [c['id'] for c in sorted(items, key=lambda c: (-c['s'], c['id']))[:k]]
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'source.md'), 'w', encoding='utf-8') as f:
        f.write(f'# {title}\n' + (f'<{url}>\n' if url else '') + '\n')
        last = None
        for c in items:
            if c['h'] != last: f.write(f'\n## {c["h"]}\n' if c['h'] and c['h'] != title else ''); last = c['h']
            f.write(f'[{c["id"]}] {c["text"]}\n\n')
    json.dump(items, open(os.path.join(out_dir, 'source.chunks.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    open(os.path.join(out_dir, 'source_full.txt'), 'w', encoding='utf-8').write(full)
    meta = {'title': title, 'url': url, 'chunks': len(items), 'chars': sum(len(c['text']) for c in items), 'approx_tokens': sum(len(c['text']) for c in items) // 4,
            'salient': salient, 'dropped_chunks': len(dropped), 'dropped_headings': sorted({chunks[i]['h'] for i in dropped})[:12]}
    json.dump(meta, open(os.path.join(out_dir, 'source.meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return meta

def run(src, out_dir, max_chars=36000, text=None):
    url = ''
    if text is not None or src == '-':
        t = text if text is not None else sys.stdin.read(); title = next((l.lstrip('# ').strip() for l in t.split('\n') if l.strip()), 'Source')[:100]
        return build(title, [('', t)], '', out_dir, max_chars)
    if re.match(r'https?://', src):
        url = src; gp = gh_parts(src)
        if gp:
            tmp = tempfile.mkdtemp(prefix='es_repo_')
            try:
                subprocess.run(['git', 'clone', '--depth', '1', '--quiet', f'https://github.com/{gp[0]}/{gp[1]}.git', tmp], check=True, timeout=180, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                title, parts = read_repo(tmp, f'{gp[0]}/{gp[1]}'); return build(title, parts, url, out_dir, max_chars)
            finally: shutil.rmtree(tmp, ignore_errors=True)
        m = re.match(r'https?://github\.com/([^/]+)/([^/]+)/blob/(.+)$', src)
        if m: src = f'https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/{m.group(3)}'
        body, ct = fetch(src)
        if 'html' in ct.lower() or body.lstrip().lower().startswith(('<!doctype', '<html')):
            title, md = html_to_md(body)
        else: title, md = (next((l.lstrip('# ').strip() for l in body.split('\n') if l.strip()), 'Source')[:100]), body
        return build(title or src, [('', md)], url, out_dir, max_chars)
    if os.path.isdir(src):
        title, parts = read_repo(src, os.path.basename(os.path.abspath(src))); return build(title, parts, '', out_dir, max_chars)
    if not os.path.exists(src): sys.exit(f'ingest: not found: {src}')
    if src.lower().endswith('.pdf'):
        if not shutil.which('pdftotext'): sys.exit('ingest: PDF needs pdftotext (poppler); or paste the text into a .txt file')
        t = subprocess.run(['pdftotext', '-layout', src, '-'], capture_output=True, text=True).stdout
    else: t = open(src, encoding='utf-8', errors='replace').read()
    if src.lower().endswith(('.html', '.htm')): title, t = html_to_md(t)
    else: title = next((l.lstrip('# ').strip() for l in t.split('\n') if l.strip()), os.path.basename(src))[:100]
    return build(title, [('', t)], '', out_dir, max_chars)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__); ap.add_argument('src'); ap.add_argument('--out', default='.'); ap.add_argument('--max-chars', type=int, default=36000)
    a = ap.parse_args(); m = run(a.src, a.out, a.max_chars)
    print(json.dumps(m, ensure_ascii=False)); print(f'-> {os.path.join(a.out, "source.md")}  (read it once; cite chunk ids [cNN])')
