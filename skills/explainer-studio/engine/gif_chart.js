// Template "chart": any of the 21 chart slides (engine/charts.js) as an animated GIF. The chart is drawn once in the GIF frame, then revealed:
// every block fades and rises in reading order (staggering), stroked lines draw themselves (path tracing), filled shapes fade in, and the
// finished chart holds before the loop. gif.chart = { type, ...the same fields as the carousel slide } (validated by the same limits).
import { C, E, enter, draw, seg, eo, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, TOP, BOTTOM } from './gif_common.js';
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
  const t0 = .7, step = Math.min(.09, 3.2 / Math.max(1, all.length));
  all.forEach((it, i) => {
    const t = t0 + i * step;
    if (it.k === 'div') S.A.push(u => enter(it.e, u, t, { dy: 18, sc: .96, d: .45 }));
    else if (it.k === 'line') { it.e.style.opacity = '0'; S.A.push(u => draw(it.e, eo(seg(u, t, t + .6)))); }
    else { it.e.style.opacity = '0'; S.A.push(u => { it.e.style.opacity = String(eo(seg(u, t, t + .4))); }); }
  });
  S.at(t0 + all.length * step + .8);
  footer(S);
  return finish(S);
}
