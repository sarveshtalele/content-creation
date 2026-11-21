// Scene library: small flat illustrations (170x100) built only from rects, circles and paths, so they are exact and deterministic.
// A scene is a list of parts; set(p) reveals them one after another as p goes 0 -> 1 (bars grow, ticks appear, panels slide in).
import { svgNS, seg, eo } from './kit.js';
import { mix } from './gif_3d.js';

export const SCENES = ['screen', 'chart', 'chat', 'docs', 'gears', 'checklist', 'search', 'shield', 'cloud', 'people', 'rocket', 'database', 'bulb', 'target'];
const INK = '#2A2A28';

export function drawScene(svg, name, cx, bottom, P) {
  const g = document.createElementNS(svgNS, 'g'); g.setAttribute('transform', `translate(${cx - 85} ${bottom - 100})`); g.style.opacity = '0'; svg.appendChild(g);
  const parts = [], A = (tag, a, grow) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); g.appendChild(e); parts.push({ e, grow }); return e; };
  const st = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, W = '#FFFFFF', BD = P.bd, SO = P.soft, DK = P.ink;
  const R = (x, y, w, h, fill, r = 6, extra = {}, grow) => A('rect', { x, y, width: w, height: h, rx: r, fill, ...st, ...extra }, grow);
  const Ci = (x, y, r, fill, extra = {}) => A('circle', { cx: x, cy: y, r, fill, ...st, ...extra });
  const Pa = (d, fill, extra = {}) => A('path', { d, fill, ...st, ...extra });
  const Ln = (x1, y1, x2, y2, extra = {}) => A('line', { x1, y1, x2, y2, ...st, 'stroke-width': 3, ...extra });
  const gear = (x, y, r, fill) => { for (let i = 0; i < 8; i++) A('rect', { x: x - 5, y: y - r - 6, width: 10, height: 12, rx: 3, fill, ...st, transform: `rotate(${i * 45} ${x} ${y})` }); Ci(x, y, r, fill); Ci(x, y, r * .38, W); };
  switch (name) {
    case 'screen': R(10, 4, 150, 80, W, 10); R(10, 4, 150, 18, BD, 10); Ci(24, 13, 3, W, { 'stroke-width': 0 }); Ci(34, 13, 3, W, { 'stroke-width': 0 }); R(24, 34, 70, 9, SO, 4); R(24, 50, 100, 9, SO, 4); R(24, 66, 54, 9, SO, 4); R(110, 32, 36, 30, BD, 6); R(62, 86, 46, 9, SO, 4); break;
    case 'chart': Ln(14, 90, 158, 90); Ln(14, 90, 14, 8); [[26, 26], [58, 44], [90, 60], [122, 78]].forEach(([x, h], i) => R(x, 90 - h, 24, h, i % 2 ? SO : BD, 5, {}, true)); Pa('M30 58 L62 40 L94 26 L128 8', 'none', { stroke: DK, 'stroke-width': 4 }); Ci(128, 8, 6, W); break;
    case 'chat': Pa('M12 8 h96 a10 10 0 0 1 10 10 v26 a10 10 0 0 1 -10 10 h-70 l-18 14 v-14 h-8 a10 10 0 0 1 -10 -10 v-26 a10 10 0 0 1 10 -10z', W); R(26, 20, 64, 8, SO, 4); R(26, 34, 44, 8, SO, 4); Pa('M62 58 h88 a10 10 0 0 1 10 10 v14 a10 10 0 0 1 -10 10 h-8 v12 l-16 -12 h-64 a10 10 0 0 1 -10 -10 v-14 a10 10 0 0 1 10 -10z', BD); R(76, 72, 58, 8, W, 4, { 'stroke-width': 0 }); break;
    case 'docs': R(18, 14, 84, 76, SO, 8); R(40, 8, 84, 76, W, 8); R(62, 2, 84, 76, W, 8); R(76, 16, 56, 8, BD, 4, { 'stroke-width': 0 }); R(76, 32, 56, 7, SO, 3, { 'stroke-width': 0 }); R(76, 46, 40, 7, SO, 3, { 'stroke-width': 0 }); R(76, 60, 48, 7, SO, 3, { 'stroke-width': 0 }); break;
    case 'gears': gear(60, 50, 24, BD); gear(114, 66, 17, SO); break;
    case 'checklist': [0, 1, 2].forEach(i => { const y = 12 + i * 30; Ci(24, y + 8, 12, i < 2 ? BD : W); if (i < 2) Pa(`M18 ${y + 8} l5 5 l9 -10`, 'none', { stroke: W, 'stroke-width': 4 }); R(46, y, 100, 16, i < 2 ? SO : W, 8); }); break;
    case 'search': R(14, 12, 100, 10, SO, 5); R(14, 30, 70, 10, SO, 5); R(14, 48, 90, 10, SO, 5); Ci(100, 44, 28, 'rgba(255,255,255,.85)', { 'stroke-width': 5 }); Ln(120, 66, 150, 92, { 'stroke-width': 9, stroke: DK }); Ci(100, 44, 14, SO, { 'stroke-width': 0 }); break;
    case 'shield': Pa('M85 4 L142 22 V50 C142 74 116 88 85 98 C54 88 28 74 28 50 V22 Z', SO); Pa('M58 50 l18 18 l36 -38', 'none', { stroke: BD, 'stroke-width': 9 }); break;
    case 'cloud': Pa('M44 78 a22 22 0 0 1 2 -44 a30 30 0 0 1 58 -6 a24 24 0 0 1 14 50 z', SO); Pa('M85 70 V40', 'none', { stroke: DK, 'stroke-width': 5 }); Pa('M70 52 L85 36 L100 52', 'none', { stroke: DK, 'stroke-width': 5 }); break;
    case 'people': [[42, W], [85, BD], [128, W]].forEach(([x, f], i) => { Pa(`M${x - 24} 96 a24 24 0 0 1 48 0 z`, f); Ci(x, i === 1 ? 34 : 44, i === 1 ? 17 : 14, SO); }); break;
    case 'rocket': Pa('M85 4 C112 22 116 56 108 76 H62 C54 56 58 22 85 4 Z', W); Ci(85, 40, 12, BD); Pa('M62 62 L44 84 L64 78 Z', SO); Pa('M108 62 L126 84 L106 78 Z', SO); Pa('M72 82 L85 98 L98 82 Z', BD); break;
    case 'database': [0, 1, 2].forEach(i => { const y = 16 + i * 26; R(34, y, 102, 30, i === 1 ? BD : SO, 4, { 'stroke-width': 0 }); A('ellipse', { cx: 85, cy: y + 30, rx: 51, ry: 12, fill: i === 1 ? BD : SO, ...st }); }); A('ellipse', { cx: 85, cy: 16, rx: 51, ry: 12, fill: W, ...st }); Ln(34, 16, 34, 70); Ln(136, 16, 136, 70); break;
    case 'bulb': Pa('M85 8 a30 30 0 0 1 16 56 v10 h-32 v-10 a30 30 0 0 1 16 -56z', SO); R(70, 78, 30, 8, BD, 4); R(76, 88, 18, 7, W, 3); [[85, 0, 85, -6], [28, 24, 20, 18], [142, 24, 150, 18]].forEach(() => 0); Ln(24, 30, 12, 24); Ln(146, 30, 158, 24); Ln(18, 56, 4, 58); Ln(152, 56, 166, 58); break;
    default: [48, 34, 20, 7].forEach((r, i) => Ci(85, 52, r, i % 2 ? BD : W, { 'stroke-width': 3 })); Ln(85, 52, 142, 8, { 'stroke-width': 5 }); Pa('M142 8 l-4 16 M142 8 l-16 4', 'none', { 'stroke-width': 5 });
  }
  const m = parts.length;
  return { g, set(p) {
    g.style.opacity = String(seg(p, 0, .08));
    parts.forEach(({ e, grow }, i) => { const a = i / m * .62, k = eo(seg(p, a, a + .38)); e.style.opacity = String(k); if (e.hasAttribute('transform')) return;   // rotated parts (gear teeth) keep their own transform
      e.style.transformBox = 'fill-box'; e.style.transformOrigin = '50% 100%'; e.style.transform = grow ? `scale(1,${k})` : `translateY(${(1 - k) * 8}px)`; });
  } };
}
