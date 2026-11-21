"""validate_story: schema + limits + storytelling arc + grounding checks for story.json. Returns (errors, warnings). Pure standard library."""
import re, sys
from common import *
import tts_norm

ROLES = ['hook', 'stakes', 'answer', 'how', 'proof', 'takeaway']
NEED_CITE = {'stakes', 'answer', 'how', 'proof'}
S = lambda lo, hi: ('str', lo, hi)
ITEM = lambda **kw: ('obj', kw)
SPEC = {
  'narration': {'lines': [6, 14], 'words_per_line': [7, 32], 'total_words': [90, 210], 'reel_seconds': [40, 85]},
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
          'slots': {'top': {'text': 62}, 'side': {'text': 118, 'keys': 62}, 'wide': {'text': 150, 'chips': 0}, 'narrow': {'text': 130, 'dialog': 0}},
          'card': {'title': S(3, 26), 'note': S(0, 22)}},
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
    for k in ('meta', 'beats', 'scenes'):
        if k not in story: v.e(f'story.json: missing "{k}"')
    if v.err: return v.err, v.warn
    beats, scenes, meta = story['beats'], story['scenes'], story['meta']
    for k in ('title', 'slug'):
        if not isinstance(meta.get(k), str) or not meta[k]: v.e(f'meta.{k} required')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,60}', str(meta.get('slug', ''))): v.e('meta.slug: lowercase letters, digits, dashes')
    # ── narration arc ──
    if not N['lines'][0] <= len(beats) <= N['lines'][1]: v.e(f'beats: {len(beats)} lines, allowed {N["lines"][0]}-{N["lines"][1]}')
    ids = [b.get('id') for b in beats]
    if len(set(ids)) != len(ids): v.e('beats: duplicate ids')
    tw = 0; last = -1
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
        if beats[-1].get('role') != 'takeaway': v.e('last beat must be role "takeaway"')
        if not any(b.get('role') == 'answer' for b in beats): v.e('need a beat with role "answer"')
    if not N['total_words'][0] <= tw <= N['total_words'][1]: v.e(f'narration total {tw} words, allowed {N["total_words"][0]}-{N["total_words"][1]} (≈ {tw/2.6:.0f}s)')
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
    for i, c in enumerate(g.get('cards', [])):
        for k in ('title', 'body', 'note'):
            if isinstance(c.get(k), str): out.append((f'cards[{i}].{k}', c[k]))
    for k, t in g.get('groups', {}).items(): out.append((f'groups.{k}', t))
    h = g.get('hub', {}); out += [('hub.title', h.get('title', ''))] + [('hub.step', x) for x in h.get('steps', [])] + [('hub.tagline', h.get('tagline', ''))]
    return [(w, t) for w, t in out if isinstance(t, str) and t]
def v_gif(v, g, icons):
    G = SPEC['gif']
    for k in ('title', 'subtitle'): chk_val(v, 'gif.' + k, g.get(k), G[k], icons)
    for k, sp in G['hub'].items():
        if k in g.get('hub', {}): chk_val(v, 'gif.hub.' + k, g['hub'][k], sp, icons)
        elif k == 'title': v.e('gif.hub.title missing')
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
    if not isinstance(g.get('source'), dict) or not g['source'].get('label'): v.e('gif.source.label required')

def v_post(v, p, byid, srcn, srcw):
    P = SPEC['post']
    chk_val(v, 'post.hook', p.get('hook'), P['hook'], set())
    if isinstance(p.get('hook'), str) and not p['hook'].strip().endswith('?'): v.e('post.hook must be a question ending with "?"')
    bl = p.get('bullets', [])
    if not P['bullets'][0] <= len(bl) <= P['bullets'][1]: v.e(f'post.bullets: {len(bl)}; allowed {P["bullets"][0]}-{P["bullets"][1]}')
    for i, b in enumerate(bl):
        if not (isinstance(b, dict) and isinstance(b.get('t'), str) and P['bullet_chars'][0] <= len(b['t']) <= P['bullet_chars'][1]): v.e(f'post.bullets[{i}].t: {P["bullet_chars"][0]}-{P["bullet_chars"][1]} chars'); continue
        if not b.get('c') or not all(c in byid for c in b['c']): v.e(f'post.bullets[{i}].c: list of existing chunk ids (grounding)')
