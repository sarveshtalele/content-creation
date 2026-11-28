// Template "lanes": layers of an ecosystem/stack. A hub card on top feeds a trunk; each lane is a labelled band whose items are chained by flowing arrows.
import { C, E, box, tx, spark, enter, seg, eo } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, badge, layer, W, TOP, BOTTOM } from './gif_common.js';

export function buildLanes(stage, D) {
  const S = scene(stage, D), g = S.g, L = g.lanes, nl = L.lanes.length;
  header(S);
  const hubH = 100, hubY = TOP + 6, avail = BOTTOM - (hubY + hubH + 40);
  const laneH = Math.min(176, Math.floor((avail - (nl - 1) * 18) / nl)), gapL = Math.min(36, Math.floor((avail - nl * laneH) / Math.max(1, nl - 1))), used = nl * laneH + (nl - 1) * gapL;
  const y0 = hubY + hubH + 40 + Math.max(0, Math.round((avail - used) / 2)), TX = 52;
  const hub = box(S.root, { x: 300, y: hubY, w: 480, h: hubH, r: 30, bd: C.clay, bw: 3.5, css: `box-shadow:0 6px 0 ${C.line};` });
  badge(hub, L.hub.icon || 'layers', PAL.clay, { x: 20, y: 22, s: 56 });
  tx(hub, 'hub-t', L.hub.title, { x: 90, y: 10, w: 380 - 12, h: L.hub.sub ? 48 : 80, size: 32, weight: 600, font: 'serif' });
  if (L.hub.sub) tx(hub, 'hub-s', L.hub.sub, { x: 90, y: 56, w: 368, h: 36, size: 19, weight: 500, color: C.mid });
  reveal(S, hub, .6, { sc: .9, d: .6 });
  const lastCy = y0 + (nl - 1) * (laneH + gapL) + laneH / 2;
  flow(S, `M300 ${hubY + hubH / 2} H${TX} V${lastCy}`, C.clay, { t0: 1.2, dur: 1.0, w: 4.5, head: 13 });
  let t = 2.4;
  L.lanes.forEach((ln, i) => {
    const P = PAL[ln.group], top = y0 + i * (laneH + gapL), cy = top + laneH / 2, n = ln.items.length;
    const band = box(S.root, { x: 24, y: top, w: 1032, h: laneH, r: 28, fill: P.soft, bd: P.bd, bw: 2, shadow: false, bg: true, css: 'border-style:dashed;opacity:.9' });
    reveal(S, band, t - .2, { dy: 8, sc: .98, d: .4 }); const ls = layer(S);
    flow(S, `M${TX} ${cy} H${74}`, P.bd, { t0: t - .2, dur: .3, w: 4, head: 11, svg: ls });
    const chipW = 188, chipH = laneH - 28, chip = box(S.root, { x: 80, y: top + 14, w: chipW, h: chipH, r: 22, fill: '#fff', bd: P.bd, bw: 3, css: `box-shadow:0 4px 0 ${C.line};` });
    badge(chip, ln.icon, P, { x: (chipW - 6 - 46) / 2, y: 10, s: 46 });
    tx(chip, `ll${i}`, ln.label, { x: 8, y: 60, w: chipW - 22, h: chipH - 66, size: ln.label.length > 12 ? 19 : 23, weight: 700, color: P.ink, wrap: true, lh: 1.1, align: 'center' });
    reveal(S, chip, t, { sc: .92, d: .4 });
    const itemH = Math.min(chipH, 118), gx = 38, ix0 = 80 + chipW + gx, iw = Math.floor((1056 - 24 - ix0 - (n - 1) * gx) / n);
    let prevX = 80 + chipW, tt = t + .45;
    ln.items.forEach((it, j) => {
      const ix = ix0 + j * (iw + gx);
      flow(S, `M${prevX + 2} ${cy} H${ix - 2}`, P.bd, { t0: tt, dur: .3, w: 4, head: 11, svg: ls });
      const b = node(S, `li${i}${j}`, { x: ix, y: top + Math.round((laneH - itemH) / 2), w: iw, h: itemH, title: it.title, sub: it.sub, group: ln.group, tsize: 22, ssize: 18, r: 20, fill: '#fff', fit: true });
      reveal(S, b, tt + .25, { dy: 10, sc: .93, d: .4 }); prevX = ix + iw; tt += .55;
    });
    t = tt + .35;
  });
  footer(S);
  return finish(S);
}
