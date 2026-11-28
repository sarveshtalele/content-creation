"""Portability rules: the plugin must behave the same on macOS, Windows and Linux. Offline, standard library only."""
import ast, os, re, shutil, sys, tempfile
H = os.path.dirname(os.path.abspath(__file__)); S = os.path.abspath(os.path.join(H, '..')); R = os.path.abspath(os.path.join(S, '..', '..'))
sys.path.insert(0, os.path.join(S, 'scripts'))
fails = []
def check(ok, msg):
    if not ok: fails.append(msg)

# 1. every text open() in Python names an encoding (Windows defaults to a legacy code page)
for root, _, files in os.walk(S):
    if 'node_modules' in root or '__pycache__' in root: continue
    for f in files:
        if not f.endswith('.py') or f == 'test_platform.py': continue
        p = os.path.join(root, f)
        for n in ast.walk(ast.parse(open(p, encoding='utf-8').read())):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == 'open':
                mode = ''.join(a.value for a in n.args[1:2] if isinstance(a, ast.Constant) and isinstance(a.value, str)) + ''.join(k.value.value for k in n.keywords if k.arg == 'mode' and isinstance(k.value, ast.Constant))
                if 'b' not in mode and not any(k.arg == 'encoding' for k in n.keywords): check(False, f'{os.path.relpath(p, R)}:{n.lineno} open() without encoding')

# 2. no hard-coded POSIX-only paths or shell calls in the Python orchestration
for f in ('studio.py', 'ingest.py', 'setup.py', 'selftest.py'):
    t = open(os.path.join(S, 'scripts', f), encoding='utf-8').read()
    check('/dev/null' not in t, f'{f}: use os.devnull')
    check(not re.search(r"""\[\s*['"]sh['"]\s*,""", t), f'{f}: calls sh directly (use sh_exe())')
    if f == 'studio.py': check("cmd[0] in ('ffmpeg', 'ffprobe', 'node')" in t, 'studio.run() must resolve ffmpeg/ffprobe/node with the env PATH (a bare name ignores env on Windows)')
    check('shell=True' not in t, f'{f}: shell=True')

# 3. shell scripts that must stay LF are pinned by .gitattributes, and none contains CRLF
ga = open(os.path.join(R, '.gitattributes'), encoding='utf-8').read(); check('*.sh text eol=lf' in ga, '.gitattributes must pin *.sh to LF')
for root, _, files in os.walk(S):
    if 'node_modules' in root: continue
    for f in files:
        if f.endswith('.sh'): check(b'\r\n' not in open(os.path.join(root, f), 'rb').read(), f'{f} has CRLF line endings')

# 4. versions agree across the manifests and the changelog
import json
v = {json.load(open(os.path.join(R, p), encoding='utf-8')).get('version') or json.load(open(os.path.join(R, p), encoding='utf-8'))['plugins'][0]['version'] for p in ('.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/marketplace.json')}
check(len(v) == 1, f'manifest versions differ: {v}')
m = re.search(r'^## (\d+\.\d+\.\d+)', open(os.path.join(R, 'CHANGELOG.md'), encoding='utf-8').read(), re.M); check(bool(m) and m.group(1) in v, f'CHANGELOG top version {m and m.group(1)} != manifests {v}')

# 5. link() works without symlink rights (falls back instead of failing) and install.py copies the skill
import setup as SETUP, builtins
T = tempfile.mkdtemp()
try:
    src = os.path.join(T, 'src'); os.makedirs(src); open(os.path.join(src, 'a.txt'), 'w', encoding='utf-8').write('x')
    real = os.symlink
    def nope(*a, **k): raise OSError('no privilege')
    os.symlink = nope
    try: SETUP.link(src, os.path.join(T, 'dst'))
    finally: os.symlink = real
    check(os.path.exists(os.path.join(T, 'dst', 'a.txt')), 'link() fallback did not produce a usable folder')
    env = dict(os.environ, HOME=T, USERPROFILE=T)
    import subprocess
    r = subprocess.run([sys.executable, os.path.join(R, 'install.py')], env=env, capture_output=True, text=True, encoding='utf-8')
    check(r.returncode == 0 and os.path.isfile(os.path.join(T, '.claude', 'skills', 'content-creation', 'SKILL.md')), 'install.py did not install SKILL.md: ' + r.stderr[-200:])
finally: shutil.rmtree(T, ignore_errors=True)

# 6a. `studio.py brand` validates lengths, saves outside the repo, and --reset removes it
T2 = tempfile.mkdtemp()
try:
    import subprocess
    e2 = dict(os.environ, CONTENT_CREATION_HOME=T2); st = os.path.join(S, 'scripts', 'studio.py')
    def br(*a): return subprocess.run([sys.executable, st, 'brand', *a], env=e2, capture_output=True, text=True, encoding='utf-8')
    check(br('--tagline', 'x' * 60).returncode == 1, 'brand accepted a tagline that cannot fit the pill')
    ok = br('--name', 'Test Person', '--follow', 'Join', '--cta', 'Repost this please', '--cta', 'Follow Test Person')
    saved = json.load(open(os.path.join(T2, 'brand.json'), encoding='utf-8')) if os.path.exists(os.path.join(T2, 'brand.json')) else {}
    check(ok.returncode == 0 and saved.get('follow') == 'Join' and len(saved.get('post_cta', [])) == 2, 'brand did not save the override: ' + ok.stderr[-200:])
    br('--reset'); check(not os.path.exists(os.path.join(T2, 'brand.json')), 'brand --reset left the override behind')
finally: shutil.rmtree(T2, ignore_errors=True)

# 6. Python files parse on the oldest tested interpreter syntax
for f in ('studio.py', 'setup.py'): ast.parse(open(os.path.join(S, 'scripts', f), encoding='utf-8').read())
print('PLATFORM TESTS OK' if not fails else 'PLATFORM TESTS FAILED:\n  ' + '\n  '.join(fails)); sys.exit(1 if fails else 0)
