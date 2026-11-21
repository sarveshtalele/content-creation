"""Offline self-test: ingest fixture, validate sample story, build post. No render needed."""
import os, sys, subprocess, tempfile, shutil
H = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(H, '..', 'fixtures'); W = tempfile.mkdtemp()
def r(*a):
    p = subprocess.run([sys.executable, os.path.join(H, 'studio.py'), *a], capture_output=True, text=True); print(p.returncode, p.stdout[-300:], p.stderr[-300:]); return p.returncode
assert r('ingest', os.path.join(F, 'sample_article.md'), '--out', W) == 0
shutil.copy(os.path.join(F, 'sample_story.json'), os.path.join(W, 'story.json'))
assert r('check', W) == 0 and r('build', W, '--artifacts', 'post') == 0
print('SELFTEST OK'); shutil.rmtree(W)
