"""Offline self-test: for every fixture, ingest it, run check, build the post (when present) and the template picker. No render needed."""
import os, sys, subprocess, tempfile, shutil
H = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(H, '..', 'fixtures')
def r(*a):
    p = subprocess.run([sys.executable, os.path.join(H, 'studio.py'), *a], capture_output=True, text=True)
    if p.returncode: print(p.stdout[-600:], p.stderr[-400:])
    return p.returncode
for md in sorted(f for f in os.listdir(F) if f.endswith('.md')):
    name = md[:-3]; W = tempfile.mkdtemp()
    assert r('ingest', os.path.join(F, md), '--out', W) == 0, name
    shutil.copy(os.path.join(F, name + '.story.json'), os.path.join(W, 'story.json'))
    assert r('check', W) == 0, name
    assert r('pick', W) == 0, name
    if '"post"' in open(os.path.join(W, 'story.json'), encoding='utf-8').read(): assert r('build', W, '--artifacts', 'post') == 0, name
    print('ok', name); shutil.rmtree(W)
print('SELFTEST OK')
