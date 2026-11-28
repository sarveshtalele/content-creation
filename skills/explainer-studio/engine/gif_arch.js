// Template "arch": an architecture diagram of the whole post (engine/arch.js: sketch | cloud | flow | sequence) as a GIF.
// The complete diagram is on screen from the first frame; the motion is dots travelling along every connector and the icons coming alive step by step, in one seamless loop.
import { circ } from './kit.js';
import { scene, header, footer, finish, per, TOP, BOTTOM } from './gif_common.js';
import { renderArch } from './arch.js';

export function buildArch(stage, D) {
  const S = scene(stage, D); header(S);
  const { edges, icons = [] } = renderArch(S.root, S.g.arch, { x: 36, y: TOP + 4, w: 1008, h: BOTTOM - TOP - 16 });
  edges.forEach(({ path: p, color }, i) => {
    const L = p.getTotalLength(); if (L < 20) return;
    const n = Math.max(1, Math.round(L / 240)), P = per(S, Math.max(1.2, L / 150)), svg = p.ownerSVGElement;
    const dots = Array.from({ length: n }, () => circ(svg, -50, -50, 7, { fill: color, stroke: '#fff', w: 2.5 }));
    S.A.push(u => dots.forEach((c, j) => { const q = ((u / P) + j / n + i * .13) % 1, pt = p.getPointAtLength(q * L); c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.setAttribute('opacity', String(Math.min(1, Math.sin(q * Math.PI) * 3).toFixed(2))); }));
  });
  // icons come alive in workflow order: the step the flow has reached pops, wiggles and glows; every icon bobs gently. All periods divide the loop.
  const N = icons.length, win = Math.min(.5, 1.8 / Math.max(1, N)), PB = per(S, 3);
  icons.forEach(({ el, color }, k) => { el.style.transformOrigin = '50% 50%'; el.style.willChange = 'transform';
    S.A.push(u => { const d = (((u / S.LOOP) - k / N) % 1 + 1) % 1, pop = d < win ? Math.sin(Math.PI * d / win) : 0, bob = 2.2 * Math.sin(2 * Math.PI * (u / PB + k * .17));
      el.style.transform = `translateY(${bob.toFixed(2)}px) scale(${(1 + .1 * pop).toFixed(3)}) rotate(${(9 * pop * Math.sin(2 * Math.PI * d / win)).toFixed(2)}deg)`;
      el.style.filter = pop > .02 ? `drop-shadow(0 0 ${(8 * pop).toFixed(1)}px ${color})` : 'none';
      el.style.outline = pop > .02 ? `${(2.5 * pop).toFixed(1)}px solid ${color}` : 'none'; el.style.outlineOffset = '0px'; }); });
  footer(S);
  return finish(S);
}
