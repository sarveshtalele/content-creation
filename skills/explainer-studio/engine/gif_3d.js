// 3D helpers shared by the motion templates (exploded, isoflow, orbit, stairs). Everything 3D is decoration:
// text always lives in flat, axis-aligned boxes so the layout checks stay exact and the words stay crisp.
import { E, svgNS, lerp, fitSize } from './kit.js';

export const mix = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = i => Math.round(((n >> i) & 255) * (1 - k) + 255 * k); return `rgb(${c(16)},${c(8)},${c(0)})`; };   // k=0 the colour, k=1 white
export const RX = 62, RZ = -40, SQ = Math.abs(Math.cos(RZ * Math.PI / 180)) + Math.abs(Math.sin(RZ * Math.PI / 180));   // iso tilt; SQ = width of the rotated square / its side
export const plateW = s => s * SQ; export const plateH = s => s * SQ * Math.cos(RX * Math.PI / 180);                              // on-screen size of a plate of side s

// a flat slab seen in isometric projection: CSS 3D transform (rotateX + rotateZ), plus a darker copy underneath for thickness
export function plate(parent, { cx, cy, s, fill, bd, th = 16 }) {
  const wrap = E(parent, 'abs', `left:${cx}px;top:${cy}px;width:0;height:0;opacity:0`);
  const face = (y, f, b) => E(wrap, 'abs', `left:${-s / 2}px;top:${-s / 2 + y}px;width:${s}px;height:${s}px;border-radius:${Math.round(s * .09)}px;background:${f};border:5px solid ${b};box-sizing:border-box;transform:rotateX(${RX}deg) rotateZ(${RZ}deg)`);
  face(th, bd, bd); face(th * .5, mix(bd, .35), bd); face(0, fill, bd);
  return { el: wrap, set(y, op) { wrap.style.top = y + 'px'; wrap.style.opacity = String(op); } };
}

// isometric box drawn as three polygons (exact geometry, no gaps): top rhombus + left + right faces. cx,cy = centre of the TOP face.
export function iso(svg, { cx, cy, hw, hh, h, color }) {
  const g = document.createElementNS(svgNS, 'g'), poly = (pts, fill) => { const p = document.createElementNS(svgNS, 'polygon'); p.setAttribute('points', pts.map(q => q.join(',')).join(' ')); p.setAttribute('fill', fill); p.setAttribute('stroke', color); p.setAttribute('stroke-width', 3); p.setAttribute('stroke-linejoin', 'round'); g.appendChild(p); };
  poly([[cx - hw, cy], [cx, cy + hh], [cx, cy + hh + h], [cx - hw, cy + h]], mix(color, .5));
  poly([[cx, cy + hh], [cx + hw, cy], [cx + hw, cy + h], [cx, cy + hh + h]], mix(color, .12));
  poly([[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]], mix(color, .8));
  svg.appendChild(g); g.style.opacity = '0'; return g;
}
// where a ray from (0,0) along angle `a` first meets the rectangle (x,y,w,h), grown by `pad`
export function rayRect(a, x, y, w, h, pad = 6) {
  const dx = Math.cos(a), dy = Math.sin(a), t = (lo, hi, d) => d === 0 ? [-Infinity, Infinity] : (d > 0 ? [(lo - pad) / d, (hi + pad) / d] : [(hi + pad) / d, (lo - pad) / d]);
  const [ax] = t(x, x + w, dx), [ay] = t(y, y + h, dy), s = Math.max(ax, ay); return s;
}
export { lerp };

// one sub-text size for every card of a diagram (the smallest that fits them all), so the cards read as a set
export const uniformSub = (items, { w, h, max = 21, min = 15 }) => Math.min(...items.map(it => fitSize(it.sub || ' ', { w, h, max, min, weight: 500, lh: 1.24 })));
