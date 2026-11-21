#!/usr/bin/env python3
"""explainer-studio orchestrator. Pure standard library; heavy steps run through the Lemo-Opuscar toolkit (node + its python).
  studio.py doctor                      environment check (exit 0 = ready for the artifacts you can build)
  studio.py spec [--icons]              compact story.json limits (agent reads this instead of long docs)
  studio.py ingest SRC --out DIR        URL | GitHub repo | file | dir | '-' (stdin)  ->  DIR/source.md (cite chunk ids)
  studio.py check DIR                   validate story.json + accuracy metrics; prints only what must be fixed
  studio.py build DIR [--artifacts reel,gif,post|all]
  studio.py post DIR | eval DIR"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import ingest as ING, validate_story as VS, evaluate as EV, post as POST, timeline as TL, tts_norm

WIN = os.name == 'nt'
def home(): return os.path.expanduser('~')
def find_lib():
    for p in (os.environ.get('LEMO_OPUSCAR_HOME'), os.path.join(home(), 'lemo-opuscar')):
        if p and os.path.isfile(os.path.join(p, 'core', 'render', 'video.mjs')): return os.path.abspath(p)
    return None
def lib_py(lib):
    for r in (('.venv', 'bin', 'python'), ('.venv', 'Scripts', 'python.exe')):
        p = os.path.join(lib, *r)
        if os.path.exists(p): return p
    return sys.executable
def ff_dir():
    for d in (os.environ.get('EXPLAINER_FFMPEG_DIR'), os.path.join(home(), '.cache', 'explainer-studio', 'bin')):
        if d and os.path.exists(os.path.join(d, 'ffmpeg' + ('.exe' if WIN else ''))): return d
    return None
def ffver(exe):
    try: m = re.search(r'ffmpeg version n?(\d+)', subprocess.run([exe, '-version'], capture_output=True, text=True).stdout); return int(m.group(1)) if m else 0
    except Exception: return 0
def env_for(lib):
    e = dict(os.environ); e['LEMO_OPUSCAR_HOME'] = lib; d = ff_dir()
    if d and (ffver(shutil.which('ffmpeg') or 'ffmpeg') < 7): e['PATH'] = d + os.pathsep + e['PATH']
    return e
def run(cmd, cwd=None, env=None, quiet=False):
    r = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True)
    if r.returncode and not quiet: sys.stderr.write((r.stdout + r.stderr)[-1800:])
    return r

# ───────────────────────── doctor ─────────────────────────
def doctor(a):
    ok = True; rows = []
    def row(name, good, info, need=True):
        nonlocal ok; rows.append(f'{"OK " if good else ("-- " if not need else "BAD")} {name:<22} {info}'); ok &= good or not need
    v = sys.version_info; row('python >= 3.9', v >= (3, 9), f'{v.major}.{v.minor}')
    nd = shutil.which('node'); nv = subprocess.run([nd, '-v'], capture_output=True, text=True).stdout.strip() if nd else ''
    row('node >= 20', bool(nd) and int(nv.lstrip('v').split('.')[0]) >= 20, nv or 'missing')
    lib = find_lib(); row('Lemo-Opuscar toolkit', bool(lib), lib or 'missing -> sh scripts/setup.sh')
    if lib:
        env = env_for(lib); fx = shutil.which('ffmpeg', path=env['PATH']); fv = ffver(fx) if fx else 0
        row('ffmpeg >= 7', fv >= 7, f'{fx} (v{fv})' if fx else 'missing -> sh scripts/setup.sh')
        row('Kokoro voice model', os.path.exists(os.path.join(lib, 'core/tts/kokoro-v1.0.onnx')), 'core/tts/kokoro-v1.0.onnx')
        py = lib_py(lib); r = run([py, '-c', 'import kokoro_onnx, numpy, soundfile, soxr, scipy'], quiet=True); row('python voice deps', r.returncode == 0, py + ('' if r.returncode == 0 else ' (run: sh scripts/setup.sh)'))
        row('node deps (playwright)', os.path.isdir(os.path.join(lib, 'node_modules', 'playwright-core')), 'node_modules/playwright-core')
        try:
            out = run([nd, '-e', f"import('file://{lib}/core/render/browser.mjs').then(m=>console.log(Object.keys(m).join()))"], cwd=lib, quiet=True)
            row('headless chromium', True, 'checked at first render', need=False)
        except Exception: pass
        r = run([sys.executable, '-c', 'import sherpa_onnx'], quiet=True); row('ASR check (optional)', r.returncode == 0 and os.path.isdir(os.path.expanduser('~/.cache/explainer-studio/asr')) or bool(os.environ.get('EXPLAINER_ASR_MODEL')), 'speech-to-text verification; skipped if absent', need=False)
    print('\n'.join(rows)); print('READY' if ok else 'NOT READY: fix the BAD rows (sh scripts/setup.sh does most of it)'); return 0 if ok else 1

def spec(a):
    if a.icons: print(' '.join(icon_names())); return 0
    S = VS.SPEC
    def comp(x):
        if isinstance(x, tuple):
            if x[0] == 'str': return f'str[{x[1]}-{x[2]}]'
            if x[0] == 'list': return f'list[{x[1]}-{x[2]}] of ' + str(comp(x[3]))
            if x[0] == 'enum': return '|'.join(x[1])
            if x[0] == 'obj': return {k: comp(v) for k, v in x[1].items()}
        if isinstance(x, dict): return {k: comp(v) for k, v in x.items()}
        return x
    print(json.dumps({'narration': S['narration'], 'roles(in order)': VS.ROLES, 'reel_scene_props(p)': comp(S['reel_scenes']), 'item "cue"': 'optional phrase from the scene narration; the item appears when it is spoken',
                      'gif': comp(S['gif']), 'gif_slots': 'cards[0-2]=top, 3-6=sides (3 L1,4 R1,5 L2,6 R2), 7=wide bottom-left, 8=narrow bottom-right', 'post': comp(S['post']), 'thresholds': S['thresholds']}, ensure_ascii=False, separators=(",", ":"))); return 0

# ───────────────────────── project data ─────────────────────────
def load_project(work):
    for f in ('story.json', 'source.chunks.json', 'source_full.txt', 'source.meta.json'):
        if not os.path.exists(os.path.join(work, f)): sys.exit(f'missing {f} in {work} (run ingest, then write story.json)')
    return load(os.path.join(work, 'story.json')), load(os.path.join(work, 'source.chunks.json')), open(os.path.join(work, 'source_full.txt'), encoding='utf-8').read(), load(os.path.join(work, 'source.meta.json'))
def brand(): return cfg('brand.json')
def do_check(work, quiet=False):
    story, chunks, full, meta = load_project(work)
    if not story['meta'].get('url') and meta.get('url'): story['meta']['url'] = meta['url']
    err, warn = VS.validate(story, chunks, full)
    rep = EV.evaluate(story, chunks, full, meta) if not err else None
    os.makedirs(os.path.join(work, 'out'), exist_ok=True)
    if rep:
        dump(rep, os.path.join(work, 'out', 'eval.json')); open(os.path.join(work, 'out', 'eval.md'), 'w', encoding='utf-8').write(EV.markdown(rep))
    fails = list(err) + (rep['fails'] if rep else [])
    if not quiet:
        for e in fails: print('FIX  ', e)
        for w in warn + (rep['warns'] if rep else []): print('warn ', w)
        if rep: print(f'metrics: support {rep["claim_support"]} | overlap {rep["overlap_mean"]} (min {rep["overlap_min"]}) | recall@1/3/5 {rep["recall@1"]}/{rep["recall@3"]}/{rep["recall@5"]} | P@3 {rep["precision@3"]} | MRR {rep["mrr"]} | coverage {rep["coverage"]}')
        print('CHECK OK' if not fails else f'CHECK FAILED: {len(fails)} item(s) to fix in story.json, then re-run check')
    return (not fails), story, chunks, rep

# ───────────────────────── TTS ─────────────────────────
def tts(story, work, lib, env):
    b = brand(); voice = story['meta'].get('voice') or b['voice']; speed = story['meta'].get('speed') or b['speed']
    cache = os.path.join(work, '.cache', 'tts'); os.makedirs(cache, exist_ok=True)
    spoken = {x['id']: tts_norm.norm(x['say'], x.get('tts')) for x in story['beats']}
    key = lambda t: hashlib.sha1(f'{t}|{voice}|{speed}'.encode()).hexdigest()[:16]
    need = [{'id': i, 'text': t, 'voice': voice, 'speed': speed} for i, t in spoken.items() if not os.path.exists(os.path.join(cache, key(t) + '.wav'))]
    if need:
        tmp = os.path.join(work, '.cache', 'tts_tmp'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
        lj = os.path.join(tmp, 'lines.json'); dump(need, lj)
        r = run([lib_py(lib), os.path.join(lib, 'core', 'tts', 'tts.py'), lj, tmp], cwd=lib, env=env)
        if r.returncode: sys.exit('TTS failed (see above). Run: studio.py doctor')
        dj = load(os.path.join(tmp, 'dur.json'))
        for x in need:
            k = key(x['text']); shutil.copy(os.path.join(tmp, x['id'] + '.wav'), os.path.join(cache, k + '.wav')); dump({'dur': dj[x['id']]}, os.path.join(cache, k + '.json'))
        shutil.rmtree(tmp, ignore_errors=True)
    dur = {}
    for i, t in spoken.items(): dur[i] = load(os.path.join(cache, key(t) + '.json'))['dur']
    return spoken, dur, {i: os.path.join(cache, key(t) + '.wav') for i, t in spoken.items()}

# ───────────────────────── staging / render ─────────────────────────
def stage(work, name, data):
    d = os.path.join(work, name); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for f in os.listdir(os.path.join(SKILL, 'engine')):
        if f.endswith(('.js', '.html')): shutil.copy(os.path.join(SKILL, 'engine', f), d)
    shutil.copytree(os.path.join(SKILL, 'assets'), os.path.join(d, 'assets'))
    dump(data, os.path.join(d, 'data.json')); return d
BAD = re.compile(r'^BAD\s+(\S+)\s+at\s+([\d.]+)s\s+\d+ chars\s+need\s+([\d.]+)s\s+got\s+([\d.]+)s', re.M)
def readcheck(lib, env, film, size, q=None):
    cmd = ['node', os.path.join(lib, 'core/render/readcheck.mjs'), film, '--size', size] + (['--q', q] if q else [])
    r = run(cmd, cwd=lib, env=env, quiet=True); txt = r.stdout + r.stderr
    return [(m.group(1), float(m.group(3)) - float(m.group(4))) for m in BAD.finditer(txt)], txt, r.returncode
def validate_layout(lib, env, film, size, q, top, bottom, side):
    cmd = ['node', os.path.join(SKILL, 'engine', 'validate.mjs'), film, '--size', size, '--top', str(top), '--bottom', str(bottom), '--side', str(side)] + (['--q', q] if q else [])
    r = run(cmd, cwd=lib, env=env, quiet=True); out = [l for l in (r.stdout + r.stderr).split('\n') if l and not l.startswith(('fonts:', 'VALIDATE')) and 'WebGL' not in l]
    return r.returncode == 0, out
def workers(): return str(max(1, min(4, os.cpu_count() or 2)))
def srt_time(t): ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
def write_srt(chunks, path):
    with open(path, 'w', encoding='utf-8') as f:
        for i, c in enumerate(chunks, 1): f.write(f'{i}\n{srt_time(c["t0"])} --> {srt_time(c["t1"])}\n{c["text"]}\n\n')

def has_claude(work):
    return bool(re.search(r'\bclaude\b', open(os.path.join(work, 'source_full.txt'), encoding='utf-8').read(), re.I))
def build_reel(work, story, lib, env, out, slug):
    b = brand(); t0 = time.time(); print('[reel] voice...'); spoken, dur, wavs = tts(story, work, lib, env)
    tails, end_hold = {}, 4.4
    for it in range(5):
        D = TL.build(story, dur, tails, end_hold); D['brand'] = {'name': b['name'], 'tagline': b['tagline'], 'avatar': 'assets/avatar.png'}; D['logo'] = has_claude(work)
        film = stage(work, '.film-reel', D); bad, txt, rc = readcheck(lib, env, film, '1080x1920')
        if rc == 2: sys.exit('readcheck could not run:\n' + txt[-800:])
        if not bad: break
        for i, deficit in bad:
            if i.startswith('end-'): end_hold = round(end_hold + deficit + .15, 2)
            else:
                sid = next((s['id'] for s in story['scenes'] if i.startswith(s['id'] + '-')), None)
                if sid: tails[sid] = round(tails.get(sid, 0) + deficit + .15, 2)
        print(f'[reel] hold-time adjust #{it + 1}: {len(bad)} text(s) lengthened')
    else: print('[reel] WARN: hold times still short; shorten on-screen text'); 
    ok, issues = validate_layout(lib, env, film, '1080x1920', None, 240, 1600, 40)
    if not ok:
        print('[reel] LAYOUT ERRORS (edit story.json props, then re-run build):'); [print('   ', l) for l in issues[:14]]; return None
    os.makedirs(out, exist_ok=True); voice = os.path.join(film, 'voice'); os.makedirs(voice)
    for i, w in wavs.items(): shutil.copy(w, os.path.join(voice, i + '.wav'))
    mix = os.path.join(out, 'mix.wav'); r = run([lib_py(lib), os.path.join(HERE, 'mixvoice.py'), os.path.join(film, 'data.json'), voice, mix], env=env)
    if r.returncode: sys.exit('mix failed')
    write_srt(D['chunks'], os.path.join(out, f'{slug}-subtitles.srt'))
    vid = os.path.join(out, 'reel_video.mp4'); print('[reel] rendering', round(D['DUR'], 1), 's ...')
    r = run(['node', os.path.join(lib, 'core/render/video.mjs'), film, '--size', '1080x1920', '--fps', '30', '--workers', workers(), '--out', vid], cwd=lib, env=env)
    if r.returncode: sys.exit('render failed')
    fin = os.path.join(out, f'{slug}-reel.mp4'); e2 = dict(env); e2['LEMO_COLOR'] = 'bt709'
    r = run(['sh', os.path.join(lib, 'core/render/mux.sh'), vid, mix, fin, '30', '0'], cwd=lib, env=e2)
    if r.returncode: sys.exit('mux failed')
    os.remove(vid); poster = os.path.join(out, f'{slug}-poster.jpg')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(round(D['scenes'][min(2, len(D['scenes']) - 1)]['t0'] + 2.0, 2)), '-i', fin, '-frames:v', '1', '-q:v', '2', poster], env=env)
    # ASR (optional)
    items = [{'id': i, 'text': t, **({'asr': x['asr']} if x.get('asr') else {})} for x in story['beats'] for i, t in [(x['id'], spoken[x['id']])]]
    ij = os.path.join(work, '.cache', 'asr_in.json'); dump(items, ij)
    r = run([sys.executable, os.path.join(HERE, 'asr_check.py'), ij, voice, os.path.join(out, 'asr.json')], env=env, quiet=True)
    asr = {0: 'all lines verified by speech-to-text', 1: 'SOME LINES DIFFER (see out/asr.json; fix spelling or add "tts"/"asr")', 3: 'skipped (ASR model not installed)'}.get(r.returncode, 'error')
    print(f'[reel] done in {time.time() - t0:.0f}s -> {fin}\n[reel] speech check: {asr}')
    return {'file': fin, 'duration': D['DUR'], 'asr': asr, 'tails': tails}

def build_gif(work, story, lib, env, out, slug):
    b = brand(); g = story['gif']; N = len(g['cards']); H = TL.gif_height(N, bool(g['hub'].get('tagline'))); size = f'1080x{H}'; hold = 5.4; assert H == 1350
    url = story['meta'].get('url', ''); g = dict(g); g['H'] = H
    g['source'] = {'label': g['source']['label'], 'url': re.sub(r'^https?://(www\.)?', '', url).rstrip('/')[:44] if url else g['source'].get('url', '')}
    for it in range(5):
        g['hold'] = hold; film = stage(work, '.film-gif', {'brand': {'name': b['name'], 'tagline': b['tagline'], 'avatar': 'assets/avatar.png'}, 'logo': has_claude(work), 'gif': g})
        bad, txt, rc = readcheck(lib, env, film, size, 'mode=gif')
        if rc == 2: sys.exit('readcheck could not run:\n' + txt[-800:])
        if not bad: break
        hold = round(hold + max(d for _, d in bad) + .2, 2); print(f'[gif] hold-time adjust #{it + 1}: hold {hold}s')
    ok, issues = validate_layout(lib, env, film, size, 'mode=gif', 8, H - 8, 14)
    if not ok:
        print('[gif] LAYOUT ERRORS (shorten the named text in story.json gif section, then re-run build):'); [print('   ', l) for l in issues[:14]]; return None
    os.makedirs(out, exist_ok=True); vid = os.path.join(out, 'gif_video.mp4'); print('[gif] rendering...')
    r = run(['node', os.path.join(lib, 'core/render/video.mjs'), film, '--size', size, '--fps', '10', '--workers', workers(), '--q', 'mode=gif', '--out', vid], cwd=lib, env=env)
    if r.returncode: sys.exit('gif render failed')
    fin = os.path.join(out, f'{slug}-linkedin.gif'); mk = os.path.join(SKILL, 'engine', 'make_gif.sh')
    for w, c in ((1080, 128), (900, 128), (800, 96), (720, 96), (640, 64)):  # always 4:5 portrait; width only shrinks to fit 5 MB
        run(['sh', mk, vid, fin, str(w), '10', str(c)], env=env)
        if os.path.getsize(fin) <= 5 * 1048576: break
    os.remove(vid); mb = os.path.getsize(fin) / 1048576; print(f'[gif] done -> {fin} ({w}px, {mb:.1f} MB)')
    return {'file': fin, 'mb': round(mb, 2), 'width': w}

def build(a):
    work = os.path.abspath(a.dir); ok, story, chunks, rep = do_check(work, quiet=False)
    if not ok: print('Fix story.json first.'); return 2
    arts = set(['reel', 'gif', 'post'] if a.artifacts == 'all' else a.artifacts.split(','))
    if not arts <= {'reel', 'gif', 'post'}: sys.exit('artifacts: reel,gif,post or all')
    slug = story['meta']['slug']; out = os.path.join(work, 'out'); res = {}
    if not story['meta'].get('url'): story['meta']['url'] = load(os.path.join(work, 'source.meta.json')).get('url', '')
    if 'post' in arts:
        if 'post' not in story: sys.exit('story.json has no "post" section')
        txt = POST.build(story, brand()); pe = POST.lint(txt, story)
        if pe: print('POST:', *pe, sep='\n  '); return 2
        os.makedirs(out, exist_ok=True); open(os.path.join(out, f'{slug}-linkedin-post.txt'), 'w', encoding='utf-8').write(txt); print(f'[post] -> out/{slug}-linkedin-post.txt ({len(txt)} chars)'); res['post'] = len(txt)
    if arts & {'reel', 'gif'}:
        lib = find_lib()
        if not lib: sys.exit('Lemo-Opuscar toolkit not found. Run: sh scripts/setup.sh   (then: studio.py doctor)')
        env = env_for(lib)
        if 'gif' in arts:
            if 'gif' not in story: sys.exit('story.json has no "gif" section')
            res['gif'] = build_gif(work, story, lib, env, out, slug)
        if 'reel' in arts: res['reel'] = build_reel(work, story, lib, env, out, slug)
    dump({'artifacts': {k: v for k, v in res.items()}, 'eval': {k: rep[k] for k in ('claim_support', 'overlap_mean', 'recall@3', 'precision@3', 'mrr', 'coverage', 'pass')}}, os.path.join(out, 'build.json'))
    print('BUILD COMPLETE'); [print(' ', k, '->', (v or {}).get('file', v) if isinstance(v, dict) else v) for k, v in res.items()]; print('  accuracy report -> out/eval.md'); return 0 if all(res.values()) else 1

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('doctor'); s = sp.add_parser('spec'); s.add_argument('--icons', action='store_true')
    i = sp.add_parser('ingest'); i.add_argument('src'); i.add_argument('--out', default='.'); i.add_argument('--max-chars', type=int, default=36000)
    for n in ('check', 'eval', 'post'): sp.add_parser(n).add_argument('dir')
    b = sp.add_parser('build'); b.add_argument('dir'); b.add_argument('--artifacts', default='all')
    a = ap.parse_args()
    if a.cmd == 'doctor': return doctor(a)
    if a.cmd == 'spec': return spec(a)
    if a.cmd == 'ingest': m = ING.run(a.src, a.out, a.max_chars); print(json.dumps(m, ensure_ascii=False)); print('-> read', os.path.join(a.out, 'source.md'), 'once; cite chunk ids [cNN]'); return 0
    if a.cmd in ('check', 'eval'): return 0 if do_check(os.path.abspath(a.dir))[0] else 1
    if a.cmd == 'post':
        ok, story, *_ = do_check(os.path.abspath(a.dir), quiet=True)
        if not ok: return 2
        print(POST.build(story, brand())); return 0
    if a.cmd == 'build': return build(a)
if __name__ == '__main__': sys.exit(main())
