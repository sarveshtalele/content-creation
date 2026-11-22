// Template "skyline": a city of isometric towers whose heights show a ranking (size 1-10). A value flag sits on each roof, windows light up one by one, and a label card stands under every tower.
import { C, E, box, tx, enter, seg, eo, icon, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, node, TOP, BOTTOM } from './gif_common.js';
import { mix, uniformSub } from './gif_3d.js';
import { svgNS, roundPts } from './kit.js';

const hash = (a, b, c) => { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) % 100; };
const poly = (g, pts, fill, stroke, sw = 3) => { const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', roundPts(pts, 6, true)); p.setAttribute('fill', fill); if (stroke) { p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', sw); p.setAttribute('stroke-linejoin', 'round'); } g.appendChild(p); return p; };

export function buildSkyline(stage, D) {
  const S = scene(stage, D), K = S.g.skyline, B = K.buildings, n = B.length;
  header(S);
  const pitch = Math.floor((1080 - 48) / n), HW = Math.min(104, Math.floor(pitch / 2) - 6), HH = Math.round(HW / 2), BASE = 925, FLAG_W = Math.min(156, pitch - 12), FLAG_H = 54;
  const x = i => 540 + (i - (n - 1) / 2) * pitch, hgt = b => 110 + b.size * 44;                              // size 1..10 -> 154..550 px
  const CARD_Y = BASE + HH + 40, CH = Math.min(BOTTOM - CARD_Y - 4, 134), CW = Math.min(300, pitch - 14);
  const street = E(S.root, 'abs', `left:24px;top:${BASE + HH + 14}px;width:1032px;height:12px;border-radius:6px;background:${C.line};opacity:0`);
  reveal(S, street, .3, { sc: 1, dy: 0, d: .5 });
  const ss = uniformSub(B, { w: CW - 36, h: CH - Math.round(CH * .42) - 22, max: 19, min: 15 });
  const chOf = b => Math.min(CH, Math.round((62 + Math.ceil(measure(b.sub, { size: ss, weight: 500, w: CW - 28, lh: 1.24 }).h) + 14)));
  let t = .7;
  B.forEach((b, i) => {
    const Pl = PAL[b.group], cx = x(i), H = hgt(b), cy = BASE - H, g = document.createElementNS(svgNS, 'g'); g.style.opacity = '0'; S.svg.appendChild(g);
    poly(g, [[cx - HW, cy], [cx, cy + HH], [cx, cy + HH + H], [cx - HW, cy + H]], mix(Pl.bd, .5), Pl.bd);
    poly(g, [[cx, cy + HH], [cx + HW, cy], [cx + HW, cy + H], [cx, cy + HH + H]], mix(Pl.bd, .12), Pl.bd);
    poly(g, [[cx, cy - HH], [cx + HW, cy], [cx, cy + HH], [cx - HW, cy]], mix(Pl.bd, .82), Pl.bd);
    poly(g, [[cx - 34, cy - 4], [cx, cy - 4 - 17], [cx + 34, cy - 4], [cx, cy - 4 + 17]], mix(Pl.bd, .55), null);                  // rooftop pad
    const wins = [], rows = Math.max(2, Math.floor((H - 34) / 44));
    for (const side of [0, 1]) for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) {          // windows: bilinear cells on each face
      const a0 = (c + .18) / 3, a1 = (c + .82) / 3, b1 = 1 - (r * 44 + 22) / H, b0 = b1 - 22 / H;
      const pt = (a, v) => side === 0 ? [cx - HW + a * HW, cy + a * HH + (1 - v) * H] : [cx + a * HW, cy + HH - a * HH + (1 - v) * H];
      const w = poly(g, [pt(a0, b1), pt(a1, b1), pt(a1, b0), pt(a0, b0)], hash(i, side * 9 + r, c) % 3 ? '#FFF6D6' : mix(Pl.bd, .7), Pl.bd, 1.5); w.style.opacity = '0';
      wins.push({ w, on: hash(i, r, c + side * 5) / 100 * 1.1, lit: hash(i, side * 9 + r, c) % 3 !== 0 });
    }
    S.at(t + 1.9);
    S.A.push(u => {                                                                                      // grow from the street, then the lights come on
      const k = eo(seg(u, t, t + .8)); g.style.opacity = String(seg(u, t, t + .15)); g.style.transformOrigin = `${cx}px ${BASE + HH}px`; g.style.transform = `scale(1,${.02 + .98 * k})`;
      wins.forEach(({ w, on, lit }) => { w.style.opacity = String(seg(u, t + .8 + on, t + 1.0 + on) * (lit ? 1 : .55)); });
    });
    const fl = box(S.root, { x: cx - FLAG_W / 2, y: cy - HH - 10 - FLAG_H - 8, w: FLAG_W, h: FLAG_H, r: 16, fill: '#fff', bd: Pl.bd, bw: 3 });
    E(fl, 'abs', `left:12px;top:${(FLAG_H - 30) / 2}px;width:30px;height:30px;display:flex;align-items:center;justify-content:center`, icon(b.icon, 28, Pl.ink, 2.1));
    tx(fl, 'v' + i, b.value, { x: 46, y: 0, w: FLAG_W - 54, h: FLAG_H - 4, size: b.value.length > 5 ? 24 : 30, weight: 700, color: Pl.ink, align: 'center' });
    reveal(S, fl, t + .75, { dy: 10, d: .4 });
    const c = node(S, 'k' + i, { x: cx - CW / 2, y: CARD_Y, w: CW, h: chOf(b), title: b.title, sub: b.sub, group: b.group, tsize: 23, ssize: ss, center: true });
    reveal(S, c, t + 1.0, { dy: 12 }); t += .75;
  });
  footer(S);
  return finish(S);
}
