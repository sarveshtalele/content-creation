// CTA pill from brand config: avatar · "Follow <name>" · "→ <tagline>" · LinkedIn mark. Orange outline.
import { E, box } from './kit.js';
const OR = '#F2741F';
export function cta(parent, id, brand, { x, y, w, h, size = 26, bw = 4 }) {
  const pad = Math.round(h * .22);
  const b = box(parent, { x, y, w, h, r: h / 2, fill: '#FBFAF7', bd: OR, bw, shadow: false,
    css: `display:flex;align-items:center;justify-content:space-between;padding:0 ${pad + 6}px 0 ${pad}px;gap:${Math.round(h * .2)}px` });
  const av = h - 2 * pad - bw;
  E(b, '', `width:${av}px;height:${av}px;border-radius:50%;background:url(${brand.avatar || 'assets/avatar.png'}) center/cover;flex:none;border:2px solid #fff`);
  const mk = (suffix, html, text, css) => {
    const d = E(b, 'tx sans', `white-space:nowrap;font-size:${size}px;color:#141413;flex:none;${css}`, '');
    E(d, '', 'display:block', html, 'span'); d.dataset.id = id + suffix; d.dataset.text = text; return d;
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  mk('-follow', `<span style="font-style:italic;font-weight:500">${esc(brand.follow || 'Follow')} </span><span style="font-style:italic;font-weight:800">${esc(brand.name)}</span>`, `${brand.follow || 'Follow'} ${brand.name}`, '');
  mk('-tag', `→ ${esc(brand.tagline)}`, `→ ${brand.tagline}`, `font-weight:500;font-size:${Math.round(size * .92)}px`);
  const ln = Math.round(h * .5);
  E(b, '', `width:${ln}px;height:${ln}px;border-radius:${Math.round(ln * .2)}px;background:${OR};color:#fff;flex:none;display:flex;align-items:center;justify-content:center;font:800 ${Math.round(ln * .62)}px Inter,sans-serif;letter-spacing:-.04em;padding-bottom:${Math.round(ln * .04)}px`, 'in');
  return b;
}
