"""Offline checks for the Design Studio: registry limits match samples, every sample builds a valid story, the server refuses bad tokens and hosts."""
import json, os, sys, time, threading, urllib.request, urllib.error, socket
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(HERE); sys.path.insert(0, os.path.join(SK, 'scripts'))
import designs as DS

def walk(spec, val, path, bad):
    for f in spec:
        v = val.get(f['key']) if isinstance(val, dict) else None
        if f['type'] == 'text' and v is not None and not (f.get('min', 0) <= len(v) <= f['max']): bad.append(f'{path}.{f["key"]} length {len(v)} not in {f.get("min", 0)}-{f["max"]}')
        if f['type'] == 'list':
            if not (f['min'] <= len(v or []) <= f['max']): bad.append(f'{path}.{f["key"]} has {len(v or [])} items')
            for i, it in enumerate(v or []): walk(f['item'], it, f'{path}.{f["key"]}[{i}]', bad)
        if f['type'] == 'icon' and v is not None and v not in DS.ICONS: bad.append(f'{path}.{f["key"]} icon {v}')
bad = []
for d in DS.DESIGNS:
    walk(d['fields'], d['sample'], d['id'], bad)
    kind, frag = d['build'](d['sample']); assert kind in ('title', 'slide'), d['id']
    if kind == 'title': assert frag['layout'] in ('bold', 'stage', 'editorial', 'terminal', 'poster'), d['id']
    assert os.path.isfile(os.path.join(SK, 'studio', 'samples', d['id'] + '.jpg')), 'missing sample thumbnail ' + d['id']
assert not bad, bad
story, src = DS.assemble([{'design': 'cover-bold', 'values': DS.BY_ID['cover-bold']['sample']}, {'design': 'info-loop', 'values': DS.BY_ID['info-loop']['sample']}], {'title': 'What will you try first?', 'lines': []}, 'sky', False, 'Name')
assert story['carousel']['short'] and story['carousel']['slides'][0]['type'] == 'loop' and 'Claude Code' in src
import studio_app as SA, studio as ST
with socket.socket() as s: s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]
os.environ['EXPLAINER_HOME'] = os.path.join(HERE, '_studio_home'); threading.Thread(target=SA.serve, args=(port, False), daemon=True).start()
import time; time.sleep(1.5)
def code(path, host=None):
    for attempt in range(8):                      # slow runners: the server thread may still be starting
        r = urllib.request.Request(f'http://127.0.0.1:{port}{path}')
        if host: r.add_header('Host', host)
        try: return urllib.request.urlopen(r, timeout=20).status
        except urllib.error.HTTPError as e: return e.code
        except (urllib.error.URLError, socket.timeout, ConnectionError): time.sleep(2)
    raise AssertionError('studio server did not answer')
assert code('/') == 403 and code('/api/designs?t=wrong') == 403, 'token required'
assert code('/?t=x', 'evil.example.com') == 403, 'foreign host refused'
assert code('/samples/../../scripts/studio.py') in (403, 404), 'no path escape'

# ---- launcher: returns at once, reuses the running app, reports status, stops cleanly (the Antigravity "app never launches" failure) ----
import subprocess, tempfile, re
_env = dict(os.environ, HOME=tempfile.mkdtemp(prefix='eh-'), USERPROFILE=tempfile.mkdtemp(prefix='eh-'), XDG_CACHE_HOME=tempfile.mkdtemp(prefix='eh-'))
def _studio(*a):
    t0 = time.time(); r = subprocess.run([sys.executable, os.path.join(SK, 'scripts', 'studio.py'), 'studio', *a], capture_output=True, text=True, encoding='utf-8', timeout=150, env=_env)
    return r.returncode, r.stdout + r.stderr, time.time() - t0
rc, out, dt = _studio('--no-open'); m = re.search(r'APP_URL=(\S+)', out)
assert rc == 0 and m and dt < 90, ('launcher must return quickly with APP_URL', rc, out[-300:], dt)
rc2, out2, _ = _studio('--no-open'); assert re.search(r'APP_URL=(\S+)', out2).group(1) == m.group(1), 'second call must reuse the running app'
rc3, out3, _ = _studio('--status'); assert out3.strip().startswith('RUNNING'), out3
try: assert urllib.request.urlopen(m.group(1).split('?')[0].rstrip('/') + '/health', timeout=5).status == 200
finally: _studio('--stop')
rc4, out4, _ = _studio('--status'); assert not out4.strip().startswith('RUNNING'), out4
print('STUDIO TESTS OK')
