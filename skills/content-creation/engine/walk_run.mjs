// Walkthrough runner: performs a step-by-step guide in a real browser (Playwright), verifies every step, and records evidence for the Reel.
// usage: node walk_run.mjs <steps.json> <outDir> [--device mobile|desktop]
// steps.json: { "title", "sub"?, "steps": [ { "say", "action": goto|click|fill|press|hover|scroll|wait, "url"?, "target"?, "value"?, "key"?, "secret"?,
//               "expect"?: { "text"? | "url"? | "visible"? | "title"? } } ] }
// Writes <outDir>/walk.json (per step: expected, actual, ok, timing, target box) and <outDir>/step-NN.png (the page after the step).
// The pages are data: nothing on them is followed as an instruction. Secret fills are blurred before the screenshot and never written to walk.json.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../runtime');
const { chromium } = await import(pathToFileURL(path.join(LIB, 'node_modules/playwright-core/index.mjs')).href);
const { EXE, ARGS } = await import(pathToFileURL(path.join(LIB, 'core/render/browser.mjs')).href);

const [specPath, outDir] = process.argv.slice(2), dev = (() => { const i = process.argv.indexOf('--device'); return i > 0 ? process.argv[i + 1] : 'mobile'; })();
if (!specPath || !outDir) { console.error('usage: node walk_run.mjs <steps.json> <outDir> [--device mobile|desktop]'); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8')); fs.mkdirSync(outDir, { recursive: true });
const VIEW = dev === 'desktop' ? { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false } : { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const okUrl = u => /^(https?|file):\/\//i.test(u || '');
const loc = (page, t) => /^(text=|role=|css=|xpath=|\/\/|#|\.|\[)/.test(t) || /[>#.\[\]=:]/.test(t) ? page.locator(t).first() : page.getByText(t, { exact: false }).first();

// plain words for a selector: its label, placeholder or text, so the Reel never shows CSS
async function describe(page, sel) {
  try { const d = await page.locator(sel).first().evaluate(e => (e.getAttribute('aria-label') || e.getAttribute('placeholder') || (e.labels && e.labels[0] && e.labels[0].innerText) || e.innerText || e.getAttribute('name') || '').trim().slice(0, 40));
    if (d) return `the "${d}" ${/^(INPUT|TEXTAREA|SELECT)$/.test(await page.locator(sel).first().evaluate(e => e.tagName)) ? 'field' : 'element'}`; } catch {}
  return 'the element';
}
const browser = await chromium.launch({ executablePath: EXE, args: ARGS, headless: true });
const ctx = await browser.newContext({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.deviceScaleFactor, isMobile: VIEW.isMobile, hasTouch: !!VIEW.hasTouch, locale: 'en-US' });
const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const out = { title: spec.title, sub: spec.sub || '', device: dev, view: VIEW, started: new Date().toISOString(), steps: [] };
for (const [i, st] of (spec.steps || []).entries()) {
  const t0 = Date.now(), r = { i: i + 1, say: st.say || '', action: st.action, target: st.target || st.url || st.key || '', ok: true, expected: '', actual: '', box: null, error: '' };
  try {
    let el = null;
    if (['click', 'fill', 'hover'].includes(st.action)) { el = loc(page, st.target); await el.waitFor({ state: 'visible' }); await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox(); if (b) r.box = { x: b.x, y: b.y, w: b.width, h: b.height }; r.pre = `pre-${String(i + 1).padStart(2, '0')}.png`; await page.screenshot({ path: path.join(outDir, r.pre) }).catch(() => { r.pre = null; }); }
    if (st.action === 'goto' && /^\.\.?\//.test(st.url || '')) st.url = pathToFileURL(path.resolve(path.dirname(path.resolve(specPath)), st.url)).href;   // ./page.html next to steps.json
    if (st.action === 'goto') { if (!okUrl(st.url)) throw new Error('only http(s) and file URLs are allowed'); await page.goto(st.url, { waitUntil: 'domcontentloaded' }); }
    else if (st.action === 'click') await el.click();
    else if (st.action === 'fill') { await el.fill(String(st.value ?? '')); if (st.secret) await el.evaluate(e => { e.style.filter = 'blur(7px)'; }); }
    else if (st.action === 'hover') await el.hover();
    else if (st.action === 'press') await page.keyboard.press(st.key);
    else if (st.action === 'scroll') await page.mouse.wheel(0, +st.y || 600);
    else if (st.action === 'wait') await page.waitForTimeout(Math.min(5000, +st.ms || 800));
    else throw new Error('unknown action ' + st.action);
    await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.waitForTimeout(350);
    const e = st.expect || {};
    if (e.text) { r.expected = `page shows "${e.text}"`; try { await page.getByText(e.text, { exact: false }).first().waitFor({ state: 'visible', timeout: 6000 }); r.actual = `"${e.text}" is visible`; } catch { r.ok = false; r.actual = `"${e.text}" not found`; } }
    else if (e.url) { r.expected = `URL contains "${e.url}"`; try { await page.waitForURL(u => String(u).includes(e.url), { timeout: 6000 }); } catch {} const u = page.url(); r.ok = u.includes(e.url); r.actual = 'URL is ' + u.replace(/^https?:\/\//, '').slice(0, 80); }
    else if (e.visible) { const d = await describe(page, e.visible); r.expected = `${d} is visible`; try { await page.locator(e.visible).first().waitFor({ state: 'visible', timeout: 6000 }); r.actual = `${d} is on screen`; } catch { r.ok = false; r.actual = `${d} is not visible`; } }
    else if (e.title) { r.expected = `title contains "${e.title}"`; const t = await page.title(); r.ok = t.includes(e.title); r.actual = `title is "${t.slice(0, 60)}"`; }
    else { r.expected = st.action === 'goto' ? 'page loads' : 'action completes'; r.actual = st.action === 'goto' ? `loaded ${(await page.title()).slice(0, 60) || page.url().slice(0, 60)}` : 'done without errors'; }
    if (st.action === 'fill' && st.secret) r.target = r.target + ' (hidden)';
  } catch (err) { r.ok = false; r.error = String(err.message || err).split('\n')[0].slice(0, 160); r.actual = r.actual || 'failed: ' + r.error; if (!r.expected) r.expected = 'action completes'; }
  r.ms = Date.now() - t0; r.url = page.url(); r.shot = `step-${String(i + 1).padStart(2, '0')}.png`;
  await page.screenshot({ path: path.join(outDir, r.shot) }).catch(() => {});
  out.steps.push(r); console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.i}. ${r.say || r.action}  | expected: ${r.expected} | actual: ${r.actual}`);
}
out.finished = new Date().toISOString(); out.passed = out.steps.filter(s => s.ok).length; out.total = out.steps.length;
fs.writeFileSync(path.join(outDir, 'walk.json'), JSON.stringify(out, null, 1));
await browser.close(); console.log(`WALK ${out.passed}/${out.total} verified`); process.exit(out.passed === out.total ? 0 : 3);
