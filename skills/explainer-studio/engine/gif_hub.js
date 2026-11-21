// Template "hub": one central idea with 9 parts around it (top row, side rows, two bottom cards). Hub-and-spoke with flowing arrows.
import { C, E, box, tx, path, circ, draw, headAt, tri, icon, spark, keycap, enter, seg, eo, fit } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, badge, W } from './gif_common.js';

const PH = [[C.blueSoft, C.blueD, C.blue], [C.claySoft, C.clayD, C.clay], [C.greenSoft, C.greenD, C.green]];
const CX = 540, R = 140;
// vertical plan (1350 canvas): top row 150-330, side rows 358-628 / 646-916, bottom cards 944-1210, CTA 1240
const TOPY = 150, TOPH = 180, ROW = [358, 646], SIDEH = 270, BOTY = 944, BOTH = 266, CY = 637;

function card(S, id, c, { x, y, w, h }) {
  const g = S.g, P = PAL[c.group], b = box(S.root, { x, y, w, h, r: 26, bd: P.bd, bw: 2.5, css: `box-shadow:0 6px 0 ${C.line};` });
  badge(b, c.icon, P, { x: 14, y: 12, s: 52 });
  tx(b, id + '-t', c.title, { x: 78, y: 8, w: w - 88, h: 36, size: c.title.length > 20 ? 23 : 25, weight: 700 });
  tx(b, id + '-g', g.groups[c.group], { x: 78, y: 42, w: w - 88, h: 24, size: 18, weight: 700, color: P.ink, ls: .12 });
  E(b, 'abs', `left:16px;right:16px;top:72px;height:0;border-top:2px dashed ${C.line}`);
  return b;
}
const body = (b, id, text, { w, h, size }) => tx(b, id, text, { x: 13, y: 82, w, h, size, weight: 500, color: C.mid, wrap: true, lh: 1.27, css: 'align-items:flex-start;' });

export function buildHub(stage, D) {
  const S = scene(stage, D), g = S.g, cards = g.cards, { root, svg, A, at } = S;
  header(S);
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
  at(3.0);
  // slots: 0-2 top row, 3 left1, 4 right1, 5 left2, 6 right2, 7 bottom-left (wide), 8 bottom-right
  const topX = [24, 372, 720], SL = 24, SR = 726, SW = 330;
  const slot = i => i < 3 ? { x: topX[i], y: TOPY, w: 336, h: TOPH, kind: 'top' }
    : i === 3 ? { x: SL, y: ROW[0], w: SW, h: SIDEH, kind: 'side' } : i === 4 ? { x: SR, y: ROW[0], w: SW, h: SIDEH, kind: 'side' }
    : i === 5 ? { x: SL, y: ROW[1], w: SW, h: SIDEH, kind: 'side' } : i === 6 ? { x: SR, y: ROW[1], w: SW, h: SIDEH, kind: 'side' }
    : i === 7 ? { x: 24, y: BOTY, w: 640, h: BOTH, kind: 'wide' } : { x: 684, y: BOTY, w: 372, h: BOTH, kind: 'narrow' };
  const order = [0, 1, 2, 3, 5, 4, 6, 7, 8], times = [3.2, 4.2, 5.2, 6.6, 7.6, 8.8, 9.8];
  const rowC = [ROW[0] + SIDEH / 2, ROW[1] + SIDEH / 2], elbow = TOPY + TOPH + 16;
  const pathFor = i => {
    const lft = i === 3 || i === 5, row = i <= 4 ? 0 : 1;
    if (i < 3) return [`M${CX - 107} ${CY - 107} V${elbow} H192 V${TOPY + TOPH + 2}`, `M${CX} ${CY - 152} V${TOPY + TOPH + 2}`, `M${CX + 107} ${CY - 107} V${elbow} H888 V${TOPY + TOPH + 2}`][i];
    const side = lft ? -1 : 1, x0 = CX + side * 143, xv = CX + side * 169, xe = lft ? 358 : 722;
    return `M${x0} ${CY + (row ? 52 : -52)} H${xv} V${rowC[row]} H${xe}`;
  };
  // tagline ribbon under the hub
  const ribY = CY + 176, ribB = ribY + 44;
  const rb = box(root, { x: 375, y: ribY, w: 330, h: 44, r: 22, fill: C.ink, bd: C.ink, shadow: false });
  tx(rb, 'rib', g.hub.tagline, { x: 0, y: 0, w: 326, h: 40, size: g.hub.tagline.length > 22 ? 21 : 24, weight: 600, color: '#fff', align: 'center' });
  flow(S, `M${CX} ${CY + 152} V${ribY - 2}`, C.ink, { t0: 10.4, dur: .4 }); reveal(S, rb, 10.8, { d: .4, dy: 10 });

  order.forEach((i, k) => {
    const c = cards[i], s = slot(i), id = 'c' + i, b = card(S, id, c, s), P = PAL[c.group];
    const FIT = { top: [[34, 24], [48, 22], [200, 21]], side: [[60, 28], [92, 25], [200, 23]], wide: [[70, 30], [110, 27], [200, 25]], narrow: [[40, 30], [70, 27], [200, 25]] };
    const sz = fit(c.body || '', FIT[s.kind]), bw = s.w - 26;
    const t0 = i < 7 ? times[k] : i === 7 ? 11.8 : 13.4, kids = [];
    if (i < 7) { flow(S, pathFor(i), P.bd, { t0: t0 - .55, dur: .55 }); reveal(S, b, t0); }
    if (c.kind === 'chips') {
      c.items.forEach((m, j) => {
        const mb = box(b, { x: 16 + (j % 2) * 312, y: 84 + Math.floor(j / 2) * 88, w: 296, h: 76, r: 18, fill: P.soft, bd: P.bd, bw: 2, shadow: false });
        tx(mb, `${id}-m${j}`, m.l, { x: 14, y: 5, w: 270, h: 34, size: 25, weight: 700, color: P.ink }); tx(mb, `${id}-m${j}d`, m.d, { x: 14, y: 38, w: 272, h: 32, size: 19, weight: 500, color: C.ink });
        kids.push(mb);
      });
    } else if (c.kind === 'dialog') {
      let y = 82; const HH = [46, 42, 74], WW = [224, 330, 330];
      c.turns.slice(0, 3).forEach((u, j) => {
        const me = u.who === 'user', w = WW[j], h = HH[j], tb = box(b, { x: me ? s.w - w - 16 : 16, y, w, h, r: 22, fill: me ? C.sand : '#fff', bd: me ? C.lineD : C.line, shadow: false });
        tx(tb, `${id}-d${j}`, u.text, { x: 12, y: 0, w: w - 24, h: h - 4, size: j === 0 ? 22 : 19, weight: 600, wrap: true, lh: 1.2, align: j === 0 ? 'center' : 'left' });
        y += h + 10; kids.push(tb);
      });
    } else {
      body(b, id + '-b', c.body, { w: bw, h: s.h - 82 - 12, size: sz });
      if (c.kind === 'keys') c.keys.slice(0, 3).forEach((kk, j) => kids.push(keycap(b, `${id}-k${j}`, kk, { x: 16 + j * 86, y: s.h - 66, w: 76, h: 50, size: 22 })));
    }
    if (i === 7) { flow(S, `M470 ${ribB} V${BOTY - 2}`, P.bd, { t0: t0 - .55, dur: .55 }); reveal(S, b, t0, { dy: 14 }); kids.forEach((m, j) => reveal(S, m, 12.5 + j * .35, { dy: 8, sc: .92, d: .35 })); }
    else if (i === 8) { flow(S, `M610 ${ribB} V${ribB + 22} H700 V${BOTY - 2}`, C.mid, { t0: 12.2, dur: .6 }); reveal(S, b, t0, { dy: 14 }); kids.forEach((m, j) => reveal(S, m, 14.0 + j * .7, { dx: j === 1 ? -24 : 30, dy: 6, sc: .94, d: .4 })); }
    else if (kids.length) A.push(u => kids.forEach((m, j) => { if (c.kind === 'keys') m.pressAt(Math.sin(seg(u, t0 + 1.0 + j * .5, t0 + 1.3 + j * .5) * Math.PI)); }));
  });
  footer(S);
  return finish(S);
}
