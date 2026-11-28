"""Offline self-test: for every fixture, ingest it, run check, build the post (when present) and the template picker. No render needed."""
import os, sys, subprocess, tempfile, shutil
H = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(H, '..', 'fixtures')
sys.path.insert(0, H); import gates as GT
def r(*a):
    p = subprocess.run([sys.executable, os.path.join(H, 'studio.py'), *a], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if p.returncode: print(p.stdout[-600:], p.stderr[-400:])
    return p.returncode
for md in sorted(f for f in os.listdir(F) if f.endswith('.md')):
    name = md[:-3]; W = tempfile.mkdtemp()
    assert r('ingest', os.path.join(F, md), '--out', W) == 0, name
    shutil.copy(os.path.join(F, name + '.story.json'), os.path.join(W, 'story.json'))
    assert r('check', W) == 0, name
    assert r('pick', W) == 0, name
    GT.approve_ui(W, 'selftest')   # a throwaway fixture folder
    if '"post"' in open(os.path.join(W, 'story.json'), encoding='utf-8').read(): assert r('build', W, '--artifacts', 'post') == 0, name
    print('ok', name); shutil.rmtree(W)
# the approval gate: a fresh folder with no approved plan must refuse to build
W = tempfile.mkdtemp(); shutil.copy(os.path.join(F, 'https.story.json'), os.path.join(W, 'story.json')); assert r('build', W, '--artifacts', 'post') == 3, 'gate'; shutil.rmtree(W)
print('SELFTEST OK')
