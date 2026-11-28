"""evaluate: deterministic accuracy report for a story against its source. Pure standard library.
Metrics (all lexical proxies; semantic review is the agent's job, see references/eval.md):
  claim_support   cited quotes that are verbatim in their chunk            (precision of grounded claims; must be 1.0)
  overlap         share of a beat's content words found in its cited text  (faithfulness proxy; mean + min)
  recall@k, precision@k, MRR   BM25 retrieval of the beat text over all chunks; gold = chunks the beat cites
  coverage        share of the source's salient chunks cited by narration or post (recall of the source)
  ungrounded_entities  numbers/code tokens/proper nouns on screen or in narration that the source never contains"""
import math, re
from common import *
from validate_story import SPEC

def bm25(chunks, k1=1.5, b=0.75):
    docs = [content_words(c['text']) for c in chunks]; N = len(docs); avg = sum(map(len, docs)) / max(1, N); df = {}
    for d in docs:
        for w in set(d): df[w] = df.get(w, 0) + 1
    tfs = []
    for d in docs:
        tf = {}
        for w in d: tf[w] = tf.get(w, 0) + 1
        tfs.append(tf)
    def rank(query):
        q = set(content_words(query)); sc = []
        for i, tf in enumerate(tfs):
            s = 0.0; L = len(docs[i])
            for w in q:
                if w in tf: s += math.log(1 + (N - df[w] + .5) / (df[w] + .5)) * tf[w] * (k1 + 1) / (tf[w] + k1 * (1 - b + b * L / avg))
            sc.append((-s, i))
        sc.sort(); return [chunks[i]['id'] for _, i in sc]
    return rank

def evaluate(story, chunks, full, meta):
    byid = {c['id']: c for c in chunks}; rank = bm25(chunks); T = SPEC['thresholds']
    srcn, srcw = source_index(full); allow = set(cfg('allow.json')['entities'])
    cites = ok = 0; per = []; ks = (1, 3, 5); rec = {k: [] for k in ks}; prec = {k: [] for k in ks}; rr = []; ov = []
    for b in story.get('beats', []):
        cl = b.get('cite', [])
        for c in cl:
            cites += 1; ok += bool(c[0] in byid and norm_q(c[1]) in norm_q(byid[c[0]]['text']))
        if not cl: per.append({'id': b['id'], 'role': b['role'], 'cited': []}); continue
        gold = {c[0] for c in cl if c[0] in byid}; r = rank(b['say'])
        for k in ks:
            top = set(r[:k]); rec[k].append(len(top & gold) / max(1, len(gold))); prec[k].append(len(top & gold) / k)
        first = next((i + 1 for i, cid in enumerate(r) if cid in gold), None); rr.append(1 / first if first else 0.0)
        ref = {w for w in content_words(' '.join(byid[c]['text'] for c in gold) + ' ' + ' '.join(c[1] for c in cl))}
        cw = content_words(b['say']); o = sum(w in ref for w in cw) / max(1, len(cw)); ov.append(o)
        per.append({'id': b['id'], 'role': b['role'], 'cited': sorted(gold), 'rank_of_first_gold': first, 'overlap': round(o, 3)})
    avg = lambda xs: round(sum(xs) / len(xs), 4) if xs else None
    cited_all = {c[0] for b in story.get('beats', []) for c in b.get('cite', [])} | {c for bl in story.get('post', {}).get('bullets', []) for c in bl.get('c', [])}
    sal = [c for c in meta.get('salient', []) if c in byid]; cov = len(set(sal) & cited_all) / max(1, len(sal))
    miss = set()
    strs = [b['say'] for b in story.get('beats', [])]
    for sc in story.get('scenes', []): strs += _strings(sc.get('p', {}))
    strs += _strings(story.get('gif', {})) + _strings(story.get('post', {}))
    for s in strs:
        for e in entities(s):
            if e not in allow and not in_source(e, srcn, srcw): miss.add(e)
    gt = [t for t in _strings(story.get('gif', {})) if len(content_words(t)) >= 3]
    gsup = [sum(w in srcw for w in content_words(t)) / len(content_words(t)) for t in gt]
    gwords = set(w for t in _strings(story.get('gif', {})) for w in content_words(t))
    gcov = (sum(1 for c in sal if len(gwords & set(content_words(byid[c]['text']))) / max(1, len(set(content_words(byid[c]['text'])))) >= .12) / max(1, len(sal))) if gt else None
    rep = {'beats': len(story.get('beats', [])), 'gif_text_support': round(sum(gsup) / len(gsup), 3) if gsup else None, 'gif_text_min': round(min(gsup), 3) if gsup else None, 'gif_coverage': round(gcov, 3) if gcov is not None else None, 'cites': cites, 'claim_support': (round(ok / cites, 4) if cites else 0.0) if story.get('beats') else None,
           'overlap_mean': avg(ov), 'overlap_min': round(min(ov), 3) if ov else None,
           'recall@1': avg(rec[1]), 'recall@3': avg(rec[3]), 'recall@5': avg(rec[5]), 'precision@1': avg(prec[1]), 'precision@3': avg(prec[3]), 'precision@5': avg(prec[5]), 'mrr': avg(rr),
           'coverage': round(cov, 3) if (story.get('beats') or story.get('post')) else None, 'salient': sal, 'cited_chunks': sorted(cited_all), 'ungrounded_entities': sorted(miss), 'per_beat': per}
    fails = []
    if story.get('beats') and rep['claim_support'] < T['claim_support']: fails.append(f'claim_support {rep["claim_support"]} < {T["claim_support"]}')
    if rep['overlap_min'] is not None and rep['overlap_min'] < T['overlap_min']: fails.append(f'weakest beat overlap {rep["overlap_min"]} < {T["overlap_min"]} (beat is not supported by what it cites)')
    if rep['recall@3'] is not None and rep['recall@3'] < T['recall@3']: fails.append(f'recall@3 {rep["recall@3"]} < {T["recall@3"]} (citations point at chunks the beat text does not match)')
    if rep['mrr'] is not None and rep['mrr'] < T['mrr']: fails.append(f'MRR {rep["mrr"]} < {T["mrr"]}')
    if rep['coverage'] is not None and rep['coverage'] < T['coverage']: fails.append(f'coverage {rep["coverage"]} < {T["coverage"]} (uncited salient chunks: {sorted(set(sal) - cited_all)})')
    if len(miss) > T['ungrounded_entities']: fails.append(f'ungrounded entities: {sorted(miss)}')
    if rep['gif_text_min'] is not None and rep['gif_text_min'] < .75: fails.append(f'GIF text not grounded (min support {rep["gif_text_min"]} < 0.75)')
    if rep['gif_coverage'] is not None and rep['gif_coverage'] < .5: fails.append(f'GIF covers only {rep["gif_coverage"]} of the source\'s key ideas (< 0.5): add the missing ideas to the diagram')
    rep['pass'] = not fails; rep['fails'] = fails
    rep['warns'] = [f'beat {p["id"]} overlap {p["overlap"]} < {T["overlap_warn"]}' for p in per if p.get('overlap') is not None and p['overlap'] < T['overlap_warn']]
    return rep

def _strings(o, out=None):
    out = [] if out is None else out
    if isinstance(o, str): out.append(o)
    elif isinstance(o, dict):
        for k, x in o.items():
            if k not in ('icon', 'who', 'group', 'kind', 'cue', 'loop', 'c'): _strings(x, out)
    elif isinstance(o, list):
        for x in o: _strings(x, out)
    return out

def markdown(rep):
    L = ['# Accuracy report', '', f'**{"PASS" if rep["pass"] else "FAIL"}**  ·  beats {rep["beats"]} · citations {rep["cites"]}', '', '| metric | value |', '|---|---|']
    for k in ('claim_support', 'overlap_mean', 'overlap_min', 'recall@1', 'recall@3', 'recall@5', 'precision@1', 'precision@3', 'precision@5', 'mrr', 'coverage', 'gif_text_support', 'gif_text_min', 'gif_coverage'): L.append(f'| {k} | {rep[k]} |')
    L += ['', f'Ungrounded entities: {rep["ungrounded_entities"] or "none"}', '', 'Notes: lexical proxies. recall/precision/MRR test whether each cited chunk is the one a BM25 search for the beat text finds; coverage = salient source chunks that are cited.', '']
    for f in rep['fails']: L.append(f'- FAIL: {f}')
    for w in rep['warns']: L.append(f'- warn: {w}')
    return '\n'.join(L) + '\n'
