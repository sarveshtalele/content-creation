// Thumbnails and blog covers at any size (YouTube 1280x720, Open Graph 1200x630, dev.to 1000x420, Hashnode 1600x840): one still per layout.
// Rules from the research (docs/THUMBNAILS.md): one focal point, 3-6 big words with an outline, saturated mid-tone backgrounds that hold up in light
// and dark mode, a face filling about a third of the frame, the middle ~70% as the working area, and nothing in YouTube's bottom-right duration badge.
// Layouts: face, number, diagram, versus, editorial. Content comes from scripts/cover.py (words already in the story).
import { C, E, tx, icon, fitSize, measure, svgLayer, path, circ, svgNS } from './kit.js';

const f1 = v => (+v).toFixed(1);
function frame(W, H, D) {   // safe area: 6% margins; YouTube keeps text out of the bottom-right badge corner
  const m = Math.round(Math.min(W, H) * .07), yt = D.thumb.platform === 'youtube';
  return { m, x0: m, y0: m, x1: W - m, y1: H - m, badge: yt ? { x: W * .76, y: H * .78 } : null, u: H / 720 };
}
const OUT = c => `-webkit-text-stroke:${c};paint-order:stroke fill;`;
function big(root, id, text, { x, y, w, h, color, stroke, font = 'sans', weight = 900, align = 'left', max = 160, min = 40, lh = 1.02 }) {
  const z = fitSize(text, { w: w - 8, h, max, min, weight, font, lh }), hh = Math.min(h, Math.ceil(measure(text, { size: z, weight, font, w: w - 8, lh }).h) + 8);
  tx(root, id, text, { x, y, w, h: hh, size: z, weight, font, color, align, wrap: true, lh, ls: font === 'sans' ? -.02 : 0, css: stroke ? OUT(`${Math.max(3, Math.round(z * .07))}px ${stroke}`) + `text-shadow:0 ${Math.round(z * .06)}px 0 ${stroke}55;` : '' });
  return hh;
}
// the author's photo, cropped for its use: 'face' zooms onto the face so a small circle reads as a person; 'bust' keeps head and shoulders
const AV = D => D.brand.avatar || 'assets/avatar.png';
const photo = (D, mode) => mode === 'face' ? `background:url(${AV(D)}) ${D.brand.face_x ?? 59}% ${D.brand.face_y ?? 36}%/185% no-repeat` : `background:url(${AV(D)}) ${D.brand.face_x ?? 58}% 30%/cover no-repeat`;
function brand(root, D, F, dark) {   // personal branding on every layout: photo (face crop), name, tagline
  const s = Math.round(66 * F.u), b = E(root, 'abs', `left:${F.x0}px;top:${F.y1 - s}px;height:${s}px;display:flex;align-items:center;gap:${Math.round(14 * F.u)}px;max-width:${Math.round((F.badge ? .62 : .8) * (F.x1 - F.x0))}px`);
  E(b, '', `width:${s}px;height:${s}px;border-radius:50%;${photo(D, 'face')};border:${Math.max(2, Math.round(3 * F.u))}px solid ${dark ? '#fff' : C.clay};box-shadow:0 0 0 ${Math.max(2, Math.round(3 * F.u))}px ${dark ? 'rgba(255,255,255,.25)' : C.claySoft};flex:none`);
  const col = E(b, '', 'display:flex;flex-direction:column;min-width:0');
  const mk = (id, text, size, weight, color) => { const t = E(col, 'tx sans', `font-size:${size}px;font-weight:${weight};color:${color};white-space:nowrap;line-height:1.15`); const sp = E(t, '', 'display:block', '', 'span'); sp.textContent = text; t.dataset.id = id; t.dataset.text = text; };
  mk('th-brand', D.brand.name, Math.round(27 * F.u), 800, dark ? '#fff' : C.ink);
  if (D.brand.tagline && F.u >= .9) mk('th-tag', D.brand.tagline, Math.round(20 * F.u), 500, dark ? 'rgba(255,255,255,.82)' : C.mid);
}
function chip(root, id, text, x, y, F, bg, fg) {
  const t = E(root, 'tx sans', `position:absolute;left:${x}px;top:${y}px;display:inline-flex;align-items:center;white-space:nowrap;font-size:${Math.round(24 * F.u)}px;font-weight:800;letter-spacing:.08em;color:${fg};background:${bg};border-radius:999px;padding:${Math.round(8 * F.u)}px ${Math.round(20 * F.u)}px`);
  const sp = E(t, '', 'display:block', '', 'span'); sp.textContent = text.toUpperCase(); t.dataset.id = id; t.dataset.text = text.toUpperCase(); t.dataset.box = '1'; return t;
}
function blob(root, x, y, r, c, o = 1) { E(root, 'abs', `left:${f1(x - r)}px;top:${f1(y - r)}px;width:${f1(2 * r)}px;height:${f1(2 * r)}px;border-radius:50%;background:${c};opacity:${o}`); }

const L = {
  face(root, D, W, H) {   // saturated clay background, the author's photo on the right, 3-6 outlined words on the left
    const F = frame(W, H, D), t = D.thumb; root.style.background = `linear-gradient(135deg,${C.clay},#B9532F)`;
    blob(root, W * .86, H * .1, H * .45, '#ffffff', .10); blob(root, W * .06, H * 1.02, H * .4, '#000000', .08);
    const S = Math.round(H * .62), px = W - F.m - S - (F.badge ? W * .02 : 0), py = Math.round((H - S) / 2) - (F.badge ? H * .06 : 0);
    E(root, 'abs', `left:${px - 10}px;top:${py - 10}px;width:${S + 20}px;height:${S + 20}px;border-radius:50%;background:#FFF3E8`);
    E(root, 'abs', `left:${px}px;top:${py}px;width:${S}px;height:${S}px;border-radius:50%;${photo(D, 'bust')};box-shadow:0 ${Math.round(18 * F.u)}px ${Math.round(40 * F.u)}px rgba(0,0,0,.28)`);
    let y = F.y0; if (t.kicker) { chip(root, 'th-k', t.kicker, F.x0, y, F, '#141413', '#FFFFFF'); y += Math.round(64 * F.u); }
    big(root, 'th-hook', t.text, { x: F.x0, y, w: px - F.x0 - 24 * F.u, h: F.y1 - y - 80 * F.u, color: '#FFFFFF', stroke: '#141413', max: Math.round(150 * F.u), min: Math.round(44 * F.u) });
    brand(root, D, F, true);
  },
  number(root, D, W, H) {   // ink background, one real figure, huge, with what it counts
    const F = frame(W, H, D), t = D.thumb, n = t.number; root.style.background = `radial-gradient(${W * .7}px ${H}px at 75% 40%,#2A2622,#141413)`;
    const svg = svgLayer(root, W, H), R = H * .34, cx = W - F.m - R - (F.badge ? W * .03 : 0), cy = H * .46;
    circ(svg, cx, cy, R, { fill: 'none', stroke: '#3A3530', w: Math.round(30 * F.u) });
    const a = path(svg, `M${cx} ${cy - R}a${R} ${R} 0 1 1 -.01 0`, { stroke: C.clay, w: Math.round(30 * F.u) }), Lc = 2 * Math.PI * R; const fr = /%$/.test(n.value) ? Math.min(1, parseFloat(n.value) / 100) : .74; a.setAttribute('stroke-dasharray', `${Lc * fr} ${Lc}`);   // a percentage fills the ring to its value
    big(root, 'th-num', n.value, { x: cx - R * .8, y: cy - R * .5, w: R * 1.6, h: R, color: '#FFFFFF', font: 'serif', weight: 700, align: 'center', max: Math.round(220 * F.u), min: 60, lh: 1 });
    big(root, 'th-hook', t.text, { x: F.x0, y: F.y0, w: cx - R - F.x0 - 30 * F.u, h: F.y1 - F.y0 - 90 * F.u, color: '#FFFFFF', stroke: '#000000', max: Math.round(120 * F.u), min: Math.round(40 * F.u) });
    brand(root, D, F, true);
  },
  diagram(root, D, W, H) {   // paper background, the hook on the left, a mini flow of 3-4 steps on the right
    const F = frame(W, H, D), t = D.thumb, st = t.flow.steps.slice(0, 4), n = st.length; root.style.background = C.bg;
    blob(root, W * .92, H * .05, H * .5, C.claySoft); blob(root, W * .02, H * 1.05, H * .45, C.blueSoft);
    const dw = Math.min(W * .4, 560 * F.u), dx = W - F.m - dw - (F.badge ? W * .04 : 0), gap = 18 * F.u, ch = Math.min(96 * F.u, (H - 2 * F.m - (F.badge ? H * .14 : 0) - gap * (n - 1)) / n), svg = svgLayer(root, W, H), P = [[C.blue, C.blueSoft, C.blueD], [C.clay, C.claySoft, C.clayD], [C.green, C.greenSoft, C.greenD], [C.blue, C.blueSoft, C.blueD]];
    const top = (H - (n * ch + (n - 1) * gap)) / 2 - (F.badge ? H * .06 : 0);
    st.forEach((s, i) => { const y = top + i * (ch + gap), [bd, soft, ink] = P[i % 4], b = E(root, 'abs', `left:${dx}px;top:${f1(y)}px;width:${dw}px;height:${f1(ch)}px;border-radius:${Math.round(22 * F.u)}px;background:#fff;border:${Math.max(2, Math.round(3 * F.u))}px solid ${bd};box-sizing:border-box;box-shadow:0 ${Math.round(10 * F.u)}px ${Math.round(24 * F.u)}px rgba(20,20,19,.10)`); b.dataset.box = '1';
      const nb = Math.round(ch * .56); E(b, 'abs', `left:${Math.round(14 * F.u)}px;top:${f1((ch - 6 - nb) / 2)}px;width:${nb}px;height:${nb}px;border-radius:50%;background:${soft};color:${ink};display:flex;align-items:center;justify-content:center;font:800 ${Math.round(nb * .5)}px Inter,sans-serif`, String(i + 1));
      tx(b, 'th-s' + i, s.title, { x: nb + 28 * F.u, y: 0, w: dw - nb - 44 * F.u, h: ch - 6, size: fitSize(s.title, { w: dw - nb - 48 * F.u, h: ch - 16, max: Math.round(38 * F.u), min: 14, weight: 800, lh: 1.05 }), weight: 800, wrap: true, lh: 1.05 });
      if (i < n - 1) path(svg, `M${dx + dw / 2} ${f1(y + ch + 2)}V${f1(y + ch + gap - 4)}`, { stroke: C.lineD, w: Math.max(2, 4 * F.u) }); });
    let y = F.y0; if (t.kicker) { chip(root, 'th-k', t.kicker, F.x0, y, F, C.clay, '#FFFFFF'); y += Math.round(64 * F.u); }
    big(root, 'th-hook', t.text, { x: F.x0, y, w: dx - F.x0 - 36 * F.u, h: F.y1 - y - 90 * F.u, color: C.ink, font: 'serif', weight: 700, max: Math.round(112 * F.u), min: Math.round(36 * F.u), lh: 1.05 });
    brand(root, D, F, false);
  },
  versus(root, D, W, H) {   // two halves that contrast, a VS seal, the hook across the top
    const F = frame(W, H, D), t = D.thumb, [A, B] = t.split; root.style.background = C.bg;
    const top = F.y0 + Math.round(120 * F.u), half = (W - 2 * F.m - 24 * F.u) / 2, ph = H - top - F.m - Math.round(86 * F.u);   // room for the author block
    big(root, 'th-hook', t.text, { x: F.x0, y: F.y0, w: W - 2 * F.m, h: 104 * F.u, color: C.ink, font: 'serif', weight: 700, max: Math.round(84 * F.u), min: 28, align: 'center', lh: 1.02 });
    [[A, C.blue, C.blueSoft, C.blueD], [B, C.clay, C.claySoft, C.clayD]].forEach(([sd, bd, soft, ink], k) => {
      const x = F.x0 + k * (half + 24 * F.u), b = E(root, 'abs', `left:${x}px;top:${top}px;width:${f1(half)}px;height:${f1(ph - (F.badge ? H * .16 : 0))}px;border-radius:${Math.round(28 * F.u)}px;background:${soft};border:${Math.max(2, Math.round(4 * F.u))}px solid ${bd};box-sizing:border-box`); b.dataset.box = '1';
      tx(b, 'th-v' + k, sd.head, { x: 20 * F.u + (k ? 34 * F.u : 0), y: 14 * F.u, w: half - 82 * F.u, h: 70 * F.u, size: fitSize(sd.head, { w: half - 88 * F.u, h: 64 * F.u, max: Math.round(50 * F.u), min: 16, weight: 800, lh: 1.05 }), weight: 800, color: ink, wrap: true, lh: 1.05 });
      const items = sd.items.slice(0, 3), bh = ph - (F.badge ? H * .16 : 0), pitch = Math.min(70 * F.u, (bh - 110 * F.u) / Math.max(1, items.length)), iz = Math.min(...items.map(x => fitSize(x, { w: half - 124 * F.u, h: pitch - 8, max: Math.round(36 * F.u), min: 13, weight: 600 })));
      items.forEach((it, j) => tx(b, `th-v${k}-${j}`, '• ' + it, { x: 24 * F.u + (k ? 34 * F.u : 0), y: 96 * F.u + j * pitch, w: half - 90 * F.u,   /* both columns stay clear of the VS seal */ h: pitch - 4, size: iz, weight: 600, color: C.ink }));
    });
    E(root, 'abs', `left:${f1(W / 2 - 40 * F.u)}px;top:${f1(top + (ph - (F.badge ? H * .16 : 0)) / 2 - 40 * F.u)}px;width:${Math.round(80 * F.u)}px;height:${Math.round(80 * F.u)}px;border-radius:50%;background:${C.ink};color:#fff;font:900 ${Math.round(30 * F.u)}px Inter,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 ${Math.round(8 * F.u)}px ${C.bg}`, 'VS');
    brand(root, D, F, false);
  },
  editorial(root, D, W, H) {   // a calm blog header: paper, a serif headline, one line, tags, the author
    const F = frame(W, H, D), t = D.thumb; root.style.background = C.bg;
    blob(root, W * .9, H * .2, H * .55, C.claySoft); blob(root, W * .78, H * .95, H * .35, C.blueSoft); const svg = svgLayer(root, W, H);   // shapes first, curves on top
    for (let k = 0; k < 4; k++) path(svg, `M${W * .62} ${f1(H * (.22 + k * .16))}C${W * .75} ${f1(H * (.12 + k * .16))} ${W * .85} ${f1(H * (.34 + k * .16))} ${W - F.m} ${f1(H * (.2 + k * .16))}`, { stroke: [C.clay, C.blue, C.green, C.clay][k], w: Math.max(3, 6 * F.u) });
    let y = F.y0; if (t.kicker) { chip(root, 'th-k', t.kicker, F.x0, y, F, C.claySoft, C.clayD); y += Math.round(66 * F.u); }
    const tw = W * .6 - F.x0, hh = big(root, 'th-hook', t.text, { x: F.x0, y, w: tw, h: (F.y1 - y) * .62, color: C.ink, font: 'serif', weight: 700, max: Math.round(96 * F.u), min: 28, lh: 1.05 });
    let yy = y + hh + 14 * F.u;
    if (t.sub) { const sh = Math.min(96 * F.u, F.y1 - 130 * F.u - yy), z = fitSize(t.sub, { w: tw, h: sh, max: Math.round(32 * F.u), min: 14, weight: 500, lh: 1.25 }); if (sh > 24) { tx(root, 'th-sub', t.sub, { x: F.x0, y: yy, w: tw, h: sh, size: z, weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += Math.ceil(measure(t.sub, { size: z, weight: 500, w: tw, lh: 1.25 }).h) + 16 * F.u; } }
    let cx = F.x0; (t.chips || []).slice(0, 4).forEach((c, k) => { if (yy + 50 * F.u > F.y1 - 64 * F.u) return; const el = chip(root, 'th-c' + k, c, cx, yy, F, [C.blueSoft, C.claySoft, C.greenSoft, C.sand][k], [C.blueD, C.clayD, C.greenD, C.mid][k]); cx += el.getBoundingClientRect().width + 12 * F.u; });
    brand(root, D, F, false);
  },
};

export function buildThumb(stage, D) {
  const W = innerWidth, H = innerHeight, ls = D.thumb.layouts;
  stage.style.backgroundImage = 'none';
  const roots = ls.map(l => { const r = E(stage, 'scene'); r.style.opacity = '1'; r.style.display = 'block'; L[l](r, D, W, H); r.style.display = 'none'; return r; });
  return { DUR: ls.length, N: ls.length, render(t) { const k = Math.max(0, Math.min(ls.length - 1, Math.floor(t + 1e-6))); roots.forEach((r, i) => { r.style.display = i === k ? 'block' : 'none'; }); } };
}
