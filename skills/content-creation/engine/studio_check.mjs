// Drives the Design Studio in a real browser: usage  node studio_check.mjs <url> <outdir>
import { pathToFileURL } from 'url'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { chromium } = await import(pathToFileURL(path.join(LIB, 'node_modules/playwright-core/index.mjs')).href);
const { EXE, ARGS } = await import(pathToFileURL(path.join(LIB, 'core/render/browser.mjs')).href);
const [url, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, args: ARGS }); const problems = []; const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) problems.push(m); };
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } }); const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto(url); await page.waitForSelector('.choice');
ok(await page.locator('#go').isDisabled(), 'Generate is disabled before anything is chosen');
await page.click('[data-mode=single]'); await page.waitForSelector('.poster');
ok((await page.locator('.poster').count()) === 5, 'five cover designs in the gallery');
ok(await page.locator('.poster img').evaluateAll(a => a.every(i => i.complete && i.naturalWidth > 100)), 'every sample thumbnail loads');
await page.screenshot({ path: out + '/1-gallery.png' });
await page.click('.poster >> nth=0'); await page.waitForSelector('.form'); await page.screenshot({ path: out + '/2-content.png', fullPage: true });
await page.click('#go'); await page.waitForSelector('.results img', { timeout: 240000 }); ok(true, 'single image generated');
const w = await page.locator('.results img').first().evaluate(i => i.naturalWidth + 'x' + i.naturalHeight); ok(w === '1080x1350', 'result is 1080x1350 (' + w + ')');
await page.screenshot({ path: out + '/3-result-single.png', fullPage: true });
await page.reload(); await page.waitForSelector('.choice'); await page.click('[data-mode=carousel]'); await page.waitForSelector('.poster');
await page.click('.poster >> nth=1'); await page.click('.tab >> nth=1'); await page.click('.poster >> nth=0'); await page.click('.poster >> nth=2'); await page.waitForSelector('.deckrow');
ok((await page.locator('.deckrow').count()) === 4, 'deck shows cover, two infographics and the closing slide');
ok(await page.locator('#go').isDisabled(), 'carousel Generate stays disabled until a format is chosen');
await page.check('input[value=both]'); ok(!(await page.locator('#go').isDisabled()), 'Generate enables once the format is chosen');
await page.click('#go'); await page.waitForSelector('.results figure, .msg.err', { timeout: 400000 }); if (await page.locator('.msg.err').count()) { await page.screenshot({ path: out + '/err.png', fullPage: true }); console.log(await page.locator('.msg.err').innerText()); }
const names = await page.locator('.results figcaption a').allInnerTexts(); ok(names.some(n => n.endsWith('.pdf')) && names.filter(n => n.endsWith('.png')).length >= 4, 'PDF and PNGs delivered (' + names.length + ' files)');
await page.screenshot({ path: out + '/4-result-carousel.png', fullPage: true });
ok(errs.length === 0, 'no console or page errors' + (errs.length ? ': ' + errs[0] : ''));
await browser.close(); process.exit(problems.length ? 1 : 0);
