// Template "isoflow": a flow across isometric slabs. Each stop is a 3D slab with a flat label card standing above it; flowing dots travel slab to slab.
import { C, E, box, tx, enter, seg, eo } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP, BOTTOM } from './gif_common.js';
import { iso, uniformSub } from './gif_3d.js';

export function buildIsoflow(stage, D) {
  const S = scene(stage, D), F = S.g.isoflow, N = F.stops, n = N.length;
  header(S);
  const HW = 130, HH = 65, SLAB = 22, CH = 132, CW = 340, XL = 330, XR = 750, UP = HH + 8 + CH;           // a stop = card above, slab below
  const lo = TOP + 14 + UP, hi = BOTTOM - HH - SLAB - 4, dy = Math.min(250, n > 1 ? (hi - lo) / (n - 1) : 0), span = (n - 1) * dy, py0 = lo + Math.max(0, Math.round((hi - lo - span) / 2));
  const px = i => i % 2 ? XR : XL, py = i => py0 + i * dy;
  const ss = uniformSub(N, { w: CW - 28, h: CH - 62 - 10, max: 21 }); let t = .7;
  N.forEach((st, i) => {
    const P = PAL[st.group], x = px(i), y = py(i);
    const slab = iso(S.svg, { cx: x, cy: y, hw: HW, hh: HH, h: SLAB, color: P.bd }), ls = layer(S);
    if (i) {                                                                    // arrow from the previous slab's facing tip to this slab's facing tip
      const a = px(i - 1), b = x, d = b > a ? 1 : -1, x1 = a + d * HW, x2 = b - d * HW, y1 = py(i - 1), y2 = y;
      flow(S, `M${x1 + d * 4} ${y1 + 2} C${x1 + d * 90} ${y1 + 40} ${x2 - d * 90} ${y2 - 20} ${x2 - d * 4} ${y2}`, C.ink, { t0: t, dur: .6, w: 4.5, head: 14, svg: ls }); t += .45;
    }
    const card = node(S, 'f' + i, { x: x - CW / 2, y: y - HH - 8 - CH, w: CW, h: CH, title: st.title, sub: st.sub, ic: st.icon, group: st.group, tsize: 25, ssize: ss });
    reveal(S, slab, t - (i ? .4 : 0), { sc: 1, dy: 14, d: .45 }); reveal(S, card, t + .1, { dy: 12 }); t += .75;
  });
  footer(S);
  return finish(S);
}
