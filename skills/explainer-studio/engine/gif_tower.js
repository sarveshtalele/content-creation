// Template "tower": an isometric cutaway building. Every floor is a glass room with a small illustrated scene; flat callout cards on both sides connect to their floor with flowing-dot leaders.
import { C, E, box, tx, enter, seg, eo, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP, BOTTOM } from './gif_common.js';
import { mix, rayRect, uniformSub } from './gif_3d.js';
import { drawScene } from './gif_scenes.js';
import { svgNS } from './kit.js';

const poly = (g, pts, fill, stroke, sw = 3, op = 1) => { const p = document.createElementNS(svgNS, 'polygon'); p.setAttribute('points', pts.map(q => q.join(',')).join(' ')); p.setAttribute('fill', fill); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', sw); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('opacity', op); g.appendChild(p); return p; };
const ln = (g, x1, y1, x2, y2, c, w = 2.5) => { const l = document.createElementNS(svgNS, 'line'); for (const [k, v] of Object.entries({ x1, y1, x2, y2, stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' })) l.setAttribute(k, v); g.appendChild(l); };
const circ = (g, x, y, r, f, s) => { const c = document.createElementNS(svgNS, 'circle'); for (const [k, v] of Object.entries({ cx: x, cy: y, r, fill: f, stroke: s, 'stroke-width': 3 })) c.setAttribute(k, v); g.appendChild(c); };

export function buildTower(stage, D) {
  const S = scene(stage, D), T = S.g.tower, F = T.floors, n = F.length;
  header(S);
  const CX = 540, HW = 170, HH = 42, TH = 14, CW = 272, RIB = 44;
  const P = Math.min(176, Math.floor((BOTTOM - TOP - 14 - 254) / n)), WALL = P - TH;                  // pitch between floors; glass height
  const total = RIB + 12 + n * P + 2 * HH + 28 + 62 + 18, y0 = TOP + 10 + Math.max(0, Math.round((BOTTOM - TOP - 10 - total) / 2));
  const fy0 = y0 + RIB + 12 + WALL + HH, fy = k => fy0 + k * P, by = fy(n - 1) + HH + TH + 28;
  // ground
  const gnd = document.createElementNS(svgNS, 'g'); gnd.style.opacity = '0'; S.svg.appendChild(gnd);
  poly(gnd, [[CX - 250, by], [CX, by + 62], [CX, by + 80], [CX - 250, by + 18]], mix(C.lineD, .4), C.lineD); poly(gnd, [[CX, by + 62], [CX + 250, by], [CX + 250, by + 18], [CX, by + 80]], mix(C.lineD, .15), C.lineD); poly(gnd, [[CX, by - 62], [CX + 250, by], [CX, by + 62], [CX - 250, by]], mix(C.green, .86), mix(C.green, .2));
  [[-196, 6], [-150, 30], [150, 30], [196, 6]].forEach(([dx, dy]) => { ln(gnd, CX + dx, by + dy, CX + dx, by + dy - 16, '#8A6B4F', 5); circ(gnd, CX + dx, by + dy - 28, 15, mix(C.green, .1), C.greenD); });
  reveal(S, gnd, .3, { sc: 1, dy: 20, d: .6 });
  // floors, lowest first so that higher floors paint on top
  const floors = F.map((f, k) => {
    const Pl = PAL[f.group], g = document.createElementNS(svgNS, 'g'), y = fy(k); g.style.opacity = '0';
    poly(g, [[CX - HW, y], [CX, y - HH], [CX, y - HH - WALL], [CX - HW, y - WALL]], mix(Pl.bd, .86), Pl.bd, 2.5, .8);
    poly(g, [[CX, y - HH], [CX + HW, y], [CX + HW, y - WALL], [CX, y - HH - WALL]], mix(Pl.bd, .78), Pl.bd, 2.5, .8);
    poly(g, [[CX - HW, y], [CX, y + HH], [CX, y + HH + TH], [CX - HW, y + TH]], mix(Pl.bd, .45), Pl.bd);
    poly(g, [[CX, y + HH], [CX + HW, y], [CX + HW, y + TH], [CX, y + HH + TH]], mix(Pl.bd, .1), Pl.bd);
    poly(g, [[CX, y - HH], [CX + HW, y], [CX, y + HH], [CX - HW, y]], '#FFFFFF', Pl.bd);
    ln(g, CX - HW, y, CX - HW, y - WALL, Pl.bd); ln(g, CX + HW, y, CX + HW, y - WALL, Pl.bd); ln(g, CX, y - HH, CX, y - HH - WALL, Pl.bd);
    const sc = drawScene(g, f.scene, CX, y + 12, Pl);
    return { g, sc, k, y };
  });
  [...floors].reverse().forEach(f => S.svg.appendChild(f.g));
  // rooftop sign
  const rb = box(S.root, { x: CX - 190, y: y0, w: 380, h: RIB, r: RIB / 2, fill: C.ink, bd: C.ink, shadow: false });
  tx(rb, 'rib', T.hub.title, { x: 0, y: 0, w: 376, h: RIB - 4, size: T.hub.title.length > 22 ? 21 : 24, weight: 600, color: '#fff', align: 'center' });
  const ch = Math.min(2 * P - 28, 136), ss = uniformSub(F, { w: CW - 28, h: ch - 62 - 10, max: 20, min: 15 }), ls = layer(S), chOf = f => Math.min(ch, 62 + Math.ceil(measure(f.sub, { size: ss, weight: 500, w: CW - 28, lh: 1.24 }).h) + 14);
  let t = .9;
  floors.forEach(({ g, sc, k, y }) => {
    const f = F[k], left = k % 2 === 0, Pl = PAL[f.group], tipX = CX + (left ? -HW : HW), cardX = left ? 24 : 1056 - CW;
    reveal(S, g, t, { sc: 1, dy: 30, d: .6 }); S.A.push(u => sc.set(seg(u, t + .4, t + 1.3)));
    const bd = box(S.root, { x: tipX - 21, y: y - 19, w: 42, h: 42, r: 21, fill: Pl.bd, bd: '#fff', bw: 3, shadow: false });
    tx(bd, 'n' + k, String(k + 1), { x: 0, y: 0, w: 42, h: 40, size: 20, weight: 700, color: '#fff', align: 'center' }); reveal(S, bd, t + .5, { d: .3 });
    const cy = y - 6, x1 = tipX + (left ? -26 : 26), x2 = left ? cardX + CW + 3 : cardX - 3;
    flow(S, `M${x1} ${y + 1} L${x2} ${y + 1}`, Pl.bd, { t0: t + .8, dur: .45, w: 4, head: 13, svg: ls });
    const c = node(S, 't' + k, { x: cardX, y: cy - chOf(f) / 2, w: CW, h: chOf(f), title: f.title, sub: f.sub, ic: f.icon, group: f.group, tsize: 24, ssize: ss });
    reveal(S, c, t + 1.0, { dy: 12 }); t += 1.15;
  });
  reveal(S, rb, 1.0 + (n - 1) * 1.15 + 1.4, { d: .4, dy: 10 });
  footer(S);
  return finish(S);
}
