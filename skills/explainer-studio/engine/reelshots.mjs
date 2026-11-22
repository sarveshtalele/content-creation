// Stills of a staged reel at given times: node reelshots.mjs <film dir> <out dir> t1 t2 ...
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const [dir, out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920, q: '', gl: false });
for (const t of ts) { await page.evaluate(x => window.render(+x), t); await page.screenshot({ path: path.join(out, `t${String(t).replace('.', '_')}.png`), clip: { x: 0, y: 0, width: 1080, height: 1920 } }); }
await browser.close(); closeServer(); console.log('SHOTS', ts.length);
