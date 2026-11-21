// Template "conveyor": an isometric belt that runs corner to corner. Boxes ride it through 3-4 gates, changing colour at each gate; a flat card for every gate sits alternately above and below the belt.
import { C, E, box, tx, enter, seg, eo, icon } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP, BOTTOM } from './gif_common.js';
import { mix, rayRect, uniformSub } from './gif_3d.js';
import { svgNS } from './kit.js';

const el = (g, tag, a) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); g.appendChild(e); return e; };
const poly = (g, pts, fill, stroke, sw = 3) => el(g, 'polygon', { points: pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' '), fill, stroke: stroke || 'none', 'stroke-width': sw, 'stroke-linejoin': 'round' });

export function buildConveyor(stage, D) {
  const S = scene(stage, D), V = S.g.conveyor, G = V.gates, n = G.length;
  header(S);
  const A0 = [90, 400], B0 = [990, 1040], dx = B0[0] - A0[0], dy = B0[1] - A0[1], O = [42, -21], TH = 20, POST = 124, CW = 316, CH = 128;
  const at = f => [A0[0] + dx * f, A0[1] + dy * f], fr = i => (i + .72) / (n + .44);
  // belt
  const belt = el(S.svg, 'g', {}); belt.style.opacity = '0';
  const sa = [A0[0] + O[0], A0[1] + O[1]], sb = [A0[0] - O[0], A0[1] - O[1]], ea = [B0[0] + O[0], B0[1] + O[1]], eb = [B0[0] - O[0], B0[1] - O[1]];
  poly(belt, [sb, eb, [eb[0], eb[1] + TH], [sb[0], sb[1] + TH]], mix(C.lineD, .3), C.lineD);
  poly(belt, [eb, ea, [ea[0], ea[1] + TH], [eb[0], eb[1] + TH]], mix(C.lineD, .1), C.lineD);
  poly(belt, [sa, ea, eb, sb], mix(C.ink, .82), C.lineD);
  const rollers = []; for (let i = 0; i < 34; i++) rollers.push(el(belt, 'line', { stroke: mix(C.ink, .65), 'stroke-width': 3, 'stroke-linecap': 'round' }));
  const L = Math.hypot(dx, dy), ROLL = 26;
  S.A.push(u => { belt.style.opacity = String(seg(u, .2, .7)); rollers.forEach((r, i) => { const s = ((i * ROLL + u * 34) % (34 * ROLL)) / (34 * ROLL), p = at(s); r.setAttribute('x1', p[0] + O[0] * .94); r.setAttribute('y1', p[1] + O[1] * .94); r.setAttribute('x2', p[0] - O[0] * .94); r.setAttribute('y2', p[1] - O[1] * .94); }); });
  S.at(.7);
  // boxes travelling along the belt, behind the gates' bridges
  const bx = [0, 1, 2].map(() => el(S.svg, 'g', {}));
  const cube = (g, p, c, s = 24) => { g.replaceChildren(); poly(g, [[p[0] - s, p[1] - s * .5], [p[0], p[1]], [p[0], p[1] + s * 1.1], [p[0] - s, p[1] + s * .6]], mix(c, .45), c, 2.5); poly(g, [[p[0], p[1]], [p[0] + s, p[1] - s * .5], [p[0] + s, p[1] + s * .6], [p[0], p[1] + s * 1.1]], c, c, 2.5); poly(g, [[p[0], p[1] - s], [p[0] + s, p[1] - s * .5], [p[0], p[1]], [p[0] - s, p[1] - s * .5]], mix(c, .78), c, 2.5); };
  const colors = G.map(g => PAL[g.group].bd), start = mix(C.ink, .55);
  S.A.push(u => bx.forEach((g, j) => { const f = ((u * .085 + j / 3) % 1), p = at(.04 + f * .92), ps = G.filter((_, i) => f * .92 + .04 > fr(i)).length; cube(g, [p[0], p[1] - 20], ps ? colors[ps - 1] : start); g.style.opacity = String(seg(u, .9, 1.3) * Math.min(1, f * 12) * Math.min(1, (1 - f) * 12)); }));
  // gates: two posts, a bridge, an icon tile; cards alternate above-right and below-left
  const ls = layer(S);
  let t = 1.1;
  const ss = uniformSub(G, { w: CW - 28, h: CH - 62 - 10, max: 20, min: 15 });
  const SL = dy / dx, backY = x => A0[1] + SL * (x - O[0] - A0[0]) + O[1], frontY = x => A0[1] + SL * (x + O[0] - A0[0]) - O[1] + TH;
  G.forEach((gt, i) => {
    const Pl = PAL[gt.group], p = at(fr(i)), up = i % 2 === 0, g = el(S.svg, 'g', {}); g.style.opacity = '0';
    const bt = [p[0] + O[0] + 4, p[1] + O[1] + 6], ft = [p[0] - O[0] - 4, p[1] - O[1] + 10], mid = [p[0], (bt[1] + ft[1]) / 2 - POST];     // back foot, front foot, middle of the top bar
    for (const f of [bt, ft]) el(g, 'line', { x1: f[0], y1: f[1], x2: f[0], y2: f[1] - POST, stroke: Pl.bd, 'stroke-width': 12, 'stroke-linecap': 'round' });
    el(g, 'line', { x1: bt[0], y1: bt[1] - POST, x2: ft[0], y2: ft[1] - POST, stroke: Pl.bd, 'stroke-width': 14, 'stroke-linecap': 'round' });
    const tile = E(S.root, 'abs', `left:${mid[0] - 26}px;top:${mid[1] - 26}px;width:52px;height:52px;border-radius:50%;background:#fff;border:4px solid ${Pl.bd};display:flex;align-items:center;justify-content:center;opacity:0;box-sizing:border-box`, icon(gt.icon, 28, Pl.ink, 2.1));
    const cx0 = Math.min(1056 - CW, Math.max(24, p[0] - CW / 2)); let cy0, y1, y2;
    if (up) { const bottom = Math.min(mid[1] - 26 - 62, backY(cx0) - 16); cy0 = bottom - CH; y1 = mid[1] - 26 - 6; y2 = bottom + 4; }
    else { const top = Math.max(frontY(p[0]) + 34, frontY(cx0 + CW) + 16); cy0 = top; y1 = frontY(p[0]) + 8; y2 = top - 4; }
    reveal(S, g, t, { sc: 1, dy: 18, d: .5 }); reveal(S, tile, t + .25, { d: .35 });
    flow(S, `M${p[0]} ${y1} L${p[0]} ${y2}`, Pl.bd, { t0: t + .55, dur: .45, w: 4, head: 13, svg: ls });
    const c = node(S, 'c' + i, { x: cx0, y: cy0, w: CW, h: CH, title: gt.title, sub: gt.sub, ic: gt.icon, group: gt.group, tsize: 24, ssize: ss });
    reveal(S, c, t + .85, { dy: 12 }); t += 1.0;
  });
  footer(S);
  return finish(S);
}
