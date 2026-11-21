// Template "ecosystem": one core on the left fans out to 3-5 sections. Each section is a labelled pill on a rail; items hang off the rail on stems. Spokes and rails carry flowing dots.
import { C, E, box, tx, circ, enter, seg, eo, spark } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, badge, layer, TOP, BOTTOM } from './gif_common.js';

const CX = 104, R = 88, PX = 216, PW = 190, RX0 = PX + PW, RX1 = 1050, IX0 = 428;

function item(S, id, it, P, { x, y, w, h }) {
  const b = box(S.root, { x, y, w, h, r: 18, bd: P.bd, bw: 2.5, css: `box-shadow:0 4px 0 ${C.line};` });
  tx(b, id + '-t', it.title, { x: 12, y: 8, w: w - 24, h: 52, size: it.title.length > 18 && w < 250 ? 20 : 22, weight: 700, wrap: true, lh: 1.12, color: P.ink, css: 'align-items:flex-start;' });
  tx(b, id + '-s', it.sub, { x: 12, y: 62, w: w - 24, h: h - 70, size: 17, weight: 500, color: C.mid, wrap: true, lh: 1.22, css: 'align-items:flex-start;' });
  return b;
}

export function buildEcosystem(stage, D) {
  const S = scene(stage, D), g = S.g, EC = g.ecosystem, secs = EC.sections, n = secs.length;
  header(S);
  const top0 = TOP + 6, secH = Math.floor((BOTTOM - top0) / n), cardH = Math.min(150, secH - 64), cy = Math.round((top0 + BOTTOM) / 2);
  const hub = E(S.root, 'abs', `left:${CX - R}px;top:${cy - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;background:#fff;border:3.5px solid ${C.clay};box-sizing:border-box;box-shadow:0 7px 0 ${C.line}`);
  badge(hub, EC.hub.icon || 'layers', PAL.clay, { x: R - 3.5 - 21, y: 12, s: 42 });
  tx(hub, 'hub-t', EC.hub.title, { x: 10, y: 58, w: 2 * R - 27, h: EC.hub.sub ? 62 : 90, size: EC.hub.title.length > 14 ? 22 : 26, weight: 600, font: 'serif', align: 'center', wrap: true, lh: 1.1 });
  if (EC.hub.sub) tx(hub, 'hub-s', EC.hub.sub, { x: 10, y: 120, w: 2 * R - 27, h: 36, size: 16, weight: 600, color: C.clayD, align: 'center', wrap: true, lh: 1.1 });
  reveal(S, hub, .5, { sc: .85, d: .6 });
  let t = 1.4;
  secs.forEach((sc, i) => {
    const P = PAL[sc.group], top = top0 + i * secH, block = cardH + 40, by = top + Math.round((secH - block) / 2), railY = by + block - 2, cardY = by;
    const a = (n === 1 ? 0 : (i / (n - 1) - .5) * 1.5), sx = CX + R * Math.cos(a), sy = cy + R * Math.sin(a);
    flow(S, `M${sx} ${sy} C${sx + 70} ${sy} ${PX - 70} ${railY} ${PX - 2} ${railY}`, P.bd, { t0: t, dur: .7, w: 4.5, head: 13 });
    const band = box(S.root, { x: PX + PW / 2, y: top + 2, w: RX1 + 12 - (PX + PW / 2), h: secH - 4, r: 26, fill: P.soft, bd: P.bd, bw: 2, shadow: false, css: 'border-style:dashed;opacity:.85' });
    reveal(S, band, t, { dy: 6, sc: .98, d: .4 }); const ls = layer(S);
    flow(S, `M${RX0 + 2} ${railY} H${RX1}`, P.bd, { t0: t + .5, dur: .9, w: 4.5, head: 13, svg: ls });
    const pill = box(S.root, { x: PX, y: railY - 34, w: PW, h: 68, r: 34, fill: P.soft, bd: P.bd, bw: 3, css: `box-shadow:0 4px 0 ${C.line};` });
    badge(pill, sc.icon, { soft: '#fff', ink: P.ink }, { x: 10, y: 11, s: 44 });
    tx(pill, `p${i}`, sc.label, { x: 60, y: 4, w: PW - 72, h: 56, size: sc.label.length > 9 ? 19 : 22, weight: 700, color: P.ink, wrap: true, lh: 1.08 });
    reveal(S, pill, t + .3, { sc: .9, d: .45 });
    const m = sc.items.length, gap = 14, iw = Math.floor((RX1 - IX0 - (m - 1) * gap) / m);
    sc.items.forEach((it, j) => {
      const x = IX0 + j * (iw + gap), mid = x + iw / 2, tt = t + 1.0 + j * .3;
      const stem = E(S.root, 'abs', `left:${mid - 2}px;top:${cardY + cardH}px;width:4px;height:${railY - cardY - cardH}px;background:${P.bd}`);
      const dot = E(S.root, 'abs', `left:${mid - 8}px;top:${railY - 8}px;width:16px;height:16px;border-radius:50%;background:#fff;border:4px solid ${P.bd};box-sizing:border-box`);
      const b = item(S, `i${i}${j}`, it, P, { x, y: cardY, w: iw, h: cardH });
      reveal(S, b, tt, { dy: 10, sc: .93, d: .45 }); reveal(S, stem, tt + .1, { dy: 0, sc: 1, d: .3 }); reveal(S, dot, tt + .2, { dy: 0, sc: .5, d: .3 });
    });
    t += 1.0 + m * .3 + .7;
  });
  footer(S);
  return finish(S);
}
