// Claude Paper — shared kit: palette, DOM helpers, icons, animation helpers.
import { clamp, lerp, seg, eo, back, ss, eio } from '/core/lib.js';
export { clamp, lerp, seg, eo, back, ss, eio };

export const C = {
  bg: '#FAF9F5', card: '#FFFFFF', line: '#E3E0D3', lineD: '#C9C5B5', ink: '#141413', mid: '#5E5D59',
  clay: '#D97757', clayD: '#A8481F', claySoft: '#F8E6DD',
  blue: '#6A9BCC', blueD: '#3C6C9C', blueSoft: '#E4EDF6',
  green: '#788C5D', greenD: '#52663A', greenSoft: '#E8EEDD',
  sand: '#F0EEE6',
};

// ---- DOM ----
export function E(parent, cls = '', css = '', html = '', tag = 'div') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  if (html !== '') e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const px = v => (typeof v === 'number' ? v + 'px' : v);
export function box(parent, { x, y, w, h, r = 28, fill = C.card, bd = C.line, bw = 2, shadow = true, css = '', bg = false }) {
  const sh = shadow ? `box-shadow:0 ${Math.round(h * .03 + 4)}px 0 ${C.line};` : '';
  const b = E(parent, 'abs', `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;background:${fill};border:${bw}px solid ${bd};box-sizing:border-box;${sh}${css}`);
  b.dataset.box = '1'; if (bg) b.dataset.bg = '1'; return b;   // bg: a band that other boxes intentionally sit on
}
// text box: id is what readcheck sees. Fixed width + nowrap unless wrap=true. Text is centred in the box vertically.
export function tx(parent, id, text, { x, y, w, h, size = 36, weight = 600, color = C.ink, font = 'sans', align = 'left', wrap = false, ls = 0, lh = 1.2, italic = false, css = '' }) {
  const e = E(parent, `abs tx ${font}`,
    `left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${size}px;font-weight:${weight};color:${color};text-align:${align};` +
    `line-height:${lh};letter-spacing:${ls}em;display:flex;align-items:center;justify-content:${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'};` +
    `${wrap ? 'white-space:normal;' : 'white-space:nowrap;'}${italic ? 'font-style:italic;' : ''}${css}`);
  const s = E(e, '', `display:block;${wrap ? `width:100%;text-align:${align};` : ''}`, '', 'span');
  s.textContent = wrap ? brk(text) : text;
  e.dataset.id = id; e.dataset.text = text;
  return e;
}
export const svgNS = 'http://www.w3.org/2000/svg';
export function svgLayer(parent, W, H) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  s.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
  parent.appendChild(s); return s;
}
// v3 design system: every elbow is a smooth curve. roundPts turns a point list into a path with rounded corners
// (radius clamped to half of each segment, so short arrowheads stay sharp-ish); roundD does the same for any absolute or
// relative M/L/H/V/Z path, so every connector drawn through path() is rounded without touching the templates.
export const RADIUS = { s: 16, m: 22, l: 28 };
export function roundPts(pts, r = RADIUS.s, closed = false) {
  const n = pts.length; if (n < 3) return pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('') + (closed ? 'Z' : '');
  const f = v => v.toFixed(1), cut = (a, b, k) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [a[0] + dx / L * k, a[1] + dy / L * k]; };
  const corner = i => { const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], rr = Math.min(r, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, Math.hypot(c[0] - b[0], c[1] - b[1]) / 2); return [cut(b, a, rr), b, cut(b, c, rr)]; };
  if (!closed) { let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let i = 1; i < n - 1; i++) { const [p, q, s] = corner(i); d += `L${f(p[0])} ${f(p[1])}Q${f(q[0])} ${f(q[1])} ${f(s[0])} ${f(s[1])}`; } return d + `L${f(pts[n - 1][0])} ${f(pts[n - 1][1])}`; }
  const c0 = corner(0); let d = `M${f(c0[2][0])} ${f(c0[2][1])}`;
  for (let i = 1; i <= n; i++) { const [p, q, s] = corner(i % n); d += `L${f(p[0])} ${f(p[1])}Q${f(q[0])} ${f(q[1])} ${f(s[0])} ${f(s[1])}`; }
  return d + 'Z';
}
export function roundD(d, r = RADIUS.s) {
  if (!/^[MLHVZmlhvz0-9.,eE\s-]+$/.test(d)) return d;                 // curves and arcs are already smooth
  const tk = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e-?\d+)?/g) || []; const subs = []; let cur = null, x = 0, y = 0, cmd = 'M', i = 0;
  const num = () => parseFloat(tk[i++]);
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'Z' || cmd === 'z') { if (cur) { cur.closed = true; x = cur.pts[0][0]; y = cur.pts[0][1]; } cur = null; continue; }
    if (i >= tk.length) break;
    if (cmd === 'M' || cmd === 'm') { const a = num(), b = num(); x = cmd === 'm' ? x + a : a; y = cmd === 'm' ? y + b : b; cur = { pts: [[x, y]], closed: false }; subs.push(cur); cmd = cmd === 'm' ? 'l' : 'L'; continue; }
    if (cmd === 'L') { x = num(); y = num(); } else if (cmd === 'l') { x += num(); y += num(); } else if (cmd === 'H') x = num(); else if (cmd === 'h') x += num(); else if (cmd === 'V') y = num(); else if (cmd === 'v') y += num();
    if (!cur) { cur = { pts: [[x, y]], closed: false }; subs.push(cur); } else cur.pts.push([x, y]);
  }
  if (!subs.some(s => s.pts.length >= 3)) return d;
  return subs.map(s => { const p = s.pts.filter((q, k) => !k || q[0] !== s.pts[k - 1][0] || q[1] !== s.pts[k - 1][1]); if (s.closed && p.length > 1 && p[0][0] === p[p.length - 1][0] && p[0][1] === p[p.length - 1][1]) p.pop(); return roundPts(p, r, s.closed); }).join('');
}
// long tokens (URLs, paths, commands) may break after / . : _ - ? = & instead of overflowing their box
export const brk = t => String(t).replace(/\S{18,}/g, w => w.replace(/([\/.:_?=&-])(?=\S)/g, '$1\u200b'));
export function path(svg, d, { stroke = C.ink, w = 4, fill = 'none', dash = null, cap = 'round', sharp = false } = {}) {
  const p = document.createElementNS(svgNS, 'path');
  p.setAttribute('d', sharp ? d : roundD(d, Math.max(6, Math.min(RADIUS.s, w * 4)))); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', w);
  p.setAttribute('fill', fill); p.setAttribute('stroke-linecap', cap); p.setAttribute('stroke-linejoin', 'round');
  if (dash) p.setAttribute('stroke-dasharray', dash);
  svg.appendChild(p); return p;
}
export function circ(svg, cx, cy, r, { fill = C.ink, stroke = 'none', w = 0 } = {}) {
  const c = document.createElementNS(svgNS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
  c.setAttribute('fill', fill); c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', w);
  svg.appendChild(c); return c;
}
// progressive line draw (p 0..1)
export function draw(p, k) {
  const L = p._L ?? (p._L = p.getTotalLength());
  p.setAttribute('stroke-dasharray', `${L} ${L}`);
  p.setAttribute('stroke-dashoffset', String(L * (1 - clamp(k))));
  p.style.opacity = k > 0 ? '1' : '0';
}
export function headAt(p, k, tri, size = 16) {   // an arrowhead triangle at the end of path p, shown when k≈1
  const L = p._L ?? (p._L = p.getTotalLength());
  const a = p.getPointAtLength(L), b = p.getPointAtLength(Math.max(0, L - 6));
  const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
  tri.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
  tri.setAttribute('d', `M0 0 L${-size} ${-size * .6} L${-size} ${size * .6} Z`);
  tri.style.opacity = String(clamp((k - .9) * 10));
}
export function tri(svg, fill) {
  const t = document.createElementNS(svgNS, 'path'); t.setAttribute('fill', fill); t.style.opacity = '0'; svg.appendChild(t); return t;
}

// ---- Icons (24×24, stroke) ----
const I = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15.5H17"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18"/>',
  code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
  folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M18 11c0 4-6 3-12 6"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4"/>',
  hook: '<path d="M12 3v10a4 4 0 11-4-4"/><circle cx="12" cy="3.5" r="1"/>',
  book: '<path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h10"/>',
  agents: '<circle cx="12" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 8.5v3M12 11.5L7 15.5M12 11.5l5 4"/>',
  rewind: '<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7"/><path d="M4 3.5v4.5h4.5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  star: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 00-5 5L3 18l3 3 6.5-6.5a4 4 0 005-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5zM3 14l9 5 9-5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  cloud: '<path d="M7 18a4 4 0 010-8 5 5 0 019.5-1A4.5 4.5 0 0117 18z"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>',
  remote: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  hand: '<path d="M8 13V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1a5 5 0 01-4-2l-3-4a1.5 1.5 0 012.3-1.9L8 13"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  slack: '<path d="M5 9h14M5 15h14M9 5v14M15 5v14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 010 6M18 14c2 .8 3 2.8 3 6"/>',
  chart: '<path d="M4 20V4M4 20h16M8 15l4-4 3 3 5-6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  rocket: '<path d="M12 3c4 2 6 6 5 11l-3 3h-4l-3-3C6 9 8 5 12 3zM9 17l-3 4M15 17l3 4"/><circle cx="12" cy="10" r="1.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  scale: '<path d="M12 4v16M6 20h12M5 8h14M5 8l-3 7a3 3 0 006 0zM19 8l-3 7a3 3 0 006 0z"/>',
  table: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M9 10v9M15 10v9"/>',
};
export const ICON_NAMES = Object.keys(I);
export function icon(name, size = 40, color = C.ink, sw = 1.9) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${I[name]}</svg>`;
}
export function iconEl(parent, name, x, y, size, color, sw) {
  return E(parent, 'abs', `left:${x}px;top:${y}px;width:${size}px;height:${size}px`, icon(name, size, color, sw));
}
// Claude-style spark mark, drawn here as a plain 8-ray asterisk
export const FLAGS = { logo: true };
export function spark(size = 40, color = C.clay) {
  if (!FLAGS.logo) return '';
  let d = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; d += `M${12 + Math.cos(a) * 2.6} ${12 + Math.sin(a) * 2.6}L${12 + Math.cos(a) * 10.5} ${12 + Math.sin(a) * 10.5}`; }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" style="display:block;flex:none"><path d="${d}"/></svg>`;
}
// keycap
export function keycap(parent, id, label, { x, y, w = 110, h = 74, size = 30 }) {
  const k = box(parent, { x, y, w, h, r: 16, fill: C.card, bd: C.lineD, bw: 2.5, css: `box-shadow:0 7px 0 ${C.lineD};` });
  const t = tx(k, id, label, { x: 0, y: 0, w, h: h - 3, size, weight: 700, font: 'mono', align: 'center' });
  k.pressAt = p => { k.style.transform = `translateY(${p * 6}px)`; };
  return k;
}

// ---- Animation helpers ----
// entrance: fade + slide + optional pop-scale. Returns raw progress 0..1.
export function enter(n, t, t0, o = {}) {
  const d = o.d ?? .5, dx = o.dx ?? 0, dy = o.dy ?? 26, sc = o.sc ?? 1, pop = o.pop ?? false;
  const a = seg(t, t0, t0 + d), p = eo(a), q = pop ? back(a, 1.7) : p;
  n.style.opacity = String(clamp(a * 2.2));
  const s = sc + (1 - sc) * q;
  n.style.transform = `translate(${dx * (1 - p)}px,${dy * (1 - p)}px) scale(${s})`;
  return a;
}
export const pulse = (t, t0, d = .6) => { const a = seg(t, t0, t0 + d); return Math.sin(a * Math.PI); };

// ---- Layout helpers ----
// height estimate for wrapped text (conservative average glyph width .54em)
export const est = (text, size, w, lh = 1.2) => Math.max(1, Math.ceil(text.length * size * .54 / w)) * size * lh;
export const fit = (text, table) => { for (const [n, s] of table) if (text.length <= n) return s; return table[table.length - 1][1]; };
export const PALS = [
  { bd: C.blue, ink: C.blueD, soft: C.blueSoft }, { bd: C.clay, ink: C.clayD, soft: C.claySoft },
  { bd: C.green, ink: C.greenD, soft: C.greenSoft }, { bd: C.lineD, ink: C.mid, soft: C.sand },
];
// inline chip (flex item): a .tx element holding one span; data-box so the validator checks text against it
export function chip(parent, id, text, { size = 30, pal = PALS[0], weight = 600 } = {}) {
  const e = E(parent, 'tx sans', `display:inline-flex;align-items:center;white-space:nowrap;font-size:${size}px;font-weight:${weight};color:${pal.ink};background:${pal.soft};border:2.5px solid ${pal.bd};border-radius:${size}px;padding:${Math.round(size * .3)}px ${Math.round(size * .65)}px;box-sizing:border-box`);
  const s = E(e, '', 'display:block', '', 'span'); s.textContent = text; e.dataset.id = id; e.dataset.text = text; e.dataset.box = '1'; return e;
}

// ---- Text measuring (fonts are loaded before any template is built) ----
let _m = null;
export function measure(text, { size, weight = 600, font = 'sans', w, lh = 1.2 }) {
  if (!_m) _m = E(document.body, '', 'position:absolute;visibility:hidden;left:-9999px;top:0;overflow-wrap:normal;word-break:normal');
  _m.className = font; _m.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;overflow-wrap:normal;word-break:normal;box-sizing:border-box;width:${w}px;font-size:${size}px;font-weight:${weight};line-height:${lh};white-space:normal`;
  _m.textContent = brk(text);
  const rg = document.createRange(); rg.selectNodeContents(_m);   // same box the layout validator measures
  return { h: Math.max(rg.getBoundingClientRect().height, 0), wide: _m.scrollWidth > w + .5 };
}
// largest size in [min,max] at which `text` wraps inside w x h with no word wider than w
export function fitSize(text, { w, h, max = 24, min = 13, weight = 600, font = 'sans', lh = 1.2 }) {
  for (let s = max; s >= min; s--) { const m = measure(text, { size: s, weight, font, w, lh }); if (m.h <= h + .5 && !m.wide) return s; }
  return min;
}
