// Template "funnel": stages that narrow from top to bottom (a conversion funnel, a filter, a shrinking pool). Each bar's width is its share (pct) of the first stage; the bar grows in, then its value pops.
import { C, E, tx, enter, seg, eo, icon, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, TOP, BOTTOM } from './gif_common.js';

export function buildFunnel(stage, D) {
  const S = scene(stage, D), K = S.g.funnel, R = K.stages, n = R.length;
  header(S);
  const FW = 940, X0 = (1080 - FW) / 2, pitch = Math.floor((BOTTOM - TOP - 20) / n), BH = Math.min(118, Math.round(pitch * .58)), ss = Math.min(...R.map(r => fitSize(r.sub, { w: FW - 40, h: pitch - BH - 8, max: 26, min: 18, weight: 500, lh: 1.2 })));
  let t = .6;
  R.forEach((r, i) => {
    const P = PAL[r.group], w = Math.max(600, Math.round(FW * Math.max(0, Math.min(100, r.pct)) / 100)), cx = 540, y = TOP + 10 + i * pitch;
    const bar = E(S.root, 'abs', `left:${cx - w / 2}px;top:${y}px;width:${w}px;height:${BH}px;border-radius:24px;background:${P.soft};border:3px solid ${P.bd};box-shadow:0 5px 0 ${C.line};opacity:0;transform-origin:50% 50%`);
    const ic = E(bar, 'abs', `left:16px;top:${(BH - 46) / 2}px;width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center`, icon(r.icon, 28, P.ink, 2.1));
    const tw = w - 80 - 170;
    tx(bar, 'f' + i + '-t', r.title, { x: 74, y: 6, w: tw, h: BH - 12, size: fitSize(r.title, { w: tw, h: BH - 12, max: 32, min: 20, weight: 700, lh: 1.1 }), weight: 700, wrap: true, lh: 1.1, color: P.ink });
    const val = tx(bar, 'f' + i + '-v', r.value, { x: w - 170, y: 4, w: 150, h: BH - 8, size: r.value.length > 5 ? 36 : 46, weight: 700, font: 'serif', align: 'right', color: P.ink });
    const sub = tx(S.root, 'f' + i + '-s', r.sub, { x: 130, y: y + BH + 6, w: FW - 120, h: pitch - BH - 10, size: ss, weight: 500, color: '#45443F', align: 'center', wrap: true, lh: 1.2 });
    S.at(t + .9);
    S.B.push(bar);
    S.A.push(u => {
      const k = eo(seg(u, t, t + .6)); bar.style.opacity = String(seg(u, t, t + .15)); bar.style.clipPath = `inset(0 ${Math.round((1 - k) * 50)}% 0 ${Math.round((1 - k) * 50)}% round 24px)`;
      enter(val, u, t + .45, { dy: 0, sc: .7, pop: true, d: .45 }); enter(ic, u, t + .3, { dy: 0, sc: .5, pop: true, d: .4 });
    });
    reveal(S, sub, t + .5, { dy: 8, d: .4, sc: 1, pop: false }); t += .8;
  });
  footer(S);
  return finish(S);
}
