// Template "arch": an architecture diagram of the whole post (engine/arch.js: sketch | cloud | flow | sequence) as a GIF.
// The complete diagram is on screen from the first frame; the only motion is dots travelling along every connector, in one seamless loop.
import { circ } from './kit.js';
import { scene, header, footer, finish, per, TOP, BOTTOM } from './gif_common.js';
import { renderArch } from './arch.js';

export function buildArch(stage, D) {
  const S = scene(stage, D); header(S);
  const { edges } = renderArch(S.root, S.g.arch, { x: 36, y: TOP + 4, w: 1008, h: BOTTOM - TOP - 16 });
  edges.forEach(({ path: p, color }, i) => {
    const L = p.getTotalLength(); if (L < 20) return;
    const n = Math.max(1, Math.round(L / 240)), P = per(S, Math.max(1.2, L / 150)), svg = p.ownerSVGElement;
    const dots = Array.from({ length: n }, () => circ(svg, -50, -50, 7, { fill: color, stroke: '#fff', w: 2.5 }));
    S.A.push(u => dots.forEach((c, j) => { const q = ((u / P) + j / n + i * .13) % 1, pt = p.getPointAtLength(q * L); c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.setAttribute('opacity', String(Math.min(1, Math.sin(q * Math.PI) * 3).toFixed(2))); }));
  });
  footer(S);
  return finish(S);
}
