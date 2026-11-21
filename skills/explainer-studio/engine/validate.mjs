// Layout / text-leakage validator. usage: node validate.mjs <project> --size WxH [--q mode=reel] [--step 0.1] [--top 230] [--bottom 1470] [--side 40]
import { pathToFileURL } from 'url'; import path from 'path';
import { fileURLToPath } from 'url'; const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { openDemo, closeServer, takeSize } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const args = process.argv.slice(2), { w: VW, h: VH } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], Q = opt('--q', ''), STEP = +opt('--step', 0.1), TOP = +opt('--top', 0), BOT = +opt('--bottom', VH), SIDE = +opt('--side', 40);
const { browser, page } = await openDemo(dir, { w: VW, h: VH, q: Q, gl: false });
const res = await page.evaluate(({ STEP, TOP, BOT, SIDE, Q_GIF }) => {
  const W = innerWidth, H = innerHeight, issues = {}, note = (k, t, msg) => { (issues[k] ??= { msg, t0: t, t1: t, n: 0 }); issues[k].t1 = t; issues[k].n++; };
  const fonts = new Set();
  for (let t = 0; t <= window.DUR - 0.001; t += STEP) {
    window.render(t);
    const L = window.LAYOUT(t), it = L.items.filter(i => i.op >= 0.9);
    for (const i of L.items) {
      const [x0, y0, x1, y1] = i.r;
      if (i.op < .9) continue;
      fonts.add(i.font + ' ' + i.weight);
      if (x0 < SIDE - 1 || x1 > W - SIDE + 1) note('SAFE-X ' + i.id, t, `text outside side safe margin (${SIDE}px): [${x0.toFixed(0)}..${x1.toFixed(0)}] "${i.text.slice(0, 30)}"`);
      if (y0 < TOP - 1 || y1 > BOT + 1) note('SAFE-Y ' + i.id, t, `text outside vertical safe zone ${TOP}..${BOT}: [${y0.toFixed(0)}..${y1.toFixed(0)}] "${i.text.slice(0, 30)}"`);
      const [cx0, cy0, cx1, cy1] = i.c;
      if (x0 < cx0 - 1.5 || x1 > cx1 + 1.5) note('OVERFLOW-BOX ' + i.id, t, `text wider than its box: text ${(x1 - x0).toFixed(0)}px vs box ${(cx1 - cx0).toFixed(0)}px "${i.text.slice(0, 30)}"`);
      if (y0 < cy0 - 2 || y1 > cy1 + 2) note('OVERFLOW-BOX-Y ' + i.id, t, `text taller than its box: ${(y1 - y0).toFixed(0)} vs ${(cy1 - cy0).toFixed(0)} "${i.text.slice(0, 30)}"`);
      if (i.card) { const [a0, b0, a1, b1] = i.card; const pad = 10; if (x0 < a0 + pad || x1 > a1 - pad || y0 < b0 + 4 || y1 > b1 - 4) note('LEAK-CARD ' + i.id, t, `text leaks outside/touches its card: text [${x0.toFixed(0)},${y0.toFixed(0)},${x1.toFixed(0)},${y1.toFixed(0)}] card [${a0.toFixed(0)},${b0.toFixed(0)},${a1.toFixed(0)},${b1.toFixed(0)}] "${i.text.slice(0, 30)}"`); }
    }
    // overlaps between visible texts
    for (let a = 0; a < it.length; a++) for (let b = a + 1; b < it.length; b++) {
      const A = it[a].r, B = it[b].r, ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
      if (ox > 3 && oy > 3) note('OVERLAP ' + it[a].id + ' x ' + it[b].id, t, `texts overlap ${ox.toFixed(0)}×${oy.toFixed(0)}px: "${it[a].text.slice(0, 22)}" / "${it[b].text.slice(0, 22)}"`);
    }
    if (L.cap) for (const i of it) { const A = L.cap, B = i.r, ox = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), oy = Math.min(A[3], B[3]) - Math.max(A[1], B[1]); if (ox > 0 && oy > 0) note('CAPTION-OVERLAP ' + i.id, t, `caption overlaps "${i.text.slice(0, 30)}"`); }
    if (L.cap && (L.cap[0] < SIDE || L.cap[2] > W - SIDE || L.cap[3] > BOT + 40)) note('CAPTION-BOUNDS', t, `caption box ${L.cap.map(v => v.toFixed(0))}`);
    // scene bleed: texts from two scenes both ≥ .5 opacity
    const sc = new Set(L.items.filter(i => i.op > .5 && i.scene >= 0).map(i => i.scene)); if (sc.size > 1) note('SCENE-BLEED', t, `texts of ${sc.size} scenes visible together`);
  }
  if (Q_GIF) {   // structure checks on the finished page: boxes must not collide, and cards must not be mostly empty
    window.render(window.DUR - 1.5);
    const B = window.BOXES();
    for (let a = 0; a < B.length; a++) for (let b = a + 1; b < B.length; b++) {
      const A = B[a], Z = B[b]; if (A.bg || Z.bg || A.el.contains(Z.el) || Z.el.contains(A.el)) continue;
      const ox = Math.min(A.r[2], Z.r[2]) - Math.max(A.r[0], Z.r[0]), oy = Math.min(A.r[3], Z.r[3]) - Math.max(A.r[1], Z.r[1]);
      if (ox > 6 && oy > 6) note('BOX-OVERLAP #' + A.i + ' x #' + Z.i, window.DUR, `two boxes overlap ${ox.toFixed(0)}x${oy.toFixed(0)}px at (${A.r[0].toFixed(0)},${A.r[1].toFixed(0)})`);
    }
    for (const A of B) { const h = A.r[3] - A.r[1], w = A.r[2] - A.r[0]; if (A.n && !A.round && !A.bg && h > 100 && w > 150 && ((A.r[3] - A.tb) > .32 * h || (A.tt - A.r[1]) > .32 * h)) note('EMPTY-CARD #' + A.i, window.DUR, `card ${w.toFixed(0)}x${h.toFixed(0)} at (${A.r[0].toFixed(0)},${A.r[1].toFixed(0)}) is mostly empty: text spans ${(A.tt - A.r[1]).toFixed(0)}..${(A.tb - A.r[1]).toFixed(0)} of ${h.toFixed(0)}px`); }
  }
  const fontsOk = [...fonts].map(f => { const [fam, wt] = [f.slice(0, f.lastIndexOf(' ')), f.slice(f.lastIndexOf(' ') + 1)]; return f + ': ' + document.fonts.check(`${wt} 30px "${fam}"`); });
  return { issues: Object.entries(issues).map(([k, v]) => ({ k, ...v })), fontsOk };
}, { STEP, TOP, BOT, SIDE, Q_GIF: /mode=gif/.test(Q) });
await browser.close(); closeServer();
console.log('fonts:', res.fontsOk.join(' | '));
if (!res.issues.length) { console.log('VALIDATE OK: no overflow, leakage, overlap or safe-zone violations'); process.exit(0); }
for (const i of res.issues) console.log(`${i.k.padEnd(34)} ${i.t0.toFixed(1)}–${i.t1.toFixed(1)}s ×${i.n}  ${i.msg}`);
console.log(`VALIDATE: ${res.issues.length} issue group(s)`); process.exit(1);
