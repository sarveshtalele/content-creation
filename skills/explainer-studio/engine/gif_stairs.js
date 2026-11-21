// Template "stairs": isometric blocks that climb left to right (levels, stages, maturity). Flat label cards sit on each block; one dark arrow with flowing dots climbs the steps.
import { C, E, box, tx, enter, seg, eo, iconEl } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP, BOTTOM } from './gif_common.js';
import { iso, mix, uniformSub } from './gif_3d.js';
import { icon } from './kit.js';

export function buildStairs(stage, D) {
  const S = scene(stage, D), T = S.g.stairs, N = T.steps, n = N.length;
  header(S);
  const pitch = Math.floor((1080 - 48) / n), HW = Math.min(118, Math.floor(pitch / 2)), HH = Math.round(HW / 2), CW = Math.min(300, pitch - 14), CH = pitch < 230 ? 176 : 150;
  const BASE = 1196 - HH, h0 = 100, dh = [0, 0, 260, 200, 150][n - 1] || 150, x = i => 540 + (i - (n - 1) / 2) * pitch, top = i => BASE - (h0 + i * dh);   // top = centre of block i's top face
  const ss = uniformSub(N, { w: CW - 36, h: CH - Math.round(CH * .42) - 22, max: 19, min: 15 }); let t = .6; const pts = [];
  N.forEach((st, i) => {
    const P = PAL[st.group], cx = x(i), cy = top(i), blk = iso(S.svg, { cx, cy, hw: HW, hh: HH, h: h0 + i * dh, color: P.bd });
    const ic = E(S.root, 'abs', `left:${cx - 20}px;top:${cy - 20}px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;opacity:0`, icon(st.icon, 34, P.ink, 2.1));
    const card = node(S, 's' + i, { x: cx - CW / 2, y: cy - HH - 12 - CH, w: CW, h: CH, title: st.title, sub: st.sub, group: st.group, tsize: 23, ssize: ss, center: true });
    reveal(S, blk, t, { sc: 1, dy: 26, d: .55 }); S.A.push(u => { ic.style.opacity = String(seg(u, t + .35, t + .7)); }); reveal(S, card, t + .45, { dy: 12 }); pts.push([cx, cy]); t += .8;
  });
  const ls = layer(S); t += .1;
  for (let i = 0; i < n - 1; i++) {                           // the climb: one arrow per step, drawn above the blocks and below the cards
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    flow(S, `M${x1 + 34} ${y1 - 4} C${x1 + 80} ${y1 - 26} ${x2 - 80} ${y2 - 26} ${x2 - 34} ${y2 - 4}`, C.ink, { t0: t + i * .55, dur: .5, w: 4.5, head: 14, svg: ls });
  }
  footer(S);
  return finish(S);
}
