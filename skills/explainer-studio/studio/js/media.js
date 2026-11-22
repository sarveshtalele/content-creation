// One workspace per media. Galleries are ranked by the decision matrix when the person has analysed a source on Home; the person always chooses.
import { $, $$, el, api, u, S, head, analysisBanner, gallery, hookPicker, field, results, busy, request, recent, ready, byId, clone } from './core.js';

const step = (title, sub, ...kids) => el('section', { class: 'step' }, el('h2', { text: title }), sub ? el('p', { class: 'muted', style: 'margin:0 0 12px', text: sub }) : '', ...kids);
const ta = (id, ph, v = '', max = 4000) => { const t = el('textarea', { id, placeholder: ph, maxlength: max }); t.value = v; return t; };
const inp = (id, ph, v = '', max = 300) => { const t = el('input', { id, type: 'text', placeholder: ph, maxlength: max }); t.value = v; return t; };
const lab = (forId, t, x) => el('div', { class: 'fld' }, el('label', { for: forId }, t), x);
const side = (...kids) => el('aside', { class: 'stack' }, ...kids);
const box = (title, ...kids) => el('div', { class: 'card pad' }, el('h3', { text: title }), ...kids);

// —— GIF: every template, ranked for the content, the person picks ——
export function gifPage(m) {
  head(m, 'GIF', 'A looping diagram for LinkedIn (1080x1350, under 5 MB) plus the still PNG. All 15 templates are ranked for your content; pick the one you like.');
  analysisBanner(m);
  const rank = S.analysis ? Object.fromEntries(S.analysis.gif.map(g => [g.template, g])) : {};
  const items = S.D.gifStyles.map(g => ({ id: g.id, name: g.name, tag: g.best, img: '/samples/gif-' + g.id + '.jpg', score: rank[g.id] ? rank[g.id].score : (S.analysis ? 0 : null), why: rank[g.id] ? rank[g.id].why : g.tag }));
  if (S.analysis) items.sort((a, b) => b.score - a.score);
  let design = '', hook = '';
  const topic = inp('gt', 'What is the GIF about?'), src = ta('gs', 'A link, or the text to explain', S.source.slice(0, 4000)), notes = ta('gn', 'Audience, tone, what to avoid', '', 1000), out = el('div');
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Prepare the request' }); go.onclick = () => request(out, { kind: 'gif', topic: topic.value, source: src.value, notes: notes.value, hook, design });
  m.append(el('div', { class: 'two' }, el('div', { class: 'steps' },
    step('Choose the template', S.analysis ? 'Ranked for your content: the number and bar show the fit, hover for the reason.' : 'Analyse a source on Home to rank these for your content.', gallery(items, { onpick: (it, on) => design = on ? it.id : '' })),
    step('Choose the opening line', 'The GIF title works best as a question or a curiosity line.', hookPicker('line', t => hook = t, topic.value)),
    step('Describe it', '', lab('gt', 'Topic', topic), lab('gs', 'Source', src), lab('gn', 'Notes (optional)', notes), go, out)),
    side(box('This computer', el('div', { style: 'margin-top:8px' }, ready('gif'))), box('How it works', el('p', { class: 'note', text: 'Your coding agent writes the diagram from the source using the template you picked, checks every word against the source, renders the GIF in the background and saves it to the library.' })))));
  recent(m, 'gif', 'GIFs made before');
}

// —— Carousel (or one infographic image) ——
const TYPE2DESIGN = t => ({ cone: 'info-cone', ring: 'info-cone', tower: 'info-cone', funnel: 'info-cone', stat: 'info-stat', bars: 'info-bars', stack: 'info-stack', loop: 'info-loop', compare: 'info-compare', grid: 'info-grid' }[t] || 'chart-' + t);
export function carouselPage(m) {
  head(m, 'Carousel', 'A cover, up to five chart slides and a closing slide, in the Claude light theme with your brand CTA on every slide. You get the PDF and every slide as a PNG.');
  analysisBanner(m);
  const st = { mode: 'carousel', cover: 'cover-bold', slides: [], vals: {}, closing: { title: 'What will you try first?', lines: [] }, theme: 'paper' };
  const seed = id => { if (!st.vals[id]) st.vals[id] = clone(byId(id).sample); };
  const covers = S.D.designs.filter(d => d.group === 'cover').map(d => ({ id: d.id, name: d.name, tag: d.tag, img: '/samples/' + d.id + '.jpg' }));
  const all = S.D.designs.filter(d => d.group === 'infographic' || d.group === 'chart'), order = S.analysis ? S.analysis.carousel.map(c => TYPE2DESIGN(c.type)).filter(id => byId(id)) : [];
  const slides = [...order.map(id => byId(id)), ...all.filter(d => !order.includes(d.id))].map((d, k) => ({ id: d.id, name: d.name, tag: (d.family ? d.family + ' · ' : '') + d.best_for, img: '/samples/' + d.id + '.jpg', score: S.analysis ? (k < order.length ? order.length - k : 0) : null, why: k < order.length ? 'Fits ' + S.analysis.carousel[k].for.toLowerCase() : (d.family ? d.family + ' · ' : '') + d.best_for }));
  seed(st.cover);
  const deck = el('div', { class: 'deck' }), forms = el('div', { class: 'stack' }), out = el('div');
  const mode = el('div', { class: 'tabs', role: 'tablist' }); [['carousel', 'Carousel (PDF + images)'], ['single', 'One infographic image']].forEach(([k, n]) => mode.append(el('button', { role: 'tab', type: 'button', 'aria-selected': String(k === st.mode), text: n, onclick: e => { st.mode = k; $$('button', mode).forEach(b => b.setAttribute('aria-selected', String(b === e.target))); if (k === 'single') st.slides = st.slides.slice(0, 1); draw(); } })));
  function draw() {
    deck.innerHTML = ''; forms.innerHTML = ''; const ids = st.mode === 'carousel' ? [st.cover, ...st.slides] : st.slides.slice(0, 1);
    ids.forEach(id => { const d = byId(id); deck.append(el('div', { class: 'deckrow' }, el('img', { src: u('/samples/' + id + '.jpg'), alt: '' }), el('span', { text: d.group === 'cover' ? 'Cover: ' + d.name : 'Slide: ' + d.name }), d.group === 'cover' ? '' : el('button', { type: 'button', text: 'Remove', onclick: () => { st.slides = st.slides.filter(x => x !== id); draw(); } }))); });
    if (st.mode === 'carousel') deck.append(el('div', { class: 'deckrow' }, el('span', { text: 'Closing slide with your follow card (added automatically)' })));
    ids.forEach(id => { const d = byId(id), b = box(d.name, el('p', { class: 'note', text: d.tag })); d.fields.forEach(sp => b.append(field(sp, st.vals[id]))); if (d.group === 'cover') b.append(el('h3', { text: 'Hook ideas', style: 'margin-top:8px' }), hookPicker('carousel', t => { st.vals[id].hook = t.slice(0, 60); draw(); }));
      b.append(el('button', { type: 'button', class: 'btn ghost sm', text: 'Reset to the sample', onclick: () => { st.vals[id] = clone(d.sample); draw(); } })); forms.append(b); });
    if (st.mode === 'carousel') { const b = box('Closing slide'); b.append(field({ key: 'title', type: 'text', label: 'Question or call to action', min: 6, max: 60 }, st.closing));
      [0, 1, 2].forEach(i => { const x = inp('cl' + i, 'Optional line ' + (i + 1), st.closing.lines[i] || '', 38); x.oninput = () => st.closing.lines[i] = x.value; b.append(x); }); forms.append(b); }
  }
  const theme = el('select', { id: 'th', style: 'max-width:280px', onchange: e => st.theme = e.target.value }); S.D.themes.forEach(([v, t]) => theme.append(el('option', { value: v, text: t, selected: v === st.theme })));
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Build' });
  go.onclick = async () => { if (!st.slides.length) { out.innerHTML = ''; out.append(el('div', { class: 'msg err', role: 'alert', text: 'Choose at least one slide.' })); return; }
    go.disabled = true; busy(out, 'Building with the real engine, about a minute.'); const ids = st.mode === 'carousel' ? [st.cover, ...st.slides] : st.slides.slice(0, 1);
    const r = await api('/api/generate', { mode: st.mode, format: st.mode === 'carousel' ? 'both' : 'images', theme: st.theme, items: ids.map(id => ({ design: id, values: st.vals[id] })), closing: st.mode === 'carousel' ? { title: st.closing.title, lines: st.closing.lines.filter(Boolean) } : null });
    go.disabled = false; results(out, r); };
  m.append(mode, el('div', { class: 'steps' },
    step('Choose the cover', 'Only for the carousel. The hook goes on it.', gallery(covers, { selected: [st.cover], onpick: (it, on) => { if (on) { st.cover = it.id; seed(it.id); draw(); } } })),
    step('Choose the slides (up to 5)', S.analysis ? 'Ranked for your content. Every slide should use a different chart family.' : 'Pick the charts that suit your content, in order.', gallery(slides, { multi: true, onpick: (it, on) => { if (on) { if (st.mode === 'single') st.slides = [it.id]; else if (st.slides.length < 5 && !st.slides.includes(it.id)) st.slides.push(it.id); seed(it.id); } else st.slides = st.slides.filter(x => x !== it.id); draw(); } })),
    step('Write the content', 'Each design starts from its sample. Replace the words and numbers with your own; data charts only accept numbers from your source.', deck, forms),
    step('Build', '', lab('th', 'Colour theme', theme), go, out)));
  draw(); recent(m, 'carousel', 'Carousels made before');
}

// —— Reel: hook + visual hook + format + look, then the agent writes and renders (cover built automatically) ——
export function reelPage(m) {
  head(m, 'Reel', 'A narrated 1080x1920 Reel in the Claude light theme: kinetic hook, camera moves, animated counters and connectors, your brand CTA on every frame and a designed cover.');
  analysisBanner(m);
  let hook = '', visual = S.analysis ? S.analysis.reel.visual_hook : '', format = '';
  const look = el('select', { id: 'lk', style: 'max-width:280px' }, el('option', { value: 'light', text: 'Claude light (default)' }), el('option', { value: 'cinematic', text: 'Cinematic dark' }));
  const topic = inp('rt', 'What is the Reel about?'), src = ta('rs', 'A link, or the text to explain', S.source.slice(0, 4000)), notes = ta('rn', 'Audience, tone, length, what to avoid', '', 1000), out = el('div');
  const motion = S.analysis ? el('div', { class: 'shapes' }, S.analysis.reel.motion.map(x => el('span', { class: 'chip blue', text: x }))) : el('p', { class: 'note', text: 'Analyse a source on Home to see the motion picked for it.' });
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Prepare the request' });
  go.onclick = () => request(out, { kind: 'reel', topic: topic.value, source: src.value, notes: notes.value, hook, extra: [visual && 'Open with the visual hook: ' + visual, format && 'Reel format: ' + format, 'Look: ' + look.value].filter(Boolean).join('. ') });
  m.append(el('div', { class: 'two' }, el('div', { class: 'steps' },
    step('Spoken and on-screen hook', 'First three seconds. Pick the line that fits; your agent fills it with the real topic.', hookPicker('line', t => hook = t, topic.value)),
    step('Opening visual', 'What the viewer sees while the hook plays.', hookPicker('visual', t => visual = t.split(':')[0])),
    step('Reel format', '', hookPicker('format', t => format = t.split(':')[0])),
    step('Motion and look', 'Motion chosen by the decision matrix for this content:', motion, lab('lk', 'Look', look)),
    step('Describe it', '', lab('rt', 'Topic', topic), lab('rs', 'Source', src), lab('rn', 'Notes (optional)', notes), go, out)),
    side(box('This computer', el('div', { style: 'margin-top:8px' }, ready('reel'))), box('Cover', el('p', { class: 'note', text: 'Every Reel build also renders the designed cover in every layout the story supports. Design one now on the Reel cover page.' }), el('a', { class: 'btn ghost sm', href: '#/cover', text: 'Design a cover' })),
      box('Real product demo?', el('p', { class: 'note', text: 'For a step-by-step guide of a real website or app, use a walkthrough video: every step runs in a browser and is verified.' }), el('a', { class: 'btn ghost sm', href: '#/walkthrough', text: 'Make a walkthrough' })))));
  recent(m, 'reel', 'Reels made before');
}

// —— Reel cover ——
export function coverPage(m) {
  head(m, 'Reel cover', 'A designed 1080x1920 cover, not a frame from the video. You get every layout your content supports; text stays inside the grid crop and away from the Reels buttons.');
  const v = { hook: '', sub: '', chips: '', steps: '', flow_title: '', layout: '' }, out = el('div');
  const hook = inp('ch', 'The hook, 10-64 characters', '', 64), sub = inp('cs', 'One line under it (optional)', '', 90), chips = inp('cc', 'Up to 4 short tags, comma separated (optional)', '', 80), ft = inp('cf', 'Title of the mini diagram, e.g. How it works', '', 40), steps = ta('cp', 'Mini diagram steps, one per line (2-4, optional)', '', 200);
  const layouts = ['hero', 'question', 'number', 'split', 'face'].map(l => ({ id: l, name: l[0].toUpperCase() + l.slice(1), tag: { hero: 'Hook + mini diagram', question: 'Giant hook, underline, tags', number: 'Big figure in a ring (needs a number in the hook)', split: 'Two panels joined by an arrow', face: 'Your photo with the hook' }[l], img: '/samples/reelcover-' + l + '.jpg' }));
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Render the covers' });
  go.onclick = async () => { go.disabled = true; busy(out, 'Rendering every layout, about 20 seconds.');
    const r = await api('/api/cover', { hook: hook.value, sub: sub.value, chips: chips.value.split(',').map(x => x.trim()).filter(Boolean), flow_title: ft.value, steps: steps.value.split('\n').map(x => x.trim()).filter(Boolean), layout: v.layout }); go.disabled = false; results(out, r); };
  m.append(el('div', { class: 'two' }, el('div', { class: 'steps' },
    step('Write the hook', '6 words or fewer reads best on a cover.', lab('ch', 'Hook', hook), hookPicker('line', t => { hook.value = t.slice(0, 64); }, S.source), lab('cs', 'Line under it', sub), lab('cc', 'Tags', chips)),
    step('Mini diagram (optional)', 'Used by the hero layout; the split layout needs two lists in a full Reel story.', lab('cf', 'Diagram title', ft), lab('cp', 'Steps', steps)),
    step('Preferred layout', 'All supported layouts are rendered; this one becomes the poster.', gallery(layouts, { tall: true, onpick: (it, on) => v.layout = on ? it.id : '' })),
    step('Render', '', go, out)), side(box('Safe zones', el('p', { class: 'note', text: 'Text stays between y 300 and 1560: inside the 4:5 and 3:4 profile-grid crops and clear of the caption and buttons at the bottom of a Reel.' })))));
}

// —— Walkthrough video: Playwright runs the guide, verifies each step, renders the Reel ——
const ACTIONS = [['goto', 'Open page'], ['click', 'Click / tap'], ['fill', 'Type text'], ['press', 'Press key'], ['hover', 'Hover'], ['scroll', 'Scroll'], ['wait', 'Wait']];
const EXPECTS = [['', 'No check'], ['text', 'Page shows text'], ['url', 'URL contains'], ['visible', 'Element visible'], ['title', 'Title contains']];
export function walkPage(m) {
  head(m, 'Walkthrough video', 'A real step-by-step guide: each step runs in a browser with Playwright, is checked (expected vs actual) and becomes a Claude-light Reel with a cursor, a highlight on what to tap and a Verified badge. Failed steps are shown as failed, never hidden.');
  const W = { title: 'Open the IANA page from example.com', sub: 'A two-step guide, checked in a real browser', device: 'mobile', steps: [
    { say: 'Open example.com', action: 'goto', url: 'https://example.com', ek: 'text', ev: 'Example Domain' },
    { say: 'Tap the More information link', action: 'click', target: 'More information', ek: 'url', ev: 'iana' }] };
  const list = el('div', { class: 'wsteps' }), out = el('div'), json = el('textarea', { class: 'code', readonly: true, 'aria-label': 'steps.json' });
  const spec = () => ({ title: W.title, sub: W.sub, steps: W.steps.map(s => { const o = { say: s.say, action: s.action };
    if (s.action === 'goto') o.url = s.url; else if (['click', 'fill', 'hover'].includes(s.action)) o.target = s.target; if (s.action === 'fill') { o.value = s.value || ''; if (s.secret) o.secret = true; } if (s.action === 'press') o.key = s.key || 'Enter'; if (s.action === 'wait') o.ms = +s.ms || 800; if (s.action === 'scroll') o.y = +s.y || 600;
    if (s.ek && s.ev) o.expect = { [s.ek]: s.ev }; return o; }) });
  const sync = () => json.value = JSON.stringify(spec(), null, 1);
  function draw() {
    list.innerHTML = '';
    W.steps.forEach((s, i) => {
      const act = el('select', { 'aria-label': 'Action ' + (i + 1) }); ACTIONS.forEach(([v, t]) => act.append(el('option', { value: v, text: t, selected: s.action === v }))); act.onchange = () => { s.action = act.value; draw(); };
      const say = inp('', 'What the viewer should do', s.say, 80); say.setAttribute('aria-label', 'Step ' + (i + 1) + ' text'); say.oninput = () => { s.say = say.value; sync(); };
      const tgtKey = s.action === 'goto' ? 'url' : s.action === 'press' ? 'key' : s.action === 'wait' ? 'ms' : s.action === 'scroll' ? 'y' : 'target';
      const tgt = inp('', { url: 'https://…', key: 'Enter', ms: '800', y: '600', target: 'Button text or CSS selector' }[tgtKey], s[tgtKey] || '', 300); tgt.setAttribute('aria-label', 'Target ' + (i + 1)); tgt.oninput = () => { s[tgtKey] = tgt.value; sync(); };
      const ek = el('select', { 'aria-label': 'Check ' + (i + 1) }); EXPECTS.forEach(([v, t]) => ek.append(el('option', { value: v, text: t, selected: (s.ek || '') === v }))); ek.onchange = () => { s.ek = ek.value; sync(); };
      const ev = inp('', s.action === 'fill' ? 'Text to type' : 'Expected value', s.action === 'fill' ? s.value || '' : s.ev || '', 200); ev.setAttribute('aria-label', 'Value ' + (i + 1)); ev.oninput = () => { if (s.action === 'fill') s.value = ev.value; else s.ev = ev.value; sync(); };
      const rm = el('button', { type: 'button', 'aria-label': 'Remove step ' + (i + 1), text: 'Remove', onclick: () => { W.steps.splice(i, 1); draw(); } });
      list.append(el('div', { class: 'wstep' }, el('b', { text: String(i + 1) }), act, say, tgt, s.action === 'fill' ? el('label', { class: 'row', style: 'gap:6px;font-size:13px' }, (() => { const c = el('input', { type: 'checkbox', 'aria-label': 'Hide typed text' }); c.checked = !!s.secret; c.onchange = () => { s.secret = c.checked; sync(); }; return c; })(), 'Hide in video') : ek, s.action === 'fill' ? ev : ev, rm));
    });
    sync();
  }
  const title = inp('wt', 'Guide title', W.title, 80), sub = inp('ws', 'One line under the title', W.sub, 90); title.oninput = () => { W.title = title.value; sync(); }; sub.oninput = () => { W.sub = sub.value; sync(); };
  const dev = el('select', { id: 'wd', style: 'max-width:240px', onchange: e => W.device = e.target.value }, el('option', { value: 'mobile', text: 'Phone (390x844)' }), el('option', { value: 'desktop', text: 'Desktop (1280x800)' }));
  const add = el('button', { class: 'btn ghost sm', type: 'button', text: 'Add step', onclick: () => { if (W.steps.length < 12) { W.steps.push({ say: '', action: 'click', target: '' }); draw(); } } });
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Run, verify and render' });
  go.onclick = async () => { go.disabled = true; busy(out, 'Starting the browser…'); const r = await api('/api/walk', { spec: spec(), device: W.device }); if (r.error) { go.disabled = false; results(out, r); return; }
    const poll = async () => { const j = await api('/api/job?id=' + r.job); if (j.state === 'running') { busy(out, 'Running the steps in a real browser, then rendering the Reel…'); out.append(el('pre', { text: j.log.split('\n').filter(l => /PASS|FAIL|WALK|walk\]/.test(l)).join('\n') || 'starting…' })); setTimeout(poll, 2000); return; }
      go.disabled = false; results(out, { ok: j.state !== 'error', log: j.log, files: j.files }); if (j.state === 'failed-steps') out.prepend(el('div', { class: 'msg err', role: 'alert', text: 'Some steps failed. The video shows them as failed; fix the steps (or the page) and run again.' })); };
    poll(); };
  m.append(el('div', { class: 'two' }, el('div', { class: 'steps' },
    step('Name the guide', '', lab('wt', 'Title', title), lab('ws', 'Subtitle', sub), lab('wd', 'Device', dev)),
    step('Write the steps', 'Open a page, then click, type and check. A check makes the step Verified only when the page really shows the result.', list, add),
    step('Run it', 'The browser runs on this computer. Use pages you are allowed to automate; never type real passwords: use test accounts and "Hide in video".', go, out)),
    side(box('For your agent', el('p', { class: 'note', text: 'The same guide as steps.json. Your agent can run it with: studio.py walkthrough DIR --steps steps.json' }), json))));
  draw(); recent(m, 'walkthrough', 'Walkthroughs made before');
}

// —— Post ——
export function postPage(m) {
  head(m, 'Post', 'Post text with a hook, short points and your exact closing CTA, plus an optional image in the Claude light theme.');
  analysisBanner(m);
  let design = '', hook = '';
  const imgs = S.D.designs.filter(d => d.group !== 'cover').map(d => ({ id: d.id, name: d.name, tag: d.tag, img: '/samples/' + d.id + '.jpg' }));
  const topic = inp('pt', 'What is the post about?'), src = ta('ps', 'A link, or the text', S.source.slice(0, 4000)), notes = ta('pn', 'Audience, tone, what to avoid', '', 1000), out = el('div');
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Prepare the request' }); go.onclick = () => request(out, { kind: 'post', topic: topic.value, source: src.value, notes: notes.value, hook, design });
  m.append(el('div', { class: 'steps' }, step('Choose the hook', '', hookPicker('line', t => hook = t, topic.value)), step('Image (optional)', '', gallery(imgs, { onpick: (it, on) => design = on ? it.id : '' })),
    step('Describe it', '', lab('pt', 'Topic', topic), lab('ps', 'Source', src), lab('pn', 'Notes (optional)', notes), go, out)));
  recent(m, 'post', 'Posts made before');
}
