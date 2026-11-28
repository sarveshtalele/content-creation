// Template "exploded": a stack pulled apart into floating 3D layers (CSS 3D plates), each labelled by a flat card on the right with a flowing-dot leader.
import { C, E, box, tx, enter, seg, eo, lerp } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, TOP, BOTTOM } from './gif_common.js';
import { plate, plateW, plateH, uniformSub } from './gif_3d.js';

export function buildExploded(stage, D) {
  const S = scene(stage, D), X = S.g.exploded, L = X.layers, n = L.length;
  header(S);
  const s = 300, PH = plateH(s), PW = plateW(s), TH = 16, cx = 250, RIB = 50, GAP = 40;
  const g = Math.min(158, (BOTTOM - TOP - 40 - PH - TH - GAP - RIB) / (n - 1));
  const total = (n - 1) * g + PH + TH + GAP + RIB, y0 = TOP + 20 + Math.max(0, Math.round((BOTTOM - TOP - 20 - total) / 2));
  const cy = i => y0 + PH / 2 + i * g, mid = cy((n - 1) / 2);
  const plates = L.map((l, i) => ({ i, p: plate(S.root, { cx, cy: mid, s, fill: PAL[l.group].soft, bd: PAL[l.group].bd, th: TH }) })).reverse();   // lowest layer first, so higher layers paint on top
  const cardX = 560, cardW = 496, cardH = Math.min(g - 14, 128), tipX = cx + PW / 2 + 6;
  const ribY = y0 + (n - 1) * g + PH + TH + GAP, rb = box(S.root, { x: cx - 220, y: ribY, w: 440, h: RIB, r: RIB / 2, fill: C.ink, bd: C.ink, shadow: false });
  tx(rb, 'rib', X.hub.title, { x: 0, y: 0, w: 436, h: RIB - 4, size: X.hub.title.length > 18 ? 22 : 25, weight: 600, color: '#fff', align: 'center' });
  S.A.push(u => plates.forEach(({ i, p }) => {            // the stack opens: all layers start together, then float apart
    const a = seg(u, .5 + i * .05, 1.0 + i * .05), k = eo(seg(u, 1.1 + (n - 1 - i) * .1, 2.1 + (n - 1 - i) * .1));
    p.set(lerp(mid - (i - (n - 1) / 2) * 6, cy(i), k), a);
  }));
  S.at(2.2); reveal(S, rb, 2.2, { d: .4, dy: 10 });
  const ss = uniformSub(L, { w: cardW - 28, h: cardH - 62 - 12 });
  L.forEach((l, i) => {
    const t = 2.6 + i * .75, y = cy(i);
    flow(S, `M${tipX} ${y} H${cardX - 3}`, PAL[l.group].bd, { t0: t, dur: .4, w: 4, head: 13 });
    const b = node(S, 'x' + i, { x: cardX, y: y - cardH / 2, w: cardW, h: cardH, title: l.title, sub: l.sub, ic: l.icon, group: l.group, tsize: 25, ssize: ss });
    reveal(S, b, t + .3, { dy: 12 });
  });
  footer(S);
  return finish(S);
}
