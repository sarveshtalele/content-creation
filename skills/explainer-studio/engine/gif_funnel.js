// Template "funnel": a real 3D funnel. Each stage is a tapering drum (ellipse lids, shaded sides); the drum widths follow each stage's share of the first stage.
// Glowing beads fall through from the opening; at every stage some peel away and drop out in proportion to the loss, so the narrowing is felt as motion.
// Text stays in flat cards on the right, tied to the drum by a leader line (the 3D is decoration, as in the other 3D templates).
import { C, E, box, tx, enter, seg, eo, icon, fitSize, measure, svgNS, circ } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, TOP, BOTTOM } from './gif_common.js';
import { mix } from './gif_3d.js';

const el = (p, n, a) => { const e = document.createElementNS(svgNS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
const shade = (hex, f) => { const v = parseInt(hex.slice(1), 16), c = i => Math.max(0, Math.min(255, Math.round(((v >> i) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; };
const GAP = 12;
const hash = (a, b) => { let h = (a * 73856093) ^ (b * 19349663); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) % 1000 / 1000; };

export function buildFunnel(stage, D) {
  const S = scene(stage, D), K = S.g.funnel, R = K.stages, n = R.length;
  header(S);
  const CX = 350, RMAX = 292, K_RY = .3;
  let rt = []; R.forEach((r, i) => rt.push(Math.max(78, Math.min(i ? rt[i - 1] : RMAX, Math.round(RMAX * Math.max(0, Math.min(100, r.pct)) / 100)))));
  const rb = rt.map((_, i) => i < n - 1 ? rt[i + 1] : Math.round(rt[i] * .6));
  const Y0 = TOP + 38 + Math.round(RMAX * K_RY), YEND = BOTTOM - 70 - Math.round(rb[n - 1] * K_RY), SH = Math.floor((YEND - Y0) / n);
  const defs = el(S.svg, 'defs', {}), gl = el(S.svg, 'g', {});
  el(S.svg, 'ellipse', { cx: CX + 14, cy: YEND + SH * .02 + 40, rx: rb[n - 1] + 70, ry: 26, fill: '#000', opacity: '.07' });   // soft floor shadow under the spout
  const stages = [];
  for (let i = n - 1; i >= 0; i--) {   // bottom to top: an upper drum's front wall hides the lid of the one below
    const P = PAL[R[i].group], cy = Y0 + i * SH, a = rt[i], b = rb[i] + (rt[i] - rb[i]) * GAP / SH, ay = Math.round(a * K_RY), by = Math.round(b * K_RY), id = 'fg' + i, SB = SH - GAP;
    const gr = el(defs, 'linearGradient', { id, x1: '0', x2: '1', y1: '0', y2: '0' });
    [[0, shade(P.bd, .74)], [.16, mix(P.bd, .18)], [.3, mix(P.bd, .5)], [.42, mix(P.bd, .12)], [.7, P.bd], [1, shade(P.bd, .6)]].forEach(([o, c]) => el(gr, 'stop', { offset: o, 'stop-color': c }));
    const g = el(gl, 'g', {}); g.style.opacity = '0';
    el(g, 'path', { d: `M${CX - a} ${cy} L${CX - b} ${cy + SB} A${b} ${by} 0 0 0 ${CX + b} ${cy + SB} L${CX + a} ${cy} A${a} ${ay} 0 0 1 ${CX - a} ${cy} Z`, fill: `url(#${id})`, stroke: shade(P.bd, .72), 'stroke-width': 3, 'stroke-linejoin': 'round' });
    if (i) el(g, 'ellipse', { cx: CX, cy, rx: a, ry: ay, fill: mix(P.bd, .55), stroke: shade(P.bd, .72), 'stroke-width': 3 });
    const num = E(S.root, 'abs', `left:${CX - 70}px;top:${cy + SB / 2 + ay * .3 - 28}px;width:140px;height:56px;display:flex;align-items:center;justify-content:center;font:700 ${SB > 150 ? 46 : 38}px Lora,serif;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.25);opacity:0`, String(i + 1).padStart(2, '0'));
    if (i === 0) {   // the opening: a dark inner ellipse with a bright rim
      el(g, 'ellipse', { cx: CX, cy, rx: a, ry: ay, fill: '#fff', stroke: shade(P.bd, .72), 'stroke-width': 3 });
      el(g, 'ellipse', { cx: CX, cy: cy + 5, rx: a - 16, ry: ay - 7, fill: shade(P.bd, .45) });
    }
    el(g, 'path', { d: `M${CX - b + 10} ${cy + SB + by * .45} A${b - 10} ${by - 3} 0 0 0 ${CX + b - 10} ${cy + SB + by * .45}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: '.5', 'stroke-linecap': 'round' });   // rim light on the front lip
    stages[i] = { g, cy, a, b, P, num };
  }
  // right-hand cards
  const CW = 352, CXR = 1080 - 24 - CW, CH = Math.min(SH - 10, 176), pad = 12;
  const ss = Math.min(...R.map(r => fitSize(r.sub, { w: CW - 28, h: CH - 112, max: 19, min: 15, weight: 500, lh: 1.2 })));
  let t = .6; const marks = [];
  R.forEach((r, i) => {
    const s = stages[i], P = s.P, my = s.cy + Math.round(SH * .5), cy0 = my - Math.round(CH / 2);
    const ex = CX + (s.a + s.b) / 2 - 2;   // leader starts on the right wall of the drum
    const ld = el(S.svg, 'path', { d: `M${ex} ${my} L${CXR - 10} ${my}`, fill: 'none', stroke: P.bd, 'stroke-width': 3, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }); ld.style.opacity = '0';
    const dot = circ(S.svg, ex, my, 7, { fill: '#fff', stroke: P.bd, w: 3.5 }); dot.style.opacity = '0';
    const card = box(S.root, { x: CXR, y: cy0, w: CW, h: CH, r: 22, bd: P.bd, bw: 3, fill: '#fff', css: `box-shadow:0 5px 0 ${C.line};` }); S.B.push(card);
    E(card, 'abs', `left:12px;top:12px;width:44px;height:44px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(r.icon, 26, P.ink, 2.1));
    tx(card, 'f' + i + '-v', r.value, { x: 66, y: 6, w: CW - 80, h: 70, size: r.value.length > 5 ? 42 : 52, weight: 700, font: 'serif', color: P.ink, align: 'right' });
    tx(card, 'f' + i + '-t', r.title, { x: 14, y: 74, w: CW - 28, h: 30, size: fitSize(r.title, { w: CW - 28, h: 30, max: 25, min: 17, weight: 700, lh: 1.08 }), weight: 700, lh: 1.08 });
    tx(card, 'f' + i + '-s', r.sub, { x: 14, y: 106, w: CW - 28, h: CH - 112, size: ss, weight: 500, color: '#45443F', wrap: true, lh: 1.2, css: 'align-items:flex-start;' });
    S.at(t + 1.1);
    const tt = t; S.A.push(u => {
      const k = eo(seg(u, tt, tt + .55)); stages[i].g.style.opacity = String(seg(u, tt, tt + .2)); stages[i].num.style.opacity = String(seg(u, tt + .3, tt + .6)); stages[i].g.style.transform = `translateY(${(-34 * (1 - k)).toFixed(1)}px)`;
      ld.style.opacity = String(seg(u, tt + .5, tt + .8)); dot.style.opacity = String(seg(u, tt + .5, tt + .8));
    });
    reveal(S, card, t + .4, { dx: 30, dy: 0, d: .5, sc: 1, pop: false }); t += .85;
  });
  // beads: each has a fate (the stage after which it drops out), decided from the shares so the thinning matches the data
  const NB = 26, beads = [], cum = R.map(r => Math.max(0, Math.min(100, r.pct))), startT = t - .3;
  for (let j = 0; j < NB; j++) {
    const f = hash(j, 7) * 100; let fate = n - 1; for (let i = 0; i < n; i++) if (f > cum[i]) { fate = Math.max(0, i - 1); break; }
    beads.push({ c: circ(S.svg, -50, -50, 9, { fill: '#fffbe6', stroke: C.clay, w: 3 }), fate, ph: j / NB, sx: (hash(j, 3) - .5) * .8, dir: hash(j, 11) > .5 ? 1 : -1 });
  }
  const yTop = Y0 - 20, yBot = YEND + 28, CYCLE = 3.6;
  S.A.push(u => {
    const run = u - startT;
    beads.forEach(b => {
      if (run < 0) { b.c.style.opacity = '0'; return; }
      const q = ((run / CYCLE) + b.ph) % 1, y = yTop + q * (yBot - yTop), si = Math.min(n - 1, Math.max(0, Math.floor((y - Y0) / SH)));
      const wallW = y < Y0 ? rt[0] : (() => { const k = Math.min(n - 1, Math.floor((y - Y0) / SH)), f = ((y - Y0) / SH) - k; return rt[k] + (rb[k] - rt[k]) * f; })();
      const yFate = Y0 + (b.fate + 1) * SH;   // below this line the bead has been filtered out
      let x = CX + b.sx * (wallW - 26), op = Math.min(1, run * 3) * seg(q, 0, .04);
      if (y > yFate) { const d = Math.min(1, (y - yFate) / 150); x += b.dir * (wallW * .55 + d * 70 * 1.0); op *= 1 - d; }
      else if (y < Y0) { x = CX + b.sx * 40; }
      b.c.setAttribute('cx', x.toFixed(1)); b.c.setAttribute('cy', (y + (y < Y0 ? 0 : 0)).toFixed(1)); b.c.style.opacity = String(op);
    });
  });
  footer(S);
  return finish(S);
}
