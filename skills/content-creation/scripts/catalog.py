"""catalog: one HTML page with every design the plugin can make, so the person can see what exists and answer "which design?" by ID.

usage: studio.py catalog        regenerates studio/catalog.html and prints its path (open it in a browser, or in the Design Studio at /catalog)
Sections: GIF templates, carousel covers, carousel slides (funnel, infographics, 21 charts by family), Reel covers, Reel looks and motion,
walkthrough video. Every card shows the real sample (rendered by the engine), the ID to quote, and when it fits. Built from designs.py,
matrix.json and hooks.json, so it never drifts from what the code can build."""
import html, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(HERE); OUT = os.path.join(SK, 'studio', 'catalog.html')
e = html.escape

def card(img, ident, name, tag, best='', tall=False, wide=False):
    return (f'<figure class="c{" tall" if tall else ""}{" wide" if wide else ""}"><img src="samples/{e(img)}" alt="Sample of {e(name)}" loading="lazy">'
            f'<figcaption><code>{e(ident)}</code><b>{e(name)}</b><span>{e(tag)}</span>{f"<em>Best for: {e(best)}</em>" if best else ""}</figcaption></figure>')

def build():
    import designs as DS
    M = json.load(open(os.path.join(SK, 'data', 'matrix.json'), encoding='utf-8')); Hk = json.load(open(os.path.join(SK, 'data', 'hooks.json'), encoding='utf-8'))
    sec = []
    sec.append(('gif', 'GIF templates', 'One animated diagram, 1080x1350, under 5 MB, plus the still PNG. Quote the ID as gif.template.',
                ''.join(card(f'gif-{g["id"]}.jpg', g['id'], g['name'], g['tag'], g['best']) for g in DS.GIF_STYLES)))
    sec.append(('covers', 'Carousel covers', 'The first slide. Quote the ID (or its layout name).',
                ''.join(card(d['id'] + '.jpg', d['id'], d['name'], d['tag'], d['best_for']) for d in DS.DESIGNS if d['group'] == 'cover')))
    sec.append(('slides', 'Carousel slides: funnel and infographics', 'Pick up to five; each slide should use a different family.',
                ''.join(card(d['id'] + '.jpg', d['id'], d['name'], d['tag'], d['best_for']) for d in DS.DESIGNS if d['group'] == 'infographic')))
    sec.append(('architecture', 'Architecture diagrams', 'One diagram for a whole post. As a carousel slide (type arch) or an animated GIF (gif.template arch) where only the flow moves. Quote the style.',
                ''.join(card(d['id'] + '.jpg', d['id'] + '  (style: ' + d['id'][5:] + ')', d['name'], d['tag'], d['best_for']) for d in DS.DESIGNS if d['group'] == 'architecture')))
    fams = {}
    for d in DS.DESIGNS:
        if d['group'] == 'chart': fams.setdefault(d['family'], []).append(d)
    for f, ds in fams.items():
        sec.append(('chart-' + f.lower(), f'Chart slides: {f}', 'Data charts (marked by their samples with figures) only take numbers that are in your source.',
                    ''.join(card(d['id'] + '.jpg', d['id'], d['name'], d['tag'], d['best_for']) for d in ds)))
    rc = {'hero': 'Hook + mini diagram of 3-4 steps', 'question': 'Giant hook, underline sweep, tags', 'number': 'One real figure in a ring (needs a figure in the hook or a big line)', 'split': 'Two lists joined by an arrow', 'face': 'Your photo with the hook'}
    sec.append(('reelcover', 'Reel covers', '1080x1920 designed covers, safe for the profile-grid crop. Quote the layout name.',
                ''.join(card(f'reelcover-{k}.jpg', k, k.title(), v, tall=True) for k, v in rc.items())))
    tl = {'face': 'Your photo with 3-6 outlined words on a saturated background', 'number': 'One real figure in a ring, words beside it', 'diagram': 'The hook with a mini flow of 3-4 steps', 'versus': 'Two lists side by side with a VS seal', 'editorial': 'A calm blog header: serif headline, one line, tags', 'banner': 'LinkedIn newsletter banner: logo row, highlighted two-part title, 4-item checklist, laptop with 3 steps, up to 2 badges, your cut-out photo, CTA (needs a banner section)'}
    sec.append(('thumbs', 'Thumbnails and blog covers', 'Sizes: youtube 1280x720, og 1200x630 (link previews and blog headers), newsletter 1920x1080 (LinkedIn newsletter and article cover), devto 1000x420, hashnode 1600x840. Every layout carries your photo, name and tagline. Quote the layout; studio.py thumbs renders every size.',
                ''.join(card(f'thumb-{k}.jpg', k, k.title(), v, wide=True) for k, v in tl.items())))
    motion = sorted({s['reel_motion'] for s in M['shapes']})
    sec.append(('reel', 'Reel looks and motion', 'Every Reel has a kinetic hook, masked scene reveals, a camera push, parallax, animated counters (10 and up) and particles on connectors. Choose the look:',
                '<ul class="l"><li><code>light</code><b>Claude light</b> (default): warm paper, clay accents</li><li><code>cinematic</code><b>Cinematic dark</b>: dark grade, light sweeps, impact flash</li></ul>'
                '<p>Motion the decision matrix can pick for your content:</p><ul class="l">' + ''.join(f'<li>{e(m)}</li>' for m in motion) + '</ul>'
                '<p>Opening visuals (Reel visual hooks):</p><ul class="l">' + ''.join(f'<li><b>{e(v["name"])}</b>: {e(v["how"])}</li>' for v in Hk['visual']) + '</ul>'))
    sec.append(('walk', 'Walkthrough video', 'A real guide of a website run by Playwright: each step performed and verified, then rendered as a Claude-light Reel with a cursor, highlight, zoom, Expected vs Actual and a Verified badge.',
                '<ul class="l"><li><code>mobile</code> phone frame (390x844)</li><li><code>desktop</code> browser frame (1280x800)</li></ul>'))
    nav = ''.join(f'<a href="#{i}">{e(t)}</a>' for i, t, _, _ in sec)
    body = ''.join(f'<section id="{i}"><h2>{e(t)}</h2><p>{e(sub)}</p><div class="g">{cards}</div></section>' for i, t, sub, cards in sec)
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design catalogue · content-creation</title>
<style>:root{{--bg:#FAF9F5;--ink:#141413;--mid:#5E5D59;--line:#E3E0D3;--clay:#D97757;--clayD:#A8481F;--clayS:#F8E6DD}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 Inter,system-ui,sans-serif}}
header{{padding:36px clamp(16px,4vw,56px) 18px;max-width:1400px;margin:auto}}h1{{font:700 clamp(30px,4vw,46px)/1.1 Georgia,serif;margin:0 0 8px}}header p{{color:var(--mid);max-width:76ch;margin:0}}
.how{{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 20px;margin:18px 0 0}}.how code{{background:var(--clayS);color:var(--clayD)}}
nav{{position:sticky;top:0;background:rgba(250,249,245,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:10px clamp(16px,4vw,56px);display:flex;gap:8px;flex-wrap:wrap;z-index:2}}
nav a{{border:1px solid var(--line);border-radius:999px;padding:5px 12px;color:var(--ink);text-decoration:none;font-weight:600;font-size:13.5px;background:#fff}}nav a:hover{{border-color:var(--clay)}}
main{{max-width:1400px;margin:auto;padding:0 clamp(16px,4vw,56px) 60px}}section{{padding-top:28px}}h2{{font:700 24px/1.2 Georgia,serif;margin:0 0 4px}}section>p{{color:var(--mid);margin:0 0 14px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:22px 18px}}figure.c{{margin:0}}figure.c img{{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:top;border-radius:16px;border:1px solid var(--line);background:#fff;box-shadow:0 18px 30px -22px rgba(20,20,19,.4)}}
figure.tall img{{aspect-ratio:9/16}}figure.wide{{grid-column:span 2}}figure.wide img{{aspect-ratio:16/9}}figcaption{{padding-top:8px;display:grid;gap:2px}}figcaption b{{font-size:15.5px}}figcaption span{{color:var(--mid);font-size:13.5px}}figcaption em{{font-style:normal;color:var(--clayD);font-size:13px}}
code{{font:600 12.5px ui-monospace,Menlo,monospace;background:#F0EEE6;border-radius:6px;padding:2px 7px;justify-self:start}}ul.l{{margin:0 0 12px;padding-left:20px}}ul.l li{{margin:4px 0}}ul.l code{{margin-right:6px}}</style></head>
<body><header><h1>Design catalogue</h1><p>Everything content-creation can make, rendered by the real engine. Your agent shows you the options ranked for your content and <b>always asks which designs to use before it builds</b>.</p>
<div class="how"><b>How to choose:</b> tell your agent the IDs, for example <code>gif: funnel</code>, <code>cover: cover-bold</code>, <code>slides: chart-sankey, info-cone, chart-donut</code>, <code>reel cover: hero</code>, <code>reel look: light</code>. Every output carries your brand CTA at the bottom.</div></header>
<nav aria-label="Sections">{nav}</nav><main>{body}</main></body></html>'''
    open(OUT, 'w', encoding='utf-8', newline='\n').write(page); return OUT

if __name__ == '__main__':
    import sys; sys.path.insert(0, HERE); print(build())
