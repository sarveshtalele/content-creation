// Carousel: 5-7 portrait slides (1080x1350) for a LinkedIn document post. Every slide shares a frame (brand bar, progress segments, an editable CTA strip);
// the body is one of a few infographic slide types. Slides are static (a still per slide), so every build is identical.
import { C, E, box, tx, icon, svgLayer, path, circ, fitSize, measure, svgNS } from './kit.js';
import { PAL } from './gif_common.js';
import { cta } from './cta.js';

const W = 1080, H = 1350, X0 = 48, XW = W - 2 * X0, BODY0 = 128, BODY1 = 1170, GROUPS = ['blue', 'clay', 'green'];
const grp = i => PAL[GROUPS[i % 3]];
const arrow = (c, s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;

function frame(root, i, n, brand, ctaText, last) {
  E(root, 'abs', `left:${X0}px;top:36px;width:56px;height:56px;border-radius:50%;background:url(${brand.avatar || 'assets/avatar.png'}) center/cover;border:3px solid #fff;box-shadow:0 0 0 2px ${C.line}`);
  tx(root, 'fr-name', brand.name, { x: X0 + 70, y: 36, w: 560, h: 56, size: 26, weight: 700 });
  tx(root, 'fr-count', `${i + 1} / ${n}`, { x: W - X0 - 160, y: 36, w: 160, h: 56, size: 26, weight: 600, color: C.mid, align: 'right' });
  const gap = 8, sw = (XW - gap * (n - 1)) / n;
  for (let k = 0; k < n; k++) E(root, 'abs', `left:${X0 + k * (sw + gap)}px;top:104px;width:${sw}px;height:7px;border-radius:4px;background:${k <= i ? C.clay : C.line}`);
  const b = box(root, { x: X0, y: 1196, w: XW, h: 88, r: 44, fill: C.claySoft, bd: C.clay, bw: 3, shadow: false });
  tx(b, 'fr-cta', ctaText, { x: 36, y: 0, w: XW - 36 - 96, h: 82, size: 30, weight: 700, color: C.clayD });
  if (!last) E(b, 'abs', `left:${XW - 76}px;top:15px;width:52px;height:52px;border-radius:50%;background:${C.clay};display:flex;align-items:center;justify-content:center`, arrow('#fff', 30));
  else E(b, 'abs', `left:${XW - 76}px;top:15px;width:52px;height:52px;border-radius:50%;background:${C.clay};display:flex;align-items:center;justify-content:center`, icon('check', 32, '#fff', 2.4));
}
const heading = (root, id, text, y = BODY0 + 8, max = 60) => {
  const sz = fitSize(text, { w: XW, h: 150, max, min: 38, weight: 700, font: 'serif', lh: 1.1 }), h = Math.ceil(measure(text, { size: sz, weight: 700, font: 'serif', w: XW, lh: 1.1 }).h) + 6;
  tx(root, id, text, { x: X0, y, w: XW, h, size: sz, weight: 700, font: 'serif', wrap: true, lh: 1.1 }); return y + h;
};
const numBadge = (parent, n, P, x, y, s = 58) => E(parent, 'abs', `left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;background:${P.bd};color:#fff;display:flex;align-items:center;justify-content:center;font:700 ${Math.round(s * .5)}px Inter,sans-serif`, String(n));

const H_ = (t, size, w, weight = 500, lh = 1.25) => Math.ceil(measure(t, { size, weight, w, lh }).h);
const TYPES = {
  title(root, s) {
    const P = PAL.clay, hz = fitSize(s.hook, { w: XW - 20, h: 470, max: 96, min: 52, weight: 700, font: 'serif', lh: 1.08 }), hh = Math.ceil(measure(s.hook, { size: hz, weight: 700, font: 'serif', w: XW - 20, lh: 1.08 }).h) + 8;
    const sz = s.sub ? fitSize(s.sub, { w: XW - 40, h: 130, max: 38, min: 24, weight: 500, lh: 1.25 }) : 0, sh = s.sub ? H_(s.sub, sz, XW - 40) + 8 : 0;
    const total = 132 + 40 + (s.kicker ? 60 : 0) + hh + (s.sub ? 28 + sh : 0), y0 = BODY0 + Math.max(10, Math.floor((BODY1 - BODY0 - total) / 2));
    E(root, 'abs', `left:${W - 360}px;top:${y0 - 40}px;width:560px;height:560px;border-radius:50%;background:${C.claySoft}`);
    E(root, 'abs', `left:${W - 270}px;top:${y0 + 50}px;width:380px;height:380px;border-radius:50%;background:${C.blueSoft}`);
    E(root, 'abs', `left:${X0}px;top:${y0}px;width:132px;height:132px;border-radius:36px;background:${P.bd};display:flex;align-items:center;justify-content:center;transform:rotate(-6deg);box-shadow:0 8px 0 ${C.line}`, icon(s.icon || 'bolt', 72, '#fff', 2));
    let y = y0 + 172;
    if (s.kicker) { const k = E(root, 'tx sans', `left:${X0}px;top:${y}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:700;letter-spacing:.06em;color:${P.ink};background:${P.soft};border:2.5px solid ${P.bd};border-radius:30px;padding:8px 22px`); const sp = E(k, '', 'display:block', '', 'span'); sp.textContent = s.kicker; k.dataset.id = 'ti-kick'; k.dataset.text = s.kicker; k.dataset.box = '1'; y += 60; }
    tx(root, 'ti-hook', s.hook, { x: X0, y, w: XW - 20, h: hh, size: hz, weight: 700, font: 'serif', wrap: true, lh: 1.08 }); y += hh + 28;
    if (s.sub) tx(root, 'ti-sub', s.sub, { x: X0, y, w: XW - 40, h: sh, size: sz, weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
  },
  points(root, s) {
    let y = heading(root, 'pt-h', s.title) + 26; const n = s.items.length, avail = BODY1 - y, sw = XW - 130;
    const ss = Math.min(...s.items.map(it => fitSize(it.sub || '', { w: sw, h: 120, max: 32, min: 22, weight: 500, lh: 1.25 })));
    const hs = s.items.map(it => Math.min(250, 22 + 58 + (it.sub ? H_(it.sub, ss, sw) + 8 : 0) + 22)), tot = hs.reduce((q, v) => q + v, 0), gap = Math.min(56, Math.max(18, Math.floor((avail - tot) / Math.max(1, n - 1))));
    y += Math.max(0, Math.floor((avail - (tot + (n - 1) * gap)) / 2) * .9);
    s.items.forEach((it, k) => { const ch = hs[k], P = PAL[it.group] || grp(k), b = box(root, { x: X0, y, w: XW, h: ch, r: 26, bd: P.bd, bw: 3 });
      numBadge(b, k + 1, P, 22, 20); tx(b, `pt${k}-t`, it.title, { x: 98, y: 14, w: XW - 120, h: 62, size: 40, weight: 700 });
      if (it.sub) tx(b, `pt${k}-s`, it.sub, { x: 98, y: 76, w: sw, h: ch - 76 - 14, size: ss, weight: 500, color: '#45443F', wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); y += ch + gap; });
  },
  stat(root, s) {
    const y = heading(root, 'st-h', s.title) + 10, cx = W / 2, R = 170, cy = y + R + 56, svg = svgLayer(root, W, H), L = 2 * Math.PI * R, pc = Math.max(0, Math.min(100, s.pct ?? 100));
    circ(svg, cx, cy, R, { fill: '#fff', stroke: C.line, w: 34 });
    const a = path(svg, `M${cx} ${cy - R} a${R} ${R} 0 1 1 -0.01 0`, { stroke: C.clay, w: 34 }); a.setAttribute('stroke-dasharray', `${L * pc / 100} ${L}`);
    tx(root, 'st-v', s.value, { x: cx - 150, y: cy - 80, w: 300, h: 160, size: s.value.length > 5 ? 76 : 104, weight: 700, font: 'serif', align: 'center', color: C.clayD });
    let ly = cy + R + 44; const lz = fitSize(s.label, { w: XW - 40, h: 110, max: 42, min: 28, weight: 700, lh: 1.15 }), lh = H_(s.label, lz, XW - 40, 700, 1.15) + 6;
    tx(root, 'st-l', s.label, { x: X0 + 20, y: ly, w: XW - 40, h: lh, size: lz, weight: 700, wrap: true, lh: 1.15, align: 'center' }); ly += lh + 14;
    if (s.sub) { const sz = fitSize(s.sub, { w: XW - 80, h: 100, max: 30, min: 22, weight: 500, lh: 1.25 }), sh = H_(s.sub, sz, XW - 80) + 6; tx(root, 'st-s', s.sub, { x: X0 + 40, y: ly, w: XW - 80, h: sh, size: sz, weight: 500, color: C.mid, wrap: true, lh: 1.25, align: 'center' }); ly += sh + 14; }
    const cols = 20, rows = 5, cell = 40, g = 6, gw = cols * cell + (cols - 1) * g, gx = (W - gw) / 2, gy = Math.max(ly + 24, BODY1 - rows * (cell + g) - 6);    // waffle: 100 cells, one per percent
    for (let k = 0; k < 100; k++) { const r_ = Math.floor(k / cols), c_ = k % cols; E(root, 'abs', `left:${gx + c_ * (cell + g)}px;top:${gy + r_ * (cell + g)}px;width:${cell}px;height:${cell}px;border-radius:10px;background:${k < pc ? C.clay : C.line}`); }
  },
  bars(root, s) {
    let y = heading(root, 'br-h', s.title) + 30; const n = s.rows.length, pitch = Math.min(150, Math.floor((BODY1 - y) / n)), TW = 560, TX = X0 + 250;
    s.rows.forEach((r, k) => { const P = grp(k), cy = y + k * pitch;
      tx(root, `br${k}-l`, r.label, { x: X0, y: cy, w: 236, h: 64, size: 30, weight: 700, wrap: true, lh: 1.1 });
      E(root, 'abs', `left:${TX}px;top:${cy + 12}px;width:${TW}px;height:42px;border-radius:21px;background:${C.line}`);
      E(root, 'abs', `left:${TX}px;top:${cy + 12}px;width:${Math.round(TW * Math.max(0, Math.min(100, r.pct)) / 100)}px;height:42px;border-radius:21px;background:${P.bd}`);
      tx(root, `br${k}-v`, r.value, { x: TX + TW + 12, y: cy, w: W - X0 - (TX + TW + 12), h: 66, size: 34, weight: 700, color: P.ink, align: 'right' }); });
  },
  compare(root, s) {
    let y = heading(root, 'cm-h', s.title) + 30; const cw = (XW - 40) / 2, tw = cw - 70, all = [...s.left.items, ...s.right.items];
    const iz = Math.min(...all.map(t => fitSize(t, { w: tw, h: 190, max: 38, min: 22, weight: 500, lh: 1.25 })));
    const hs = [s.left, s.right].map(sd => sd.items.map(t => H_(t, iz, tw) + 26)), ch = Math.min(BODY1 - y - 10, 118 + Math.max(...hs.map(a => a.reduce((x, q) => x + q, 0))) + 20);
    y += Math.max(0, Math.floor((BODY1 - y - ch) / 2) * .9);
    [s.left, s.right].forEach((side, k) => { const P = PAL[k ? 'clay' : 'blue'], x = X0 + k * (cw + 40), b = box(root, { x, y, w: cw, h: ch, r: 28, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:0;top:0;width:${cw - 6}px;height:96px;border-radius:24px 24px 0 0;background:${P.soft}`);
      tx(b, `cm${k}-h`, side.head, { x: 20, y: 8, w: cw - 46, h: 80, size: 36, weight: 700, color: P.ink, wrap: true, lh: 1.1 });
      let yy = 118; side.items.forEach((t, j) => { const h = hs[k][j]; E(b, 'abs', `left:20px;top:${yy + 14}px;width:14px;height:14px;border-radius:50%;background:${P.bd}`); tx(b, `cm${k}-${j}`, t, { x: 46, y: yy, w: tw, h: h - 8, size: iz, weight: 500, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += h; }); });
    E(root, 'abs', `left:${W / 2 - 34}px;top:${y + 20}px;width:68px;height:68px;border-radius:50%;background:${C.ink};color:#fff;display:flex;align-items:center;justify-content:center;font:700 26px Inter,sans-serif`, 'VS');
  },
  flow(root, s) {
    let y = heading(root, 'fl-h', s.title) + 30; const n = s.steps.length, w = 880, x = (W - w) / 2, svg = svgLayer(root, W, H), sw = w - 150, avail = BODY1 - y;
    const ss = Math.min(...s.steps.map(t => fitSize(t.sub || '', { w: sw, h: 110, max: 30, min: 22, weight: 500, lh: 1.25 })));
    const ch = Math.min(240, Math.max(150, ...s.steps.map(t => 16 + 52 + (t.sub ? H_(t.sub, ss, sw) + 8 : 0) + 20))), gap = Math.min(96, Math.max(48, Math.floor((avail - n * ch) / Math.max(1, n - 1))));
    y += Math.max(0, Math.floor((avail - (n * ch + (n - 1) * gap)) / 2) * .9);
    s.steps.forEach((st, k) => { const P = PAL[st.group] || grp(k), b = box(root, { x, y, w, h: ch, r: 26, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:20px;top:${(ch - 80) / 2 - 3}px;width:80px;height:80px;border-radius:22px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(st.icon || 'bolt', 44, P.ink, 2));
      tx(b, `fl${k}-t`, st.title, { x: 122, y: 14, w: w - 144, h: 56, size: 38, weight: 700 }); if (st.sub) tx(b, `fl${k}-s`, st.sub, { x: 122, y: 70, w: sw, h: ch - 70 - 12, size: ss, weight: 500, color: '#45443F', wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
      if (k < n - 1) { const ay = y + ch; path(svg, `M${W / 2} ${ay + 6} V${ay + gap - 16}`, { stroke: C.lineD, w: 4 }); const t = document.createElementNS(svgNS, 'path'); t.setAttribute('d', `M${W / 2 - 11} ${ay + gap - 24} L${W / 2} ${ay + gap - 8} L${W / 2 + 11} ${ay + gap - 24}`); t.setAttribute('fill', 'none'); t.setAttribute('stroke', C.lineD); t.setAttribute('stroke-width', 4); t.setAttribute('stroke-linecap', 'round'); t.setAttribute('stroke-linejoin', 'round'); svg.appendChild(t); }
      y += ch + gap; });
  },
  big(root, s) {
    E(root, 'abs', `left:${X0}px;top:200px;font:700 260px/1 Lora,serif;color:${C.claySoft}`, '“');
    const z = fitSize(s.big, { w: XW - 20, h: 560, max: 84, min: 44, weight: 700, font: 'serif', lh: 1.12 }), h = Math.ceil(measure(s.big, { size: z, weight: 700, font: 'serif', w: XW - 20, lh: 1.12 }).h) + 8;
    tx(root, 'bg-t', s.big, { x: X0, y: 330, w: XW - 20, h, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.12, color: C.clayD });
    if (s.sub) tx(root, 'bg-s', s.sub, { x: X0, y: 330 + h + 24, w: XW - 40, h: 150, size: fitSize(s.sub, { w: XW - 40, h: 150, max: 34, min: 24, weight: 500, lh: 1.25 }), weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
  },
  resources(root, s) {
    let y = heading(root, 'rs-h', s.title, BODY0 + 8, 52) + 14; const n = s.items.length, room = Math.min(292, Math.floor((BODY1 - y - (n - 1) * 18) / n));
    const wz = Math.min(...s.items.map(t => fitSize(t.why || '', { w: XW - 150, h: room - 138, max: 32, min: 19, weight: 500, lh: 1.25 })));
    const wh = Math.max(...s.items.map(t => Math.ceil(measure(t.why || '', { size: wz, weight: 500, w: XW - 124, lh: 1.25 }).h)));
    const ch = Math.min(room, 14 + 56 + 6 + wh + 14 + 44 + 16), used = n * ch + (n - 1) * 18; y += Math.max(0, Math.floor((BODY1 - y - used) * .4));
    s.items.forEach((it, k) => { const P = grp(s.offset + k), b = box(root, { x: X0, y, w: XW, h: ch, r: 26, bd: P.bd, bw: 3 });
      numBadge(b, s.offset + k + 1, P, 22, 20, 56); tx(b, `rs${k}-n`, it.name, { x: 94, y: 14, w: XW - 120, h: 56, size: 36, weight: 700 });
      tx(b, `rs${k}-w`, it.why, { x: 94, y: 76, w: XW - 124, h: wh + 4, size: wz, weight: 500, color: '#45443F', wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
      const lw = Math.min(XW - 124, Math.round(it.short.length * 14.4 + 70)), link = E(b, 'abs', `left:94px;top:${ch - 62}px;width:${lw}px;height:44px;border-radius:22px;background:${C.sand};border:2px solid ${C.line}`, icon('globe', 24, P.ink, 2));
      tx(b, `rs${k}-u`, it.short, { x: 94 + 44, y: ch - 62 + 3, w: lw - 56, h: 34, size: 24, weight: 500, font: 'mono', color: C.ink }); y += ch + 18; });
  },
  closing(root, s, i, D) {
    const b = D.brand, z = fitSize(s.title, { w: XW, h: 180, max: 72, min: 44, weight: 700, font: 'serif', lh: 1.1 }), h = Math.ceil(measure(s.title, { size: z, weight: 700, font: 'serif', w: XW, lh: 1.1 }).h) + 6, nl = (s.lines || []).length;
    const total = h + 34 + nl * 112 + 30 + 200 + 24 + 104, y0 = BODY0 + Math.max(10, Math.floor((BODY1 - BODY0 - total) / 2));
    tx(root, 'cl-h', s.title, { x: X0, y: y0, w: XW, h, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.1, align: 'center' });
    let y = y0 + h + 34;
    (s.lines || []).forEach((t, k) => { const P = grp(k), bx = box(root, { x: X0 + 40, y, w: XW - 80, h: 92, r: 46, bd: P.bd, bw: 3, shadow: false });
      E(bx, 'abs', `left:18px;top:16px;width:54px;height:54px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon('check', 32, P.ink, 2.4)); tx(bx, `cl${k}`, t, { x: 92, y: 0, w: XW - 80 - 116, h: 86, size: 34, weight: 600 }); y += 112; });
    y += 30;
    E(root, 'abs', `left:${W / 2 - 100}px;top:${y}px;width:200px;height:200px;border-radius:50%;background:url(${b.avatar || 'assets/avatar.png'}) center/cover;border:6px solid #fff;box-shadow:0 0 0 3px ${C.clay}`);
    cta(root, 'cl-cta', b, { x: 60, y: y + 224, w: 960, h: 104, size: 28, bw: 4 });
  },
};

export function buildCarousel(stage, D) {
  const c = D.carousel, slides = c.deck, n = slides.length, roots = [];
  slides.forEach((s, i) => {
    const root = E(stage, 'scene'); root.style.display = 'none'; root.style.opacity = '1'; roots.push(root);
    frame(root, i, n, D.brand, s.cta || '', i === n - 1);
    TYPES[s.type](root, s, i, D);
  });
  return { DUR: n, N: n, render(t) { const k = Math.max(0, Math.min(n - 1, Math.floor(t + 1e-6))); roots.forEach((r, i) => { r.style.display = i === k ? 'block' : 'none'; }); } };
}
