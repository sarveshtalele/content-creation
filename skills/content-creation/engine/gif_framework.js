// Template "framework": a 3-column grid of 6 or 9 cards (idea + a small diagram (steps, stack, tree, fan, table) that fills the rest of the card) and a takeaways row.
// Text is fitted by measurement, never by guessing; every card spends its leftover height on the diagram, so nothing floats in empty space.
import { C, E, box, tx, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, line, badge, layer, TOP } from './gif_common.js';

const CW = 334, GAP = 14, X0 = 24, GY = TOP + 2, GRID_B = 1036, TK_Y = 1048, TK_H = 160, PADB = 36;

function pill(b, id, txt, P, { x, y, w, h, fill = '#fff', ink = P.ink, max = 17, min = 12, r = 10, weight = 700, bd = P.bd }) {
  const e = box(b, { x, y, w, h, r, fill, bd, bw: 2, shadow: false });
  const sz = fitSize(txt, { w: w - 24, h: h - 8, max, min, weight, lh: 1.08 });
  tx(e, id, txt, { x: 4, y: 1, w: w - 8, h: h - 4, size: sz, weight, color: ink, align: 'center', wrap: true, lh: 1.08 });
  return e;
}

// Draws one mini diagram inside area a (card-relative) and wires its arrows (absolute coords = card origin + relative).
function mini(S, b, v, P, a, id, ox, oy, t0) {
  const items = v.items, n = items.length, ls = layer(S), pts = p => p.map(([x, y], i) => `${i ? 'L' : 'M'}${x + ox} ${y + oy}`).join(' ');
  const arrow = (p, k = 0) => flow(S, pts(p), P.bd, { t0: t0 + k * .1, dur: .35, w: 3.2, head: 9, svg: ls, dot: 5 });
  const wire = p => line(S, pts(p), P.bd, { t0, svg: ls });
  const { x, y, w, h } = a;
  if (v.type === 'steps') {
    if (n <= 3) {
      const g = 24, bw = Math.floor((w - (n - 1) * g) / n), bh = Math.min(56, Math.round(h * .62)), y0 = y + Math.round((h - bh) / 2);
      items.forEach((s, i) => { pill(b, `${id}${i}`, s, P, { x: x + i * (bw + g), y: y0, w: bw, h: bh }); if (i < n - 1) arrow([[x + i * (bw + g) + bw + 2, y0 + bh / 2], [x + (i + 1) * (bw + g) - 2, y0 + bh / 2]], i); });
    } else {                                                   // 2x2 snake: left->right, down, right->left
      const gx = 36, gy = 32, bw = Math.floor((w - gx) / 2), bh = Math.min(46, Math.floor((h - gy) / 2)), y0 = y + Math.round((h - 2 * bh - gy) / 2), cx = [x, x + bw + gx];
      const pos = [[cx[0], y0], [cx[1], y0], [cx[1], y0 + bh + gy], [cx[0], y0 + bh + gy]];
      items.forEach((s, i) => pill(b, `${id}${i}`, s, P, { x: pos[i][0], y: pos[i][1], w: bw, h: bh }));
      arrow([[cx[0] + bw + 2, y0 + bh / 2], [cx[1] - 2, y0 + bh / 2]], 0);
      arrow([[cx[1] + bw / 2, y0 + bh + 2], [cx[1] + bw / 2, y0 + bh + gy - 2]], 1);
      arrow([[cx[1] - 2, y0 + bh + gy + bh / 2], [cx[0] + bw + 2, y0 + bh + gy + bh / 2]], 2);
    }
  } else if (v.type === 'stack') {                             // narrow top, wide base
    const gp = 6, bh = Math.min(42, Math.floor((h - (n - 1) * gp) / n)), y0 = y + Math.round((h - n * bh - (n - 1) * gp) / 2);
    items.forEach((s, i) => { const bw = Math.round(w * (.5 + .5 * i / Math.max(1, n - 1))); pill(b, `${id}${i}`, s, P, { x: x + Math.round((w - bw) / 2), y: y0 + i * (bh + gp), w: bw, h: bh, fill: i === 0 ? P.soft : '#fff', r: 9 }); });
  } else if (v.type === 'tree') {
    const rw = Math.min(220, Math.round(w * .7)), rh = 36, ch = 42, gx = 10, bw = Math.floor((w - (n - 1) * gx) / n), cy = y + h - ch, busY = y + rh + Math.round((cy - y - rh) * .3);
    pill(b, `${id}r`, v.root, P, { x: x + Math.round((w - rw) / 2), y, w: rw, h: rh, fill: P.soft });
    const cxs = items.map((_, i) => x + i * (bw + gx) + bw / 2);
    wire([[x + w / 2, y + rh], [x + w / 2, busY]]); wire([[cxs[0], busY], [cxs[n - 1], busY]]);
    items.forEach((s, i) => { pill(b, `${id}${i}`, s, P, { x: x + i * (bw + gx), y: cy, w: bw, h: ch }); arrow([[cxs[i], busY], [cxs[i], cy - 2]], i); });
  } else if (v.type === 'fan') {
    const sw = 96, sh = Math.min(h, 64), ox2 = x + sw + 58, ow = w - sw - 58, gp = 8, oh = Math.min(42, Math.floor((h - (n - 1) * gp) / n)), y0 = y + Math.round((h - n * oh - (n - 1) * gp) / 2), busX = x + sw + 24, mid = y + h / 2;
    pill(b, `${id}s`, v.root, P, { x, y: Math.round(mid - sh / 2), w: sw, h: sh, fill: P.soft });
    const ys = items.map((_, i) => y0 + i * (oh + gp) + oh / 2);
    wire([[x + sw, mid], [busX, mid]]); wire([[busX, ys[0]], [busX, ys[n - 1]]]);
    items.forEach((s, i) => { pill(b, `${id}${i}`, s, P, { x: ox2, y: y0 + i * (oh + gp), w: ow, h: oh }); arrow([[busX, ys[i]], [ox2 - 2, ys[i]]], i); });
  } else if (v.type === 'table') {
    const rows = items.map(r => r.split('|').map(s => s.trim())), cols = rows[0].length, rh = Math.min(44, Math.floor(h / rows.length)), cw = Math.floor(w / cols), y0 = y + Math.round((h - rh * rows.length) / 2);
    const sz = Math.min(...rows.flatMap((r, i) => r.map(c => fitSize(c, { w: cw - 24, h: rh - 8, max: 16, min: 12, weight: i ? 600 : 800, lh: 1.05 }))));
    rows.forEach((r, i) => r.forEach((c, j) => { const e = box(b, { x: x + j * cw, y: y0 + i * rh, w: cw, h: rh, r: 0, fill: i ? '#fff' : P.soft, bd: C.lineD, bw: 1.5, shadow: false }); tx(e, `${id}${i}${j}`, c, { x: 2, y: 0, w: cw - 7, h: rh - 3, size: sz, weight: i ? 600 : 800, color: i ? C.ink : P.ink, align: 'center', lh: 1.05 }); }));
  }
}

export function buildFramework(stage, D) {
  const S = scene(stage, D), g = S.g, F = g.framework, cards = F.cards, rows = Math.ceil(cards.length / 3), CH = Math.floor((GRID_B - GY - (rows - 1) * 12) / rows);
  header(S);
  const TS = Math.min(...cards.map(c => fitSize(c.title, { w: CW - 78, h: 44, max: 24, min: 18, weight: 700, lh: 1.05 })));
  const BS = Math.min(...cards.map(c => fitSize(c.body, { w: CW - 28, h: 68, max: 18, min: 15, weight: 500, lh: 1.22 })));
  let t = .7;
  cards.forEach((c, i) => {
    const P = PAL[c.group], x = X0 + (i % 3) * (CW + GAP), y = GY + Math.floor(i / 3) * (CH + 12);
    const b = box(S.root, { x, y, w: CW, h: CH, r: 22, fill: P.soft, bd: P.bd, bw: 2.5, css: `box-shadow:0 5px 0 ${C.line};` });
    badge(b, c.icon, { soft: '#fff', ink: P.ink }, { x: 10, y: 9, s: 40 });
    tx(b, `c${i}-t`, c.title, { x: 58, y: 7, w: CW - 78, h: 44, size: TS, weight: 700, color: P.ink, wrap: true, lh: 1.05 });
    const bs = BS, bh = Math.ceil(measure(c.body, { size: bs, weight: 500, w: CW - 28, lh: 1.22 }).h);
    tx(b, `c${i}-b`, c.body, { x: 14, y: 56, w: CW - 28, h: bh + 2, size: bs, weight: 500, color: C.ink, wrap: true, lh: 1.22, css: 'align-items:flex-start;' });
    if (c.caption) tx(b, `c${i}-c`, c.caption, { x: 10, y: CH - 32, w: CW - 20, h: 24, size: fitSize(c.caption, { w: CW - 20, h: 24, max: 17, min: 14, weight: 700, lh: 1.05 }), weight: 700, color: P.ink, align: 'center', wrap: true, lh: 1.05 });
    const ay = 56 + bh + 12, a = { x: 14, y: ay, w: CW - 28, h: CH - ay - PADB };
    reveal(S, b, t, { dy: 12, sc: .95, d: .5 });
    mini(S, b, c.viz, P, a, `v${i}`, x, y, t + .6);
    t += .55;
  });
  const tk = box(S.root, { x: X0, y: TK_Y, w: 1032, h: TK_H, r: 22, fill: C.greenSoft, bd: C.green, bw: 2.5, css: `box-shadow:0 5px 0 ${C.line};` });
  tx(tk, 'tk-h', F.takeaways_title || 'Key takeaways', { x: 0, y: 5, w: 1032, h: 32, size: 25, weight: 700, color: C.greenD, align: 'center' });
  const m = F.takeaways.length, tw = Math.floor((1032 - 28) / m);
  const TKB = Math.min(...F.takeaways.map(k => fitSize(k.body, { w: tw - 12, h: 34, max: 15, min: 12, weight: 500, lh: 1.12 })));
  F.takeaways.forEach((k, i) => {
    const px = 14 + i * tw;
    if (i) E(tk, 'abs', `left:${px - 2}px;top:44px;width:2px;height:${TK_H - 56}px;background:${C.green};opacity:.4`);
    badge(tk, k.icon, { soft: '#fff', ink: C.greenD }, { x: px + Math.round((tw - 34) / 2), y: 40, s: 34 });
    tx(tk, `tk${i}-t`, k.title, { x: px + 6, y: 76, w: tw - 12, h: 42, size: fitSize(k.title, { w: tw - 12, h: 42, max: 18, min: 14, weight: 700, lh: 1.05 }), weight: 700, align: 'center', wrap: true, lh: 1.05, css: 'align-items:flex-start;' });
    tx(tk, `tk${i}-b`, k.body, { x: px + 6, y: 120, w: tw - 12, h: 34, size: TKB, weight: 500, color: '#3F3E3A', align: 'center', wrap: true, lh: 1.12, css: 'align-items:flex-start;' });
  });
  reveal(S, tk, t + .2, { dy: 14, sc: 1, pop: false, d: .6 });
  footer(S);
  return finish(S);
}
