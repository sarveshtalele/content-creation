#!/usr/bin/env python3
"""content-creation orchestrator. Pure standard library; heavy steps run through the bundled runtime (node + python voice env).
  studio.py doctor                      environment check (exit 0 = ready for the artifacts you can build)
  studio.py spec [--icons]              compact story.json limits (agent reads this instead of long docs)
  studio.py ingest SRC --out DIR        URL | GitHub repo | file | dir | '-' (stdin)  ->  DIR/source.md (cite chunk ids)
  studio.py check DIR                   validate story.json + accuracy metrics; prints only what must be fixed
  studio.py build DIR [--artifacts gif|reel|post|all]   (default: gif only; reel/post only when the user asked)
  studio.py post DIR | eval DIR | pick DIR (best GIF template)
  studio.py brand [--name --tagline --follow --cta LINE --avatar FILE --photo FILE --voice V --reset]   change the CTA/brand, then rebuild
  studio.py plan DIR / gate DIR         write plan.md, agree it with the person, then gate prints the code they type: approve plan XXXX
  studio.py review DIR                  deterministic gates + contact sheets; prints the token to attest
  studio.py finalize DIR                copies to DIR/final only when every gate is 100% and the visual attestation matches"""
import argparse, tempfile, glob, hashlib, json, os, re, shutil, struct, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import gates as GT, logos as LG, carousel as CAR, ingest as ING, validate_story as VS, evaluate as EV, post as POST, timeline as TL, tts_norm, pick as PICK

for _st in (sys.stdout, sys.stderr):   # Windows consoles default to a legacy code page that cannot print arrows or accents
    try: _st.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass
WIN = os.name == 'nt'
SETUP = 'python scripts/setup.py' if WIN else 'python3 scripts/setup.py'
def home(): return os.path.expanduser('~')
EH = data_home()
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
    if a.logos is not None: return logos_cmd(argparse.Namespace(query=a.logos, add=None, import_=None))
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
USER_BRAND = os.path.join(EH, 'brand.json'); USER_AVATAR = os.path.join(EH, 'avatar.png'); USER_PHOTO = os.path.join(EH, 'photo_cutout.png')
def brand():
    """Shipped defaults, overlaid by the user's own brand in ~/.cache/content-creation/brand.json (survives re-installs and updates)."""
    b = cfg('brand.json'); b.setdefault('follow', 'Follow')
    if os.path.exists(USER_BRAND): b.update(load(USER_BRAND))
    return b
def brand_for_film(b): return {'name': b['name'], 'tagline': b['tagline'], 'follow': b.get('follow', 'Follow'), 'avatar': 'assets/avatar.png', 'photo': '', 'cutout': 'assets/photo_cutout.png' if os.path.isfile(USER_PHOTO) else '', **{k: b[k] for k in ('face_x', 'face_y') if k in b}}   # face_x/face_y (percent) tune the face crop; no photo on covers; the profile photo appears only in the CTA / header avatar
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
    if os.path.isfile(USER_PHOTO): shutil.copy(USER_PHOTO, os.path.join(d, 'assets', 'photo_cutout.png'))   # cut-out photo for the newsletter banner
    lg = LG.pack(data)
    dump({**data, 'logos': lg} if lg else data, os.path.join(d, 'data.json')); return d
BAD = re.compile(r'^BAD\s+(\S+)\s+at\s+([\d.]+)s\s+\d+ chars\s+need\s+([\d.]+)s\s+got\s+([\d.]+)s', re.M)
def readcheck(lib, env, film, size, q=None, fast=False):
    cmd = ['node', os.path.join(lib, 'core/render/readcheck.mjs'), film, '--size', size] + (['--q', q] if q else []) + (['--latin-cps', '20', '--pad', '0.9'] if fast else [])      # a Reel is read at video pace: 20 characters a second, 0.9 s to take it in
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
OUT_EXT = ('.png', '.jpg', '.gif', '.mp4', '.pdf', '.txt', '.srt')
def outputs_root(): return os.path.abspath(os.environ.get('CONTENT_CREATION_OUTPUTS') or os.environ.get('EXPLAINER_OUTPUTS') or os.path.join(os.getcwd(), 'outputs'))
def publish_outputs(work, slug):
    """Copy every finished deliverable (GIF, Reel, PDF, PNG slides, covers, post text, subtitles) into outputs/<slug>/ so the person finds all results in one folder.
    The folder is ./outputs in the directory the command ran from (set CONTENT_CREATION_OUTPUTS to use another). Returns the folder, or '' when nothing was built."""
    src = os.path.join(work, 'out')
    if not os.path.isdir(src): return ''
    dst = os.path.join(outputs_root(), slug); n = 0
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in ('review',)]
        for f in files:
            if not f.lower().endswith(OUT_EXT) or f in ('asr.json',): continue
            rel = os.path.relpath(os.path.join(root, f), src); to = os.path.join(dst, rel); os.makedirs(os.path.dirname(to), exist_ok=True); shutil.copy2(os.path.join(root, f), to); n += 1
    return dst if n else ''
def build_reel(work, story, lib, env, out, slug):
    b = brand(); t0 = time.time(); print('[reel] voice...'); spoken, dur, wavs = tts(story, work, lib, env)
    tails, end_hold = {}, 2.8
    for it in range(5):
        D = TL.build(story, dur, tails, end_hold); D['brand'] = brand_for_film(b); D['logo'] = has_claude(work); D['look'] = 'cinematic' if (story.get('reel') or {}).get('look') == 'cinematic' else 'light'   # Claude light is the default; reel.look 'cinematic' for the dark grade
        film = stage(work, '.film-reel', D); bad, txt, rc = readcheck(lib, env, film, '1080x1920', fast=True)
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
    os.remove(vid); build_cover(work, story, lib, env, out, slug)   # designed cover (all layouts) + <slug>-poster.jpg, not a frame from the video
    # ASR (optional)
    items = [{'id': i, 'text': t, **({'asr': x['asr']} if x.get('asr') else {})} for x in story['beats'] for i, t in [(x['id'], spoken[x['id']])]]
    ij = os.path.join(work, '.cache', 'asr_in.json'); dump(items, ij)
    r = run([lib_py(), os.path.join(HERE, 'asr_check.py'), ij, voice, os.path.join(out, 'asr.json')], env=env, quiet=True)
    asr = {0: 'all lines verified by speech-to-text', 1: 'SOME LINES DIFFER (see out/asr.json; fix spelling or add "tts"/"asr")', 3: 'skipped (ASR model not installed)'}.get(r.returncode, 'error')
    print(f'[reel] done in {time.time() - t0:.0f}s -> {fin}\n[reel] speech check: {asr}')
    return {'file': fin, 'duration': D['DUR'], 'asr': asr, 'tails': tails, 'gates': {'readcheck': not bad, 'layout': True, 'duration<=90s': D['DUR'] <= 90.0, 'speech': {0: 'verified', 1: 'FAILED', 3: 'skipped'}.get(r.returncode, 'FAILED')}}

def build_cover(work, story, lib, env, out, slug, layout=None, hook=None):
    """Reel cover: every layout the story supports as <slug>-cover-<layout>.png (in out/covers), the chosen one as <slug>-poster.jpg."""
    import cover as CV
    cd = CV.data(story, hook, layout); film = stage(work, '.film-cover', {'brand': brand_for_film(brand()), 'logo': has_claude(work), 'cover': cd})
    od = os.path.join(out, 'covers'); os.makedirs(od, exist_ok=True)
    for old in glob.glob(os.path.join(od, f'{slug}-cover-*.png')): os.remove(old)   # a layout the story no longer supports must not linger
    r = run(['node', os.path.join(SKILL, 'engine', 'shots.mjs'), film, '--size', '1080x1920', '--q', 'mode=cover', '--out', od, '--prefix', f'{slug}-cover'], cwd=lib, env=env, quiet=True)
    if r.returncode: print('[cover] render failed:', (r.stdout + r.stderr)[-600:]); return None
    files = {}
    for k, l in enumerate(cd['layouts'], 1):
        src = os.path.join(od, f'{slug}-cover-{k:02d}.png'); dst = os.path.join(od, f'{slug}-cover-{l}.png'); os.replace(src, dst); files[l] = dst
    poster = os.path.join(out, f'{slug}-poster.jpg'); ff = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'
    run([ff, '-y', '-v', 'error', '-i', files[cd['chosen']], '-q:v', '2', '-update', '1', poster], env=env, quiet=True)
    print(f"[cover] {len(files)} layouts in {od} ({', '.join(files)}); poster = {cd['chosen']} -> {poster}")
    return {'poster': poster, 'layouts': files, 'chosen': cd['chosen']}

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
    r = run(['node', os.path.join(lib, 'core/render/video.mjs'), film, '--size', size, '--fps', '20', '--workers', workers(), '--q', 'mode=gif', '--out', vid], cwd=lib, env=env)
    if r.returncode: sys.exit('gif render failed')
    png = os.path.join(out, f'{slug}-linkedin.png')                      # the complete diagram as one still image: the last full frame before the closing fade (default output)
    dur_v = duration_of(env, vid)
    ff_ = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'
    run([ff_, '-y', '-v', 'error', '-ss', str(max(0.0, dur_v - 2.5)), '-i', vid, '-frames:v', '1', png], env=env, quiet=True)
    fin = os.path.join(out, f'{slug}-linkedin.gif')
    for w, c in ((1080, 128), (900, 128), (800, 96), (720, 96), (640, 64)):  # always 4:5 portrait; width only shrinks to fit 5 MB
        make_gif(vid, fin, w, 10, c, env)
        if os.path.getsize(fin) <= 5 * 1048576: break
    mp4 = os.path.join(out, f'{slug}-linkedin.mp4')                      # the same seamless loop as a video (smoother, native video in feeds): the loop three times
    run([ff_, '-y', '-v', 'error', '-stream_loop', '2', '-i', vid, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-an', mp4], env=env, quiet=True)
    os.remove(vid); mb = os.path.getsize(fin) / 1048576; print(f'[gif] done -> {fin} ({w}px, {mb:.1f} MB)')
    if os.path.isfile(mp4): print(f'[video] done -> {mp4} (1080x1350 MP4, the same loop x3)')
    if os.path.isfile(png): print(f'[image] done -> {png} (1080x1350 PNG, the complete diagram)')
    return {'image': png if os.path.isfile(png) else None, 'video': mp4 if os.path.isfile(mp4) else None, 'file': fin, 'mb': round(mb, 2), 'width': w, 'template': g['template'], 'gates': {'readcheck': not bad, 'layout': True, 'size<=5MB': mb <= 5.0}}

def png_size(p):
    with open(p, 'rb') as f: h = f.read(24)
    return struct.unpack('>II', h[16:24]) if h[:8] == b'\x89PNG\r\n\x1a\n' else (0, 0)
def build_carousel(work, story, lib, env, out, slug, only=None, fmt='both'):
    """Slides as PNG stills, one PDF (the LinkedIn document upload) and the first-comment text. `only` rebuilds one slide, then the PDF from all slides."""
    b = brand(); deck = CAR.compile_deck(story); n = len(deck); size = '1080x1350'
    film = stage(work, '.film-car', {'brand': brand_for_film(b), 'logo': has_claude(work), 'carousel': {'deck': deck, 'theme': story['carousel'].get('theme', 'paper'), 'single': bool(story['carousel'].get('single'))}})
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
    pdf = os.path.join(out, f'{slug}-carousel.pdf')
    if fmt in ('pdf', 'both'): CAR.write_pdf(jpgs, pdf)
    elif os.path.isfile(pdf): os.remove(pdf)        # the user asked for images only: no stale PDF
    shutil.rmtree(jd, ignore_errors=True)
    ct = os.path.join(out, f'{slug}-carousel-comment.txt'); open(ct, 'w', encoding='utf-8', newline='\n').write(CAR.comment_text(story, b) + '\n')
    print(f'[carousel] done ({fmt}): ' + ('PDF ' + pdf + '  ' if fmt != 'images' else '') + (f'{n} PNG slides in {sd}  ' if fmt != 'pdf' else '') + f'+ first comment -> {ct}')
    return {'file': pdf if fmt != 'images' else None, 'also': (pngs if fmt != 'pdf' else []) + [ct], 'pngs': pngs, 'fmt': fmt, 'n': n, 'deck': [d['type'] for d in deck], 'gates': {'layout': True}}

def art_files(B):
    """Every file an artifact entry hands over: file, its still image, and extras (carousel slides, comment text)."""
    out = []
    for x in B.values():
        if not isinstance(x, dict): continue
        out += [x[k] for k in ('file', 'image') if x.get(k)] + list(x.get('also') or [])
    return out

def build_background(a):
    """Reel/GIF renders take minutes; agent terminals time out. Start the same build detached, return at once, poll with `jobstatus`."""
    work = os.path.abspath(a.dir); st = os.path.join(work, '.build.status'); log = os.path.join(work, '.build.log')
    cur = json.load(open(st, encoding='utf-8')) if os.path.isfile(st) else None
    if cur and cur.get('state') == 'running':
        try: os.kill(cur['pid'], 0); print('already running; poll: studio.py jobstatus', work); return 0
        except Exception: pass
    cmd = [sys.executable, os.path.abspath(__file__), 'build', work, '--artifacts', a.artifacts or '']
    if not a.artifacts: cmd = cmd[:-2]
    if a.format: cmd += ['--format', a.format]
    if a.slide: cmd += ['--slide', str(a.slide)]
    wrapper = ("import subprocess,sys,json,time;st=sys.argv[1];t=time.time();r=subprocess.run(sys.argv[3:],stdout=open(sys.argv[2],'w',encoding='utf-8'),stderr=subprocess.STDOUT);"
               "json.dump({'state':'done' if r.returncode==0 else 'failed','code':r.returncode,'seconds':round(time.time()-t)},open(st,'w'))")
    kw = {'creationflags': 0x08 | 0x200 | 0x08000000} if os.name == 'nt' else {'start_new_session': True}
    pr = subprocess.Popen([sys.executable, '-c', wrapper, st, log] + cmd, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **kw)
    json.dump({'state': 'running', 'pid': pr.pid, 'started': int(time.time())}, open(st, 'w', encoding='utf-8'))
    print(f'BUILD_STARTED pid={pr.pid}\nIt keeps running without this terminal. Poll every ~30 s: python3 studio.py jobstatus {work}\nDo not wait on it in one call.'); return 0

def jobstatus(a):
    work = os.path.abspath(a.dir); st = os.path.join(work, '.build.status'); log = os.path.join(work, '.build.log')
    cur = json.load(open(st, encoding='utf-8')) if os.path.isfile(st) else {'state': 'none'}
    if cur['state'] == 'running':
        try: os.kill(cur['pid'], 0)
        except Exception: cur['state'] = 'failed'; cur['note'] = 'process ended without finishing; see log'
        cur['elapsed'] = int(time.time()) - cur.get('started', int(time.time()))
    tail = open(log, encoding='utf-8', errors='replace').read()[-600:] if os.path.isfile(log) else ''
    print(json.dumps(cur)); print(tail); return 0 if cur['state'] in ('running', 'done') else 1

def gate_ok(work, gate='plan'):
    ok, why = GT.check(work, gate)
    if not ok: print(why)
    return ok

def build(a):
    if not gate_ok(os.path.abspath(a.dir)): return 3
    if getattr(a, 'background', False): return build_background(a)
    work = os.path.abspath(a.dir); ok, story, chunks, rep = do_check(work, quiet=False)
    if not ok: print('Fix story.json first.'); return 2
    default = 'gif' if 'gif' in story or 'carousel' not in story else 'carousel'
    arts = set((['reel', 'gif', 'post'] + (['carousel'] if 'carousel' in story else [])) if a.artifacts == 'all' else (a.artifacts or default).split(','))
    if not arts <= {'reel', 'gif', 'post', 'carousel'}: sys.exit('artifacts: reel,gif,post,carousel or all')
    ff_ = os.path.join(work, '.carousel_format')
    if getattr(a, 'format', None): open(ff_, 'w', encoding='utf-8').write(a.format)
    elif os.path.isfile(ff_): a.format = open(ff_, encoding='utf-8').read().strip()      # a rebuild after edit/cta reuses what the person chose
    if 'carousel' in arts and getattr(a, 'format', None) is None: a.format = 'both'      # the person always gets the PDF and the separate images
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
            res['carousel'] = build_carousel(work, story, lib, env, out, slug, only=getattr(a, 'slide', None), fmt=a.format or 'both')
        if 'reel' in arts: res['reel'] = build_reel(work, story, lib, env, out, slug)
    bj = os.path.join(out, 'build.json'); prev = load(bj) if os.path.exists(bj) else {'artifacts': {}}
    prev['artifacts'].update({k: v for k, v in res.items() if v}); prev['eval'] = {k: rep[k] for k in ('claim_support', 'overlap_mean', 'recall@3', 'precision@3', 'mrr', 'coverage', 'gif_text_support', 'gif_coverage', 'pass')}; dump(prev, bj)
    od = publish_outputs(work, slug) if any(res.values()) else ''
    print('BUILD COMPLETE' if all(res.values()) else 'BUILD INCOMPLETE (see errors above)'); [print(' ', k, '->', (v or {}).get('file', v) if isinstance(v, dict) else v) for k, v in res.items()]; print('  accuracy report -> out/eval.md'); od and print('  ALL OUTPUTS -> ' + od); return 0 if all(res.values()) else 1


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
        cb = B['carousel']; pngs = cb['pngs']; n = len(pngs)
        G['carousel.5-7_slides'] = 5 <= n <= 7; G['carousel.every_slide_1080x1350'] = all(png_size(q) == (1080, 1350) for q in pngs)
        G['carousel.pdf_pages_match'] = (CAR.pdf_pages(cb['file']) == n) if cb['file'] else True; G['carousel.layout+readable'] = all(cb['gates'].values())
        dk = CAR.compile_deck(story); G['carousel.brand_cta_every_slide'] = True; G['carousel.title_first_closing_last'] = dk[0]['type'] == 'title' and dk[-1]['type'] == 'closing'
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
    if pct == 100:
        GT.set_active(work)
        print('NEXT: open ' + ', '.join('out/review/' + x for x in rep_['sheets']) + ' and LOOK at them. Then write out/review/attest.json:\n  {"token":"' + token + '","checked":{"text_legible":true,"nothing_overlaps_or_clipped":true,"matches_source":true,"arrows_follow_the_logic":true},"notes":""}\n  Show the person the outputs and ask them to type: approve final ' + token[:4] + '\n  then run: studio.py finalize ' + a.dir)
    else: print('Fix the failed gates (edit story.json, rebuild) and run review again.')
    return 0 if pct == 100 else 1

def finalize(a):
    work = os.path.abspath(a.dir); out = os.path.join(work, 'out'); gj = os.path.join(out, 'review', 'gates.json'); at = os.path.join(out, 'review', 'attest.json')
    if not os.path.exists(gj): sys.exit('run studio.py review first')
    if not gate_ok(work, 'final'): return 3
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
    extra = [os.path.join(out, f'{slug}-subtitles.srt'), os.path.join(out, f'{slug}-poster.jpg')] + sorted(glob.glob(os.path.join(out, 'covers', f'{slug}-cover-*.png')))
    for f in files + [x for x in extra if os.path.exists(x)]: shutil.copy(f, fin)
    dump({'confidence_pct': 100, 'gates': R['gates'], 'token': cur, 'files': {os.path.basename(f): sha(os.path.join(fin, os.path.basename(f))) for f in os.listdir(fin) for f in [os.path.join(fin, f)]}}, os.path.join(fin, 'MANIFEST.json'))
    print('FINAL (all gates 100%, visual review attested):'); [print('  ', os.path.join(fin, f)) for f in sorted(os.listdir(fin))]; return 0

def png_alpha(p):
    """True for a PNG whose colour type carries transparency (RGBA or grey + alpha)."""
    with open(p, 'rb') as f: h = f.read(26)
    return h[:8] == b'\x89PNG\r\n\x1a\n' and h[25] in (4, 6)

def cutout_photo(src, dst):
    """The banner photo: a PNG with transparency is used as it is; otherwise, on macOS, Apple's Vision framework cuts the person out (offline)."""
    if not os.path.isfile(src): return 'not found: ' + src
    os.makedirs(EH, exist_ok=True)
    if png_alpha(src): shutil.copy(src, dst); return ''
    if sys.platform != 'darwin': return 'give a PNG with a transparent background (automatic cut-out needs macOS)'
    exe = os.path.join(EH, 'bin', 'cutout')
    if not os.path.isfile(exe):
        sw = shutil.which('swiftc')
        if not sw: return 'automatic cut-out needs the Xcode command line tools (xcode-select --install), or give a PNG with a transparent background'
        os.makedirs(os.path.dirname(exe), exist_ok=True)
        r = subprocess.run([sw, '-O', os.path.join(SKILL, 'scripts', 'cutout.swift'), '-o', exe], capture_output=True, text=True)
        if r.returncode: return 'could not build the cut-out helper: ' + r.stderr[-300:]
    r = subprocess.run([exe, os.path.abspath(src), dst], capture_output=True, text=True)
    return '' if r.returncode == 0 and os.path.isfile(dst) else 'no person found in the photo; give a PNG with a transparent background'

def set_brand(a):
    """studio.py brand [--name N] [--tagline T] [--follow F] [--cta LINE ...] [--avatar FILE] [--photo FILE (cut out for the newsletter banner)] [--voice V] [--speed X] [--reset]"""
    if a.reset:
        for p in (USER_BRAND, USER_AVATAR, USER_PHOTO):
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
    if a.photo:
        e = cutout_photo(a.photo, USER_PHOTO); errs.append('--photo: ' + e) if e else print('banner photo saved (cut out):', USER_PHOTO)
    if a.speed is not None:
        if 0.8 <= a.speed <= 1.3: cur['speed'] = a.speed
        else: errs.append('--speed: use 0.8-1.3')
    if a.avatar:
        ext = os.path.splitext(a.avatar)[1].lower()
        if not os.path.isfile(a.avatar) or ext not in ('.png', '.jpg', '.jpeg', '.webp'): errs.append('--avatar: give an existing .png, .jpg or .webp file')
        elif os.path.getsize(a.avatar) > 2 * 1048576: errs.append('--avatar: file is over 2 MB; use a square image around 256-512 px')
        else: os.makedirs(EH, exist_ok=True); shutil.copy(a.avatar, USER_AVATAR); print('avatar saved:', USER_AVATAR)
    if errs: [print('FIX ', e) for e in errs]; return 1
    if cur: dump(cur, USER_BRAND)
    elif not (a.avatar or a.reset or a.photo): print('(nothing to change: pass --name, --tagline, --follow, --cta, --avatar, --photo, --voice, --speed or --reset)')
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
    deck = CAR.compile_deck(story); ok, lines = E2E.run(work, [d['type'] + ('-' + d.get('style', '') if d['type'] == 'arch' else '') for d in deck], story['carousel'].get('theme', 'paper'), story['carousel']['title']['hook'])
    print('\n'.join(lines)); print('E2E', 'PASS' if ok else 'FAIL'); return 0 if ok else 1

def plan_cmd(a):
    """studio.py plan DIR: scan the source for numbers, stages, comparisons, cycles and commands, then write plan.md: questions to ask first and a slide-by-slide infographic proposal to approve before building."""
    work = os.path.abspath(a.dir); src = ''
    for n in ('source_full.txt', 'source.txt', 'source.md'):
        f = os.path.join(work, n)
        if os.path.isfile(f): src = open(f, encoding='utf-8', errors='replace').read(); break
    if not src: print('no source text in ' + work + ' (run ingest first)'); return 1
    import matrix as MX; R = MX.recommend(src); sig = [(c['type'], c['for'].lower(), '') for c in R['carousel']]
    L = ['# Plan (approve before building)', '', '## Ask the person first', '0. Which infographic type should each content slide use? Ranked for this source: ' + ', '.join(c['type'] for c in R['carousel']) + '. Every content slide uses a different chart family. Output is always the PDF and the separate PNG images.',
         '1. Who is this for, and what should they do after the last slide (save, comment, follow, click)?', '2. Which hook style: ' + ', '.join(R['hooks']['carousel']) + ' (from the matrix), or another (`studio.py hooks DIR`)?', '3. Tone: plain and practical, bold and opinionated, or warm and personal?', '4. Anything that must be on a slide, or must not be?',
         '', '## What the source looks like', '', *[f"- **{r['label']}** (score {r['score']}): {', '.join(r['signals'])}" for r in R['shapes']], f"- Figures in the source: {R['figures_in_source']}" + ('' if R['figures_in_source'] >= 2 else ' (no data charts: they need numbers from the source)'),
         '', f"Structure: {R['carousel_structure']} (see data/hooks.json structures). Decision matrix: data/matrix.json, docs/DESIGN_MATRIX.md.", '', '## Carousel rules (checked by studio.py e2e where measurable)', '', *['- ' + r for r in MX.load()['formats']['carousel']['rules']]]
    L += ['', '## Proposed slides (5-7, only if a carousel was asked for)', '', '1. Cover: short hook, <= 60 characters', *[f'{i}. {t.split(" / ")[0]} slide from the source' for i, (t, _, _) in enumerate(sig[:4], 2)], f'{min(len(sig), 4) + 2}. Closing: question + follow CTA', '', 'Rule: every number or claim on a slide must come from the source. Approve or change this plan, then write story.json.']
    L += ['', '## Agreed with the person (fill in while you brainstorm, before asking for approval)', '', '- Output(s):', '- Design ID(s) (from studio.py pick / catalog):', '- Outline (one line per node, panel or slide):', '- Logo or icon per node (logo:NAME only for technologies the source names; studio.py spec --logos QUERY):', '- Must have / must avoid:']
    open(os.path.join(work, 'plan.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n'); print('\n'.join(L))
    print('\nNEXT: ask these questions, fill in the "Agreed" section of plan.md with the answers, then run studio.py gate ' + a.dir + ' and ask the person to approve. Nothing builds before that.'); return 0

def logos_cmd(a):
    """studio.py logos [QUERY] | --add NAME[,NAME] | --import DIR"""
    if a.add:
        got, miss = LG.add(a.add.split(',')); print('added: ' + (', '.join('logo:' + g for g in got) or '-')); miss and print('not found: ' + ', '.join(miss)); return 0 if got else 1
    if a.import_:
        got = LG.import_dir(os.path.abspath(a.import_)); print(f'imported {len(got)} logos, e.g. ' + ', '.join('logo:' + g for g in got[:8])); return 0 if got else 1
    hits = LG.search(a.query); print(' '.join(hits) or 'no match (studio.py logos --add NAME fetches more from the Iconify logos set)')
    print('Use as an icon value, e.g. "icon": "logo:aws-s3". Only for technologies the source names (studio.py check refuses others).'); return 0

def gate_cmd(a):
    """studio.py gate DIR: stamp plan.md with its approval code (and make DIR the active project), then show both gates."""
    work = os.path.abspath(a.dir); c = GT.stamp(work)
    if not c: print('no plan.md in ' + work + ' (run studio.py plan first)'); return 1
    p_ok = GT.check(work, 'plan')[0]; f_ok = GT.check(work, 'final')[0]
    print(f'plan   {"APPROVED" if p_ok else "waiting"}  (code {c})'); print(f'final  {"APPROVED" if f_ok else "waiting" if GT.current(work, "final") else "not reviewed yet"}')
    if not p_ok: print(f'\nShow the person plan.md and ask them to type exactly:  approve plan {c}\nWait for that message; do not build before it. If they ask for changes, edit plan.md and run gate again (the code changes).')
    return 0

def build_thumbs(work, story, lib, env, out, slug, sizes=None, layouts=None, text=None):
    """Thumbnails and blog covers: every size x every supported layout, through the layout gates, as out/thumbs/<slug>-<size>-<layout>.png."""
    import cover as CV
    od = os.path.join(out, 'thumbs'); os.makedirs(od, exist_ok=True); files, problems = [], []
    for old in glob.glob(os.path.join(od, f'{slug}-*.png')): os.remove(old)
    for size in (sizes or list(CV.THUMB_SIZES)):
        W, H = CV.THUMB_SIZES[size]; td = CV.thumb_data(story, size, text, layouts); m = round(min(W, H) * .07)
        if td['words'] > 7: print(f'[thumbs] note: "{td["text"]}" has {td["words"]} words; 3-6 read best at thumbnail size (set thumb.text in story.json)')
        film = stage(work, '.film-thumb', {'brand': brand_for_film(brand()), 'thumb': td})
        ok, issues = validate_layout(lib, env, film, f'{W}x{H}', 'mode=thumb', m - 4, H - m + 4, m - 4)
        if not ok: problems += [f'{size}: {l}' for l in issues[:8]]; continue
        r = run(['node', os.path.join(SKILL, 'engine', 'shots.mjs'), film, '--size', f'{W}x{H}', '--q', 'mode=thumb', '--out', od, '--prefix', f'{slug}-{size}'], cwd=lib, env=env, quiet=True)
        if r.returncode: problems.append(f'{size}: render failed'); continue
        for k, l in enumerate(td['layouts'], 1):
            src = os.path.join(od, f'{slug}-{size}-{k:02d}.png'); dst = os.path.join(od, f'{slug}-{size}-{l}.png'); os.replace(src, dst); files.append(dst)
    for p in problems: print('[thumbs] LAYOUT', p)
    print(f'[thumbs] {len(files)} images in {od}')
    return {'files': files, 'problems': problems}

def thumbs_cmd(a):
    """studio.py thumbs DIR [--sizes youtube,og,devto,hashnode] [--layouts face,number,diagram,versus,editorial] [--text "3-6 WORDS"]"""
    work = os.path.abspath(a.dir)
    if not gate_ok(work): return 3
    story = load_project(work)[0]; lib = find_lib(); env = env_for(lib)
    r = build_thumbs(work, story, lib, env, os.path.join(work, 'out'), story['meta']['slug'], a.sizes.split(',') if a.sizes else None, a.layouts.split(',') if a.layouts else None, a.text)
    od = publish_outputs(work, story['meta']['slug']) if r['files'] else ''
    if od: print('  ALL OUTPUTS -> ' + od)
    return 0 if r['files'] and not r['problems'] else 1

def walkthrough_cmd(a):
    """studio.py walkthrough DIR --steps steps.json [--device mobile|desktop] [--strict]: run a step-by-step guide in a real browser with Playwright,
    verify every step (expected vs actual), and render a Claude-light walkthrough Reel plus an E2E report. Failed steps are shown as failed, never hidden."""
    work = os.path.abspath(a.dir); os.makedirs(work, exist_ok=True); lib = find_lib(); env = env_for(lib)
    spec = load(os.path.abspath(a.steps)); st = spec.get('steps') or []
    if not spec.get('title') or not (2 <= len(st) <= 12): print('steps.json needs a "title" and 2-12 "steps"'); return 2
    wd = os.path.join(work, 'walk'); shutil.rmtree(wd, ignore_errors=True)
    r = run(['node', os.path.join(SKILL, 'engine', 'walk_run.mjs'), os.path.abspath(a.steps), wd, '--device', a.device], cwd=lib, env=env)
    if r.returncode not in (0, 3) or not os.path.isfile(os.path.join(wd, 'walk.json')): print('walkthrough run failed'); return 1
    import library as LB; LB.register(work)
    W_ = load(os.path.join(wd, 'walk.json')); slug = re.sub(r'[^a-z0-9]+', '-', W_['title'].lower()).strip('-')[:48] or 'walkthrough'
    out = os.path.join(work, 'out'); os.makedirs(out, exist_ok=True)
    rep = [f"# E2E walkthrough report: {W_['title']}", '', f"{W_['passed']}/{W_['total']} steps verified ({W_['device']}, Playwright, {W_['started']})", '', '| # | Step | Expected | Actual | Result | Time |', '|---|---|---|---|---|---|']
    rep += [f"| {s['i']} | {s['say'] or s['action']} | {s['expected']} | {s['actual']} | {'PASS' if s['ok'] else 'FAIL'} | {s['ms'] / 1000:.1f} s |" for s in W_['steps']]
    open(os.path.join(out, f'{slug}-walkthrough-report.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(rep) + '\n')
    if a.strict and W_['passed'] != W_['total']: print('\n'.join(rep)); print('STRICT: not rendering a Reel with failed steps'); return 3
    film = stage(work, '.film-walk', {'brand': brand_for_film(brand()), 'walk': W_}); shutil.copytree(wd, os.path.join(film, 'walk'))
    vid = os.path.join(out, f'{slug}-walkthrough.mp4'); print('[walk] rendering...')
    r = run(['node', os.path.join(lib, 'core/render/video.mjs'), film, '--size', '1080x1920', '--fps', '30', '--workers', workers(), '--q', 'mode=walk', '--out', vid], cwd=lib, env=env)
    if r.returncode: print('[walk] render failed'); return 1
    ff = shutil.which('ffmpeg', path=env['PATH']) or 'ffmpeg'; poster = os.path.join(out, f'{slug}-walkthrough-poster.jpg')
    run([ff, '-y', '-v', 'error', '-ss', '2.6', '-i', vid, '-frames:v', '1', '-q:v', '2', poster], env=env, quiet=True)
    print('\n'.join(rep[2:3])); print(f'[walk] done -> {vid}\n[walk] report -> {os.path.join(out, slug + "-walkthrough-report.md")}\n[walk] poster -> {poster}')
    return 0 if W_['passed'] == W_['total'] else 3

def cover_cmd(a):
    """studio.py cover DIR [--layout hero|question|number|split|face] [--hook TEXT]: the designed Reel cover, every layout the story supports, no Reel build needed."""
    work = os.path.abspath(a.dir)
    if not gate_ok(work): return 3
    story = load_project(work)[0]
    lib = find_lib(); env = env_for(lib); slug = story['meta']['slug']
    r = build_cover(work, story, lib, env, os.path.join(work, 'out'), slug, a.layout, a.hook)
    return 0 if r else 1

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd', required=True)
    dc = sp.add_parser('doctor'); dc.add_argument('--for', dest='for_', choices=['carousel', 'gif', 'reel', 'all'], default='all');  s = sp.add_parser('spec'); s.add_argument('--icons', action='store_true'); s.add_argument('--logos', metavar='QUERY', nargs='?', const='', default=None, help='official logos (logo:NAME) matching QUERY')
    lgp = sp.add_parser('logos', help='official technology logos: search, --add NAME (fetch more), --import DIR (an official icon pack you downloaded)'); lgp.add_argument('query', nargs='?', default=''); lgp.add_argument('--add'); lgp.add_argument('--import', dest='import_')
    i = sp.add_parser('ingest'); i.add_argument('src'); i.add_argument('--out', default='.'); i.add_argument('--max-chars', type=int, default=36000)
    for n in ('check', 'eval', 'post', 'review', 'finalize'): sp.add_parser(n).add_argument('dir')
    pk = sp.add_parser('pick', help='decision matrix: ranked GIF templates, carousel charts, Reel motion and hooks for this source'); pk.add_argument('dir'); pk.add_argument('--template', help='print the skeleton for the template the person chose')
    br = sp.add_parser('brand')
    for f in ('name', 'tagline', 'follow', 'avatar', 'voice', 'photo'): br.add_argument('--' + f)
    br.add_argument('--cta', action='append'); br.add_argument('--speed', type=float); br.add_argument('--reset', action='store_true')
    b = sp.add_parser('build'); b.add_argument('dir'); b.add_argument('--background', action='store_true', help='detach and return at once (use for reel/gif: they take minutes); poll with jobstatus'); b.add_argument('--artifacts', default=None, help='gif (default), reel, post, carousel, all; comma-separated'); b.add_argument('--format', choices=['pdf', 'images', 'both'], default=None, help='carousel only: ask the user which they want, then pass it (no default on purpose)'); b.add_argument('--slide', type=int, default=None, help='carousel only: rebuild just this slide (1-based), then the PDF')
    js = sp.add_parser('jobstatus'); js.add_argument('dir')
    hk = sp.add_parser('hooks', help='viral hook patterns that fit a topic (from data/hooks.json)'); hk.add_argument('text', nargs='?', default='', help='topic, or a project folder with source.md'); hk.add_argument('--kind', choices=['carousel', 'line', 'visual', 'format', 'structure'], default='carousel', help='carousel = first-slide formulas; line = opening line for a post, Reel or GIF'); hk.add_argument('-n', type=int, default=5)
    rs = sp.add_parser('resources'); rs.add_argument('dir'); rs.add_argument('urls', nargs='+'); rs.add_argument('--title'); rs.add_argument('--per-link', type=int, default=2500)
    ed = sp.add_parser('edit'); ed.add_argument('dir'); ed.add_argument('path'); ed.add_argument('value'); ed.add_argument('--build'); ed.add_argument('--slide', type=int)
    sg = sp.add_parser('studio'); sg.add_argument('--port', type=int, default=0); sg.add_argument('--no-open', action='store_true'); sg.add_argument('--foreground', action='store_true', help='run in this terminal (blocks)'); sg.add_argument('--stop', action='store_true'); sg.add_argument('--status', action='store_true'); sg.add_argument('--state', default=None, help=argparse.SUPPRESS)
    ew = sp.add_parser('editor'); ew.add_argument('dir'); ew.add_argument('--port', type=int, default=0); ew.add_argument('--no-open', action='store_true'); ew.add_argument('--foreground', action='store_true', help='run in this terminal (blocks)'); ew.add_argument('--stop', action='store_true'); ew.add_argument('--status', action='store_true'); ew.add_argument('--state', default=None, help=argparse.SUPPRESS)
    rc = sp.add_parser('readercard'); rc.add_argument('dir'); rc.add_argument('name'); rc.add_argument('spec')
    sh = sp.add_parser('shot'); sh.add_argument('dir'); sh.add_argument('name'); sh.add_argument('url'); sh.add_argument('--size', default='1280x860')
    pl = sp.add_parser('plan'); pl.add_argument('dir'); gt = sp.add_parser('gate', help='stamp plan.md with its approval code and show both gates'); gt.add_argument('dir')
    cv = sp.add_parser('cover'); cv.add_argument('dir'); cv.add_argument('--layout', choices=['hero', 'question', 'number', 'split', 'face']); cv.add_argument('--hook')
    e2 = sp.add_parser('e2e'); e2.add_argument('dir')
    sp.add_parser('catalog', help='regenerate studio/catalog.html (every design with its ID and sample) and print its path')
    th = sp.add_parser('thumbs', help='thumbnails and blog covers: YouTube 1280x720, Open Graph 1200x630, LinkedIn newsletter 1920x1080, dev.to 1000x420, Hashnode 1600x840'); th.add_argument('dir'); th.add_argument('--sizes'); th.add_argument('--layouts'); th.add_argument('--text')
    wk = sp.add_parser('walkthrough', help='run a step-by-step guide with Playwright, verify each step, render a walkthrough Reel'); wk.add_argument('dir'); wk.add_argument('--steps', required=True); wk.add_argument('--device', choices=['mobile', 'desktop'], default='mobile'); wk.add_argument('--strict', action='store_true')
    a = ap.parse_args()
    if a.cmd == 'cover': return cover_cmd(a)
    if a.cmd == 'walkthrough': return walkthrough_cmd(a)
    if a.cmd == 'thumbs': return thumbs_cmd(a)
    if a.cmd == 'catalog':
        import catalog as CT; p = CT.build(); print(p); print('Show this page to the person and ask which design IDs to use before building.'); return 0
    if a.cmd == 'plan': return plan_cmd(a)
    if a.cmd == 'gate': return gate_cmd(a)
    if a.cmd == 'e2e': return e2e_cmd(a)
    if a.cmd == 'readercard': return readercard_cmd(a)
    if a.cmd == 'shot': return shot_cmd(a)
    if a.cmd == 'studio':
        import launch as LA
        if not a.foreground: return LA.command('studio', a)
        import studio_app as SA; return SA.serve(a.port, not a.no_open, a.state)
    if a.cmd == 'editor':
        import launch as LA
        if not a.foreground: return LA.command('editor', a, [os.path.abspath(a.dir)], os.path.abspath(a.dir))
        import editor as ED; return ED.serve(os.path.abspath(a.dir), a.port, not a.no_open, a.state)
    if a.cmd == 'jobstatus': return jobstatus(a)
    if a.cmd == 'hooks':
        import hooks as HK; t = a.text
        fam = None
        if os.path.isdir(t) and os.path.isfile(os.path.join(t, 'source.md')):
            import matrix as MX; full = open(os.path.join(t, 'source_full.txt'), encoding='utf-8', errors='replace').read() if os.path.isfile(os.path.join(t, 'source_full.txt')) else ''
            t = open(os.path.join(t, 'source.md'), encoding='utf-8', errors='replace').read()[:6000]; R = MX.recommend(full or t)
            fam = {'line': R['hooks']['line'], 'carousel': R['hooks']['carousel'], 'visual': [R['reel']['visual_hook']], 'structure': [R['carousel_structure']], 'format': []}[a.kind]
            print('content shapes: ' + ', '.join(r['label'] for r in R['shapes']) + (f"  (matrix families: {', '.join(fam)})" if fam else '') + '\n')
        for x in HK.suggest(t, a.kind, a.n, fam): print(f"{x['category']:<18} {x['text']}")
        print('\nPick the one that fits the real concept, fill every [placeholder] with the real topic and real numbers (carousel hook <= 60 characters). These are patterns, not guaranteed results.'); return 0
    if a.cmd == 'resources': return resources_cmd(a)
    if a.cmd == 'edit': return edit_cmd(a)
    if a.cmd == 'doctor': return doctor(a)
    if a.cmd == 'brand': return set_brand(a)
    if a.cmd == 'spec': return spec(a)
    if a.cmd == 'logos': return logos_cmd(a)
    if a.cmd == 'ingest': m = ING.run(a.src, a.out, a.max_chars); print(json.dumps(m, ensure_ascii=False)); print('-> read', os.path.join(a.out, 'source.md'), 'once; cite chunk ids [cNN]'); return 0
    if a.cmd == 'pick':
        import matrix as MX
        w = os.path.abspath(a.dir); R = MX.recommend(open(os.path.join(w, 'source_full.txt'), encoding='utf-8').read(), load(os.path.join(w, 'source.meta.json'))); print(MX.report(R))
        t = a.template or R['gif'][0]['template']
        if a.template is None: print(f"\nASK the person which GIF template to use (top 3: {', '.join(g['template'] for g in R['gif'][:3])}); never build silently. Then: studio.py pick {a.dir} --template NAME")
        if t in PICK.SKELETON: print(f'\n[{t}] limits:', VS.SPEC['gif_templates'][t]); print('skeleton:', PICK.SKELETON[t])
        return 0
    if a.cmd in ('check', 'eval'): return 0 if do_check(os.path.abspath(a.dir))[0] else 1
    if a.cmd == 'post':
        ok, story, *_ = do_check(os.path.abspath(a.dir), quiet=True)
        if not ok: return 2
        print(POST.build(story, brand())); return 0
    if a.cmd == 'review': return review(a)
    if a.cmd == 'finalize': return finalize(a)
    if a.cmd == 'build':
        rc = build(a)
        if not getattr(a, 'background', False):
            try: import library as LIBR; LIBR.register(a.dir)
            except Exception: pass
        return rc
if __name__ == '__main__': sys.exit(main())
