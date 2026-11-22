// Playwright end-to-end evaluation of a built carousel page. usage: node carousel_eval.mjs <film dir> > result.json
import { pathToFileURL } from 'url'; import path from 'path';
import { fileURLToPath } from 'url'; const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const { browser, page } = await openDemo(process.argv[2], { w: 1080, h: 1350, q: 'mode=carousel', gl: false });
const N = await page.evaluate(() => window.N), out = { slides: N, per: [], problems: [] };
for (let k = 0; k < N; k++) {
  await page.evaluate(t => window.render(t), k + .5);
  const r = await page.evaluate(async () => {
    const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
    const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const m = c.match(/[\d.]+/g); if (m && (m.length < 4 || +m[3] > .6)) return c; } return 'rgb(250,249,245)'; };
    const vis = [...document.querySelectorAll('.scene')].find(s => s.style.display !== 'none');
    const imgs = [...vis.querySelectorAll('*')].map(e => ({ e, u: (getComputedStyle(e).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1] })).filter(x => x.u);
    const res = { images: [], lowContrast: [], small: [] };
    for (const { e, u } of imgs) { const im = new Image(); im.src = u; try { await im.decode(); } catch {} const b = e.getBoundingClientRect(); res.images.push({ src: u.split('/').slice(-2).join('/'), natural: [im.naturalWidth, im.naturalHeight], shown: [Math.round(b.width), Math.round(b.height)], loaded: im.naturalWidth > 0, scale: im.naturalWidth ? +(b.width / im.naturalWidth).toFixed(2) : null }); }
    for (const t of vis.querySelectorAll('.tx')) {
      const cs = getComputedStyle(t), fs = parseFloat(cs.fontSize), txt = (t.textContent || '').trim(); if (!txt) continue;
      const a = lum(cs.color), b = lum(bgOf(t)), cr = (Math.max(a, b) + .05) / (Math.min(a, b) + .05), big = fs >= 24 && +cs.fontWeight >= 600 || fs >= 32;
      if (cr < (big ? 3 : 4.5)) res.lowContrast.push({ text: txt.slice(0, 40), ratio: +cr.toFixed(2), size: fs });
      if (fs < 20) res.small.push({ text: txt.slice(0, 40), size: fs });
    }
    let top = 1e9, bot = 0; for (const e of vis.querySelectorAll('*')) { const b = e.getBoundingClientRect(); if (b.width < 8 || b.height < 8 || b.height > 1000 || b.top < 120 || b.top > 1190) continue; top = Math.min(top, b.top); bot = Math.max(bot, b.bottom); }
    res.span = bot ? [Math.round(top), Math.round(bot)] : [0, 0]; res.fill = bot ? +((bot - top) / 1042).toFixed(2) : 0;
    res.theme = getComputedStyle(document.getElementById('stage')).backgroundColor; return res;
  });
  out.per.push(r);
  if (r.fill && r.fill < .5 && k > 0 && k < N - 1) out.problems.push(`slide ${k + 1}: underfilled, content uses only ${Math.round(r.fill * 100)}% of the slide body`);
  if (r.span[1] > 1176 && k > 0 && k < N - 1) out.problems.push(`slide ${k + 1}: content reaches y=${r.span[1]}, into the CTA strip (oversized)`);
  r.images.forEach(i => { if (!i.loaded) out.problems.push(`slide ${k + 1}: image failed to load ${i.src}`); else if (i.scale > 1.3) out.problems.push(`slide ${k + 1}: ${i.src} is shown ${i.scale}x its pixel size (will look blurry)`); });
  r.lowContrast.forEach(c => out.problems.push(`slide ${k + 1}: low contrast ${c.ratio} on "${c.text}"`));
  r.small.forEach(c => out.problems.push(`slide ${k + 1}: text under 20px "${c.text}"`));
}
console.log(JSON.stringify(out)); await browser.close(); closeServer();
