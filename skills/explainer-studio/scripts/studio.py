#!/usr/bin/env python3
"""explainer-studio orchestrator. Pure standard library; heavy steps run through the bundled runtime (node + python voice env).
  studio.py doctor                      environment check (exit 0 = ready for the artifacts you can build)
  studio.py spec [--icons]              compact story.json limits (agent reads this instead of long docs)
  studio.py ingest SRC --out DIR        URL | GitHub repo | file | dir | '-' (stdin)  ->  DIR/source.md (cite chunk ids)
  studio.py check DIR                   validate story.json + accuracy metrics; prints only what must be fixed
  studio.py build DIR [--artifacts gif|reel|post|all]   (default: gif only; reel/post only when the user asked)
  studio.py post DIR | eval DIR | pick DIR (best GIF template)
  studio.py brand [--name --tagline --follow --cta LINE --avatar FILE --voice V --reset]   change the CTA/brand, then rebuild
  studio.py review DIR                  deterministic gates + contact sheets; prints the token to attest
  studio.py finalize DIR                copies to DIR/final only when every gate is 100% and the visual attestation matches"""
import argparse, tempfile, glob, hashlib, json, os, re, shutil, struct, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import carousel as CAR, ingest as ING, validate_story as VS, evaluate as EV, post as POST, timeline as TL, tts_norm, pick as PICK

for _st in (sys.stdout, sys.stderr):   # Windows consoles default to a legacy code page that cannot print arrows or accents
    try: _st.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass
WIN = os.name == 'nt'
SETUP = 'python scripts/setup.py' if WIN else 'python3 scripts/setup.py'
def home(): return os.path.expanduser('~')
EH = os.environ.get('EXPLAINER_HOME') or os.path.join(home(), '.cache', 'explainer-studio')
RT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'runtime'))
def find_lib():
    nm, shared = os.path.join(RT, 'node_modules'), os.path.join(EH, 'node', 'node_modules')
    if not os.path.exists(nm) and os.path.isdir(shared):          # another installed copy ran setup: reuse its node deps
        try: import setup as _S; _S.link(shared, nm)
        except Exception: pass
    return RT if os.path.isfile(os.path.join(RT, 'core', 'render', 'video.mjs')) else None
def lib_py(lib=None):
    for r in (('venv', 'bin', 'python'), ('venv', 'Scripts', 'python.exe')):
        p = os.path.join(EH, *r)
        if os.path.exists(p): return p
    return sys.executable
def ff_dir():
    d = os.path.join(EH, 'bin')
    return d if os.path.exists(os.path.join(d, 'ffmpeg' + ('.exe' if WIN else ''))) else None
def sh_exe():
    """A POSIX shell for the Reel mux step. macOS/Linux: sh. Windows: the one that ships with Git for Windows."""
    p = shutil.which('sh')
    if p or not WIN: return p
    for base in (os.environ.get('ProgramFiles'), os.environ.get('ProgramFiles(x86)'), os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs')):
        for rel in (('Git', 'bin', 'sh.exe'), ('Git', 'usr', 'bin', 'sh.exe')):
            c = os.path.join(base or '', *rel)
            if os.path.isfile(c): return c
    return None
def ffver(exe):
    try: m = re.search(r'ffmpeg version n?(\d+)', subprocess.run([exe, '-version'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout); return int(m.group(1)) if m else 0
    except Exception: return 0
def env_for(lib):
    e = dict(os.environ); d = ff_dir()
    if d and (ffver(shutil.which('ffmpeg') or 'ffmpeg') < 7): e['PATH'] = d + os.pathsep + e['PATH']
    return e
def run(cmd, cwd=None, env=None, quiet=False):
    if cmd and cmd[0] in ('ffmpeg', 'ffprobe', 'node'): cmd = [shutil.which(cmd[0], path=(env or os.environ)['PATH']) or cmd[0]] + list(cmd[1:])   # Windows resolves a bare name in the parent's PATH, not env's
    r = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode and not quiet: sys.stderr.write((r.stdout + r.stderr)[-1800:])
    return r

# ───────────────────────── doctor ─────────────────────────
def doctor(a):
    need_for = getattr(a, 'for_', None) or 'all'   # carousel: browser only; gif: + ffmpeg; all/reel: + voice
    voice = need_for in ('all', 'reel'); ffm = need_for in ('all', 'reel', 'gif')
    ok = True; rows = []
    def row(name, good, info, need=True):
        nonlocal ok; rows.append(f'{"OK " if good else ("-- " if not need else "BAD")} {name:<22} {info}'); ok &= good or not need
    v = sys.version_info; row('python >= 3.9', v >= (3, 9), f'{v.major}.{v.minor}')
    nd = shutil.which('node'); nv = subprocess.run([nd, '-v'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout.strip() if nd else ''
    row('node >= 20', bool(nd) and int(nv.lstrip('v').split('.')[0]) >= 20, nv or 'missing')
    lib = find_lib(); row('bundled runtime', bool(lib), lib or 'missing runtime/ folder (re-clone the repository)')
    if lib:
        env = env_for(lib); fx = shutil.which('ffmpeg', path=env['PATH']); fv = ffver(fx) if fx else 0
        row('ffmpeg >= 7', fv >= 7 or not ffm, f'{fx} (v{fv})' if fx else 'missing -> ' + SETUP)
        row('voice model', not voice or os.path.exists(os.path.join(EH, 'models', 'kokoro-v1.0.onnx')) and os.path.exists(os.path.join(EH, 'models', 'voices-v1.0.bin')), os.path.join(EH, 'models') + ' (' + SETUP + ')')
        py = lib_py(); r = run([py, '-c', 'import kokoro_onnx, numpy, soundfile, soxr, scipy'], quiet=True); row('python voice deps', r.returncode == 0 or not voice, py + ('' if r.returncode == 0 else ' (run: ' + SETUP + ')'))
        if WIN: row('sh (Reel only)', bool(sh_exe()), sh_exe() or 'install Git for Windows to build Reels; GIF and post work without it', need=False)
        row('node deps (playwright)', os.path.isdir(os.path.join(lib, 'node_modules', 'playwright-core')), 'runtime/node_modules (' + SETUP + ')')
        r = run([py, '-c', 'import sherpa_onnx'], quiet=True); row('speech check (optional)', r.returncode == 0 and os.path.isdir(os.path.join(EH, 'asr')), 'verifies the audio says the script; skipped if absent', need=False)
    print('\n'.join(rows)); print('READY' if ok else f'NOT READY: fix the BAD rows ({SETUP} does most of it)'); return 0 if ok else 1

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
USER_BRAND = os.path.join(EH, 'brand.json'); USER_AVATAR = os.path.join(EH, 'avatar.png')
def brand():
    """Shipped defaults, overlaid by the user's own brand in ~/.cache/explainer-studio/brand.json (survives re-installs and updates)."""
    b = cfg('brand.json'); b.setdefault('follow', 'Follow')
    if os.path.exists(USER_BRAND): b.update(load(USER_BRAND))
    return b
def brand_for_film(b): return {'name': b['name'], 'tagline': b['tagline'], 'follow': b.get('follow', 'Follow'), 'avatar': 'assets/avatar.png'}
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
        if rep:
            lab = [('claim_support', 'support'), ('overlap_mean', 'overlap'), ('recall@3', 'recall@3'), ('precision@3', 'P@3'), ('mrr', 'MRR'), ('coverage', 'coverage'), ('gif_text_support', 'gif text support'), ('gif_coverage', 'gif coverage')]
            print('metrics: ' + ' | '.join(f'{n} {rep[k]}' for k, n in lab if rep.get(k) is not None))
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

def make_gif(vid, fin, width, fps, colors, env):
    """flat-colour palette GIF that loops forever (pure ffmpeg, no shell script, so it behaves the same on every OS)"""
    vf = f'fps={fps},scale={width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors={colors}:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle'
    ff = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'   # Windows looks a bare name up in the parent's PATH, not env's: pass the full path
    r = run([ff, '-y', '-v', 'error', '-i', vid, '-vf', vf, '-loop', '0', fin], env=env)
    if r.returncode: sys.exit('gif encode failed (is ffmpeg >= 7 installed? run: studio.py doctor)')

# ───────────────────────── staging / render ─────────────────────────
def stage(work, name, data):
    d = os.path.join(work, name); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for f in os.listdir(os.path.join(SKILL, 'engine')):
        if f.endswith(('.js', '.html')): shutil.copy(os.path.join(SKILL, 'engine', f), d)
    shutil.copytree(os.path.join(SKILL, 'assets'), os.path.join(d, 'assets'))
    if os.path.isfile(USER_AVATAR): shutil.copy(USER_AVATAR, os.path.join(d, 'assets', 'avatar.png'))   # the user's own avatar replaces the shipped one
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
        D = TL.build(story, dur, tails, end_hold); D['brand'] = brand_for_film(b); D['logo'] = has_claude(work)
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
    if D['DUR'] > 90.0: sys.exit(f'[reel] {D["DUR"]:.1f}s is over the 90 s Reel limit. Shorten the narration (fewer or shorter beats) in story.json, then re-run build.')
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
    fin = os.path.join(out, f'{slug}-reel.mp4'); e2 = dict(env); e2['ES_COLOR'] = 'bt709'
    sh = sh_exe()
    if not sh: sys.exit('The Reel needs a POSIX shell for the audio mux step. On Windows install Git for Windows (it includes sh.exe), then re-run. The GIF and post do not need it.')
    r = run([sh, os.path.join(lib, 'core', 'render', 'mux.sh').replace(os.sep, '/'), vid.replace(os.sep, '/'), mix.replace(os.sep, '/'), fin.replace(os.sep, '/'), '30', '0'], cwd=lib, env=e2)
    if r.returncode: sys.exit('mux failed')
    os.remove(vid); poster = os.path.join(out, f'{slug}-poster.jpg')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(round(D['scenes'][min(2, len(D['scenes']) - 1)]['t0'] + 2.0, 2)), '-i', fin, '-frames:v', '1', '-q:v', '2', poster], env=env)
    # ASR (optional)
    items = [{'id': i, 'text': t, **({'asr': x['asr']} if x.get('asr') else {})} for x in story['beats'] for i, t in [(x['id'], spoken[x['id']])]]
    ij = os.path.join(work, '.cache', 'asr_in.json'); dump(items, ij)
    r = run([lib_py(), os.path.join(HERE, 'asr_check.py'), ij, voice, os.path.join(out, 'asr.json')], env=env, quiet=True)
    asr = {0: 'all lines verified by speech-to-text', 1: 'SOME LINES DIFFER (see out/asr.json; fix spelling or add "tts"/"asr")', 3: 'skipped (ASR model not installed)'}.get(r.returncode, 'error')
    print(f'[reel] done in {time.time() - t0:.0f}s -> {fin}\n[reel] speech check: {asr}')
    return {'file': fin, 'duration': D['DUR'], 'asr': asr, 'tails': tails, 'gates': {'readcheck': not bad, 'layout': True, 'duration<=90s': D['DUR'] <= 90.0, 'speech': {0: 'verified', 1: 'FAILED', 3: 'skipped'}.get(r.returncode, 'FAILED')}}

def build_gif(work, story, lib, env, out, slug):
    b = brand(); g = dict(story['gif']); g['template'] = g.get('template', 'hub'); g['H'] = H = 1350; size = f'1080x{H}'; hold = 5.4
    g.pop('source', None)
    for it in range(5):
        g['hold'] = hold; film = stage(work, '.film-gif', {'brand': brand_for_film(b), 'logo': has_claude(work), 'gif': g})
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
    png = os.path.join(out, f'{slug}-linkedin.png')                      # the complete diagram as one still image: the last full frame before the closing fade (default output)
    dur_v = duration_of(env, vid)
    ff_ = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'
    run([ff_, '-y', '-v', 'error', '-ss', str(max(0.0, dur_v - 2.5)), '-i', vid, '-frames:v', '1', png], env=env, quiet=True)
    fin = os.path.join(out, f'{slug}-linkedin.gif')
    for w, c in ((1080, 128), (900, 128), (800, 96), (720, 96), (640, 64)):  # always 4:5 portrait; width only shrinks to fit 5 MB
        make_gif(vid, fin, w, 10, c, env)
        if os.path.getsize(fin) <= 5 * 1048576: break
    os.remove(vid); mb = os.path.getsize(fin) / 1048576; print(f'[gif] done -> {fin} ({w}px, {mb:.1f} MB)')
    if os.path.isfile(png): print(f'[image] done -> {png} (1080x1350 PNG, the complete diagram)')
    return {'image': png if os.path.isfile(png) else None, 'file': fin, 'mb': round(mb, 2), 'width': w, 'template': g['template'], 'gates': {'readcheck': not bad, 'layout': True, 'size<=5MB': mb <= 5.0}}

def png_size(p):
    with open(p, 'rb') as f: h = f.read(24)
    return struct.unpack('>II', h[16:24]) if h[:8] == b'\x89PNG\r\n\x1a\n' else (0, 0)
def build_carousel(work, story, lib, env, out, slug, only=None):
    """Slides as PNG stills, one PDF (the LinkedIn document upload) and the first-comment text. `only` rebuilds one slide, then the PDF from all slides."""
    b = brand(); deck = CAR.compile_deck(story); n = len(deck); size = '1080x1350'
    film = stage(work, '.film-car', {'brand': brand_for_film(b), 'logo': has_claude(work), 'carousel': {'deck': deck, 'theme': story['carousel'].get('theme', 'paper')}})
    for d_ in deck:                                    # screenshots used by 'shot' slides live in the project; copy them next to the page
        if d_.get('type') == 'shot':
            src = os.path.realpath(os.path.join(work, d_['image'])); dst = os.path.join(film, d_['image'])
            if not src.startswith(os.path.realpath(work) + os.sep) or not os.path.isfile(src): print('[carousel] missing screenshot', d_['image']); return None
            os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy(src, dst)
    ok, issues = validate_layout(lib, env, film, size, 'mode=carousel', 8, 1342, 40)
    if not ok:
        print('[carousel] LAYOUT ERRORS (shorten the named text in story.json carousel section, then re-run build):'); [print('   ', l) for l in issues[:14]]; return None
    sd = os.path.join(out, 'carousel'); os.makedirs(sd, exist_ok=True)
    cmd = ['node', os.path.join(SKILL, 'engine', 'shots.mjs'), film, '--size', size, '--q', 'mode=carousel', '--out', sd, '--prefix', f'{slug}-carousel'] + (['--slide', str(only)] if only else [])
    r = run(cmd, cwd=lib, env=env, quiet=True)
    if r.returncode: print((r.stdout + r.stderr)[-800:]); sys.exit('carousel render failed')
    pngs = [os.path.join(sd, f'{slug}-carousel-{k:02d}.png') for k in range(1, n + 1)]
    for stale in glob.glob(os.path.join(sd, f'{slug}-carousel-*.png')):
        if stale not in pngs: os.remove(stale)
    ff = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'; jd = os.path.join(sd, '_jpg'); os.makedirs(jd, exist_ok=True); jpgs = []
    for k, pn in enumerate(pngs, 1):
        jp = os.path.join(jd, f'{k:02d}.jpg'); run([ff, '-y', '-v', 'error', '-i', pn, '-q:v', '2', '-update', '1', jp], env=env, quiet=True); jpgs.append(jp)
    pdf = os.path.join(out, f'{slug}-carousel.pdf'); CAR.write_pdf(jpgs, pdf); shutil.rmtree(jd, ignore_errors=True)
    ct = os.path.join(out, f'{slug}-carousel-comment.txt'); open(ct, 'w', encoding='utf-8', newline='\n').write(CAR.comment_text(story, b) + '\n')
    print(f'[carousel] done -> {pdf} ({n} slides, 1080x1350 PNG each) + first comment -> {ct}')
    return {'file': pdf, 'also': pngs + [ct], 'n': n, 'deck': [d['type'] for d in deck], 'gates': {'layout': True}}

def art_files(B):
    """Every file an artifact entry hands over: file, its still image, and extras (carousel slides, comment text)."""
    out = []
    for x in B.values():
        if not isinstance(x, dict): continue
        out += [x[k] for k in ('file', 'image') if x.get(k)] + list(x.get('also') or [])
    return out

def build(a):
    work = os.path.abspath(a.dir); ok, story, chunks, rep = do_check(work, quiet=False)
    if not ok: print('Fix story.json first.'); return 2
    default = 'gif' if 'gif' in story or 'carousel' not in story else 'carousel'
    arts = set((['reel', 'gif', 'post'] + (['carousel'] if 'carousel' in story else [])) if a.artifacts == 'all' else (a.artifacts or default).split(','))
    if not arts <= {'reel', 'gif', 'post', 'carousel'}: sys.exit('artifacts: reel,gif,post,carousel or all')
    slug = story['meta']['slug']; out = os.path.join(work, 'out'); res = {}
    if not story['meta'].get('url'): story['meta']['url'] = load(os.path.join(work, 'source.meta.json')).get('url', '')
    if 'post' in arts:
        if 'post' not in story: sys.exit('story.json has no "post" section')
        txt = POST.build(story, brand()); pe = POST.lint(txt, story)
        if pe: print('POST:', *pe, sep='\n  '); return 2
        os.makedirs(out, exist_ok=True); open(os.path.join(out, f'{slug}-linkedin-post.txt'), 'w', encoding='utf-8').write(txt); print(f'[post] -> out/{slug}-linkedin-post.txt ({len(txt)} chars)'); res['post'] = len(txt)
    if arts & {'reel', 'gif', 'carousel'}:
        lib = find_lib()
        if not lib: sys.exit('Runtime not set up. Run: ' + SETUP + '   (then: studio.py doctor)')
        env = env_for(lib)
        if 'gif' in arts:
            if 'gif' not in story: sys.exit('story.json has no "gif" section')
            res['gif'] = build_gif(work, story, lib, env, out, slug)
        if 'carousel' in arts:
            if 'carousel' not in story: sys.exit('story.json has no "carousel" section')
            res['carousel'] = build_carousel(work, story, lib, env, out, slug, only=getattr(a, 'slide', None))
        if 'reel' in arts: res['reel'] = build_reel(work, story, lib, env, out, slug)
    bj = os.path.join(out, 'build.json'); prev = load(bj) if os.path.exists(bj) else {'artifacts': {}}
    prev['artifacts'].update({k: v for k, v in res.items() if v}); prev['eval'] = {k: rep[k] for k in ('claim_support', 'overlap_mean', 'recall@3', 'precision@3', 'mrr', 'coverage', 'gif_text_support', 'gif_coverage', 'pass')}; dump(prev, bj)
    print('BUILD COMPLETE' if all(res.values()) else 'BUILD INCOMPLETE (see errors above)'); [print(' ', k, '->', (v or {}).get('file', v) if isinstance(v, dict) else v) for k, v in res.items()]; print('  accuracy report -> out/eval.md'); return 0 if all(res.values()) else 1


# ───────────────────────── review gate ─────────────────────────
def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for c in iter(lambda: f.read(1 << 20), b''): h.update(c)
    return h.hexdigest()
def probe(env, f, entries):
    try: r = run(['ffprobe', '-v', 'error', '-show_entries', entries, '-of', 'json', f], env=env, quiet=True); return json.loads(r.stdout)
    except Exception: return {}   # ffprobe missing (ffmpeg-static ships only ffmpeg): callers fall back to duration_of()
def duration_of(env, f):
    d = (probe(env, f, 'format=duration').get('format') or {}).get('duration')
    if d: return float(d)
    try: r = run(['ffmpeg', '-hide_banner', '-i', f], env=env, quiet=True); t = (r.stderr or '') + (r.stdout or '')
    except Exception: return 0.0
    m = re.search(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)', t); return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 0.0
def frame_hash(env, f, t, tmp):
    run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', f, '-frames:v', '1', tmp], env=env, quiet=True)
    return sha(tmp) if os.path.exists(tmp) else None
def sheet(env, f, times, out, w):
    tmps = []
    for i, t in enumerate(times):
        tp = out + f'.{i}.png'; run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', f, '-frames:v', '1', '-vf', f'scale={w}:-1', tp], env=env, quiet=True)
        if os.path.exists(tp): tmps.append(tp)
    if len(tmps) >= 2: run(['ffmpeg', '-y', '-v', 'error'] + sum([['-i', t] for t in tmps], []) + ['-filter_complex', f'hstack=inputs={len(tmps)}', out], env=env, quiet=True)
    elif tmps: shutil.copy(tmps[0], out)
    for t in tmps: os.remove(t)

def review(a):
    """Every gate is deterministic. Prints only what failed, plus the token the agent must attest after LOOKING at the contact sheets."""
    work = os.path.abspath(a.dir); out = os.path.join(work, 'out'); bj = os.path.join(out, 'build.json')
    if not os.path.exists(bj): sys.exit('no build yet: run studio.py build first')
    ok, story, chunks, rep = do_check(work, quiet=True); B = load(bj)['artifacts']; env = env_for(find_lib() or RT); G = {}; rd = os.path.join(out, 'review'); os.makedirs(rd, exist_ok=True)
    G['story_check'] = ok; G['accuracy_eval'] = bool(rep and rep['pass'])
    files = []
    if 'gif' in B:
        f = B['gif']['file']; files.append(f); info = probe(env, f, 'stream=width,height,nb_frames:format=duration,size')
        st = (info.get('streams') or [{}])[0]; w, h = st.get('width', 0), st.get('height', 0); dur = float(info.get('format', {}).get('duration', 0) or 0)
        G['gif.portrait_4x5'] = bool(w) and abs(w / h - .8) < .002; G['gif.size<=5MB'] = os.path.getsize(f) <= 5 * 1048576; G['gif.layout+readable'] = all(B['gif']['gates'].values())
        late = max(1.0, dur - 2.5); fh = [frame_hash(env, f, late + d, os.path.join(rd, '_h.png')) for d in (0, .3, .6)]
        G['gif.arrows_animating'] = len({x for x in fh if x}) >= 2
        sheet(env, f, [round(dur * x, 2) for x in (.12, .35, .6, .88)], os.path.join(rd, 'gif_sheet.png'), 405)
    if 'reel' in B:
        f = B['reel']['file']; files.append(f); info = probe(env, f, 'stream=codec_type,width,height:format=duration'); sts = info.get('streams', [])
        v = next((x for x in sts if x.get('codec_type') == 'video'), {}); au = any(x.get('codec_type') == 'audio' for x in sts); dur = float(info.get('format', {}).get('duration', 0) or 0)
        G['reel.1080x1920'] = (v.get('width'), v.get('height')) == (1080, 1920); G['reel.has_audio'] = au; G['reel.duration<=90s'] = 3 < dur <= 90.5
        r = run(['ffmpeg', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], env=env, quiet=True); t = r.stderr[r.stderr.rfind('Summary:'):]
        mi = re.search(r'I:\s+(-?[\d.]+) LUFS', t); mp = re.search(r'Peak:\s+(-?[\d.]+) dBFS', t)
        G['reel.loudness_-16..-12_LUFS'] = bool(mi) and -16.5 <= float(mi.group(1)) <= -12.0; G['reel.true_peak<=-1dBFS'] = bool(mp) and float(mp.group(1)) <= -0.9
        G['reel.layout+readable'] = B['reel']['gates']['readcheck'] and B['reel']['gates']['layout']; sp = B['reel']['gates']['speech']
        G['reel.speech_matches_script'] = sp == 'verified'
        times = [round(dur * x, 2) for x in (.06, .2, .35, .5, .65, .8, .95)]; sheet(env, f, times, os.path.join(rd, 'reel_sheet.png'), 270)
    if 'carousel' in B:
        cb = B['carousel']; pngs = [q for q in cb['also'] if q.endswith('.png')]; n = len(pngs)
        G['carousel.5-7_slides'] = 5 <= n <= 7; G['carousel.every_slide_1080x1350'] = all(png_size(q) == (1080, 1350) for q in pngs)
        G['carousel.pdf_pages_match'] = CAR.pdf_pages(cb['file']) == n; G['carousel.layout+readable'] = all(cb['gates'].values())
        dk = CAR.compile_deck(story); G['carousel.every_slide_has_cta'] = all(d['cta'].strip() for d in dk); G['carousel.title_first_closing_last'] = dk[0]['type'] == 'title' and dk[-1]['type'] == 'closing'
        ctf = [x for x in cb['also'] if x.endswith('comment.txt')][0]
        if (story['carousel'].get('resources') or {}).get('items'): G['carousel.comment_lists_every_link'] = all(i['url'] in open(ctf, encoding='utf-8').read() for i in story['carousel']['resources']['items'])
        tmpd = os.path.join(rd, '_cs'); os.makedirs(tmpd, exist_ok=True); sm = []
        for k, pn in enumerate(pngs):
            tp = os.path.join(tmpd, f'{k}.png'); run(['ffmpeg', '-y', '-v', 'error', '-i', pn, '-vf', 'scale=300:-1', tp], env=env, quiet=True); sm.append(tp)
        if len(sm) > 1: run(['ffmpeg', '-y', '-v', 'error'] + sum([['-i', t] for t in sm], []) + ['-filter_complex', f'hstack=inputs={len(sm)}', os.path.join(rd, 'carousel_sheet.png')], env=env, quiet=True)
        shutil.rmtree(tmpd, ignore_errors=True)
    if 'post' in B: pf = os.path.join(out, f'{story["meta"]["slug"]}-linkedin-post.txt'); files.append(pf); G['post.exact_cta_lines'] = all(l in open(pf, encoding='utf-8').read() for l in brand()['post_cta'])
    files = files + [x for x in art_files(B) if x not in files]   # stills, carousel slides and comment text are part of what is attested
    token = hashlib.sha256((sha(os.path.join(work, 'story.json')) + ''.join(sha(x) for x in sorted(files))).encode()).hexdigest()[:12]
    bad = [k for k, v in G.items() if v is not True]; pct = round(100 * (len(G) - len(bad)) / max(1, len(G)))
    rep_ = {'gates': G, 'passed': len(G) - len(bad), 'total': len(G), 'confidence_pct': pct, 'token': token, 'sheets': [x for x in ('gif_sheet.png', 'reel_sheet.png', 'carousel_sheet.png') if os.path.exists(os.path.join(rd, x))]}; dump(rep_, os.path.join(rd, 'gates.json'))
    for k in bad: print('GATE FAILED:', k)
    if 'reel.speech_matches_script' in bad and B.get('reel', {}).get('gates', {}).get('speech') == 'skipped': print('  (speech check was skipped: run  sh scripts/setup.sh asr  to enable it, then rebuild the Reel)')
    print(f'gates {rep_["passed"]}/{rep_["total"]} ({pct}%)  token {token}')
    if pct == 100: print('NEXT: open ' + ', '.join('out/review/' + x for x in rep_['sheets']) + ' and LOOK at them. Then write out/review/attest.json:\n  {"token":"' + token + '","checked":{"text_legible":true,"nothing_overlaps_or_clipped":true,"matches_source":true,"arrows_follow_the_logic":true},"notes":""}\n  then run: studio.py finalize ' + a.dir)
    else: print('Fix the failed gates (edit story.json, rebuild) and run review again.')
    return 0 if pct == 100 else 1

def finalize(a):
    work = os.path.abspath(a.dir); out = os.path.join(work, 'out'); gj = os.path.join(out, 'review', 'gates.json'); at = os.path.join(out, 'review', 'attest.json')
    if not os.path.exists(gj): sys.exit('run studio.py review first')
    R = load(gj)
    if R['confidence_pct'] != 100: print('REFUSED: gates not at 100%'); return 1
    if not os.path.exists(at): print('REFUSED: out/review/attest.json missing (look at the sheets, then write it)'); return 1
    A = load(at); need = ('text_legible', 'nothing_overlaps_or_clipped', 'matches_source', 'arrows_follow_the_logic')
    story = load(os.path.join(work, 'story.json')); B = load(os.path.join(out, 'build.json'))['artifacts']
    files = art_files(B); slug = story['meta']['slug']; pf = os.path.join(out, f'{slug}-linkedin-post.txt')
    if 'post' in B: files.append(pf)
    cur = hashlib.sha256((sha(os.path.join(work, 'story.json')) + ''.join(sha(x) for x in sorted(files))).encode()).hexdigest()[:12]
    if cur != R['token']: print('REFUSED: outputs changed since review; run studio.py review again'); return 1
    if A.get('token') != R['token']: print('REFUSED: attest.json token does not match the current review token ' + R['token']); return 1
    if not all(A.get('checked', {}).get(k) is True for k in need): print('REFUSED: every attest "checked" item must be true: ' + ', '.join(need) + '. Fix the problem and rebuild instead of ticking it.'); return 1
    fin = os.path.join(work, 'final'); shutil.rmtree(fin, ignore_errors=True); os.makedirs(fin)
    extra = [os.path.join(out, f'{slug}-subtitles.srt'), os.path.join(out, f'{slug}-poster.jpg')]
    for f in files + [x for x in extra if os.path.exists(x)]: shutil.copy(f, fin)
    dump({'confidence_pct': 100, 'gates': R['gates'], 'token': cur, 'files': {os.path.basename(f): sha(os.path.join(fin, os.path.basename(f))) for f in os.listdir(fin) for f in [os.path.join(fin, f)]}}, os.path.join(fin, 'MANIFEST.json'))
    print('FINAL (all gates 100%, visual review attested):'); [print('  ', os.path.join(fin, f)) for f in sorted(os.listdir(fin))]; return 0

def set_brand(a):
    """studio.py brand [--name N] [--tagline T] [--follow F] [--cta LINE ...] [--avatar FILE] [--voice V] [--speed X] [--reset]"""
    if a.reset:
        for p in (USER_BRAND, USER_AVATAR):
            if os.path.exists(p): os.remove(p)
        print('brand reset to the shipped defaults')
    cur = load(USER_BRAND) if os.path.exists(USER_BRAND) else {}; errs = []
    def put(k, v, lo, hi):
        if v is None: return
        v = v.strip()
        if not lo <= len(v) <= hi: errs.append(f'{k}: {len(v)} chars, must be {lo}-{hi} (the CTA pill is one line)')
        else: cur[k] = v
    put('name', a.name, 2, 30); put('tagline', a.tagline, 4, 44); put('follow', a.follow, 3, 14)
    if a.cta:
        if not 1 <= len(a.cta) <= 4 or any(not 5 <= len(x.strip()) <= 220 for x in a.cta): errs.append('--cta: give 1-4 lines of 5-220 characters each (one --cta per line)')
        else: cur['post_cta'] = [x.strip() for x in a.cta]
    if a.voice: cur['voice'] = a.voice.strip()
    if a.speed is not None:
        if 0.8 <= a.speed <= 1.2: cur['speed'] = a.speed
        else: errs.append('--speed: use 0.8-1.2')
    if a.avatar:
        ext = os.path.splitext(a.avatar)[1].lower()
        if not os.path.isfile(a.avatar) or ext not in ('.png', '.jpg', '.jpeg', '.webp'): errs.append('--avatar: give an existing .png, .jpg or .webp file')
        elif os.path.getsize(a.avatar) > 2 * 1048576: errs.append('--avatar: file is over 2 MB; use a square image around 256-512 px')
        else: os.makedirs(EH, exist_ok=True); shutil.copy(a.avatar, USER_AVATAR); print('avatar saved:', USER_AVATAR)
    if errs: [print('FIX ', e) for e in errs]; return 1
    if cur: dump(cur, USER_BRAND)
    elif not (a.avatar or a.reset): print('(nothing to change: pass --name, --tagline, --follow, --cta, --avatar, --voice, --speed or --reset)')
    b = brand(); print(json.dumps({k: b[k] for k in ('name', 'follow', 'tagline', 'post_cta', 'voice', 'speed') if k in b}, ensure_ascii=False, indent=1))
    print('avatar:', USER_AVATAR if os.path.isfile(USER_AVATAR) else 'shipped default'); print('Saved in ' + USER_BRAND + '. Next: studio.py build DIR --artifacts gif  (reel/post/all as needed), then review and finalize.'); return 0


# ───────────────────────── resources, edit, cta ─────────────────────────
def clean_readme(t):
    t = re.sub(r'<[^>]+>', ' ', t); t = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', t); t = re.sub(r'\[!\[.*?\]\([^)]*\)\]\([^)]*\)', ' ', t)
    t = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', t); t = re.sub(r'```.*?```', ' ', t, flags=re.S); t = re.sub(r'https?://\S+', ' ', t)
    t = re.sub(r'[-=]{3,}', ' ', t); t = re.sub(r'[>*_#`|]+|\[!\w+\]', ' ', t); return re.sub(r'\s+', ' ', t).strip()

def resources_cmd(a):
    """studio.py resources DIR URL [URL ...]: fetch each link once (SSRF-guarded, secrets redacted) and write one grounded source for a learning-resources carousel."""
    work = os.path.abspath(a.dir); os.makedirs(work, exist_ok=True); blocks, meta = [], []
    for n, u in enumerate(a.urls[:10], 1):
        tmp = tempfile.mkdtemp(prefix='es_res_')
        try:
            m = ING.run(u, tmp, max_chars=a.per_link * 3); full = open(os.path.join(tmp, 'source_full.txt'), encoding='utf-8').read()
            body = clean_readme(full)[:a.per_link]; title = m.get('title') or u
            blocks.append((f'{n}. {title}', f'{title}. Link: {u}. {body}')); meta.append({'n': n, 'url': u, 'title': title, 'chars': len(body)}); print(f'[{n}] ok   {u}  ({title[:50]})')
        except SystemExit as e: print(f'[{n}] FAIL {u}: {e}'); meta.append({'n': n, 'url': u, 'error': str(e)})
        except Exception as e: print(f'[{n}] FAIL {u}: {type(e).__name__}: {str(e)[:120]}'); meta.append({'n': n, 'url': u, 'error': str(e)[:200]})
        finally: shutil.rmtree(tmp, ignore_errors=True)
    if not blocks: print('no link could be read; nothing written'); return 1
    ING.build(a.title or 'Learning resources', blocks, '', work, 40000); dump(meta, os.path.join(work, 'resources.json'))
    print(f'-> read {os.path.join(work, "source.md")} once. For each link write carousel.resources.items[]{{name, url, why}} (why = one line taken from that link\'s own text). Failed links stay out of the story.'); return 0

def _tokens(path):
    out = []
    for m in re.finditer(r'([A-Za-z_][\w-]*)|\[(\d+)\]', path): out.append(m.group(1) if m.group(1) is not None else int(m.group(2)))
    if not out: raise ValueError('empty path')
    return out
def set_path(obj, path, value):
    t = _tokens(path); cur = obj
    for k in t[:-1]:
        try: cur = cur[k]
        except (KeyError, IndexError, TypeError):
            if isinstance(k, str) and isinstance(cur, dict): cur[k] = {}; cur = cur[k]
            else: raise ValueError(f'no such place: {path} (stopped at {k})')
    k = t[-1]
    if isinstance(k, int):
        if not isinstance(cur, list) or k >= len(cur): raise ValueError(f'{path}: index out of range')
    cur[k] = value
def parse_value(v):
    try: return json.loads(v)
    except Exception: return v
def save_story(work, story):
    sp = os.path.join(work, 'story.json'); shutil.copy(sp, sp + '.bak') if os.path.exists(sp) else None
    with open(sp, 'w', encoding='utf-8', newline='\n') as f: json.dump(story, f, indent=1, ensure_ascii=False); f.write('\n')
def edit_cmd(a):
    """studio.py edit DIR PATH VALUE [--build gif,carousel] [--slide N]: change one field (PATH like gif.title or carousel.slides[1].cta; VALUE is JSON or plain text)."""
    work = os.path.abspath(a.dir); story = load(os.path.join(work, 'story.json'))
    try: set_path(story, a.path, parse_value(a.value))
    except ValueError as e: print('EDIT FAILED:', e); return 2
    save_story(work, story); print(f'set {a.path} (previous story.json kept as story.json.bak)')
    ok, *_ = do_check(work)
    if not ok: print('The edit made the story fail a check; fix it (or restore story.json.bak).'); return 1
    if a.build: a2 = argparse.Namespace(dir=a.dir, artifacts=a.build, slide=a.slide); return build(a2)
    return 0
def cta_cmd(a):
    """studio.py cta DIR SLIDE TEXT [--build]: set the CTA strip of one carousel slide (1 = title ... last = closing); 'all' sets the default for every slide."""
    work = os.path.abspath(a.dir); story = load(os.path.join(work, 'story.json'))
    if 'carousel' not in story: print('story.json has no carousel'); return 2
    c = story['carousel']; n = CAR.deck_len(c)
    if str(a.slide).lower() == 'all': c['cta_default'] = a.text; path = 'carousel.cta_default'; num = None
    else:
        num = int(a.slide)
        if not 1 <= num <= n: print(f'slide must be 1-{n} or "all"'); return 2
        path = CAR.slide_path(c, num)
    if path != 'carousel.cta_default': set_path(story, path, a.text)
    save_story(work, story); print(f'CTA of {"every slide without its own" if num is None else "slide " + str(num)} -> "{a.text}" ({path})')
    ok, *_ = do_check(work)
    if not ok: return 1
    if a.build: return build(argparse.Namespace(dir=a.dir, artifacts='carousel', slide=None if num is None or path.startswith('carousel.resources') else num))
    return 0

def readercard_cmd(a):
    """studio.py readercard DIR NAME SPEC.json: render shots/NAME.png (a labelled summary card) with Playwright from a small JSON spec."""
    import readercard as RC
    work = os.path.abspath(a.dir); spec = load(os.path.abspath(a.spec)); os.makedirs(os.path.join(work, 'shots'), exist_ok=True)
    hp = os.path.join(work, 'shots', a.name + '.html'); open(hp, 'w', encoding='utf-8', newline='\n').write(RC.render(spec)); out = os.path.join(work, 'shots', a.name + '.png')
    r = run(['node', os.path.join(SKILL, 'engine', 'pageshot.mjs'), hp, out, '--size', '1280x780', '--scale', '2', '--wait', '300'], env=dict(os.environ)); print((r.stdout or '').strip()[-200:])
    os.remove(hp); return 0 if os.path.isfile(out) else 1
def shot_cmd(a):
    """studio.py shot DIR NAME URL: Playwright screenshot of a public page into shots/NAME.png (the page must load with its styles; check the image)."""
    try: ING.check_url(a.url)
    except ValueError as e: print('refused:', e); return 2
    work = os.path.abspath(a.dir); os.makedirs(os.path.join(work, 'shots'), exist_ok=True); out = os.path.join(work, 'shots', a.name + '.png')
    r = run(['node', os.path.join(SKILL, 'engine', 'pageshot.mjs'), a.url, out, '--size', a.size, '--scale', '2'], env=dict(os.environ)); print((r.stdout or '').strip()[-200:] or (r.stderr or '')[-300:])
    return 0 if os.path.isfile(out) else 1

def e2e_cmd(a):
    """studio.py e2e DIR: Playwright end-to-end evaluation of the built carousel (run after build)."""
    import e2e as E2E
    work = os.path.abspath(a.dir); ok0, story, *_ = do_check(work, quiet=True)
    deck = CAR.compile_deck(story); ok, lines = E2E.run(work, [d['type'] for d in deck], story['carousel'].get('theme', 'paper'), story['carousel']['title']['hook'])
    print('\n'.join(lines)); print('E2E', 'PASS' if ok else 'FAIL'); return 0 if ok else 1

def plan_cmd(a):
    """studio.py plan DIR: scan the source for numbers, stages, comparisons, cycles and commands, then write plan.md: questions to ask first and a slide-by-slide infographic proposal to approve before building."""
    work = os.path.abspath(a.dir); src = ''
    for n in ('source_full.txt', 'source.txt', 'source.md'):
        f = os.path.join(work, n)
        if os.path.isfile(f): src = open(f, encoding='utf-8', errors='replace').read(); break
    if not src: print('no source text in ' + work + ' (run ingest first)'); return 1
    low = src.lower(); sig = []
    nums = re.findall(r'\b\d+(?:\.\d+)?\s?(?:%|x|k|m|ms|s|min|hours?|days?|steps?|tools?|frameworks?|users?)\b', src, re.I)
    if len(nums) >= 3: sig.append(('stat / bars / funnel', f'{len(nums)} figures found, e.g. ' + ', '.join(dict.fromkeys(nums[:4])), 'put the biggest number on a ring+waffle (stat), compare 3-5 on bars, or use a funnel if they shrink stage by stage'))
    if len(re.findall(r'(?m)^\s*(?:\d+[.)]|step \d+)', src, re.I)) >= 3 or 'step by step' in low: sig.append(('flow / terminal', 'numbered steps or commands', 'a vertical flow for steps, or a terminal transcript for commands'))
    if re.search(r'\b(loop|cycle|repeat|feedback|iterate)\b', low): sig.append(('loop', 'loop/cycle wording', 'a circular diagram with 3-4 nodes and a centre label'))
    if re.search(r'\b(vs\.?|versus|instead of|rather than|compared (?:to|with)|difference between)\b', low): sig.append(('compare', 'a contrast in the text', 'two cards side by side, 2-3 points each'))
    if re.search(r'\b(layers?|stack|tiers?|levels?)\b', low): sig.append(('stack', 'layers/tiers wording', 'slabs that show what sits on what'))
    if re.search(r'`[^`]+`|\$ \w+|\bnpm |\bpip |\bgit \w+', src): sig.append(('terminal', 'commands in the text', 'a command transcript'))
    if re.search(r'https?://', src): sig.append(('shot', 'links in the text', 'a framed page card per recommended link'))
    if not sig: sig.append(('points / big', 'no numbers, steps or contrasts found', 'icon points for the list, one big quote for the key line'))
    L = ['# Plan (approve before building)', '', '## Ask the person first', '1. Who is this for, and what should they do after the last slide (save, comment, click, follow)?', '2. Which hook style: contrarian reframe, specific reader, "read this before...", number proof, or POV?', '3. Tone: calm explainer, punchy, or technical?', '4. Any slide that must be there, or a claim that must not be made?', '', '## What the source supports', '']
    L += [f'- **{t}**: {why}. Idea: {idea}.' for t, why, idea in sig]
    L += ['', '## Proposed slides (5-7)', '', '1. Cover: short hook, <= 60 characters', *[f'{i}. {t.split(" / ")[0]} slide from the source' for i, (t, _, _) in enumerate(sig[:4], 2)], f'{min(len(sig), 4) + 2}. Closing: question + follow CTA', '', 'Rule: every number or claim on a slide must come from the source. Approve or change this plan, then write story.json.']
    open(os.path.join(work, 'plan.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n'); print('\n'.join(L)); return 0

def cover_cmd(a):
    """studio.py cover DIR --hooks "HOOK ONE" "HOOK TWO" "HOOK THREE" [--look face|poster|both] [--size youtube|reel|grid|all]: video thumbnails, hook <= 4 words each."""
    import cover as CV
    work = os.path.abspath(a.dir); out = os.path.join(work, 'out', 'covers'); os.makedirs(out, exist_ok=True); br = brand()
    bad = [h for h in a.hooks if not 1 <= len(h.split()) <= 4]
    if bad: print('each hook must be 1-4 words (short hooks get clicked): ' + ' | '.join(bad)); return 1
    looks = ['face', 'poster'] if a.look == 'both' else [a.look]; sizes = list(CV.SIZES) if a.size == 'all' else [a.size]
    av = os.path.join(work, 'assets', 'avatar.png'); av = av if os.path.isfile(av) else (USER_AVATAR if os.path.isfile(USER_AVATAR) else os.path.join(SKILL, 'assets', 'avatar.png')); ab = CV.avatar_b64(av)
    slug = re.sub(r'[^a-z0-9]+', '-', (load(os.path.join(work, 'story.json'))['meta'].get('slug') or 'video').lower()).strip('-') if os.path.isfile(os.path.join(work, 'story.json')) else 'video'
    n = 0
    for path, look, size, hook, i in CV.files(out, slug, a.hooks, looks, sizes):
        hp = path[:-4] + '.html'; open(hp, 'w', encoding='utf-8', newline='\n').write(CV.render('poster' if look == 'poster' else 'face', size, hook, i, ab, br['name'], a.kicker or ''))
        W, H = CV.SIZES[size]; r = run(['node', os.path.join(SKILL, 'engine', 'pageshot.mjs'), hp, path, '--size', f'{W}x{H}', '--scale', '1', '--wait', '200'], env=dict(os.environ)); os.remove(hp); n += 1
        if r.returncode: print('cover failed: ' + path); return 1
    print(f'{n} covers in {out}'); return 0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd', required=True)
    dc = sp.add_parser('doctor'); dc.add_argument('--for', dest='for_', choices=['carousel', 'gif', 'reel', 'all'], default='all');  s = sp.add_parser('spec'); s.add_argument('--icons', action='store_true')
    i = sp.add_parser('ingest'); i.add_argument('src'); i.add_argument('--out', default='.'); i.add_argument('--max-chars', type=int, default=36000)
    for n in ('check', 'eval', 'post', 'pick', 'review', 'finalize'): sp.add_parser(n).add_argument('dir')
    br = sp.add_parser('brand')
    for f in ('name', 'tagline', 'follow', 'avatar', 'voice'): br.add_argument('--' + f)
    br.add_argument('--cta', action='append'); br.add_argument('--speed', type=float); br.add_argument('--reset', action='store_true')
    b = sp.add_parser('build'); b.add_argument('dir'); b.add_argument('--artifacts', default=None, help='gif (default), reel, post, carousel, all; comma-separated'); b.add_argument('--slide', type=int, default=None, help='carousel only: rebuild just this slide (1-based), then the PDF')
    rs = sp.add_parser('resources'); rs.add_argument('dir'); rs.add_argument('urls', nargs='+'); rs.add_argument('--title'); rs.add_argument('--per-link', type=int, default=2500)
    ed = sp.add_parser('edit'); ed.add_argument('dir'); ed.add_argument('path'); ed.add_argument('value'); ed.add_argument('--build'); ed.add_argument('--slide', type=int)
    ct = sp.add_parser('cta'); ct.add_argument('dir'); ct.add_argument('slide'); ct.add_argument('text'); ct.add_argument('--build', action='store_true')
    ew = sp.add_parser('editor'); ew.add_argument('dir'); ew.add_argument('--port', type=int, default=0); ew.add_argument('--no-open', action='store_true')
    rc = sp.add_parser('readercard'); rc.add_argument('dir'); rc.add_argument('name'); rc.add_argument('spec')
    sh = sp.add_parser('shot'); sh.add_argument('dir'); sh.add_argument('name'); sh.add_argument('url'); sh.add_argument('--size', default='1280x860')
    pl = sp.add_parser('plan'); pl.add_argument('dir')
    cv = sp.add_parser('cover'); cv.add_argument('dir'); cv.add_argument('--hooks', nargs='+', required=True); cv.add_argument('--look', choices=['face', 'poster', 'both'], default='both'); cv.add_argument('--size', choices=['youtube', 'reel', 'grid', 'all'], default='all'); cv.add_argument('--kicker')
    e2 = sp.add_parser('e2e'); e2.add_argument('dir')
    a = ap.parse_args()
    if a.cmd == 'cover': return cover_cmd(a)
    if a.cmd == 'plan': return plan_cmd(a)
    if a.cmd == 'e2e': return e2e_cmd(a)
    if a.cmd == 'readercard': return readercard_cmd(a)
    if a.cmd == 'shot': return shot_cmd(a)
    if a.cmd == 'editor':
        import editor as ED; return ED.serve(a.dir, a.port, not a.no_open)
    if a.cmd == 'resources': return resources_cmd(a)
    if a.cmd == 'edit': return edit_cmd(a)
    if a.cmd == 'cta': return cta_cmd(a)
    if a.cmd == 'doctor': return doctor(a)
    if a.cmd == 'brand': return set_brand(a)
    if a.cmd == 'spec': return spec(a)
    if a.cmd == 'ingest': m = ING.run(a.src, a.out, a.max_chars); print(json.dumps(m, ensure_ascii=False)); print('-> read', os.path.join(a.out, 'source.md'), 'once; cite chunk ids [cNN]'); return 0
    if a.cmd == 'pick':
        w = os.path.abspath(a.dir); r = PICK.pick(open(os.path.join(w, 'source_full.txt'), encoding='utf-8').read(), load(os.path.join(w, 'source.meta.json'))); print(json.dumps(r, indent=1)); print('limits:', VS.SPEC['gif_templates'][r['template']]); print('skeleton:', PICK.SKELETON[r['template']]); return 0
    if a.cmd in ('check', 'eval'): return 0 if do_check(os.path.abspath(a.dir))[0] else 1
    if a.cmd == 'post':
        ok, story, *_ = do_check(os.path.abspath(a.dir), quiet=True)
        if not ok: return 2
        print(POST.build(story, brand())); return 0
    if a.cmd == 'review': return review(a)
    if a.cmd == 'finalize': return finalize(a)
    if a.cmd == 'build': return build(a)
if __name__ == '__main__': sys.exit(main())
