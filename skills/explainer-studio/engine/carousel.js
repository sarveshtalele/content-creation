// Carousel: 5-7 portrait slides (1080x1350) for a LinkedIn document post. Every slide shares a frame (brand bar, progress segments, an editable CTA strip);
// the body is one of a few infographic slide types. Slides are static (a still per slide), so every build is identical.
import { C, E, box, tx, icon, svgLayer, path, circ, fitSize, measure, svgNS } from './kit.js';
import { PAL } from './gif_common.js';
import { iso, mix } from './gif_3d.js';
import { cta } from './cta.js';

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
const W = 1080, H = 1350, X0 = 48, XW = W - 2 * X0, BODY0 = 128, BODY1 = 1170, GROUPS = ['blue', 'clay', 'green'];
const grp = i => PAL[GROUPS[i % 3]];
const arrow = (c, s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;

function frame(root, i, n, brand, ctaText, last) {
  E(root, 'abs', `left:${X0}px;top:36px;width:56px;height:56px;border-radius:${brand.avatar_shape === 'circle' ? '50%' : '26%'};background:url(${brand.avatar || 'assets/avatar.png'}) center/cover;border:3px solid ${C.card};box-shadow:0 0 0 2px ${C.line}`);
  tx(root, 'fr-name', brand.name, { x: X0 + 70, y: 36, w: 560, h: 56, size: 26, weight: 700 });
  tx(root, 'fr-count', `${i + 1} / ${n}`, { x: W - X0 - 160, y: 36, w: 160, h: 56, size: 26, weight: 600, color: C.mid, align: 'right' });
  const gap = 8, sw = (XW - gap * (n - 1)) / n;
  for (let k = 0; k < n; k++) E(root, 'abs', `left:${X0 + k * (sw + gap)}px;top:104px;width:${sw}px;height:7px;border-radius:4px;background:${k <= i ? C.clay : C.line}`);
  const b = box(root, { x: X0, y: 1196, w: XW, h: 88, r: 44, fill: C.claySoft, bd: C.clay, bw: 3, shadow: false });
  tx(b, 'fr-cta', ctaText, { x: 36, y: 0, w: XW - 36 - 96, h: 82, size: 30, weight: 700, color: C.clayD });
  if (!last) E(b, 'abs', `left:${XW - 76}px;top:15px;width:52px;height:52px;border-radius:50%;background:${C.clay};display:flex;align-items:center;justify-content:center`, arrow(C.onAcc, 30));
  else E(b, 'abs', `left:${XW - 76}px;top:15px;width:52px;height:52px;border-radius:50%;background:${C.clay};display:flex;align-items:center;justify-content:center`, icon('check', 32, C.onAcc, 2.4));
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
  let yy = 200; if (s.kicker) { const kk = E(bgp, 'tx sans', `left:48px;top:${yy}px;position:absolute;display:inline-flex;align-items:center;white-space:nowrap;font-size:26px;font-weight:800;letter-spacing:.08em;color:${C.clay};background:${C.onAcc};border-radius:30px;padding:8px 22px`); const sp = E(kk, '', 'display:block', '', 'span'); sp.textContent = s.kicker; kk.dataset.id = 'ti-kicker'; kk.dataset.text = s.kicker; yy += k; }
  tx(bgp, 'ti-hook', s.hook, { x: 48, y: yy, w: iw, h: hh, size: hz, weight: 800, font: 'serif', wrap: true, lh: 1.04, color: C.onAcc }); yy += hh + 26;
  if (s.sub) tx(bgp, 'ti-sub', s.sub, { x: 48, y: yy, w: iw, h: sh, size: sz, weight: 600, color: C.onAcc, wrap: true, lh: 1.25, css: 'align-items:flex-start;opacity:.92;' });
  E(bgp, 'abs', `right:48px;bottom:44px;width:96px;height:96px;border-radius:50%;background:${C.onAcc};display:flex;align-items:center;justify-content:center`, arrow(C.clay, 52));
}

// "bold" cover, after the poster references: one giant headline, one word on a colour box, a swoosh, a short line of copy, a 3D object built from the topic
// and a row of topic chips. No photo: just the title and related infographics.
function textW(t, size, weight) { const e = E(document.body, 'sans', `position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;font-size:${size}px;font-weight:${weight};letter-spacing:-.03em`); e.textContent = t; const w = e.getBoundingClientRect().width; e.remove(); return w; }
function titleBold(root, s) {
  const x = X0, w = XW, y0 = BODY0 + 14, hue = C.blueD, acc = C.green;
  E(root, 'abs', `left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(900px 700px at 70% 55%,${C.blueSoft},transparent 70%);opacity:.9`);
  const svg = svgLayer(root, W, H);
  path(svg, `M-20 1010 C200 930 380 1060 620 960 S960 800 1110 760`, { stroke: acc, w: 12 });
  const accent = (s.accent || '').trim(), hk = s.hook, ai = accent ? hk.toLowerCase().indexOf(accent.toLowerCase()) : -1;
  const split = t => { const ws = t.split(/\s+/).filter(Boolean), n = Math.max(1, Math.ceil(t.length / 16)), out = []; let cur = [], target = t.length / n; ws.forEach(wd => { cur.push(wd); if (cur.join(' ').length >= target && out.length < n - 1) { out.push(cur.join(' ')); cur = []; } }); if (cur.length) out.push(cur.join(' ')); return out; };
  const parts = ai < 0 ? split(hk).map(t => ({ t })) : [...(hk.slice(0, ai).trim() ? split(hk.slice(0, ai).trim()).map(t => ({ t })) : []), { t: hk.slice(ai, ai + accent.length), hi: true }, ...(hk.slice(ai + accent.length).trim() ? split(hk.slice(ai + accent.length).trim()).map(t => ({ t })) : [])];
  const sz = Math.min(...parts.map(p => fitSize(p.t, { w: w - 40, h: 170, max: hk.length > 36 ? 84 : 112, min: 54, weight: 900, lh: 1 })), hk.length > 36 ? 84 : 112), lh = Math.ceil(sz * 1.2) + 1;
  let y = y0; if (s.kicker) { tx(root, 'ti-kick', s.kicker.toUpperCase(), { x, y, w, h: 44, size: 28, weight: 800, color: C.blue, css: 'letter-spacing:.22em;' }); y += 60; }
  parts.forEach((p, k) => {
    if (p.hi) { const mw = textW(p.t, sz, 900), bx = E(root, 'abs', `left:${x - 12}px;top:${y + 24}px;width:${Math.ceil(mw) + 36}px;height:${lh - 22}px;background:${acc};transform:rotate(-1.6deg);border-radius:8px`);
      tx(bx, 'ti-l' + k, p.t, { x: 12, y: -14, w: Math.ceil(mw) + 24, h: lh, size: sz, weight: 900, color: '#fff', css: 'letter-spacing:-.03em;' }); y += lh + 4; return; }
    tx(root, 'ti-l' + k, p.t, { x, y, w: w, h: lh, size: sz, weight: 900, color: hue, css: 'letter-spacing:-.03em;' }); y += lh;
  });
  y += 14;
  if (s.sub) { const zz = fitSize(s.sub, { w: 560, h: 120, max: 32, min: 22, weight: 600, lh: 1.25 }); tx(root, 'ti-sub', s.sub, { x, y: y + 8, w: 560, h: H_(s.sub, zz, 560, 600) + 6, size: zz, weight: 600, color: C.sub, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); }
  // 3D object: three isometric slabs stacked, with floating icon tiles (the topic's own icons)
  const chips = (s.chips || []).slice(0, 4), cx = 810, base = hk.length > 36 ? 950 : 930, sc = hk.length > 36 ? .72 : 1, cols = [C.blue, C.clay, C.green];
  for (let k = 0; k < 3; k++) { const g = iso(svg, { cx, cy: base - k * 110 * sc, hw: (190 - k * 26) * sc, hh: (95 - k * 13) * sc, h: 70 * sc, color: cols[k] }); g.style.opacity = '1'; }
  const tiles = chips.length ? chips : [{ icon: s.icon || 'bolt' }];
  tiles.forEach((c, k) => { const tx_ = [640, 960, 700, 940][k] ?? 700, ty = hk.length > 36 ? [830, 730, 930, 890][k] : [830, 640, 960, 880][k]; const t = E(root, 'abs', `left:${tx_ - 40}px;top:${ty - 40}px;width:80px;height:80px;border-radius:22px;background:#fff;box-shadow:0 10px 0 ${C.line},0 18px 30px rgba(20,40,120,.18);display:flex;align-items:center;justify-content:center;transform:rotate(${k % 2 ? 6 : -6}deg)`, icon(c.icon || 'bolt', 44, hue, 2.2)); });
  // chip row at the bottom: icon + short label (like the footer row on the poster reference)
  if (chips.length) { const cw = Math.floor(w / chips.length); chips.forEach((c, k) => { E(root, 'abs', `left:${x + k * cw}px;top:1088px;width:46px;height:46px;display:flex;align-items:center;justify-content:center`, icon(c.icon || 'bolt', 40, hue, 2.2)); tx(root, 'ti-c' + k, (c.label || '').toUpperCase(), { x: x + k * cw + 58, y: 1084, w: cw - 66, h: 54, size: 22, weight: 800, color: hue, wrap: true, lh: 1.05, css: 'letter-spacing:.04em;' }); }); }
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
const TYPES = {
  title(root, s, i, D) {
    if (s.layout === 'bold') return titleBold(root, s);
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
  bars(root, s) {
    let y = heading(root, 'br-h', s.title) + 30; const n = s.rows.length, pitch = Math.min(150, Math.floor((BODY1 - y) / n)), TW = 560, TX = X0 + 250;
    s.rows.forEach((r, k) => { const P = grp(k), cy = y + k * pitch;
      tx(root, `br${k}-l`, r.label, { x: X0, y: cy, w: 236, h: 64, size: 30, weight: 700, wrap: true, lh: 1.1 });
      E(root, 'abs', `left:${TX}px;top:${cy + 12}px;width:${TW}px;height:42px;border-radius:21px;background:${C.line}`);
      E(root, 'abs', `left:${TX}px;top:${cy + 12}px;width:${Math.round(TW * Math.max(0, Math.min(100, r.pct)) / 100)}px;height:42px;border-radius:21px;background:${P.bd}`);
      tx(root, `br${k}-v`, r.value, { x: TX + TW + 12, y: cy, w: W - X0 - (TX + TW + 12), h: 66, size: 34, weight: 700, color: P.ink, align: 'right' }); });
  },
  funnel(root, s) {   // narrowing stages: widths follow pct, label inside, value on the right
    let y = heading(root, 'fn-h', s.title) + 30; const n = s.rows.length, gap = 14, rh = Math.min(150, Math.floor((BODY1 - y - 20 - (n - 1) * gap) / n)), FW = XW;
    y += Math.max(0, Math.floor((BODY1 - y - (n * rh + (n - 1) * gap)) / 2) * .8);
    s.rows.forEach((r, k) => { const P = grp(k), w = Math.max(360, Math.round(FW * Math.max(0, Math.min(100, r.pct)) / 100)), x = X0 + Math.round((FW - w) / 2), cy = y + k * (rh + gap);
      E(root, 'abs', `left:${x}px;top:${cy}px;width:${w}px;height:${rh}px;border-radius:22px;background:${P.soft};border:3px solid ${P.bd}`);
      tx(root, `fn${k}-l`, r.label, { x: x + 22, y: cy + 8, w: w - 44, h: Math.round(rh * .48), size: 32, weight: 700, color: P.ink, align: 'center', wrap: true, lh: 1.1 });
      tx(root, `fn${k}-v`, r.value, { x: x + 22, y: cy + Math.round(rh * .5), w: w - 44, h: Math.round(rh * .42), size: 40, weight: 700, color: P.ink, align: 'center', font: 'serif' }); });
  },
  compare(root, s) {
    let y = heading(root, 'cm-h', s.title) + 30; const cw = (XW - 40) / 2, tw = cw - 70, all = [...s.left.items, ...s.right.items];
    const iz = Math.min(...all.map(t => fitSize(t, { w: tw, h: 190, max: 38, min: 22, weight: 500, lh: 1.25 })));
    const hs = [s.left, s.right].map(sd => sd.items.map(t => H_(t, iz, tw) + 26)), ch = Math.min(BODY1 - y - 10, 118 + Math.max(...hs.map(a => a.reduce((x, q) => x + q, 0))) + 20);
    y += Math.max(0, Math.floor((BODY1 - y - ch) / 2) * .9);
    [s.left, s.right].forEach((side, k) => { const P = PAL[k ? 'clay' : 'blue'], x = X0 + k * (cw + 40), b = box(root, { x, y, w: cw, h: ch, r: 28, bd: P.bd, bw: 3 });
      E(b, 'abs', `left:0;top:0;width:${cw - 6}px;height:96px;border-radius:24px 24px 0 0;background:${P.soft}`);
      tx(b, `cm${k}-h`, side.head, { x: 20, y: 8, w: cw - 46, h: 80, size: 36, weight: 700, color: P.ink, wrap: true, lh: 1.1 });
      let yy = 118; side.items.forEach((t, j) => { const h = hs[k][j]; E(b, 'abs', `left:20px;top:${yy + 14}px;width:14px;height:14px;border-radius:50%;background:${P.bd}`); tx(b, `cm${k}-${j}`, t, { x: 46, y: yy, w: tw, h: h - 8, size: iz, weight: 500, wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += h; }); });
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
    let y = heading(root, 'tm-h', s.title) + 26; const w = XW, iw = w - 110, sz = 31, lines = s.lines, hs = lines.map(t => Math.ceil(measure(t, { size: sz, weight: 500, font: MONO, w: iw, lh: 1.25 }).h) + 8);
    const body = hs.reduce((a, v) => a + v + 26, 0), ph = 62 + 56 + 24 + body + 30, top = y + Math.max(0, Math.floor((BODY1 - y - ph) / 2) * .8);
    const t = box(root, { x: X0, y: top, w, h: ph, r: 30, fill: DARK, bd: C.lineD, bw: 3, shadow: false, bg: true });
    E(t, 'abs', `left:0;top:0;width:100%;height:62px;background:#151B2A;border-radius:28px 28px 0 0`); dots3(t, 28, 22);
    tx(t, 'tm-win', s.window || 'claude', { x: 150, y: 8, w: w - 300, h: 46, size: 22, weight: 600, font: MONO, color: '#8793AD', align: 'center' });
    tx(t, 'tm-p', '> ' + (s.prompt || ''), { x: 36, y: 82, w: w - 72, h: 50, size: 34, weight: 700, font: MONO, color: '#6FD08A' });
    let yy = 62 + 56 + 24;
    lines.forEach((l, k) => { E(t, 'abs', `left:36px;top:${yy + 2}px;width:40px;height:${hs[k] - 4}px;color:${C.clay};font:700 ${sz}px 'JetBrains Mono',monospace;display:flex;align-items:flex-start`, `${k + 1}.`);
      tx(t, `tm${k}`, l, { x: 84, y: yy, w: iw - 14, h: hs[k], size: sz, weight: 500, font: MONO, color: '#E7E3D8', wrap: true, lh: 1.25, css: 'align-items:flex-start;' }); yy += hs[k] + 26; });
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
  closing(root, s, i, D) {
    const b = D.brand, z = fitSize(s.title, { w: XW, h: 180, max: 72, min: 44, weight: 700, font: 'serif', lh: 1.1 }), h = Math.ceil(measure(s.title, { size: z, weight: 700, font: 'serif', w: XW, lh: 1.1 }).h) + 6, nl = (s.lines || []).length;
    const total = h + 34 + nl * 112 + 30 + 24 + 104, y0 = BODY0 + Math.max(10, Math.floor((BODY1 - BODY0 - total) / 2));
    tx(root, 'cl-h', s.title, { x: X0, y: y0, w: XW, h, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.1, align: 'center' });
    let y = y0 + h + 34;
    (s.lines || []).forEach((t, k) => { const P = grp(k), bx = box(root, { x: X0 + 40, y, w: XW - 80, h: 92, r: 46, bd: P.bd, bw: 3, shadow: false });
      E(bx, 'abs', `left:18px;top:16px;width:54px;height:54px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon('check', 32, P.ink, 2.4)); tx(bx, `cl${k}`, t, { x: 92, y: 0, w: XW - 80 - 116, h: 86, size: 34, weight: 600 }); y += 112; });
    y += 30;
    cta(root, 'cl-cta', b, { x: 60, y: y + 20, w: 960, h: 104, size: 28, bw: 4 });
  },
};

export function buildCarousel(stage, D) {
  const c = D.carousel, slides = c.deck, n = slides.length, roots = []; applyTheme(stage, c.theme);
  slides.forEach((s, i) => {
    const root = E(stage, 'scene'); root.style.display = 'none'; root.style.opacity = '1'; roots.push(root);
    frame(root, i, n, D.brand, s.cta || '', i === n - 1);
    TYPES[s.type](root, s, i, D);
  });
  return { DUR: n, N: n, render(t) { const k = Math.max(0, Math.min(n - 1, Math.floor(t + 1e-6))); roots.forEach((r, i) => { r.style.display = i === k ? 'block' : 'none'; }); } };
}
