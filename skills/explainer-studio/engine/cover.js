// Reel cover (1080x1920): one designed still per layout (hero, question, number, split, face), Claude paper look, every corner rounded.
// Content comes from scripts/cover.py (words already in the story). Text stays inside y 300..1560: safe for the 4:5 / 3:4 grid crops and the Reels UI.
import { C, E, box, tx, icon, svgLayer, path, circ, fitSize, measure, chip, PALS, svgNS } from './kit.js';
import { cta } from './cta.js';

const W = 1080, H = 1920, X0 = 70, XW = W - 2 * X0, Y0 = 300, Y1 = 1560;
const P3 = [PALS[0], PALS[1], PALS[2]];
const hookH = (t, size, w, font = 'serif', weight = 700, lh = 1.06) => Math.ceil(measure(t, { size, weight, font, w, lh }).h) + 6;

function blobs(root, k = 0) {
  const spots = [[[W - 300, 120, 560, C.claySoft], [-200, 1180, 620, C.blueSoft]], [[-180, 160, 520, C.blueSoft], [W - 360, 1240, 600, C.greenSoft]]][k % 2];
  spots.forEach(([x, y, r, c]) => E(root, 'abs', `left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:${c};opacity:.85`));
}
function brandPill(root, brand, y) { cta(root, 'cv-cta', brand, { x: 60, y, w: 960, h: 84, size: 26, bw: 4 }); }   // the same author CTA as every other media
function chipRow(root, labels, y, { center = true, pals = P3 } = {}) {
  if (!labels.length) return y;
  const row = E(root, 'abs', `left:${X0}px;top:${y}px;width:${XW}px;display:flex;flex-wrap:wrap;gap:16px;justify-content:${center ? 'center' : 'flex-start'}`);
  labels.forEach((t, k) => chip(row, `cv-chip${k}`, t, { size: 32, pal: pals[k % pals.length] }));
  return y + row.getBoundingClientRect().height;
}
function kicker(root, text, y, center = false) {
  if (!text) return y;
  const row = E(root, 'abs', `left:${X0}px;top:${y}px;width:${XW}px;display:flex;justify-content:${center ? 'center' : 'flex-start'}`);
  chip(row, 'cv-kicker', text, { size: 30, pal: PALS[1], weight: 700 }); return y + 84;
}
function hook(root, text, { y, h, max = 112, min = 60, center = false, font = 'serif', weight = 700, color = C.ink }) {
  const z = fitSize(text, { w: XW, h, max, min, weight, font, lh: 1.06 }), hh = Math.min(h, hookH(text, z, XW, font, weight));
  tx(root, 'cv-hook', text, { x: X0, y, w: XW, h: hh, size: z, weight, font, wrap: true, lh: 1.06, align: center ? 'center' : 'left', color }); return y + hh;
}
function arrowHead(svg, x, y, ang, c, s = 18) {
  const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', `M0 0L${-s} ${-s * .62}Q${-s * .7} 0 ${-s} ${s * .62}Z`); p.setAttribute('fill', c);
  p.setAttribute('transform', `translate(${x} ${y}) rotate(${ang})`); svg.appendChild(p);
}

const L = {
  hero(root, D) {
    blobs(root, 0); const c = D.cover, f = c.flow, svg = svgLayer(root, W, H);
    let y = kicker(root, c.kicker || f.title, Y0);
    y = hook(root, c.hook, { y: y + 8, h: 430, max: 108, min: 62 }) + 56;
    const n = f.steps.length, gap = 56, ch = Math.min(200, Math.floor((1420 - y - gap * (n - 1)) / n)), top = y + Math.max(0, Math.floor((1420 - y - n * ch - gap * (n - 1)) / 2)), cw = 720;
    const tz = Math.min(...f.steps.map(s => fitSize(s.title, { w: cw - 150, h: 60, max: 48, min: 30, weight: 700 })));
    f.steps.forEach((s, k) => {
      const P = P3[k % 3], x = k % 2 ? W - X0 - cw : X0, yy = top + k * (ch + gap), b = box(root, { x, y: yy, w: cw, h: ch, r: 32, bd: P.bd, bw: 3, css: 'box-shadow:0 14px 30px rgba(20,20,19,.08);' });
      E(b, 'abs', `left:20px;top:${(ch - 6 - 100) / 2}px;width:100px;height:100px;border-radius:28px;background:${P.soft};display:flex;align-items:center;justify-content:center`, s.icon ? icon(s.icon, 56, P.ink, 2) : `<span style="font:700 44px Lora,serif;color:${P.ink}">${k + 1}</span>`);
      tx(b, `cv-st${k}`, s.title, { x: 140, y: 0, w: cw - 150, h: ch - 6, size: tz, weight: 700 });
      if (k < n - 1) {
        const x0 = k % 2 ? x + 120 : x + cw - 120, x1 = k % 2 ? X0 + cw - 120 : W - X0 - cw + 120, ya = yy + ch + 2, yb = yy + ch + gap - 4;
        path(svg, `M${x0} ${ya}C${x0} ${ya + gap * .9} ${x1} ${yb - gap * .9} ${x1} ${yb - 14}`, { stroke: C.lineD, w: 5, dash: '2 12' }); arrowHead(svg, x1, yb - 2, 90, C.clay);
      }
    });
    brandPill(root, D.brand, 1468);
  },
  question(root, D) {
    blobs(root, 1); const c = D.cover, svg = svgLayer(root, W, H);
    E(root, 'abs', `left:${W - 560}px;top:150px;width:600px;height:900px;font:700 860px/1 Lora,serif;color:${C.claySoft};transform:rotate(8deg)`, '?');
    let y = kicker(root, c.kicker, Y0 + 20);
    const hb = hook(root, c.hook, { y: y + 10, h: 720, max: 132, min: 70, font: 'sans', weight: 800 });
    path(svg, `M${X0} ${hb + 30}C${X0 + 260} ${hb + 6} ${X0 + 520} ${hb + 56} ${X0 + 780} ${hb + 22}`, { stroke: C.clay, w: 14 });
    y = hb + 90;
    if (c.sub) { const z = fitSize(c.sub, { w: XW, h: 150, max: 42, min: 30, weight: 500, lh: 1.2 }), hh = hookH(c.sub, z, XW, 'sans', 500, 1.2); tx(root, 'cv-sub', c.sub, { x: X0, y, w: XW, h: hh, size: z, weight: 500, color: C.mid, wrap: true, lh: 1.2 }); y += hh + 40; }
    chipRow(root, c.chips, Math.max(y, 1250), { center: false });
    brandPill(root, D.brand, 1468);
  },
  number(root, D) {
    blobs(root, 0); const c = D.cover, nm = c.number, svg = svgLayer(root, W, H);
    const hb = hook(root, c.hook, { y: Y0, h: 300, max: 78, min: 50, center: true });
    const cx = W / 2, R = 250, cy = hb + 70 + R, Lc = 2 * Math.PI * R;
    const g = document.createElementNS(svgNS, 'linearGradient'); g.setAttribute('id', 'cv-rg'); g.setAttribute('x1', '0'); g.setAttribute('x2', '1');
    [[0, C.clay], [1, C.clayD]].forEach(([o, col]) => { const s = document.createElementNS(svgNS, 'stop'); s.setAttribute('offset', o); s.setAttribute('stop-color', col); g.appendChild(s); });
    const defs = document.createElementNS(svgNS, 'defs'); defs.appendChild(g); svg.appendChild(defs);
    circ(svg, cx, cy, R + 40, { fill: C.card }); circ(svg, cx, cy, R, { fill: 'none', stroke: C.line, w: 44 });
    const a = path(svg, `M${cx} ${cy - R}a${R} ${R} 0 1 1 -0.01 0`, { stroke: 'url(#cv-rg)', w: 44 }); a.setAttribute('stroke-dasharray', `${Lc * .78} ${Lc}`);
    const vz = fitSize(nm.value, { w: 400, h: 240, max: 230, min: 90, weight: 700, font: 'serif', lh: 1 });
    tx(root, 'cv-num', nm.value, { x: cx - 210, y: cy - 130, w: 420, h: 260, size: vz, weight: 700, font: 'serif', align: 'center', color: C.clayD, lh: 1 });
    const ly = cy + R + 80, lz = fitSize(nm.label, { w: XW, h: 200, max: 52, min: 34, weight: 700, lh: 1.15 });
    tx(root, 'cv-lab', nm.label, { x: X0, y: ly, w: XW, h: Math.min(200, hookH(nm.label, lz, XW, 'sans', 700, 1.15)), size: lz, weight: 700, wrap: true, lh: 1.15, align: 'center' });
    brandPill(root, D.brand, 1468);
  },
  split(root, D) {
    blobs(root, 1); const c = D.cover, svg = svgLayer(root, W, H);
    const hb = hook(root, c.hook, { y: Y0, h: 330, max: 84, min: 52 }), top = hb + 50, ph = Math.floor((1420 - top - 60) / 2);
    c.split.forEach((sd, k) => {
      const P = P3[k], y = top + k * (ph + 60), b = box(root, { x: X0, y, w: XW, h: ph, r: 40, fill: P.soft, bd: P.bd, bw: 3, shadow: false, css: 'box-shadow:0 16px 36px rgba(20,20,19,.08);' });
      tx(b, `cv-sh${k}`, sd.head, { x: 36, y: 22, w: XW - 72, h: 70, size: fitSize(sd.head, { w: XW - 72, h: 70, max: 48, min: 30, weight: 700, font: 'serif' }), weight: 700, font: 'serif', color: P.ink });
      const iz = Math.min(...sd.items.map(t => fitSize(t, { w: XW - 150, h: 50, max: 36, min: 24, weight: 600 }))), pitch = Math.min(80, Math.floor((ph - 110) / Math.max(1, sd.items.length)));
      sd.items.forEach((t, j) => { const yy = 104 + j * pitch;
        E(b, 'abs', `left:36px;top:${yy + 4}px;width:44px;height:44px;border-radius:50%;background:${C.card};border:3px solid ${P.bd};display:flex;align-items:center;justify-content:center`, icon(k ? 'check' : 'bolt', 26, P.ink, 2.2));
        tx(b, `cv-si${k}${j}`, t, { x: 100, y: yy, w: XW - 150, h: 52, size: iz, weight: 600 }); });
    });
    const ay = top + ph + 30; E(root, 'abs', `left:${W / 2 - 46}px;top:${ay - 46}px;width:92px;height:92px;border-radius:50%;background:${C.clay};box-shadow:0 0 0 10px ${C.bg};display:flex;align-items:center;justify-content:center`,
      `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v15M6 13l6 6 6-6"/></svg>`);
    brandPill(root, D.brand, 1468);
  },
  face(root, D) {
    blobs(root, 0); const c = D.cover, S = 420, x = (W - S) / 2, y = Y0;
    E(root, 'abs', `left:${x - 34}px;top:${y - 34}px;width:${S + 68}px;height:${S + 68}px;border-radius:50%;background:conic-gradient(${C.clay},${C.blue},${C.green},${C.clay})`);
    E(root, 'abs', `left:${x - 12}px;top:${y - 12}px;width:${S + 24}px;height:${S + 24}px;border-radius:50%;background:${C.bg}`);
    E(root, 'abs', `left:${x}px;top:${y}px;width:${S}px;height:${S}px;border-radius:50%;background:url(${D.brand.avatar || 'assets/avatar.png'}) center/cover;box-shadow:0 24px 60px rgba(20,20,19,.18)`);
    const hb = hook(root, c.hook, { y: y + S + 80, h: 470, max: 100, min: 58, center: true });
    chipRow(root, c.chips, Math.min(hb + 50, 1330));
    brandPill(root, D.brand, 1468);
  },
};

export function buildCover(stage, D) {
  const ls = D.cover.layouts, roots = ls.map(l => { const r = E(stage, 'scene'); r.style.opacity = '1'; r.style.display = 'block'; L[l](r, D); r.style.display = 'none'; return r; });
  return { DUR: ls.length, N: ls.length, render(t) { const k = Math.max(0, Math.min(ls.length - 1, Math.floor(t + 1e-6))); roots.forEach((r, i) => { r.style.display = i === k ? 'block' : 'none'; }); } };
}
