"""cover: thumbnails for the video. Two looks (face = your photo + hook + isometric object; poster = dark cinematic), three sizes
(youtube 1280x720, reel/short 1080x1920, grid 1080x1350) and any number of hook variants (use 3 for A/B tests).
Rules from the research: hook of 4 words or fewer, one focal subject, high contrast, text kept out of the platform UI zones
(YouTube duration badge bottom-right; Reels/Shorts bottom 20% and right rail; the grid crop keeps the centre square)."""
import base64, html, os
SIZES = {'youtube': (1280, 720), 'reel': (1080, 1920), 'grid': (1080, 1350)}
ACC = [('#FF5A36', '#FFB703'), ('#2F80ED', '#56CCF2'), ('#27AE60', '#F2C94C')]   # accent pairs for the three variants

def _cube(a, b):
    return f'''<svg viewBox="0 0 400 400" width="100%" height="100%"><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>
<g transform="translate(200 300)"><polygon points="0,-60 130,-125 0,-190 -130,-125" fill="{b}" opacity=".95"/><polygon points="-130,-125 0,-60 0,40 -130,-25" fill="{a}"/><polygon points="130,-125 0,-60 0,40 130,-25" fill="#ffffff" opacity=".28"/></g>
<g transform="translate(200 215)"><polygon points="0,-60 105,-112 0,-164 -105,-112" fill="#fff" opacity=".95"/><polygon points="-105,-112 0,-60 0,20 -105,-32" fill="{b}"/><polygon points="105,-112 0,-60 0,20 105,-32" fill="{a}" opacity=".75"/></g></svg>'''

def render(kind, size, hook, idx, avatar_b64, name, kicker=''):
    W, H = SIZES[size]; a, b = ACC[idx % 3]; hk = html.escape(hook.upper()); e = html.escape
    words = hook.split(); lines = '<br>'.join(html.escape(' '.join(words[i:i + 2]).upper()) for i in range(0, len(words), 2))
    land = size == 'youtube'; dark = kind == 'poster'
    bg = (f'radial-gradient(1200px 800px at 70% 30%,{a}55,transparent 60%),linear-gradient(160deg,#07080d,#141826 60%,#05060a)') if dark else f'linear-gradient(135deg,{a},{b})'
    fs = (150 if land else 190 if size == 'reel' else 175) if len(words) <= 2 else (120 if land else 150 if size == 'reel' else 140)
    # text zones: youtube = left; reel = upper-middle (above the bottom 20% and away from the right rail); grid = centre square
    if land: tx_css = 'left:70px;top:90px;width:700px'; ob = 'left:60px;top:330px;width:420px;height:420px'; av = 'right:70px;bottom:-10px;width:520px;height:520px'
    elif size == 'reel': tx_css = 'left:70px;top:430px;width:830px'; ob = 'left:140px;top:1000px;width:620px;height:620px'; av = 'right:110px;top:1060px;width:420px;height:420px'
    else: tx_css = 'left:70px;top:150px;width:900px'; ob = 'left:60px;top:700px;width:520px;height:520px'; av = 'right:90px;top:760px;width:380px;height:380px'
    col = '#fff' if dark else '#fff'; shadow = '0 6px 0 rgba(0,0,0,.35),0 0 40px rgba(0,0,0,.35)'
    grain = '<div style="position:absolute;inset:0;background:radial-gradient(circle,#ffffff14 1px,transparent 1.4px) 0 0/6px 6px;mix-blend-mode:overlay"></div>'
    vign = '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,#000a 100%)"></div>' if dark else ''
    rim = f'box-shadow:0 0 0 10px #fff,0 0 0 18px {a},0 20px 60px #0008;' if not dark else f'box-shadow:0 0 0 6px {b},0 0 90px {a}99,0 20px 60px #000c;'
    kick = f'<div style="position:absolute;{tx_css};transform:translateY(-70px);font:800 {34 if not land else 30}px Inter,Arial,sans-serif;letter-spacing:.14em;color:{b};text-transform:uppercase">{e(kicker)}</div>' if kicker else ''
    return f'''<!doctype html><meta charset="utf-8"><style>*{{box-sizing:border-box}}body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;position:relative;background:{bg};font-family:Inter,"Helvetica Neue",Arial,sans-serif}}</style>
{grain}<div style="position:absolute;{ob};filter:drop-shadow(0 30px 40px #0007)">{_cube(a, b)}</div>
<div style="position:absolute;{av};border-radius:50%;background:url(data:image/png;base64,{avatar_b64}) center/cover;{rim}"></div>
{vign}{kick}<div style="position:absolute;{tx_css};font:900 {fs}px/0.95 Inter,Arial,sans-serif;letter-spacing:-.02em;color:{col};text-shadow:{shadow};-webkit-text-stroke:2px #0003">{lines}</div>
<div style="position:absolute;left:70px;bottom:{70 if size != 'reel' else 330}px;font:700 34px Inter,Arial,sans-serif;color:{'#fff' if dark else '#111'};background:{'#ffffff1f' if dark else '#fff'};padding:10px 26px;border-radius:999px;display:{'none' if land else 'block'}">{e(name)}</div>'''
def avatar_b64(path): return base64.b64encode(open(path, 'rb').read()).decode()
def files(out, slug, hooks, looks, sizes):
    return [(os.path.join(out, f'{slug}-cover-{l}-{s}-{i + 1}.png'), l, s, h, i) for l in looks for s in sizes for i, h in enumerate(hooks)]
