#!/usr/bin/env python3
"""One-time setup, identical on macOS, Linux and Windows (safe to re-run).
Installs: node deps + headless browser, Python voice env, voice model (SHA-256 verified), ffmpeg >= 7.
Needs: node >= 20 with npm, python 3.11-3.13. Everything heavy lives in ~/.cache/explainer-studio (override: EXPLAINER_HOME).
usage: python setup.py [light|asr]   light = carousels, stills and GIFs only (node deps + browser + ffmpeg; no voice model, no Python 3.11-3.13 needed: the mode for ChatGPT and other small sandboxes)
                                     asr = also install the optional speech-to-text check"""
import hashlib, os, shutil, subprocess, sys, urllib.request

WIN = os.name == 'nt'
HERE = os.path.dirname(os.path.abspath(__file__)); RT = os.path.abspath(os.path.join(HERE, '..', 'runtime'))
EH = os.environ.get('EXPLAINER_HOME') or os.path.join(os.path.expanduser('~'), '.cache', 'explainer-studio')
ND = os.path.join(EH, 'node'); MODELS = os.path.join(EH, 'models'); BIN = os.path.join(EH, 'bin'); VENV = os.path.join(EH, 'venv')
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0'
SHA = {'kokoro-v1.0.onnx': '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',
       'voices-v1.0.bin': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d'}
EXE = '.exe' if WIN else ''

def say(m): print(m, flush=True)
def die(m): print('ERROR: ' + m, file=sys.stderr); sys.exit(1)
def run(cmd, cwd=None, check=True):
    r = subprocess.run(cmd, cwd=cwd)
    if check and r.returncode: die('command failed: ' + ' '.join(map(str, cmd)))
    return r.returncode == 0
def out(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace').stdout.strip()
    except OSError: return ''

def link(src, dst):
    """Symlink where allowed; on Windows fall back to a junction, then to a copy. Never fails silently."""
    if os.path.lexists(dst):
        if os.path.isdir(dst) and not os.path.islink(dst) and not _is_junction(dst): return   # a real folder is already there
        try: os.remove(dst) if (os.path.islink(dst) or os.path.isfile(dst)) else os.rmdir(dst)
        except OSError: pass
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    try: os.symlink(src, dst, target_is_directory=os.path.isdir(src)); return
    except (OSError, NotImplementedError): pass
    if WIN and os.path.isdir(src):
        if subprocess.run(['cmd', '/c', 'mklink', '/J', dst, src], capture_output=True).returncode == 0: return
    (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, dst)
def _is_junction(p):
    try: return os.path.isjunction(p)          # Python 3.12+
    except AttributeError: return False

def sha_of(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()

def download(url, dst):
    """Resumable download over the standard library (no curl needed)."""
    part = dst + '.part'; have = os.path.getsize(part) if os.path.exists(part) else 0
    req = urllib.request.Request(url, headers={'Range': f'bytes={have}-'} if have else {})
    try: r = urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as e:
        if e.code == 416: os.replace(part, dst); return              # already complete
        raise
    f = open(part, 'ab') if (have and r.status == 206) else open(part, 'wb')
    with f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    os.replace(part, dst)

def pick_python():
    v = sys.version_info
    if (3, 11) <= (v.major, v.minor) <= (3, 13): return [sys.executable]
    cands = [['py', '-3.12'], ['py', '-3.13'], ['py', '-3.11']] if WIN else []
    cands += [[c] for c in ('python3.12', 'python3.13', 'python3.11', 'python3', 'python')]
    for c in cands:
        if shutil.which(c[0]):
            ver = out(c + ['-c', 'import sys; print("%d.%d" % sys.version_info[:2])'])
            if ver in ('3.11', '3.12', '3.13'): return c
    die('Python 3.11-3.13 is required for the voice engine (the voice packages do not support newer or older versions yet). Install one, then re-run.')

def main():
    node, npm = shutil.which('node'), shutil.which('npm')
    if not node or not npm: die('Node.js >= 20 with npm is required (https://nodejs.org). Install it, then re-run.')
    if int((out([node, '-v']).lstrip('v') or '0').split('.')[0]) < 20: die('Node.js >= 20 is required.')
    for d in (MODELS, BIN, ND): os.makedirs(d, exist_ok=True)
    shutil.copy(os.path.join(RT, 'package.json'), os.path.join(ND, 'package.json'))
    say('[1/5] node dependencies'); run([npm, 'install', '--no-audit', '--no-fund', '--silent'], cwd=ND)
    link(os.path.join(ND, 'node_modules'), os.path.join(RT, 'node_modules'))
    say('[2/5] headless browser')
    if not run([node, os.path.join(ND, 'node_modules', 'playwright-core', 'cli.js'), 'install', 'chromium-headless-shell'], check=False):
        say('WARNING: browser download failed. Set PLAYWRIGHT_CHROME to a chrome-headless-shell binary, or fix the network and re-run.')
    LIGHT = len(sys.argv) > 1 and sys.argv[1] == 'light'
    if LIGHT: say('[3/5] voice environment skipped (light mode)'); say('[4/5] voice model skipped (light mode)')
    if not LIGHT: say('[3/5] python voice environment')
    if not LIGHT:
        py = pick_python(); vpy = os.path.join(VENV, 'Scripts', 'python.exe') if WIN else os.path.join(VENV, 'bin', 'python')
        if not os.path.exists(vpy): run(py + ['-m', 'venv', VENV])
        run([vpy, '-m', 'pip', 'install', '-q', '--upgrade', 'pip'])
        run([vpy, '-m', 'pip', 'install', '-q', 'kokoro-onnx', 'numpy', 'soundfile', 'soxr', 'scipy'])
        say('[4/5] voice model (about 350 MB, resumable)')
        for f, want in SHA.items():
            p = os.path.join(MODELS, f)
            if not (os.path.exists(p) and os.path.getsize(p)): download(f'{BASE}/{f}', p)
            if sha_of(p) != want:
                os.remove(p); die(f'CHECKSUM MISMATCH for {f}: deleted it. Re-run setup, or check your network or proxy.')
    say('[5/5] ffmpeg >= 7')
    import re
    m = re.search(r'ffmpeg version n?(\d+)', out(['ffmpeg', '-version']) if shutil.which('ffmpeg') else '')
    if (int(m.group(1)) if m else 0) < 7:
        run([npm, 'install', '--no-audit', '--no-fund', '--silent', 'ffmpeg-static'], cwd=ND)
        link(os.path.join(ND, 'node_modules', 'ffmpeg-static', 'ffmpeg' + EXE), os.path.join(BIN, 'ffmpeg' + EXE))
        sysprobe = shutil.which('ffprobe')
        if sysprobe: link(sysprobe, os.path.join(BIN, 'ffprobe' + EXE))
        else:
            run([npm, 'install', '--no-audit', '--no-fund', '--silent', 'ffprobe-static'], cwd=ND)
            link(os.path.join(ND, 'node_modules', 'ffprobe-static', 'bin', sys.platform if sys.platform in ('win32', 'darwin') else 'linux', out([node, '-p', 'process.arch']), 'ffprobe' + EXE), os.path.join(BIN, 'ffprobe' + EXE))
    if LIGHT: pass
    elif len(sys.argv) > 1 and sys.argv[1] == 'asr': run([vpy, '-m', 'pip', 'install', '-q', 'sherpa-onnx'])
    else: say(f'Optional speech-to-text verification: python "{os.path.join(HERE, "setup.py")}" asr   (not required)')
    say(f'Done. Next: python "{os.path.join(HERE, "studio.py")}" doctor' + (' --for gif' if LIGHT else ''))

if __name__ == '__main__': main()
