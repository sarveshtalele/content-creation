// LinkedIn GIF: ONE page, silent loop. Hub-and-spoke infographic that builds itself (boxes + animated arrows). Data-driven (data.json → gif).
import { C, E, box, tx, svgLayer, path, circ, draw, headAt, tri, icon, spark, keycap, enter, seg, eo } from './kit.js';
import { cta } from './cta.js';

const W = 1080, FADE = .5;
const PAL = {
  blue: { bd: C.blue, ink: C.blueD, soft: C.blueSoft }, green: { bd: C.green, ink: C.greenD, soft: C.greenSoft },
  clay: { bd: C.clay, ink: C.clayD, soft: C.claySoft }, sand: { bd: C.lineD, ink: C.mid, soft: C.sand },
};
const PH = [[C.blueSoft, C.blueD, C.blue], [C.claySoft, C.clayD, C.clay], [C.greenSoft, C.greenD, C.green]];

function card(root, id, g, { x, y, w, h, title, ic, group }) {
  const P = PAL[group];
  const b = box(root, { x, y, w, h, r: 26, bd: P.bd, bw: 2.5, css: `box-shadow:0 6px 0 ${C.line};` });
  E(b, 'abs', `left:14px;top:12px;width:52px;height:52px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(ic, 30, P.ink, 2));
  tx(b, id + '-t', title, { x: 78, y: 8, w: w - 88, h: 36, size: title.length > 20 ? 23 : 25, weight: 700 });
  tx(b, id + '-g', g.groups[group], { x: 78, y: 42, w: w - 88, h: 24, size: 18, weight: 700, color: P.ink, ls: .12 });
  E(b, 'abs', `left:16px;right:16px;top:72px;height:0;border-top:2px dashed ${C.line}`);
  return b;
}
const body = (b, id, text, o) => tx(b, id, text, { x: o.x ?? 13, y: o.y ?? 82, w: o.w, h: o.h, size: o.size, weight: 500, color: o.color ?? C.mid, wrap: true, lh: 1.27 });
function conn(svg, d, color) {
  const p = path(svg, d, { stroke: color, w: 4.5 }), t = tri(svg, color); p.style.opacity = '0';
  return k => { draw(p, k); headAt(p, k, t, 15); };
}

export function buildGif(stage, D) {
  const g = D.gif, cards = g.cards, N = cards.length, H = g.H, HOLD = g.hold ?? 5.4;
  const root = E(stage, 'scene'); root.style.display = 'block';
  const svg = svgLayer(root, W, H);
  const A = [];
  let T = 0;                                   // last entry time → DUR
  const at = t => { T = Math.max(T, t); return t; };
  const two = N >= 7, CX = 540, CY = two ? 560 : 540, R = 140;

  // title
  const tt = g.title, tsz = tt.length > 26 ? 52 : 60, tw = tt.length * tsz * .52;
  const sp = E(root, 'abs', `left:${Math.max(24, 540 - tw / 2 - 66)}px;top:20px;width:48px;height:48px`, spark(48, C.clay));
  const title = tx(root, 'g-title', tt, { x: 0, y: 12, w: W, h: 78, size: tsz, weight: 600, font: 'serif', align: 'center' });
  const sub = tx(root, 'g-sub', g.subtitle, { x: 20, y: 92, w: W - 40, h: 40, size: g.subtitle.length > 52 ? 25 : 29, weight: 500, color: C.clayD, align: 'center' });
  A.push(u => { enter(sp, u, .05, { sc: .5, dy: 0, pop: true, d: .6 }); enter(title, u, .1, { dy: 16, d: .5 }); enter(sub, u, .35, { dy: 12 }); });

  // hub
  const ringP = path(svg, `M${CX} ${CY - 152} a152 152 0 1 1 -.01 0`, { stroke: C.lineD, w: 3, dash: '2 11' });
  const orb = circ(svg, CX, CY - 152, 9, { fill: C.clay });
  const hub = E(root, 'abs', `left:${CX - R}px;top:${CY - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;background:#fff;border:3.5px solid ${C.clay};box-sizing:border-box;box-shadow:0 8px 0 ${C.line}`); hub.dataset.box = '1';
  const hs = E(hub, 'abs', `left:${R - 17 - 3.5}px;top:16px`, spark(34, C.clay));
  tx(hub, 'hub-t', g.hub.title, { x: 0, y: 52, w: 2 * R - 7, h: 36, size: g.hub.title.length > 14 ? 25 : 30, weight: 600, font: 'serif', align: 'center' });
  const steps = g.hub.steps, ns = steps.length, y0 = 96 + (3 - ns) * 24;
  const ph = steps.map((l, i) => {
    const [bg, ink, bd] = PH[i % 3], p = box(hub, { x: R - 3.5 - 90, y: y0 + i * 49, w: 180, h: 40, r: 20, fill: bg, bd, bw: 2, shadow: false });
    tx(p, 'ph' + i, l, { x: 0, y: 0, w: 176, h: 36, size: l.length > 15 ? 18 : 21, weight: 700, color: ink, align: 'center' }); return p;
  });
  let loopP = null, loopT = null;
  if (ns >= 2) {
    const ya = y0 + (ns - 1) * 49 + 20, yb = y0 + 20;
    loopP = path(svg, `M${CX + 84} ${CY - R + ya + 3.5} C${CX + 124} ${CY - R + ya + 3.5} ${CX + 124} ${CY - R + yb + 3.5} ${CX + 86} ${CY - R + yb + 3.5}`, { stroke: C.mid, w: 3.5 }); loopT = tri(svg, C.mid);
  }
  A.push(u => {
    draw(ringP, eo(seg(u, .7, 1.8))); ringP.style.opacity = String(seg(u, .7, .9));
    enter(hub, u, .6, { sc: .8, dy: 0, pop: true, d: .7 }); enter(hs, u, .7, { dy: 0 });
    ph.forEach((p, i) => enter(p, u, 1.2 + i * .35, { dy: 10, sc: .92, pop: true, d: .4 }));
    if (loopP) { const k = eo(seg(u, 2.3, 3.0)); draw(loopP, k); headAt(loopP, k, loopT, 13); }
    const a = -Math.PI / 2 + Math.max(0, u - 2.6) * 1.15;
    orb.setAttribute('cx', CX + 152 * Math.cos(a)); orb.setAttribute('cy', CY + 152 * Math.sin(a)); orb.style.opacity = String(seg(u, 2.6, 3.0));
  });

  // slots: 0-2 top row, 3 left1, 4 right1, 5 left2, 6 right2, 7 bottom-left (wide), 8 bottom-right
  const topX = [24, 372, 720], rowsY = two ? [344, 604] : [CY - 120], sideH = 240, SL = 24, SR = 726, SW = 330;
  const slot = i => i < 3 ? { x: topX[i], y: 150, w: 336, h: 166, kind: 'top' }
    : i === 3 ? { x: SL, y: rowsY[0], w: SW, h: sideH, kind: 'side' } : i === 4 ? { x: SR, y: rowsY[0], w: SW, h: sideH, kind: 'side' }
    : i === 5 ? { x: SL, y: rowsY[1], w: SW, h: sideH, kind: 'side' } : i === 6 ? { x: SR, y: rowsY[1], w: SW, h: sideH, kind: 'side' }
    : i === 7 ? { x: 24, y: 872, w: 640, h: 280, kind: 'wide' } : { x: 684, y: 872, w: 372, h: 280, kind: 'narrow' };
  const order = [0, 1, 2, 3, 5, 4, 6, 7, 8].filter(i => i < N), tops = [3.2, 4.2, 5.2, 6.6, 7.6, 8.8, 9.8];
  const rowC = [rowsY[0] + sideH / 2, two ? rowsY[1] + sideH / 2 : 0];
  const pathFor = i => {
    const lft = i === 3 || i === 5, row = i <= 4 ? 0 : 1;
    if (i < 3) return [`M${CX - 107} ${CY - 107} V334 H192 V318`, `M${CX} ${CY - 152} V318`, `M${CX + 107} ${CY - 107} V334 H888 V318`][i];
    const side = lft ? -1 : 1, x0 = CX + side * 143, xv = CX + side * 169, xe = lft ? 358 : 722, yc = rowC[row];
    if (!two) return `M${CX + side * 152} ${CY} H${xe}`;
    return `M${x0} ${CY + (row ? 52 : -52)} H${xv} V${yc} H${xe}`;
  };
  order.forEach((i, k) => {
    const c = cards[i], s = slot(i), id = 'c' + i, b = card(root, id, g, { x: s.x, y: s.y, w: s.w, h: s.h, title: c.title, ic: c.icon, group: c.group });
    const P = PAL[c.group], sz = s.kind === 'top' ? 19 : s.kind === 'side' ? 20 : 21, bw = s.w - 24, x = 13;
    let t0;
    if (i < 7) t0 = at(tops[k]);
    else if (i === 7) t0 = at(11.8); else t0 = at(13.4);
    if (i < 7) {
      const f = conn(svg, pathFor(i), P.bd); A.push(u => { f(eo(seg(u, t0 - .5, t0))); enter(b, u, t0, { dy: 14, sc: .95, pop: true, d: .45 }); });
    }
    const kids = [];
    if (c.kind === 'chips') {
      if (c.key) { keycap(b, id + '-k', c.key.k, { x: s.w - 236, y: 14, w: 132, h: 46, size: 20 }); tx(b, id + '-kc', c.key.t, { x: s.w - 94, y: 14, w: 84, h: 46, size: 20, weight: 600, color: P.ink }); }
      c.items.forEach((m, j) => {
        const mb = box(b, { x: 16 + (j % 2) * 312, y: 88 + Math.floor(j / 2) * 92, w: 296, h: 80, r: 18, fill: P.soft, bd: P.bd, bw: 2, shadow: false });
        tx(mb, `${id}-m${j}`, m.l, { x: 14, y: 6, w: 270, h: 34, size: 25, weight: 700, color: P.ink }); tx(mb, `${id}-m${j}d`, m.d, { x: 14, y: 40, w: 272, h: 32, size: 19, weight: 500, color: C.ink });
        kids.push(mb);
      });
    } else if (c.kind === 'dialog') {
      let y = 80; const HH = [46, 42, 84], WW = [224, 330, 330];
      c.turns.slice(0, 3).forEach((u, j) => {
        const me = u.who === 'user', w = WW[j], h = HH[j], tb = box(b, { x: me ? s.w - w - 16 : 16, y, w, h, r: 22, fill: me ? C.sand : '#fff', bd: me ? C.lineD : C.line, shadow: false });
        tx(tb, `${id}-d${j}`, u.text, { x: 12, y: 0, w: w - 24, h: h - 4, size: j === 0 ? 22 : 19, weight: 600, wrap: true, lh: 1.22, align: j === 0 ? 'center' : 'left' });
        y += h + 10; kids.push(tb);
      });
    } else {
      const bh = c.kind === 'keys' ? 82 : s.h - 82 - 12;
      body(b, id + '-b', c.body, { w: bw, h: bh, size: sz, x });
      if (c.kind === 'keys') {
        c.keys.slice(0, 3).forEach((kk, j) => kids.push(keycap(b, `${id}-k${j}`, kk, { x: 16 + j * 86, y: 170, w: 76, h: 50, size: 22 })));
        if (c.note) tx(b, id + '-n', c.note, { x: 16 + Math.min(3, c.keys.length) * 86 + 4, y: 168, w: s.w - 36 - Math.min(3, c.keys.length) * 86, h: 50, size: 19, weight: 600, color: P.ink, wrap: true, lh: 1.15 });
      } else if (c.note) tx(b, id + '-n', c.note, { x: 16, y: s.h - 40, w: s.w - 32, h: 28, size: 19, weight: 500, color: P.ink, font: c.noteMono ? 'mono' : 'sans' });
    }
    if (i === 7) {
      const t7 = t0, kt = kids.map((_, j) => at(12.5 + j * .35));
      const f = conn(svg, `M470 780 V870`, P.bd); A.push(u => { f(eo(seg(u, t7 - .5, t7))); enter(b, u, t7, { dy: 14, sc: .96, pop: true, d: .45 }); kids.forEach((m, j) => enter(m, u, kt[j], { dy: 8, sc: .92, pop: true, d: .35 })); });
    } else if (i === 8) {
      const t8 = t0, kt = kids.map((_, j) => at(14.0 + j * .7));
      const f = conn(svg, `M610 780 V800 H700 V870`, C.mid); A.push(u => { f(eo(seg(u, 11.5, 12.0))); enter(b, u, t8, { dy: 14, sc: .96, pop: true, d: .45 }); kids.forEach((m, j) => enter(m, u, kt[j], { dx: j === 1 ? -24 : 30, dy: 6, sc: .94, pop: true })); });
    } else if (kids.length) {
      A.push(u => kids.forEach((m, j) => { if (c.kind === 'keys') { const p = seg(u, t0 + 1.0 + j * .5, t0 + 1.3 + j * .5); m.pressAt(Math.sin(p * Math.PI)); } }));
    }
  });

  // ribbon (tagline) under the hub
  const ribY = CY + 176;
  if (g.hub.tagline) {
    const rb = box(root, { x: 375, y: ribY, w: 330, h: 44, r: 22, fill: C.ink, bd: C.ink, shadow: false });
    tx(rb, 'rib', g.hub.tagline, { x: 0, y: 0, w: 326, h: 40, size: g.hub.tagline.length > 22 ? 21 : 24, weight: 600, color: '#fff', align: 'center' });
    const f0 = conn(svg, `M${CX} ${CY + 152} V${ribY - 2}`, C.ink), tr = at(two ? (N === 9 ? 11.0 : 10.8) : 9.2);
    A.push(u => { f0(eo(seg(u, tr - .4, tr))); enter(rb, u, tr, { dy: 10, sc: .94, pop: true, d: .4 }); });
  }

  // source + CTA
  const last = N === 9 ? 1152 : (two ? 844 : rowsY[0] + sideH), srcY = Math.max(last + (N === 9 ? 20 : 28), g.hub.tagline ? CY + 176 + 44 + 24 : CY + 152 + 24), srcT = at(Math.max(T, 0) + 1.2);
  const lab = g.source.label, url = g.source.url || '';
  const s1 = tx(root, 'g-src', lab, { x: url ? 60 : 0, y: srcY, w: url ? 500 : W, h: 40, size: 25, weight: 500, color: C.mid, align: url ? 'right' : 'center' });
  const s2 = url ? tx(root, 'g-url', url, { x: 580, y: srcY, w: 440, h: 40, size: url.length > 28 ? 22 : 27, weight: 700, color: C.clayD }) : null;
  const bar = cta(root, 'gif-cta', D.brand, { x: 90, y: srcY + 64, w: 900, h: 78, size: 26, bw: 4 });
  A.push(u => { enter(s1, u, srcT, { dy: 10 }); if (s2) enter(s2, u, srcT + .2, { dy: 10 }); bar.style.opacity = String(eo(seg(u, .25, .8))); });

  const DUR = Math.round((T + HOLD) * 10) / 10;
  return { DUR, render(u) { A.forEach(f => f(u)); root.style.opacity = String(Math.min(1, 1 - seg(u, DUR - FADE, DUR))); } };
}
