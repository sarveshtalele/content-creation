// Template "grid": a poster of numbered cards, each with a small diagram. Cards pop in one by one, then each diagram's highlight keeps pulsing.
import { C, svgLayer } from './kit.js';
import { scene, header, footer, finish, reveal, W, H, per } from './gif_common.js';
import { legend, cards } from './motifs.js';

export function buildGrid(stage, D) {
  const S = scene(stage, D), G = S.g.grid; header(S);
  const x = 24, w = W - 48, hasLg = G.legend && G.legend.length, y0 = 150, svg = svgLayer(S.root, W, H);
  if (hasLg) legend(S.root, svg, G.legend, { x, y: y0, w });
  const list = cards(S.root, svg, G.cards, { x, y: y0 + (hasLg ? 56 : 0), w, h: 1214 - y0 - (hasLg ? 56 : 0) }), step = list.length > 6 ? .5 : .7;
  list.forEach((c, i) => { reveal(S, c.el, .5 + i * step, { dy: 18, sc: .92 }); S.B.push(c.el); });
  const tEnd = .5 + list.length * step;
  list.forEach((c, i) => c.acc.forEach(a => { a.style.transformBox = 'fill-box'; a.style.transformOrigin = 'center'; S.A.push(u => { const k = Math.max(0, u - tEnd) ; a.style.transform = `scale(${1 + .16 * Math.max(0, Math.sin(2 * Math.PI * k / per(S, 2.1) + i))})`; }); }));
  footer(S);
  return finish(S);
}
