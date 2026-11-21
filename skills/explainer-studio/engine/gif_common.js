// Shared pieces of every LinkedIn GIF template: canvas (1080x1350 portrait), header, CTA footer, nodes, and `flow` arrows with travelling dots.
import { C, E, box, tx, fitSize, svgLayer, path, circ, draw, headAt, tri, icon, spark, enter, seg, eo, clamp, FLAGS } from './kit.js';
import { cta } from './cta.js';

export const W = 1080, H = 1350, FADE = .5, TOP = 150, BOTTOM = 1216;   // content lives between TOP and BOTTOM; CTA sits below
export const PAL = {
  blue: { bd: C.blue, ink: C.blueD, soft: C.blueSoft }, green: { bd: C.green, ink: C.greenD, soft: C.greenSoft },
  clay: { bd: C.clay, ink: C.clayD, soft: C.claySoft }, sand: { bd: C.lineD, ink: C.mid, soft: C.sand },
};
export function scene(stage, D) {
  const root = E(stage, 'scene'); root.style.display = 'block';
  const S = { D, g: D.gif, root, svg: svgLayer(root, W, H), A: [], T: 0 };
  S.at = t => { S.T = Math.max(S.T, t); return t; };
  return S;
}
// title + subtitle (+ Claude spark only when the source is about Claude)
export function header(S) {
  const g = S.g, tt = g.title, tsz = tt.length > 26 ? 52 : 60, tw = tt.length * tsz * .52;
  const sp = E(S.root, 'abs', `left:${Math.max(24, 540 - tw / 2 - 66)}px;top:20px;width:48px;height:48px`, spark(48, C.clay));
  const title = tx(S.root, 'g-title', tt, { x: 0, y: 12, w: W, h: 78, size: tsz, weight: 600, font: 'serif', align: 'center' });
  const sub = tx(S.root, 'g-sub', g.subtitle, { x: 20, y: 92, w: W - 40, h: 40, size: g.subtitle.length > 52 ? 25 : 29, weight: 500, color: C.clayD, align: 'center' });
  S.A.push(u => { enter(sp, u, .05, { sc: .5, dy: 0, pop: true, d: .6 }); enter(title, u, .1, { dy: 16, d: .5 }); enter(sub, u, .35, { dy: 12 }); });
}
// brand pill at the bottom, always visible
export function footer(S) {
  const bar = cta(S.root, 'gif-cta', S.D.brand, { x: 90, y: 1240, w: 900, h: 78, size: 26, bw: 4 });
  S.A.push(u => { bar.style.opacity = String(eo(seg(u, .25, .8))); });
}
export function finish(S, hold = 5.4) {
  const DUR = Math.round((S.T + (S.g.hold ?? hold)) * 10) / 10;
  return { DUR, render(u) { S.A.forEach(f => f(u)); S.root.style.opacity = String(Math.min(1, 1 - seg(u, DUR - FADE, DUR))); } };
}
export const layer = S => svgLayer(S.root, W, H);
export function reveal(S, el, t0, o = {}) { S.at(t0 + (o.d ?? .45)); S.A.push(u => enter(el, u, t0, { dy: 14, sc: .95, pop: true, d: .45, ...o })); }

// an arrow that draws itself, then carries dots along it forever (the "workflow is running" cue)
export function flow(S, d, color, { t0, dur = .55, w = 4.5, head = 15, svg, dot = 7 } = {}) {
  svg = svg || S.svg;   // pass a layer created after a filled band so the arrow shows above the band but below the nodes
  const p = path(svg, d, { stroke: color, w }), th = tri(svg, color), L = p.getTotalLength();
  p.style.opacity = '0';
  const n = Math.max(1, Math.round(L / 230)), speed = clamp(L * .6, 55, 240);
  const dots = Array.from({ length: n }, () => { const c = circ(svg, -50, -50, dot, { fill: color, stroke: C.bg, w: dot > 5 ? 2.5 : 2 }); c.style.opacity = '0'; return c; });
  S.at(t0 + dur);
  S.A.push(u => {
    const k = eo(seg(u, t0, t0 + dur)); draw(p, k); headAt(p, k, th, head);
    const run = u - (t0 + dur);
    dots.forEach((c, j) => {
      if (run < 0) { c.style.opacity = '0'; return; }
      const s = ((run * speed / L) + j / n) % 1, pt = p.getPointAtLength(Math.min(L - 9, s * L));
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.style.opacity = String(Math.min(1, run * 3));
    });
  });
}
// icon badge + title (+ optional small caps line)
export function badge(parent, ic, P, { x = 14, y = 12, s = 50 } = {}) {
  return E(parent, 'abs', `left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(ic, Math.round(s * .58), P.ink, 2));
}
// generic node: icon (optional), bold title, wrapped sub text. Returns the box.
export function node(S, id, { x, y, w, h, title, sub, ic, group = 'blue', tsize = 24, ssize = 19, center = false, r = 22, fill, fit = false }) {
  const P = PAL[group], b = box(S.root, { x, y, w, h, r, bd: P.bd, bw: 2.5, fill, css: `box-shadow:0 5px 0 ${C.line};` });
  let ty = 10;
  if (ic && !center) { badge(b, ic, P, { x: 12, y: 10, s: 46 }); tx(b, id + '-t', title, { x: 66, y: 8, w: w - 76, h: 50, size: tsize, weight: 700, wrap: true, lh: 1.12 }); ty = 62; }
  else if (center) { tx(b, id + '-t', title, { x: 10, y: 8, w: w - 20, h: sub ? Math.round(h * .42) : h - 16, size: tsize, weight: 700, wrap: true, lh: 1.12, align: 'center' }); ty = Math.round(h * .42) + 10; }
  else { tx(b, id + '-t', title, { x: 14, y: 8, w: w - 28, h: 42, size: tsize, weight: 700, wrap: true, lh: 1.12 }); ty = 54; }
  if (fit && sub) ssize = fitSize(sub, { w: w - 28, h: h - ty - 12, max: ssize + 4, min: 15, weight: 500, lh: 1.24 });
  if (sub) tx(b, id + '-s', sub, { x: 14, y: ty, w: w - 28, h: h - ty - 10, size: ssize, weight: 500, color: '#45443F', wrap: true, lh: 1.24, align: center ? 'center' : 'left', css: fit ? '' : 'align-items:flex-start;' });
  return b;
}

// a plain connector line that fades in with its card (no dots): trunks and buses of small diagrams
export function line(S, d, color, { t0, w = 3.2, svg } = {}) {
  const p = path(svg || S.svg, d, { stroke: color, w }); p.style.opacity = '0'; S.at(t0 + .4);
  S.A.push(u => { p.style.opacity = String(eo(seg(u, t0, t0 + .4))); });
}
