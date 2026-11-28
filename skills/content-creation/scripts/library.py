"""The Library: everything this plugin has made on this machine, in one list.

Two sources: the Design Studio's own jobs (<EH>/studio_jobs/*) and every project folder a `studio.py build` ran in (remembered in
<EH>/library_dirs.json). Nothing is copied; files are listed where they are. The web app serves them by an id issued here, never by path."""
import glob, hashlib, json, os, time

def _eh():
    import studio as ST; return ST.EH

def _reg():
    return os.path.join(_eh(), 'library_dirs.json')

def register(work):
    work = os.path.abspath(work)
    try: cur = json.load(open(_reg(), encoding='utf-8'))
    except Exception: cur = []
    if work not in cur:
        os.makedirs(_eh(), exist_ok=True); open(_reg(), 'w', encoding='utf-8').write(json.dumps((cur + [work])[-200:]))

def _title(d):
    w = os.path.join(d, 'walk', 'walk.json')
    if os.path.isfile(w):
        try: return json.load(open(w, encoding='utf-8')).get('title') or os.path.basename(d)
        except Exception: pass
    try: m = json.load(open(os.path.join(d, 'story.json'), encoding='utf-8')).get('meta', {}); return m.get('title') or os.path.basename(d)
    except Exception: return os.path.basename(d)

KINDS = {'carousel': 'Carousel', 'image': 'Image', 'gif': 'GIF', 'reel': 'Reel', 'walkthrough': 'Walkthrough', 'post': 'Post'}

def _kinds(d):
    """{kind: [files]} for one project folder."""
    out = os.path.join(d, 'out'); k = {}
    g = lambda *p: sorted(glob.glob(os.path.join(*p)))
    pdf = g(out, '*.pdf'); pngs = g(out, 'carousel', '*.png'); cmt = g(out, '*comment.txt')
    if pdf or (pngs and len(pngs) > 1): k['carousel'] = pdf + pngs + cmt
    single = [f for f in g(d, '*.png')]
    if single and not k.get('carousel'): k['image'] = single
    elif single: k['image'] = single
    if g(out, '*.gif'): k['gif'] = g(out, '*.gif')
    walk = g(out, '*-walkthrough*')
    if walk: k['walkthrough'] = sorted(walk, key=lambda f: not f.endswith('.mp4'))
    reel = [f for f in g(out, '*.mp4') if '-walkthrough' not in f]
    if reel: k['reel'] = reel + g(out, '*.srt') + g(out, 'covers', '*-cover-*.png')
    post = g(out, '*post.txt') + g(out, '*post*.png')
    if post: k['post'] = post
    return k

def _dirs():
    jobs = glob.glob(os.path.join(_eh(), 'studio_jobs', '*'))
    try: reg = json.load(open(_reg(), encoding='utf-8'))
    except Exception: reg = []
    return [d for d in dict.fromkeys(jobs + reg) if os.path.isdir(d)]

def items():
    """Newest first. Each item: {id, kind, label, title, when, thumb, files:[{id,name,size}]}. `index` maps file id -> real path (for the server only)."""
    res, index = [], {}
    fid = lambda p: hashlib.sha1(os.path.abspath(p).encode()).hexdigest()[:16]
    for d in _dirs():
        for kind, files in _kinds(d).items():
            files = [f for f in files if os.path.isfile(f)]
            if not files: continue
            for f in files: index[fid(f)] = f
            thumbs = [f for f in files if f.lower().endswith(('.png', '.jpg', '.gif'))]
            res.append({'id': fid(d) + kind, 'kind': kind, 'label': KINDS[kind], 'title': _title(d), 'when': int(max(os.path.getmtime(f) for f in files)),
                        'thumb': fid(thumbs[0]) if thumbs else '', 'files': [{'id': fid(f), 'name': os.path.basename(f), 'size': os.path.getsize(f)} for f in files]})
    res.sort(key=lambda x: -x['when']); return res, index
