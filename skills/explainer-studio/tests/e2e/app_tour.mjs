// Playwright tour of the Design Studio web app: drives every workspace like a person would, asserts what each one shows, records a video.
// usage (from skills/explainer-studio/runtime): node ../tests/e2e/app_tour.mjs <outDir>   -> <outDir>/app/app-tour.mp4 (+ .webm), prints OK/FAIL per check
import { spawn, execFileSync } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const SK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), RT = path.join(SK, 'runtime');
const { chromium } = await import(pathToFileURL(path.join(RT, 'node_modules/playwright-core/index.mjs')).href);
const { EXE, ARGS } = await import(pathToFileURL(path.join(RT, 'core/render/browser.mjs')).href);
const OUT = path.resolve(process.argv[2] || '.'), VID = path.join(OUT, 'app'); fs.mkdirSync(VID, { recursive: true });
const py = process.platform === 'win32' ? 'python' : 'python3';
const waitLine = (proc, rx) => new Promise((res, rej) => { let buf = ''; const t = setTimeout(() => rej(new Error('timeout: ' + buf.slice(-300))), 60000);
  const on = d => { buf += d; const m = rx.exec(buf); if (m) { clearTimeout(t); res(m); } }; proc.stdout.on('data', on); proc.stderr.on('data', on); });

const ENV = { ...process.env, PYTHONUNBUFFERED: '1' }, app = spawn(py, [path.join(SK, 'scripts', 'studio.py'), 'studio', '--foreground', '--no-open', '--port', '0'], { env: ENV }), [, URL] = await waitLine(app, /(http:\/\/127\.0\.0\.1:\d+\/\?t=\S+)/);
const fx = spawn(py, ['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', path.join(SK, 'fixtures', 'walk')], { env: ENV }), [, FXPORT] = await waitLine(fx, /port (\d+)/);
const browser = await chromium.launch({ executablePath: EXE, args: ARGS, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: VID, size: { width: 1440, height: 900 } } });
const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let fails = 0; const check = (ok, what) => { console.log((ok ? 'OK   ' : 'FAIL ') + what); if (!ok) fails++; };
const pause = (ms = 700) => page.waitForTimeout(ms);
const go = async h => { await page.goto(URL + '#/' + h); await page.waitForSelector('h1'); await pause(900); };
const SRC = 'Most free trials end before data. Of 1,000 visitors who see the pricing page, 400 start a free trial. Only 240 connect a data source, the step that predicts everything. 96 reach a paid plan and 72 are still paying after three months. The biggest drop-off happens between trial and first data.';

try {
  // Home: analyse a source
  await go('home'); check(await page.locator('h1').innerText() !== '', 'Home loads');
  await page.fill('#src', SRC); await pause(); await page.getByRole('button', { name: 'Analyse my content' }).click();
  await page.waitForSelector('.reco', { timeout: 90000 });   // the first analysis can wait on the app's startup health check await pause(1500);
  check((await page.locator('.shapes').innerText()).includes('Narrowing numbers'), 'Decision matrix finds "Narrowing numbers"');
  check((await page.locator('.reco').innerText()).toLowerCase().includes('funnel'), 'Funnel recommended for the GIF');
  await page.mouse.wheel(0, 600); await pause(1200);

  // GIF: ranked gallery, pick, hook, request
  await go('gif'); const first = await page.locator('.pick').first().innerText(); check(/funnel/i.test(first), 'GIF gallery ranks the funnel template #1');
  check(await page.locator('.pick').count() >= 15, 'GIF gallery lists every template');
  await page.locator('.pick').first().click(); await pause(); await page.locator('.hooks button').first().click(); await pause();
  await page.fill('#gt', 'Why most free trials end before data'); await page.getByRole('button', { name: 'Prepare the request' }).click();
  await page.waitForSelector('pre'); check((await page.locator('pre').innerText()).includes('gif.template = "funnel"'), 'GIF request carries the chosen template'); await pause(1200);

  // Carousel: one infographic image built by the real engine
  await go('carousel'); await page.getByRole('tab', { name: 'One infographic image' }).click(); await pause();
  const donut = page.locator('.pick', { hasText: 'Donut' }).first(); await donut.scrollIntoViewIfNeeded(); await donut.click(); await pause(900);
  await page.getByRole('button', { name: 'Build' }).scrollIntoViewIfNeeded(); await page.getByRole('button', { name: 'Build' }).click();
  await page.waitForSelector('.results img', { timeout: 240000 }); await page.locator('.results img').first().scrollIntoViewIfNeeded(); await pause(2000);
  check(await page.locator('.results img').count() >= 1, 'Carousel workspace builds a chart image');

  // Reel: hooks, visual hook, request
  await go('reel'); check(await page.locator('.hooks').count() >= 3, 'Reel shows spoken, visual and format hooks');
  await page.locator('.hooks').first().locator('button').first().click(); await page.fill('#rt', 'Why most free trials end before data'); await pause();
  await page.getByRole('button', { name: 'Prepare the request' }).click(); await page.waitForSelector('pre'); check((await page.locator('pre').innerText()).includes('Claude light'), 'Reel request defaults to the Claude light theme'); await pause(1200);

  // Reel cover: render all layouts
  await go('cover'); await page.fill('#ch', 'Why do most free trials end before data?'); await page.fill('#cs', 'Of 1,000 visitors, 72 are still paying after three months');
  await page.fill('#cc', 'Trials, Data, Retention'); await page.fill('#cf', 'The trial funnel'); await page.fill('#cp', 'Pricing page\nFree trial\nConnect data\nPaid plan'); await pause();
  await page.getByRole('button', { name: 'Render the covers' }).click(); await page.waitForSelector('.results img', { timeout: 240000 }); await page.locator('.results').scrollIntoViewIfNeeded(); await pause(2500);
  check(await page.locator('.results img').count() >= 4, 'Reel cover renders every supported layout');

  // Walkthrough: a real guide run by Playwright, verified, rendered as a Reel
  await go('walkthrough'); await page.fill('#wt', 'Add and finish your first task in Taskly'); await page.fill('#ws', 'Checked step by step in a real browser');
  const rows = () => page.locator('.wstep'), setRow = async (i, { say, action, target, check: ck, value }) => {
    const r = rows().nth(i); await r.locator('select').first().selectOption(action); await pause(250); const R2 = rows().nth(i), ins = R2.locator('input[type=text]');
    await ins.nth(0).fill(say); await ins.nth(1).fill(target); if (ck) { await R2.locator('select').nth(1).selectOption(ck[0]); await ins.nth(2).fill(ck[1]); } if (value) await ins.nth(2).fill(value); };
  await setRow(0, { say: 'Open Taskly', action: 'goto', target: `http://127.0.0.1:${FXPORT}/app.html`, check: ['text', 'No tasks yet'] });
  await setRow(1, { say: 'Tap New task', action: 'click', target: '#new', check: ['visible', '#t'] });
  await page.getByRole('button', { name: 'Add step' }).click(); await setRow(2, { say: 'Type the task name', action: 'fill', target: '#t', value: 'Write the release notes' });
  await page.getByRole('button', { name: 'Add step' }).click(); await setRow(3, { say: 'Add the task', action: 'click', target: '#add', check: ['text', 'Write the release notes'] }); await pause(900);
  await page.getByRole('button', { name: 'Run, verify and render' }).click();
  await page.waitForSelector('.results video', { timeout: 600000 }); await page.locator('.results').scrollIntoViewIfNeeded(); await pause(2500);
  check(await page.locator('.msg.ok').count() >= 1 && await page.locator('.msg.err').count() === 0, 'Walkthrough: every step verified and the Reel rendered');

  // Library
  await go('library'); check(await page.locator('.item').count() >= 1, 'Library lists what was made'); await pause(1200);
  await page.goto(URL.replace('/?', '/catalog?')); await page.waitForSelector('h1'); await pause(900);
  const cat = await page.evaluate(async () => { const im = [...document.images]; im.forEach(i => i.loading = 'eager'); await Promise.all(im.map(i => i.decode().catch(() => null))); return { n: im.length, broken: im.filter(i => !i.naturalWidth).length }; });
  check(cat.n >= 50 && cat.broken === 0, `Design catalogue shows every design (${cat.n} samples, ${cat.broken} broken)`); await page.mouse.wheel(0, 1400); await pause(1200);
  check(errors.length === 0, 'No JavaScript errors in the app' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
} catch (e) { check(false, 'Tour stopped: ' + String(e.message || e).split('\n')[0]); }

const v = page.video(); await ctx.close(); await browser.close(); app.kill(); fx.kill();
const webm = path.join(VID, 'app-tour.webm'); if (v) fs.renameSync(await v.path(), webm);
try { const ff = (await import(pathToFileURL(path.join(RT, 'node_modules/ffmpeg-static/index.js')).href)).default; execFileSync(ff, ['-y', '-v', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', path.join(VID, 'app-tour.mp4')]); } catch {}
console.log(fails ? `APP TOUR: ${fails} check(s) failed` : 'APP TOUR OK'); process.exit(fails ? 1 : 0);
