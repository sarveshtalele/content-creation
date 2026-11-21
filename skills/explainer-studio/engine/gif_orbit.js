// Template "orbit": a glossy core with three tilted rings (CSS 3D) and 4-6 flat cards around it; flowing-dot arrows run from the core to every card.
import { C, E, box, tx, enter, seg, eo, fitSize, measure } from './kit.js';
import { PAL, scene, header, footer, finish, reveal, flow, node, layer, TOP, BOTTOM } from './gif_common.js';
import { rayRect, mix, uniformSub } from './gif_3d.js';

export function buildOrbit(stage, D) {
  const S = scene(stage, D), O = S.g.orbit, N = O.items, n = N.length;
  header(S);
  const CX = 540, CY = 690, R = 368, CW = 280, CH = 124, SR = 120;
  // three tilted rings, each with a moon travelling along it
  const rings = [0, 60, 120].map((a0, k) => {
    const w = E(S.root, 'abs', `left:${CX}px;top:${CY}px;width:0;height:0;opacity:0`), D2 = 2 * 205;
    const tilt = E(w, 'abs', `left:${-D2 / 2}px;top:${-D2 / 2}px;width:${D2}px;height:${D2}px;transform:rotateZ(${a0}deg) rotateX(72deg)`);
    E(tilt, 'abs', `left:0;top:0;width:${D2}px;height:${D2}px;border-radius:50%;border:3px solid ${[C.blue, C.green, C.clay][k]};box-sizing:border-box;opacity:.85`);
    const spin = E(tilt, 'abs', `left:0;top:0;width:${D2}px;height:${D2}px`); E(spin, 'abs', `left:${D2 / 2 - 9}px;top:-9px;width:18px;height:18px;border-radius:50%;background:${[C.blue, C.green, C.clay][k]};border:3px solid #fff;box-sizing:border-box`);
    return { w, spin, a0, k };
  });
  // core: glossy sphere with the hub text inside
  const core = E(S.root, 'abs', `left:${CX - SR}px;top:${CY - SR}px;width:${2 * SR}px;height:${2 * SR}px;border-radius:50%;background:radial-gradient(circle at 32% 24%,${mix(C.clay, .35)} 0%,${C.clay} 42%,${C.clayD} 100%);box-shadow:0 14px 0 ${C.line},0 24px 40px rgba(20,20,19,.18);opacity:0`);
  const ink = '#fff', tw = 2 * SR - 64, ts = fitSize(O.hub.title, { w: tw, h: 84, max: 30, min: 18, weight: 700, font: 'serif', lh: 1.08 }), th = Math.ceil(measure(O.hub.title, { size: ts, weight: 700, font: 'serif', w: tw, lh: 1.08 }).h);
  const ss = O.hub.sub ? fitSize(O.hub.sub, { w: tw, h: 40, max: 17, min: 13, weight: 600, lh: 1.1 }) : 0, sh = O.hub.sub ? Math.ceil(measure(O.hub.sub, { size: ss, weight: 600, w: tw, lh: 1.1 }).h) : 0;
  const blk = th + (sh ? 8 + sh : 0), y0 = Math.round((2 * SR - blk) / 2);
  tx(core, 'hub-t', O.hub.title, { x: 32, y: y0 - 3, w: tw, h: th + 6, size: ts, weight: 700, font: 'serif', color: ink, align: 'center', wrap: true, lh: 1.08 });
  if (sh) tx(core, 'hub-s', O.hub.sub, { x: 32, y: y0 + th + 5, w: tw, h: sh + 6, size: ss, weight: 600, color: '#FFF3EA', align: 'center', wrap: true, lh: 1.1 });
  S.A.push(u => {
    enter(core, u, .4, { sc: .7, dy: 0, pop: true, d: .7 });
    rings.forEach(({ w, spin, k }) => { w.style.opacity = String(seg(u, .9 + k * .15, 1.4 + k * .15)); spin.style.transform = `rotate(${(u * 70 + k * 120) % 360}deg)`; });
  });
  S.at(1.8);
  const cs = uniformSub(N, { w: CW - 28, h: CH - 62 - 10, max: 20, min: 15 }); let t = 1.9;
  N.forEach((it, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = CX + R * Math.cos(a) - CW / 2, y = CY + R * Math.sin(a) - CH / 2, P = PAL[it.group];
    const s0 = SR + 8, s1 = rayRect(a, x - CX, y - CY, CW, CH, 7);
    flow(S, `M${CX + s0 * Math.cos(a)} ${CY + s0 * Math.sin(a)} L${CX + s1 * Math.cos(a)} ${CY + s1 * Math.sin(a)}`, P.bd, { t0: t, dur: .5, w: 4.5, head: 14 });
    const c = node(S, 'o' + i, { x, y, w: CW, h: CH, title: it.title, sub: it.sub, ic: it.icon, group: it.group, tsize: 22, ssize: cs });
    reveal(S, c, t + .3, { dy: 10 }); t += .7;
  });
  footer(S);
  return finish(S);
}
