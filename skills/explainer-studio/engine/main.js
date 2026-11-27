// Entry: reads data.json (built by studio.py) and drives either the Reel (1080x1920, voiced) or the GIF (one page, silent).
import { E, seg, eo, FLAGS } from './kit.js';
import { buildReel } from './reel.js';
import { buildGif } from './gif.js';
import { cta } from './cta.js';
import { buildCarousel } from './carousel.js';
import { buildCover } from './cover.js';
import { buildWalk } from './walk.js';
import { buildThumb } from './thumb.js';

const Q = new URLSearchParams(location.search);
const MODE = Q.get('mode') || 'reel';
const stage = document.getElementById('stage');
const W = innerWidth, H = innerHeight;
stage.style.width = W + 'px'; stage.style.height = H + 'px';

function effOpacity(el) {
  let o = 1;
  for (let n = el; n && n !== stage; n = n.parentElement) {
    const cs = n.style;
    if (cs.display === 'none') return 0;
    if (cs.opacity !== '') o *= parseFloat(cs.opacity);
  }
  return o;
}
const bounds = el => { const span = el.firstElementChild || el; const rg = document.createRange(); rg.selectNodeContents(span); return { span, r: rg.getBoundingClientRect() }; };
function collectTexts() {
  const out = [];
  stage.querySelectorAll('.tx').forEach(el => {
    if (effOpacity(el) < 0.97) return;
    const { r } = bounds(el); if (r.width === 0) return;
    out.push({ id: el.dataset.id, text: el.dataset.text, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
  });
  return out;
}
function layoutInfo() {
  const out = [];
  stage.querySelectorAll('.tx').forEach(el => {
    const o = effOpacity(el); if (o < 0.03) return;
    const { span, r } = bounds(el); if (r.width === 0) return;
    const c = el.getBoundingClientRect();
    let card = null; for (let n = el.parentElement; n && n !== stage; n = n.parentElement) { if (n.dataset && n.dataset.box) { card = n.getBoundingClientRect(); break; } }
    if (el.dataset.box) card = c;   // chips are their own box
    let sc = el; while (sc && !(sc.classList && sc.classList.contains('scene'))) sc = sc.parentElement;
    out.push({ id: el.dataset.id, text: el.dataset.text, op: o, r: [r.left, r.top, r.right, r.bottom], c: [c.left, c.top, c.right, c.bottom], card: card && [card.left, card.top, card.right, card.bottom],
      scene: sc ? [...stage.children].indexOf(sc) : -1, font: getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, ''), weight: getComputedStyle(el).fontWeight });
  });
  const ci = document.getElementById('capin'), cap = document.getElementById('cap');
  let capR = null; if (ci && cap && parseFloat(cap.style.opacity || '0') > 0.03) { const r = ci.getBoundingClientRect(); capR = [r.left, r.top, r.right, r.bottom]; }
  return { items: out, cap: capR };
}
window.LAYOUT = () => layoutInfo();
window.BOXES = () => [...stage.querySelectorAll('[data-box]')].filter(el => !el.classList.contains('tx') && effOpacity(el) >= .95).map(el => {
  const r = el.getBoundingClientRect(), tx = [...[...el.querySelectorAll('.tx')].map(t => bounds(t).r), ...[...el.querySelectorAll('svg')].map(s => s.getBoundingClientRect())].filter(q => q.width > 0);
  return { r: [r.left, r.top, r.right, r.bottom], tb: tx.length ? Math.max(...tx.map(q => q.bottom)) : null, tt: tx.length ? Math.min(...tx.map(q => q.top)) : null, n: tx.length, bg: el.dataset.bg === '1', round: parseFloat(el.style.borderRadius) >= Math.min(r.width, r.height) / 2 - 1, i: [...stage.querySelectorAll('[data-box]')].indexOf(el), el };
});
window.TEXTS = () => collectTexts();
async function loadFonts() {
  const fam = ['500 40px Lora', '600 40px Lora', '700 40px Lora', 'italic 500 40px Lora', '400 30px Inter', '500 30px Inter', '600 30px Inter', '700 30px Inter', '800 30px Inter', '400 30px "JetBrains Mono"', '500 30px "JetBrains Mono"', '700 30px "JetBrains Mono"', '400 30px Excalifont'];
  await Promise.all(fam.map(f => document.fonts.load(f, 'AaBb0123 ~$>')));
  await document.fonts.ready;
}

async function setupReel(D) {
  const R = buildReel(stage, D);
  const bar = cta(stage, 'reel-cta', D.brand, { x: 60, y: 1486, w: 960, h: 84, size: 26, bw: 4 });
  const cap = E(stage, '', 'top:1215px;height:230px', ''); cap.id = 'cap';
  const capIn = E(cap, '', 'font-size:44px;line-height:1.26;padding:24px 36px;max-width:900px;min-width:300px', ''); capIn.id = 'capin';
  if (D.look === 'cinematic') Object.assign(capIn.style, { background: 'rgba(8,12,26,.78)', color: '#F3F0E8', borderColor: '#FF8A5B', boxShadow: '0 0 36px rgba(255,138,91,.35)' });
  window.DUR = D.DUR; window.EV = []; window.CAPS = D.chunks;
  window.render = t => {
    const ended = R.render(t);
    bar.style.opacity = ended ? '0' : String(eo(seg(t, .3, .9)));
    const c = D.chunks.find(c => t >= c.t0 - .001 && t < c.t1);
    if (c && !ended) {
      if (capIn.textContent !== c.text) capIn.textContent = c.text;
      cap.style.opacity = String(Math.min(eo(seg(t, c.t0, c.t0 + .12)), 1 - seg(t, c.t1 - .08, c.t1)));
    } else cap.style.opacity = '0';
  };
}
async function setupGif(D) {
  const g = buildGif(stage, D);
  window.DUR = g.DUR; window.EV = []; window.render = g.render;
}
async function setupCarousel(D) {
  const g = buildCarousel(stage, D);
  window.DUR = g.DUR; window.N = g.N; window.EV = []; window.render = g.render;
}
async function setupThumb(D) {
  const g = buildThumb(stage, D);
  window.DUR = g.DUR; window.N = g.N; window.EV = []; window.render = g.render;
}
async function setupWalk(D) {
  const g = buildWalk(stage, D);
  window.DUR = g.DUR; window.EV = []; window.render = g.render;
}
async function setupCover(D) {
  const g = buildCover(stage, D);
  window.DUR = g.DUR; window.N = g.N; window.EV = []; window.render = g.render;
}
(async () => {
  const D = await (await fetch('data.json')).json();
  FLAGS.logo = D.logo === true;
  await loadFonts();                                   // before building: templates measure text to fit it
  await (MODE === 'gif' ? setupGif(D) : MODE === 'carousel' ? setupCarousel(D) : MODE === 'cover' ? setupCover(D) : MODE === 'walk' ? setupWalk(D) : MODE === 'thumb' ? setupThumb(D) : setupReel(D));
  window.READY = true;
})().catch(e => { console.error(e); throw e; });
