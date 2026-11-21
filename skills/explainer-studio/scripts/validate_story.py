"""validate_story: schema + limits + storytelling arc + grounding checks for story.json. Returns (errors, warnings). Pure standard library."""
import re, sys
from common import *
import tts_norm

ROLES = ['hook', 'stakes', 'answer', 'how', 'proof', 'takeaway', 'engage']
NEED_CITE = {'stakes', 'answer', 'how', 'proof'}
S = lambda lo, hi: ('str', lo, hi)
ITEM = lambda **kw: ('obj', kw)
SPEC = {
  'narration': {'lines': [7, 15], 'words_per_line': [6, 30], 'max_sentence_words': 22, 'total_words': [90, 215], 'reel_seconds': [40, 90], 'engage': 'LAST beat: ask the viewer a question or give a 1-step challenge (needs ? or starts with a verb like Try/Check/Pick); no cite needed', 'direct_address': 'at least 3 beats use you/your'},
  'reel_scenes': {
    'hook':   {'q': S(10, 130), 'sub': S(0, 110), 'chips': ('list', 0, 4, S(2, 24))},
    'flow':   {'title': S(0, 48), 'steps': ('list', 2, 4, ITEM(label=S(2, 22), sub=S(0, 34), icon='icon')), 'loop': 'bool'},
    'map':    {'title': S(0, 48), 'center': S(2, 24), 'items': ('list', 3, 6, ITEM(label=S(2, 24), icon='icon'))},
    'cards':  {'title': S(0, 48), 'items': ('list', 2, 6, ITEM(label=S(2, 26), sub=S(0, 60), icon='icon'))},
    'list':   {'title': S(0, 48), 'items': ('list', 2, 5, ITEM(label=S(2, 34), sub=S(0, 64)))},
    'chips':  {'title': S(0, 48), 'items': ('list', 2, 4, ITEM(label=S(2, 22), sub=S(0, 70)))},
    'dialog': {'title': S(0, 48), 'turns': ('list', 2, 4, ITEM(who=('enum', ['user', 'ai']), text=S(3, 80)))},
    'big':    {'big': S(2, 40), 'sub': S(0, 110)},
  },
  'gif': {'title': S(3, 40), 'subtitle': S(10, 64), 'groups': {k: S(3, 18) for k in ('blue', 'green', 'clay', 'sand')},
          'hub': {'title': S(3, 22), 'steps': ('list', 0, 3, S(3, 18)), 'tagline': S(4, 30)}, 'card_counts': [9],
          'slots': {'top': {'text': 62}, 'side': {'text': 118, 'keys': 62}, 'wide': {'text': 150, 'chips': 0}, 'narrow': {'text': 100, 'dialog': 0}},
          'card': {'title': S(3, 26), 'note': S(0, 22)}},
  'gif_templates': {
    'template': 'hub | columns | pipeline | lanes   (run: studio.py pick DIR to get the best fit; every template: gif.title, gif.subtitle, 1080x1350, flowing-dot arrows)',
    'hub': 'one concept, 9 parts around it: gif.hub{title,steps[<=3],tagline}, gif.groups{blue,green,clay -> label}, gif.cards[9]{title,icon,group,body}',
    'columns': 'catalogue by category: gif.hub{title,sub?,tagline}, gif.columns[3-4]{label,icon,group,items[2-3]{title<=22,sub<=60,icon}}',
    'pipeline': 'top-down workflow: gif.pipeline{start{title,sub?,icon},stages[2-4]{label,group,link?,nodes[2-4]{title<=24,sub<=44}},result{title,sub?,icon}}',
    'lanes': 'layers of a stack/ecosystem: gif.lanes{hub{title,sub?,icon},lanes[3-5]{label<=22,icon,group,items[2-3]{title<=22,sub<=50}}}',
  },
  'post': {'hook': S(15, 150), 'bullets': [3, 6], 'bullet_chars': [20, 150], 'max_chars': 1100},
  'thresholds': {'claim_support': 1.0, 'overlap_min': 0.40, 'overlap_warn': 0.55, 'recall@3': 0.9, 'mrr': 0.7, 'coverage': 0.5, 'ungrounded_entities': 0},
}
def slot_of(i): return 'top' if i < 3 else 'side' if i < 7 else 'wide' if i == 7 else 'narrow'

class V:
    def __init__(s): s.err = []; s.warn = []
    def e(s, m): s.err.append(m)
    def w(s, m): s.warn.append(m)
def chk_val(v, where, val, spec, icons):
    if spec == 'bool':
        if not isinstance(val, bool): v.e(f'{where}: must be true/false')
    elif spec == 'icon':
        if val is not None and val not in icons: v.e(f'{where}: unknown icon "{val}" (run: studio.py spec --icons)')
    elif isinstance(spec, tuple) and spec[0] == 'str':
        if not isinstance(val, str): v.e(f'{where}: must be a string'); return
        if not spec[1] <= len(val) <= spec[2]: v.e(f'{where}: {len(val)} chars, allowed {spec[1]}-{spec[2]}: "{val[:40]}"')
    elif isinstance(spec, tuple) and spec[0] == 'enum':
        if val not in spec[1]: v.e(f'{where}: must be one of {spec[1]}')
    elif isinstance(spec, tuple) and spec[0] == 'list':
        if not isinstance(val, list): v.e(f'{where}: must be a list'); return
        if not spec[1] <= len(val) <= spec[2]: v.e(f'{where}: {len(val)} items, allowed {spec[1]}-{spec[2]}')
        for i, x in enumerate(val): chk_val(v, f'{where}[{i}]', x, spec[3], icons)
    elif isinstance(spec, tuple) and spec[0] == 'obj':
        if not isinstance(val, dict): v.e(f'{where}: must be an object'); return
        for k, sp in spec[1].items():
            req = not (isinstance(sp, tuple) and sp[0] == 'str' and sp[1] == 0) and sp != 'icon'
            if k in val: chk_val(v, f'{where}.{k}', val[k], sp, icons)
            elif req: v.e(f'{where}: missing "{k}"')
        for k in val:
            if k not in spec[1] and k != 'cue': v.e(f'{where}: unknown key "{k}"')
def chk_props(v, where, props, spec, icons):
    if not isinstance(props, dict): v.e(f'{where}: props must be an object'); return
    for k, sp in spec.items():
        opt = isinstance(sp, tuple) and ((sp[0] == 'str' and sp[1] == 0) or (sp[0] == 'list' and sp[1] == 0)) or sp == 'bool'
        if k in props: chk_val(v, f'{where}.{k}', props[k], sp, icons)
        elif not opt: v.e(f'{where}: missing "{k}"')
    for k in props:
        if k not in spec and k != 'kicker': v.e(f'{where}: unknown prop "{k}"')
    if 'kicker' in props and not (isinstance(props['kicker'], str) and len(props['kicker']) <= 24): v.e(f'{where}.kicker: string ≤24 chars')

def strings(o, out=None):
    out = [] if out is None else out
    if isinstance(o, str): out.append(o)
    elif isinstance(o, dict):
        for k, x in o.items():
            if k not in ('icon', 'who', 'group', 'kind', 'cue', 'loop', 'c'): strings(x, out)
    elif isinstance(o, list):
        for x in o: strings(x, out)
    return out

def validate(story, chunks, full_text):
    v = V(); icons = set(icon_names()); N = SPEC['narration']
    byid = {c['id']: c for c in chunks}; srcn, srcw = source_index(full_text)
    if 'meta' not in story: v.e('story.json: missing "meta"')
    if not any(k in story for k in ('beats', 'gif', 'post')): v.e('story.json: needs at least one of beats+scenes (Reel), gif, post')
    if ('beats' in story) != ('scenes' in story): v.e('story.json: "beats" and "scenes" go together (Reel)')
    if v.err: return v.err, v.warn
    beats, scenes, meta = story.get('beats', []), story.get('scenes', []), story['meta']
    for k in ('title', 'slug'):
        if not isinstance(meta.get(k), str) or not meta[k]: v.e(f'meta.{k} required')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,60}', str(meta.get('slug', ''))): v.e('meta.slug: lowercase letters, digits, dashes')
    # ── narration arc ──
    if beats and not N['lines'][0] <= len(beats) <= N['lines'][1]: v.e(f'beats: {len(beats)} lines, allowed {N["lines"][0]}-{N["lines"][1]}')
    ids = [b.get('id') for b in beats]
    if len(set(ids)) != len(ids): v.e('beats: duplicate ids')
    tw = 0; last = -1
    if beats and beats[-1].get('role') != 'engage': v.e('last beat must have role "engage": ask the viewer a question or give one small challenge')
    if beats and beats[-1].get('role') == 'engage' and not (re.search(r'\?\s*$', beats[-1].get('say', '')) or re.match(r'(Try|Check|Pick|Open|Look|Ask|Run|Write|Share|Tell|Name|Notice|Imagine)\b', beats[-1].get('say', ''))): v.e('engage beat must end with ? or start with Try/Check/Pick/Open/Look/Ask/Run/Write/Share/Tell/Name/Notice/Imagine')
    ya = sum(bool(re.search(r"\b(you|your|you're|you'll|you've)\b", b.get('say', ''), re.I)) for b in beats)
    if beats and ya < 3: v.e(f'direct address: {ya} beat(s) use you/your; need at least 3 so the narration talks to the viewer')
    for b in beats:
        for sn in re.split(r'(?<=[.!?])\s+', b.get('say', '').strip()):
            if len(sn.split()) > N['max_sentence_words']: v.e(f'beat {b.get("id")}: sentence of {len(sn.split())} words (max {N["max_sentence_words"]}); split it so it is easy to follow: "{sn[:50]}..."')
    for i, b in enumerate(beats):
        w = f'beats[{i}]({b.get("id")})'
        for k in ('id', 'role', 'say'):
            if not isinstance(b.get(k), str) or not b.get(k): v.e(f'{w}: missing "{k}"')
        if v.err and not isinstance(b.get('say'), str): continue
        if b['role'] not in ROLES: v.e(f'{w}: role must be one of {ROLES}'); continue
        r = ROLES.index(b['role'])
        if r < last: v.e(f'{w}: role "{b["role"]}" out of order (arc: {" > ".join(ROLES)})')
        last = max(last, r)
        n = len(words(b['say'])); tw += n
        if not N['words_per_line'][0] <= n <= N['words_per_line'][1]: v.e(f'{w}: {n} words, allowed {N["words_per_line"][0]}-{N["words_per_line"][1]}')
        for pb in tts_norm.lint(b['say'], b.get('tts')): v.e(f'{w}: {pb} (rewrite plainly or add "tts")')
        cites = b.get('cite', [])
        if b['role'] in NEED_CITE and not cites: v.e(f'{w}: role {b["role"]} needs at least one cite [["cNN","verbatim quote"]]')
        for j, c in enumerate(cites):
            if not (isinstance(c, list) and len(c) == 2 and all(isinstance(x, str) for x in c)): v.e(f'{w}.cite[{j}]: must be ["cNN","quote"]'); continue
            if c[0] not in byid: v.e(f'{w}.cite[{j}]: unknown chunk {c[0]}'); continue
            q = norm_q(c[1]); nq = len(q.split())
            if nq < 3 or nq > 30: v.e(f'{w}.cite[{j}]: quote must be 3-30 words (got {nq})')
            elif q not in norm_q(byid[c[0]]['text']): v.e(f'{w}.cite[{j}]: quote is NOT verbatim in {c[0]}: "{c[1][:60]}"')
    if beats:
        if beats[0].get('role') != 'hook' or not beats[0].get('say', '').strip().endswith('?'): v.e('beats[0]: must be role "hook" and a question ending with "?"')
        if not any(b.get('role') == 'takeaway' for b in beats): v.e('need a beat with role "takeaway" before the engage beat')
        if not any(b.get('role') == 'answer' for b in beats): v.e('need a beat with role "answer"')
    if beats and not N['total_words'][0] <= tw <= N['total_words'][1]: v.e(f'narration total {tw} words, allowed {N["total_words"][0]}-{N["total_words"][1]} (≈ {tw/2.6:.0f}s)')
    # ── scenes ──
    seen = []; types = SPEC['reel_scenes']
    for i, sc in enumerate(scenes):
        w = f'scenes[{i}]({sc.get("id")})'
        if sc.get('type') not in types: v.e(f'{w}: type must be one of {list(types)}'); continue
        if not sc.get('beats') or not all(b in ids for b in sc['beats']): v.e(f'{w}: "beats" must list existing beat ids'); continue
        seen += sc['beats']; chk_props(v, w + '.p', sc.get('p', {}), types[sc['type']], icons)
    if seen != ids: v.e('scenes must cover every beat exactly once, in order')
    if scenes and scenes[0].get('type') != 'hook': v.e('first scene must be type "hook"')
    if len(scenes) > 8: v.e(f'{len(scenes)} scenes; max 8')
    # cues
    for i, sc in enumerate(scenes):
        say = ' '.join(next(b['say'] for b in beats if b['id'] == bid) for bid in sc.get('beats', []) if bid in ids).lower()
        def walk(o):
            if isinstance(o, dict):
                if 'cue' in o and str(o['cue']).lower() not in say: v.w(f'scenes[{i}]: cue "{o["cue"]}" not found in the scene narration (item will use default timing)')
                for x in o.values(): walk(x)
            elif isinstance(o, list):
                for x in o: walk(x)
        walk(sc.get('p', {}))
    # ── gif ──
    if 'gif' in story:
        v_gif(v, story['gif'], icons)
        for w, t in gif_texts(story['gif']):   # every GIF text must come from the source (>=75% of its content words appear there)
            cw = content_words(t)
            if len(cw) >= 3 and sum(x in srcw for x in cw) / len(cw) < .75: v.e(f'gif text not grounded in source ({w}): "{t[:60]}". Reword using the source\'s own words')
    if 'post' in story: v_post(v, story['post'], byid, srcn, srcw)
    # ── entity grounding on every string ──
    allstr = [('say', b['say']) for b in beats if isinstance(b.get('say'), str)] + [('scene', s) for sc in scenes for s in strings(sc.get('p', {}))]
    allstr += [('gif', s) for s in strings(story.get('gif', {}))] + [('post', s) for s in strings(story.get('post', {}))]
    ok = set(cfg('allow.json')['entities']); miss = {}
    for where, s in allstr:
        for e in entities(s):
            if e not in ok and not in_source(e, srcn, srcw): miss.setdefault(e, set()).add(where)
    for e, ws in sorted(miss.items()): v.e(f'ungrounded term "{e}" ({"/".join(sorted(ws))}): not in the source. Remove it, or quote the source for it')
    return v.err, v.warn

def gif_texts(g):
    out = []
    def walk(o, p):
        if isinstance(o, str): out.append((p, o))
        elif isinstance(o, dict):
            for k, x in o.items():
                if k not in ('icon', 'group', 'kind', 'template', 'who', 'link', 'hold', 'H'): walk(x, f'{p}.{k}')
        elif isinstance(o, list):
            for i, x in enumerate(o): walk(x, f'{p}[{i}]')
    walk(g, 'gif'); return [(w, t) for w, t in out if t]
def _S(v, w, val, lo, hi):
    if not isinstance(val, str) or not lo <= len(val) <= hi: v.e(f'{w}: text of {lo}-{hi} chars required' + (f' (got {len(val)})' if isinstance(val, str) else ''))
def _list(v, w, val, lo, hi):
    if not isinstance(val, list) or not lo <= len(val) <= hi: v.e(f'{w}: list of {lo}-{hi} items required'); return []
    return val
def _ic(v, w, val, icons, req=True):
    if val is None and not req: return
    if val not in icons: v.e(f'{w}: unknown icon "{val}" (studio.py spec --icons)')
def _grp(v, w, val):
    if val not in ('blue', 'green', 'clay', 'sand'): v.e(f'{w}: must be blue|green|clay|sand')
def v_gif(v, g, icons):
    G = SPEC['gif']; tpl = g.get('template', 'hub')
    if tpl not in ('hub', 'columns', 'pipeline', 'lanes'): v.e('gif.template must be hub|columns|pipeline|lanes'); return
    g['template'] = tpl
    for k in ('title', 'subtitle'): chk_val(v, 'gif.' + k, g.get(k), G[k], icons)
    if 'source' in g: v.w('gif.source is ignored: the GIF no longer shows a source line')
    if tpl == 'columns':
        h = g.get('hub', {}); _S(v, 'gif.hub.title', h.get('title'), 2, 22); _S(v, 'gif.hub.tagline', h.get('tagline'), 4, 34)
        if h.get('sub') is not None: _S(v, 'gif.hub.sub', h['sub'], 4, 40)
        for i, c in enumerate(_list(v, 'gif.columns', g.get('columns'), 3, 4)):
            w = f'gif.columns[{i}]'; _S(v, w + '.label', c.get('label'), 3, 22); _ic(v, w + '.icon', c.get('icon'), icons); _grp(v, w + '.group', c.get('group'))
            for j, it in enumerate(_list(v, w + '.items', c.get('items'), 2, 3)):
                ww = f'{w}.items[{j}]'; _S(v, ww + '.title', it.get('title'), 3, 22 if len(g.get('columns', [])) == 4 else 26); _S(v, ww + '.sub', it.get('sub'), 8, 60 if len(g.get('columns', [])) == 4 else 80); _ic(v, ww + '.icon', it.get('icon'), icons)
        return
    if tpl == 'pipeline':
        p = g.get('pipeline', {})
        for k in ('start', 'result'):
            d = p.get(k, {}); _S(v, f'gif.pipeline.{k}.title', d.get('title'), 3, 32); _ic(v, f'gif.pipeline.{k}.icon', d.get('icon'), icons)
            if d.get('sub') is not None: _S(v, f'gif.pipeline.{k}.sub', d['sub'], 4, 54)
        st = _list(v, 'gif.pipeline.stages', p.get('stages'), 2, 4)
        for i, s_ in enumerate(st):
            w = f'gif.pipeline.stages[{i}]'; _S(v, w + '.label', s_.get('label'), 3, 30); _grp(v, w + '.group', s_.get('group'))
            nn = _list(v, w + '.nodes', s_.get('nodes'), 2, 4)
            for j, nd in enumerate(nn):
                ww = f'{w}.nodes[{j}]'; _S(v, ww + '.title', nd.get('title'), 3, 18 if len(nn) == 4 else 26)
                if nd.get('sub') is not None: _S(v, ww + '.sub', nd['sub'], 4, 36 if len(nn) == 4 else 60)
        return
    if tpl == 'lanes':
        L = g.get('lanes', {}); h = L.get('hub', {}); _S(v, 'gif.lanes.hub.title', h.get('title'), 2, 24); _ic(v, 'gif.lanes.hub.icon', h.get('icon'), icons, False)
        if h.get('sub') is not None: _S(v, 'gif.lanes.hub.sub', h['sub'], 4, 34)
        for i, ln in enumerate(_list(v, 'gif.lanes.lanes', L.get('lanes'), 3, 5)):
            w = f'gif.lanes.lanes[{i}]'; _S(v, w + '.label', ln.get('label'), 3, 22); _ic(v, w + '.icon', ln.get('icon'), icons); _grp(v, w + '.group', ln.get('group'))
            it = _list(v, w + '.items', ln.get('items'), 2, 3)
            for j, x in enumerate(it):
                ww = f'{w}.items[{j}]'; _S(v, ww + '.title', x.get('title'), 3, 20 if len(it) == 3 else 28)
                if x.get('sub') is not None: _S(v, ww + '.sub', x['sub'], 4, 36 if len(it) == 3 else 60)
        return
    # ── hub (default) ──
    for k, sp in G['hub'].items():
        if k in g.get('hub', {}): chk_val(v, 'gif.hub.' + k, g['hub'][k], sp, icons)
        elif k in ('title', 'tagline'): v.e(f'gif.hub.{k} missing')
    cards = g.get('cards', [])
    if len(cards) not in G['card_counts']: v.e(f'gif.cards: {len(cards)}; must be {G["card_counts"]}'); return
    used = set()
    for i, c in enumerate(cards):
        w = f'gif.cards[{i}]'; sl = slot_of(i); kind = c.get('kind', 'text'); c['kind'] = kind
        chk_val(v, w + '.title', c.get('title'), G['card']['title'], icons); chk_val(v, w + '.icon', c.get('icon'), 'icon', icons)
        if c.get('group') not in G['groups']: v.e(f'{w}.group must be blue|green|clay|sand'); continue
        used.add(c['group'])
        lim = G['slots'][sl]
        if kind not in lim: v.e(f'{w}: kind "{kind}" not allowed in {sl} slot (allowed: {list(lim)})'); continue
        if kind in ('text', 'keys'):
            if not isinstance(c.get('body'), str) or not 10 <= len(c['body']) <= lim[kind]: v.e(f'{w}.body: 10-{lim[kind]} chars for {sl}/{kind}')
        if kind == 'keys':
            ks = c.get('keys', []); 
            if not (1 <= len(ks) <= 3 and all(isinstance(k, str) and 1 <= len(k) <= 8 for k in ks)): v.e(f'{w}.keys: 1-3 labels ≤8 chars')
            if len(c.get('note', '')) > 18: v.e(f'{w}.note ≤18 chars with keys')
        elif 'note' in c and len(c['note']) > 22: v.e(f'{w}.note ≤22 chars')
        if kind == 'chips':
            it = c.get('items', [])
            if not 2 <= len(it) <= 4: v.e(f'{w}.items: 2-4')
            for j, m in enumerate(it):
                if not (isinstance(m, dict) and 2 <= len(m.get('l', '')) <= 16 and 2 <= len(m.get('d', '')) <= 26): v.e(f'{w}.items[{j}]: {{"l": ≤16 chars, "d": ≤26 chars}}')
            if 'key' in c and not (len(c['key'].get('k', '')) <= 10 and len(c['key'].get('t', '')) <= 10): v.e(f'{w}.key: k,t ≤10 chars')
        if kind == 'dialog':
            tn = c.get('turns', []); lm = [18, 28, 70]
            if not 2 <= len(tn) <= 3: v.e(f'{w}.turns: 2-3')
            for j, t in enumerate(tn):
                if t.get('who') not in ('user', 'ai') or len(t.get('text', '')) > lm[j]: v.e(f'{w}.turns[{j}]: who user|ai, text ≤{lm[j]} chars')
            if tn and tn[0].get('who') != 'user': v.e(f'{w}.turns[0] must be user')
    for gname in used:
        if gname not in g.get('groups', {}): v.e(f'gif.groups.{gname} label missing (used by a card)')
    for gname, lab in g.get('groups', {}).items(): chk_val(v, f'gif.groups.{gname}', lab, S(3, 18), icons)

def v_post(v, p, byid, srcn, srcw):
    P = SPEC['post']
    chk_val(v, 'post.hook', p.get('hook'), P['hook'], set())
    if isinstance(p.get('hook'), str) and not p['hook'].strip().endswith('?'): v.e('post.hook must be a question ending with "?"')
    bl = p.get('bullets', [])
    if not P['bullets'][0] <= len(bl) <= P['bullets'][1]: v.e(f'post.bullets: {len(bl)}; allowed {P["bullets"][0]}-{P["bullets"][1]}')
    for i, b in enumerate(bl):
        if not (isinstance(b, dict) and isinstance(b.get('t'), str) and P['bullet_chars'][0] <= len(b['t']) <= P['bullet_chars'][1]): v.e(f'post.bullets[{i}].t: {P["bullet_chars"][0]}-{P["bullet_chars"][1]} chars'); continue
        if not b.get('c') or not all(c in byid for c in b['c']): v.e(f'post.bullets[{i}].c: list of existing chunk ids (grounding)')
