// Gallery (the app's home): every design across every media, filterable, with motion previews on hover. Opening a design shows a side panel:
// its ID, what it is for, and what you can do with it (prepare a request for your agent, or edit and render it right here).
import { $, $$, el, api, u, S, analyze, field, results, busy, request, byId, clone } from './core.js';

const MEDIA = [['all', 'All'], ['gif', 'GIF'], ['carousel', 'Carousel'], ['reel', 'Reel'], ['thumbnail', 'Thumbnails'], ['walkthrough', 'Walkthrough']];
const TYPE2DESIGN = t => ({ cone: 'info-cone', ring: 'info-cone', tower: 'info-cone', funnel: 'info-cone', stat: 'info-stat', bars: 'info-bars', stack: 'info-stack', loop: 'info-loop', compare: 'info-compare', grid: 'info-grid', arch: 'arch-cloud' }[t] || 'chart-' + t);
const G = { items: [], media: 'all', cat: '', q: '', ranked: true };
try { Object.assign(G, JSON.parse(sessionStorage.getItem('es.gallery') || '{}')); } catch {}
const save = () => { try { sessionStorage.setItem('es.gallery', JSON.stringify({ media: G.media, cat: G.cat, q: G.q, ranked: G.ranked })); } catch {} };

function rankOf(it) {   // position in the decision matrix's ranking for the analysed source (lower is better), or null
  const A = S.analysis; if (!A) return null;
  if (it.media === 'gif') { const i = A.gif.findIndex(g => g.template === it.id); return i < 0 ? null : i; }
  if (it.media === 'carousel') { const ids = A.carousel.map(c => TYPE2DESIGN(c.type)); const i = ids.indexOf(it.id); if (i >= 0) return i; if (it.id.startsWith('arch-') && ids.includes('arch-cloud')) return ids.indexOf('arch-cloud') + .5; return null; }
  return null;
}
function whyOf(it) { const A = S.analysis; if (!A) return ''; if (it.media === 'gif') { const g = A.gif.find(x => x.template === it.id); return g ? g.why : ''; } const c = A.carousel.find(x => TYPE2DESIGN(x.type) === it.id); return c ? 'Fits ' + c.for.toLowerCase() : ''; }

export async function galleryPage(m) {
  if (!G.items.length) G.items = (await api('/api/gallery')).items;
  m.append(el('h1', { text: 'Gallery' }), el('p', { class: 'lede', text: 'Every design explainer-studio can make, in every media. Hover a card to see it move; open it for its ID, what it is for, and to render it here or prepare a request for your agent. Paste your source to rank the gallery for your content.' }));
  // —— analyse (optional) ——
  const ta = el('textarea', { id: 'src', placeholder: 'Optional: paste your source to rank the designs for it…', style: 'min-height:84px' }); ta.value = S.source;
  ta.addEventListener('input', () => { S.source = ta.value; try { sessionStorage.setItem('es.source', ta.value); } catch {} });
  const go = el('button', { class: 'btn pri', type: 'button', text: S.analysis ? 'Re-rank for this text' : 'Rank for my content' }), msg = el('div');
  const shapes = el('div', { class: 'shapes', style: 'margin-top:10px' });
  const showShapes = () => { shapes.innerHTML = ''; if (S.analysis) S.analysis.shapes.forEach((s, i) => shapes.append(el('span', { class: 'chip ' + (i ? 'blue' : 'clay'), title: s.signals.join(', '), text: s.label }))); };
  go.onclick = async () => { go.disabled = true; go.textContent = 'Ranking…'; const R = await analyze(ta.value); go.disabled = false; go.textContent = 'Re-rank for this text'; msg.innerHTML = ''; if (R.error) msg.append(el('div', { class: 'msg err', role: 'alert', text: R.error })); showShapes(); G.ranked = true; draw(); };
  m.append(el('details', { class: 'card pad', style: 'margin-bottom:20px', open: !S.analysis || undefined }, el('summary', { style: 'cursor:pointer;font-weight:700' }, S.analysis ? 'Ranked for your content' : 'Rank the gallery for your content'), el('div', { style: 'margin-top:12px' }, ta, el('div', { class: 'row', style: 'margin-top:10px' }, go), msg, shapes)));
  showShapes();
  // —— filters ——
  const tabs = el('div', { class: 'tabs', role: 'tablist', style: 'margin-bottom:12px' });
  MEDIA.forEach(([k, n]) => tabs.append(el('button', { type: 'button', role: 'tab', 'aria-selected': String(G.media === k), 'data-m': k, text: n + ' (' + (k === 'all' ? G.items.length : G.items.filter(i => i.media === k).length) + ')', onclick: () => { G.media = k; G.cat = ''; $$('button', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.m === k))); fillCats(); draw(); } })));
  const cats = el('select', { id: 'gcat', 'aria-label': 'Category', style: 'max-width:280px', onchange: e => { G.cat = e.target.value; draw(); } });
  const fillCats = () => { cats.innerHTML = ''; cats.append(el('option', { value: '', text: 'All categories' })); [...new Set(G.items.filter(i => G.media === 'all' || i.media === G.media).map(i => i.category))].sort().forEach(c => cats.append(el('option', { value: c, text: c, selected: c === G.cat }))); };
  const q = el('input', { type: 'text', id: 'gq', placeholder: 'Search designs', 'aria-label': 'Search designs', style: 'max-width:240px', value: G.q, oninput: e => { G.q = e.target.value.toLowerCase(); draw(); } });
  const rk = el('label', { class: 'row', style: 'gap:8px;font-weight:600' }, (() => { const c = el('input', { type: 'checkbox', id: 'grk' }); c.checked = G.ranked; c.onchange = () => { G.ranked = c.checked; draw(); }; return c; })(), 'Best fit first');
  m.append(tabs, el('div', { class: 'row', style: 'margin-bottom:18px' }, cats, q, rk));
  const grid = el('div', { class: 'ggrid' }), count = el('p', { class: 'note', style: 'margin:0 0 10px' }); m.append(count, grid);
  function draw() {
    save(); grid.innerHTML = '';
    let L = G.items.filter(i => (G.media === 'all' || i.media === G.media) && (!G.cat || i.category === G.cat) && (!G.q || (i.name + ' ' + i.tag + ' ' + i.id + ' ' + i.category).toLowerCase().includes(G.q)));
    if (G.ranked && S.analysis) L = L.map((it, k) => ({ it, r: rankOf(it), k })).sort((a, b) => (a.r ?? 999) - (b.r ?? 999) || a.k - b.k).map(x => x.it);
    count.textContent = `${L.length} design${L.length === 1 ? '' : 's'}` + (G.ranked && S.analysis ? ' · best fit for your content first' : '');
    if (!L.length) { grid.append(el('div', { class: 'empty', text: 'No designs match.' })); return; }
    L.forEach(it => grid.append(gcard(it)));
  }
  fillCats(); draw();
}

function gcard(it) {
  const r = rankOf(it), sheet = el('span', { class: 'gsheet', style: `aspect-ratio:${it.aspect}` }, el('img', { src: u('/samples/' + it.img), alt: 'Sample of ' + it.name, loading: 'lazy' }));
  if (it.motion) sheet.append(el('span', { class: 'gplay', 'aria-hidden': 'true', text: '▶ moves' }));
  if (r != null && r < 3 && G.ranked) sheet.append(el('span', { class: 'rank top', text: 'Best fit #' + (Math.floor(r) + 1) }));
  const b = el('button', { class: 'gcard' + (it.aspect === '16/9' ? ' wide' : ''), type: 'button', 'data-id': it.id, onclick: () => panel(it) }, sheet,
    el('strong', { text: it.name }), el('small', { text: it.tag }), el('span', { class: 'gmeta' }, el('code', { text: it.id }), el('span', { class: 'chip', text: it.category })));
  if (it.motion) {   // hover (or keyboard focus) plays the real motion; leaving stops it
    const on = () => { if ($('video', sheet)) return; const v = el('video', { src: u('/samples/' + it.motion), muted: true, loop: true, playsinline: true, autoplay: true, preload: 'auto', 'aria-hidden': 'true' }); v.muted = true; sheet.append(v); v.play().catch(() => {}); };
    const off = () => { const v = $('video', sheet); if (v) v.remove(); };
    b.addEventListener('mouseenter', on); b.addEventListener('focus', on); b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
  }
  return b;
}

// —— side panel ——
function panel(it) {
  let p = $('#gpanel'); if (!p) { p = el('aside', { id: 'gpanel', class: 'gpanel', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Design details' }); document.body.append(p); }
  p.innerHTML = ''; p.classList.add('open');
  const close = el('button', { class: 'btn ghost sm', type: 'button', text: 'Close', onclick: () => p.classList.remove('open') });
  const pv = el('div', { class: 'gpv', style: `aspect-ratio:${it.aspect}` }, it.motion ? el('video', { src: u('/samples/' + it.motion), muted: true, loop: true, autoplay: true, playsinline: true, poster: u('/samples/' + it.img) }) : el('img', { src: u('/samples/' + it.img), alt: it.name }));
  const idrow = el('div', { class: 'row' }, el('code', { class: 'gid', text: it.id }), el('button', { class: 'btn ghost sm', type: 'button', text: 'Copy ID', onclick: async e => { try { await navigator.clipboard.writeText(it.id); e.target.textContent = 'Copied'; } catch {} } }));
  const why = whyOf(it), out = el('div');
  p.append(el('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:10px' }, el('span', { class: 'chip clay', text: it.media.toUpperCase() + ' · ' + it.category }), close), pv,
    el('h2', { text: it.name, style: 'margin-top:14px' }), el('p', { class: 'muted', text: it.tag }), el('p', { class: 'note', text: 'Best for: ' + it.best }), why ? el('p', { class: 'note', style: 'color:var(--clayD)', text: 'For your content: ' + why }) : '', idrow);
  const body = el('div', { style: 'margin-top:16px' }); p.append(body, out);
  if (it.action === 'request') {
    const kind = it.media === 'gif' ? 'gif' : it.id === 'thumb-banner' ? 'banner' : 'reel', topic = el('input', { type: 'text', id: 'gp-t', placeholder: 'What is it about?' }), src = el('textarea', { id: 'gp-s', placeholder: 'A link, or the text to explain' }); src.value = S.source.slice(0, 4000);
    const go = el('button', { class: 'btn pri', type: 'button', text: 'Prepare the request for my agent', onclick: () => request(out, { kind, topic: topic.value, source: src.value, design: kind === 'gif' ? it.id : '', extra: kind === 'reel' ? 'Look: light' : '' }) });
    body.append(el('h3', { text: 'Make it with your agent' }), el('p', { class: 'note', text: 'Your agent writes it from your source with this design, asks before building, and saves it to the library.' }), el('div', { class: 'fld' }, el('label', { for: 'gp-t' }, 'Topic'), topic), el('div', { class: 'fld' }, el('label', { for: 'gp-s' }, 'Source'), src), go);
  } else if (it.action === 'render') {
    const d = byId(it.id), vals = clone(d.sample), form = el('div');
    d.fields.forEach(sp => form.append(field(sp, vals)));
    const go = el('button', { class: 'btn pri', type: 'button', text: 'Render this design', onclick: async () => { go.disabled = true; busy(out, 'Rendering with the real engine…'); const r = await api('/api/generate', { mode: 'single', format: 'images', theme: 'paper', items: [{ design: it.id, values: vals }] }); go.disabled = false; results(out, r); } });
    body.append(el('h3', { text: 'Edit and render here' }), el('p', { class: 'note', text: 'Starts from the sample: replace the words and numbers with your own (numbers must be in your source).' }), form, el('div', { class: 'row' }, go, el('a', { class: 'btn ghost', href: '#/carousel', text: 'Use in a carousel', onclick: () => { S.pending = it.id; p.classList.remove('open'); } })));
  } else if (it.action === 'cover' || it.action === 'thumb') {
    const hook = el('input', { type: 'text', id: 'gp-h', maxlength: it.action === 'thumb' ? 40 : 64, placeholder: it.action === 'thumb' ? '3 to 6 words' : 'The hook' }), sub = el('input', { type: 'text', id: 'gp-u', maxlength: 90, placeholder: 'One line under it (optional)' }), chips = el('input', { type: 'text', id: 'gp-c', placeholder: 'Tags, comma separated (optional)' }), steps = el('textarea', { id: 'gp-p', placeholder: 'Mini diagram steps, one per line (optional)', style: 'min-height:80px' });
    const go = el('button', { class: 'btn pri', type: 'button', text: it.action === 'thumb' ? 'Render at every size' : 'Render the cover', onclick: async () => {
      go.disabled = true; busy(out, 'Rendering…'); const b = { hook: hook.value, text: hook.value, sub: sub.value, chips: chips.value.split(',').map(x => x.trim()).filter(Boolean), steps: steps.value.split('\n').map(x => x.trim()).filter(Boolean) };
      const r = it.action === 'thumb' ? await api('/api/thumbs', { ...b, layouts: [it.layout] }) : await api('/api/cover', { ...b, layout: it.layout }); go.disabled = false; results(out, r); } });
    body.append(el('h3', { text: 'Render it here' }), el('div', { class: 'fld' }, el('label', { for: 'gp-h' }, it.action === 'thumb' ? 'Thumbnail text' : 'Hook'), hook), el('div', { class: 'fld' }, el('label', { for: 'gp-u' }, 'Line under it'), sub), el('div', { class: 'fld' }, el('label', { for: 'gp-c' }, 'Tags'), chips), el('div', { class: 'fld' }, el('label', { for: 'gp-p' }, 'Steps'), steps), go,
      el('p', { class: 'note', text: it.action === 'thumb' ? 'Sizes: YouTube 1280x720, Open Graph 1200x630, LinkedIn newsletter 1920x1080, dev.to 1000x420, Hashnode 1600x840. Each carries your photo, name and tagline.' : 'Other layouts your words support are rendered too.' }));
  } else if (it.action === 'walk') {
    body.append(el('h3', { text: 'Build a walkthrough' }), el('p', { class: 'note', text: 'Write the steps, run them in a real browser, and get the verified video and report.' }), el('a', { class: 'btn pri', href: '#/walkthrough', text: 'Open the walkthrough builder', onclick: () => p.classList.remove('open') }));
  }
  p.focus?.(); $('button', p)?.focus();
}
