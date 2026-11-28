// Thumbnails and blog covers at any size (YouTube 1280x720, Open Graph 1200x630, dev.to 1000x420, Hashnode 1600x840): one still per layout.
// Rules from the research (docs/THUMBNAILS.md): one focal point, 3-6 big words with an outline, saturated mid-tone backgrounds that hold up in light
// and dark mode, a face filling about a third of the frame, the middle ~70% as the working area, and nothing in YouTube's bottom-right duration badge.
// Layouts: face, number, diagram, versus, editorial. Content comes from scripts/cover.py (words already in the story).
import { C, E, tx, icon, fitSize, measure, svgLayer, path, circ, svgNS, box } from './kit.js';
import { cta } from './cta.js';

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

// LinkedIn newsletter banner (1920x1080; also YouTube and Open Graph): logo row, a two-part title with a highlighted pill, a subtitle bar,
// four checklist rows, a laptop screen with three checked steps, up to two round badges, the author's cut-out photo on orange discs, the brand CTA.
const OR = '#F2741F', NAVY = '#14213D';
function banner(root, D, W, H) {
  const b = D.thumb.banner, m = Math.round(Math.min(W, H) * .075), s = Math.min((W - 2 * m) / 1920, (H - 2 * m) / 1080), ox = (W - 1920 * s) / 2, oy = (H - 1080 * s) / 2, X = v => ox + v * s, Y = v => oy + v * s, Z = v => v * s;   // text stays in the safe area; the background fills the frame
  root.style.background = 'radial-gradient(' + f1(W * .62) + 'px ' + f1(H * .65) + 'px at 30% 40%,#FFF8F1,#FBEADB)';
  E(root, 'abs', `left:${f1(X(1660))}px;top:${f1(Y(-140))}px;width:${f1(Z(420))}px;height:${f1(Z(300))}px;border-radius:50%;background:#F9D7B8`);
  E(root, 'abs', `left:${f1(X(-120))}px;top:${f1(Y(1010))}px;width:${f1(Z(300))}px;height:${f1(Z(200))}px;border-radius:50%;background:#F9D7B8`);
  // logo row: official logos (only those the source names; checked by studio.py check), then the series name
  let lx = X(90); (b.logos || []).slice(0, 2).forEach(l => { E(root, 'abs', `left:${f1(lx)}px;top:${f1(Y(50))}px;width:${f1(Z(76))}px;height:${f1(Z(76))}px;filter:drop-shadow(0 ${f1(Z(4))}px ${f1(Z(10))}px rgba(160,90,40,.18))`, icon(l, Math.round(Z(76)))); lx += Z(92); });
  if (b.series) { if (b.logos && b.logos.length) { E(root, 'abs', `left:${f1(lx + Z(6))}px;top:${f1(Y(58))}px;width:${f1(Z(2))}px;height:${f1(Z(60))}px;background:${NAVY}55`); lx += Z(32); }
    tx(root, 'bn-series', b.series, { x: lx, y: Y(56), w: X(1060) - lx, h: Z(64), size: fitSize(b.series, { w: X(1056) - lx, h: Z(60), max: Math.round(Z(40)), min: 14, weight: 500 }), weight: 500, color: NAVY }); }
  tx(root, 'bn-lead', b.lead, { x: X(96), y: Y(188), w: Z(1000), h: Z(104), size: fitSize(b.lead, { w: Z(990), h: Z(100), max: Math.round(Z(84)), min: 16, weight: 800 }), weight: 800, color: NAVY, ls: -.02 });
  E(root, 'abs', `left:${f1(X(66))}px;top:${f1(Y(300))}px;width:${f1(Z(1010))}px;height:${f1(Z(206))}px;border-radius:${f1(Z(40))}px;background:linear-gradient(100deg,#F08A3E,#C2410C);box-shadow:0 ${f1(Z(18))}px ${f1(Z(40))}px #C2410C44`);
  const hz = fitSize(b.highlight, { w: Z(900), h: Z(150), max: Math.round(Z(112)), min: 16, weight: 800, lh: 1 });
  tx(root, 'bn-hi', b.highlight, { x: X(110), y: Y(312), w: Z(920), h: Z(150), size: hz, weight: 800, color: '#fff', ls: -.03, lh: 1 });
  const sv = svgLayer(root, W, H); path(sv, `M${f1(X(570))} ${f1(Y(466))}C${f1(X(700))} ${f1(Y(446))} ${f1(X(890))} ${f1(Y(446))} ${f1(X(1020))} ${f1(Y(458))}`, { stroke: '#FFD54A', w: Z(13) });
  [[10, 30, 52, 4], [14, 70, 66, 70], [10, 110, 52, 136]].forEach(([a, b_, c, d]) => path(sv, `M${f1(X(1090 + a))} ${f1(Y(300 + b_))}L${f1(X(1090 + c))} ${f1(Y(300 + d))}`, { stroke: OR, w: Z(8) }));
  if (b.sub) { const sz = fitSize(b.sub, { w: Z(880), h: Z(70), max: Math.round(Z(50)), min: 14, weight: 800 }), sw = Math.min(Z(960), measure(b.sub, { size: sz, weight: 800, w: Z(2000) }).w + Z(90));
    const sb = box(root, { x: X(90), y: Y(540), w: sw, h: Z(92), r: Z(16), fill: '#FFFFFFAA', bd: 'transparent', bw: 0, shadow: false, bg: true });
    E(sb, 'abs', `left:0;top:${f1(Z(14))}px;width:${f1(Z(9))}px;height:${f1(Z(64))}px;border-radius:${f1(Z(5))}px;background:${OR}`);
    tx(root, 'bn-sub', b.sub, { x: X(130), y: Y(540), w: sw - Z(50), h: Z(92), size: sz, weight: 800, color: NAVY, ls: -.015 }); }
  (b.items || []).slice(0, 4).forEach((it, k) => { const y = Y(668 + k * 98), r = box(root, { x: X(80), y, w: Z(600), h: Z(84), r: Z(18), fill: '#fff', bd: 'transparent', bw: 0, shadow: false, css: `box-shadow:0 ${f1(Z(8))}px ${f1(Z(24))}px #E0B89633;` });
    E(r, 'abs', `left:${f1(Z(18))}px;top:${f1(Z(11))}px;width:${f1(Z(62))}px;height:${f1(Z(62))}px;border-radius:${f1(Z(14))}px;background:linear-gradient(#F59A54,#E0651F);display:flex;align-items:center;justify-content:center`, icon(it.icon, Math.round(Z(it.icon.startsWith('logo:') ? 56 : 38)), '#fff', 2));
    tx(root, 'bn-i' + k, it.text, { x: X(186), y, w: Z(480), h: Z(84), size: fitSize(it.text, { w: Z(476), h: Z(76), max: Math.round(Z(31)), min: 14, weight: 700 }), weight: 700, color: NAVY }); });
  (b.badges || []).slice(0, 2).forEach((g, k) => { const bx = X(1110 + k * 260), by = Y(70), R = Z(115), id = 'bnarc' + k, sv2 = svgLayer(root, W, H);
    const pts = Array.from({ length: 12 }, (_, q) => { const a = Math.PI * 2 * q / 12 - Math.PI / 2; return `${f1(bx + R + Z(112) * Math.cos(a))},${f1(by + R + Z(112) * Math.sin(a))}`; }).join(' ');
    sv2.insertAdjacentHTML('beforeend', `<defs><path id="${id}" d="M${f1(bx + Z(40))} ${f1(by + Z(118))}a${f1(Z(75))} ${f1(Z(75))} 0 0 1 ${f1(Z(150))} 0"/></defs><polygon points="${pts}" fill="#E07A45"/><circle cx="${f1(bx + R)}" cy="${f1(by + R)}" r="${f1(Z(96))}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${f1(Z(2))}"/>`
      + `<text font-family="JetBrains Mono,monospace" font-weight="700" font-size="${f1(Z(19))}" letter-spacing="${f1(Z(3))}" fill="#3B2A20"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${g.top.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textPath></text>`);
    E(root, 'abs', `left:${f1(bx + R - Z(20))}px;top:${f1(by + Z(92))}px;width:${f1(Z(40))}px;height:${f1(Z(40))}px`, icon(g.icon || 'star', Math.round(Z(40)), '#fff', 2.2));
    [g.line1, g.line2].filter(Boolean).forEach((t, q) => tx(root, `bn-b${k}-${q}`, t, { x: bx + Z(24), y: by + Z(136 + q * 30), w: Z(182), h: Z(30), size: fitSize(t, { w: Z(178), h: Z(30), max: Math.round(Z(25)), min: 11, weight: 600, font: 'serif' }), weight: 600, font: 'serif', color: '#fff', align: 'center' })); });
  // laptop: a screen with the title and three checked steps
  const sc = b.screen || {}; E(root, 'abs', `left:${f1(X(720))}px;top:${f1(Y(700))}px;width:${f1(Z(560))}px;height:${f1(Z(330))}px;background:#1C1C1E;border-radius:${f1(Z(22))}px ${f1(Z(22))}px 0 0`);
  E(root, 'abs', `left:${f1(X(736))}px;top:${f1(Y(716))}px;width:${f1(Z(528))}px;height:${f1(Z(298))}px;background:#FFFDF9;border-radius:${f1(Z(8))}px`);
  E(root, 'abs', `left:${f1(X(670))}px;top:${f1(Y(1030))}px;width:${f1(Z(660))}px;height:${f1(Z(26))}px;background:linear-gradient(#D9D9DC,#A9A9AE);border-radius:0 0 ${f1(Z(30))}px ${f1(Z(30))}px`);
  let sy = Y(736); if (sc.logo) { E(root, 'abs', `left:${f1(X(764))}px;top:${f1(sy)}px;width:${f1(Z(36))}px;height:${f1(Z(36))}px`, icon(sc.logo, Math.round(Z(36)))); }
  if (sc.label) tx(root, 'bn-sl', sc.label, { x: X(sc.logo ? 810 : 764), y: sy, w: Z(320), h: Z(36), size: fitSize(sc.label, { w: Z(316), h: Z(34), max: Math.round(Z(24)), min: 12, weight: 700 }), weight: 700, color: C.ink });
  sy += Z(46); if (sc.title) tx(root, 'bn-st', sc.title, { x: X(764), y: sy, w: Z(320), h: Z(44), size: fitSize(sc.title, { w: Z(316), h: Z(42), max: Math.round(Z(32)), min: 12, weight: 800 }), weight: 800, color: NAVY });
  (sc.steps || []).slice(0, 3).forEach((t, k) => { const y = Y(840 + k * 52);
    E(root, 'abs', `left:${f1(X(764))}px;top:${f1(y)}px;width:${f1(Z(30))}px;height:${f1(Z(30))}px;border-radius:50%;background:#E0651F;display:flex;align-items:center;justify-content:center`, icon('check', Math.round(Z(20)), '#fff', 2.6));
    tx(root, 'bn-ss' + k, t, { x: X(806), y: y - Z(2), w: Z(240), h: Z(34), size: fitSize(t, { w: Z(220), h: Z(30), max: Math.round(Z(19)), min: 11, weight: 700, font: 'mono' }), weight: 700, font: 'mono', color: C.ink, css: `background:#FBEADB;border-radius:${f1(Z(8))}px;padding:0 ${f1(Z(12))}px;box-sizing:border-box;width:auto;max-width:${f1(Z(240))}px` }); });
  E(root, 'abs', `left:${f1(X(1100))}px;top:${f1(Y(820))}px;width:${f1(Z(130))}px;height:${f1(Z(116))}px;border:${f1(Z(5))}px solid ${OR};border-radius:${f1(Z(12))}px;background:#FFF4EA;box-sizing:border-box;padding:${f1(Z(16))}px`,
    [1, .7, .5].map(w => `<div style="height:${f1(Z(7))}px;width:${w * 100}%;background:#F6B98C;border-radius:4px;margin-bottom:${f1(Z(12))}px"></div>`).join(''));
  E(root, 'abs', `left:${f1(X(1196))}px;top:${f1(Y(902))}px;width:${f1(Z(58))}px;height:${f1(Z(58))}px;border-radius:50%;background:#E0651F;display:flex;align-items:center;justify-content:center`, icon('star', Math.round(Z(32)), '#fff', 2.4));
  // the author's photo: the cut-out (studio.py brand --photo) on orange discs; without one, the avatar in a round frame
  E(root, 'abs', `left:${f1(X(1330))}px;top:${f1(Y(360))}px;width:${f1(Z(720))}px;height:${f1(Z(720))}px;border-radius:50%;background:#F7B98A`);
  E(root, 'abs', `left:${f1(X(1410))}px;top:${f1(Y(450))}px;width:${f1(Z(580))}px;height:${f1(Z(580))}px;border-radius:50%;background:linear-gradient(#F59A54,#E8742F)`);
  if (D.brand.cutout) E(root, 'abs', `left:${f1(X(1270))}px;top:${f1(Y(340))}px;width:${f1(Z(660))}px;height:${f1(H - Y(340))}px;background:url(${D.brand.cutout}) 50% 100%/contain no-repeat`);
  else E(root, 'abs', `left:${f1(X(1450))}px;top:${f1(Y(490))}px;width:${f1(Z(500))}px;height:${f1(Z(500))}px;border-radius:50%;${photo(D, 'bust')};border:${f1(Z(8))}px solid #fff;box-sizing:border-box`);
  cta(root, 'bn-cta', D.brand, { x: X(1150), y: Y(996), w: Z(740), h: Z(70), size: Math.round(Z(24)), bw: Math.max(2, Math.round(Z(4))) });
}

const L = {
  banner,
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
