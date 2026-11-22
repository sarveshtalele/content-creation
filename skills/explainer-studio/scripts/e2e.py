"""e2e: Playwright evaluation of a built carousel (every slide rendered in a real browser) plus file checks on the deliverables.
Writes out/e2e.json and out/e2e.md and returns (ok, lines)."""
import json, os, subprocess, sys, re, struct, glob
H = os.path.dirname(os.path.abspath(__file__)); SKILL = os.path.dirname(H)
def png_wh(p):
    h = open(p, 'rb').read(24); return struct.unpack('>II', h[16:24]) if h[:8] == b'\x89PNG\r\n\x1a\n' else (0, 0)
def run(work, deck_types, theme, hook, expect_pdf_pages=None):
    out = os.path.join(work, 'out'); film = os.path.join(work, '.film-car'); lines = []; ok = True
    r = subprocess.run(['node', os.path.join(SKILL, 'engine', 'carousel_eval.mjs'), film], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=300)
    try: res = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception: return False, ['browser evaluation produced no result: ' + (r.stderr or '')[-300:]]
    def gate(name, cond, detail=''):
        nonlocal ok; ok &= bool(cond); lines.append(f'{"PASS" if cond else "FAIL"}  {name}' + (f'  ({detail})' if detail else ''))
    pngs = sorted(glob.glob(os.path.join(out, 'carousel', '*.png'))); pdfs = glob.glob(os.path.join(out, '*-carousel.pdf'))
    gate('5-7 slides rendered in a real browser', 5 <= res['slides'] <= 7, f'{res["slides"]} slides')
    gate('one PNG per slide, all 1080x1350', len(pngs) == res['slides'] and all(png_wh(p) == (1080, 1350) for p in pngs), f'{len(pngs)} PNGs')
    if pdfs:
        n = len(re.findall(rb'/Type /Page\b', open(pdfs[0], 'rb').read())); gate('PDF has one page per slide', n == res['slides'], f'{n} pages')
    gate('every image loads and avatar/screenshots are not upscaled >1.3x (sharp)', not [p for p in res['problems'] if 'image' in p or 'blurry' in p], '; '.join(p for p in res['problems'] if 'image' in p or 'blurry' in p)[:200])
    gate('text contrast readable on every slide', not [p for p in res['problems'] if 'contrast' in p], '; '.join(p for p in res['problems'] if 'contrast' in p)[:200])
    gate('no text under 20px', not [p for p in res['problems'] if 'under 20px' in p], '; '.join(p for p in res['problems'] if 'under 20px' in p)[:200])
    gate('hook is short enough to read at a glance (<= 60 characters)', len(hook) <= 60, f'{len(hook)} chars')
    kinds = {t for t in deck_types if t not in ('title', 'closing')}; gate('at least two different infographic slide types', len(kinds) >= 2, ', '.join(sorted(kinds)))
    gate('first slide is a poster/terminal title, last slide is the CTA', deck_types[0] == 'title' and deck_types[-1] == 'closing')
    json.dump({'result': res, 'theme': theme, 'gates': lines}, open(os.path.join(out, 'e2e.json'), 'w', encoding='utf-8'), indent=1)
    open(os.path.join(out, 'e2e.md'), 'w', encoding='utf-8', newline='\n').write('# Carousel end-to-end evaluation\n\n' + '\n'.join('- ' + l for l in lines) + '\n')
    return ok, lines
