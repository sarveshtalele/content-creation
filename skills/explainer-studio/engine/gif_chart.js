// Template "chart": any of the 21 chart slides (engine/charts.js) as an animated GIF. The chart is drawn once in the GIF frame, then revealed:
// every block fades and rises in reading order (staggering), stroked lines draw themselves (path tracing), filled shapes fade in, and the
// finished chart loops: since v3.1 the whole chart is visible from frame 0 and only the flow moves. gif.chart = { type, ...the same fields as the carousel slide } (validated by the same limits).
import { C, E, enter, draw, seg, eo, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, per, TOP, BOTTOM } from './gif_common.js';
import { charts } from './charts.js';

const GROUPS = ['blue', 'clay', 'green'];
export function buildChart(stage, D) {
  const S = scene(stage, D), g = S.g, spec = { ...g.chart, title: g.title };
  header(S);
  const box = E(S.root, 'abs', 'left:0;top:0;width:1080px;height:1350px');
  const K = { heading: () => TOP - 30, grp: i => PAL[GROUPS[i % 3]], H_: (t, size, w, weight = 500, lh = 1.25) => Math.ceil(measure(t, { size, weight, w, lh }).h), X0: 48, XW: 984, W: 1080, BODY1: BOTTOM - 14 };
  const R = charts(K); R[spec.type].call(R, box, spec);
  // reveal order: top-to-bottom, then left-to-right
  const parts = [...box.children].filter(e => !(e instanceof SVGSVGElement));
  const svgs = [...box.querySelectorAll('svg')].filter(s => s.parentElement === box);
  const marks = svgs.flatMap(s => [...s.querySelectorAll('path,circle,ellipse')]);
  const pos = e => { const r = e.getBoundingClientRect(); return r.top * 2 + r.left * .4; };
  const all = [...parts.map(e => ({ e, k: 'div', p: pos(e) })), ...marks.map(e => ({ e, k: e.tagName === 'path' && e.getAttribute('fill') === 'none' && !e.getAttribute('stroke-dasharray') ? 'line' : 'shape', p: pos(e) }))].sort((a, b) => a.p - b.p);
  // flow-only motion on the finished chart: marching dashes on lines, a travelling brightness wave on ribbons and wedges, pulses on dots
  const P1 = per(S, 1.5), P2 = per(S, 3);
  all.forEach((it, i) => {
    const e = it.e, ph = i / Math.max(1, all.length);
    if (it.k === 'line') { const L = e.getTotalLength ? e.getTotalLength() : 0; if (L < 40) return; const o = e.cloneNode(); o.setAttribute('stroke', '#fff'); o.setAttribute('stroke-width', Math.max(2, (+e.getAttribute('stroke-width') || 3) * .45)); o.setAttribute('stroke-dasharray', '6 22'); o.setAttribute('opacity', '.75'); e.after(o);
      S.A.push(u => o.setAttribute('stroke-dashoffset', String((-(u / P1) * 28) % 28))); }
    else if (it.k === 'shape' && e.tagName === 'path') { const base = +(e.getAttribute('fill-opacity') || 1); if (base >= 1) return;
      S.A.push(u => { const w = .5 + .5 * Math.sin(2 * Math.PI * (u / P2 - ph)); e.setAttribute('fill-opacity', (base + .2 * w).toFixed(3)); }); }
    else if (e.tagName === 'circle') { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; S.A.push(u => { e.style.transform = `scale(${(1 + .12 * Math.max(0, Math.sin(2 * Math.PI * (u / P2 - ph)))).toFixed(3)})`; }); }
  });
  footer(S);
  return finish(S);
}
