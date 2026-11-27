"""End-to-end run of every media, with evaluations, into a showcase folder you can open.

usage: python tests/e2e/run_all.py [--out DIR] [--only gif,carousel,charts,reel,walkthrough,app] [--no-app]
default --out: ~/Downloads/explainer-studio-showcase (outside the repository; the plugin keeps no example outputs)

For each media it runs the real build (headless Chromium through Playwright), then the deterministic gates (`studio.py review`), the carousel
quality check (`studio.py e2e`), the accuracy evaluation (out/eval.md) and, for walkthroughs, the Playwright step verification. Then it drives the
Design Studio web app with Playwright (tests/e2e/app_tour.mjs), asserting every workspace and recording a video of the tour.
Writes <out>/REPORT.md (pass/fail per check, links to every file) and <out>/results.json. Exit code 1 if any check failed."""
import argparse, glob, json, os, re, shutil, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(os.path.dirname(HERE)); PY = sys.executable; ST = os.path.join(SK, 'scripts', 'studio.py'); FX = os.path.join(SK, 'fixtures')
sys.path.insert(0, os.path.join(SK, 'scripts'))

def sh(cmd, timeout=1800, **kw):
    t0 = time.time(); r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=timeout, **kw); return r.returncode, (r.stdout + r.stderr), round(time.time() - t0, 1)

def project(work, fixture, story=None):
    shutil.rmtree(work, ignore_errors=True); os.makedirs(work)
    sh([PY, ST, 'ingest', os.path.join(FX, fixture + '.md'), '--out', work])
    if story is not None: json.dump(story, open(os.path.join(work, 'story.json'), 'w', encoding='utf-8'), indent=1)
    else: shutil.copy(os.path.join(FX, fixture + '.story.json'), os.path.join(work, 'story.json'))

def gif_motion(work):
    """v3.1 GIF rules: the whole diagram is on screen at frame 0 (it matches the still PNG), and the last frame flows into the first."""
    from PIL import Image, ImageChops
    g = next(iter(glob.glob(os.path.join(work, 'out', '*.gif'))), None); png = next(iter(glob.glob(os.path.join(work, 'out', '*-linkedin.png'))), None)
    if not g or not png: return {'complete_at_frame_0': False, 'seamless_loop': False}
    im = Image.open(g); n = getattr(im, 'n_frames', 1); im.seek(0); f0 = im.convert('RGB'); im.seek(n - 1); fl = im.convert('RGB')
    still = Image.open(png).convert('RGB').resize(f0.size)
    def diff(a, b):
        d = ImageChops.difference(a, b).convert('L').point(lambda p: 255 if p > 48 else 0); return 100 * sum(d.histogram()[255:]) / (d.width * d.height)
    a, b = diff(f0, still), diff(f0, fl)
    return {'frames': n, 'frame0_vs_still_pct': round(a, 2), 'first_vs_last_pct': round(b, 2), 'complete_at_frame_0': a < 6, 'seamless_loop': b < 4}

def gates(work):
    rc, log, _ = sh([PY, ST, 'review', work], 600)
    m = re.search(r'(\d+)%', log); fails = [l.strip() for l in log.splitlines() if re.search(r'FAIL|false', l)][:8]
    return {'review_pct': int(m.group(1)) if m else None, 'review_failed': fails}

def evaluation(work):
    f = os.path.join(work, 'out', 'eval.md'); return open(f, encoding='utf-8').read()[:1500] if os.path.isfile(f) else ''

def collect(work, dest, pats):
    os.makedirs(dest, exist_ok=True); got = []
    for p in pats:
        for f in glob.glob(os.path.join(work, 'out', p)):
            if os.path.isfile(f): shutil.copy(f, dest); got.append(os.path.join(dest, os.path.basename(f)))
    if os.path.isfile(os.path.join(work, 'out', 'eval.md')): shutil.copy(os.path.join(work, 'out', 'eval.md'), os.path.join(dest, 'evaluation.md')); got.append(os.path.join(dest, 'evaluation.md'))
    return got

def run(out, only):
    R = []; wk = os.path.join(out, '_work'); os.makedirs(wk, exist_ok=True)
    def rec(name, ok, secs, files, **kw): R.append({'media': name, 'ok': bool(ok), 'seconds': secs, 'files': [os.path.relpath(f, out) for f in files], **kw}); print(('PASS ' if ok else 'FAIL ') + name, secs, 's', flush=True)

    if 'gif' in only:
        for fx in ('funnel', 'https', 'chart', 'arch'):
            w = os.path.join(wk, 'gif-' + fx); project(w, fx); rc, log, s = sh([PY, ST, 'build', w, '--artifacts', 'gif'])
            g = gates(w); m = gif_motion(w)
            rec(f'GIF ({fx})', rc == 0 and 'BUILD COMPLETE' in log and (g['review_pct'] or 0) == 100 and m['complete_at_frame_0'] and m['seamless_loop'], s, collect(w, os.path.join(out, 'gif', fx), ['*.gif', '*-linkedin.png', 'review/*.png']), motion=m, **g)
    if 'carousel' in only:
        w = os.path.join(wk, 'carousel'); project(w, 'carousel'); rc, log, s = sh([PY, ST, 'build', w, '--artifacts', 'carousel', '--format', 'both'])
        rc2, e2e, _ = sh([PY, ST, 'e2e', w], 900); g = gates(w)
        rec('Carousel (story)', rc == 0 and rc2 == 0, s, collect(w, os.path.join(out, 'carousel'), ['*.pdf', 'carousel/*.png', '*comment.txt']), e2e=e2e.strip().splitlines()[-3:], **g)
    if 'charts' in only:
        import designs as DS, studio_jobs as SJ
        root = os.path.join(wk, 'charts'); os.makedirs(root, exist_ok=True); ids = [d['id'] for d in DS.DESIGNS if d['group'] == 'chart']
        cuts = [0, 5, 9, 13, 17, 21]                                 # 21 chart types as five carousels of 4-5 chart slides, cover + closing included
        for n_, (k, k2) in enumerate(zip(cuts, cuts[1:])):
            chunk = ['cover-bold'] + ids[k:k2]; t0 = time.time()
            r = SJ.render(root, [{'design': i, 'values': DS.BY_ID[i]['sample']} for i in chunk], {'title': 'Which chart fits your data?', 'lines': []}, 'paper', 'carousel', 'both')
            dest = os.path.join(out, 'charts', f'set-{n_ + 1}'); os.makedirs(dest, exist_ok=True); files = [shutil.copy(f, dest) for f in r['files']]
            rc2, e2e, _ = sh([PY, ST, 'e2e', r['job']], 900)
            rec('Chart slides ' + ', '.join(ids[k:k2]).replace('chart-', ''), r['ok'] and rc2 == 0, round(time.time() - t0, 1), files, e2e=e2e.strip().splitlines()[-3:], log=None if r['ok'] else r['log'][-800:])
    if 'arch' in only:   # the four architecture styles as one carousel (cover, 4 slides, closing)
        import designs as DS, studio_jobs as SJ
        root = os.path.join(wk, 'arch'); os.makedirs(root, exist_ok=True); ids = [d['id'] for d in DS.DESIGNS if d['group'] == 'architecture']; t0 = time.time()
        r = SJ.render(root, [{'design': i, 'values': DS.BY_ID[i]['sample']} for i in ['cover-bold'] + ids], {'title': 'Which diagram fits your post?', 'lines': []}, 'paper', 'carousel', 'both')
        dest = os.path.join(out, 'architecture'); os.makedirs(dest, exist_ok=True); files = [shutil.copy(f, dest) for f in r['files']]; rc2, e2e, _ = sh([PY, ST, 'e2e', r['job']], 900)
        rec('Architecture slides (sketch, cloud, flow, sequence)', r['ok'] and rc2 == 0, round(time.time() - t0, 1), files, e2e=e2e.strip().splitlines()[-3:], log=None if r['ok'] else r['log'][-800:])
    if 'thumbs' in only:   # every size x every layout
        w = os.path.join(wk, 'thumbs'); project(w, 'thumbs'); rc, log, s = sh([PY, ST, 'thumbs', w], 900)
        rec('Thumbnails and blog covers (5 sizes x 5 layouts)', rc == 0 and '25 images' in log, s, collect(w, os.path.join(out, 'thumbs'), ['thumbs/*.png']), notes=[l for l in log.splitlines() if 'LAYOUT' in l][:5])
    if 'reel' in only:
        w = os.path.join(wk, 'reel'); project(w, 'https'); rc, log, s = sh([PY, ST, 'build', w, '--artifacts', 'reel,post'], 2400)
        g = gates(w); rec('Reel + designed covers + post', rc == 0 and 'BUILD COMPLETE' in log, s, collect(w, os.path.join(out, 'reel'), ['*.mp4', '*.srt', '*poster.jpg', 'covers/*.png', '*post.txt', 'review/*.png']),
                          speech=next((l for l in log.splitlines() if 'speech check' in l), ''), **g)
    if 'walkthrough' in only:
        w = os.path.join(wk, 'walkthrough'); rc, log, s = sh([PY, ST, 'walkthrough', w, '--steps', os.path.join(FX, 'walk', 'steps.json')])
        rep = next(iter(glob.glob(os.path.join(w, 'out', '*report.md'))), None)
        rec('Walkthrough video (Playwright, verified steps)', rc == 0, s, collect(w, os.path.join(out, 'walkthrough'), ['*.mp4', '*.jpg', '*.md']), verified=next((l for l in log.splitlines() if 'verified' in l), ''))
    if 'app' in only:
        rc, log, s = sh(['node', os.path.join(HERE, 'app_tour.mjs'), out], 1800, cwd=os.path.join(SK, 'runtime'))
        print(log[-1500:]); vids = glob.glob(os.path.join(out, 'app', '*'))
        rec('Design Studio web app (Playwright tour)', rc == 0, s, vids, checks=[l for l in log.splitlines() if l.startswith(('OK ', 'FAIL '))])
    return R

def report(out, R):
    L = ['# explainer-studio: end-to-end showcase', '', f"Run {time.strftime('%Y-%m-%d %H:%M')} on this computer. Every file below was produced by the real engine; every check is automatic.", '',
         '| Media | Result | Time | Review gates | Notes |', '|---|---|---|---|---|']
    for r in R:
        mo = r.get('motion'); mtxt = f"frame 0 vs still {mo['frame0_vs_still_pct']}%, loop seam {mo['first_vs_last_pct']}%" if mo and 'frames' in mo else ''
        note = '; '.join(x for x in [mtxt, r.get('speech', ''), r.get('verified', ''), ' / '.join(r.get('e2e') or [])[:160]] if x)
        L.append(f"| {r['media']} | {'PASS' if r['ok'] else '**FAIL**'} | {r['seconds']} s | {'' if r.get('review_pct') is None else str(r['review_pct']) + '%'} | {note} |")
    for r in R:
        L += ['', f"## {r['media']}", ''] + [f"- [{os.path.basename(f)}]({f})" for f in r['files']]
        if r.get('review_failed'): L += ['', 'Review findings:', ''] + ['    ' + x for x in r['review_failed']]
        if r.get('checks'): L += ['', 'Checks:', ''] + ['- ' + c for c in r['checks']]
        if r.get('log'): L += ['', '```', r['log'], '```']
    L += ['', 'Accuracy metrics are lexical proxies (claim support, overlap, recall). The visual review is a look at the contact sheets in each folder.']
    open(os.path.join(out, 'REPORT.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n'); json.dump(R, open(os.path.join(out, 'results.json'), 'w', encoding='utf-8'), indent=1)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=os.path.join(os.path.expanduser('~'), 'Downloads', 'explainer-studio-showcase'))
    ap.add_argument('--only', default='gif,carousel,charts,arch,thumbs,reel,walkthrough,app'); ap.add_argument('--no-app', action='store_true'); a = ap.parse_args()
    only = set(a.only.split(',')) - ({'app'} if a.no_app else set()); os.makedirs(a.out, exist_ok=True)
    R = run(os.path.abspath(a.out), only); report(os.path.abspath(a.out), R)
    print(f"\n{sum(r['ok'] for r in R)}/{len(R)} passed -> {os.path.join(a.out, 'REPORT.md')}"); sys.exit(0 if all(r['ok'] for r in R) else 1)
