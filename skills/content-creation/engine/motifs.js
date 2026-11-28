// Mini diagrams and the numbered card grid ("20 algorithms visualised" poster). Used by the carousel/infographic `grid` slide and the `grid` GIF template.
// Everything is drawn from the palette in kit.js (PAL groups), so a theme change recolours it. Deterministic: no Math.random.
import { C, E, box, tx, svgLayer, path, circ, fitSize, measure } from './kit.js';
import { PAL } from './gif_common.js';

export const MOTIFS = ['bars', 'curve', 'tree', 'flow', 'cluster', 'network', 'loop', 'steps', 'split', 'pixels'];
const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rect = (svg, x, y, w, h, o) => path(svg, `M${x} ${y} h${w} v${h} h${-w} Z`, o);
const line = (svg, x1, y1, x2, y2, o) => path(svg, `M${x1} ${y1} L${x2} ${y2}`, o);
const head = (svg, x, y, c, s = 7) => path(svg, `M${x - s} ${y - s * .8} L${x} ${y} L${x - s} ${y + s * .8}`, { stroke: c, w: 2.4 });

// draws motif `kind` inside the box (x, y, w, h); returns the elements that should pulse in the GIF
export function motif(svg, kind, x, y, w, h, P, seed = 1) {
  const R = rnd(seed * 97 + 13), main = P.bd, dark = P.ink, acc = [], cx = x + w / 2, cy = y + h / 2, sw = 2.6;
  switch (kind) {
    case 'bars': {
      const n = 5, bw = Math.min(30, w / (n * 1.8)), gap = (w * .78 - bw * n) / (n - 1), x0 = x + w * .11;
      for (let i = 0; i < n; i++) { const full = h * (.5 + R() * .45), part = full * (.4 + R() * .35), bx = x0 + i * (bw + gap);
        rect(svg, bx, y + h - full, bw, full, { stroke: C.lineD, w: 1.8, fill: '#fff' }); const f = rect(svg, bx, y + h - part, bw, part, { stroke: 'none', fill: i === 2 ? C.clay : main }); if (i === 2) acc.push(f); }
      line(svg, x0 - 8, y + h + 2, x0 + n * (bw + gap), y + h + 2, { stroke: dark, w: 2 }); break; }
    case 'curve': {
      line(svg, x + 6, y, x + 6, y + h, { stroke: dark, w: 2 }); line(svg, x + 6, y + h, x + w - 4, y + h, { stroke: dark, w: 2 });
      const f = t => y + h * (.88 - 1.5 * t * (1 - t) * 1.1);
      for (let i = 0; i < 14; i++) { const t = (i + .5) / 14; circ(svg, x + 14 + t * (w - 28), f(t) - 6 - R() * h * .3 + h * .08, 4.2, { fill: main }); }
      acc.push(path(svg, `M${x + 14} ${f(0)} Q${cx} ${y - h * .12} ${x + w - 14} ${f(1)}`, { stroke: C.clay, w: 4 })); break; }
    case 'tree': {
      const L = [[cx, y + 8], [cx - w * .22, y + h * .45], [cx + w * .22, y + h * .45], [cx - w * .34, y + h - 8], [cx - w * .1, y + h - 8], [cx + w * .1, y + h - 8], [cx + w * .34, y + h - 8]], E_ = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      E_.forEach(([a, b]) => line(svg, L[a][0], L[a][1], L[b][0], L[b][1], { stroke: dark, w: 2.4 }));
      L.forEach((p, i) => { const c = circ(svg, p[0], p[1], i < 3 ? 9 : 7.5, { fill: i === 5 ? C.clay : main, stroke: '#fff', w: 2 }); if (i === 5) acc.push(c); }); break; }
    case 'flow': {
      const n = 4, r = Math.min(17, h * .2), step = (w - 2 * r - 8) / (n - 1);
      for (let i = 0; i < n; i++) { const px = x + r + 4 + i * step; if (i < n - 1) { line(svg, px + r + 3, cy, px + step - r - 3, cy, { stroke: dark, w: 2.4 }); head(svg, px + step - r - 2, cy, dark, 7); }
        const c = circ(svg, px, cy, r, { fill: i === n - 1 ? C.clay : '#fff', stroke: i === n - 1 ? C.clay : main, w: 3 }); if (i === n - 1) acc.push(c); }
      path(svg, `M${x + w - r - 4} ${cy + r + 6} v14 H${x + r + 4} v-14`, { stroke: C.lineD, w: 2, dash: '4 5' }); break; }
    case 'cluster': {
      [[cx - w * .17, cy, w * .3, h * .42, main], [cx + w * .17, cy, w * .3, h * .42, C.clay]].forEach(([ex, ey, rx, ry, c]) => path(svg, `M${ex - rx} ${ey} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`, { stroke: c, w: 2.6 }));
      for (let i = 0; i < 18; i++) { const left = i % 2 === 0; circ(svg, cx + (left ? -w * .17 : w * .17) + (R() - .5) * w * .42, cy + (R() - .5) * h * .6, 4, { fill: left ? main : C.clay }); }
      acc.push(circ(svg, cx, cy, 8, { fill: '#fff', stroke: dark, w: 3 })); break; }
    case 'network': {
      const cols = [3, 4, 2], px = i => x + w * (.12 + i * .38), ys = (k, n) => y + h * (.5 + (k - (n - 1) / 2) * (n > 3 ? .24 : .3));
      for (let a = 0; a < 2; a++) for (let i = 0; i < cols[a]; i++) for (let j = 0; j < cols[a + 1]; j++) line(svg, px(a), ys(i, cols[a]), px(a + 1), ys(j, cols[a + 1]), { stroke: C.lineD, w: 1.6 });
      cols.forEach((n, a) => { for (let i = 0; i < n; i++) { const c = circ(svg, px(a), ys(i, n), 8, { fill: a === 2 && i === 0 ? C.clay : '#fff', stroke: a === 2 && i === 0 ? C.clay : main, w: 2.6 }); if (a === 2 && i === 0) acc.push(c); } }); break; }
    case 'loop': {
      const r = Math.min(w, h) * .38; path(svg, `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx + r * Math.cos(.5)} ${cy - r * Math.sin(.5)}`, { stroke: main, w: 4 }); head(svg, cx + r * Math.cos(.5) + 3, cy - r * Math.sin(.5) - 1, main, 9);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 1.1; circ(svg, cx + r * Math.cos(a), cy + r * Math.sin(a), 6.5, { fill: '#fff', stroke: dark, w: 2.4 }); }
      acc.push(circ(svg, cx, cy, 9, { fill: C.clay })); break; }
    case 'steps': {
      const bw = w * .24, bh = h * .46, gp = (w - 3 * bw) / 2;
      for (let i = 0; i < 3; i++) { const bx = x + i * (bw + gp); const b = box(svg.parentNode, { x: bx, y: cy - bh / 2, w: bw, h: bh, r: 8, fill: i === 1 ? C.clay : '#fff', bd: i === 1 ? C.clay : main, bw: 2.6, shadow: false });
        if (i === 1) acc.push(b); if (i < 2) { line(svg, bx + bw + 4, cy, bx + bw + gp - 6, cy, { stroke: dark, w: 2.4 }); head(svg, bx + bw + gp - 4, cy, dark, 6); } }
      break; }
    case 'split': {
      for (let i = 0; i < 16; i++) { const left = i < 8; circ(svg, (left ? x + w * .1 : cx + w * .06) + R() * w * .34, y + h * .1 + R() * h * .8, 4.4, { fill: left ? main : C.clay }); }
      path(svg, `M${cx} ${y} L${cx} ${y + h}`, { stroke: dark, w: 2.2, dash: '6 5' }); acc.push(circ(svg, cx + 2, cy, 11, { fill: 'none', stroke: dark, w: 2.6 })); break; }
    case 'pixels': {
      const n = 5, s = Math.min(w, h) / (n + .4), gx = cx - n * s / 2, gy = cy - n * s / 2;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const hot = i === 2 && j === 2, on = R() > .45; const c = rect(svg, gx + j * s + 1.5, gy + i * s + 1.5, s - 3, s - 3, { stroke: 'none', fill: hot ? C.clay : on ? main : C.line }); if (hot) acc.push(c); } break; }
    default: throw new Error('unknown motif ' + kind);
  }
  return acc;
}

// jagged top edge for the title banner
export function banner(root, svg, { x, y, w, h, title, kicker, id = 'gr' }) {
  const n = 34, pts = [`0 14px`]; for (let i = 1; i <= n; i++) pts.push(`${(100 * i / n).toFixed(2)}% ${(i % 2 ? 0 : 12) + (i % 3) * 2}px`); pts.push('100% 100%', '0 100%');
  const bg = E(root, 'abs', `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${C.clayD};clip-path:polygon(${pts.join(',')})`);   // a real filled element, so the contrast gate sees the colour behind the white title
  const sz = fitSize(title, { w: w - 60, h: h - 56, max: 64, min: 34, weight: 700, font: 'serif', lh: 1.05 });
  tx(bg, id + '-h', title, { x: 30, y: 18, w: w - 60, h: Math.ceil(measure(title, { size: sz, weight: 700, font: 'serif', w: w - 60, lh: 1.05 }).h) + 4, size: sz, weight: 700, font: 'serif', color: '#fff', align: 'center', wrap: true, lh: 1.05 });
  if (kicker) tx(bg, id + '-k', kicker, { x: 30, y: h - 42, w: w - 60, h: 34, size: 24, weight: 700, color: '#fff', align: 'center' });
}

export function legend(root, svg, items, { x, y, w, id = 'gr' }) {
  const n = items.length, gap = 12, cw = (w - gap * (n - 1)) / n;
  items.forEach((it, i) => { const P = PAL[it.group] || PAL.green, b = box(root, { x: x + i * (cw + gap), y, w: cw, h: 40, r: 20, fill: C.card, bd: C.lineD, bw: 2, shadow: false });
    E(b, 'abs', `left:14px;top:12px;width:16px;height:16px;border-radius:50%;background:${P.bd}`);
    tx(b, `${id}-lg${i}`, it.label, { x: 38, y: 0, w: cw - 46, h: 36, size: Math.min(21, fitSize(it.label, { w: cw - 46, h: 34, max: 21, min: 14, weight: 600 })), weight: 600 }); });
}

// rows x cols numbered cards in rect {x,y,w,h}; returns [{ el, acc }] so the GIF can reveal each card and pulse its highlight
export function cards(root, svg, list, rc, { id = 'gr', gap = 16 } = {}) {
  const n = list.length, cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), cw = (rc.w - gap * (cols - 1)) / cols, ch = (rc.h - gap * (rows - 1)) / rows, out = [];
  list.forEach((c, i) => {
    const P = PAL[c.group] || PAL.green, x = rc.x + (i % cols) * (cw + gap), y = rc.y + Math.floor(i / cols) * (ch + gap), pad = 16;
    const card = box(root, { x, y, w: cw, h: ch, r: 18, fill: C.sand, bd: C.line, bw: 2, shadow: false }), mh = ch * (ch > 330 ? .44 : .38), mw = cw - 2 * pad - 30;
    E(card, 'abs', `left:10px;top:10px;width:46px;height:46px;border-radius:50%;background:${P.ink};color:#fff;font-weight:700;font-size:23px;display:flex;align-items:center;justify-content:center`, String(c.n ?? i + 1));
    const sv = svgLayer(card, cw, ch), acc = motif(sv, c.motif, pad + 24, 14, mw, mh, P, i + 1);
    let yy = 14 + mh + 12; const cz = 20;
    tx(card, `${id}-c${i}`, c.caption, { x: pad, y: yy, w: cw - 2 * pad, h: 26, size: cz, weight: 600, color: C.clayD, align: 'center' }); yy += 30;
    const tz = fitSize(c.title, { w: cw - 2 * pad, h: 40, max: 34, min: 20, weight: 700, font: 'serif', lh: 1.1 }); tx(card, `${id}-t${i}`, c.title, { x: pad, y: yy, w: cw - 2 * pad, h: 42, size: tz, weight: 700, font: 'serif', align: 'center' }); yy += 46;
    const sz = fitSize(c.sub, { w: cw - 2 * pad, h: ch - yy - 10, max: 24, min: 17, weight: 500, lh: 1.22 }); tx(card, `${id}-s${i}`, c.sub, { x: pad, y: yy, w: cw - 2 * pad, h: ch - yy - 10, size: sz, weight: 500, color: C.sub, align: 'center', wrap: true, lh: 1.22 });
    out.push({ el: card, acc });
  });
  return out;
}
