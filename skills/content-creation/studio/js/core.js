// Shared helpers for every workspace: DOM, API with the session token, analysis cache, ranked gallery, hook picker, form fields, results, library cards.
export const TOKEN = window.TOKEN;
export const $ = (s, p = document) => p.querySelector(s), $$ = (s, p = document) => [...p.querySelectorAll(s)];
export const el = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) { if (x === 'class') e.className = v; else if (x === 'text') e.textContent = v; else if (x.startsWith('on')) e.addEventListener(x.slice(2), v); else if (v !== false && v !== null && v !== undefined) e.setAttribute(x, v === true ? '' : v); }
  k.flat().forEach(c => e.append(c && c.nodeType ? c : document.createTextNode(c ?? ''))); return e;
};
export const u = p => p + (p.includes('?') ? '&' : '?') + 't=' + TOKEN;
export const api = async (p, b) => { const r = await fetch(u(p), { method: b ? 'POST' : 'GET', headers: { 'X-Token': TOKEN, 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); return r.json(); };
export const clone = o => JSON.parse(JSON.stringify(o));
const PATHS = { gif: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M8 10v4M12 10v4M16 10h-2v4"/>', carousel: '<rect x="6" y="4" width="12" height="16" rx="3"/><path d="M3 8v8M21 8v8"/>', reel: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 10l3 2-3 2z"/>',
  cover: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M9 8h6M9 12h4"/>', walkthrough: '<path d="M5 3l14 8-6 1.6L10 19z"/>', post: '<path d="M4 5h16v11H9l-5 4z"/>', image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>' };
export const ic = k => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.innerHTML = PATHS[k] || ''; return s; };
export const ago = t => { const d = Date.now() / 1e3 - t; return d < 90 ? 'just now' : d < 5400 ? Math.round(d / 60) + ' min ago' : d < 129600 ? Math.round(d / 3600) + ' h ago' : new Date(t * 1e3).toLocaleDateString(); };

// —— app state shared across workspaces (the source the person analysed on Home) ——
export const S = { D: null, READY: null, source: '', analysis: null };
try { S.source = sessionStorage.getItem('es.source') || ''; S.analysis = JSON.parse(sessionStorage.getItem('es.analysis') || 'null'); } catch {}
export async function analyze(text) {
  const r = await api('/api/analyze', { text }); if (r.error) return r;
  S.source = text; S.analysis = r; try { sessionStorage.setItem('es.source', text); sessionStorage.setItem('es.analysis', JSON.stringify(r)); } catch {}
  return r;
}
export const byId = id => S.D.designs.find(d => d.id === id);

// —— page header ——
export function head(m, title, lede) { m.append(el('h1', { text: title }), el('p', { class: 'lede', text: lede })); }
export function analysisBanner(m) {
  if (!S.analysis) return m.append(el('div', { class: 'msg busy', role: 'status' }, 'Tip: paste your source on ', el('a', { href: '#/home', text: 'Home' }), ' first. Every gallery is then ranked for your content by the decision matrix.'));
  m.append(el('div', { class: 'card pad', style: 'margin:0 0 22px' }, el('div', { class: 'row' }, el('b', { text: 'Your content looks like:' }), ...S.analysis.shapes.map((s, i) => el('span', { class: 'chip ' + (i ? '' : 'clay'), text: s.label }))),
    el('p', { class: 'note', text: `${S.analysis.figures_in_source} figure(s) found in the source. ${S.analysis.figures_in_source >= 2 ? 'Data charts can use them.' : 'Data charts are off: they need numbers from the source.'}` })));
}

// —— ranked gallery: items [{id, name, tag, img, score?, why?}], single or multi select ——
export function gallery(items, { selected = [], multi = false, tall = false, onpick } = {}) {
  const w = el('div', { class: 'gallery' }), max = Math.max(1, ...items.map(i => i.score || 0));
  items.forEach((it, k) => {
    const b = el('button', { class: 'pick' + (tall ? ' tall' : ''), type: 'button', 'aria-pressed': String(selected.includes(it.id)), title: it.why || it.tag || '' },
      el('span', { class: 'sheet' }, it.score != null ? el('span', { class: 'rank' + (k < 3 ? ' top' : ''), text: '#' + (k + 1) }) : '', el('img', { src: u(it.img), alt: 'Sample of ' + it.name, loading: 'lazy' })),
      el('strong', { text: it.name }), el('small', { text: it.why || it.tag || '' }), it.score != null ? el('div', { class: 'meter' }, el('i', { style: `width:${Math.round(100 * (it.score || 0) / max)}%` })) : '');
    b.onclick = () => { if (!multi) $$('.pick', w).forEach(x => x.setAttribute('aria-pressed', String(x === b && x.getAttribute('aria-pressed') !== 'true'))); else b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); onpick && onpick(it, b.getAttribute('aria-pressed') === 'true'); };
    w.append(b);
  });
  return w;
}

// —— hook picker from the analysis (or a topic) ——
export function hookPicker(kind, onpick, text) {
  const box = el('div', { class: 'hooks' }), set = S.analysis && S.analysis.hookSets && S.analysis.hookSets[kind];
  const draw = list => { box.innerHTML = ''; if (!list || !list.length) { box.append(el('p', { class: 'note', text: 'Analyse your source on Home (or type a topic) to see the hooks that fit.' })); return; }
    list.forEach(h => { const b = el('button', { type: 'button', 'aria-pressed': 'false' }, h.text, el('small', { text: h.category + (h.score ? ' · fits your content' : '') }));
      b.onclick = () => { $$('button', box).forEach(x => x.setAttribute('aria-pressed', String(x === b))); onpick(h.text); }; box.append(b); }); };
  if (set) draw(set); else if (text) api('/api/hooks?text=' + encodeURIComponent(text.slice(0, 4000))).then(r => draw(kind === 'carousel' ? r.carousel : r.line)); else draw([]);
  box.append(el('p', { class: 'note', text: 'Patterns, not guaranteed results. Fill every [placeholder] with your real topic and numbers; never invent results.' }));
  return box;
}

// —— form fields from design specs (text, number, select, icon, toggle, list, json) ——
function counter(inp, lab, mx, mn) { const c = el('span', { class: 'cnt' }); const f = () => { const n = inp.value.length; c.textContent = n + '/' + mx; c.classList.toggle('over', n > mx || n < mn); }; inp.addEventListener('input', f); f(); lab.append(c); }
export function field(spec, obj, onchange) {
  const w = el('div', { class: 'fld' }), id = 'f' + Math.random().toString(36).slice(2, 8), ch = () => onchange && onchange();
  if (spec.type === 'text') { const inp = el(spec.area ? 'textarea' : 'input', { id, type: 'text' }); inp.value = obj[spec.key] ?? ''; inp.oninput = () => { obj[spec.key] = inp.value; ch(); }; const lab = el('label', { for: id }, spec.label); counter(inp, lab, spec.max, spec.min); w.append(lab, inp); if (spec.hint) w.append(el('div', { class: 'note', text: spec.hint })); }
  else if (spec.type === 'number') { const inp = el('input', { id, type: 'number', min: 0, max: spec.max }); inp.value = obj[spec.key] ?? 0; inp.oninput = () => { obj[spec.key] = +inp.value; ch(); }; w.append(el('label', { for: id }, spec.label), inp); }
  else if (spec.type === 'select' || spec.type === 'icon') { const s = el('select', { id }); (spec.type === 'icon' ? S.D.icons : spec.options).forEach(o => s.append(el('option', { value: o, text: o, selected: obj[spec.key] === o }))); s.onchange = () => { obj[spec.key] = s.value; ch(); }; w.append(el('label', { for: id }, spec.label), s); }
  else if (spec.type === 'toggle') { const c = el('input', { id, type: 'checkbox' }); c.checked = !!obj[spec.key]; c.onchange = () => { obj[spec.key] = c.checked; ch(); }; w.append(el('label', { for: id }, c, ' ' + spec.label)); }
  else if (spec.type === 'json') { const t = el('textarea', { id, class: 'code', spellcheck: 'false' }), msg = el('div', { class: 'note' }); t.value = JSON.stringify(obj[spec.key] ?? {}, null, 1);
    t.oninput = () => { try { obj[spec.key] = JSON.parse(t.value); msg.textContent = 'Valid. The real limits are checked when you build.'; msg.style.color = ''; } catch (e) { msg.textContent = 'Not valid JSON yet: ' + e.message; msg.style.color = 'var(--bad)'; } ch(); };
    w.append(el('label', { for: id }, spec.label), t, msg, el('div', { class: 'note', text: 'Edit the sample: keep the keys, change the words and numbers. Numbers must come from your source.' })); }
  else if (spec.type === 'list') { const box = el('div', { class: 'stack' }), add = el('button', { type: 'button', class: 'btn ghost sm', text: 'Add' });
    const draw = () => { box.innerHTML = ''; (obj[spec.key] = obj[spec.key] || []).forEach((it, i) => { const r = el('div', { class: 'card pad', style: 'padding:10px' }); spec.item.forEach(sp => r.append(field(sp, it, ch))); r.append(el('button', { type: 'button', class: 'btn ghost sm', onclick: () => { obj[spec.key].splice(i, 1); draw(); ch(); } }, 'Remove')); box.append(r); }); add.hidden = obj[spec.key].length >= spec.max; };
    add.onclick = () => { const it = {}; spec.item.forEach(sp => it[sp.key] = sp.type === 'icon' ? S.D.icons[0] : sp.type === 'select' ? sp.options[0] : sp.type === 'number' ? 50 : ''); obj[spec.key].push(it); draw(); ch(); };
    draw(); w.append(el('label', {}, spec.label), box, add, el('div', { class: 'note', text: `${spec.min} to ${spec.max} items` })); }
  return w;
}

// —— results and errors ——
export function results(box, r) {
  box.innerHTML = '';
  if (r.error) return box.append(el('div', { class: 'msg err', role: 'alert', text: r.error }));
  if (r.ok === false) { const fixes = (r.log || '').split('\n').filter(l => /FIX|OVERFLOW|OVERLAP|EMPTY|SAFE|must|required|ERROR|LAYOUT|not in the source/.test(l)).slice(0, 10);
    return box.append(el('div', { class: 'msg err', role: 'alert' }, el('strong', { text: 'Could not build this one. ' }), 'Fix the items below, then try again.', el('pre', { text: fixes.join('\n') || r.log }), el('details', {}, el('summary', { text: 'Full log' }), el('pre', { text: r.log })))); }
  box.append(el('div', { class: 'msg ok', role: 'status' }, 'Done. ', el('a', { href: '#/library', text: 'Saved in the library.' })));
  const g = el('div', { class: 'results' });
  (r.files || []).forEach(f => { const url = u(f.url), fig = el('figure');
    if (/\.(png|jpg)$/i.test(f.name)) fig.append(el('a', { href: url, target: '_blank', rel: 'noopener' }, el('img', { src: url, alt: f.name })));
    else if (/\.mp4$/i.test(f.name)) fig.append(el('video', { src: url, controls: true, preload: 'metadata', playsinline: true }));
    fig.append(el('figcaption', {}, el('a', { href: url, download: f.name }, 'Download ' + f.name))); g.append(fig); });
  box.append(g);
}
export const busy = (box, t) => { box.innerHTML = ''; box.append(el('div', { class: 'msg busy', role: 'status', text: t })); };

// —— copyable agent request ——
export async function request(box, body) {
  const r = await api('/api/request', body); box.innerHTML = '';
  if (r.error) return box.append(el('div', { class: 'msg err', role: 'alert', text: r.error }));
  const pre = el('pre', { text: r.prompt });
  box.append(el('div', { class: 'msg ok', role: 'status', text: 'Request ready. Paste it into your coding agent (Claude Code, Codex or Antigravity) in this project. It writes the story from your source and builds in the background.' }), pre,
    el('button', { class: 'btn ghost sm', type: 'button', text: 'Copy request', onclick: async e => { try { await navigator.clipboard.writeText(r.prompt); e.target.textContent = 'Copied'; } catch { const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(pre); s.removeAllRanges(); s.addRange(rg); } } }));
}

// —— library cards + preview dialog ——
export function card(i) {
  const th = el('span', { class: 'th' }); if (i.thumb) th.append(el('img', { src: u('/lib/' + i.thumb), alt: '', loading: 'lazy' })); else th.append(ic(i.kind));
  return el('button', { class: 'item', type: 'button', onclick: () => openItem(i) }, th, el('span', { class: 'bd' }, el('b', { text: i.title }), el('small', { text: i.label + ' · ' + ago(i.when) + (i.files.length > 1 ? ' · ' + i.files.length + ' files' : '') })));
}
export function openItem(i) {
  const b = $('#dlgBody'); b.innerHTML = ''; const first = i.files.find(f => /\.(png|jpg|gif|mp4)$/i.test(f.name)), pv = el('div', { class: 'pv' });
  if (first && /\.mp4$/i.test(first.name)) pv.append(el('video', { src: u('/lib/' + first.id), controls: true, preload: 'metadata' })); else if (first) pv.append(el('img', { src: u('/lib/' + first.id), alt: i.title })); else pv.append(ic(i.kind));
  const ul = el('ul', { class: 'files' }); i.files.forEach(f => ul.append(el('li', {}, el('span', { text: f.name }), el('a', { class: 'btn ghost sm', href: u('/lib/' + f.id), download: f.name, text: 'Download' }))));
  b.append(pv, el('div', {}, el('h2', { text: i.title }), el('span', { class: 'chip', text: i.label }), el('p', { class: 'muted', text: 'Made ' + ago(i.when) + '.' }), ul, el('button', { class: 'btn', type: 'button', onclick: () => $('#dlg').close(), text: 'Close' }))); $('#dlg').showModal();
}
export function recent(m, kind, title) {
  const L = el('div'); m.append(el('h2', { text: title || 'Made before', style: 'margin-top:34px' }), L);
  api('/api/library').then(r => { const l = r.items.filter(i => !kind || i.kind === kind).slice(0, 8); if (!l.length) { L.append(el('div', { class: 'empty', text: 'Nothing here yet.' })); return; } const g = el('div', { class: 'grid' }); l.forEach(i => g.append(card(i))); L.append(g); });
}
export function ready(kind) { const r = S.READY && S.READY[kind]; if (!S.READY) return el('span', { class: 'chip', text: 'Checking this computer…' }); return el('span', { class: 'chip ' + (r && r.ready ? 'ok' : 'bad'), text: r && r.ready ? 'Ready on this computer' : 'Setup needed: run studio.py doctor' }); }
