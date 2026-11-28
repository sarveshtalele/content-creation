// v3 chart library for carousel slides (1080x1350). Four families, chosen by the decision matrix (data/matrix.json):
//   comparison   lollipop, dumbbell, slope, bullet, radar
//   flow/network sankey, alluvial, network, arc, flowchart
//   composition  donut, waffle (pictogram with icon), treemap, sunburst, mindmap, decision
//   time/process timeline, gantt, waterfall, line (kind line|area), heatmap
// Every mark is rounded (boxes r>=14, round caps/joins, smooth curves). Numbers shown are the story's own strings; numeric fields only set geometry.
import { C, E, box, tx, icon, svgLayer, path, circ, fitSize, measure, svgNS, roundPts } from './kit.js';

const NS = (p, n, a = {}) => { const e = document.createElementNS(svgNS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };
const pc = v => Math.max(0, Math.min(100, +v || 0)) / 100;
const f1 = v => (+v).toFixed(1);
function mixC(a, b, t) { const p = h => [0, 8, 16].map(s => (parseInt(h.slice(1), 16) >> s) & 255); const x = p(a), y = p(b); const c = x.map((v, i) => Math.round(v + (y[i] - v) * t)); return `rgb(${c[2]},${c[1]},${c[0]})`; }
// relative luminance of an rgb()/hex colour (WCAG)
const lum = c => { const v = c.startsWith('#') ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).map(Number); const l = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return .2126 * l(v[0]) + .7152 * l(v[1]) + .0722 * l(v[2]); };
// annular sector, angles in degrees from 12 o'clock, clockwise
function sector(cx, cy, r0, r1, a0, a1) {
  const P = (r, a) => { const t = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }, big = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0);
  return `M${f1(x0)} ${f1(y0)}A${r1} ${r1} 0 ${big} 1 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${r0} ${r0} 0 ${big} 0 ${f1(x3)} ${f1(y3)}Z`;
}
// smooth line through points (Catmull-Rom as cubic Bézier)
function smooth(pts) {
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; }
  return d;
}
function legendRow(root, items, y, X0, XW) {   // items: [{label, color}]
  const row = E(root, 'abs', `left:${X0}px;top:${y}px;width:${XW}px;display:flex;flex-wrap:wrap;gap:12px 28px;justify-content:center`);
  items.forEach((it, k) => { const c = E(row, 'tx sans', `display:inline-flex;align-items:center;gap:10px;white-space:nowrap;font-size:26px;font-weight:600;color:${C.ink}`);
    const sp = E(c, '', 'display:block', '', 'span'); sp.textContent = it.label; E(c, '', `width:22px;height:22px;border-radius:7px;background:${it.color};flex:none;order:-1`); c.dataset.id = 'lg' + k; c.dataset.text = it.label; });
  return y + 44;
}

export function charts(K) {
  const { heading, grp, H_, X0, XW, W, BODY1 } = K, mid = (k) => grp(k).bd;
  const lab = (root, id, t, o) => tx(root, id, t, { weight: 600, ...o, size: o.size || fitSize(t, { w: o.w, h: o.h, max: o.max || 30, min: o.min || 18, weight: o.weight || 600, lh: 1.15 }), wrap: true, lh: 1.15 });
  const top = (root, s, id) => heading(root, id, s.title) + 30;
  return {
    // ---------- comparison ----------
    lollipop(root, s) {
      const y = top(root, s, 'lp-h') + 10, n = s.rows.length, pitch = Math.min(170, Math.floor((BODY1 - y - 10) / n)), LW = 300, TX = X0 + LW + 20, TW = W - X0 - 150 - TX, svg = svgLayer(root, W, 1350);
      s.rows.forEach((r, k) => { const P = grp(k), cy = y + k * pitch + pitch / 2, x1 = TX + TW * pc(r.pct);
        lab(root, `lo${k}-l`, r.label, { x: X0, y: cy - 34, w: LW, h: 68, max: 32, weight: 700 });
        path(svg, `M${TX} ${cy}H${TX + TW}`, { stroke: C.line, w: 6 }); path(svg, `M${TX} ${cy}H${x1}`, { stroke: P.bd, w: 10 });
        circ(svg, x1, cy, 30, { fill: P.bd, stroke: C.card, w: 6 });
        tx(root, `lo${k}-v`, r.value, { x: W - X0 - 140, y: cy - 30, w: 140, h: 60, size: r.value.length > 5 ? 34 : 42, weight: 700, font: 'serif', color: P.ink, align: 'right' }); });
    },
    dumbbell(root, s) { return this._pair(root, s, false); },
    slope(root, s) { return this._pair(root, s, true); },
    _pair(root, s, slope) {
      let y = top(root, s, slope ? 'sl-h' : 'db-h'); const A = C.blue, B = C.clay, svg = svgLayer(root, W, 1350), n = s.rows.length;
      if (slope) {   // the lines are coloured by row, so the two moments are named over their own axes, not in a colour legend
        [[360, s.legend.a, 'sl-la'], [720, s.legend.b, 'sl-lb']].forEach(([x, t, id]) => tx(root, id, t, { x: x - 150, y: y + 4, w: 300, h: 44, size: 30, weight: 700, color: C.ink, align: 'center' })); y += 70;
      } else y = legendRow(root, [{ label: s.legend.a, color: A }, { label: s.legend.b, color: B }], y, X0, XW) + 24;
      if (!slope) {
        const pitch = Math.min(190, Math.floor((BODY1 - y) / n)), LW = 280, TX = X0 + LW + 30, TW = W - X0 - 30 - TX;
        s.rows.forEach((r, k) => { const cy = y + k * pitch + pitch / 2, xa = TX + TW * pc(r.a.pct), xb = TX + TW * pc(r.b.pct);
          lab(root, `db${k}-l`, r.label, { x: X0, y: cy - 34, w: LW, h: 68, max: 32, weight: 700 });
          path(svg, `M${TX} ${cy}H${TX + TW}`, { stroke: C.line, w: 4 }); path(svg, `M${xa} ${cy}H${xb}`, { stroke: C.lineD, w: 14 });
          circ(svg, xa, cy, 24, { fill: A, stroke: C.card, w: 5 }); circ(svg, xb, cy, 24, { fill: B, stroke: C.card, w: 5 });
          const lo = Math.min(xa, xb), hi = Math.max(xa, xb), aLeft = xa <= xb;
          tx(root, `db${k}-a`, r.a.value, { x: Math.max(TX - 60, (aLeft ? lo : hi) - 70), y: cy - 74, w: 140, h: 40, size: 26, weight: 700, color: C.blueD, align: 'center' });
          tx(root, `db${k}-b`, r.b.value, { x: Math.min(W - X0 - 140, (aLeft ? hi : lo) - 70), y: cy + 30, w: 140, h: 40, size: 26, weight: 700, color: C.clayD, align: 'center' }); });
        return;
      }
      const vs = s.rows.flatMap(r => [pc(r.a.pct), pc(r.b.pct)]), lo = Math.max(0, Math.min(...vs) - .08), hi = Math.min(1, Math.max(...vs) + .08);   // fit the scale to the data so the lines use the whole slide
      const ax = 360, bx = 720, t0 = y + 30, t1 = BODY1 - 40, Y = p => t1 - (t1 - t0) * (pc(p) - lo) / Math.max(.05, hi - lo);
      [ax, bx].forEach(x => path(svg, `M${x} ${t0 - 20}V${t1 + 20}`, { stroke: C.line, w: 6 }));
      const spread = ys => { const o = ys.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v); for (let i = 1; i < o.length; i++) if (o[i].v - o[i - 1].v < 66) o[i].v = o[i - 1].v + 66; const r = []; o.forEach(q => { r[q.i] = q.v; }); return r; };
      const la = spread(s.rows.map(r => Y(r.a.pct))), lb = spread(s.rows.map(r => Y(r.b.pct)));
      s.rows.forEach((r, k) => { const P = grp(k), ya = Y(r.a.pct), yb = Y(r.b.pct);
        path(svg, `M${ax} ${ya}C${ax + 120} ${ya} ${bx - 120} ${yb} ${bx} ${yb}`, { stroke: P.bd, w: 7 }); circ(svg, ax, ya, 16, { fill: P.bd, stroke: C.card, w: 4 }); circ(svg, bx, yb, 16, { fill: P.bd, stroke: C.card, w: 4 });
        lab(root, `sl${k}-l`, `${r.label} ${r.a.value}`, { x: X0, y: la[k] - 30, w: ax - X0 - 30, h: 60, max: 28, weight: 700, color: P.ink, css: 'justify-content:flex-end;text-align:right;' });
        tx(root, `sl${k}-b`, r.b.value, { x: bx + 30, y: lb[k] - 30, w: W - X0 - bx - 30, h: 60, size: 34, weight: 700, font: 'serif', color: P.ink }); });
    },
    bullet(root, s) {
      const y = top(root, s, 'bu-h') + 10, n = s.rows.length, pitch = Math.min(290, Math.floor((BODY1 - y - 50) / n)), TW = XW - 150;
      s.rows.forEach((r, k) => { const P = grp(k), yy = y + k * pitch;
        lab(root, `bu${k}-l`, r.label, { x: X0, y: yy + 10, w: TW, h: 52, max: 36, weight: 700 });
        tx(root, `bu${k}-v`, r.value, { x: W - X0 - 150, y: yy + 74, w: 150, h: 72, size: 50, weight: 700, font: 'serif', color: P.ink, align: 'right' });
        [[1, C.sand], [.75, mixC(C.sand, C.line, .5)], [.45, C.line]].forEach(([f, c]) => E(root, 'abs', `left:${X0}px;top:${yy + 74}px;width:${(TW - 20) * f}px;height:76px;border-radius:22px;background:${c}`));
        E(root, 'abs', `left:${X0}px;top:${yy + 94}px;width:${Math.max(36, (TW - 20) * pc(r.pct))}px;height:36px;border-radius:18px;background:${P.bd}`);
        if (r.target != null) E(root, 'abs', `left:${X0 + (TW - 20) * pc(r.target) - 4}px;top:${yy + 64}px;width:10px;height:96px;border-radius:5px;background:${C.ink}`); });
      if (s.rows.some(r => r.target != null) && s.target_label) tx(root, 'bu-t', '▮ ' + s.target_label, { x: X0, y: y + n * pitch + 6, w: XW, h: 34, size: 24, weight: 600, color: C.mid });
    },
    radar(root, s) {
      let y = top(root, s, 'rd-h'); const n = s.axes.length, svg = svgLayer(root, W, 1350), cx = W / 2, legend = s.series.length > 1;
      const R = Math.min(300, Math.floor((BODY1 - y - (legend ? 60 : 0) - 150) / 2)), cy = y + R + 70;
      const pt = (k, f) => { const a = (-90 + 360 * k / n) * Math.PI / 180; return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)]; };
      [.25, .5, .75, 1].forEach(f => path(svg, roundPts([...Array(n).keys()].map(k => pt(k, f)), 10, true), { stroke: C.line, w: f === 1 ? 4 : 2, fill: f === 1 ? C.card : 'none' }));
      for (let k = 0; k < n; k++) { const [x, yy] = pt(k, 1); path(svg, `M${cx} ${cy}L${x} ${yy}`, { stroke: C.line, w: 2 }); }
      s.series.forEach((se, j) => { const col = j ? C.clay : C.blue, ps = se.values.map((v, k) => pt(k, Math.max(.04, pc(v))));
        const p = path(svg, roundPts(ps, 12, true), { stroke: col, w: 6, fill: col }); p.setAttribute('fill-opacity', '.22'); ps.forEach(q => circ(svg, q[0], q[1], 10, { fill: col, stroke: C.card, w: 3 })); });
      s.axes.forEach((t, k) => { const [x, yy] = pt(k, 1.22), w = 230; lab(root, `rd${k}`, t, { x: x - w / 2, y: yy - 30, w, h: 60, max: 28, weight: 700, align: 'center' }); });
      if (legend) legendRow(root, s.series.map((se, j) => ({ label: se.name, color: j ? C.clay : C.blue })), BODY1 - 44, X0, XW);
    },
    // ---------- flow / network ----------
    sankey(root, s) { return this._flows(root, s, false); },
    alluvial(root, s) { return this._flows(root, s, true); },
    _flows(root, s, cols) {
      let y = top(root, s, cols ? 'al-h' : 'sk-h'); const svg = svgLayer(root, W, 1350), F = s.flows, names = [];
      F.forEach(f => { if (!names.includes(f.from)) names.push(f.from); if (!names.includes(f.to)) names.push(f.to); });
      const depth = {}; names.forEach(x => depth[x] = 0);
      for (let it = 0; it < names.length; it++) F.forEach(f => { depth[f.to] = Math.max(depth[f.to], depth[f.from] + 1); });
      const maxD = Math.max(...Object.values(depth)); names.forEach(x => { if (!F.some(f => f.from === x)) depth[x] = maxD; });   // end nodes line up in the last column
      const D = maxD + 1, val = x => Math.max(F.filter(f => f.from === x).reduce((a, f) => a + +f.num, 0), F.filter(f => f.to === x).reduce((a, f) => a + +f.num, 0));
      if (cols && s.stages) { s.stages.slice(0, D).forEach((t, d) => { const x = X0 + (XW - 28) * d / (D - 1); lab(root, `al-s${d}`, t, { x: Math.max(X0, Math.min(W - X0 - 220, x - 96)), y, w: 220, h: 40, max: 26, weight: 700, color: C.mid, align: d === 0 ? 'left' : d === D - 1 ? 'right' : 'center' }); }); y += 56; }
      const t0 = y + 10, t1 = BODY1 - 20, gap = 26, colN = d => names.filter(x => depth[x] === d);
      const scale = Math.min(...[...Array(D).keys()].map(d => (t1 - t0 - gap * (colN(d).length - 1)) / colN(d).reduce((a, x) => a + val(x), 0)));
      const NW = 28, pos = {};
      for (let d = 0; d < D; d++) { let c = colN(d); const h = c.reduce((a, x) => a + val(x) * scale, 0) + gap * (c.length - 1); let yy = t0 + (t1 - t0 - h) / 2;
        if (d) { const my = x => { const ins = F.filter(f => f.to === x && pos[f.from]); const w = ins.reduce((a, f) => a + +f.num, 0) || 1; return ins.reduce((a, f) => a + (pos[f.from].y + pos[f.from].h / 2) * +f.num, 0) / w; }; c = [...c].sort((p_, q_) => my(p_) - my(q_)); }   // order by where the inputs come from
        c.forEach(x => { pos[x] = { x: X0 + (XW - NW) * d / (D - 1), y: yy, h: val(x) * scale, out: 0, in: 0, d, k: names.indexOf(x) }; yy += val(x) * scale + gap; }); }
      const ny = x => pos[x].y + pos[x].h / 2;   // ribbons leave and arrive in the order of the node they go to, so they do not cross
      [...F].sort((p_, q_) => ny(p_.from) - ny(q_.from) || ny(p_.to) - ny(q_.to)).forEach((f, k) => { const a = pos[f.from], b = pos[f.to], th = +f.num * scale, ya = a.y + a.out + th / 2, yb = b.y + b.in + th / 2, x0 = a.x + NW, x1 = b.x, mx = (x0 + x1) / 2; a.out += th; b.in += th;
        const h2 = Math.max(1.5, th / 2 - 1.5), p = path(svg, `M${x0} ${ya - h2}C${mx} ${ya - h2} ${mx} ${yb - h2} ${x1} ${yb - h2}L${x1} ${yb + h2}C${mx} ${yb + h2} ${mx} ${ya + h2} ${x0} ${ya + h2}Z`, { stroke: 'none', fill: mid(a.k), sharp: true }); p.setAttribute('fill-opacity', '.42'); });   // a filled band, not a thick stroke: no blobs on steep curves
      names.forEach(x => { const p = pos[x], P = grp(p.k); E(root, 'abs', `left:${p.x}px;top:${p.y}px;width:${NW}px;height:${Math.max(8, p.h)}px;border-radius:12px;background:${P.bd}`);
        const last = p.d === D - 1, w = 250, v = F.filter(f => f.from === x || f.to === x)[0], tot = (p.d === 0 ? F.filter(f => f.from === x) : F.filter(f => f.to === x)).map(f => f.value).filter(Boolean);
        const t = x + (p.d === 0 && tot.length === 1 ? ' · ' + tot[0] : '');
        lab(root, `fl-${p.k}`, t, { x: last ? p.x - w - 12 : p.x + NW + 12, y: p.y + p.h / 2 - 30, w, h: 60, max: 26, min: 17, weight: 700, color: P.ink, css: `${last ? 'justify-content:flex-end;text-align:right;' : ''}text-shadow:0 0 4px ${C.bg},0 0 4px ${C.bg},0 0 8px ${C.bg};` }); });
    },
    network(root, s) {
      const y = top(root, s, 'nw-h'), svg = svgLayer(root, W, 1350), cx = W / 2, n = s.nodes.length, cy = (y + BODY1) / 2, rx = 360, ry = Math.min(380, (BODY1 - y) / 2 - 80), cw = 270, ch = 92;
      const P = s.nodes.map((nd, k) => { const a = (-90 + 360 * k / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
      (s.links || []).forEach(([i, j]) => { if (P[i] && P[j]) path(svg, `M${P[i][0]} ${P[i][1]}Q${cx} ${cy} ${P[j][0]} ${P[j][1]}`, { stroke: C.lineD, w: 3, dash: '2 10' }); });
      P.forEach(([x, yy], k) => { const g = grp(k), mx = (cx + x) / 2 + (yy - cy) * .12, my = (cy + yy) / 2 - (x - cx) * .12; path(svg, `M${cx} ${cy}Q${mx} ${my} ${x} ${yy}`, { stroke: g.bd, w: 5 });
        [.35, .62].forEach(f => { const q = 1 - f; circ(svg, q * q * cx + 2 * q * f * mx + f * f * x, q * q * cy + 2 * q * f * my + f * f * yy, 7, { fill: g.bd, stroke: C.card, w: 2 }); }); });
      circ(svg, cx, cy, 128, { fill: C.claySoft, stroke: C.clay, w: 5 }); lab(root, 'nw-c', s.center, { x: cx - 105, y: cy - 60, w: 210, h: 120, max: 36, weight: 700, align: 'center', color: C.clayD });
      s.nodes.forEach((nd, k) => { const g = grp(k), [x, yy] = P[k], b = box(root, { x: Math.max(X0, Math.min(W - X0 - cw, x - cw / 2)), y: yy - ch / 2, w: cw, h: ch, r: 26, bd: g.bd, bw: 3 });
        E(b, 'abs', `left:12px;top:${(ch - 64) / 2 - 2}px;width:58px;height:58px;border-radius:18px;background:${g.soft};display:flex;align-items:center;justify-content:center`, icon(nd.icon || 'bolt', 32, g.ink, 2));
        lab(b, `nw${k}`, nd.title, { x: 80, y: 4, w: cw - 92, h: ch - 14, max: 26, min: 17, weight: 700 }); });
    },
    arc(root, s) {
      const y = top(root, s, 'ac-h'), svg = svgLayer(root, W, 1350), n = s.nodes.length, base = BODY1 - 130, gx = XW / n, X = i => X0 + gx * (i + .5);
      (s.arcs || []).forEach((a, k) => { const x0 = X(a.from), x1 = X(a.to), span = Math.abs(a.to - a.from) / Math.max(1, n - 1), h = Math.max(140, (base - 40 - y - 70) * Math.sqrt(span)), P = grp(k);
        path(svg, `M${x0} ${base - 40}C${x0} ${base - 40 - h * 1.33} ${x1} ${base - 40 - h * 1.33} ${x1} ${base - 40}`, { stroke: P.bd, w: 6 });
        if (a.label) { const lw = 200; lab(root, `ac-a${k}`, a.label, { x: (x0 + x1) / 2 - lw / 2, y: base - 40 - h - 26, w: lw, h: 44, max: 22, min: 16, weight: 700, color: P.ink, align: 'center', css: `background:${C.bg};border-radius:14px;` }); } });
      s.nodes.forEach((t, i) => { const P = grp(i); circ(svg, X(i), base - 40, 36, { fill: P.bd, stroke: C.card, w: 7 }); lab(root, `ac${i}`, t, { x: X(i) - gx / 2 + 4, y: base + 4, w: gx - 8, h: 110, max: 30, min: 16, weight: 700, align: 'center' }); });
    },
    flowchart(root, s) {
      const y0 = top(root, s, 'fc-h'), svg = svgLayer(root, W, 1350), n = s.steps.length, gap = 70, h = Math.min(96, Math.floor((BODY1 - y0 - gap * (n - 1)) / n)), w = 600, x = (W - w) / 2 - 60, y = y0 + Math.max(0, Math.floor((BODY1 - y0 - n * h - gap * (n - 1)) / 2));
      s.steps.forEach((st, k) => { const P = grp(k), yy = y + k * (h + gap), dec = st.kind === 'decision', end = k === 0 || k === n - 1;
        if (dec) { const cx = x + w / 2, cy = yy + h / 2, hw = w / 2, hh = h / 2 + 6; path(svg, roundPts([[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]], 18, true), { stroke: P.bd, w: 4, fill: P.soft });
          lab(root, `fc${k}`, st.title, { x: cx - hw / 2 - 30, y: cy - hh / 2, w: hw + 60, h: hh, max: 30, weight: 700, align: 'center', color: P.ink });
          if (k > 0) { const ry = y + (k - 1) * (h + gap) + h / 2; path(svg, `M${cx + hw} ${cy}H${x + w + 110}V${ry}H${x + w + 14}`, { stroke: C.clay, w: 5, dash: '2 11' }); tx(root, `fc${k}-n`, st.no || 'No', { x: x + w + 124, y: cy - 20, w: W - X0 - x - w - 124, h: 40, size: 24, weight: 700, color: C.clayD });
            path(svg, `M${x + w + 30} ${ry - 12}L${x + w + 14} ${ry}L${x + w + 30} ${ry + 12}`, { stroke: C.clay, w: 5 }); }
          if (k < n - 1) tx(root, `fc${k}-y`, st.yes || 'Yes', { x: cx + 20, y: yy + h + 6, w: 130, h: 40, size: 24, weight: 700, color: C.greenD });
        } else { const b = box(root, { x, y: yy, w, h, r: end ? h / 2 : 28, fill: end ? P.soft : C.card, bd: P.bd, bw: 3 }); lab(b, `fc${k}`, st.title, { x: 30, y: 6, w: w - 60, h: h - 18, max: 34, weight: 700, align: 'center' }); }
        if (k < n - 1) { const ax = x + w / 2, a0 = yy + h + (dec ? 8 : 4), a1 = yy + h + gap - 6; path(svg, `M${ax} ${a0}V${a1 - 4}`, { stroke: C.lineD, w: 5 }); path(svg, `M${ax - 12} ${a1 - 16}L${ax} ${a1 - 2}L${ax + 12} ${a1 - 16}`, { stroke: C.lineD, w: 5 }); } });
    },
    // ---------- composition / hierarchy ----------
    donut(root, s) {
      const y = top(root, s, 'dn-h'), svg = svgLayer(root, W, 1350), n = s.parts.length, R = 250, T = 96, cx = W / 2, cy = y + R + 20; let a = 0;
      const tot = s.parts.reduce((q, p) => q + pc(p.pct), 0) || 1;
      const col = k => k < 3 ? mid(k) : grp(k).ink;   // three palette groups; a 4th+ slice takes the darker shade so no two slices share a colour
      s.parts.forEach((p, k) => { const sw = 360 * pc(p.pct) / tot, gp = n > 1 ? 1.6 : 0; path(svg, sector(cx, cy, R - T, R, a + gp, a + sw - gp), { stroke: 'none', fill: col(k), sharp: true }); a += sw; });
      if (s.center) { tx(root, 'dn-cv', s.center.value, { x: cx - 140, y: cy - 76, w: 280, h: 106, size: 76, weight: 700, font: 'serif', align: 'center', color: C.clayD }); lab(root, 'dn-cl', s.center.label, { x: cx - 120, y: cy + 26, w: 240, h: 56, max: 24, align: 'center', color: C.mid }); }
      const ly = cy + R + 50, cols = n > 3 ? 2 : 1, cw = cols === 2 ? (XW - 24) / 2 : XW, rh = Math.min(96, Math.floor((BODY1 - ly) / Math.ceil(n / cols)));
      s.parts.forEach((p, k) => { const P = grp(k), bx = X0 + (k % cols) * (cw + 24), by = ly + Math.floor(k / cols) * rh, b = box(root, { x: bx, y: by, w: cw, h: rh - 14, r: 22, bd: P.bd, bw: 2.5, shadow: false });
        E(b, 'abs', `left:18px;top:${(rh - 14 - 28) / 2 - 2}px;width:28px;height:28px;border-radius:9px;background:${col(k)}`);
        lab(b, `dn${k}-l`, p.label, { x: 60, y: 4, w: cw - 200, h: rh - 26, max: 28, weight: 700 }); tx(b, `dn${k}-v`, p.value, { x: cw - 140, y: 4, w: 120, h: rh - 26, size: 34, weight: 700, font: 'serif', color: P.ink, align: 'right' }); });
    },
    waffle(root, s) {
      const y = top(root, s, 'wf-h'), cell = 58, g = 8, gw = 10 * cell + 9 * g, gx = (W - gw) / 2, gy = y + 10, cuts = []; let acc = 0;
      s.parts.forEach(p => { acc += Math.round(pc(p.pct) * 100); cuts.push(acc); });
      for (let k = 0; k < 100; k++) { const pi = cuts.findIndex(c => k < c), col = pi < 0 ? C.line : mid(pi), x = gx + (k % 10) * (cell + g), yy = gy + Math.floor(k / 10) * (cell + g);
        if (s.icon) E(root, 'abs', `left:${x}px;top:${yy}px;width:${cell}px;height:${cell}px;display:flex;align-items:center;justify-content:center`, icon(s.icon, cell - 6, col, 2.4));
        else E(root, 'abs', `left:${x}px;top:${yy}px;width:${cell}px;height:${cell}px;border-radius:16px;background:${col}`); }
      const ly = gy + gw + 36, n = s.parts.length, cw = (XW - 24 * (n - 1)) / n;
      s.parts.forEach((p, k) => { const P = grp(k), b = box(root, { x: X0 + k * (cw + 24), y: ly, w: cw, h: Math.min(170, BODY1 - ly - 6), r: 24, bd: P.bd, bw: 3, shadow: false });
        tx(b, `wf${k}-v`, p.value, { x: 0, y: 10, w: cw, h: 66, size: 50, weight: 700, font: 'serif', color: P.ink, align: 'center' }); lab(b, `wf${k}-l`, p.label, { x: 12, y: 78, w: cw - 24, h: Math.min(170, BODY1 - ly - 6) - 90, max: 26, weight: 600, align: 'center' }); });
    },
    treemap(root, s) {
      const y = top(root, s, 'tm-h'), items = s.parts.map((p, k) => ({ ...p, k, a: Math.max(.02, pc(p.pct)) })).sort((p, q) => q.a - p.a), out = [];
      const split = (list, x, yy, w, h) => { if (!list.length) return; if (list.length === 1) { out.push({ ...list[0], x, y: yy, w, h }); return; }
        const tot = list.reduce((q, i) => q + i.a, 0); let acc = 0, cut = 1; for (let i = 0; i < list.length; i++) { acc += list[i].a; if (acc >= tot / 2) { cut = Math.max(1, Math.min(list.length - 1, i + (acc - tot / 2 > list[i].a / 2 ? 0 : 1))); break; } }
        const A = list.slice(0, cut), fa = A.reduce((q, i) => q + i.a, 0) / tot;
        if (w >= h) { split(A, x, yy, w * fa, h); split(list.slice(cut), x + w * fa, yy, w * (1 - fa), h); } else { split(A, x, yy, w, h * fa); split(list.slice(cut), x, yy + h * fa, w, h * (1 - fa)); } };
      split(items, X0, y, XW, BODY1 - y - 6);
      out.forEach(t => { const P = grp(t.k), g = 7, b = box(root, { x: t.x + g, y: t.y + g, w: t.w - 2 * g, h: t.h - 2 * g, r: 24, fill: P.soft, bd: P.bd, bw: 3, shadow: false, bg: true }), big = Math.min(t.w, t.h) > 260;
        tx(b, `tm${t.k}-v`, t.value, { x: 20, y: 14, w: t.w - 2 * g - 40, h: big ? 88 : 54, size: big ? 64 : 38, weight: 700, font: 'serif', color: P.ink });
        lab(b, `tm${t.k}-l`, t.label, { x: 20, y: big ? 104 : 70, w: t.w - 2 * g - 40, h: Math.max(30, t.h - 2 * g - (big ? 118 : 80)), max: big ? 34 : 26, min: 16, weight: 700, css: 'align-items:flex-start;' }); });
    },
    sunburst(root, s) {
      const y = top(root, s, 'sb-h'), svg = svgLayer(root, W, 1350), cx = W / 2, R2 = Math.min(470, (BODY1 - y) / 2 - 10), R1 = R2 * .62, R0 = R2 * .3, cy = y + R2 + 4, br = s.branches;
      const tot = br.reduce((q, b) => q + (b.pct != null ? pc(b.pct) : 1 / br.length), 0); let a = 0;
      const at = (r, ang) => { const t = (ang - 90) * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; };
      br.forEach((b, k) => { const P = grp(k), sw = 360 * (b.pct != null ? pc(b.pct) : 1 / br.length) / tot, kids = b.children || [];
        path(svg, sector(cx, cy, R0 + 6, R1, a + .8, a + sw - .8), { stroke: 'none', fill: P.ink, sharp: true });   // the darker tone keeps white labels readable
        kids.forEach((c, j) => { const a0 = a + sw * j / kids.length, a1 = a + sw * (j + 1) / kids.length; path(svg, sector(cx, cy, R1 + 6, R2, a0 + .8, a1 - .8), { stroke: 'none', fill: P.soft, sharp: true });
          const [lx, ly] = at((R1 + R2) / 2 + 3, (a0 + a1) / 2), lw = Math.min(170, (R2 - R1) * 1.25); lab(root, `sb${k}-${j}`, c, { x: lx - lw / 2, y: ly - 32, w: lw, h: 64, max: 22, min: 14, weight: 700, color: P.ink, align: 'center' }); });
        const [lx, ly] = at((R0 + R1) / 2 + 4, a + sw / 2); lab(root, `sb${k}`, b.title, { x: lx - 90, y: ly - 34, w: 180, h: 68, max: 26, min: 15, weight: 700, color: '#fff', align: 'center' }); a += sw; });
      circ(svg, cx, cy, R0, { fill: C.card, stroke: C.line, w: 4 }); lab(root, 'sb-c', s.root, { x: cx - R0 * .8, y: cy - 50, w: R0 * 1.6, h: 100, max: 32, weight: 700, align: 'center', color: C.clayD });
    },
    mindmap(root, s) {
      const y = top(root, s, 'mm-h'), svg = svgLayer(root, W, 1350), n = s.branches.length, cx = W / 2, cy = (y + BODY1) / 2, L = Math.ceil(n / 2), cw = 330;
      const rootW = 230, rootH = 150, hOf = b => 86 + (b.items || []).length * 50 + 22;
      const sideY = cnt => { const avail = BODY1 - y; return k => y + avail * (k + .5) / cnt; };
      s.branches.forEach((b, k) => { const right = k % 2 === 1, idx = Math.floor(k / 2), cnt = right ? n - L : L, P = grp(k), bh = Math.min(hOf(b), Math.floor((BODY1 - y) / cnt) - 22), by = sideY(cnt)(idx) - bh / 2, bx = right ? W - X0 - cw : X0;
        const ex = right ? bx : bx + cw, sx = right ? cx + rootW / 2 : cx - rootW / 2; path(svg, `M${sx} ${cy}C${(sx + ex) / 2} ${cy} ${(sx + ex) / 2} ${by + bh / 2} ${ex} ${by + bh / 2}`, { stroke: P.bd, w: 6 });
        const c = box(root, { x: bx, y: by, w: cw, h: bh, r: 26, bd: P.bd, bw: 3 }); E(c, 'abs', `left:16px;top:16px;width:52px;height:52px;border-radius:16px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(b.icon || 'bolt', 28, P.ink, 2));
        lab(c, `mm${k}`, b.title, { x: 80, y: 14, w: cw - 96, h: 60, max: 34, min: 20, weight: 700 });
        (b.items || []).forEach((t, j) => { if (84 + j * 50 + 46 > bh) return; E(c, 'abs', `left:26px;top:${102 + j * 50}px;width:12px;height:12px;border-radius:50%;background:${P.bd}`); lab(c, `mm${k}-${j}`, t, { x: 50, y: 84 + j * 50, w: cw - 66, h: 48, max: 27, min: 16, weight: 500, color: C.sub }); }); });
      const r = box(root, { x: cx - rootW / 2, y: cy - rootH / 2, w: rootW, h: rootH, r: rootH / 2, fill: C.claySoft, bd: C.clay, bw: 4 }); lab(r, 'mm-r', s.root, { x: 20, y: 10, w: rootW - 40, h: rootH - 26, max: 34, weight: 700, align: 'center', color: C.clayD });
    },
    decision(root, s) {
      const y = top(root, s, 'dt-h'), svg = svgLayer(root, W, 1350), n = s.options.length, qw = 760, qh = 150, gap = 24, cw = (XW - gap * (n - 1)) / n, ry = y + qh + 190, rh = Math.min(380, BODY1 - ry - 6);
      const q = box(root, { x: (W - qw) / 2, y, w: qw, h: qh, r: 36, fill: C.claySoft, bd: C.clay, bw: 4 }); E(q, 'abs', `left:24px;top:${(qh - 70) / 2 - 2}px;width:70px;height:70px;border-radius:50%;background:${C.clay};display:flex;align-items:center;justify-content:center;font:700 42px Lora,serif;color:#fff`, '?');
      lab(q, 'dt-q', s.q, { x: 112, y: 8, w: qw - 140, h: qh - 22, max: 38, weight: 700, color: C.clayD });
      s.options.forEach((o, k) => { const P = grp(k), x = X0 + k * (cw + gap), mx = x + cw / 2; path(svg, `M${W / 2} ${y + qh + 4}C${W / 2} ${y + qh + 100} ${mx} ${ry - 100} ${mx} ${ry - 8}`, { stroke: P.bd, w: 6 });
        const pw = Math.min(cw - 20, 230); lab(root, `dt${k}-a`, o.label, { x: mx - pw / 2, y: ry - 120, w: pw, h: 52, max: 26, min: 17, weight: 700, color: P.ink, align: 'center', css: `background:${P.soft};border:3px solid ${P.bd};border-radius:26px;` });
        const b = box(root, { x, y: ry, w: cw, h: rh, r: 30, bd: P.bd, bw: 3 }); E(b, 'abs', `left:20px;top:20px;width:64px;height:64px;border-radius:20px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(o.icon || 'check', 36, P.ink, 2));
        lab(b, `dt${k}-t`, o.title, { x: 20, y: 100, w: cw - 40, h: 90, max: 34, weight: 700 }); if (o.sub) lab(b, `dt${k}-s`, o.sub, { x: 20, y: 196, w: cw - 40, h: rh - 210, max: 26, min: 18, weight: 500, color: C.sub, css: 'align-items:flex-start;' }); });
    },
    // ---------- time / process ----------
    timeline(root, s) {
      const y = top(root, s, 'tl-h'), svg = svgLayer(root, W, 1350), n = s.events.length, cx = W / 2, pitch = (BODY1 - y) / n, cw = 420, ch = Math.min(pitch - 20, Math.max(...s.events.map(e => 96 + (e.sub ? H_(e.sub, 26, cw - 40, 500, 1.2) : 0))));
      path(svg, `M${cx} ${y}V${BODY1 - 10}`, { stroke: C.line, w: 8 });
      s.events.forEach((e, k) => { const P = grp(k), cy = y + pitch * (k + .5), left = k % 2 === 0, bx = left ? cx - 60 - cw : cx + 60;
        circ(svg, cx, cy, 22, { fill: P.bd, stroke: C.card, w: 6 }); path(svg, `M${left ? cx - 24 : cx + 24} ${cy}H${left ? bx + cw : bx}`, { stroke: P.bd, w: 4 });
        const ww = 200; lab(root, `tl${k}-w`, e.when, { x: left ? cx + 44 : cx - 44 - ww, y: cy - 30, w: ww, h: 60, max: 34, weight: 700, font: 'serif', color: P.ink, css: left ? '' : 'justify-content:flex-end;text-align:right;' });
        const b = box(root, { x: bx, y: cy - ch / 2, w: cw, h: ch, r: 26, bd: P.bd, bw: 3 }); if (e.icon) E(b, 'abs', `left:16px;top:16px;width:48px;height:48px;border-radius:14px;background:${P.soft};display:flex;align-items:center;justify-content:center`, icon(e.icon, 28, P.ink, 2));
        lab(b, `tl${k}-t`, e.title, { x: e.icon ? 76 : 20, y: 12, w: cw - (e.icon ? 92 : 40), h: 58, max: 32, min: 18, weight: 700 });
        if (e.sub) lab(b, `tl${k}-s`, e.sub, { x: 20, y: 80, w: cw - 40, h: ch - 92, max: 26, min: 16, weight: 500, color: C.sub, css: 'align-items:flex-start;' }); });
    },
    gantt(root, s) {
      const y = top(root, s, 'gt-h'), svg = svgLayer(root, W, 1350), LW = 280, gx = X0 + LW + 16, gw = W - X0 - gx, n = s.tasks.length, sc = s.scale, rh = Math.min(200, Math.floor((BODY1 - y - 70) / n));
      sc.forEach((t, k) => { const x = gx + gw * k / sc.length; path(svg, `M${x} ${y + 56}V${y + 70 + n * rh}`, { stroke: C.line, w: 2, dash: '2 8' }); lab(root, `gt-s${k}`, t, { x: x + 6, y, w: gw / sc.length - 12, h: 48, max: 28, min: 15, weight: 700, color: C.mid }); });
      s.tasks.forEach((t, k) => { const P = grp(k), yy = y + 70 + k * rh; E(root, 'abs', `left:${X0}px;top:${yy + 6}px;width:${XW}px;height:${rh - 12}px;border-radius:20px;background:${k % 2 ? 'transparent' : C.sand};opacity:.7`);
        lab(root, `gt${k}`, t.title, { x: X0 + 18, y: yy + 6, w: LW - 24, h: rh - 12, max: 34, min: 17, weight: 700 });
        const x0 = gx + gw * pc(t.start), x1 = gx + gw * pc(t.end), bh = Math.min(76, rh - 40); E(root, 'abs', `left:${x0}px;top:${yy + (rh - bh) / 2}px;width:${Math.max(bh, x1 - x0)}px;height:${bh}px;border-radius:${bh / 2}px;background:${P.bd};box-shadow:0 6px 14px rgba(20,20,19,.12)`); });
    },
    waterfall(root, s) {
      const y = top(root, s, 'wt-h') + 40, bars = [{ ...s.start, kind: 'total', d: +s.start.num }], svg = svgLayer(root, W, 1350); let run = +s.start.num;
      s.steps.forEach(st => { bars.push({ ...st, kind: +st.num >= 0 ? 'up' : 'down', from: run, d: +st.num }); run += +st.num; }); bars.push({ ...s.end, kind: 'total', d: run });
      const mx = Math.max(...bars.map(b => b.kind === 'total' ? b.d : Math.max(b.from, b.from + b.d))), base = BODY1 - 120, H_s = (base - y - 50) / (mx || 1), n = bars.length, gw = XW / n, bw = Math.min(150, gw - 30);
      bars.forEach((b, k) => { const x = X0 + gw * k + (gw - bw) / 2, lo = b.kind === 'total' ? 0 : Math.min(b.from, b.from + b.d), hi = b.kind === 'total' ? b.d : Math.max(b.from, b.from + b.d), col = b.kind === 'total' ? C.blue : b.kind === 'up' ? C.green : C.clay;
        const top_ = base - hi * H_s, h = Math.max(10, (hi - lo) * H_s); E(root, 'abs', `left:${x}px;top:${top_}px;width:${bw}px;height:${h}px;border-radius:18px;background:${col}`);
        if (k < n - 1) { const nb = bars[k + 1], ly = base - (b.kind === 'total' ? b.d : b.from + b.d) * H_s; path(svg, `M${x + bw} ${ly}H${X0 + gw * (k + 1) + (gw - bw) / 2}`, { stroke: C.lineD, w: 3, dash: '2 8' }); }
        tx(root, `wt${k}-v`, b.value, { x: x - 30, y: top_ - 54, w: bw + 60, h: 48, size: b.value.length > 6 ? 26 : 32, weight: 700, font: 'serif', align: 'center', color: col === C.blue ? C.blueD : col === C.green ? C.greenD : C.clayD });
        lab(root, `wt${k}-l`, b.label, { x: X0 + gw * k + 4, y: base + 14, w: gw - 8, h: 96, max: 24, min: 15, weight: 700, align: 'center' }); });
      path(svg, `M${X0} ${base}H${W - X0}`, { stroke: C.ink, w: 3 });
    },
    line(root, s) {
      let y = top(root, s, 'ln-h'); const svg = svgLayer(root, W, 1350), ser = s.series, all = ser.flatMap(q => q.values.map(Number)), mx0 = Math.max(...all), mn = Math.min(0, ...all), n = s.x.length;
      if (ser.length > 1) y = legendRow(root, ser.map((q, k) => ({ label: q.name, color: mid(k) })), y, X0, XW) + 14;
      const gx = X0 + 20, gw = XW - 150, t0 = y + 30, t1 = BODY1 - 80, mx = mx0 + (mx0 - mn) * .08, Y = v => t1 - (t1 - t0) * (v - mn) / ((mx - mn) || 1), X = i => gx + gw * i / (n - 1);
      [0, .25, .5, .75, 1].forEach(f => path(svg, `M${gx} ${t1 - (t1 - t0) * f}H${gx + gw}`, { stroke: C.line, w: f ? 2 : 4, dash: f ? '2 10' : null }));
      s.x.forEach((t, i) => lab(root, `ln-x${i}`, t, { x: X(i) - 70, y: t1 + 16, w: 140, h: 50, max: 24, min: 15, weight: 600, color: C.mid, align: 'center' }));
      const defs = NS(svg, 'defs'); const last = [];
      ser.forEach((q, k) => { const col = mid(k), pts = q.values.map((v, i) => [X(i), Y(+v)]);
        if (s.kind === 'area') { const g = NS(defs, 'linearGradient', { id: 'ln-g' + k, x1: 0, x2: 0, y1: 0, y2: 1 }); NS(g, 'stop', { offset: 0, 'stop-color': col, 'stop-opacity': .35 }); NS(g, 'stop', { offset: 1, 'stop-color': col, 'stop-opacity': .02 });
          path(svg, smooth(pts) + `L${f1(pts[n - 1][0])} ${t1}L${f1(pts[0][0])} ${t1}Z`, { stroke: 'none', fill: `url(#ln-g${k})` }); }
        path(svg, smooth(pts), { stroke: col, w: 8 }); pts.forEach((p, i) => circ(svg, p[0], p[1], i === n - 1 ? 14 : 8, { fill: i === n - 1 ? col : C.card, stroke: col, w: 4 })); last.push({ k, y: pts[n - 1][1], v: q.labels ? q.labels[n - 1] : String(q.values[n - 1]) + (s.unit || '') }); });
      last.sort((a, b) => a.y - b.y).forEach((l, i, arr) => { if (i && l.y - arr[i - 1].y < 50) l.y = arr[i - 1].y + 50; tx(root, `ln-v${l.k}`, l.v, { x: gx + gw + 22, y: l.y - 28, w: W - X0 - gx - gw - 22, h: 56, size: 34, weight: 700, font: 'serif', color: grp(l.k).ink }); });
    },
    heatmap(root, s) {
      const y = top(root, s, 'hm-h'), R = s.rows.length, Cc = s.cols.length, LW = 250, gx = X0 + LW, gw = W - X0 - gx, ch = 80, cw = gw / Cc, g = 8, cell = Math.min(150, Math.floor((BODY1 - y - ch - 60) / R)), all = s.cells.flat().map(Number), lo = Math.min(...all), hi = Math.max(...all);
      s.cols.forEach((t, j) => lab(root, `hm-c${j}`, t, { x: gx + j * cw + 4, y, w: cw - 8, h: ch - 10, max: 24, min: 14, weight: 700, align: 'center', color: C.mid }));
      s.rows.forEach((t, i) => { lab(root, `hm-r${i}`, t, { x: X0, y: y + ch + i * cell, w: LW - 16, h: cell - g, max: 28, min: 16, weight: 700 });
        s.cells[i].forEach((v, j) => { const f = (+v - lo) / ((hi - lo) || 1), bg = mixC(C.claySoft, C.clayD, f), x = gx + j * cw + g / 2, yy = y + ch + i * cell;
          E(root, 'abs', `left:${x}px;top:${yy}px;width:${cw - g}px;height:${cell - g}px;border-radius:18px;background:${bg}`);
          tx(root, `hm${i}-${j}`, String(v) + (s.unit || ''), { x, y: yy, w: cw - g, h: cell - g, size: Math.min(36, Math.floor(cw / 4)), weight: 700, align: 'center', color: lum(bg) < .19 ? '#fff' : C.ink }); }); });   // text colour from the cell's luminance
      if (s.legend) { const ly = y + ch + R * cell + 16; tx(root, 'hm-lo', s.legend.lo, { x: gx, y: ly, w: 200, h: 36, size: 22, weight: 600, color: C.mid }); E(root, 'abs', `left:${gx + 210}px;top:${ly + 8}px;width:${gw - 420}px;height:20px;border-radius:10px;background:linear-gradient(90deg,${C.claySoft},${C.clayD})`); tx(root, 'hm-hi', s.legend.hi, { x: W - X0 - 200, y: ly, w: 200, h: 36, size: 22, weight: 600, color: C.mid, align: 'right' }); }
    },
  };
}
