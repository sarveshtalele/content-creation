import { pathToFileURL } from 'url'; import path from 'path';
import { fileURLToPath } from 'url'; const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
import fs from 'fs';
const [dir, mode, w, h, out] = process.argv.slice(2);
const { browser, page } = await openDemo(dir, { w: +w, h: +h, q: mode === 'gif' ? 'mode=gif' : '', gl: false });
const r = await page.evaluate(() => { const s = new Map(); for (let t = 0; t < window.DUR; t += .1) { window.render(t); for (const b of window.TEXTS(t)) { const k = b.id + '\u0001' + b.text; if (!s.has(k)) s.set(k, { id: b.id, text: b.text, t0: +t.toFixed(1) }); } } return [...s.values()]; });
await browser.close(); closeServer(); fs.writeFileSync(out, JSON.stringify(r, null, 1)); console.log(mode, r.length, 'unique texts');
