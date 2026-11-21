// Template "framework": a 3-column grid of 6 or 9 cards, each with a one-line idea and a small diagram (steps, stack, tree, fan, table, chips), then a takeaways row.
import { C, E, box, tx, enter, seg, eo } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, badge, layer, TOP } from './gif_common.js';

const CW = 334, GAP = 14, X0 = 24, GY = TOP + 2, GRID_B = 1012, TK_Y = 1024, TK_H = 184;

// mini diagrams: every function draws inside card `b` (origin x,y,w,h = free area) and returns the arrows to animate (absolute coords)
function mini(S, b, cx0, cy0, v, P, area, id) {
  const { x, y, w, h } = area, items = v.items, n = items.length, arrows = [];
  const pill = (i, px, py, pw, ph, txt, o = {}) => {
    const e = box(b, { x: px, y: py, w: pw, h: ph, r: o.r ?? 10, fill: o.fill ?? '#fff', bd: o.bd ?? P.bd, bw: 2, shadow: false });
    const lw = Math.max(...String(txt).split(' ').map(q => q.length)), sz = Math.max(12, Math.min(o.size ?? 16, Math.floor((pw - 20) / (lw * .6))));
    tx(e, `${id}${i}`, txt, { x: 5, y: 0, w: pw - 16, h: ph - 4, size: sz, weight: 700, color: o.ink ?? P.ink, align: 'center', wrap: true, lh: 1.05 }); return e;
  };
  if (v.type === 'steps') {                                   // boxes in a row/grid joined by arrows
    const cols = n <= 3 ? n : 2, rows = Math.ceil(n / cols), gx = 26, bw = Math.floor((w - (cols - 1) * gx) / cols), bh = Math.min(48, Math.floor((h - (rows - 1) * 22) / rows));
    items.forEach((s, i) => { const r = Math.floor(i / cols), c = i % cols, px = x + c * (bw + gx), py = y + r * (bh + 22) + Math.round((h - rows * bh - (rows - 1) * 22) / 2); pill(i, px, py, bw, bh, s);
      if (c < cols - 1 && i < n - 1) arrows.push([[px + bw + 2, py + bh / 2], [px + bw + gx - 2, py + bh / 2]]);
      if (c === cols - 1 && i < n - 1) arrows.push([[px + bw / 2, py + bh + 2], [px + bw / 2, py + bh + 20]]); });
  } else if (v.type === 'stack') {                            // widening bars, narrowest on top
    const bh = Math.min(34, Math.floor((h - (n - 1) * 5) / n)), tot = n * bh + (n - 1) * 5, y0 = y + Math.round((h - tot) / 2);
    items.forEach((s, i) => { const bw = Math.round(w * (.5 + .5 * (i + 1) / n)); pill(i, x + Math.round((w - bw) / 2), y0 + i * (bh + 5), bw, bh, s, { fill: i === 0 ? P.soft : '#fff', r: 8 }); });
    arrows.push([[x + w - 4, y + h - 6], [x + w - 4, y + 6]]);
  } else if (v.type === 'tree') {                             // one root, children below
    const rh = 34, rw = Math.min(w, 190), ch = 40, gx = 8, bw = Math.floor((w - (n - 1) * gx) / n), cy = y + h - ch;
    pill('r', x + Math.round((w - rw) / 2), y, rw, rh, v.root, { fill: P.soft });
    items.forEach((s, i) => { const px = x + i * (bw + gx); pill(i, px, cy, bw, ch, s, { size: 14 }); arrows.push([[x + w / 2, y + rh + 1], [x + w / 2, y + rh + 14], [px + bw / 2, y + rh + 14], [px + bw / 2, cy - 2]]); });
  } else if (v.type === 'fan') {                              // one source feeds several outputs
    const lw = 92, bh = Math.min(34, Math.floor((h - (n - 1) * 6) / n)), tot = n * bh + (n - 1) * 6, y0 = y + Math.round((h - tot) / 2), rx = x + lw + 40, rw = w - lw - 40;
    pill('s', x, y + Math.round(h / 2) - 22, lw, 44, v.root, { fill: P.soft });
    items.forEach((s, i) => { const py = y0 + i * (bh + 6); pill(i, rx, py, rw, bh, s, { size: 15 }); arrows.push([[x + lw + 2, y + h / 2], [x + lw + 16, y + h / 2], [x + lw + 16, py + bh / 2], [rx - 2, py + bh / 2]]); });
  } else if (v.type === 'table') {                            // header row + rows of "a | b | c"
    const rows = items.map(r => r.split('|').map(s => s.trim())), cols = rows[0].length, rh = Math.min(30, Math.floor(h / rows.length)), cw = Math.floor(w / cols), y0 = y + Math.round((h - rh * rows.length) / 2);
    rows.forEach((r, i) => r.forEach((c, j) => { const e = box(b, { x: x + j * cw, y: y0 + i * rh, w: cw, h: rh, r: 0, fill: i === 0 ? P.soft : '#fff', bd: C.lineD, bw: 1.5, shadow: false }); tx(e, `${id}${i}${j}`, c, { x: 2, y: 0, w: cw - 8, h: rh - 3, size: Math.max(12, Math.min(14, Math.floor((cw - 14) / (Math.max(...c.split(' ').map(q => q.length), 1) * .6)))), weight: i === 0 ? 800 : 600, color: i === 0 ? P.ink : C.ink, align: 'center' }); }));
  } else {                                                    // chips: a centre label with items around it
    const cw = Math.min(100, w * .34), ch = 38, cxp = x + Math.round((w - cw) / 2), cyp = y + Math.round((h - ch) / 2);
    const cols = 2, bw = Math.floor((w - cw - 44) / 2), rowsEach = Math.ceil(n / 2), bh = Math.min(30, Math.floor((h - (rowsEach - 1) * 6) / rowsEach));
    pill('c', cxp, cyp, cw, ch, v.root, { fill: P.soft });
    items.forEach((s, i) => { const left = i % 2 === 0, r = Math.floor(i / 2), px = left ? x : x + w - bw, py = y + Math.round((h - (rowsEach * bh + (rowsEach - 1) * 6)) / 2) + r * (bh + 6); pill(i, px, py, bw, bh, s, { size: 14 });
      arrows.push(left ? [[px + bw + 2, py + bh / 2], [cxp - 2, py + bh / 2]] : [[cxp + cw + 2, cyp + ch / 2], [px - 2, py + bh / 2]]); });
  }
  return arrows;
}

export function buildFramework(stage, D) {
  const S = scene(stage, D), g = S.g, F = g.framework, cards = F.cards, rows = Math.ceil(cards.length / 3), CH = Math.floor((GRID_B - GY - (rows - 1) * 12) / rows);
  header(S);
  let t = .7;
  cards.forEach((c, i) => {
    const P = PAL[c.group], col = i % 3, row = Math.floor(i / 3), x = X0 + col * (CW + GAP), y = GY + row * (CH + 12);
    const b = box(S.root, { x, y, w: CW, h: CH, r: 22, fill: P.soft, bd: P.bd, bw: 2.5, css: `box-shadow:0 5px 0 ${C.line};` });
    badge(b, c.icon, { soft: '#fff', ink: P.ink }, { x: 10, y: 9, s: 40 });
    tx(b, `c${i}-t`, c.title, { x: 56, y: 8, w: CW - 66, h: 44, size: c.title.length > 18 ? 22 : 25, weight: 700, color: P.ink, wrap: true, lh: 1.05 });
    tx(b, `c${i}-b`, c.body, { x: 14, y: 56, w: CW - 28, h: 72, size: 17, weight: 500, color: C.ink, wrap: true, lh: 1.22, css: 'align-items:flex-start;' });
    const area = { x: 14, y: 132, w: CW - 28, h: CH - 132 - (c.caption ? 36 : 14) };
    if (c.caption) tx(b, `c${i}-c`, c.caption, { x: 8, y: CH - 34, w: CW - 22, h: 28, size: 16, weight: 700, color: P.ink, align: 'center', wrap: true, lh: 1.05 });
    const arrows = mini(S, b, 0, 0, c.viz, P, area, `v${i}`);
    reveal(S, b, t, { dy: 12, sc: .95, d: .5 });
    if (arrows.length) { const ls = layer(S); arrows.forEach((pts, k) => flow(S, pts.map(([a, bb], q) => `${q ? 'L' : 'M'}${a + x} ${bb + y}`).join(' '), P.bd, { t0: t + .6 + k * .12, dur: .35, w: 3.2, head: 9, svg: ls })); }
    t += .55;
  });
  const tk = box(S.root, { x: X0, y: TK_Y, w: 1032, h: TK_H, r: 22, fill: C.greenSoft, bd: C.green, bw: 2.5, css: `box-shadow:0 5px 0 ${C.line};` });
  tx(tk, 'tk-h', F.takeaways_title || 'Key takeaways', { x: 0, y: 6, w: 1032, h: 34, size: 26, weight: 700, color: C.greenD, align: 'center' });
  const m = F.takeaways.length, tw = Math.floor((1032 - 28) / m);
  F.takeaways.forEach((k, i) => {
    const px = 14 + i * tw;
    if (i) E(tk, 'abs', `left:${px - 2}px;top:48px;width:2px;height:${TK_H - 62}px;background:${C.green};opacity:.4`);
    badge(tk, k.icon, { soft: '#fff', ink: C.greenD }, { x: px + Math.round((tw - 40) / 2), y: 46, s: 40 });
    tx(tk, `tk${i}-t`, k.title, { x: px + 4, y: 88, w: tw - 12, h: 46, size: 19, weight: 700, align: 'center', wrap: true, lh: 1.05 });
    tx(tk, `tk${i}-b`, k.body, { x: px + 4, y: 136, w: tw - 12, h: 44, size: 16, weight: 500, color: C.mid, align: 'center', wrap: true, lh: 1.15, css: 'align-items:flex-start;' });
  });
  reveal(S, tk, t + .2, { dy: 14, sc: .97, d: .6 });
  footer(S);
  return finish(S);
}
