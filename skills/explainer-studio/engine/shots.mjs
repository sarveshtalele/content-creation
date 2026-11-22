// Carousel stills. usage: node shots.mjs <project> --size WxH --q mode=carousel --out <dir>   -> <dir>/slide-01.png ...
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs';
import { fileURLToPath } from 'url'; const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { openDemo, closeServer, takeSize } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const args = process.argv.slice(2), { w: VW, h: VH } = takeSize(args), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = args[0], Q = opt('--q', 'mode=carousel'), OUT = opt('--out', '.'), ONLY = opt('--slide', ''), PRE = opt('--prefix', 'slide');
fs.mkdirSync(OUT, { recursive: true });
const { browser, page } = await openDemo(dir, { w: VW, h: VH, q: Q, gl: false });
const N = await page.evaluate(() => window.N);
for (let k = 0; k < N; k++) {
  if (ONLY && +ONLY !== k + 1) continue;
  await page.evaluate(t => window.render(t), k + .5);
  await page.screenshot({ path: path.join(OUT, `${PRE}-${String(k + 1).padStart(2, '0')}.png`), clip: { x: 0, y: 0, width: VW, height: VH } });
}
await browser.close(); closeServer(); console.log('SHOTS', N);
