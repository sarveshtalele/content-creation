// Carousel: 5-7 portrait slides (1080x1350) for a LinkedIn document post. Every slide shares a frame (brand bar, progress segments, an editable CTA strip);
// the body is one of a few infographic slide types. Slides are static (a still per slide), so every build is identical.
import { C, E, box, tx, icon, svgLayer, path, circ, fitSize, measure, svgNS } from './kit.js';
import { PAL } from './gif_common.js';
import { iso, mix } from './gif_3d.js';
import { cta } from './cta.js';
import { banner, legend, cards } from './motifs.js';
import { charts } from './charts.js';
import { renderArch } from './arch.js';

const THEMES = {
  paper: { sub: C.sub, onAcc: '#FFFFFF', dots: '#E4E1D4' },
  sky: { bg: '#EEF3FF', card: '#FFFFFF', line: '#D5E0FB', lineD: '#A9BDF0', ink: '#0B1B4B', mid: '#4A5A8A', sub: '#2B3A6B', clay: '#FF6B3D', clayD: '#C74A1F', claySoft: '#FFE3D9', blue: '#2B59FF', blueD: '#1636C4', blueSoft: '#DCE6FF', green: '#16A34A', greenD: '#0E7A37', greenSoft: '#D6F3E2', sand: '#E4ECFF', onAcc: '#FFFFFF', dots: '#D5E0FB' },
  midnight: { bg: '#0E1320', card: '#172033', line: '#2B3856', lineD: '#3A4A6E', ink: '#F3F0E8', mid: '#A8B2C9', sub: '#C4CCDD', clay: '#FF8A5B', clayD: '#FFB394', claySoft: '#2B2230', blue: '#5FB0FF', blueD: '#A5D4FF', blueSoft: '#142A47', green: '#6FD08A', greenD: '#B0EBBF', greenSoft: '#14301F', sand: '#1B2438', onAcc: '#0E1320', dots: '#1B2640' },
  sunrise: { bg: '#FFF6E5', card: '#FFFFFF', line: '#F0DDB8', lineD: '#E2C98E', ink: '#2B1B12', mid: '#6B5444', sub: '#4F3B2E', clay: '#E8590C', clayD: '#B3400A', claySoft: '#FFE3CC', blue: '#7B5EA7', blueD: '#54387F', blueSoft: '#EDE5F7', green: '#2F9E6B', greenD: '#1F7048', greenSoft: '#DDF3E7', sand: '#FBEBCB', onAcc: '#FFFFFF', dots: '#F4E2BC' },
  mint: { bg: '#EEF7F3', card: '#FFFFFF', line: '#CFE3DA', lineD: '#A9CBBD', ink: '#0F2A22', mid: '#4B6B5F', sub: '#2F4A40', clay: '#0F9D82', clayD: '#0A6B58', claySoft: '#D6F0E8', blue: '#3B82C4', blueD: '#235A8F', blueSoft: '#DCEAF6', green: '#C27A0E', greenD: '#8A5508', greenSoft: '#F8EBCF', sand: '#E1EFE9', onAcc: '#FFFFFF', dots: '#DCEBE4' },
};
const BASE = { ...C };
function applyTheme(stage, name) {
  Object.assign(C, BASE, THEMES.paper, THEMES[name] || {});
  Object.assign(PAL.blue, { bd: C.blue, ink: C.blueD, soft: C.blueSoft }); Object.assign(PAL.green, { bd: C.green, ink: C.greenD, soft: C.greenSoft });
  Object.assign(PAL.clay, { bd: C.clay, ink: C.clayD, soft: C.claySoft }); Object.assign(PAL.sand, { bd: C.lineD, ink: C.mid, soft: C.sand });
  stage.style.backgroundColor = C.bg; stage.style.backgroundImage = `radial-gradient(${C.dots} 2px,transparent 2.3px)`;
}
const W = 1080, H = 1350, X0 = 48, XW = W - 2 * X0, BODY0 = 128, BODY1 = 1196, GROUPS = ['blue', 'clay', 'green'];
const grp = i => PAL[GROUPS[i % 3]];
const arrow = (c, s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;

function frame(root, i, n, brand, single) {
  E(root, 'abs', `left:${X0}px;top:36px;width:56px;height:56px;border-radius:${brand.avatar_shape === 'circle' ? '50%' : '26%'};background:url(${brand.avatar || 'assets/avatar.png'}) center/cover;border:3px solid ${C.card};box-shadow:0 0 0 2px ${C.line}`);
  tx(root, 'fr-name', brand.name, { x: X0 + 70, y: 36, w: 560, h: 56, size: 26, weight: 700 });
  if (!single) tx(root, 'fr-count', `${i + 1} / ${n}`, { x: W - X0 - 160, y: 36, w: 160, h: 56, size: 26, weight: 600, color: C.mid, align: 'right' });
  const gap = 8, sw = (XW - gap * (n - 1)) / n;
  for (let k = 0; k < (single ? 0 : n); k++) E(root, 'abs', `left:${X0 + k * (sw + gap)}px;top:104px;width:${sw}px;height:7px;border-radius:4px;background:${k <= i ? C.clay : C.line}`);
  cta(root, 'fr-brand', brand, { x: X0, y: 1226, w: XW, h: 84, size: 26, bw: 4 });   // the author's CTA, the only call to action, on every slide
}
const heading = (root, id, text, y = BODY0 + 8, max = 60) => {
  const sz = fitSize(text, { w: XW, h: 150, max, min: 38, weight: 700, font: 'serif', lh: 1.1 }), h = Math.ceil(measure(text, { size: sz, weight: 700, font: 'serif', w: XW, lh: 1.1 }).h) + 6;
  tx(root, id, text, { x: X0, y, w: XW, h, size: sz, weight: 700, font: 'serif', wrap: true, lh: 1.1 }); return y + h;
};
const numBadge = (parent, n, P, x, y, s = 58) => E(parent, 'abs', `left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;background:${P.bd};color:${C.onAcc};display:flex;align-items:center;justify-content:center;font:700 ${Math.round(s * .5)}px Inter,sans-serif;color:${C.onAcc}`, String(n));


const DARK = '#0B0F19', MONO = 'mono';
const dots3 = (parent, x, y) => ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, k) => E(parent, 'abs', `left:${x + k * 30}px;top:${y}px;width:18px;height:18px;border-radius:50%;background:${c}`));
function chip(root, text, x, y, P) {
  const k = E(root, 'tx sans', `left:${x}px;top:${y}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:700;letter-spacing:.06em;color:${P.ink};background:${P.soft};border:2.5px solid ${P.bd};border-radius:30px;padding:8px 22px`);
  const sp = E(k, '', 'display:block', '', 'span'); sp.textContent = text; k.dataset.id = 'ti-kicker'; k.dataset.text = text; return k;
}
function titlePoster(root, s) {          // full-bleed colour poster: huge hook, swipe arrow
  const x = X0, w = XW, y = BODY0 + 6, h = BODY1 - BODY0 - 6;
  const bgp = box(root, { x, y, w, h, r: 44, fill: C.clay, bd: C.clay, bw: 0, shadow: false, bg: true });
  E(bgp, 'abs', `right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:${C.onAcc};opacity:.12`);
  E(bgp, 'abs', `left:-90px;bottom:-110px;width:340px;height:340px;border-radius:50%;background:${C.onAcc};opacity:.10`);
  E(bgp, 'abs', `left:48px;top:52px;width:104px;height:104px;border-radius:30px;background:${C.onAcc};display:flex;align-items:center;justify-content:center;transform:rotate(-6deg)`, icon(s.icon || 'bolt', 58, C.clay, 2.2));
  const k = s.kicker ? 70 : 0, iw = w - 96, hz = fitSize(s.hook, { w: iw, h: 560, max: 112, min: 56, weight: 800, font: 'serif', lh: 1.04 }), hh = Math.ceil(measure(s.hook, { size: hz, weight: 800, font: 'serif', w: iw, lh: 1.04 }).h) + 8;
  const sz = s.sub ? fitSize(s.sub, { w: iw, h: 130, max: 38, min: 24, weight: 600, lh: 1.25 }) : 0, sh = s.sub ? H_(s.sub, sz, iw, 600) + 8 : 0;
  let yy = 200; if (s.kicker) { const kk = E(bgp, 'tx sans', `left:48px;top:${yy}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:800;letter-spacing:.08em;color:${C.clayD};background:${C.onAcc};border-radius:30px;padding:8px 22px`); const sp = E(kk, '', 'display:block', '', 'span'); sp.textContent = s.kicker; kk.dataset.id = 'ti-kicker'; kk.dataset.text = s.kicker; yy += k; }
  tx(bgp, 'ti-hook', s.hook, { x: 48, y: yy, w: iw, h: hh, size: hz, weight: 800, font: 'serif', wrap: true, lh: 1.04, color: C.onAcc }); yy += hh + 26;
  if (s.sub) tx(bgp, 'ti-sub', s.sub, { x: 48, y: yy, w: iw, h: sh, size: sz, weight: 600, color: C.onAcc, wrap: true, lh: 1.25, css: 'align-items:flex-start;opacity:.92;' });
  E(bgp, 'abs', `right:48px;bottom:44px;width:96px;height:96px;border-radius:50%;background:${C.onAcc};display:flex;align-items:center;justify-content:center`, arrow(C.clay, 52));
}

// "bold" cover, after the poster references: one giant headline, one word on a colour box, a swoosh, a short line of copy, a 3D object built from the topic
// and a row of topic chips. No photo: just the title and related infographics.
function textW(t, size, weight) { const e = E(document.body, 'sans', `position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;font-size:${size}px;font-weight:${weight};letter-spacing:-.03em`); e.textContent = t; const w = e.getBoundingClientRect().width; e.remove(); return w; }
function titleBold(root, s, D) {
  const x = X0, w = XW, y0 = BODY0 + 14, hue = C.blueD, acc = C.green;
  E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(900px 700px at 70% 55%,${C.blueSoft},transparent 70%);opacity:.9`);
  const svg = svgLayer(root, W, H);
  path(svg, `M-20 1010 C200 930 380 1060 620 960 S960 800 1110 760`, { stroke: acc, w: 12 });
  const accent = (s.accent || '').trim(), hk = s.hook, ai = accent ? hk.toLowerCase().indexOf(accent.toLowerCase()) : -1;
  const split = t => { const ws = t.split(/\s+/).filter(Boolean), n = Math.max(1, Math.ceil(t.length / 16)), out = []; let cur = [], target = t.length / n; ws.forEach(wd => { cur.push(wd); if (cur.join(' ').length >= target && out.length < n - 1) { out.push(cur.join(' ')); cur = []; } }); if (cur.length) out.push(cur.join(' ')); return out; };
  const parts = ai < 0 ? split(hk).map(t => ({ t })) : [...(hk.slice(0, ai).trim() ? split(hk.slice(0, ai).trim()).map(t => ({ t })) : []), { t: hk.slice(ai, ai + accent.length), hi: true }, ...(hk.slice(ai + accent.length).trim() ? split(hk.slice(ai + accent.length).trim()).map(t => ({ t })) : [])];
  const sz = Math.min(...parts.map(p => fitSize(p.t, { w: w - 40, h: 170, max: hk.length > 36 ? 84 : 112, min: 54, weight: 900, lh: 1 })), hk.length > 36 ? 84 : 112), lh = Math.ceil(sz * 1.2) + 1;
  let y = y0; if (s.kicker) { tx(root, 'ti-kick', s.kicker.toUpperCase(), { x, y, w, h: 44, size: 28, weight: 800, color: C.blueD, css: 'letter-spacing:.22em;' }); y += 60; }
  parts.forEach((p, k) => {
    if (p.hi) { const mw = textW(p.t, sz, 900), bx = E(root, 'abs', `left:${x - 12}px;top:${y + 24}px;width:${Math.ceil(mw) + 36}px;height:${lh - 22}px;background:${acc};transform:rotate(-1.6deg);border-radius:8px`);
      tx(bx, 'ti-l' + k, p.t, { x: 12, y: -14, w: Math.ceil(mw) + 24, h: lh, size: sz, weight: 900, color: '#fff', css: 'letter-spacing:-.03em;' }); y += lh + 4; return; }
    tx(root, 'ti-l' + k, p.t, { x, y, w: w, h: lh, size: sz, weight: 900, color: hue, css: 'letter-spacing:-.03em;' }); y += lh;
  });
  y += 14;
  if (s.sub) { const zz = fitSize(s.sub, { w: 560, h: 120, max: 32, min: 22, weight: 600, lh: 1.25 }); tx(root, 'ti-sub', s.sub, { x, y: y + 8, w: 560, h: H_(s.sub, zz, 560, 600) + 6, size: zz, weight: 600, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); }
  // 3D object: three isometric slabs stacked, with floating icon tiles (the topic's own icons)
  const usePhoto = s.photo && D && D.brand && D.brand.photo, chips = (s.chips || []).slice(0, 4), cx = 810, base = hk.length > 36 ? 950 : 930, sc = hk.length > 36 ? .72 : 1, cols = [C.blue, C.clay, C.green];
  if (usePhoto) { photoEl(root, D, { left: 470, top: 590, w: 600, h: 580 }); chips.forEach((c, k) => { E(root, 'abs', `left:${x}px;top:${860 + k * 70}px;width:46px;height:46px;display:flex;align-items:center;justify-content:center`, icon(c.icon || 'bolt', 40, hue, 2.2)); tx(root, 'ti-c' + k, (c.label || '').toUpperCase(), { x: x + 58, y: 856 + k * 70, w: 300, h: 54, size: 24, weight: 800, color: hue, css: 'letter-spacing:.04em;' }); }); return; }
  for (let k = 0; k < (usePhoto ? 0 : 3); k++) { const g = iso(svg, { cx, cy: base - k * 110 * sc, hw: (190 - k * 26) * sc, hh: (95 - k * 13) * sc, h: 70 * sc, color: cols[k] }); g.style.opacity = '1'; }
  const tiles = chips.length ? chips : [{ icon: s.icon || 'bolt' }];
  tiles.forEach((c, k) => { const tx_ = [640, 960, 700, 940][k] ?? 700, ty = hk.length > 36 ? [830, 730, 930, 890][k] : [830, 640, 960, 880][k]; const t = E(root, 'abs', `left:${tx_ - 40}px;top:${ty - 40}px;width:80px;height:80px;border-radius:22px;background:#fff;box-shadow:0 10px 0 ${C.line},0 18px 30px rgba(20,40,120,.18);display:flex;align-items:center;justify-content:center;transform:rotate(${k % 2 ? 6 : -6}deg)`, icon(c.icon || 'bolt', 44, hue, 2.2)); });
  // chip row at the bottom: icon + short label (like the footer row on the poster reference)
  if (chips.length) { const cw = Math.floor(w / chips.length); chips.forEach((c, k) => { E(root, 'abs', `left:${x + k * cw}px;top:1088px;width:46px;height:46px;display:flex;align-items:center;justify-content:center`, icon(c.icon || 'bolt', 40, hue, 2.2)); tx(root, 'ti-c' + k, (c.label || '').toUpperCase(), { x: x + k * cw + 58, y: 1084, w: cw - 66, h: 54, size: 22, weight: 800, color: hue, wrap: true, lh: 1.05, css: 'letter-spacing:.04em;' }); }); }
}

// the person's cutout photo (assets/photo_cutout.png), bottom-anchored with a soft fade so a half-body crop never ends in a hard line
function photoEl(root, D, { left, top, w, h }) {
  const src = D && D.brand && D.brand.photo; if (!src) return false;
  E(root, 'abs', `left:${left}px;top:${top}px;width:${w}px;height:${h}px;background:url(${src}) center bottom/contain no-repeat;-webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent);filter:drop-shadow(0 18px 28px rgba(20,40,120,.25))`);
  return true;
}
// "stage" cover (poster reference 5): centred stacked headline in two weights, floating tags, ribbon arcs, photo rising from the bottom
function titleStage(root, s, D) {
  const W_ = W, cx = W_ / 2, ink = C.ink, blue = C.blueD;
  root.prepend(E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px;background:linear-gradient(180deg,${C.bg} 0%,${C.bg} 50%,${C.blueSoft} 100%)`));
  const svg = svgLayer(root, W, H);
  path(svg, 'M-30 930 C120 760 330 760 420 900', { stroke: blue, w: 34 }); path(svg, 'M1110 760 C960 700 840 820 900 980', { stroke: blue, w: 34 });
  const ws = s.hook.split(/\s+/), acc = (s.accent || '').trim(), has = acc && s.hook.toLowerCase().includes(acc.toLowerCase());
  const rest = has ? s.hook.replace(new RegExp(acc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '\u0001').split(/\s+/).filter(Boolean) : ws;
  const lines = []; { let cur = []; rest.forEach(wd => { cur.push(wd); if (cur.join(' ').length >= 13 && lines.length < 3) { lines.push(cur.join(' ')); cur = []; } }); if (cur.length) lines.push(cur.join(' ')); }
  const sizes = lines.map((l, k) => Math.min(fitSize(l.replace('\u0001', acc), { w: 960, h: 150, max: k % 2 ? 150 : 128, min: 48, weight: 900, lh: 1 }), k % 2 ? 150 : 128));
  let y = BODY0 + 10; if (s.kicker) { tx(root, 'ti-kick', s.kicker.toUpperCase(), { x: X0, y, w: XW, h: 40, size: 26, weight: 800, color: blue, align: 'center', css: 'letter-spacing:.22em;' }); y += 54; }
  lines.forEach((l, k) => { const t = l.replace('\u0001', '').trim(); if (!t) return; const lh = Math.ceil(sizes[k] * 1.2) + 2;
    tx(root, 'ti-l' + k, t, { x: X0, y, w: XW, h: lh, size: sizes[k], weight: 900, color: k % 2 ? blue : ink, align: 'center', css: 'letter-spacing:-.035em;' }); y += lh; });
  if (has) E(root, 'abs', `left:${cx - 90}px;top:${y + 6}px;padding:12px 26px;border-radius:14px;background:${blue};color:#fff;font:800 34px/1 Inter,system-ui,sans-serif;transform:rotate(-6deg);box-shadow:0 14px 30px rgba(20,60,200,.3)`, acc);
  if (has) y += 70;
  if (s.sub) { const zz = fitSize(s.sub, { w: 760, h: 96, max: 30, min: 22, weight: 600, lh: 1.25 }); tx(root, 'ti-sub', s.sub, { x: cx - 380, y: y + 10, w: 760, h: 96, size: zz, weight: 600, color: C.sub, align: 'center', wrap: true, lh: 1.25 }); }
  const chips = (s.chips || []).slice(0, 4), pos = [[90, 840], [850, 780], [120, 1010], [830, 960]];
  chips.forEach((c, k) => { const [px, py] = pos[k]; E(root, 'abs', `left:${px}px;top:${py}px;width:96px;height:96px;border-radius:26px;background:#fff;box-shadow:0 12px 0 ${C.line},0 24px 34px rgba(20,40,140,.2);display:flex;align-items:center;justify-content:center;transform:rotate(${k % 2 ? 7 : -7}deg)`, icon(c.icon || 'bolt', 54, blue, 2.2)); });
  if (!photoEl(root, D, { left: cx - 290, top: 720, w: 580, h: 450 })) { const g = iso(svg, { cx, cy: 960, hw: 200, hh: 100, h: 70, color: C.blue }); g.style.opacity = '1'; }
}
// "editorial" cover (poster reference 4): serif masthead, hairline rules, a cut-away building whose floors are the topic's stages, side notes
function titleEditorial(root, s, D) {
  const paper = '#F5F0E3', ink = '#17181C', teal = '#2E7F86', gold = '#D9A93B', rule = '#17181C';
  root.prepend(E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px;background:${paper}`));
  const svg = svgLayer(root, W, H), x = X0, w = XW;
  if (s.kicker) tx(root, 'ti-kick', s.kicker, { x, y: BODY0 + 6, w, h: 34, size: 24, weight: 600, color: ink, align: 'center', font: 'serif', italic: true });
  const lines = []; { const ws = s.hook.split(/\s+/); let cur = []; const n = s.hook.length > 22 ? 2 : 1, tg = s.hook.length / n; ws.forEach(wd => { cur.push(wd); if (cur.join(' ').length >= tg && lines.length < n - 1) { lines.push(cur.join(' ')); cur = []; } }); if (cur.length) lines.push(cur.join(' ')); }
  const sz = Math.min(...lines.map(l => fitSize(l, { w: w, h: 120, max: 104, min: 48, weight: 800, font: 'serif', lh: 1 })), 104); let y = BODY0 + 50;
  lines.forEach((l, k) => { tx(root, 'ti-l' + k, l.toUpperCase(), { x, y, w, h: Math.ceil(sz * 1.12), size: Math.floor(sz * .86), weight: 800, color: ink, align: 'center', font: 'serif', css: 'letter-spacing:-.01em;' }); y += Math.ceil(sz * 1.16); });
  path(svg, `M${x} ${y + 10} H${x + w}`, { stroke: rule, w: 2 });
  if (s.sub) tx(root, 'ti-sub', s.sub.toUpperCase().slice(0, 60), { x, y: y + 22, w, h: 40, size: 20, weight: 600, color: ink, align: 'center', css: 'letter-spacing:.2em;' });
  // curved trumpet funnel: flared mouth with a 3D rim, gradient bands, people pouring in (a few dropping out), callouts on curved leaders, a glowing core
  const fl = (s.chips && s.chips.length >= 2 ? s.chips : [{ label: 'First' }, { label: 'Second' }, { label: 'Third' }]).slice(0, 4), n = fl.length, cx = 540;
  const top = y + (s.sub ? 150 : 110), stemY = BODY1 - 70, mouth = 300, neck = 46, bodyH = stemY - 60 - top, hw = t => neck + (mouth - neck) * Math.pow(1 - t, 1.9), Y = t => top + t * bodyH;
  const tint = [teal, gold, '#C8553D', '#3C6C9C'], defs = document.createElementNS(svgNS, 'defs'); svg.appendChild(defs);
  const shade = (hex, f) => { const v = parseInt(hex.slice(1), 16), c = i => Math.max(0, Math.min(255, Math.round(((v >> i) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; };
  const grad = (id, hex) => { const g = document.createElementNS(svgNS, 'linearGradient'); g.setAttribute('id', id); g.setAttribute('x1', '0'); g.setAttribute('x2', '1');
    [[0, shade(hex, .7)], [.22, mix(hex, .45)], [.34, mix(hex, .18)], [.62, hex], [1, shade(hex, .62)]].forEach(([o, c]) => { const t = document.createElementNS(svgNS, 'stop'); t.setAttribute('offset', o); t.setAttribute('stop-color', c); g.appendChild(t); }); defs.appendChild(g); return `url(#${id})`; };
  const f1 = v => v.toFixed(1), side = (t0, t1, sgn, rev) => { const pts = []; for (let i = 0; i <= 14; i++) { const t = t0 + (t1 - t0) * i / 14; pts.push(`${f1(cx + sgn * hw(t))} ${f1(Y(t))}`); } if (rev) pts.reverse(); return pts.join(' L'); };
  const ry = r => r * .17;
  path(svg, `M${cx - mouth - 40} ${stemY + 52}a${mouth + 40} 22 0 1 0 ${2 * (mouth + 40)} 0a${mouth + 40} 22 0 1 0 ${-2 * (mouth + 40)} 0`, { stroke: 'none', fill: ink, sharp: true }).setAttribute('opacity', '.06');   // floor shadow
  for (let k = n - 1; k >= 0; k--) {   // bottom band first so each band's front lip sits over the one below
    const t0 = k / n + (k ? .012 : 0), t1 = (k + 1) / n - .012, r0 = hw(t0), r1 = hw(t1), hex = tint[k % 4];
    path(svg, `M${side(t0, t1, -1)} A${f1(r1)} ${f1(ry(r1))} 0 0 0 ${f1(cx + r1)} ${f1(Y(t1))} L${side(t0, t1, 1, true)} A${f1(r0)} ${f1(ry(r0))} 0 0 1 ${f1(cx - r0)} ${f1(Y(t0))}Z`, { stroke: shade(hex, .7), w: 2.5, fill: grad('ed-g' + k, hex), sharp: true });
    if (k) path(svg, `M${f1(cx - r0)} ${f1(Y(t0))}A${f1(r0)} ${f1(ry(r0))} 0 0 1 ${f1(cx + r0)} ${f1(Y(t0))}`, { stroke: mix(hex, .55), w: 4, sharp: true });
    E(root, 'abs', `left:${cx - 30}px;top:${f1((Y(t0) + Y(t1)) / 2 - 2)}px;width:60px;height:36px;display:flex;align-items:center;justify-content:center;font:800 26px Lora,serif;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.3)`, String(k + 1).padStart(2, '0'));
  }
  path(svg, `M${cx - mouth} ${top}a${mouth} ${ry(mouth)} 0 1 0 ${2 * mouth} 0a${mouth} ${ry(mouth)} 0 1 0 ${-2 * mouth} 0`, { stroke: shade(teal, .65), w: 4, fill: '#FFFDF6', sharp: true });   // the open mouth
  path(svg, `M${cx - mouth + 22} ${top + 5}a${mouth - 22} ${ry(mouth) - 8} 0 1 0 ${2 * (mouth - 22)} 0a${mouth - 22} ${ry(mouth) - 8} 0 1 0 ${-2 * (mouth - 22)} 0`, { stroke: 'none', fill: shade(teal, .45), sharp: true });
  path(svg, `M${cx - mouth + 40} ${top - 6}A${mouth - 40} ${ry(mouth) - 14} 0 0 1 ${cx + mouth - 40} ${top - 6}`, { stroke: '#fff', w: 3, sharp: true }).setAttribute('opacity', '.7');
  for (let i = 0; i < 16; i++) { const a = i / 15, px = cx - 210 + 420 * a + Math.sin(i * 1.7) * 18, py = top - 52 - Math.sin(a * Math.PI) * 26 + (i % 3) * 9; circ(svg, px, py, 7 + (i % 3), { fill: tint[i % 4], stroke: paper, w: 2 }); }   // people pouring in
  [[.3, -1], [.55, 1], [.78, -1]].slice(0, n - 1).forEach(([t, sg], i) => { const x0 = cx + sg * hw(t), y0 = Y(t), x1 = x0 + sg * 120, y1 = y0 + 70;   // a few drop out
    path(svg, `M${f1(x0 + sg * 6)} ${f1(y0)}Q${f1(x0 + sg * 90)} ${f1(y0 - 30)} ${f1(x1)} ${f1(y1)}`, { stroke: ink, w: 2, dash: '3 7', sharp: true }); circ(svg, x1, y1 + 10, 8, { fill: tint[(i + 1) % 4], stroke: paper, w: 2 }); });
  path(svg, `M${cx - neck} ${f1(Y(1))}L${cx - neck * .8} ${stemY}A${neck * .8} 9 0 0 0 ${cx + neck * .8} ${stemY}L${cx + neck} ${f1(Y(1))}Z`, { stroke: shade(tint[(n - 1) % 4], .7), w: 2.5, fill: grad('ed-st', tint[(n - 1) % 4]), sharp: true });
  for (let g = 3; g >= 1; g--) circ(svg, cx, stemY + 34, 18 + g * 12, { fill: gold }).setAttribute('opacity', String(.12 * (4 - g)));
  E(root, 'abs', `left:${cx - 26}px;top:${stemY + 8}px;width:52px;height:52px;border-radius:50%;background:${gold};border:3px solid ${paper};display:flex;align-items:center;justify-content:center`, icon('star', 28, '#fff', 2.4));
  fl.forEach((f, k) => {   // callouts alternate sides, tied to their band by a curved leader
    const t = (k + .5) / n, sg = k % 2 ? 1 : -1, yb = Y(t), ex = cx + sg * (hw(t) + 8), cw = 290, bx = sg < 0 ? x : x + w - cw, by = yb - 38, hex = tint[k % 4];
    path(svg, `M${f1(ex)} ${f1(yb)}C${f1(ex + sg * 60)} ${f1(yb)} ${f1((sg < 0 ? bx + cw : bx) - sg * 50)} ${f1(by + 38)} ${f1(sg < 0 ? bx + cw : bx)} ${f1(by + 38)}`, { stroke: hex, w: 3, sharp: true }); circ(svg, ex, yb, 6, { fill: '#fff', stroke: hex, w: 3 });
    const b = box(root, { x: bx, y: by, w: cw, h: 76, r: 38, fill: '#FFFDF6', bd: hex, bw: 3, shadow: false, css: 'box-shadow:0 10px 22px rgba(23,24,28,.10);' });
    E(b, 'abs', `left:10px;top:${(76 - 6 - 52) / 2}px;width:52px;height:52px;border-radius:50%;background:${hex};display:flex;align-items:center;justify-content:center`, icon(f.icon || 'bolt', 28, '#fff', 2.2));
    tx(b, 'ti-f' + k, (f.label || '').toUpperCase(), { x: 74, y: 0, w: cw - 90, h: 70, size: fitSize((f.label || '').toUpperCase(), { w: cw - 90, h: 60, max: 24, min: 16, weight: 800, font: 'serif', lh: 1.1 }), weight: 800, color: ink, font: 'serif', css: 'letter-spacing:.02em;' });
  });
}
function titleTerminal(root, s) {        // the hook typed into a terminal window
  const x = X0, w = XW, y = BODY0 + 6, h = BODY1 - BODY0 - 6, iw = w - 90;
  const t = box(root, { x, y, w, h, r: 30, fill: DARK, bd: C.lineD, bw: 3, shadow: false, bg: true });
  E(t, 'abs', `left:0;top:0;width:100%;height:68px;background:#151B2A;border-radius:28px 28px 0 0`); dots3(t, 30, 25);
  tx(t, 'ti-win', s.window || 'claude', { x: 150, y: 10, w: w - 300, h: 48, size: 24, weight: 600, font: MONO, color: '#8793AD', align: 'center' });
  const hz = fitSize(s.hook, { w: iw, h: 560, max: 84, min: 44, weight: 800, font: 'serif', lh: 1.08 }), hh = Math.ceil(measure(s.hook, { size: hz, weight: 800, font: 'serif', w: iw, lh: 1.08 }).h) + 8;
  const sz = s.sub ? fitSize(s.sub, { w: iw, h: 130, max: 34, min: 22, weight: 500, font: MONO, lh: 1.3 }) : 0, sh = s.sub ? Math.ceil(measure(s.sub, { size: sz, weight: 500, font: MONO, w: iw, lh: 1.3 }).h) + 8 : 0;
  const total = (s.kicker ? 70 : 0) + 62 + hh + (s.sub ? 36 + sh : 0) + 70; let yy = 68 + Math.max(40, Math.floor((h - 68 - total) / 2));
  if (s.kicker) { const k = E(t, 'tx sans', `left:45px;top:${yy}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:700;letter-spacing:.06em;color:${C.clay};background:#2B2230;border:2.5px solid ${C.clay};border-radius:30px;padding:8px 22px`); const sp = E(k, '', 'display:block', '', 'span'); sp.textContent = s.kicker; k.dataset.id = 'ti-kicker'; k.dataset.text = s.kicker; yy += 70; }
  tx(t, 'ti-prompt', '$ ' + (s.prompt || 'claude'), { x: 45, y: yy, w: iw, h: 50, size: 34, weight: 600, font: MONO, color: '#6FD08A' }); yy += 62;
  tx(t, 'ti-hook', s.hook, { x: 45, y: yy, w: iw, h: hh, size: hz, weight: 800, font: 'serif', wrap: true, lh: 1.08, color: '#F3F0E8' }); yy += hh + 36;
  if (s.sub) { tx(t, 'ti-sub', s.sub, { x: 45, y: yy, w: iw, h: sh, size: sz, weight: 500, font: MONO, color: '#8793AD', wrap: true, lh: 1.3, css: 'align-items:flex-start;' }); yy += sh + 24; }
  E(t, 'abs', `left:45px;top:${yy}px;width:26px;height:44px;background:${C.clay}`);
}

const H_ = (t, size, w, weight = 500, lh = 1.25) => Math.ceil(measure(t, { size, weight, w, lh }).h);
// every funnel slide (cone, ring, tower, funnel rows) is drawn as the cone; old fields map onto title / sub / value
const coneSteps = s => ({ title: s.title, steps: (s.steps || (s.rows || []).map(r => ({ title: r.label, value: r.value }))).map(a => ({ title: a.title, icon: a.icon, sub: a.sub || a.note || a.tag || '', value: a.value || a.stat || '' })) });
const TYPES = {
  title(root, s, i, D) {
    if (s.layout === 'bold') return titleBold(root, s, D);
    if (s.layout === 'stage') return titleStage(root, s, D);
    if (s.layout === 'editorial') return titleEditorial(root, s, D);
    if (s.layout === 'poster') return titlePoster(root, s);
    if (s.layout === 'terminal') return titleTerminal(root, s);
    const P = PAL.clay, hz = fitSize(s.hook, { w: XW - 20, h: 470, max: 96, min: 52, weight: 700, font: 'serif', lh: 1.08 }), hh = Math.ceil(measure(s.hook, { size: hz, weight: 700, font: 'serif', w: XW - 20, lh: 1.08 }).h) + 8;
    const sz = s.sub ? fitSize(s.sub, { w: XW - 40, h: 130, max: 38, min: 24, weight: 500, lh: 1.25 }) : 0, sh = s.sub ? H_(s.sub, sz, XW - 40) + 8 : 0;
    const total = 132 + 40 + (s.kicker ? 60 : 0) + hh + (s.sub ? 28 + sh : 0), y0 = BODY0 + Math.max(10, Math.floor((BODY1 - BODY0 - total) / 2));
    E(root, 'abs', `left:${W - 360}px;top:${y0 - 40}px;width:560px;height:560px;border-radius:50%;background:${C.claySoft}`);
    E(root, 'abs', `left:${W - 270}px;top:${y0 + 50}px;width:380px;height:380px;border-radius:50%;background:${C.blueSoft}`);
    E(root, 'abs', `left:${X0}px;top:${y0}px;width:132px;height:132px;border-radius:36px;background:${P.bd};display:flex;align-items:center;justify-content:center;transform:rotate(-6deg);box-shadow:0 8px 0 ${C.line}`, icon(s.icon || 'bolt', 72, '#fff', 2));
    let y = y0 + 172;
    if (s.kicker) { const k = E(root, 'tx sans', `left:${X0}px;top:${y}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:700;letter-spacing:.06em;color:${P.ink};background:${P.soft};border:2.5px solid ${P.bd};border-radius:30px;padding:8px 22px`); const sp = E(k, '', 'display:block', '', 'span'); sp.textContent = s.kicker; k.dataset.id = 'ti-kick'; k.dataset.text = s.kicker; k.dataset.box = '1'; y += 60; }
    tx(root, 'ti-hook', s.hook, { x: X0, y, w: XW - 20, h: hh, size: hz, weight: 700, font: 'serif', wrap: true, lh: 1.08 }); y += hh + 28;
    if (s.sub) tx(root, 'ti-sub', s.sub, { x: X0, y, w: XW - 40, h: sh, size: sz, weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
  },
  points(root, s) {
    let y = heading(root, 'pt-h', s.title) + 26; const n = s.items.length, avail = BODY1 - y, sw = XW - 130;
    const ss = Math.min(...s.items.map(it => fitSize(it.sub || '', { w: sw, h: 120, max: 32, min: 22, weight: 500, lh: 1.25 })));
    const hs = s.items.map(it => Math.min(250, 22 + 58 + (it.sub ? H_(it.sub, ss, sw) + 8 : 0) + 22)), tot = hs.reduce((q, v) => q + v, 0), gap = Math.min(56, Math.max(18, Math.floor((avail - tot) / Math.max(1, n - 1))));
    y += Math.max(0, Math.floor((avail - (tot + (n - 1) * gap)) / 2) * .9);
    s.items.forEach((it, k) => { const ch = hs[k], P = PAL[it.group] || grp(k), b = box(root, { x: X0, y, w: XW, h: ch, r: 26, bd: P.bd, bw: 3 });
      numBadge(b, k + 1, P, 22, 20); tx(b, `pt${k}-t`, it.title, { x: 98, y: 14, w: XW - 120, h: 62, size: 40, weight: 700 });
      if (it.sub) tx(b, `pt${k}-s`, it.sub, { x: 98, y: 76, w: sw, h: ch - 76 - 14, size: ss, weight: 500, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); y += ch + gap; });
  },
  grid(root, s) {
    const svg = svgLayer(root, W, H), bh = s.kicker ? 150 : 124;
    banner(root, svg, { x: X0, y: BODY0 + 4, w: XW, h: bh, title: s.title, kicker: s.kicker });
    const ly = BODY0 + 4 + bh + 16; if (s.legend && s.legend.length) legend(root, svg, s.legend, { x: X0, y: ly, w: XW });
    const cy0 = ly + (s.legend && s.legend.length ? 56 : 0); cards(root, svg, s.cards, { x: X0, y: cy0, w: XW, h: BODY1 - cy0 });
  },
  stat(root, s) {
    const y = heading(root, 'st-h', s.title) + 10, cx = W / 2, R = 170, cy = y + R + 56, svg = svgLayer(root, W, H), L = 2 * Math.PI * R, pc = Math.max(0, Math.min(100, s.pct ?? 100));
    circ(svg, cx, cy, R, { fill: '#fff', stroke: C.line, w: 34 });
    const a = path(svg, `M${cx} ${cy - R} a${R} ${R} 0 1 1 -0.01 0`, { stroke: C.clay, w: 34 }); a.setAttribute('stroke-dasharray', `${L * pc / 100} ${L}`);
    tx(root, 'st-v', s.value, { x: cx - 150, y: cy - 80, w: 300, h: 160, size: s.value.length > 5 ? 76 : 104, weight: 700, font: 'serif', align: 'center', color: C.clayD });
    let ly = cy + R + 44; const lz = fitSize(s.label, { w: XW - 40, h: 110, max: 42, min: 28, weight: 700, lh: 1.15 }), lh = H_(s.label, lz, XW - 40, 700, 1.15) + 6;
    tx(root, 'st-l', s.label, { x: X0 + 20, y: ly, w: XW - 40, h: lh, size: lz, weight: 700, wrap: true, lh: 1.15, align: 'center' }); ly += lh + 14;
    if (s.sub) { const sz = fitSize(s.sub, { w: XW - 80, h: 100, max: 30, min: 22, weight: 500, lh: 1.25 }), sh = H_(s.sub, sz, XW - 80) + 6; tx(root, 'st-s', s.sub, { x: X0 + 40, y: ly, w: XW - 80, h: sh, size: sz, weight: 500, color: C.mid, wrap: true, lh: 1.25, align: 'center' }); ly += sh + 14; }
    const cols = 20, rows = 5, cell = 40, g = 6, gw = cols * cell + (cols - 1) * g, gx = (W - gw) / 2, gy = Math.max(ly + 24, BODY1 - rows * (cell + g) - 6);    // waffle: 100 cells, one per percent
    for (let k = 0; k < 100; k++) { const r_ = Math.floor(k / cols), c_ = k % cols; E(root, 'abs', `left:${gx + c_ * (cell + g)}px;top:${gy + r_ * (cell + g)}px;width:${cell}px;height:${cell}px;border-radius:10px;background:${k < pc ? C.clay : C.line}`); }
  },
  bars(root, s) {   // label above a thick rounded bar, value at its end; rows share the band evenly
    let y = heading(root, 'br-h', s.title) + 40; const n = s.rows.length, pitch = Math.min(250, Math.floor((BODY1 - y - 10) / n)), bh = Math.min(84, Math.round(pitch * .4)), TW = XW - 170;
    y += Math.max(0, Math.floor((BODY1 - y - n * pitch) / 2));
    s.rows.forEach((r, k) => { const P = grp(k), cy = y + k * pitch, bw = Math.max(bh, Math.round(TW * Math.max(0, Math.min(100, r.pct)) / 100));
      tx(root, `br${k}-l`, r.label, { x: X0, y: cy, w: TW, h: 54, size: 36, weight: 700 });
      E(root, 'abs', `left:${X0}px;top:${cy + 62}px;width:${TW}px;height:${bh}px;border-radius:${bh / 2}px;background:${C.sand}`);
      E(root, 'abs', `left:${X0}px;top:${cy + 62}px;width:${bw}px;height:${bh}px;border-radius:${bh / 2}px;background:linear-gradient(90deg,${P.bd},${P.ink});box-shadow:0 8px 18px ${P.bd}44`);
      tx(root, `br${k}-v`, r.value, { x: X0 + TW + 10, y: cy + 62 + (bh - 70) / 2, w: 160, h: 70, size: r.value.length > 5 ? 40 : 52, weight: 700, font: 'serif', color: P.ink, align: 'right' }); });
  },
  funnel(root, s) { return TYPES.cone(root, coneSteps(s)); },
  compare(root, s) {
    let y = heading(root, 'cm-h', s.title) + 30; const cw = (XW - 40) / 2, tw = cw - 70, all = [...s.left.items, ...s.right.items];
    const iz = Math.min(...all.map(t => fitSize(t, { w: tw, h: 220, max: 42, min: 22, weight: 500, lh: 1.25 })));
    const hs = [s.left, s.right].map(sd => sd.items.map(t => H_(t, iz, tw) + 26)), ch = Math.min(BODY1 - y - 10, Math.max(640, 118 + Math.max(...hs.map(a => a.reduce((x, q) => x + q, 0))) + 20));
    y += Math.max(0, Math.floor((BODY1 - y - ch) / 2) * .9);
    [s.left, s.right].forEach((side, k) => { const P = PAL[k ? 'clay' : 'blue'], x = X0 + k * (cw + 40), b = box(root, { x, y, w: cw, h: ch, r: 28, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:0;top:0;width:${cw - 6}px;height:96px;border-radius:24px 24px 0 0;background:${P.soft}`);
      tx(b, `cm${k}-h`, side.head, { x: 20, y: 8, w: cw - 46, h: 80, size: 36, weight: 700, color: P.ink, wrap: true, lh: 1.1 });
      const free = Math.max(0, ch - 118 - 24 - hs[k].reduce((x, q) => x + q, 0)), extra = Math.min(70, free / side.items.length);
      let yy = 118 + Math.min(40, extra / 2); side.items.forEach((t, j) => { const h = hs[k][j] + extra; E(b, 'abs', `left:20px;top:${yy + 14}px;width:14px;height:14px;border-radius:50%;background:${P.bd}`); tx(b, `cm${k}-${j}`, t, { x: 46, y: yy, w: tw, h: h - extra - 8, size: iz, weight: 500, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += h; }); });
    E(root, 'abs', `left:${W / 2 - 34}px;top:${y + 20}px;width:68px;height:68px;border-radius:50%;background:${C.ink};color:${C.bg};display:flex;align-items:center;justify-content:center;font:700 26px Inter,sans-serif`, 'VS');
  },
  flow(root, s) {
    let y = heading(root, 'fl-h', s.title) + 30; const n = s.steps.length, w = 880, x = (W - w) / 2, svg = svgLayer(root, W, H), sw = w - 150, avail = BODY1 - y;
    const ss = Math.min(...s.steps.map(t => fitSize(t.sub || '', { w: sw, h: 110, max: 30, min: 22, weight: 500, lh: 1.25 })));
    const ch = Math.min(240, Math.max(150, ...s.steps.map(t => 16 + 52 + (t.sub ? H_(t.sub, ss, sw) + 8 : 0) + 20))), gap = Math.min(96, Math.max(48, Math.floor((avail - n * ch) / Math.max(1, n - 1))));
    y += Math.max(0, Math.floor((avail - (n * ch + (n - 1) * gap)) / 2) * .9);
    s.steps.forEach((st, k) => { const P = PAL[st.group] || grp(k), b = box(root, { x, y, w, h: ch, r: 26, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:20px;top:${(ch - 80) / 2 - 3}px;width:80px;height:80px;border-radius:22px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(st.icon || 'bolt', 44, P.ink, 2));
      tx(b, `fl${k}-t`, st.title, { x: 122, y: 14, w: w - 144, h: 56, size: 38, weight: 700 }); if (st.sub) tx(b, `fl${k}-s`, st.sub, { x: 122, y: 70, w: sw, h: ch - 70 - 12, size: ss, weight: 500, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
      if (k < n - 1) { const ay = y + ch; path(svg, `M${W / 2} ${ay + 6} V${ay + gap - 16}`, { stroke: C.lineD, w: 4 }); const t = document.createElementNS(svgNS, 'path'); t.setAttribute('d', `M${W / 2 - 11} ${ay + gap - 24} L${W / 2} ${ay + gap - 8} L${W / 2 + 11} ${ay + gap - 24}`); t.setAttribute('fill', 'none'); t.setAttribute('stroke', C.lineD); t.setAttribute('stroke-width', 4); t.setAttribute('stroke-linecap', 'round'); t.setAttribute('stroke-linejoin', 'round'); svg.appendChild(t); }
      y += ch + gap; });
  },
  big(root, s) {
    E(root, 'abs', `left:${X0}px;top:200px;font:700 260px/1 Lora,serif;color:${C.claySoft}`, '“');
    const z = fitSize(s.big, { w: XW - 20, h: 560, max: 84, min: 44, weight: 700, font: 'serif', lh: 1.12 }), h = Math.ceil(measure(s.big, { size: z, weight: 700, font: 'serif', w: XW - 20, lh: 1.12 }).h) + 8;
    tx(root, 'bg-t', s.big, { x: X0, y: 330, w: XW - 20, h, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.12, color: C.clayD });
    if (s.sub) tx(root, 'bg-s', s.sub, { x: X0, y: 330 + h + 24, w: XW - 40, h: 150, size: fitSize(s.sub, { w: XW - 40, h: 150, max: 34, min: 24, weight: 500, lh: 1.25 }), weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
  },
  resources(root, s) {
    let y = heading(root, 'rs-h', s.title, BODY0 + 8, 52) + 14; const n = s.items.length, room = Math.min(292, Math.floor((BODY1 - y - (n - 1) * 18) / n));
    const wz = Math.min(...s.items.map(t => fitSize(t.why || '', { w: XW - 150, h: room - 138, max: 32, min: 19, weight: 500, lh: 1.25 })));
    const wh = Math.max(...s.items.map(t => Math.ceil(measure(t.why || '', { size: wz, weight: 500, w: XW - 124, lh: 1.25 }).h)));
    const ch = Math.min(room, 14 + 56 + 6 + wh + 14 + 44 + 16), used = n * ch + (n - 1) * 18; y += Math.max(0, Math.floor((BODY1 - y - used) * .4));
    s.items.forEach((it, k) => { const P = grp(s.offset + k), b = box(root, { x: X0, y, w: XW, h: ch, r: 26, bd: P.bd, bw: 3 });
      numBadge(b, s.offset + k + 1, P, 22, 20, 56); tx(b, `rs${k}-n`, it.name, { x: 94, y: 14, w: XW - 120, h: 56, size: 36, weight: 700 });
      tx(b, `rs${k}-w`, it.why, { x: 94, y: 76, w: XW - 124, h: wh + 4, size: wz, weight: 500, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' });
      const lw = Math.min(XW - 124, Math.round(it.short.length * 14.4 + 70)), link = E(b, 'abs', `left:94px;top:${ch - 62}px;width:${lw}px;height:44px;border-radius:22px;background:${C.sand};border:2px solid ${C.line}`, icon('globe', 24, P.ink, 2));
      tx(b, `rs${k}-u`, it.short, { x: 94 + 44, y: ch - 62 + 3, w: lw - 56, h: 34, size: 24, weight: 500, font: 'mono', color: C.ink }); y += ch + 18; });
  },
  loop(root, s) {
    let y = heading(root, 'lp-h', s.title) + 16; const n = s.steps.length, cx = W / 2, R = n === 3 ? 335 : 300, cy = Math.round((y + BODY1) / 2) + (n === 3 ? 30 : 0), bw = n === 3 ? 350 : 376, tz = Math.min(...s.steps.map(t => fitSize(t.title, { w: bw - 112, h: 52, max: 34, min: 24, weight: 700 })));
    const sz2 = Math.min(...s.steps.map(t => fitSize(t.sub || 'x', { w: bw - 116, h: 62, max: 25, min: 19, weight: 500, lh: 1.2 }))), sh2 = Math.max(...s.steps.map(t => t.sub ? Math.ceil(measure(t.sub, { size: sz2, weight: 500, w: bw - 116, lh: 1.2 }).h) : 0)), bhs = s.steps.map(t => Math.max(100, 62 + (t.sub ? Math.ceil(measure(t.sub, { size: sz2, weight: 500, w: bw - 116, lh: 1.2 }).h) : 0) + 16));
    const ang = k => (-90 + k * 360 / n) * Math.PI / 180, pt = (a, r = R) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    let g = `<defs></defs>`;
    for (let k = 0; k < n; k++) {
      const a0 = ang(k) + (n === 3 ? .52 : .5), a1 = ang(k + 1) - (n === 3 ? .52 : .5), [x0, y0] = pt(a0), [x1, y1] = pt(a1), ta = a1 + Math.PI / 2, hx = Math.cos(ta), hy = Math.sin(ta), px = -hy, py = hx;
      g += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${C.lineD}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 14"/>`;
      g += `<path d="M${x1 + hx * 26} ${y1 + hy * 26} L${x1 + px * 15} ${y1 + py * 15} L${x1 - px * 15} ${y1 - py * 15} Z" fill="${C.clay}"/>`;
    }
    E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px`, `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`);
    E(root, 'abs', `left:${cx - 95}px;top:${cy - 95}px;width:190px;height:190px;border-radius:50%;background:${C.claySoft};border:3px solid ${C.clay};display:flex;align-items:center;justify-content:center`, icon('refresh', 76, C.clayD, 2));
    if (s.center) tx(root, 'lp-c', s.center, { x: cx - 85, y: cy + 100, w: 170, h: 70, size: 22, wrap: true, lh: 1.15, weight: 700, color: C.ink, align: 'center' });
    s.steps.forEach((st, k) => { const bh = bhs[k], P = grp(k), [px, py] = pt(ang(k)), b = box(root, { x: Math.round(px - bw / 2), y: Math.round(py - bh / 2), w: bw, h: bh, r: 26, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:18px;top:${Math.round((bh - 6) / 2 - 31)}px;width:62px;height:62px;border-radius:18px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(st.icon || 'bolt', 36, P.ink, 2));
      tx(b, `lp${k}-t`, st.title, { x: 96, y: 12, w: bw - 108, h: 52, size: tz, weight: 700 });
      if (st.sub) tx(b, `lp${k}-s`, st.sub, { x: 96, y: 62, w: bw - 116, h: bh - 62 - 12, size: sz2, weight: 500, color: C.sub, wrap: true, lh: 1.2, css: 'align-items:flex-start;' }); });
  },
  stack(root, s) {
    let y = heading(root, 'sk-h', s.title) + 28; const n = s.rows.length, avail = BODY1 - y - 30, step = Math.min(210, Math.floor(avail / n)), rh = step - 18, shrink = n > 4 ? 56 : 76, top = y + Math.max(0, Math.floor((avail - n * step) / 2) * .8);
    s.rows.forEach((r, k) => { const P = grp(k), w = XW - k * shrink, x = Math.round((W - w) / 2), b = box(root, { x, y: top + k * step, w, h: rh, r: 30, fill: P.soft, bd: P.bd, bw: 3, shadow: false, css: `box-shadow:0 12px 0 ${P.bd};` });
      numBadge(b, k + 1, P, 22, Math.round((rh - 58) / 2));
      const sh = r.sub ? H_(r.sub, 26, w - 120, 500, 1.2) : 0, th = 46, top0 = Math.round((rh - th - (r.sub ? sh + 4 : 0)) / 2);
      tx(b, `sk${k}-t`, r.title, { x: 98, y: top0, w: w - 120, h: th, size: 36, weight: 700 });
      if (r.sub) tx(b, `sk${k}-s`, r.sub, { x: 98, y: top0 + th + 4, w: w - 120, h: sh, size: 26, weight: 500, color: C.sub, wrap: true, lh: 1.2, css: 'align-items:flex-start;' }); });
  },
  terminal(root, s) {
    let y = heading(root, 'tm-h', s.title) + 26; const w = XW, iw = w - 110, lines = s.lines, band = (BODY1 - y) * .9, hsOf = z => lines.map(t => Math.ceil(measure(t, { size: z, weight: 500, font: MONO, w: w - 72 - Math.round(z * 1.5), lh: 1.25 }).h) + 8);
    let sz = 31, hs = hsOf(31), gp = 26;   // grow the lines (and the gaps) until the window fills about 90% of the space under the heading
    for (let z = 42; z > 31; z--) { const h_ = hsOf(z); if (142 + h_.reduce((a, v) => a + v + 26, 0) + 30 <= band) { sz = z; hs = h_; break; } }
    gp = Math.max(26, Math.min(60, Math.floor((band - 172 - hs.reduce((a, v) => a + v, 0)) / lines.length)));
    const body = hs.reduce((a, v) => a + v + gp, 0), ph = 62 + 56 + 24 + body + 30, top = y + Math.max(0, Math.floor((BODY1 - y - ph) / 2) * .8);
    const t = box(root, { x: X0, y: top, w, h: ph, r: 30, fill: DARK, bd: C.lineD, bw: 3, shadow: false, bg: true });
    E(t, 'abs', `left:0;top:0;width:100%;height:62px;background:#151B2A;border-radius:28px 28px 0 0`); dots3(t, 28, 22);
    tx(t, 'tm-win', s.window || 'claude', { x: 150, y: 8, w: w - 300, h: 46, size: 22, weight: 600, font: MONO, color: '#8793AD', align: 'center' });
    tx(t, 'tm-p', '> ' + (s.prompt || ''), { x: 36, y: 82, w: w - 72, h: 50, size: 34, weight: 700, font: MONO, color: '#6FD08A' });
    let yy = 62 + 56 + 24;
    lines.forEach((l, k) => { const nx = 36 + Math.round(sz * 1.5); E(t, 'abs', `left:36px;top:${yy + 2}px;width:${nx - 40}px;height:${hs[k] - 4}px;color:${C.clay};font:700 ${sz}px 'JetBrains Mono',monospace;display:flex;align-items:flex-start`, `${k + 1}.`);
      tx(t, `tm${k}`, l, { x: nx, y: yy, w: w - nx - 36, h: hs[k], size: sz, weight: 500, font: MONO, color: '#E7E3D8', wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += hs[k] + gp; });
    E(t, 'abs', `left:36px;top:${ph - 52}px;width:20px;height:30px;background:${C.clay}`);
  },
  shot(root, s) {
    let y = heading(root, 'sh-h', s.title, BODY0 + 4, 50) + 16; const wz = 30, wh = s.why ? H_(s.why, wz, XW, 500) + 6 : 0, capH = wh + (s.why ? 16 : 0) + 52, CH = 58, fh = Math.min(CH + 6 + Math.round(XW * (s.ar || .609)), BODY1 - y - capH - 22); y += Math.max(0, Math.floor((BODY1 - y - capH - 22 - fh) * .5));
    const f = box(root, { x: X0, y, w: XW, h: fh, r: 26, bd: C.lineD, bw: 3, bg: true, css: 'overflow:hidden;' });
    E(f, 'abs', `left:0;top:0;width:100%;height:${CH}px;background:${C.sand};border-bottom:2px solid ${C.line}`); dots3(f, 22, 20);
    const ub = E(f, 'abs', `left:130px;top:10px;width:${XW - 160}px;height:38px;border-radius:19px;background:${C.card};border:2px solid ${C.line}`);
    tx(f, 'sh-u', s.host || '', { x: 150, y: 10, w: XW - 200, h: 38, size: 22, weight: 500, font: MONO, color: C.mid });
    E(f, 'abs', `left:0;top:${CH}px;width:100%;height:${fh - CH - 6}px;background:#fff url(${s.image}) center top/100% auto no-repeat`);
    let yy = y + fh + 14;
    if (s.why) { tx(root, 'sh-w', s.why, { x: X0, y: yy, w: XW, h: wh, size: wz, weight: 500, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += wh + 14; }
    const lw = Math.min(XW, Math.round((s.short || '').length * 14.4 + 120)), link = box(root, { x: X0, y: yy, w: lw, h: 46, r: 23, fill: C.sand, bd: C.line, bw: 2, shadow: false });
    E(link, 'abs', 'left:14px;top:10px', icon('globe', 24, C.clayD, 2)); tx(link, 'sh-l', s.short || '', { x: 52, y: 4, w: lw - 64, h: 36, size: 24, weight: 500, font: MONO });
  },
  ring(root, s) { return TYPES.cone(root, coneSteps(s)); },
  tower(root, s) { return TYPES.cone(root, coneSteps(s)); },
  // Glossy 3D cone funnel (v3): rounded slices stacked with a small gap, lit from the left (highlight streak, dark right edge), an open rim on top
  // and a short spout. Each slice carries its number; a card on the right (smooth leader, dot on the slice) holds icon, title, line and figure.
  cone(root, s) {
    const st = s.steps, n = st.length, y0 = heading(root, 'cn-h', s.title) + 34, svg = svgLayer(root, W, H), defs = document.createElementNS(svgNS, 'defs'); svg.appendChild(defs);
    const cx = 318, rx0 = 266, rx1 = 92, K = .2, gap = 12, spout = 78, rimH = Math.round(rx0 * K) + 6, yTop = y0 + rimH, th = Math.floor((BODY1 - 26 - spout - yTop - gap * (n - 1)) / n);
    const rad = d => rx0 + (rx1 - rx0) * d / n, shade = (hex, f) => { const v = parseInt(hex.slice(1), 16), c = i => Math.max(0, Math.min(255, Math.round(((v >> i) & 255) * f))); return `rgb(${c(16)},${c(8)},${c(0)})`; };
    const grad = (id, hex) => { const g = document.createElementNS(svgNS, 'linearGradient'); g.setAttribute('id', id); g.setAttribute('x1', '0'); g.setAttribute('x2', '1');
      [[0, shade(hex, .74)], [.16, mix(hex, .18)], [.3, mix(hex, .5)], [.42, mix(hex, .12)], [.7, hex], [1, shade(hex, .6)]].forEach(([o, c]) => { const t = document.createElementNS(svgNS, 'stop'); t.setAttribute('offset', o); t.setAttribute('stop-color', c); g.appendChild(t); }); defs.appendChild(g); return `url(#${id})`; };
    const ell = (x, y, a, b) => `M${x - a} ${y}a${a} ${b} 0 1 0 ${2 * a} 0a${a} ${b} 0 1 0 ${-2 * a} 0`;
    const glow = document.createElementNS(svgNS, 'radialGradient'); glow.setAttribute('id', 'cn-glow'); [[0, C.claySoft, 1], [1, C.claySoft, 0]].forEach(([o, c, a]) => { const t = document.createElementNS(svgNS, 'stop'); t.setAttribute('offset', o); t.setAttribute('stop-color', c); t.setAttribute('stop-opacity', a); glow.appendChild(t); }); defs.appendChild(glow);
    const bot = yTop + n * th + (n - 1) * gap, sw = rx1 * .5;
    path(svg, ell(cx, (yTop + bot) / 2, rx0 + 60, (bot - yTop) / 2 + 90), { stroke: 'none', fill: 'url(#cn-glow)' });
    [3, 2, 1].forEach(g => path(svg, ell(cx, bot + spout + 6, sw + 40 * g, 10 + 7 * g), { stroke: 'none', fill: C.ink }).setAttribute('opacity', String(.035 * (4 - g))));
    const sp = grad('cn-sp', grp(n - 1).bd);   // spout: a short rounded cylinder
    path(svg, `M${cx - sw} ${bot - 6}L${cx - sw} ${bot + spout - 12}A${sw} ${sw * K * 1.6} 0 0 0 ${cx + sw} ${bot + spout - 12}L${cx + sw} ${bot - 6}Z`, { stroke: shade(grp(n - 1).bd, .7), w: 3, fill: sp });
    const mids = [];
    for (let k = n - 1; k >= 0; k--) {
      const hex = grp(k).bd, yt = yTop + k * (th + gap), yb = yt + th, rt = rad(k), rb = rad(k + 1), at = rt * K, ab = rb * K;
      path(svg, `M${cx - rt} ${yt}A${rt} ${at} 0 0 0 ${cx + rt} ${yt}L${cx + rb} ${yb}A${rb} ${ab} 0 0 1 ${cx - rb} ${yb}Z`, { stroke: shade(hex, .72), w: 3, fill: grad('cn-g' + k, hex) });
      path(svg, `M${cx - rb + 10} ${yb + ab * .45}A${rb - 10} ${ab - 3} 0 0 0 ${cx + rb - 10} ${yb + ab * .45}`, { stroke: '#fff', w: 3 }).setAttribute('opacity', '.35');   // soft rim light under the lip
      path(svg, ell(cx, yt, rt, at), { stroke: shade(hex, .72), w: 3, fill: k ? mix(hex, .55) : C.card });
      if (!k) { path(svg, ell(cx, yt + 4, rt - 18, at - 7), { stroke: 'none', fill: shade(hex, .45) }); path(svg, `M${cx - rt + 26} ${yt - 3}A${rt - 26} ${at - 9} 0 0 1 ${cx + rt - 26} ${yt - 3}`, { stroke: '#fff', w: 3 }).setAttribute('opacity', '.6'); }
      const lab = String(k + 1).padStart(2, '0'), yc = (yt + at * .5 + yb + ab) / 2;
      E(root, 'abs', `left:${cx - 80}px;top:${yc - 32}px;width:160px;height:64px;display:flex;align-items:center;justify-content:center;font:700 ${th > 120 ? 50 : 40}px Lora,serif;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.25)`, lab);
      mids[k] = { yc, ex: cx + (rt + rb) / 2 };
    }
    const CX0 = 652, CW = W - X0 - CX0, ch = Math.min(th + gap - 10, 214), anyV = st.some(a => a.value);
    const subS = Math.min(...st.map(a => a.sub ? fitSize(a.sub, { w: CW - 40, h: ch - 82 - (anyV ? 0 : 0), max: 25, min: 19, weight: 500, lh: 1.22 }) : 25));
    const vwOf = a => a.value && a.value.length <= 8 ? 120 : 0, tz = Math.min(...st.map(a => fitSize(a.title, { w: CW - 96 - vwOf(a), h: 56, max: 30, min: 20, weight: 700, lh: 1.08 })));
    st.forEach((a, k) => {
      const P = grp(k), { yc, ex } = mids[k], y = Math.round(Math.max(y0 - 8, Math.min(BODY1 - 12 - ch, yc - ch / 2)));
      path(svg, `M${ex} ${yc}C${ex + 90} ${yc} ${CX0 - 90} ${y + ch / 2} ${CX0 - 4} ${y + ch / 2}`, { stroke: P.bd, w: 3, dash: '2 9' }); circ(svg, ex, yc, 8, { fill: C.card, stroke: P.bd, w: 4 });
      const b = box(root, { x: CX0, y, w: CW, h: ch, r: 26, bd: P.bd, bw: 3, css: `box-shadow:0 10px 24px rgba(20,20,19,.08);` });
      E(b, 'abs', `left:16px;top:16px;width:52px;height:52px;border-radius:16px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(a.icon || 'star', 30, P.ink, 2.1));
      const vw = vwOf(a);
      tx(b, `cn${k}-t`, a.title, { x: 80, y: 14, w: CW - 96 - vw, h: 56, size: tz, weight: 700, wrap: true, lh: 1.08 });
      if (vw) tx(b, `cn${k}-v`, a.value, { x: CW - 16 - vw, y: 12, w: vw, h: 60, size: a.value.length > 5 ? 32 : 42, weight: 700, font: 'serif', color: P.ink, align: 'right' });
      let yy = 80;
      if (a.sub) { const hh = Math.min(ch - yy - (a.value && !vw ? 46 : 12), H_(a.sub, subS, CW - 40, 500, 1.22) + 4); tx(b, `cn${k}-s`, a.sub, { x: 20, y: yy, w: CW - 40, h: hh, size: subS, weight: 500, color: C.sub, wrap: true, lh: 1.22, css: 'align-items:flex-start;' }); yy += hh + 6; }
      if (a.value && !vw) tx(b, `cn${k}-v`, a.value, { x: 20, y: ch - 44, w: CW - 40, h: 34, size: fitSize(a.value, { w: CW - 40, h: 34, max: 24, min: 18, weight: 700, lh: 1.1 }), weight: 700, color: P.ink });
    });
  },
  closing(root, s, i, D) {
    // closing slide: a large question, optional "next step" rows, and a profile card with the follow button; the group is centred in the body band
    const b = D.brand, lines = s.lines || [], nl = lines.length, TW = XW - 40, z = fitSize(s.title, { w: TW, h: 300, max: 84, min: 48, weight: 700, font: 'serif', lh: 1.08 });
    const h = Math.ceil(measure(s.title, { size: z, weight: 700, font: 'serif', w: TW, lh: 1.08 }).h) + 6, cardH = 220, ctaH = 0, g = 38;   // the brand CTA pill sits in the frame on every slide
    const total = h + g + nl * 108 + (nl ? g - 12 : 0) + cardH, y0 = BODY0 + Math.max(0, Math.floor((BODY1 - BODY0 - total) / 2));
    tx(root, 'cl-h', s.title, { x: X0 + 20, y: y0, w: TW, h, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.08, align: 'center' });
    let y = y0 + h + g;
    lines.forEach((t, k) => { const P = grp(k), bx = box(root, { x: X0 + 40, y, w: XW - 80, h: 92, r: 46, bd: P.bd, bw: 3, shadow: false });
      E(bx, 'abs', `left:18px;top:16px;width:54px;height:54px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon('check', 32, P.ink, 2.4));
      tx(bx, `cl${k}`, t, { x: 92, y: 0, w: XW - 80 - 110, h: 86, size: 32, weight: 600 }); y += 108; });
    if (nl) y += g - 12;
    const cd = box(root, { x: X0 + 20, y, w: TW, h: cardH, r: 30, fill: C.card, bd: C.lineD, bw: 3, shadow: false });
    E(cd, 'abs', `left:30px;top:${(cardH - 150) / 2 - 3}px;width:150px;height:150px;border-radius:${b.avatar_shape === 'circle' ? '50%' : '26%'};background:url(${b.avatar || 'assets/avatar.png'}) center/cover;border:3px solid ${C.card};box-shadow:0 0 0 3px ${C.clay}`);
    tx(cd, 'cl-follow', b.follow || 'Follow', { x: 212, y: 34, w: TW - 250, h: 36, size: 26, weight: 600, color: C.mid });
    tx(cd, 'cl-name', b.name, { x: 212, y: 70, w: TW - 250, h: 58, size: 46, weight: 700 });
    tx(cd, 'cl-tag', b.tagline || '', { x: 212, y: 134, w: TW - 250, h: 70, size: 28, weight: 500, color: C.mid, wrap: true, lh: 1.2 });
  },
};

Object.assign(TYPES, charts({ heading, grp, H_, X0, XW, W, BODY1 }));
TYPES.arch = (root, s) => { const y = heading(root, 'ar-h', s.title) + 24; renderArch(root, s, { x: X0, y, w: XW, h: BODY1 - y - 6 }); };   // architecture slide (engine/arch.js)
// Underfit guard. The slide heading stays pinned at the top so every slide looks the same; everything below it is scaled up (never down, up to 1.3x,
// from its top-left corner) when it fills less than ~88% of the space under the heading, then centred there. Painted extents only (text glyphs, svg/img,
// filled or bordered boxes), measured while the slide is briefly shown, before anything is rendered.
function paintedRects(wrap) {
  const rs = [], rg = document.createRange();
  for (const e of wrap.querySelectorAll('*')) {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || (r.width >= W - 8 && r.height >= H - 8)) continue;
    const painted = e instanceof SVGElement ? /^(circle|path|rect|ellipse|line|polygon|polyline|image)$/.test(e.tagName) : (e.tagName === 'IMG' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none');
    if (painted) rs.push(r);
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 2) rs.push(q); }
  }
  return rs;
}
function fitBody(root, from) {
  const all = [...root.children].slice(from); if (!all.length) return;
  const prev = root.style.display; root.style.display = 'block';   // hidden slides have no layout, so show it while measuring
  const head = all.find(k => /-h$/.test(k.dataset.id || '')), kids = all.filter(k => k !== head);
  let top0 = BODY0 + 8; if (head) { const hr = head.getBoundingClientRect(); top0 = Math.ceil(hr.bottom) + 26; }
  const wrap = E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px`); kids.forEach(k => wrap.appendChild(k));
  const rs = paintedRects(wrap); root.style.display = prev; if (!rs.length) return;
  const L = Math.min(...rs.map(r => r.left)), T = Math.min(...rs.map(r => r.top)), R = Math.max(...rs.map(r => r.right)), B = Math.max(...rs.map(r => r.bottom)), bw = R - L, bh = B - T, band = BODY1 - 12 - top0;
  if (bh >= band * .88 || band < 200) return;
  const sc = Math.max(1, Math.min(1.3, band / bh, (W - X0 - L) / bw)), top = top0 + (band - bh * sc) * .45;
  wrap.style.transformOrigin = `${L}px ${T}px`; wrap.style.transform = `translate(0px,${top - T}px) scale(${sc})`;
}

export function buildCarousel(stage, D) {
  const c = D.carousel, slides = c.deck, n = slides.length, roots = []; applyTheme(stage, c.theme);
  slides.forEach((s, i) => {
    const root = E(stage, 'scene'); root.style.display = 'none'; root.style.opacity = '1'; roots.push(root);
    frame(root, i, n, D.brand, !!c.single); const nf = root.children.length;
    TYPES[s.type](root, s, i, D);
    if (s.type !== 'title' && s.type !== 'closing') fitBody(root, nf);
  });
  return { DUR: n, N: n, render(t) { const k = Math.max(0, Math.min(n - 1, Math.floor(t + 1e-6))); roots.forEach((r, i) => { r.style.display = i === k ? 'block' : 'none'; }); } };
}
