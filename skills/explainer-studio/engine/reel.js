// Reel scenes (1080x1920). Generic, data-driven: each builder(root, sc) → update(t). sc.props = scene content, sc.at[i] = absolute time part i appears.
import { C, E, box, tx, svgLayer, path, circ, draw, headAt, tri, icon, spark, enter, chip, est, fit, PALS, clamp, seg, eo, back } from './kit.js';
import { cta } from './cta.js';

const when = (sc, i) => sc.at[Math.min(i, sc.at.length - 1)];
const pop = (n, t, t0, o = {}) => enter(n, t, t0, { dy: 22, sc: .95, pop: true, d: .5, ...o });
const KICK = { hook: 'THE QUESTION', flow: 'HOW IT FLOWS', map: 'THE BIG PICTURE', cards: 'THE PIECES', list: 'STEP BY STEP', chips: 'THE OPTIONS', dialog: 'IN PRACTICE', big: 'KEY IDEA' };

function head(root, sc, withTitle = true) {
  const p = sc.props, kt = p.kicker || KICK[sc.type];
  const k = E(root, 'abs', 'left:60px;top:262px;height:44px;display:flex;align-items:center;gap:12px');
  E(k, '', 'width:30px;height:30px', spark(30, C.clay));
  const kd = E(k, 'tx sans', `font-size:24px;font-weight:700;letter-spacing:.16em;color:${C.clayD};white-space:nowrap`); E(kd, '', 'display:block', '', 'span').textContent = kt; kd.dataset.id = sc.id + '-k'; kd.dataset.text = kt;
  let ti = null;
  if (withTitle && p.title) ti = tx(root, sc.id + '-title', p.title, { x: 60, y: 330, w: 960, h: Math.min(170, est(p.title, 60, 960, 1.1) + 10), size: 60, weight: 600, font: 'serif', wrap: true, lh: 1.1 });
  return { k, ti, anim: t => { enter(k, t, sc.t0 + .1, { dy: 10 }); if (ti) enter(ti, t, sc.t0 + .15, { dy: 18, d: .55 }); } };
}
const flex = (root, x, y, w, css = '') => E(root, 'abs', `left:${x}px;top:${y}px;width:${w}px;display:flex;flex-wrap:wrap;gap:18px;${css}`);

// ── hook: the opening question ──
function hook(root, sc) {
  const p = sc.props, h = head(root, sc, false);
  const size = fit(p.q, [[44, 104], [64, 92], [90, 80], [120, 70], [200, 62]]), qh = est(p.q, size, 920, 1.12) + 16;
  const q = tx(root, sc.id + '-q', p.q, { x: 80, y: 340, w: 920, h: qh, size, weight: 600, font: 'serif', wrap: true, lh: 1.12 });
  let y = 340 + qh + 36, sub = null;
  if (p.sub) { const sh = est(p.sub, 40, 920, 1.25) + 12; sub = tx(root, sc.id + '-sub', p.sub, { x: 80, y, w: 920, h: sh, size: 40, weight: 500, color: C.mid, wrap: true, lh: 1.25 }); y += sh + 36; }
  const row = flex(root, 80, y, 920), chips = (p.chips || []).map((c, i) => chip(row, `${sc.id}-c${i}`, c, { size: 32, pal: PALS[i % 4] }));
  return t => { h.anim(t); enter(q, t, when(sc, 0), { dy: 30, d: .7 }); if (sub) enter(sub, t, when(sc, 1), { dy: 16 }); chips.forEach((c, i) => pop(c, t, when(sc, (sub ? 2 : 1) + i), { dy: 14 })); };
}

// ── flow: 2-4 steps, optional loop-back ──
function flow(root, sc) {
  const p = sc.props, h = head(root, sc), n = p.steps.length, cardH = n <= 3 ? 170 : 140, gap = n <= 3 ? 56 : 46;
  const svg = svgLayer(root, 1080, 1920), y0 = h.ti ? 330 + Math.min(170, est(p.title, 60, 960, 1.1) + 10) + 40 : 340;
  const cards = p.steps.map((s, i) => {
    const y = y0 + i * (cardH + gap), P = PALS[i % 3];
    const b = box(root, { x: 120, y, w: 780, h: cardH, r: 30, bd: P.bd, bw: 2.5 });
    E(b, 'abs', `left:24px;top:${(cardH - 84) / 2 - 2}px;width:84px;height:84px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(s.icon || 'bolt', 46, P.ink, 2));
    const lab = tx(b, `${sc.id}-s${i}`, s.label, { x: 130, y: s.sub ? 16 : 0, w: 630, h: s.sub ? 60 : cardH - 4, size: 46, weight: 600, font: 'serif' });
    if (s.sub) tx(b, `${sc.id}-s${i}-sub`, s.sub, { x: 130, y: 78, w: 630, h: 46, size: 30, weight: 500, color: C.mid });
    return b;
  });
  const arr = []; for (let i = 0; i < n - 1; i++) { const x = 510, ya = y0 + i * (cardH + gap) + cardH + 4, yb = y0 + (i + 1) * (cardH + gap) - 6; const pth = path(svg, `M${x} ${ya} V${yb}`, { stroke: C.mid, w: 4.5 }), tr = tri(svg, C.mid); arr.push([pth, tr]); }
  let loop = null;
  if (p.loop) { const ya = y0 + (n - 1) * (cardH + gap) + cardH / 2, yb = y0 + cardH / 2; const pth = path(svg, `M900 ${ya} C990 ${ya} 990 ${yb} 904 ${yb}`, { stroke: C.clay, w: 5 }), tr = tri(svg, C.clay); loop = [pth, tr]; }
  return t => {
    h.anim(t);
    cards.forEach((c, i) => pop(c, t, when(sc, i), { dy: 24 }));
    arr.forEach(([pth, tr], i) => { const k = eo(seg(t, when(sc, i + 1) - .45, when(sc, i + 1) - .05)); draw(pth, k); headAt(pth, k, tr, 15); });
    if (loop) { const k = eo(seg(t, when(sc, n) - .1, when(sc, n) + .6)); draw(loop[0], k); headAt(loop[0], k, loop[1], 16); }
  };
}

// ── map: centre node with up to 6 satellites (architecture) ──
function map(root, sc) {
  const p = sc.props, h = head(root, sc), n = p.items.length, svg = svgLayer(root, 1080, 1920), CX = 540, CY = 800, R = n <= 4 ? 300 : 330;
  const ctr = E(root, 'abs', `left:${CX - 135}px;top:${CY - 135}px;width:270px;height:270px;border-radius:50%;background:${C.claySoft};border:3px solid ${C.clay};box-sizing:border-box;box-shadow:0 8px 0 ${C.line}`); ctr.dataset.box = '1';
  E(ctr, 'abs', 'left:112px;top:30px', spark(42, C.clay));
  tx(ctr, sc.id + '-ctr', p.center, { x: 10, y: 80, w: 244, h: p.center.length > 14 ? 112 : 60, size: p.center.length > 14 ? 36 : 44, weight: 600, font: 'serif', align: 'center', wrap: true, lh: 1.08 });
  const sats = p.items.map((it, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n, x = CX + R * Math.cos(a), y = CY + R * Math.sin(a), P = PALS[i % 3];
    const b = box(root, { x: x - 135, y: y - 52, w: 270, h: 104, r: 26, bd: P.bd, bw: 2.5 });
    E(b, 'abs', 'left:14px;top:26px;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:' + P.soft, icon(it.icon || 'star', 28, P.ink, 2));
    tx(b, `${sc.id}-m${i}`, it.label, { x: 74, y: 0, w: 188, h: 100, size: it.label.length > 14 ? 25 : 29, weight: 700, wrap: true, lh: 1.1 });
    const dx = Math.cos(a), dy = Math.sin(a), k = Math.min(135 / Math.max(Math.abs(dx), 1e-6), 52 / Math.max(Math.abs(dy), 1e-6)) + 12;
    const pth = path(svg, `M${CX + 148 * dx} ${CY + 148 * dy} L${x - k * dx} ${y - k * dy}`, { stroke: P.bd, w: 4.5 }), tr = tri(svg, P.bd);
    return { b, pth, tr };
  });
  return t => {
    h.anim(t); pop(ctr, t, when(sc, 0), { sc: .8, dy: 0, d: .7 });
    sats.forEach((s, i) => { const t0 = when(sc, i + 1); const k = eo(seg(t, t0 - .4, t0)); draw(s.pth, k); headAt(s.pth, k, s.tr, 14); pop(s.b, t, t0, { dy: 16 }); });
  };
}

// ── cards: 2-6 items in a 2-column grid ──
function cards(root, sc) {
  const p = sc.props, h = head(root, sc), n = p.items.length, rows = Math.ceil(n / 2), ch = rows <= 2 ? 250 : rows === 3 ? 215 : 215, y0 = h.ti ? 330 + Math.min(170, est(p.title, 60, 960, 1.1) + 10) + 40 : 340;
  const els = p.items.map((it, i) => {
    const P = PALS[i % 4], x = 60 + (i % 2) * 480, y = y0 + Math.floor(i / 2) * (ch + 22), single = n % 2 === 1 && i === n - 1, w = single ? 960 : 450;
    const b = box(root, { x: single ? 60 : x, y, w, h: ch, r: 28, bd: P.bd, bw: 2.5 });
    E(b, 'abs', `left:22px;top:20px;width:66px;height:66px;border-radius:50%;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(it.icon || 'layers', 36, P.ink, 2));
    tx(b, `${sc.id}-i${i}`, it.label, { x: 104, y: 20, w: w - 124, h: 66, size: it.label.length > 18 ? 32 : 38, weight: 700 });
    if (it.sub) tx(b, `${sc.id}-i${i}-sub`, it.sub, { x: 24, y: 100, w: w - 48, h: ch - 116, size: 29, weight: 500, color: C.mid, wrap: true, lh: 1.25, css: 'align-items:flex-start' });
    return b;
  });
  return t => { h.anim(t); els.forEach((b, i) => pop(b, t, when(sc, i))); };
}

// ── list: numbered rows ──
function list(root, sc) {
  const p = sc.props, h = head(root, sc), n = p.items.length, rh = n <= 3 ? 170 : n === 4 ? 150 : 130, y0 = h.ti ? 330 + Math.min(170, est(p.title, 60, 960, 1.1) + 10) + 40 : 340;
  const els = p.items.map((it, i) => {
    const P = PALS[i % 3], y = y0 + i * (rh + 18), b = box(root, { x: 60, y, w: 960, h: rh, r: 28, bd: P.bd, bw: 2.5 });
    const nb = E(b, 'abs', `left:24px;top:${(rh - 72) / 2}px;width:72px;height:72px;border-radius:50%;background:${P.bd};color:#fff;display:flex;align-items:center;justify-content:center;font:700 38px Lora,serif`, String(i + 1));
    tx(b, `${sc.id}-r${i}`, it.label, { x: 120, y: it.sub ? 10 : 0, w: 810, h: it.sub ? 56 : rh - 4, size: 38, weight: 700 });
    if (it.sub) tx(b, `${sc.id}-r${i}-sub`, it.sub, { x: 120, y: 64, w: 810, h: rh - 76, size: 28, weight: 500, color: C.mid, wrap: true, lh: 1.2, css: 'align-items:flex-start' });
    return b;
  });
  return t => { h.anim(t); els.forEach((b, i) => pop(b, t, when(sc, i), { dx: -30, dy: 8 })); };
}

// ── chips: 2-4 big tiles (modes, options, comparisons) ──
function chips(root, sc) {
  const p = sc.props, h = head(root, sc), n = p.items.length, y0 = h.ti ? 330 + Math.min(170, est(p.title, 60, 960, 1.1) + 10) + 50 : 360, th = n <= 2 ? 300 : 270;
  const els = p.items.map((it, i) => {
    const P = PALS[i % 4], col = n === 2 ? 0 : i % 2, row = n === 2 ? i : Math.floor(i / 2), w = n === 2 ? 960 : 465, x = 60 + col * 495, y = y0 + row * (th + 24);
    const b = box(root, { x, y, w, h: th, r: 30, bd: P.bd, bw: 2.5, fill: P.soft });
    tx(b, `${sc.id}-c${i}`, it.label, { x: 28, y: 22, w: w - 56, h: 70, size: 46, weight: 600, font: 'serif', color: P.ink });
    if (it.sub) tx(b, `${sc.id}-c${i}-sub`, it.sub, { x: 28, y: 100, w: w - 56, h: th - 120, size: 32, weight: 500, color: C.ink, wrap: true, lh: 1.25, css: 'align-items:flex-start' });
    return b;
  });
  return t => { h.anim(t); els.forEach((b, i) => pop(b, t, when(sc, i), { sc: .93 })); };
}

// ── dialog: 2-4 chat bubbles ──
function dialog(root, sc) {
  const p = sc.props, h = head(root, sc); let y = h.ti ? 330 + Math.min(170, est(p.title, 60, 960, 1.1) + 10) + 50 : 360;
  const els = p.turns.map((u, i) => {
    const me = u.who === 'user', w = 800, bh = Math.max(110, est(u.text, 38, w - 70, 1.25) + 50), x = me ? 1020 - w : 60;
    const b = box(root, { x, y, w, h: bh, r: 34, fill: me ? C.sand : '#fff', bd: me ? C.lineD : C.line, shadow: false });
    if (!me) E(b, 'abs', 'left:22px;top:22px', spark(36, C.clay));
    tx(b, `${sc.id}-t${i}`, u.text, { x: me ? 30 : 74, y: 0, w: w - (me ? 60 : 100), h: bh - 4, size: 38, weight: 600, wrap: true, lh: 1.25 });
    y += bh + 40; return [b, me];
  });
  return t => { h.anim(t); els.forEach(([b, me], i) => pop(b, t, when(sc, i), { dx: me ? 40 : -40, dy: 10, sc: .94 })); };
}

// ── big: one number / phrase ──
function big(root, sc) {
  const p = sc.props, h = head(root, sc, false), sz = fit(p.big, [[8, 190], [14, 150], [22, 110], [40, 84]]);
  const bh = est(p.big, sz, 920, 1.05) + 20 + Math.round(sz * .16), b = tx(root, sc.id + '-big', p.big, { x: 80, y: 480, w: 920, h: bh, size: sz, weight: 700, font: 'serif', color: C.clayD, wrap: true, lh: 1.05, align: 'center' });
  const s = p.sub ? tx(root, sc.id + '-sub', p.sub, { x: 100, y: 480 + bh + 40, w: 880, h: est(p.sub, 44, 880, 1.25) + 12, size: 44, weight: 500, color: C.ink, wrap: true, lh: 1.25, align: 'center' }) : null;
  return t => { h.anim(t); pop(b, t, when(sc, 0), { sc: .85, dy: 20, d: .7 }); if (s) enter(s, t, when(sc, 1), { dy: 14 }); };
}

const B = { hook, flow, map, cards, list, chips, dialog, big };

function end(root, E_) {
  E(root, 'abs', 'left:480px;top:500px;width:120px;height:120px', spark(120, C.clay));
  const sz = fit(E_.title, [[22, 100], [34, 84], [60, 70]]), th = est(E_.title, sz, 900, 1.08) + 16;
  const t1 = tx(root, 'end-title', E_.title, { x: 90, y: 680, w: 900, h: th, size: sz, weight: 600, font: 'serif', wrap: true, lh: 1.08, align: 'center' });
  const y2 = 680 + th + 30;
  const t2 = tx(root, 'end-src', E_.source_label, { x: 90, y: y2, w: 900, h: 56, size: 34, weight: 500, color: C.mid, align: 'center' });
  const t3 = E_.source_url ? tx(root, 'end-url', E_.source_url, { x: 60, y: y2 + 62, w: 960, h: 64, size: E_.source_url.length > 30 ? 34 : 44, weight: 700, color: C.clayD, align: 'center' }) : null;
  const ct = cta(root, 'end-cta', E_.brand, { x: 50, y: y2 + (t3 ? 170 : 110), w: 980, h: 112, size: 29, bw: 5 });
  const sp = root.children[0];
  return t0 => t => { enter(sp, t, t0 + .05, { sc: .6, dy: 0, pop: true, d: .7 }); enter(t1, t, t0 + .1, { dy: 24 }); enter(t2, t, t0 + .25, { dy: 14 }); if (t3) enter(t3, t, t0 + .35, { dy: 14 }); enter(ct, t, t0 + .55, { dy: 18, sc: .96, pop: true }); };
}


// ── look: "cinematic" (dark grade, camera, light, impact) or "light" (the original paper look). Both get the fit-to-frame pass. ──
const NIGHT = { bg: '#0B1020', card: '#141C33', line: '#26314F', lineD: '#34456E', ink: '#F3F0E8', mid: '#A8B2C9', clay: '#FF8A5B', clayD: '#FFB394', claySoft: '#2B2230',
  blue: '#5FB0FF', blueD: '#A5D4FF', blueSoft: '#142A47', green: '#6FD08A', greenD: '#B0EBBF', greenSoft: '#14301F', sand: '#1B2438' };
export function applyReelLook(stage, look) {
  if (look !== 'cinematic') return;
  Object.assign(C, NIGHT);
  const set = (i, a, b, c) => Object.assign(PALS[i], { bd: C[a], ink: C[b], soft: C[c] });
  set(0, 'blue', 'blueD', 'blueSoft'); set(1, 'clay', 'clayD', 'claySoft'); set(2, 'green', 'greenD', 'greenSoft'); Object.assign(PALS[3], { bd: C.lineD, ink: C.mid, soft: C.sand });
  stage.style.backgroundColor = C.bg;
  stage.style.backgroundImage = `radial-gradient(900px 760px at 50% 36%,#1A2A5E 0%,transparent 72%),radial-gradient(#1B2640 2px,transparent 2.3px)`;
  stage.style.backgroundSize = '100% 100%,54px 54px';
}
// Everything a scene drew goes into one wrapper that is scaled and centred in the safe band (y 250-1190), so short scenes fill the frame instead of
// hugging the top, and the wrapper is what the camera pushes. Measured once at build time, before any animation transform exists.
const BAND = { top: 250, bot: 1190, cy: 720, w: 960 };
function fitScene(root, canPush = true) {
  const wrap = E(root, 'abs', 'left:0;top:0;width:1080px;height:1920px');
  [...root.children].forEach(c => { if (c !== wrap) wrap.appendChild(c); });
  // painted extents only: text glyph boxes, svg/img, and elements with a visible fill or border (layout boxes that merely span the width are ignored)
  const rs = [], rg = document.createRange();
  for (const e of wrap.querySelectorAll('*')) {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.width >= 1000 && r.height >= 1800) continue;
    const painted = e instanceof SVGElement ? /^(circle|path|rect|ellipse|line|polygon|polyline|image)$/.test(e.tagName) : (e.tagName === 'IMG' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || parseFloat(cs.borderTopWidth) > 0 || cs.backgroundImage !== 'none');
    if (painted) rs.push(r);
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 2) rs.push(q); }
  }
  if (!rs.length) return { wrap, tx: 0, ty: 0, s: 1, ox: 540, oy: 720 };
  const L = Math.min(...rs.map(r => r.left)), R = Math.max(...rs.map(r => r.right)), T = Math.min(...rs.map(r => r.top)), B = Math.max(...rs.map(r => r.bottom));
  const bw = R - L, bh = B - T, headroom = canPush ? .94 : 1, s = Math.max(1, Math.min(1.5, (BAND.bot - BAND.top) / bh * headroom, BAND.w / bw * headroom)), cx = (L + R) / 2, cy = (T + B) / 2;
  wrap.style.transformOrigin = `${cx}px ${cy}px`;
  return { wrap, tx: 540 - cx, ty: BAND.cy - cy, s, ox: cx, oy: cy };
}

export function buildReel(stage, D) {
  const cin = D.look === 'cinematic';
  applyReelLook(stage, D.look);
  const scenes = D.scenes.map((sc, i) => { const root = E(stage, 'scene'); const update = B[sc.type](root, sc); return { ...sc, root, idx: i, update, f: fitScene(root) }; });
  const endRoot = E(stage, 'scene'), endUpd = end(endRoot, { ...D.end, brand: D.brand })(D.end.t0), endF = fitScene(endRoot, false);
  // cinematic layers: vignette, a light sweep at every scene change, a flash on impact ("big" scenes)
  const vig = cin ? E(stage, 'abs', 'left:0;top:0;width:1080px;height:1920px;pointer-events:none;background:radial-gradient(ellipse 80% 70% at 50% 46%,transparent 52%,rgba(0,0,0,.62) 100%)') : null;
  const sweep = cin ? E(stage, 'abs', 'left:-620px;top:-100px;width:520px;height:2120px;pointer-events:none;opacity:0;transform:skewX(-14deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.17),transparent)') : null;
  const flash = cin ? E(stage, 'abs', 'left:0;top:0;width:1080px;height:1920px;pointer-events:none;opacity:0;background:#fff') : null;
  const hits = D.scenes.filter(sc => sc.type === 'big').map(sc => when(sc, 0));
  window.__fit = scenes.map(s => [s.type, +s.f.s.toFixed(2), Math.round(s.f.tx), Math.round(s.f.ty)]);
  return {
    render(t) {
      let sw = 0, fl = 0, shake = 0;
      for (const s of scenes) {
        const vis = t >= s.t0 - .001 && t < s.t1 + .001; s.root.style.display = vis ? 'block' : 'none';
        if (!vis) continue;
        const a = s.idx === 0 ? 1 : eo(seg(t, s.t0, s.t0 + .45)), b = 1 - eo(seg(t, s.t1 - .4, s.t1)), k = clamp((t - s.t0) / Math.max(.1, s.t1 - s.t0), 0, 1);
        s.root.style.opacity = String(Math.min(a, b));
        s.root.style.transform = cin ? `scale(${1 + (1 - a) * .06 - (1 - b) * .03})` : `translateY(${(1 - a) * 26 - (1 - b) * 22}px)`;
        let dx = 0, dy = 0; if (cin) { for (const h of hits) { const q = t - h; if (q >= 0 && q < .32) { const d = 1 - q / .32; dx += Math.sin(q * 95) * 9 * d; dy += Math.cos(q * 80) * 6 * d; fl = Math.max(fl, .34 * (1 - seg(t, h, h + .2))); } } }
        const f = s.f, push = cin ? 1 + .05 * k : 1; f.wrap.style.transform = `translate(${f.tx + dx}px,${f.ty + dy}px) scale(${f.s * push})`;
        s.update(t);
        if (cin && s.idx > 0) sw = Math.max(sw, seg(t, s.t0 + .02, s.t0 + .95) * (1 - seg(t, s.t0 + .95, s.t0 + 1.05)) > 0 ? eo(seg(t, s.t0 + .02, s.t0 + .95)) : 0);
      }
      const ev = t >= D.end.t0 - .001; endRoot.style.display = ev ? 'block' : 'none';
      if (ev) { endRoot.style.opacity = String(eo(seg(t, D.end.t0, D.end.t0 + .4))); endRoot.style.transform = cin ? `scale(${1 + (1 - eo(seg(t, D.end.t0, D.end.t0 + .5))) * .05})` : ''; endF.wrap.style.transform = `translate(${endF.tx}px,${endF.ty}px) scale(${endF.s})`; endUpd(t); }
      if (cin) { sweep.style.opacity = sw > 0 && sw < 1 ? '1' : '0'; sweep.style.left = (-620 + sw * 1900) + 'px'; flash.style.opacity = String(fl); }
      return ev;
    },
  };
}
