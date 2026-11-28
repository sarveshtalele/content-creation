// Playwright screenshot of one page. usage: node pageshot.mjs <url|file.html> <out.png> [--size 1280x800] [--scale 2] [--wait 1500] [--full]
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs';
import { fileURLToPath } from 'url'; const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { chromium } = await import(pathToFileURL(path.join(LIB, 'node_modules/playwright-core/index.mjs')).href);
const { EXE, ARGS } = await import(pathToFileURL(path.join(LIB, 'core/render/browser.mjs')).href);
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const [src, out] = a, [vw, vh] = opt('--size', '1280x800').split('x').map(Number), scale = +opt('--scale', 2), wait = +opt('--wait', 1500);
const url = /^https?:/.test(src) ? src : pathToFileURL(path.resolve(src)).href;
const browser = await chromium.launch({ executablePath: EXE, args: ARGS });
try {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: scale, locale: 'en-US', colorScheme: 'light' });
  const page = await ctx.newPage(); await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await page.waitForTimeout(wait);
  await page.screenshot({ path: out, fullPage: a.includes('--full'), omitBackground: a.includes('--transparent'), clip: a.includes('--full') ? undefined : { x: 0, y: 0, width: vw, height: vh } });
  const bytes = fs.statSync(out).size; console.log(`SHOT ${out} ${vw}x${vh}@${scale}x ${bytes} bytes title=${JSON.stringify(await page.title())}`);
} finally { await browser.close(); }
