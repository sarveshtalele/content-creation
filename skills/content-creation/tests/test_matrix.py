"""v3 tests: decision matrix ranks and explains every GIF template, chart slides validate against their limits, data charts refuse
figures that are not in the source, the hook library covers every kind, and the Reel cover offers only layouts the story supports."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(HERE); sys.path.insert(0, os.path.join(SK, 'scripts'))
import matrix as MX, designs as DS, validate_story as VS, hooks as HK, cover as CV
fails = []
def ok(c, m):
    if not c: fails.append(m)

# matrix: funnel source -> narrowing shape on top, funnel in the GIF top 3, every template ranked with a reason
src = open(os.path.join(SK, 'fixtures', 'funnel.md'), encoding='utf-8').read()
R = MX.recommend(src, recent=[])
ok(R['shapes'][0]['id'] == 'narrowing', 'funnel source should rank "narrowing" first, got ' + R['shapes'][0]['id'])
ok('funnel' in [g['template'] for g in R['gif'][:3]], 'funnel template should be in the GIF top 3')
ok(len(R['gif']) >= 15 and all(g['why'] for g in R['gif'] if g['score'] > 0), 'GIF ranking must list every template with a reason')
ok(any(c['type'] == 'cone' for c in R['carousel']), 'narrowing content should propose the cone slide')
ok(MX.recommend(src, recent=['funnel'])['gif'][0]['score'] < R['gif'][0]['score'] or R['gif'][0]['template'] != 'funnel', 'a recently used template must be penalised')
nonum = MX.recommend('Agents plan, call tools, then verify. First read the task, then edit files, finally run the tests. ' * 20, recent=[])
ok(not any(s['needs_numbers'] and s['score'] > 0 for s in nonum['shapes']), 'data shapes must score 0 without figures in the source')

# every chart design sample passes the validator when its own words are the source
for d in DS.DESIGNS:
    if d['group'] not in ('chart', 'architecture'): continue
    story, text = DS.assemble([{'design': d['id'], 'values': d['sample']}], None, 'paper', True, 'Test')
    err, _ = VS.validate(story, [{'id': 'c01', 'h': '', 'text': text, 's': 1.0}], text)
    ok(not err, f"{d['id']} sample fails validation: {err[:3]}")

# an invented figure is refused; a figure from the source passes
def donut(v):
    return {'meta': {'title': 'Token use', 'slug': 'token-use'}, 'carousel': {'hook_style': 'plain', 'theme': 'paper', 'single': True, 'short': True,
            'title': {'layout': 'classic', 'hook': 'Where the tokens go in a session', 'icon': 'chart'}, 'slides': [{'type': 'donut', 'title': 'Where the tokens go',
            'parts': [{'label': 'Reading files', 'value': v, 'pct': 48}, {'label': 'Answers', 'value': '10%', 'pct': 10}]}], 'closing': {'kind': 'follow', 'title': 'What will you try first?', 'lines': []}}}
text = 'Where the tokens go in a session: reading files takes 48% and answers take 10%. What will you try first? Test'
ch = [{'id': 'c01', 'h': '', 'text': text, 's': 1.0}]
ok(not VS.validate(donut('48%'), ch, text)[0], 'a figure from the source must pass')
ok(any('not in the source' in e for e in VS.validate(donut('63%'), ch, text)[0]), 'an invented figure must be refused')

# shape rules beyond limits
bad = {'type': 'sankey', 'title': 'Loop', 'flows': [{'from': 'A', 'to': 'Bb', 'num': 1}, {'from': 'Bb', 'to': 'Cc', 'num': 1}, {'from': 'Cc', 'to': 'A', 'num': 1}]}
v = VS.V(); VS.chart_extra(v, 's', bad); ok(any('loop back' in e for e in v.err), 'sankey loops must be refused')

# hooks: every kind returns suggestions, matrix families get a boost
for k in ('carousel', 'line', 'visual', 'format', 'structure'): ok(len(HK.suggest(src, k, 4)) >= 2, 'hooks kind ' + k)
ok(HK.suggest('nothing in common', 'visual', 1, ['Split screen'])[0]['text'].startswith('Split screen'), 'matrix family must be boosted')

# reel cover: number layout only with a real figure
st = {'meta': {'title': 't', 'slug': 't'}, 'scenes': [{'p': {'q': 'Can an agent fix bugs?', 'sub': 'Read, plan, edit', 'chips': ['Read']}}, {'p': {'title': 'Steps', 'steps': [{'label': 'Read'}, {'label': 'Plan'}, {'label': 'Edit'}]}}]}
ok('number' not in CV.data(st)['layouts'], 'no number cover without a figure')
st['scenes'][0]['p']['sub'] = 'Fixes 73% of bugs'
ok('number' in CV.data(st)['layouts'] and CV.data(st)['number']['value'] == '73%', 'number cover uses the real figure')

# architecture: unknown edge targets and crowded zones are refused
A = {'style': 'cloud', 'zones': [{'title': 'Services'}], 'nodes': [{'id': f'n{i}', 'title': f'Node {i}', 'zone': 0} for i in range(7)], 'edges': [{'from': 'n0', 'to': 'nope'}]}
v = VS.V(); VS.check_arch(v, 'a', A, set(VS.icon_names()))
ok(any('more than 6 nodes' in e for e in v.err) and any('edges[0]' in e for e in v.err), 'arch must refuse crowded zones and unknown edge targets: ' + str(v.err[:3]))
v = VS.V(); VS.check_arch(v, 'a', {'style': 'sequence', 'actors': [{'title': 'You'}, {'title': 'App'}], 'messages': [{'from': 0, 'to': 5, 'text': 'Hello there'}, {'from': 1, 'to': 0, 'text': 'Hi back'}]}, set(VS.icon_names()))
ok(any('actor indexes' in e for e in v.err), 'sequence must refuse unknown actors')

# thumbnails: layouts only when the story supports them; the thumbnail's own figure wins
import json
ts = json.load(open(os.path.join(SK, 'fixtures', 'thumbs.story.json'), encoding='utf-8'))
td = CV.thumb_data(ts, 'youtube'); ok(set(td['layouts']) == {'face', 'number', 'diagram', 'versus', 'editorial'}, 'all five thumb layouts for the rich fixture: ' + str(td['layouts']))
ok(td['number']['value'] == '72%', 'thumb number comes from thumb.text: ' + str(td.get('number')))
ok([s['head'] for s in td['split']] == ['What blocks people', 'What gets them through'], 'versus compares the two lists, not the flow')
plain = {'meta': {'title': 't', 'slug': 't'}, 'scenes': [{'p': {'q': 'Is TLS 1.3 faster?', 'sub': ''}}]}
ok(set(CV.thumb_data(plain, 'og')['layouts']) == {'face', 'editorial'}, 'no number layout for a version number like 1.3')

print('MATRIX TESTS OK' if not fails else 'MATRIX TESTS FAILED:\n  ' + '\n  '.join(fails)); sys.exit(1 if fails else 0)
