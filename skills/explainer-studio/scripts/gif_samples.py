"""Render one preview still per GIF template (the studio's GIF page shows them so the person can choose by design).
usage: gif_samples.py [template ...]   (default: every template that has a fixture). Writes studio/samples/gif-<template>.jpg"""
import os, sys, json, shutil, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
H = os.path.dirname(os.path.abspath(__file__)); SK = os.path.join(H, '..'); F = os.path.join(SK, 'fixtures'); OUT = os.path.join(SK, 'studio', 'samples')
def one(name):
    from PIL import Image
    W = tempfile.mkdtemp(prefix='gifs-'); st = json.load(open(os.path.join(F, name + '.story.json'), encoding='utf-8'))
    if 'gif' not in st: return name, None
    tpl = st['gif'].get('template', 'hub'); py = sys.executable
    subprocess.run([py, os.path.join(H, 'studio.py'), 'ingest', os.path.join(F, name + '.md'), '--out', W], capture_output=True)
    shutil.copy(os.path.join(F, name + '.story.json'), os.path.join(W, 'story.json'))
    r = subprocess.run([py, os.path.join(H, 'studio.py'), 'build', W, '--artifacts', 'gif'], capture_output=True, text=True, timeout=1500)
    pngs = [f for f in os.listdir(os.path.join(W, 'out'))] if os.path.isdir(os.path.join(W, 'out')) else []
    png = next((os.path.join(W, 'out', f) for f in pngs if f.endswith('-linkedin.png')), None)
    if png: Image.open(png).convert('RGB').resize((540, 675), Image.LANCZOS).save(os.path.join(OUT, f'gif-{tpl}.jpg'), quality=86, optimize=True)
    else: print(r.stdout[-400:], r.stderr[-300:])
    shutil.rmtree(W, ignore_errors=True); return name, tpl if png else None
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or [f[:-11] for f in sorted(os.listdir(F)) if f.endswith('.story.json') and f != 'carousel.story.json']
    with ThreadPoolExecutor(3) as ex:
        for n, t in ex.map(one, names): print('sample', n, t or 'FAILED', flush=True)
