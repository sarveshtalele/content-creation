// Template "conveyor" (v2, data-driven): an isometric belt through 3-4 gates. Every gate has a pass rate (ring gauge on the gate, count-up bar in the tally panel);
// boxes ride the belt, turn the gate's colour when they pass, and the share that fails drops off the belt at that gate. Everything is a pure function of time.
// Dataviz choices (animated-infographic practice): staged reveal, count-up numbers, progress ring + bar for the same value, motion that encodes data (who drops off), one accent per gate.
import { C, E, box, tx, enter, seg, eo, icon, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP } from './gif_common.js';
import { mix, uniformSub } from './gif_3d.js';
import { svgNS } from './kit.js';

const el = (g, tag, a) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); g.appendChild(e); return e; };
const poly = (g, pts, fill, stroke, sw = 3) => el(g, 'polygon', { points: pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' '), fill, stroke: stroke || 'none', 'stroke-width': sw, 'stroke-linejoin': 'round' });
const NCUBE = 10, RANK = [3, 7, 1, 9, 5, 0, 8, 2, 6, 4];                                      // rank decides which boxes fail first: fixed, so every render is identical
const parseStat = v => { const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(v); return m ? { pre: m[1], num: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, suf: m[3] } : null; };
const fmt = (st, k) => st.pre + (st.num * k).toLocaleString('en-US', { minimumFractionDigits: st.dec, maximumFractionDigits: st.dec }) + st.suf;

export function buildConveyor(stage, D) {
  const S = scene(stage, D), V = S.g.conveyor, G = V.gates, n = G.length;
  // studio look (grey infinity floor, soft light pool, orange belt): replaces the flat paper background for this template
  const studio = E(S.root, 'abs', 'left:0;top:0;width:1080px;height:1350px;background:radial-gradient(900px 700px at 55% 45%,#F4F5F7,#D5D9DF 70%,#BCC1C9);'); S.root.insertBefore(studio, S.root.firstChild);
  header(S);
  const A0 = [90, 400], B0 = [990, 860], dx = B0[0] - A0[0], dy = B0[1] - A0[1], O = [42, -21], TH = 20, POST = 124, CW = 316, CH = 128, SL = dy / dx;
  const at = f => [A0[0] + dx * f, A0[1] + dy * f], fr = i => (i + .72) / (n + .44);
  const backY = x => A0[1] + SL * (x - O[0] - A0[0]) + O[1], frontY = x => A0[1] + SL * (x + O[0] - A0[0]) - O[1] + TH;
  // pass rates -> which boxes fail where
  const pass = G.map(g => Math.max(0, Math.min(1, (g.stat.pct ?? 100) / 100)));
  let left = NCUBE; const cut = pass.map(p => { const lose = Math.round(left * (1 - p)); left -= lose; return NCUBE - left; });   // cumulative boxes lost after gate i
  const failAt = r => cut.findIndex(c => r < c);                                                 // first gate whose cumulative loss reaches this rank (-1: survives)
  // belt
  const belt = el(S.svg, 'g', {}); belt.style.opacity = '0';
  const sa = [A0[0] + O[0], A0[1] + O[1]], sb = [A0[0] - O[0], A0[1] - O[1]], ea = [B0[0] + O[0], B0[1] + O[1]], eb = [B0[0] - O[0], B0[1] - O[1]];
  poly(belt, [sb, eb, [eb[0], eb[1] + TH], [sb[0], sb[1] + TH]], '#C8651F', '#9A4A12');
  poly(belt, [eb, ea, [ea[0], ea[1] + TH], [eb[0], eb[1] + TH]], '#E67A25', '#9A4A12');
  poly(belt, [sa, ea, eb, sb], '#F5923E', '#C8651F');
  const rollers = []; for (let i = 0; i < 34; i++) rollers.push(el(belt, 'line', { stroke: '#FFC48A', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  const ROLL = 26;
  S.A.push(u => { belt.style.opacity = String(seg(u, .2, .7)); rollers.forEach((r, i) => { const s = ((i * ROLL + u * 34) % (34 * ROLL)) / (34 * ROLL), p = at(s); r.setAttribute('x1', p[0] + O[0] * .94); r.setAttribute('y1', p[1] + O[1] * .94); r.setAttribute('x2', p[0] - O[0] * .94); r.setAttribute('y2', p[1] - O[1] * .94); }); });
  S.at(.7);
  // light curtains at the gates (pulse when a box passes), drawn under the boxes
  const curtains = G.map((gt, i) => { const p = at(fr(i)), bt = [p[0] + O[0] + 4, p[1] + O[1] + 6], ft = [p[0] - O[0] - 4, p[1] - O[1] + 10], cu = poly(S.svg, [bt, ft, [ft[0], ft[1] - POST], [bt[0], bt[1] - POST]], PAL[gt.group].bd, null); cu.style.opacity = '0'; return cu; });
  // boxes
  const bx = Array.from({ length: NCUBE }, () => el(S.svg, 'g', {})), marks = Array.from({ length: NCUBE }, () => el(S.svg, 'g', {}));
  const cube = (g, p, c, s = 24, op = 1) => { g.replaceChildren(); poly(g, [[p[0] - s, p[1] - s * .5], [p[0], p[1]], [p[0], p[1] + s * 1.1], [p[0] - s, p[1] + s * .6]], mix(c, .45), c, 2.5); poly(g, [[p[0], p[1]], [p[0] + s, p[1] - s * .5], [p[0] + s, p[1] + s * .6], [p[0], p[1] + s * 1.1]], c, c, 2.5); poly(g, [[p[0], p[1] - s], [p[0] + s, p[1] - s * .5], [p[0], p[1]], [p[0] - s, p[1] - s * .5]], mix(c, .78), c, 2.5); g.style.opacity = String(op); };
  const colors = G.map(g => PAL[g.group].bd), start = mix(C.ink, .55), BAD = C.clayD, SPD = .11;
  const pulse = new Array(n).fill(0);
  S.A.push(u => {
    pulse.fill(0);
    bx.forEach((g, j) => {
      const f = (((u * SPD) + j / NCUBE) % 1), pos = .04 + f * .92, rk = RANK[j], bad = failAt(rk), rej = bad >= 0 && pos > fr(bad);
      const ps = G.filter((_, i) => pos > fr(i) && (bad < 0 || i < bad)).length;                       // gates passed (a failed box never passes its failing gate)
      G.forEach((_, i) => { pulse[i] = Math.max(pulse[i], Math.exp(-Math.pow((pos - fr(i)) / .035, 2))); });
      const edge = Math.min(1, f * 14) * Math.min(1, (1 - f) * 14) * seg(u, .9, 1.3);
      const m = marks[j]; m.replaceChildren(); m.style.opacity = '0';
      if (!rej) { const p = at(pos); cube(g, [p[0], p[1] - 20 - Math.sin((u * 2 + j) * 3) * 1.2], ps ? colors[ps - 1] : start, 24, edge); return; }
      const k = seg(pos, fr(bad), fr(bad) + .075), q = at(fr(bad) + k * .075), fall = k * k;                // falls off the front edge: slides out, drops, fades
      cube(g, [q[0] - 54 * k, q[1] - 20 + 34 * k + 120 * fall], BAD, 24 * (1 - .25 * k), edge * (1 - seg(k, .55, 1)));
      const kk = seg(k, 0, .35) * (1 - seg(k, .6, 1)); if (kk > 0) { const c = at(fr(bad)); m.style.opacity = String(kk); el(m, 'circle', { cx: c[0], cy: c[1] - 44, r: 15, fill: '#fff', stroke: BAD, 'stroke-width': 3.5 }); el(m, 'path', { d: `M${c[0] - 6} ${c[1] - 50} l12 12 M${c[0] + 6} ${c[1] - 50} l-12 12`, stroke: BAD, 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none' }); }
    });
    curtains.forEach((cu, i) => { cu.style.opacity = String(seg(u, 1.2 + i, 1.8 + i) * (.07 + .3 * pulse[i])); });
  });
  // gates: arch, ring gauge + icon tile, number badge, card with a vertical leader
  const ls = layer(S), ss = uniformSub(G, { w: CW - 28, h: CH - 62 - 10, max: 20, min: 15 });
  let t = 1.1; const cardBottoms = [];
  G.forEach((gt, i) => {
    const Pl = PAL[gt.group], p = at(fr(i)), up = i % 2 === 0, g = el(S.svg, 'g', {}); g.style.opacity = '0';
    const bt = [p[0] + O[0] + 4, p[1] + O[1] + 6], ft = [p[0] - O[0] - 4, p[1] - O[1] + 10], mid = [p[0], (bt[1] + ft[1]) / 2 - POST];
    for (const f of [bt, ft]) el(g, 'line', { x1: f[0], y1: f[1], x2: f[0], y2: f[1] - POST, stroke: Pl.bd, 'stroke-width': 12, 'stroke-linecap': 'round' });
    el(g, 'line', { x1: bt[0], y1: bt[1] - POST, x2: ft[0], y2: ft[1] - POST, stroke: Pl.bd, 'stroke-width': 14, 'stroke-linecap': 'round' });
    const R = 34, CIRC = 2 * Math.PI * R, ring = el(S.svg, 'g', {});                                      // ring gauge: pass rate of this gate
    el(ring, 'circle', { cx: mid[0], cy: mid[1], r: R, fill: '#fff', stroke: mix(Pl.bd, .8), 'stroke-width': 7 });
    const arc = el(ring, 'circle', { cx: mid[0], cy: mid[1], r: R, fill: 'none', stroke: Pl.bd, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${CIRC}`, transform: `rotate(-90 ${mid[0]} ${mid[1]})` }); ring.style.opacity = '0';
    const tile = E(S.root, 'abs', `left:${mid[0] - 25}px;top:${mid[1] - 25}px;width:50px;height:50px;border-radius:50%;background:${Pl.soft};display:flex;align-items:center;justify-content:center;opacity:0;box-sizing:border-box`, icon(gt.icon, 28, Pl.ink, 2.1));
    const nb = E(S.root, 'abs', `left:${mid[0] - 56}px;top:${mid[1] - 52}px;width:28px;height:28px;border-radius:50%;background:${Pl.bd};color:#fff;font:700 17px/28px Inter,sans-serif;text-align:center;opacity:0`); nb.textContent = String(i + 1);
    const cx0 = Math.min(1056 - CW, Math.max(24, p[0] - CW / 2)); let cy0, y1, y2;
    if (up) { const bottom = Math.max(TOP + 8 + CH, Math.min(mid[1] - R - 6 - 56, backY(cx0) - 16)); cy0 = bottom - CH; y1 = mid[1] - R - 8; y2 = bottom + 4; }
    else { const top = Math.max(frontY(p[0]) + 34, frontY(cx0 + CW) + 16); cy0 = top; y1 = frontY(p[0]) + 8; y2 = top - 4; }
    cardBottoms.push(cy0 + CH);
    reveal(S, g, t, { sc: 1, dy: 18, d: .5 }); S.A.push(u => { ring.style.opacity = String(seg(u, t + .15, t + .45)); arc.setAttribute('stroke-dasharray', `${CIRC * pass[i] * eo(seg(u, t + .4, t + 1.3))} ${CIRC}`); });
    reveal(S, tile, t + .25, { d: .35 }); reveal(S, nb, t + .3, { d: .3 });
    flow(S, `M${p[0]} ${y1} L${p[0]} ${y2}`, Pl.bd, { t0: t + .55, dur: .45, w: 4, head: 13, svg: ls });
    const c = node(S, 'c' + i, { x: cx0, y: cy0, w: CW, h: CH, title: gt.title, sub: gt.sub, ic: gt.icon, group: gt.group, tsize: 24, ssize: ss });
    reveal(S, c, t + .85, { dy: 12 }); t += 1.0;
  });
  // tally panel: one bar per gate, same value as the ring, numbers count up
  const py = Math.round(Math.max(Math.max(...cardBottoms) + 22, 1216 - (58 + n * 50))), ph = 1216 - py, rh = Math.min(52, Math.floor((ph - 58) / n));
  const panel = box(S.root, { x: 24, y: py, w: 1032, h: ph, r: 26, fill: '#fff', bd: C.line, bw: 2.5, shadow: false });
  tx(panel, 'tally', V.tally, { x: 22, y: 8, w: 900, h: 34, size: 23, weight: 700, color: C.mid });
  const TX = 262, TW = 590, tt0 = t + .2;
  G.forEach((gt, i) => {
    const Pl = PAL[gt.group], ry = 50 + i * rh, st = parseStat(gt.stat.value);
    E(panel, 'abs', `left:22px;top:${ry + (rh - 16) / 2}px;width:16px;height:16px;border-radius:50%;background:${Pl.bd}`);
    tx(panel, 'tl' + i, gt.title, { x: 46, y: ry, w: 205, h: rh, size: 22, weight: 600 });
    E(panel, 'abs', `left:${TX}px;top:${ry + (rh - 20) / 2}px;width:${TW}px;height:20px;border-radius:10px;background:${C.line}`);
    const fill = E(panel, 'abs', `left:${TX}px;top:${ry + (rh - 20) / 2}px;width:${Math.round(TW * pass[i])}px;height:20px;border-radius:10px;background:${Pl.bd};transform-origin:0 50%;transform:scaleX(0)`);
    const val = tx(panel, 'tv' + i, gt.stat.value, { x: TX + TW + 14, y: ry, w: 1032 - (TX + TW + 14) - 22, h: rh, size: 27, weight: 700, color: Pl.ink, align: 'right' }), span = val.firstChild;
    S.A.push(u => { const k = eo(seg(u, tt0 + i * .35, tt0 + i * .35 + .9)); fill.style.transform = `scaleX(${k})`; if (st) span.textContent = fmt(st, k); });
  });
  reveal(S, panel, t, { dy: 16, d: .5 }); S.at(tt0 + (n - 1) * .35 + .9);
  footer(S);
  return finish(S);
}
