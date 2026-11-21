// Template "ecosystem": one core on the left fans out (flowing arrows) to 3-5 section headers; each section has a rail with item cards hanging off it on stems.
// Every size comes from measurement: type is the largest that fits, cards hug their text, spare height becomes even gaps between sections.
import { C, E, box, tx, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, badge, layer, TOP, BOTTOM } from './gif_common.js';

const HCX = 84, HR = 74, WX = 196, WW = 176, RX0 = WX + WW, IX0 = RX0 + 22, IX1 = 1052, STEM = 30, PADV = 12, CARD_PAD = 12;
const H = (t, o) => Math.ceil(measure(t, o).h);

function plan(secs, k) {                       // k shrinks the maximum type size until everything fits the page
  const avail = BOTTOM - (TOP + 6), out = [];
  for (const sc of secs) {
    const m = sc.items.length, gap = 14, iw = Math.floor((IX1 - IX0 - (m - 1) * gap) / m), tw = iw - 2 * CARD_PAD;
    const ts = Math.min(...sc.items.map(it => fitSize(it.title, { w: tw, h: 56, max: 26 - k, min: 17, weight: 700, lh: 1.1 })));
    const ss = Math.min(...sc.items.map(it => fitSize(it.sub, { w: tw, h: 100, max: 21 - k, min: 15, weight: 500, lh: 1.22 })));
    const th = Math.max(...sc.items.map(it => H(it.title, { size: ts, weight: 700, w: tw, lh: 1.1 }))), sh = Math.max(...sc.items.map(it => H(it.sub, { size: ss, weight: 500, w: tw, lh: 1.22 })));
    const cardH = th + sh + 2 * CARD_PAD + 8, hdr = Math.max(cardH + STEM + 2 * PADV, 118);
    out.push({ m, gap, iw, tw, ts, ss, th, sh, cardH, hdr });
  }
  const tot = out.reduce((a, b) => a + b.hdr, 0) + (secs.length - 1) * 12;
  return { out, fits: tot <= avail, tot, avail };
}

export function buildEcosystem(stage, D) {
  const S = scene(stage, D), g = S.g, EC = g.ecosystem, secs = EC.sections, n = secs.length;
  header(S);
  let k = 0, P0 = plan(secs, k); while (!P0.fits && k < 8) P0 = plan(secs, ++k);
  const gapV = Math.min(34, Math.floor((P0.avail - (P0.tot - (n - 1) * 12)) / Math.max(1, n - 1))), used = P0.out.reduce((a, b) => a + b.hdr, 0) + (n - 1) * gapV;
  let y = TOP + 6 + Math.max(0, Math.round((P0.avail - used) / 2));
  const cy = Math.round(y + used / 2);
  const hub = E(S.root, 'abs', `left:${HCX - HR}px;top:${cy - HR}px;width:${2 * HR}px;height:${2 * HR}px;border-radius:50%;background:#fff;border:3.5px solid ${C.clay};box-sizing:border-box;box-shadow:0 7px 0 ${C.line}`);
  const inner = 2 * HR - 7, hasSub = !!EC.hub.sub, tw_ = inner - (hasSub ? 34 : 22);
  const hts = fitSize(EC.hub.title, { w: tw_, h: hasSub ? 56 : 62, max: 24, min: 16, weight: 600, font: 'serif', lh: 1.1 });
  const sts = hasSub ? fitSize(EC.hub.sub, { w: tw_ - 6, h: 36, max: 17, min: 13, weight: 600, lh: 1.1 }) : 0;
  const th = H(EC.hub.title, { size: hts, weight: 600, font: 'serif', w: tw_, lh: 1.1 }), sh = hasSub ? H(EC.hub.sub, { size: sts, weight: 600, w: tw_ - 6, lh: 1.1 }) : 0;
  // content block: [icon] title [sub]; centred on the circle, and narrower than the chord at its top and bottom edges
  const icon = hasSub ? 0 : 36 + 8, blk = icon + th + (hasSub ? 8 + sh : 0), y0 = Math.round((inner - blk) / 2);
  if (!hasSub) badge(hub, EC.hub.icon || 'layers', PAL.clay, { x: Math.round((inner - 36) / 2), y: y0, s: 36 });
  tx(hub, 'hub-t', EC.hub.title, { x: Math.round((inner - tw_) / 2), y: y0 + icon - 3, w: tw_, h: th + 6, size: hts, weight: 600, font: 'serif', align: 'center', wrap: true, lh: 1.1 });
  if (hasSub) tx(hub, 'hub-s', EC.hub.sub, { x: Math.round((inner - tw_ + 6) / 2), y: y0 + th + 5, w: tw_ - 6, h: sh + 6, size: sts, weight: 600, color: C.clayD, align: 'center', wrap: true, lh: 1.1 });
  reveal(S, hub, .5, { sc: .85, d: .6 });
  let t = 1.4;
  secs.forEach((sc, i) => {
    const Pl = P0.out[i], P = PAL[sc.group], top = y, hh = Pl.hdr, mid = top + hh / 2, cardY = top + PADV, railY = cardY + Pl.cardH + STEM;
    const a = n === 1 ? 0 : (i / (n - 1) - .5) * 1.7, sx = HCX + HR * Math.cos(a), sy = cy + HR * Math.sin(a);
    flow(S, `M${sx} ${sy} C${sx + 30} ${sy} ${WX - 34} ${mid} ${WX - 3} ${mid}`, P.bd, { t0: t, dur: .7, w: 4.5, head: 12 });
    const wedge = box(S.root, { x: WX, y: top, w: WW, h: hh, r: 26, fill: P.soft, bd: P.bd, bw: 3, bg: true, css: `box-shadow:0 5px 0 ${C.line};` });
    const ls = layer(S), ls_ = fitSize(sc.label, { w: WW - 28, h: 84, max: 27, min: 18, weight: 700, lh: 1.08 }), lh_ = H(sc.label, { size: ls_, weight: 700, w: WW - 28, lh: 1.08 }), blockH = 52 + 10 + lh_, by = Math.round((hh - blockH) / 2);
    badge(wedge, sc.icon, { soft: '#fff', ink: P.ink }, { x: Math.round((WW - 6 - 52) / 2), y: by, s: 52 });
    tx(wedge, `w${i}`, sc.label, { x: 8, y: by + 62, w: WW - 22, h: lh_ + 4, size: ls_, weight: 700, color: P.ink, align: 'center', wrap: true, lh: 1.08 });
    reveal(S, wedge, t + .3, { sc: .92, d: .45 });
    flow(S, `M${RX0 + 3} ${railY} H${IX1}`, P.bd, { t0: t + .5, dur: .9, w: 4.5, head: 13, svg: ls });
    sc.items.forEach((it, j) => {
      const x = IX0 + j * (Pl.iw + Pl.gap), mx = x + Pl.iw / 2, tt = t + 1.0 + j * .3;
      const stem = E(S.root, 'abs', `left:${mx - 2}px;top:${cardY + Pl.cardH}px;width:4px;height:${STEM}px;background:${P.bd}`);
      const dot = E(S.root, 'abs', `left:${mx - 8}px;top:${railY - 8}px;width:16px;height:16px;border-radius:50%;background:#fff;border:4px solid ${P.bd};box-sizing:border-box`);
      const off = q => Math.round((Pl.cardH - (H(q.title, { size: Pl.ts, weight: 700, w: Pl.tw, lh: 1.1 }) + 6 + H(q.sub, { size: Pl.ss, weight: 500, w: Pl.tw, lh: 1.22 }))) / 2);   // each card's text block is centred, so cards in one row stay aligned but never look empty
      const b = box(S.root, { x, y: cardY, w: Pl.iw, h: Pl.cardH, r: 18, bd: P.bd, bw: 2.5, css: `box-shadow:0 4px 0 ${C.line};` });
      tx(b, `i${i}${j}-t`, it.title, { x: CARD_PAD, y: off(it) - 5, w: Pl.tw, h: H(it.title, { size: Pl.ts, weight: 700, w: Pl.tw, lh: 1.1 }) + 10, size: Pl.ts, weight: 700, color: P.ink, wrap: true, lh: 1.1 });
      tx(b, `i${i}${j}-s`, it.sub, { x: CARD_PAD, y: off(it) + H(it.title, { size: Pl.ts, weight: 700, w: Pl.tw, lh: 1.1 }) + 1, w: Pl.tw, h: H(it.sub, { size: Pl.ss, weight: 500, w: Pl.tw, lh: 1.22 }) + 10, size: Pl.ss, weight: 500, color: '#45443F', wrap: true, lh: 1.22 });
      reveal(S, b, tt, { dy: 10, sc: .93, d: .45 }); reveal(S, stem, tt + .1, { dy: 0, sc: 1, d: .3 }); reveal(S, dot, tt + .2, { dy: 0, sc: .5, d: .3 });
    });
    t += 1.0 + Pl.m * .3 + .7; y += hh + gapV;
  });
  footer(S);
  return finish(S);
}
