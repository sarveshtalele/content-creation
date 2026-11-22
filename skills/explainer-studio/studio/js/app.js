// Router + Home + Library. Each media has its own workspace in media.js.
import { $, $$, el, api, u, ic, S, analyze, head, card, ready } from './core.js';
import { gifPage, carouselPage, reelPage, coverPage, walkPage, postPage } from './media.js';

const PAGES = { home, library, gif: gifPage, carousel: carouselPage, reel: reelPage, cover: coverPage, walkthrough: walkPage, post: postPage };
const TITLES = { home: 'Home', library: 'Library', gif: 'GIF', carousel: 'Carousel', reel: 'Reel', cover: 'Reel cover', walkthrough: 'Walkthrough video', post: 'Post' };

async function boot() {
  S.D = await api('/api/designs'); $('#who').textContent = S.D.brand.name; $('#catLink').href = u('/catalog');
  addEventListener('hashchange', route); route();
  api('/api/ready').then(r => { S.READY = r; const h = (location.hash || '#/home').slice(2); if (['home', 'gif', 'reel', 'carousel'].includes(h)) route(); });
}
function route() {
  const h = ((location.hash || '#/home').slice(2) || 'home').split('?')[0], page = PAGES[h] ? h : 'home';
  $$('.rail a').forEach(a => a.toggleAttribute('aria-current', false) || (a.dataset.r === page && a.setAttribute('aria-current', 'page')));
  const m = $('#view'); m.innerHTML = ''; scrollTo(0, 0); PAGES[page](m); document.title = TITLES[page] + ' · Explainer Studio'; m.focus({ preventScroll: true });
}

const MEDIA = [['gif', 'GIF', 'A looping diagram for LinkedIn, chosen from 16 templates ranked for your content.'], ['carousel', 'Carousel', 'Cover, up to five chart slides and a closing slide, as PDF and images.'],
  ['reel', 'Reel', 'A narrated vertical video in the Claude light theme, with motion picked for your content.'], ['cover', 'Reel cover', 'A designed 1080x1920 cover in five layouts, safe for the grid crop.'],
  ['walkthrough', 'Walkthrough video', 'A real step-by-step guide run in a browser, every step verified, as a Reel.'], ['post', 'Post', 'Post text with a matching image and the first comment.']];

function home(m) {
  const fan = el('div', { class: 'fan', role: 'img', 'aria-label': 'Sample designs' }, ['chart-sankey', 'info-cone', 'chart-mindmap', 'chart-radar'].map(id => el('img', { src: u('/samples/' + id + '.jpg'), alt: '' })));
  m.append(el('section', { class: 'hero' }, el('div', {}, el('h1', { text: 'Create in chat. Choose, check and edit here.' }),
    el('p', { class: 'lede', text: 'Ask Claude Code, Codex or Antigravity for a GIF, carousel, Reel, cover, walkthrough or post: /explainer <link or text>. Before it builds anything, your agent shows the ranked designs and asks which to use. Use this app to see every design, check what fits your source, edit content and re-render. Everything runs on this computer with your branding.' }), el('div', { class: 'row' }, el('a', { class: 'btn pri', href: u('/catalog'), target: '_blank', rel: 'noopener', text: 'Open the design catalogue' }), el('a', { class: 'btn ghost', href: '#/library', text: 'Open the library' }))), fan));
  const ta = el('textarea', { id: 'src', placeholder: 'Paste the text you want to explain (or a few sentences about the topic)…', style: 'min-height:150px' }); ta.value = S.source;
  const go = el('button', { class: 'btn pri', type: 'button', text: 'Analyse my content' }), out = el('div');
  m.append(el('div', { class: 'card pad', style: 'margin-bottom:26px' }, el('h2', { text: 'Start with your content' }), el('p', { class: 'muted', text: 'Your text stays on this computer.' }), el('div', { class: 'fld' }, el('label', { for: 'src', class: 'sr' }, 'Source text'), ta), go, out));
  const show = R => { out.innerHTML = ''; if (R.error) { out.append(el('div', { class: 'msg err', role: 'alert', text: R.error })); return; }
    const top = (a, k) => a.slice(0, k);
    out.append(el('div', { class: 'shapes', style: 'margin:16px 0' }, R.shapes.map((s, i) => el('span', { class: 'chip ' + (i ? 'blue' : 'clay'), title: s.signals.join(', '), text: s.label }))),
      el('div', { class: 'reco' },
        el('div', { class: 'card' }, el('b', { text: 'GIF templates' }), el('ol', {}, top(R.gif, 3).map(g => el('li', { text: g.template }))), el('a', { class: 'btn ghost sm', href: '#/gif', text: 'Choose a GIF' })),
        el('div', { class: 'card' }, el('b', { text: 'Carousel slides' }), el('ol', {}, top(R.carousel, 4).map(c => el('li', { text: c.type + ' · ' + c.for.toLowerCase() }))), el('a', { class: 'btn ghost sm', href: '#/carousel', text: 'Build a carousel' })),
        el('div', { class: 'card' }, el('b', { text: 'Reel' }), el('p', { class: 'note', text: 'Motion: ' + R.reel.motion.join(' · ') }), el('p', { class: 'note', text: 'Opening visual: ' + R.reel.visual_hook }), el('a', { class: 'btn ghost sm', href: '#/reel', text: 'Plan a Reel' })),
        el('div', { class: 'card' }, el('b', { text: 'Hooks that fit' }), el('ol', {}, top(R.hookSets.line, 3).map(h => el('li', { text: h.text }))), el('a', { class: 'btn ghost sm', href: '#/post', text: 'Write a post' }))));
  };
  go.onclick = async () => { go.disabled = true; go.textContent = 'Analysing…'; const R = await analyze(ta.value); go.disabled = false; go.textContent = 'Analyse my content'; show(R); };
  if (S.analysis) show(S.analysis);
  m.append(el('h2', { text: 'Create' }), el('div', { class: 'tiles', style: 'margin-top:12px' }, MEDIA.map(([k, n, t]) => { const a = el('a', { class: 'tile', href: '#/' + k }, ic(k), el('b', { text: n }), el('span', { text: t })); if (['gif', 'reel', 'carousel'].includes(k)) a.append(el('div', { style: 'margin-top:10px' }, ready(k))); return a; })));
  const rec = el('div'); m.append(el('h2', { text: 'Recently made' }), rec);
  api('/api/library').then(r => { const L = r.items.slice(0, 4); if (!L.length) { rec.append(el('div', { class: 'empty', text: 'Nothing here yet. Whatever you create appears in the library.' })); return; } const g = el('div', { class: 'grid' }); L.forEach(i => g.append(card(i))); rec.append(g); });
}

async function library(m) {
  head(m, 'Library', 'Everything made on this computer, from the studio and from your agent. Open an item to preview it or download its files.');
  const bar = el('div', { class: 'row', style: 'margin-bottom:18px' }), box = el('div'); m.append(bar, box); const r = await api('/api/library'); let f = 'all', q = '';
  const draw = () => { box.innerHTML = ''; const L = r.items.filter(i => (f === 'all' || i.kind === f) && (!q || i.title.toLowerCase().includes(q))); if (!L.length) { box.append(el('div', { class: 'empty', text: r.items.length ? 'No items match.' : 'Nothing here yet.' })); return; } const g = el('div', { class: 'grid' }); L.forEach(i => g.append(card(i))); box.append(g); };
  const kinds = [['all', 'All'], ...[...new Set(r.items.map(i => i.kind))].map(k => [k, (r.items.find(i => i.kind === k) || {}).label || k])];
  const seg = el('div', { class: 'tabs', role: 'tablist', style: 'margin:0;border:0' }); kinds.forEach(([k, n]) => seg.append(el('button', { type: 'button', role: 'tab', 'aria-selected': String(k === f), text: n, onclick: e => { f = k; $$('button', seg).forEach(b => b.setAttribute('aria-selected', String(b === e.target))); draw(); } })));
  bar.append(seg, el('input', { type: 'text', placeholder: 'Search titles', 'aria-label': 'Search titles', style: 'max-width:240px', oninput: e => { q = e.target.value.toLowerCase(); draw(); } })); draw();
}
boot();
