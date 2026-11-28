// Walkthrough Reel (1080x1920, Claude light): a real step-by-step guide recorded and verified by Playwright (engine/walk_run.mjs).
// Intro -> one scene per step (phone/browser frame with the real screenshot, a cursor that travels to the target and clicks, a highlight ring,
// "Expected" vs "Actual" with a Verified / Failed badge) -> summary checklist with an animated count. The author's CTA sits at the bottom of every frame.
import { C, E, box, tx, icon, spark, enter, seg, eo, back, clamp, fitSize, measure, chip, PALS } from './kit.js';
import { cta } from './cta.js';

const W = 1080, INTRO = 3.2, STEP = 4.2, SUM = 5.2, FADE = .35;
const ok_ = C.greenD, bad_ = C.clayD;

function badge(parent, ok, x, y, s = 1) {
  const b = E(parent, 'abs', `left:${x}px;top:${y}px;height:${56 * s}px;padding:0 ${22 * s}px 0 ${14 * s}px;border-radius:${28 * s}px;display:flex;align-items:center;gap:${10 * s}px;background:${ok ? C.greenSoft : C.claySoft};border:3px solid ${ok ? C.green : C.clay};box-sizing:border-box;opacity:0`);
  E(b, '', 'flex:none', icon(ok ? 'check' : 'bolt', 32 * s, ok ? ok_ : bad_, 2.4));
  const t = E(b, 'tx sans', `white-space:nowrap;font-size:${26 * s}px;font-weight:800;letter-spacing:.06em;color:${ok ? ok_ : bad_}`); const sp = E(t, '', 'display:block', '', 'span'); sp.textContent = ok ? 'VERIFIED' : 'FAILED';
  t.dataset.id = 'bd' + x + y; t.dataset.text = sp.textContent; return b;
}

export function buildWalk(stage, D) {
  const Wk = D.walk, steps = Wk.steps, n = steps.length, mob = Wk.device !== 'desktop';
  const roots = [], A = [];
  const DUR = INTRO + n * STEP + SUM;
  const scene = (t0, t1) => { const r = E(stage, 'scene'); r.style.display = 'block'; r.style.opacity = '1'; roots.push({ r, t0, t1 }); return r; };

  // —— intro ——
  {
    const r = scene(0, INTRO);
    E(r, 'abs', `left:${W - 340}px;top:120px;width:520px;height:520px;border-radius:50%;background:${C.claySoft}`); E(r, 'abs', `left:-180px;top:1100px;width:520px;height:520px;border-radius:50%;background:${C.blueSoft}`);
    const k = E(r, 'abs', 'left:70px;top:330px;display:flex;align-items:center;gap:14px'); E(k, '', 'width:40px;height:40px', spark(40, C.clay));
    const kt = E(k, 'tx sans', `font-size:28px;font-weight:800;letter-spacing:.14em;color:${C.clayD};white-space:nowrap`); E(kt, '', 'display:block', '', 'span').textContent = 'STEP-BY-STEP GUIDE'; kt.dataset.id = 'w-k'; kt.dataset.text = 'STEP-BY-STEP GUIDE';
    const z = fitSize(Wk.title, { w: 940, h: 420, max: 110, min: 64, weight: 700, font: 'serif', lh: 1.06 }), th = Math.ceil(measure(Wk.title, { size: z, weight: 700, font: 'serif', w: 940, lh: 1.06 }).h) + 8;
    const ti = tx(r, 'w-title', Wk.title, { x: 70, y: 410, w: 940, h: th, size: z, weight: 700, font: 'serif', wrap: true, lh: 1.06 });
    let y = 410 + th + 36, su = null;
    if (Wk.sub) { const sz = fitSize(Wk.sub, { w: 940, h: 150, max: 42, min: 30, weight: 500, lh: 1.22 }), sh = Math.ceil(measure(Wk.sub, { size: sz, weight: 500, w: 940, lh: 1.22 }).h) + 6; su = tx(r, 'w-sub', Wk.sub, { x: 70, y, w: 940, h: sh, size: sz, weight: 500, color: C.mid, wrap: true, lh: 1.22 }); y += sh + 40; }
    const row = E(r, 'abs', `left:70px;top:${y}px;width:940px;display:flex;flex-wrap:wrap;gap:16px`);
    const chips = [`${n} steps`, `${Wk.passed}/${n} verified`, 'Tested with Playwright'].map((c, i) => chip(row, 'w-c' + i, c, { size: 32, pal: PALS[i] }));
    A.push(t => { enter(k, t, .1, { dy: 12 }); enter(ti, t, .2, { dy: 30, d: .7 }); if (su) enter(su, t, .55, { dy: 16 }); chips.forEach((c, i) => enter(c, t, .9 + i * .15, { dy: 14, pop: true, sc: .9 })); });
  }

  // —— steps ——
  const FX = mob ? 325 : 60, FW = mob ? 430 : 960, sw = mob ? Wk.view.width : Wk.view.width, sh = Wk.view.height, scale = FW / sw, FH = Math.round(sh * scale), FY = mob ? 390 : 520;
  let prev = { x: FW * .5, y: FH * .55 };
  steps.forEach((s, i) => {
    const t0 = INTRO + i * STEP, r = scene(t0, t0 + STEP), P = PALS[i % 3];
    // progress dots + step label + what to do
    const dots = E(r, 'abs', `left:70px;top:150px;width:940px;display:flex;gap:8px`); for (let k = 0; k < n; k++) E(dots, '', `flex:1;height:8px;border-radius:4px;background:${k < i ? C.green : k === i ? C.clay : C.line}`);
    const lab = tx(r, `w${i}-n`, `STEP ${i + 1} OF ${n}`, { x: 70, y: 186, w: 600, h: 50, size: 28, weight: 800, color: C.clayD, ls: .12 });
    const say = s.say || s.action, sz = fitSize(say, { w: 940, h: 130, max: 58, min: 36, weight: 700, font: 'serif', lh: 1.08 });
    const sy = tx(r, `w${i}-say`, say, { x: 70, y: 238, w: 940, h: 134, size: sz, weight: 700, font: 'serif', wrap: true, lh: 1.08, css: 'align-items:flex-start;' });
    // device frame with the real screenshot
    const fr = box(r, { x: FX - 16, y: FY - (mob ? 16 : 58), w: FW + 32, h: FH + (mob ? 32 : 74), r: mob ? 64 : 30, fill: '#1B1B1A', bd: '#1B1B1A', bw: 2, shadow: false, bg: true, css: 'box-shadow:0 30px 60px rgba(20,20,19,.22);' });
    if (!mob) { [C.clay, '#E8B44A', C.green].forEach((c, k) => E(fr, 'abs', `left:${24 + k * 26}px;top:20px;width:16px;height:16px;border-radius:50%;background:${c}`)); const ub = E(fr, 'abs', `left:120px;top:12px;width:${FW - 120}px;height:32px;border-radius:16px;background:#2C2C2A`); tx(ub, `w${i}-u`, (s.url || '').replace(/^https?:\/\//, '').slice(0, 60), { x: 16, y: 0, w: FW - 150, h: 32, size: 18, weight: 500, font: 'mono', color: '#BFBAAE' }); }
    const view = E(r, 'abs', `left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px;border-radius:${mob ? 48 : 10}px;overflow:hidden;background:#fff`), cam = E(view, 'abs', `left:0;top:0;width:${FW}px;height:${FH}px`);
    const img = f => E(cam, 'abs', `left:0;top:0;width:${FW}px;height:${FH}px;background:#fff url(walk/${f}) center top/100% auto no-repeat`);
    const pre = s.pre ? img(s.pre) : null, post = img(s.shot), shot = view;
    let ring = null, cur = null, tgt = null;
    if (s.box) {
      tgt = { x: (s.box.x + s.box.w / 2) * scale, y: (s.box.y + s.box.h / 2) * scale };
      ring = E(cam, 'abs', `left:${s.box.x * scale - 8}px;top:${s.box.y * scale - 8}px;width:${s.box.w * scale + 16}px;height:${s.box.h * scale + 16}px;border-radius:14px;border:4px solid ${C.clay};box-shadow:0 0 0 7px ${C.clay}33;opacity:0;box-sizing:border-box`);
      cur = E(cam, 'abs', 'left:0;top:0;width:44px;height:44px;opacity:0', `<svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="#141413" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
      cam.style.transformOrigin = `${tgt.x}px ${tgt.y}px`;
    }
    const from = prev; if (tgt) prev = tgt;
    // expected vs actual + verdict
    const py = FY + FH + (mob ? 48 : 72), pw = 940, pb = box(r, { x: 70, y: py, w: pw, h: 196, r: 30, bd: s.ok ? C.green : C.clay, bw: 3, css: 'box-shadow:0 14px 30px rgba(20,20,19,.08);' });
    tx(pb, `w${i}-el`, 'Expected', { x: 28, y: 22, w: 180, h: 40, size: 26, weight: 800, color: C.mid });
    tx(pb, `w${i}-e`, s.expected, { x: 210, y: 22, w: pw - 250, h: 40, size: fitSize(s.expected, { w: pw - 250, h: 40, max: 30, min: 20, weight: 600 }), weight: 600 });
    tx(pb, `w${i}-al`, 'Actual', { x: 28, y: 76, w: 180, h: 40, size: 26, weight: 800, color: C.mid });
    tx(pb, `w${i}-a`, s.actual, { x: 210, y: 76, w: pw - 250, h: 40, size: fitSize(s.actual, { w: pw - 250, h: 40, max: 30, min: 20, weight: 600 }), weight: 600, color: s.ok ? ok_ : bad_ });
    const bd = badge(pb, s.ok, 28, 128, .92);
    tx(pb, `w${i}-ms`, `${(s.ms / 1000).toFixed(1)} s`, { x: pw - 180, y: 130, w: 150, h: 50, size: 26, weight: 600, color: C.mid, align: 'right' });
    A.push(t => {
      const u = t - t0; enter(lab, t, t0 + .05, { dy: 10 }); enter(sy, t, t0 + .12, { dy: 18 });
      const sk = eo(seg(u, .1, .6)); shot.style.opacity = String(sk); shot.style.transform = `scale(${1.04 - .04 * sk})`; fr.style.opacity = String(sk);
      if (pre) post.style.opacity = String(eo(seg(u, 1.95, 2.35)));   // the page before the action, then the result
      if (tgt) { const z = eo(seg(u, .55, 1.4)) * (1 - eo(seg(u, 2.9, 3.6))); cam.style.transform = `scale(${1 + .45 * z})`; }   // camera: zoom onto the target and back
      if (cur) { const m = eo(seg(u, .7, 1.6)), x = from.x + (tgt.x - from.x) * m, y = from.y + (tgt.y - from.y) * m - Math.sin(m * Math.PI) * 60, press = Math.sin(clamp((u - 1.6) / .25) * Math.PI);
        cur.style.opacity = String(clamp((u - .5) * 4)); cur.style.transform = `translate(${x - 7}px,${y - 5}px) scale(${1 - press * .18})`;
        const rk = seg(u, 1.55, 1.85); ring.style.opacity = String(clamp(rk * 2) * (1 - seg(u, 3.6, 4))); ring.style.transform = `scale(${1.25 - .25 * eo(rk)})`; }
      enter(pb, t, t0 + 1.9, { dy: 20 }); const bk = seg(u, 2.35, 2.75); bd.style.opacity = String(clamp(bk * 2)); bd.style.transform = `scale(${.6 + .4 * back(bk, 2)})`;
    });
  });

  // —— summary ——
  {
    const t0 = INTRO + n * STEP, r = scene(t0, DUR), all = Wk.passed === n;
    const k = tx(r, 'w-sk', 'EVERY STEP CHECKED', { x: 70, y: 240, w: 940, h: 50, size: 28, weight: 800, color: C.clayD, ls: .12 });
    const big = tx(r, 'w-big', `${Wk.passed}/${n}`, { x: 70, y: 290, w: 940, h: 210, size: 190, weight: 700, font: 'serif', color: all ? ok_ : bad_, lh: 1 });
    const bl = tx(r, 'w-bl', all ? 'steps verified end to end' : 'steps verified: fix the failed ones', { x: 70, y: 500, w: 940, h: 60, size: 40, weight: 700 });
    const ph = Math.min(118, Math.floor(820 / n)), rows = steps.map((s, i) => { const b = box(r, { x: 70, y: 600 + i * (ph + 14), w: 940, h: ph, r: 28, bd: s.ok ? C.green : C.clay, bw: 3, shadow: false });
      E(b, 'abs', `left:20px;top:${(ph - 6 - 56) / 2}px;width:56px;height:56px;border-radius:50%;background:${s.ok ? C.greenSoft : C.claySoft};display:flex;align-items:center;justify-content:center`, icon(s.ok ? 'check' : 'bolt', 34, s.ok ? ok_ : bad_, 2.4));
      tx(b, `w-r${i}`, `${i + 1}. ${s.say || s.action}`, { x: 96, y: 0, w: 820, h: ph - 6, size: fitSize(`${i + 1}. ${s.say || s.action}`, { w: 820, h: ph - 16, max: 32, min: 20, weight: 600, lh: 1.15 }), weight: 600, wrap: true, lh: 1.15 }); return b; });
    A.push(t => { enter(k, t, t0 + .05, { dy: 10 }); enter(big, t, t0 + .1, { sc: .7, dy: 0, pop: true, d: .6 }); enter(bl, t, t0 + .4, { dy: 14 }); rows.forEach((b, i) => enter(b, t, t0 + .6 + i * .14, { dx: -30, dy: 0 })); });
  }
  const bar = cta(stage, 'walk-cta', D.brand, { x: 60, y: 1660, w: 960, h: 84, size: 26, bw: 4 });   // the author's CTA on every frame

  return { DUR, render(t) {
    roots.forEach(({ r, t0, t1 }) => { const vis = t >= t0 - .001 && t < t1 + .001; r.style.display = vis ? 'block' : 'none'; if (vis) r.style.opacity = String(Math.min(t0 === 0 ? 1 : eo(seg(t, t0, t0 + FADE)), 1 - seg(t, t1 - FADE, t1))); });
    A.forEach(f => f(t)); bar.style.opacity = '1';
  } };
}
