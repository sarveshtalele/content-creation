"""Turns Design Studio choices into real files: writes a project, runs the normal build, and hands back what was asked for."""
import json, os, re, shutil, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import designs as DS

def _brand_name():
    try:
        import studio as ST; return ST.brand().get('name', '')
    except Exception: return ''

def render(jobs_root, items, closing=None, theme='sky', mode='single', fmt='images'):
    """mode single: one image (the chosen cover or infographic). mode carousel: cover + infographics + closing, as pdf / images / both.
    Returns {'ok', 'log', 'files': [paths], 'job': dir}."""
    if mode not in ('single', 'carousel') or fmt not in ('pdf', 'images', 'both'): raise ValueError('mode/format')
    if not items or len(items) > 7: raise ValueError('choose 1 to 7 designs')
    single = mode == 'single'
    if single and len(items) != 1: raise ValueError('single mode takes exactly one design')
    story, src = DS.assemble(items, closing, theme, single, _brand_name())
    job = _jobdir(jobs_root, story['meta']['slug'])
    json.dump(story, open(os.path.join(job, 'story.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for n in ('source_full.txt', 'source.md'): open(os.path.join(job, n), 'w', encoding='utf-8', newline='\n').write(src)
    json.dump([{'id': 'c01', 'h': '', 'text': src, 's': 1.0}], open(os.path.join(job, 'source.chunks.json'), 'w', encoding='utf-8'))
    json.dump({'title': story['meta']['title'], 'url': '', 'chunks': 1, 'chars': len(src), 'approx_tokens': len(src) // 4, 'salient': ['c01'], 'dropped_chunks': 0, 'dropped_headings': []}, open(os.path.join(job, 'source.meta.json'), 'w', encoding='utf-8'))
    cmd = [sys.executable, os.path.join(HERE, 'studio.py'), 'build', job, '--artifacts', 'carousel', '--format', 'images' if single else fmt]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=1800)
    log = (r.stdout + r.stderr)[-5000:]; out = os.path.join(job, 'out'); files = []
    ok = r.returncode == 0 and 'BUILD COMPLETE' in log
    if ok:
        slug = story['meta']['slug']; pngs = sorted(f for f in os.listdir(os.path.join(out, 'carousel')) if f.endswith('.png'))
        if single:
            first_is_cover = any(it['design'].startswith('cover-') for it in items); k = 1 if first_is_cover else 2
            src_png = os.path.join(out, 'carousel', pngs[k - 1]); dst = os.path.join(job, f'{slug}.png'); shutil.copy(src_png, dst); files = [dst]
        else:
            if fmt in ('images', 'both'): files += [os.path.join(out, 'carousel', f) for f in pngs]
            if fmt in ('pdf', 'both'): files += [os.path.join(out, f) for f in os.listdir(out) if f.endswith('.pdf')]
            files += [os.path.join(out, f) for f in os.listdir(out) if f.endswith('comment.txt')]
    if ok and files:                                    # the finished files also go to the shared outputs folder (see studio.outputs_root)
        import studio as _ST
        od = os.path.join(_ST.outputs_root(), story['meta']['slug']); os.makedirs(od, exist_ok=True)
        for f in files: shutil.copy2(f, os.path.join(od, os.path.basename(f)))
    return {'ok': ok, 'log': log, 'files': files, 'job': job}


def _project(job, story, src):
    """write the files a normal build expects (story + a one-chunk source made of the person's own words)"""
    os.makedirs(job, exist_ok=True); json.dump(story, open(os.path.join(job, 'story.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    for n in ('source_full.txt', 'source.md'): open(os.path.join(job, n), 'w', encoding='utf-8', newline='\n').write(src)
    json.dump([{'id': 'c01', 'h': '', 'text': src, 's': 1.0}], open(os.path.join(job, 'source.chunks.json'), 'w', encoding='utf-8'))
    json.dump({'title': story['meta']['title'], 'url': '', 'chunks': 1, 'chars': len(src), 'approx_tokens': len(src) // 4, 'salient': ['c01'], 'dropped_chunks': 0, 'dropped_headings': []}, open(os.path.join(job, 'source.meta.json'), 'w', encoding='utf-8'))

def _jobdir(root, slug):
    """create and return a new job folder; claimed atomically because parallel jobs (samples, the app) can share a slug and second"""
    base = os.path.join(root, time.strftime('%Y%m%d-%H%M%S') + '-' + slug); job = base; n_ = 1
    while True:
        try: os.makedirs(job); return job
        except FileExistsError: n_ += 1; job = f'{base}-{n_}'

def cover_job(root, v):
    """Designed Reel covers from the studio form: hook, sub, chips, steps (3-4), optional layout. Returns {'ok','log','files','job'}"""
    hook = (v.get('hook') or '').strip()[:64]
    if len(hook) < 10: raise ValueError('Write a hook of at least 10 characters.')
    steps = [{'label': str(x)[:28]} for x in (v.get('steps') or []) if str(x).strip()][:4]
    chips = [str(x)[:16] for x in (v.get('chips') or []) if str(x).strip()][:4]
    slug = re.sub(r'[^a-z0-9]+', '-', hook.lower()).strip('-')[:40] or 'cover'
    story = {'meta': {'title': hook, 'slug': slug}, 'scenes': [{'p': {'q': hook, 'sub': (v.get('sub') or '')[:90], 'chips': chips}}] + ([{'p': {'title': (v.get('flow_title') or 'How it works')[:40], 'steps': steps}}] if len(steps) >= 2 else []),
             'reel': {'cover': {'layout': v['layout']}} if v.get('layout') else {}}
    job = _jobdir(root, slug); _project(job, story, ' '.join([hook, v.get('sub') or ''] + chips + [s['label'] for s in steps]) + ' ' + _brand_name())
    r = subprocess.run([sys.executable, os.path.join(HERE, 'studio.py'), 'cover', job] + (['--layout', v['layout']] if v.get('layout') else []), capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=600)
    cd = os.path.join(job, 'out', 'covers'); files = sorted(os.path.join(cd, f) for f in os.listdir(cd)) if os.path.isdir(cd) else []
    return {'ok': r.returncode == 0 and bool(files), 'log': (r.stdout + r.stderr)[-3000:], 'files': files, 'job': job}

def thumb_job(root, v):
    """Thumbnails / blog covers from the gallery panel: text (6-40), kicker, sub, chips, steps, two lists; layouts and sizes. Returns {'ok','log','files','job'}"""
    text = (v.get('text') or '').strip()[:40]
    if len(text) < 6: raise ValueError('Write the thumbnail text: 3 to 6 words.')
    th = {'text': text}
    if (v.get('kicker') or '').strip(): th['kicker'] = v['kicker'].strip()[:26]
    if (v.get('sub') or '').strip(): th['sub'] = v['sub'].strip()[:90]
    ch = [str(x).strip()[:16] for x in (v.get('chips') or []) if str(x).strip()][:4]
    st = [str(x).strip()[:28] for x in (v.get('steps') or []) if str(x).strip()][:4]
    if ch: th['chips'] = ch
    if len(st) >= 2: th['steps'] = st
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:40] or 'thumb'
    story = {'meta': {'title': text, 'slug': slug}, 'thumb': th}
    job = _jobdir(root, slug + '-thumbs'); _project(job, story, ' '.join([text, th.get('kicker', ''), th.get('sub', '')] + ch + st) + ' ' + _brand_name())
    sizes = [s_ for s_ in (v.get('sizes') or []) if s_ in ('youtube', 'og', 'newsletter', 'devto', 'hashnode')]; lays = [l for l in (v.get('layouts') or []) if l in ('face', 'number', 'diagram', 'versus', 'editorial')]
    cmd = [sys.executable, os.path.join(HERE, 'studio.py'), 'thumbs', job] + (['--sizes', ','.join(sizes)] if sizes else []) + (['--layouts', ','.join(lays)] if lays else [])
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=900, cwd=job)
    td = os.path.join(job, 'out', 'thumbs'); files = sorted(os.path.join(td, f) for f in os.listdir(td)) if os.path.isdir(td) else []
    return {'ok': r.returncode == 0 and bool(files), 'log': (r.stdout + r.stderr)[-3000:], 'files': files, 'job': job}

def walk_job(root, spec, device='mobile'):
    """Prepare a walkthrough job folder; the caller runs studio.py walkthrough on it in the background."""
    if not isinstance(spec, dict) or not (spec.get('title') or '').strip(): raise ValueError('Give the guide a title.')
    st = spec.get('steps') or []
    if not (2 <= len(st) <= 12): raise ValueError('Add 2 to 12 steps.')
    for s_ in st:
        if s_.get('action') not in ('goto', 'click', 'fill', 'press', 'hover', 'scroll', 'wait'): raise ValueError('Unknown action: ' + str(s_.get('action')))
        if s_.get('action') == 'goto' and not re.match(r'^https?://', s_.get('url') or ''): raise ValueError('Each "open" step needs an http(s) address.')
    slug = re.sub(r'[^a-z0-9]+', '-', spec['title'].lower()).strip('-')[:40] or 'walkthrough'
    job = _jobdir(root, slug + '-walk'); json.dump(spec, open(os.path.join(job, 'steps.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    return job, [sys.executable, os.path.join(HERE, 'studio.py'), 'walkthrough', job, '--steps', os.path.join(job, 'steps.json'), '--device', 'desktop' if device == 'desktop' else 'mobile']

def make_samples(dest, only=None):
    """Render design samples through the real engine into small JPG thumbnails (the studio's preloaded samples and the catalogue).
    only: list of design ids (default: every design). Runs four builds at a time; prints FAILED with the layout log for any design that does not pass."""
    from PIL import Image
    from concurrent.futures import ThreadPoolExecutor
    import tempfile; os.makedirs(dest, exist_ok=True); root = tempfile.mkdtemp(prefix='samples-'); bad = []
    def one(d):
        r = render(root, [{'design': d['id'], 'values': d['sample']}], theme=d['theme'], mode='single')
        if not r['ok']: return d['id'], r['log'][-900:]
        Image.open(r['files'][0]).convert('RGB').resize((540, 675), Image.LANCZOS).save(os.path.join(dest, d['id'] + '.jpg'), quality=88, optimize=True); return d['id'], None
    with ThreadPoolExecutor(4) as ex:
        for i, log in ex.map(one, [d for d in DS.DESIGNS if not only or d['id'] in only]):
            if log: bad.append((i, log))
            else: print('sample', i, flush=True)
    shutil.rmtree(root, ignore_errors=True)
    for i, log in bad: print('FAILED', i, '\n', log)
    return not bad

COVER_SAMPLE = {'hook': 'Only 72 of 1,000 trial users still pay', 'sub': 'Where the other 928 drop out', 'chips': ['Pricing', 'Trial', 'Data', 'Paid'],
                'flow_title': 'The trial funnel', 'steps': ['Visit pricing', 'Start a trial', 'Connect data', 'Pay']}

def brand_samples(dest, which=('reelcovers', 'thumbs')):
    """Reel cover (reelcover-<layout>.jpg) and thumbnail (thumb-<layout>.jpg) samples, built by the same jobs the app runs. Returns the failures."""
    from PIL import Image
    import tempfile; root = tempfile.mkdtemp(prefix='samples-'); bad = []
    def save(f, name, size):
        Image.open(f).convert('RGB').resize(size, Image.LANCZOS).save(os.path.join(dest, name), quality=88, optimize=True); print('sample', name[:-4], flush=True)
    if 'reelcovers' in which:
        r = cover_job(root, COVER_SAMPLE)
        if not r['ok']: bad.append(('reelcovers', r['log'][-900:]))
        for f in r['files']:
            m = re.search(r'-cover-(\w+)\.png$', f)
            if m: save(f, f'reelcover-{m.group(1)}.jpg', (540, 960))
    if 'thumbs' in which:   # the thumbs fixture has the two lists the versus layout needs
        job = os.path.join(root, 'thumbs'); os.makedirs(job); fx = os.path.join(SKILL, 'fixtures')
        subprocess.run([sys.executable, os.path.join(HERE, 'studio.py'), 'ingest', os.path.join(fx, 'thumbs.md'), '--out', job], capture_output=True)
        shutil.copy(os.path.join(fx, 'thumbs.story.json'), os.path.join(job, 'story.json'))
        r = subprocess.run([sys.executable, os.path.join(HERE, 'studio.py'), 'thumbs', job, '--sizes', 'youtube'], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=900, cwd=job)
        fs = sorted(os.path.join(job, 'out', 'thumbs', f) for f in os.listdir(os.path.join(job, 'out', 'thumbs'))) if r.returncode == 0 else []
        if not fs: bad.append(('thumbs', (r.stdout + r.stderr)[-900:]))
        for f in fs:
            m = re.search(r'-youtube-(\w+)\.png$', f)
            if m: save(f, f'thumb-{m.group(1)}.jpg', (640, 360))
    shutil.rmtree(root, ignore_errors=True)
    for i, log in bad: print('FAILED', i, '\n', log)
    return bad

if __name__ == '__main__':   # usage: studio_jobs.py [design-id | reelcovers | thumbs ...]   (no arguments: every sample)
    args, dest = sys.argv[1:], os.path.join(SKILL, 'studio', 'samples'); extra = [a for a in args if a in ('reelcovers', 'thumbs')]; ids = [a for a in args if a not in extra]
    ok = make_samples(dest, ids) if ids or not args else True
    bad = brand_samples(dest, extra or ('reelcovers', 'thumbs')) if extra or not args else []
    sys.exit(0 if ok and not bad else 1)
