// Architecture diagrams for a whole blog post, in four styles, drawn into any box (a carousel slide body or a GIF frame).
//   sketch    Excalidraw-like: hand-drawn strokes (seeded, deterministic), hachure fills, Excalifont
//   cloud     professional reference architecture: zone bands, service cards with icons, labelled connectors, legend
//   flow      flowchart with swimlanes: actors as columns, steps flow down, decisions are diamonds, back-edges loop on the right
//   sequence  sequence diagram: actors across the top, lifelines, messages down time, replies dashed, self-calls loop
// renderArch(root, A, box) returns { edges: [{ path, color }] } so a GIF can run flow along every connector.
// Every text is fitted to its box (fitSize) and every corner is rounded; nothing is placed outside the box.
import { C, E, box as card, tx, icon, svgLayer, path, circ, fitSize, measure, svgNS, roundPts } from './kit.js';

const NS = (p, n, a = {}) => { const e = document.createElementNS(svgNS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
const TONES = () => [{ bd: C.blue, ink: C.blueD, soft: C.blueSoft }, { bd: C.clay, ink: C.clayD, soft: C.claySoft }, { bd: C.green, ink: C.greenD, soft: C.greenSoft }, { bd: '#8B6FB8', ink: '#5C4486', soft: '#EEE7F6' }, { bd: C.lineD, ink: C.mid, soft: C.sand }];
const f1 = v => (+v).toFixed(1);

// —— hand-drawn strokes: a seeded wobble, drawn twice like a marker ——
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 1000) / 1000; }; }
function roughSeg(r, x1, y1, x2, y2, amp = 1.6) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L, ny = (x2 - x1) / L, b = (r() - .5) * Math.min(6, L * .02) * amp, j = () => (r() - .5) * amp * 1.4;
  const mx = (x1 + x2) / 2 + nx * b, my = (y1 + y2) / 2 + ny * b;
  return `M${f1(x1 + j())} ${f1(y1 + j())}Q${f1(mx)} ${f1(my)} ${f1(x2 + j())} ${f1(y2 + j())}`;
}
function roughPoly(svg, pts, { stroke, w = 2.4, seed = 1, closed = false }) {
  const r = rng(seed), segs = []; for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; segs.push(roughSeg(r, a[0], a[1], b[0], b[1]), roughSeg(r, a[0], a[1], b[0], b[1], 1.1)); }
  return NS(svg, 'path', { d: segs.join(''), fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
}
let clipN = 0;
function hachure(svg, x, y, w, h, color, seed, gap = 12) {   // diagonal fill lines clipped to a rounded rectangle, the Excalidraw "hachure" fill
  const id = 'hc' + (++clipN), cp = NS(svg, 'clipPath', { id }); NS(cp, 'rect', { x, y, width: w, height: h, rx: 10 });
  const g = NS(svg, 'g', { 'clip-path': `url(#${id})` }), r = rng(seed); let d = '';
  for (let k = -h; k < w; k += gap) d += roughSeg(r, x + k, y + h, x + k + h, y, .8);
  NS(g, 'path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .55 });
}
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function arrowHead(svg, x, y, dx, dy, color, hand) {
  const a = Math.atan2(dy, dx), s = 15, p = (t, l) => [x - Math.cos(a + t) * l, y - Math.sin(a + t) * l];
  if (hand) return roughPoly(svg, [p(.45, s), [x, y], p(-.45, s)], { stroke: color, w: 2.6, seed: Math.round(x * 7 + y) });
  return NS(svg, 'path', { d: `M${f1(x)} ${f1(y)}L${p(.42, s).map(f1).join(' ')}Q${f1(x - Math.cos(a) * s * .7)} ${f1(y - Math.sin(a) * s * .7)} ${p(-.42, s).map(f1).join(' ')}Z`, fill: color });
}
function label(root, id, text, x, y, { hand, color, maxW = 220 }) {   // text on the connector: a halo pill drawn with CSS, not a card, so it never counts as a box
  const font = hand ? 'hand' : 'sans', z = fitSize(text, { w: maxW - 24, h: 28, max: hand ? 24 : 19, min: 20, weight: hand ? 400 : 700, font }), w = Math.min(maxW, Math.ceil(text.length * z * .56 + 28));
  tx(root, id, text, { x: x - w / 2, y: y - 17, w, h: 34, size: z, weight: hand ? 400 : 700, font, color: hand ? '#1e1e1e' : color, align: 'center',
    css: `background:${C.bg};border-radius:17px;box-shadow:0 0 0 2px ${hand ? '#1e1e1e33' : color + '55'};text-shadow:0 0 3px ${C.bg};` });
}
const longest = pts => { let best = 0, bi = 0; for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (d > best) { best = d; bi = i; } } return [(pts[bi][0] + pts[bi + 1][0]) / 2, (pts[bi][1] + pts[bi + 1][1]) / 2]; };

// —— node cards ——
function node(root, svg, n, x, y, w, h, P, hand, i, shape = 'rect') {
  const font = hand ? 'hand' : 'sans', ink = hand ? '#1e1e1e' : C.ink, hasIc = n.icon && w > 150 && shape !== 'diamond', ts = Math.min(48, h - 10), tw = w - (hasIc ? ts + 22 + (shape === 'pill' ? 12 : 0) : 24) - 10;
  if (shape === 'diamond') {
    const pts = [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
    if (hand) { NS(svg, 'path', { d: roundPts(pts, 8, true), fill: P.soft, stroke: 'none' }); roughPoly(svg, pts, { stroke: ink, seed: 40 + i, closed: true }); }
    else path(svg, roundPts(pts, 14, true), { stroke: P.ink, w: 3, fill: '#fff', sharp: true });   // white so it stands out from a tinted lane
    const z = fitSize(n.title, { w: w * .64, h: h * .5, max: hand ? 26 : 22, min: 20, weight: hand ? 400 : 700, font, lh: 1.1 });
    tx(root, 'ar-n' + i, n.title, { x: x + w * .18, y: y + h * .25, w: w * .64, h: h * .5, size: z, weight: hand ? 400 : 700, font, color: hand ? ink : P.ink, align: 'center', wrap: true, lh: 1.1 });
    if (!n.icon) return null;   // a round icon badge on the diamond's right corner (arrows arrive at the top and the left)
    const bs = Math.min(44, h * .62);
    return E(root, 'abs', `left:${f1(x + w - bs / 2 - 4)}px;top:${f1(y + h / 2 - bs / 2)}px;width:${f1(bs)}px;height:${f1(bs)}px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px ${P.ink};display:flex;align-items:center;justify-content:center`, icon(n.icon, Math.round(bs * .58), P.ink, 2.2));
  }
  const r = shape === 'pill' ? h / 2 : hand ? 10 : 20;
  if (hand) { NS(svg, 'rect', { x, y, width: w, height: h, rx: r, fill: '#fff' }); hachure(svg, x, y, w, h, P.bd, 70 + i); roughPoly(svg, rectPts(x, y, w, h), { stroke: ink, seed: 90 + i, closed: true }); }
  else { const b = card(root, { x, y, w, h, r, fill: shape === 'pill' ? P.soft : '#fff', bd: P.bd, bw: 3, css: 'box-shadow:0 10px 22px rgba(20,20,19,.08);' }); b.dataset.round = shape === 'pill' ? '1' : ''; }
  const ic = hasIc ? E(root, 'abs', `left:${f1(x + (shape === 'pill' ? 18 : 10))}px;top:${f1(y + (h - ts) / 2)}px;width:${ts}px;height:${ts}px;border-radius:${Math.round(ts * .3)}px;background:${hand ? 'transparent' : P.soft};display:flex;align-items:center;justify-content:center`, icon(n.icon, Math.round(ts * (n.icon.startsWith('logo:') ? .92 : .62)), hand ? ink : P.ink, hand ? 2.2 : 2)) : null;   // a logo brings its own white tile
  const tx0 = x + (hasIc ? ts + 22 + (shape === 'pill' ? 12 : 0) : 14), sub = n.sub && h >= 84, th = sub ? h * .5 : h - 12;
  const z = fitSize(n.title, { w: tw, h: th - 4, max: hand ? 30 : 24, min: 20, weight: hand ? 400 : 700, font, lh: 1.1 });
  tx(root, 'ar-n' + i, n.title, { x: tx0, y: y + (sub ? 8 : 6), w: tw, h: th, size: z, weight: hand ? 400 : 700, font, color: ink, wrap: true, lh: 1.1, align: hasIc ? 'left' : 'center' });
  if (sub) { const zs = fitSize(n.sub, { w: tw, h: h - th - 14, max: hand ? 22 : 18, min: 20, weight: hand ? 400 : 500, font, lh: 1.15 }); tx(root, 'ar-s' + i, n.sub, { x: tx0, y: y + th + 2, w: tw, h: h - th - 10, size: zs, weight: hand ? 400 : 500, font, color: hand ? '#444' : C.mid, wrap: true, lh: 1.15, align: hasIc ? 'left' : 'center', css: 'align-items:flex-start;' }); }
  return ic;
}

// —— connectors: orthogonal routes with rounded elbows (auto in path()), or hand-drawn segments ——
function connector(svg, pts, { color, hand, dashed, seed }) {
  let p;
  if (hand) { p = roughPoly(svg, pts, { stroke: color, w: 2.4, seed }); if (dashed) p.setAttribute('stroke-dasharray', '8 9'); }
  else p = path(svg, 'M' + pts.map(q => q.map(f1).join(' ')).join('L'), { stroke: color, w: 3.2, dash: dashed ? '8 9' : null });
  const route = NS(svg, 'path', { d: roundPts(pts, 14), fill: 'none', stroke: 'none' });   // a clean copy of the route for the flow dots
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]; arrowHead(svg, b[0], b[1], b[0] - a[0], b[1] - a[1], color, hand);
  return route;
}

// —— zone styles (sketch + cloud) ——
function zones(root, A, B, hand) {
  const svg = svgLayer(root, 1080, 1920), T = TONES(), Z = A.zones && A.zones.length ? A.zones : [{ title: '' }], nz = Z.length, gap = 18, legendH = hand ? 0 : 44;
  const zic = [], zh = (B.h - legendH - gap * (nz - 1)) / nz, pos = {}, edges = [], ink = hand ? '#1e1e1e' : null;
  Z.forEach((z, k) => {
    const P = T[(z.group ?? k) % T.length], y = B.y + k * (zh + gap);
    if (hand) { roughPoly(svg, rectPts(B.x, y, B.w, zh), { stroke: '#8a8a8a', w: 1.8, seed: 7 + k, closed: true }).setAttribute('stroke-dasharray', '10 8'); }
    else { const bg = card(root, { x: B.x, y, w: B.w, h: zh, r: 26, fill: P.soft, bd: P.bd, bw: 2, shadow: false, bg: true, css: 'border-style:dashed;' }); bg.style.opacity = '.85'; }
    if (z.title) tx(root, 'ar-z' + k, z.title.toUpperCase(), { x: B.x + 18, y: y + 8, w: B.w - 36, h: 30, size: hand ? 24 : 20, weight: hand ? 400 : 800, font: hand ? 'hand' : 'sans', color: hand ? '#555' : P.ink, ls: hand ? 0 : .12 });
    const ns = A.nodes.filter(n => (n.zone ?? 0) === k), rows = ns.length > 4 ? 2 : 1, per = Math.ceil(ns.length / rows), top = y + (z.title ? 44 : 14), avail = zh - (z.title ? 54 : 24);
    const nh = Math.min(hand ? 104 : 96, (avail - (rows - 1) * 16) / rows), nw = Math.min(300, (B.w - 40 - (per - 1) * 26) / per);
    ns.forEach((n, j) => { const r = Math.floor(j / per), c = j % per, cnt = r === rows - 1 ? ns.length - r * per : per, x = B.x + (B.w - (cnt * nw + (cnt - 1) * 26)) / 2 + c * (nw + 26), yy = top + (avail - (rows * nh + (rows - 1) * 16)) / 2 + r * (nh + 16);
      pos[n.id] = { x, y: yy, w: nw, h: nh, zone: k, P: T[(n.group ?? Z[k].group ?? k) % T.length] }; zic[A.nodes.indexOf(n)] = { el: node(root, svg, n, x, yy, nw, nh, pos[n.id].P, hand, A.nodes.indexOf(n)), color: pos[n.id].P.ink }; });
  });
  const esvg = svgLayer(root, 1080, 1920);   // connectors above the zone backgrounds
  const outs = {}; A.edges.forEach(e => { (outs[e.from] = outs[e.from] || []).push(e); });
  A.edges.forEach((e, i) => {
    const a = pos[e.from], b = pos[e.to]; if (!a || !b) return; const sib = outs[e.from], si = sib.indexOf(e), off = (si - (sib.length - 1) / 2) * Math.min(28, a.w / (sib.length + 1));
    let pts;
    if (b.zone > a.zone || (b.zone === a.zone && b.y > a.y + a.h - 2)) { const x1 = a.x + a.w / 2 + off, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = (y1 + y2) / 2; pts = Math.abs(x1 - x2) < 4 ? [[x1, y1], [x2, y2]] : [[x1, y1], [x1, my], [x2, my], [x2, y2]]; }
    else if (b.zone < a.zone) { const x1 = a.x + a.w / 2 + off, y1 = a.y, x2 = b.x + b.w / 2, y2 = b.y + b.h, my = (y1 + y2) / 2; pts = Math.abs(x1 - x2) < 4 ? [[x1, y1], [x2, y2]] : [[x1, y1], [x1, my], [x2, my], [x2, y2]]; }
    else { const x1 = a.x + a.w / 2 + off * .5, x2 = b.x + b.w / 2, yb = Math.max(a.y + a.h, b.y + b.h) + 16; pts = [[x1, a.y + a.h], [x1, yb], [x2, yb], [x2, b.y + b.h]]; }   // same row: a U under the cards, so labels never sit on a card
    const color = hand ? '#1e1e1e' : a.P.ink, route = connector(esvg, pts, { color, hand, dashed: e.dashed, seed: 300 + i }); edges.push({ path: route, color });
    if (e.label) { const [lx, ly] = longest(pts); label(root, 'ar-e' + i, e.label, lx, ly, { hand, color }); }
  });
  if (!hand && legendH) { const lg = E(root, 'abs', `left:${B.x}px;top:${B.y + B.h - 34}px;width:${B.w}px;display:flex;gap:22px;justify-content:center;align-items:center`);
    const it = (t, dash, k) => { const s = E(lg, 'tx sans', `display:inline-flex;align-items:center;gap:8px;font-size:20px;font-weight:600;color:${C.mid};white-space:nowrap`); const sp = E(s, '', 'display:block', '', 'span'); sp.textContent = t; E(s, '', `width:34px;height:0;border-top:3px ${dash ? 'dashed' : 'solid'} ${C.mid};order:-1`); s.dataset.id = 'ar-lg' + k; s.dataset.text = t; };
    it('request / data flow', false, 0); if (A.edges.some(e => e.dashed)) it('async / optional', true, 1); }
  return { edges, icons: zic.filter(q => q && q.el) };
}

// —— flowchart with swimlanes ——
function flow(root, A, B) {
  const T = TONES(), L = A.lanes && A.lanes.length ? A.lanes : [{ title: '' }], nl = L.length, head = L[0].title ? 52 : 0, steps = A.steps, n = steps.length;
  const wt = L.map((_, k) => 2 + steps.filter(s => Math.min(nl - 1, s.lane ?? 0) === k).length), ws = wt.reduce((a, b) => a + b, 0), lwOf = L.map((_, k) => B.w * wt[k] / ws);   // busy lanes get more room
  for (let it = 0; it < 3; it++) { const lo = lwOf.map(v => v < 260), need = lo.reduce((a, l, k) => a + (l ? 260 - lwOf[k] : 0), 0), rest = lwOf.reduce((a, v, k) => a + (lo[k] ? 0 : v), 0); if (!need || !rest) break; lwOf.forEach((v, k) => { lwOf[k] = lo[k] ? 260 : v - need * v / rest; }); }
  const lx = k => B.x + lwOf.slice(0, k).reduce((a, b) => a + b, 0);
  L.forEach((l, k) => { const P = T[k % T.length], x = lx(k), lw = lwOf[k];
    const bg = card(root, { x: x + 4, y: B.y, w: lw - 8, h: B.h, r: 22, fill: k % 2 ? '#fff' : P.soft, bd: C.line, bw: 2, shadow: false, bg: true }); bg.style.opacity = '.9';
    if (l.title) tx(root, 'ar-l' + k, l.title, { x: x + 10, y: B.y + 8, w: lw - 20, h: 38, size: fitSize(l.title, { w: lw - 24, h: 34, max: 22, min: 20, weight: 800 }), weight: 800, color: P.ink, align: 'center' }); });
  const svg = svgLayer(root, 1080, 1920);   // after the lanes, so diamonds are drawn on top of the lane backgrounds
  const laneOf = st => Math.min(nl - 1, st.lane ?? 0), row = [];   // a decision in another lane sits beside the step it judges
  steps.forEach((st, i) => { row[i] = i === 0 ? 0 : row[i - 1] + (st.kind === 'decision' && laneOf(st) !== laneOf(steps[i - 1]) && steps[i - 1].kind !== 'decision' ? 0 : 1); });
  const nr = row[n - 1] + 1, icons = [], rh = (B.h - head - 16) / nr, pos = {}, ids = steps.map((s, i) => s.id ?? String(i)), gapMin = (A.edges || []).some(e => e && e.label) ? 54 : 26;   // a labelled edge needs room for its pill between two rows
  steps.forEach((s, i) => { const k = Math.min(nl - 1, s.lane ?? 0), shape = s.kind === 'decision' ? 'diamond' : (s.kind === 'start' || s.kind === 'end') ? 'pill' : 'rect';
    const lw = lwOf[k], bd = shape === 'diamond' && s.icon ? 48 : 0, w = Math.min(lw - 36 - bd, shape === 'diamond' ? Math.max(240, Math.min(300, lw * .8)) : Math.max(280, Math.min(420, lw * .8))), h = Math.min(rh - gapMin, shape === 'diamond' ? 112 : 84), x = lx(k) + (lw - w - bd) / 2, y = B.y + head + 8 + row[i] * rh + (rh - h) / 2;
    pos[ids[i]] = { x, y, w, h, i: row[i], rx: x + w + bd / 2, P: T[k % T.length] };   /* rx: right edge including the icon badge */ icons[i] = { el: node(root, svg, s, x, y, w, h, pos[ids[i]].P, false, i, shape), color: pos[ids[i]].P.ink }; });
  const E_ = A.edges && A.edges.length ? A.edges : steps.slice(1).map((s, i) => ({ from: ids[i], to: ids[i + 1] })), edges = [], esvg = svgLayer(root, 1080, 1920);
  E_.forEach((e, i) => { const a = pos[e.from], b = pos[e.to]; if (!a || !b) return; let pts;
    if (b.i === a.i) { const ltr = b.x > a.x, ya = a.y + a.h / 2, yb = b.y + b.h / 2; pts = [[ltr ? a.x + a.w : a.x, ya], [ltr ? b.x : b.x + b.w, yb]]; }   // side by side in one row
    else if (b.i > a.i) { const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = y1 + Math.min(26, (y2 - y1) / 2); pts = Math.abs(x1 - x2) < 4 ? [[x1, y1], [x2, y2]] : [[x1, y1], [x1, my], [x2, my], [x2, y2]]; }
    else {   // loop back on the right of every node it passes, so it never runs through the labels in a lane gutter
      const span = Object.values(pos).filter(q => q.i >= b.i && q.i <= a.i), xr = Math.min(B.x + B.w - 12, Math.max(...span.map(q => q.rx ?? q.x + q.w)) + 30); pts = [[a.rx ?? a.x + a.w, a.y + a.h / 2], [xr, a.y + a.h / 2], [xr, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2]]; }
    const color = b.i < a.i ? C.clayD : a.P.ink, route = connector(esvg, pts, { color, hand: false, dashed: b.i < a.i, seed: i }); edges.push({ path: route, color });
    if (e.label) { const [lx, ly] = longest(pts), hw = Math.min(70, e.label.length * 7 + 18) + 6; label(root, 'ar-e' + i, e.label, Math.max(B.x + hw, Math.min(B.x + B.w - hw, lx)), ly, { hand: false, color, maxW: 140 }); } });   // a pill never leaves the diagram
  return { edges, icons: icons.filter(q => q && q.el) };
}

// —— sequence diagram ——
function sequence(root, A, B) {
  const svg = svgLayer(root, 1080, 1920), T = TONES(), ac = A.actors, na = ac.length, cw = B.w / na, ah = 86, msgs = A.messages, nm = msgs.length, top = B.y + ah + 30, rh = (B.y + B.h - 20 - top) / nm, X = k => B.x + cw * (k + .5), edges = [];
  ac.forEach((a, k) => { const P = T[k % T.length], w = Math.min(cw - 18, 220), x = X(k) - w / 2;
    path(svg, `M${f1(X(k))} ${B.y + ah}V${f1(B.y + B.h - 6)}`, { stroke: C.lineD, w: 3, dash: '6 10' });
    const b = card(root, { x, y: B.y, w, h: ah, r: 22, fill: P.soft, bd: P.bd, bw: 3 });
    if (a.icon) E(b, 'abs', `left:${(w - 6 - 34) / 2}px;top:8px`, icon(a.icon, 34, P.ink, 2));
    tx(b, 'ar-a' + k, a.title, { x: 6, y: a.icon ? 44 : 4, w: w - 18, h: a.icon ? 34 : ah - 14, size: fitSize(a.title, { w: w - 22, h: 32, max: 24, min: 20, weight: 800 }), weight: 800, color: P.ink, align: 'center' }); });
  msgs.forEach((m, i) => { const y = top + i * rh + rh * .62, P = T[m.from % T.length], x1 = X(m.from), x2 = X(m.to), color = m.reply ? C.mid : P.bd; let pts;
    if (m.from === m.to) pts = [[x1 + 16, y - 22], [x1 + 70, y - 22], [x1 + 70, y + 6], [x1 + 16, y + 6]]; else pts = [[x1 + Math.sign(x2 - x1) * 18, y], [x2 - Math.sign(x2 - x1) * 10, y]];
    const route = connector(svg, pts, { color, hand: false, dashed: m.reply, seed: i }); edges.push({ path: route, color });
    const cx = m.from === m.to ? x1 + 40 : (x1 + x2) / 2, lw = m.from === m.to ? Math.min(cw * 1.2, 260) : Math.min(Math.abs(x2 - x1) - 20, 380), z = fitSize(m.text, { w: lw, h: 52, max: 22, min: 20, weight: 600, lh: 1.1 });
    tx(root, 'ar-m' + i, m.text, { x: cx - lw / 2 + (m.from === m.to ? 60 : 0), y: y - 60, w: lw, h: 52, size: z, weight: 600, wrap: true, lh: 1.1, color: m.reply ? C.mid : C.ink, align: 'center', css: `align-items:flex-end;text-shadow:0 0 4px ${C.bg},0 0 4px ${C.bg};` });
    E(root, 'abs', `left:${f1(x1 - 13)}px;top:${f1(y - 13)}px;width:26px;height:26px;border-radius:13px;background:${P.ink};color:#fff;font:700 14px Inter,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px ${C.bg}`, String(i + 1)); });   // step number on the sender's lifeline
  return { edges };
}

// —— panels: numbered stage cards, each input -> core -> outputs with a caption (2-6 panels, 1 column up to 3, else 2) ——
function panels(root, A, B) {
  const ps = A.panels, n = ps.length, cols = n <= 3 ? 1 : 2, rows = Math.ceil(n / cols), g = 18, hh = 54, capH = 60;
  const pw = (B.w - g * (cols - 1)) / cols, ph = Math.min(420, (B.h - g * (rows - 1)) / rows), y0 = B.y + (B.h - ph * rows - g * (rows - 1)) / 2;
  const at = k => ({ x: B.x + (k % cols) * (pw + g), y: y0 + Math.floor(k / cols) * (ph + g) });
  const bgs = ps.map((p, k) => { const { x, y } = at(k), b = card(root, { x, y, w: pw, h: ph, r: 20, fill: C.sand, bd: C.lineD, bw: 2, shadow: false, bg: true, css: 'overflow:hidden;transition:none;' });
    E(b, 'abs', `left:0;top:0;width:100%;height:${hh}px;background:${C.clayD}`);
    E(root, 'abs', `left:${f1(x + 12)}px;top:${f1(y + 11)}px;width:34px;height:32px;border-radius:8px;background:#fff;color:${C.clayD};font:700 18px Inter,sans-serif;display:flex;align-items:center;justify-content:center`, String(k + 1).padStart(2, '0'));
    tx(root, 'ar-p' + k, p.title, { x: x + 56, y: y + 6, w: pw - 112, h: hh - 12, size: fitSize(p.title, { w: pw - 116, h: hh - 14, max: 28, min: 20, weight: 600, font: 'serif' }), weight: 600, font: 'serif', color: '#fff', align: 'center' });
    return { el: b, x, y }; });
  const svg = svgLayer(root, 1080, 1920), icons = [], edges = [];   // wires above the panel backgrounds, below the tiles
  const wire = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2, d = `M${f1(x1)} ${f1(y1)}C${f1(mx)} ${f1(y1)} ${f1(mx)} ${f1(y2)} ${f1(x2)} ${f1(y2)}`;
    NS(svg, 'path', { d, fill: 'none', stroke: C.lineD, 'stroke-width': 3, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }); edges.push({ path: NS(svg, 'path', { d, fill: 'none', stroke: 'none' }), color: C.clay }); };
  ps.forEach((p, k) => { const { x, y } = bgs[k], top = y + hh, body = ph - hh - capH - 22, colW = Math.min(150, pw * .23), ts = Math.min(76, body * .44), cy = top + 8 + (body - 52) / 2;
    const tile = (it, cx, core, id) => { const t = card(root, { x: cx - ts / 2, y: cy - ts / 2, w: ts, h: ts, r: 16, fill: '#fff', bd: core ? C.clay : C.line, bw: 2.5, css: 'display:flex;align-items:center;justify-content:center;' });
      t.innerHTML = icon(it.icon, Math.round(ts * (it.icon.startsWith('logo:') ? .9 : .62)), C.ink, 1.9); icons.push({ el: t, color: C.clay, panel: k });
      tx(root, id, it.label, { x: cx - colW / 2, y: cy + ts / 2 + 4, w: colW, h: 50, size: fitSize(it.label, { w: colW - 4, h: 50, max: 21, min: 20, weight: 500, lh: 1.08 }), weight: 500, wrap: true, lh: 1.08, align: 'center', css: 'align-items:flex-start;' }); };
    const xa = x + 14 + colW / 2, xb = x + 14 + colW * 1.5, ox = x + 26 + colW * 2, ow = x + pw - 14 - ox, outs = p.outputs, oTop = top + 10, oBot = y + ph - capH - 22, oh = Math.min(56, (oBot - oTop - 10 * (outs.length - 1)) / outs.length), stackH = outs.length * oh + 10 * (outs.length - 1), oy0 = Math.max(oTop, Math.min(oBot - stackH, cy - stackH / 2));   // the stack stays between the header band and the caption
    tile(p.input, xa, false, 'ar-pi' + k); tile(p.core, xb, true, 'ar-pc' + k); wire(xa + ts / 2 + 4, cy, xb - ts / 2 - 4, cy);
    outs.forEach((o, j) => { const oy = oy0 + j * (oh + 10), b = card(root, { x: ox, y: oy, w: ow, h: oh, r: 12, fill: '#fff', bd: C.line, bw: 2, shadow: false });
      E(b, 'abs', `left:10px;top:${f1((oh - 32) / 2 - 2)}px;width:32px;height:32px`, icon(o.icon, 32, C.ink, 2));
      tx(root, `ar-po${k}-${j}`, o.label, { x: ox + 50, y: oy + 2, w: ow - 58, h: oh - 4, size: fitSize(o.label, { w: ow - 60, h: oh - 6, max: 21, min: 20, weight: 700, lh: 1.05 }), weight: 700, wrap: true, lh: 1.05 });
      wire(xb + ts / 2 + 4, cy, ox - 4, oy + oh / 2); });
    if (p.caption) tx(root, 'ar-pk' + k, p.caption, { x: x + 14, y: y + ph - capH - 12, w: pw - 28, h: capH, size: fitSize(p.caption, { w: pw - 56, h: capH - 8, max: 22, min: 20, weight: 500, font: 'serif', lh: 1.12 }), weight: 500, font: 'serif', italic: true, wrap: true, lh: 1.12, align: 'center',
      css: `background:#fff;border-radius:12px;box-shadow:0 0 0 2px ${C.line};padding:0 14px;box-sizing:border-box;` }); });
  return { edges, icons, panels: bgs.map(b => b.el) };
}

export function renderArch(root, A, B) {
  if (A.style === 'panels') return panels(root, A, B);
  if (A.style === 'flow') return flow(root, A, B);
  if (A.style === 'sequence') return sequence(root, A, B);
  return zones(root, A, B, A.style === 'sketch');
}
