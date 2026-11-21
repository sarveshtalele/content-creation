// Template "columns": a catalogue grouped by category. Each column stacks cards, a spine flows down into a category pill, and every pill flows into one central hub.
import { C, E, box, tx, spark, enter, seg, eo } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, badge, W } from './gif_common.js';

const CARD_H = 148, GAP = 20, Y0 = 160;
export function buildColumns(stage, D) {
  const S = scene(stage, D), g = S.g, cols = g.columns, nc = cols.length;
  header(S);
  const colW = nc === 4 ? 244 : 328, gap = nc === 4 ? 18 : 24, total = nc * colW + (nc - 1) * gap, x0 = Math.round((W - total) / 2);
  const nodeY = Y0 + 3 * CARD_H + 2 * GAP + 40, nodeH = 84, R = 150, CY = nodeY + nodeH + 215, CX = 540;
  // hub (anchor, appears first)
  const hub = box(S.root, { x: CX - R, y: CY - R, w: 2 * R, h: 2 * R, r: R, bd: C.clay, bw: 3.5, css: `box-shadow:0 8px 0 ${C.line};` });
  E(hub, 'abs', `left:${R - 20 - 3.5}px;top:36px`, spark(40, C.clay));
  tx(hub, 'hub-t', g.hub.title, { x: 8, y: 84, w: 2 * R - 23, h: 84, size: g.hub.title.length > 14 ? 32 : 38, weight: 600, font: 'serif', align: 'center', wrap: true, lh: 1.1 });
  if (g.hub.sub) tx(hub, 'hub-s', g.hub.sub, { x: 30, y: 176, w: 2 * R - 67, h: 60, size: 19, weight: 500, color: C.mid, align: 'center', wrap: true, css: 'align-items:flex-start;' });
  reveal(S, hub, .6, { sc: .8, dy: 0, d: .7 });
  const rb = box(S.root, { x: 330, y: CY + R + 26, w: 420, h: 46, r: 23, fill: C.ink, bd: C.ink, shadow: false });
  tx(rb, 'rib', g.hub.tagline, { x: 0, y: 0, w: 416, h: 42, size: g.hub.tagline.length > 28 ? 21 : 24, weight: 600, color: '#fff', align: 'center' });
  const groups = ['blue', 'green', 'clay', 'blue'];
  let t = 1.7;
  cols.forEach((col, i) => {
    const x = x0 + i * (colW + gap), cx = x + colW / 2, P = PAL[col.group], n = col.items.length;
    const spineTop = Y0 + 6, pillTop = nodeY;
    flow(S, `M${cx} ${spineTop} V${pillTop - 2}`, P.bd, { t0: t, dur: .5 + n * .4, w: 4, head: 13 });
    col.items.forEach((it, j) => {
      const card = node(S, `k${i}${j}`, { x, y: Y0 + j * (CARD_H + GAP), w: colW, h: CARD_H, title: it.title, sub: it.sub, ic: it.icon, group: col.group, tsize: nc === 4 ? 23 : 26, ssize: nc === 4 ? 19 : 21, fit: true });
      reveal(S, card, t + .15 + j * .42, { dy: 16 });
    });
    const pill = box(S.root, { x: x + 8, y: pillTop, w: colW - 16, h: nodeH, r: 42, fill: P.soft, bd: P.bd, bw: 3, css: `box-shadow:0 5px 0 ${C.line};` });
    badge(pill, col.icon, P, { x: 14, y: 17, s: 50 });
    tx(pill, `kp${i}`, col.label, { x: 72, y: 6, w: colW - 16 - 82, h: nodeH - 14, size: col.label.length > 14 ? 21 : 24, weight: 700, color: P.ink, wrap: true, lh: 1.08 });
    const tp = t + .15 + n * .42 + .35; reveal(S, pill, tp, { sc: .9, d: .4 });
    // pill -> hub, curved, arrives along the upper arc of the hub
    const a = (-155 + i * (130 / Math.max(1, nc - 1))) * Math.PI / 180, tx_ = CX + (R + 2) * Math.cos(a), ty = CY + (R + 2) * Math.sin(a), y1 = pillTop + nodeH;
    flow(S, `M${cx} ${y1} C${cx} ${y1 + 70} ${tx_} ${ty - 80} ${tx_} ${ty}`, P.bd, { t0: tp + .35, dur: .8, w: 4.5, head: 14 });
    t = tp + 1.3;
  });
  reveal(S, rb, t, { d: .4, dy: 10 });
  footer(S);
  return finish(S);
}
