"""validate_story: schema + limits + storytelling arc + grounding checks for story.json. Returns (errors, warnings). Pure standard library."""
import re, sys
from common import *
import tts_norm, carousel as CAR

ROLES = ['hook', 'stakes', 'answer', 'how', 'proof', 'takeaway', 'engage']
NEED_CITE = {'stakes', 'answer', 'how', 'proof'}
S = lambda lo, hi: ('str', lo, hi)
ITEM = lambda **kw: ('obj', kw)
SPEC = {
  'narration': {'lines': [6, 12], 'words_per_line': [5, 24], 'max_sentence_words': 18, 'total_words': [60, 115], 'reel_seconds': [22, 55], 'engage': 'LAST beat: ask the viewer a question or give a 1-step challenge (needs ? or starts with a verb like Try/Check/Pick); no cite needed', 'direct_address': 'at least 3 beats use you/your'},
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
    'template': 'grid | hub | columns | pipeline | lanes | ecosystem | framework | exploded | isoflow | orbit | stairs | tower | skyline | conveyor | funnel   (run: studio.py pick DIR to get the best fit; every template: gif.title, gif.subtitle, 1080x1350, flowing-dot arrows)',
    'grid': 'poster of 4, 6 or 9 numbered cards, each with a mini diagram: gif.grid{kicker?,legend[0-4]{label<=20,group},cards[4|6|9]{motif bars|curve|tree|flow|cluster|network|loop|steps|split|pixels,caption<=30,title<=24,sub 10-70,group}}  (also carousel slide type grid)',
    'hub': 'one concept, 9 parts around it: gif.hub{title,steps[<=3],tagline}, gif.groups{blue,green,clay -> label}, gif.cards[9]{title,icon,group,body}',
    'columns': 'catalogue by category: gif.hub{title,sub?,tagline}, gif.columns[3-4]{label,icon,group,items[2-3]{title<=22,sub<=60,icon}}',
    'pipeline': 'top-down workflow: gif.pipeline{start{title,sub?,icon},stages[2-4]{label,group,link?,nodes[2-4]{title<=24,sub<=44}},result{title,sub?,icon}}',
    'lanes': 'layers of a stack/ecosystem: gif.lanes{hub{title,sub?,icon},lanes[3-5]{label<=22,icon,group,items[2-3]{title<=22,sub<=50}}}',
    'exploded': '3D layers pulled apart (isometric plates) with a flat label card each: gif.exploded{hub{title<=22},layers[3-5]{title<=24,sub<=60,icon,group}} (top layer first)',
    'isoflow': 'a flow across isometric slabs, one stop per slab: gif.isoflow{stops[3-5]{title<=24,sub<=50,icon,group}} (first to last)',
    'orbit': 'a glossy core with tilted 3D rings and 4-6 cards around it: gif.orbit{hub{title<=22,sub?<=24},items[4-6]{title<=24,sub<=44,icon,group}}',
    'tower': 'isometric cutaway building, one room per floor with a small scene (stack, process, levels): gif.tower{hub{title<=26},floors[3-5]{title<=22,sub<=50,icon,group,scene}} (top floor first); scene in SCENES list',
    'funnel': 'stages that narrow top to bottom (conversion, filtering, shrinking pool): gif.funnel{stages[3-5]{title<=24,sub<=60,value<=6 chars,pct 0-100 (share of the first stage, from the source),icon,group}}',
    'skyline': 'isometric city, tower height shows a ranking or size: gif.skyline{buildings[3-5]{title<=20,sub<=44,value<=6 chars,size 1-10,icon,group}}',
    'conveyor': 'isometric belt through 3-4 gates (processing, review, hand-off): gif.conveyor{tally<=34 (panel heading),gates[3-4]{title<=22,sub<=50,icon,group,stat{value<=8 e.g. "88%",pct 0-100 = share passing}}} (first gate first)',
    'stairs': 'isometric blocks climbing left to right (levels, stages, maturity): gif.stairs{steps[3-5]{title<=22,sub<=50,icon,group}} (lowest first)',
    'ecosystem': 'one core fanning out to 3-5 sections with rails: gif.ecosystem{hub{title<=22,sub?<=24,icon?},sections[3-5]{label<=22,icon,group,items[2-3]{title<=24,sub<=50}}}',
    'framework': 'a framework as 6|9 mini-diagram cards + takeaways: gif.framework{takeaways_title?,cards[6|9]{title<=26,body<=96,icon,group,caption?<=40,viz{type,root?,items}},takeaways[3-5]{title<=24,body<=44,icon}}; viz.type steps(2-4; <=14 chars, <=8 when 3) stack(2-3,<=16) tree(root<=22 + 2-3, <=14, <=9 when 3) fan(root<=9 + 2-3,<=16) table(2-4 rows "a|b|c"; cells <=10 with 3 columns, <=16 with 2)',
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
    if not any(k in story for k in ('beats', 'gif', 'post', 'carousel')): v.e('story.json: needs at least one of beats+scenes (Reel), gif, post, carousel')
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
    if beats and not N['total_words'][0] <= tw <= N['total_words'][1]: v.e(f'narration total {tw} words, allowed {N["total_words"][0]}-{N["total_words"][1]} (≈ {tw/2.5:.0f}s at the default pace; keep the Reel under about 50 s or viewers leave: cut words, one idea per line)')
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
    if 'carousel' in story:
        v_carousel(v, story['carousel'], icons)
        for w, t in carousel_texts(story['carousel']):   # slide text must come from the source (resources: from the fetched pages)
            cw = content_words(t)
            if len(cw) >= 3 and sum(x in srcw for x in cw) / len(cw) < .75: v.e(f'carousel text not grounded in source ({w}): "{t[:60]}". Reword using the source\'s own words')
    if 'post' in story: v_post(v, story['post'], byid, srcn, srcw)
    # ── entity grounding on every string ──
    allstr = [('say', b['say']) for b in beats if isinstance(b.get('say'), str)] + [('scene', s) for sc in scenes for s in strings(sc.get('p', {}))]
    allstr += [('gif', s) for s in strings(story.get('gif', {}))] + [('post', s) for s in strings(story.get('post', {}))] + [('carousel', t) for _, t in carousel_texts(story.get('carousel', {}))]
    ok = set(cfg('allow.json')['entities']); miss = {}
    for where, s in allstr:
        for e in entities(s):
            if e not in ok and not in_source(e, srcn, srcw): miss.setdefault(e, set()).add(where)
    for e, ws in sorted(miss.items()): v.e(f'ungrounded term "{e}" ({"/".join(sorted(ws))}): not in the source. Remove it, or quote the source for it')
    return v.err, v.warn


CAR_TYPES = ('points', 'stat', 'bars', 'funnel', 'ring', 'tower', 'compare', 'flow', 'big', 'loop', 'stack', 'terminal', 'shot', 'grid')
CAR_THEMES = ('paper', 'midnight', 'sunrise', 'mint', 'sky')
CAR_LAYOUTS = ('classic', 'poster', 'terminal', 'bold', 'stage', 'editorial')
def _pct(v, w, val):
    if not (isinstance(val, (int, float)) and not isinstance(val, bool) and 0 <= val <= 100): v.e(f'{w}: number 0-100 required')
def v_carousel(v, c, icons):
    if not isinstance(c, dict): v.e('carousel must be an object'); return
    if c.get('hook_style') not in CAR.HOOK_STYLES: v.e('carousel.hook_style must be one of ' + '|'.join(CAR.HOOK_STYLES))
    t = c.get('title') if isinstance(c.get('title'), dict) else {}
    _S(v, 'carousel.title.hook', t.get('hook'), 12, 72)
    if t.get('sub') is not None: _S(v, 'carousel.title.sub', t.get('sub'), 0, 110)
    if t.get('kicker') is not None: _S(v, 'carousel.title.kicker', t.get('kicker'), 0, 26)
    if c.get('theme') is not None and c['theme'] not in CAR_THEMES: v.e('carousel.theme must be one of ' + '|'.join(CAR_THEMES))
    if t.get('layout') is not None and t['layout'] not in CAR_LAYOUTS: v.e('carousel.title.layout must be one of ' + '|'.join(CAR_LAYOUTS))
    if t.get('icon') is not None: _ic(v, 'carousel.title.icon', t.get('icon'), icons)
    if t.get('accent') is not None and str(t['accent']).lower() not in str(t.get('hook', '')).lower(): v.e('carousel.title.accent must be words that appear in the hook (they get the colour box)')
    if t.get('chips') is not None:
        for j, ch in enumerate(_list(v, 'carousel.title.chips', t['chips'], 2, 4)):
            if isinstance(ch, dict): _S(v, f'carousel.title.chips[{j}].label', ch.get('label'), 3, 16); _ic(v, f'carousel.title.chips[{j}].icon', ch.get('icon'), icons)
    sl = _list(v, 'carousel.slides', c.get('slides', []), 0, 5)
    for i, s_ in enumerate(sl):
        w = f'carousel.slides[{i}]'
        if not isinstance(s_, dict) or s_.get('type') not in CAR_TYPES: v.e(f'{w}.type must be one of ' + '|'.join(CAR_TYPES)); continue
        ty = s_['type']
        if ty != 'big': _S(v, w + '.title', s_.get('title'), 6, 60)
        if ty == 'points':
            for j, it in enumerate(_list(v, w + '.items', s_.get('items'), 2, 4)):
                _S(v, f'{w}.items[{j}].title', it.get('title'), 3, 28); _S(v, f'{w}.items[{j}].sub', it.get('sub', ''), 0, 90)
                if it.get('group') is not None: _grp(v, f'{w}.items[{j}].group', it['group'])
        elif ty == 'stat':
            _S(v, w + '.value', s_.get('value'), 1, 8); _S(v, w + '.label', s_.get('label'), 6, 70); _S(v, w + '.sub', s_.get('sub', ''), 0, 100)
            if s_.get('pct') is not None: _pct(v, w + '.pct', s_['pct'])
        elif ty in ('bars', 'funnel'):
            for j, r in enumerate(_list(v, w + '.rows', s_.get('rows'), 3, 5)):
                _S(v, f'{w}.rows[{j}].label', r.get('label'), 2, 24); _S(v, f'{w}.rows[{j}].value', r.get('value'), 1, 8); _pct(v, f'{w}.rows[{j}].pct', r.get('pct'))
        elif ty == 'grid': _grid(v, w, s_)
        elif ty == 'ring':
            for j, st_ in enumerate(_list(v, w + '.steps', s_.get('steps'), 3, 5)):
                _S(v, f'{w}.steps[{j}].title', st_.get('title'), 2, 18); _S(v, f'{w}.steps[{j}].sub', st_.get('sub', ''), 0, 44); _ic(v, f'{w}.steps[{j}].icon', st_.get('icon'), icons, req=False)
        elif ty == 'tower':
            for j, st_ in enumerate(_list(v, w + '.steps', s_.get('steps'), 3, 4)):
                _S(v, f'{w}.steps[{j}].title', st_.get('title'), 3, 16); _S(v, f'{w}.steps[{j}].tag', st_.get('tag', ''), 0, 18); _S(v, f'{w}.steps[{j}].note', st_.get('note', ''), 0, 52)
                _S(v, f'{w}.steps[{j}].stat', st_.get('stat', ''), 0, 26); _S(v, f'{w}.steps[{j}].side', st_.get('side', ''), 0, 34); _ic(v, f'{w}.steps[{j}].icon', st_.get('icon'), icons, req=False)
        elif ty == 'compare':
            for sd in ('left', 'right'):
                x = s_.get(sd) if isinstance(s_.get(sd), dict) else {}; _S(v, f'{w}.{sd}.head', x.get('head'), 3, 26)
                for j, it in enumerate(_list(v, f'{w}.{sd}.items', x.get('items'), 2, 3)): _S(v, f'{w}.{sd}.items[{j}]', it, 6, 60)
        elif ty == 'flow':
            for j, st in enumerate(_list(v, w + '.steps', s_.get('steps'), 3, 4)):
                _S(v, f'{w}.steps[{j}].title', st.get('title'), 3, 24); _S(v, f'{w}.steps[{j}].sub', st.get('sub', ''), 0, 70); _ic(v, f'{w}.steps[{j}].icon', st.get('icon'), icons, req=False)
        elif ty == 'loop':
            for j, st in enumerate(_list(v, w + '.steps', s_.get('steps'), 3, 4)):
                _S(v, f'{w}.steps[{j}].title', st.get('title'), 3, 22); _S(v, f'{w}.steps[{j}].sub', st.get('sub', ''), 0, 60); _ic(v, f'{w}.steps[{j}].icon', st.get('icon'), icons, req=False)
            if s_.get('center') is not None: _S(v, w + '.center', s_['center'], 0, 24)
        elif ty == 'stack':
            for j, r in enumerate(_list(v, w + '.rows', s_.get('rows'), 3, 5)): _S(v, f'{w}.rows[{j}].title', r.get('title'), 3, 28); _S(v, f'{w}.rows[{j}].sub', r.get('sub', ''), 0, 64)
        elif ty == 'terminal':
            _S(v, w + '.prompt', s_.get('prompt', 'claude'), 0, 40)
            for j, t_ in enumerate(_list(v, w + '.lines', s_.get('lines'), 3, 6)): _S(v, f'{w}.lines[{j}]', t_, 6, 64)
        elif ty == 'shot':
            if not (isinstance(s_.get('image'), str) and re.match(r'^[\w./-]+\.(png|jpg|jpeg)$', s_['image']) and '..' not in s_['image']): v.e(f'{w}.image must be a png/jpg path inside the project (studio.py shot / readercard make them)')
            _S(v, w + '.host', s_.get('host'), 3, 60); _S(v, w + '.why', s_.get('why', ''), 0, 120)
            if not (isinstance(s_.get('url'), str) and re.match(r'https?://[^\s]+$', s_['url'])): v.e(f'{w}.url must be an http(s) link')
        elif ty == 'big': _S(v, w + '.big', s_.get('big'), 10, 110); _S(v, w + '.sub', s_.get('sub', ''), 0, 120)
        if s_.get('cta') is not None: _S(v, w + '.cta', s_['cta'], 0, 44)
    R = c.get('resources')
    if R is not None:
        _S(v, 'carousel.resources.title', R.get('title'), 4, 34)
        for j, it in enumerate(_list(v, 'carousel.resources.items', R.get('items'), 2, 10)):
            _S(v, f'carousel.resources.items[{j}].name', it.get('name'), 2, 30); _S(v, f'carousel.resources.items[{j}].why', it.get('why'), 12, 110)
            if not (isinstance(it.get('url'), str) and re.match(r'https?://[^\s]+$', it['url'])): v.e(f'carousel.resources.items[{j}].url must be an http(s) link')
    cl = c.get('closing') if isinstance(c.get('closing'), dict) else {}
    _S(v, 'carousel.closing.title', cl.get('title'), 6, 60)
    if cl.get('kind', 'follow') not in ('follow', 'comments'): v.e('carousel.closing.kind must be follow|comments')
    for j, t_ in enumerate(_list(v, 'carousel.closing.lines', cl.get('lines', []), 0, 3)): _S(v, f'carousel.closing.lines[{j}]', t_, 3, 38)
    if cl.get('cta') is not None: _S(v, 'carousel.closing.cta', cl['cta'], 0, 44)
    if c.get('cta_default') is not None: _S(v, 'carousel.cta_default', c['cta_default'], 0, 44)
    try: n = CAR.deck_len(c)
    except Exception: return
    if not (2 if c.get('single') or c.get('short') else 5) <= n <= 7: v.e(f'carousel has {n} slides (title + {len(sl)} content + {len(CAR.pages((R or {}).get("items") or []))} resource page(s) + closing); allowed 5-7. Add or remove content slides')
    if R and cl.get('kind') != 'comments': v.w('carousel has resources: set closing.kind to "comments" so the last slide says the links are in the comments')

def carousel_texts(c):
    out = []
    def walk(o, p):
        if isinstance(o, str): out.append((p, o))
        elif isinstance(o, dict):
            for k, x in o.items():
                if k not in ('icon', 'group', 'type', 'hook_style', 'kind', 'url', 'cta', 'cta_default', 'comment', 'pct', 'kicker', 'lines', 'closing', 'image', 'host', 'window', 'theme', 'layout', 'prompt', 'center', 'label'): walk(x, f'{p}.{k}')   # closing is a call to action, not a claim
        elif isinstance(o, list):
            for i, x in enumerate(o): walk(x, f'{p}[{i}]')
    walk(c, 'carousel'); return [(w, t) for w, t in out if t]

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
TEMPLATES = ('grid', 'hub', 'columns', 'pipeline', 'lanes', 'ecosystem', 'framework', 'exploded', 'isoflow', 'orbit', 'stairs', 'tower', 'skyline', 'conveyor', 'funnel')
VIZ = {'steps': (2, 4, 14, False), 'stack': (2, 3, 16, False), 'tree': (2, 3, 14, True), 'fan': (2, 3, 16, True), 'table': (2, 4, 30, False)}   # (min items, max items, max chars, needs root)
def v_framework(v, g, icons):
    F = g.get('framework', {})
    if F.get('takeaways_title') is not None: _S(v, 'gif.framework.takeaways_title', F['takeaways_title'], 4, 24)
    cards = F.get('cards', [])
    if len(cards) not in (6, 9): v.e(f'gif.framework.cards: {len(cards)}; must be 6 or 9'); return
    for i, c in enumerate(cards):
        w = f'gif.framework.cards[{i}]'; _S(v, w + '.title', c.get('title'), 3, 26); _S(v, w + '.body', c.get('body'), 20, 96); _ic(v, w + '.icon', c.get('icon'), icons); _grp(v, w + '.group', c.get('group'))
        if c.get('caption') is not None: _S(v, w + '.caption', c['caption'], 4, 40)
        z = c.get('viz') or {}; t = z.get('type')
        if t not in VIZ: v.e(f'{w}.viz.type must be ' + '|'.join(VIZ)); continue
        lo, hi, mx, root = VIZ[t]; it = _list(v, w + '.viz.items', z.get('items'), lo, hi)
        if root: _S(v, w + '.viz.root', z.get('root'), 2, {'tree': 22, 'fan': 9}[t])
        if t == 'table':
            cols = {len(str(r).split('|')) for r in it}
            if len(cols) != 1 or not cols <= {2, 3}: v.e(f'{w}.viz.items: every row needs the same 2-3 cells separated by |')
            for r in it:
                for cell in str(r).split('|'):
                    if not 1 <= len(cell.strip()) <= (10 if len(r.split('|')) == 3 else 16): v.e(f'{w}.viz.items: table cell "{cell.strip()}" must be 1-{10 if len(r.split("|")) == 3 else 16} chars')
            continue
        lim = {('steps', 3): 8, ('tree', 3): 9}.get((t, len(it)), mx)
        for j, x in enumerate(it): _S(v, f'{w}.viz.items[{j}]', x, 2, lim)
    tk = _list(v, 'gif.framework.takeaways', F.get('takeaways'), 3, 5)
    for i, k in enumerate(tk):
        w = f'gif.framework.takeaways[{i}]'; _S(v, w + '.title', k.get('title'), 3, 24); _S(v, w + '.body', k.get('body'), 8, 44 if len(tk) <= 4 else 36); _ic(v, w + '.icon', k.get('icon'), icons)
def v_ecosystem(v, g, icons):
    E = g.get('ecosystem', {}); h = E.get('hub', {}); _S(v, 'gif.ecosystem.hub.title', h.get('title'), 2, 22); _ic(v, 'gif.ecosystem.hub.icon', h.get('icon'), icons, False)
    if h.get('sub') is not None: _S(v, 'gif.ecosystem.hub.sub', h['sub'], 3, 24)
    for i, s_ in enumerate(_list(v, 'gif.ecosystem.sections', E.get('sections'), 3, 5)):
        w = f'gif.ecosystem.sections[{i}]'; _S(v, w + '.label', s_.get('label'), 3, 22); _ic(v, w + '.icon', s_.get('icon'), icons); _grp(v, w + '.group', s_.get('group'))
        for j, x in enumerate(_list(v, w + '.items', s_.get('items'), 2, 3)): _S(v, f'{w}.items[{j}].title', x.get('title'), 3, 24); _S(v, f'{w}.items[{j}].sub', x.get('sub'), 8, 50)
def _nodes(v, w, L, lo, hi, tmax, smax, icons):
    for i, x in enumerate(_list(v, w, L, lo, hi)):
        _S(v, f'{w}[{i}].title', x.get('title'), 3, tmax); _S(v, f'{w}[{i}].sub', x.get('sub'), 8, smax); _ic(v, f'{w}[{i}].icon', x.get('icon'), icons); _grp(v, f'{w}[{i}].group', x.get('group'))
def v_exploded(v, g, icons):
    X = g.get('exploded', {}); _S(v, 'gif.exploded.hub.title', X.get('hub', {}).get('title'), 2, 22); _nodes(v, 'gif.exploded.layers', X.get('layers'), 3, 5, 24, 60, icons)
def v_isoflow(v, g, icons): _nodes(v, 'gif.isoflow.stops', g.get('isoflow', {}).get('stops'), 3, 5, 24, 50, icons)
def v_orbit(v, g, icons):
    O = g.get('orbit', {}); h = O.get('hub', {}); _S(v, 'gif.orbit.hub.title', h.get('title'), 2, 22)
    if h.get('sub') is not None: _S(v, 'gif.orbit.hub.sub', h['sub'], 3, 24)
    _nodes(v, 'gif.orbit.items', O.get('items'), 4, 6, 24, 44, icons)
def v_stairs(v, g, icons): _nodes(v, 'gif.stairs.steps', g.get('stairs', {}).get('steps'), 3, 5, 22, 50, icons)
SCENES = ('screen', 'chart', 'chat', 'docs', 'gears', 'checklist', 'search', 'shield', 'cloud', 'people', 'rocket', 'database', 'bulb', 'target')
def v_tower(v, g, icons):
    T = g.get('tower', {}); _S(v, 'gif.tower.hub.title', T.get('hub', {}).get('title'), 3, 26); _nodes(v, 'gif.tower.floors', T.get('floors'), 3, 5, 22, 50, icons)
    for i, f in enumerate(T.get('floors') or []):
        if isinstance(f, dict) and f.get('scene') not in SCENES: v.e(f'gif.tower.floors[{i}].scene must be one of ' + '|'.join(SCENES))
def v_skyline(v, g, icons):
    B = g.get('skyline', {}).get('buildings'); _nodes(v, 'gif.skyline.buildings', B, 3, 5, 20, 44, icons)
    for i, b in enumerate(B if isinstance(B, list) else []):
        if not isinstance(b, dict): continue
        _S(v, f'gif.skyline.buildings[{i}].value', b.get('value'), 1, 6)
        if not (isinstance(b.get('size'), int) and not isinstance(b.get('size'), bool) and 1 <= b['size'] <= 10): v.e(f'gif.skyline.buildings[{i}].size must be an integer 1-10')
def v_funnel(v, g, icons):
    R = g.get('funnel', {}).get('stages'); _nodes(v, 'gif.funnel.stages', R, 3, 5, 24, 60, icons)
    for i, r in enumerate(R if isinstance(R, list) else []):
        if not isinstance(r, dict): continue
        _S(v, f'gif.funnel.stages[{i}].value', r.get('value'), 1, 6)
        if not (isinstance(r.get('pct'), (int, float)) and not isinstance(r.get('pct'), bool) and 0 <= r['pct'] <= 100): v.e(f'gif.funnel.stages[{i}].pct must be a number 0-100 (share of the first stage)')
def v_conveyor(v, g, icons):
    C_ = g.get('conveyor', {}); _S(v, 'gif.conveyor.tally', C_.get('tally'), 8, 34); G_ = C_.get('gates'); _nodes(v, 'gif.conveyor.gates', G_, 3, 4, 22, 50, icons)
    for i, x in enumerate(G_ if isinstance(G_, list) else []):
        st = x.get('stat') if isinstance(x, dict) else None
        if not isinstance(st, dict): v.e(f'gif.conveyor.gates[{i}].stat must be {{"value":"88%","pct":88}} (the share that passes this gate, taken from the source)'); continue
        _S(v, f'gif.conveyor.gates[{i}].stat.value', st.get('value'), 1, 8)
        if not (isinstance(st.get('pct'), (int, float)) and not isinstance(st.get('pct'), bool) and 0 <= st['pct'] <= 100): v.e(f'gif.conveyor.gates[{i}].stat.pct must be a number 0-100')
MOTIFS = ('bars', 'curve', 'tree', 'flow', 'cluster', 'network', 'loop', 'steps', 'split', 'pixels')
def _grid(v, w, x):
    """The numbered card grid (carousel slide `grid`, GIF template `grid`): 4, 6 or 9 cards, each a mini diagram + caption + title + one line."""
    x = x if isinstance(x, dict) else {}
    if x.get('kicker') is not None: _S(v, w + '.kicker', x['kicker'], 0, 44)
    for j, lg in enumerate(_list(v, w + '.legend', x.get('legend', []), 0, 4) if x.get('legend') else []):
        _S(v, f'{w}.legend[{j}].label', lg.get('label'), 3, 20); _grp(v, f'{w}.legend[{j}].group', lg.get('group'))
    cs = _list(v, w + '.cards', x.get('cards'), 4, 9)
    if cs and len(cs) not in (4, 6, 9): v.e(f'{w}.cards must have exactly 4, 6 or 9 cards (a full grid), not {len(cs)}')
    for j, c in enumerate(cs):
        ww = f'{w}.cards[{j}]'
        if c.get('motif') not in MOTIFS: v.e(f'{ww}.motif must be one of ' + '|'.join(MOTIFS))
        _S(v, ww + '.caption', c.get('caption'), 3, 30); _S(v, ww + '.title', c.get('title'), 3, 24); _S(v, ww + '.sub', c.get('sub'), 10, 70); _grp(v, ww + '.group', c.get('group'))
def v_grid(v, g, icons): _grid(v, 'gif.grid', g.get('grid'))
def v_gif(v, g, icons):
    G = SPEC['gif']; tpl = g.get('template', 'hub')
    if tpl not in TEMPLATES: v.e('gif.template must be ' + '|'.join(TEMPLATES)); return
    g['template'] = tpl
    for k in ('title', 'subtitle'): chk_val(v, 'gif.' + k, g.get(k), G[k], icons)
    if 'source' in g: v.w('gif.source is ignored: the GIF no longer shows a source line')
    if tpl == 'framework': return v_framework(v, g, icons)
    if tpl == 'ecosystem': return v_ecosystem(v, g, icons)
    if tpl == 'grid': return v_grid(v, g, icons)
    if tpl in ('exploded', 'isoflow', 'orbit', 'stairs', 'tower', 'skyline', 'conveyor', 'funnel'): return {'exploded': v_exploded, 'isoflow': v_isoflow, 'orbit': v_orbit, 'stairs': v_stairs, 'tower': v_tower, 'skyline': v_skyline, 'conveyor': v_conveyor, 'funnel': v_funnel}[tpl](v, g, icons)
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
