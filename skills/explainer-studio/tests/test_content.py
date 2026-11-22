"""Unit tests: card grid validation, GIF style previews, narration normalisation, request prompt with a chosen design, studio JS has no leftover template step."""
import os, sys, json, copy, subprocess, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(HERE); sys.path.insert(0, os.path.join(SK, 'scripts'))
import designs as DS, tts_norm as TN

# --- grid: the design's own sample passes the validator, the 4/6/9 rule and motif list are enforced
def check_story(story, md='fixtures/grid.md'):
    W = tempfile.mkdtemp(); py = sys.executable
    subprocess.run([py, os.path.join(SK, 'scripts', 'studio.py'), 'ingest', os.path.join(SK, md), '--out', W], capture_output=True)
    json.dump(story, open(os.path.join(W, 'story.json'), 'w', encoding='utf-8'))
    r = subprocess.run([py, os.path.join(SK, 'scripts', 'studio.py'), 'check', W], capture_output=True, text=True); shutil.rmtree(W, ignore_errors=True)
    return r.returncode, r.stdout + r.stderr
base = json.load(open(os.path.join(SK, 'fixtures', 'grid.story.json'), encoding='utf-8'))
assert check_story(base)[0] == 0
five = copy.deepcopy(base); five['gif']['grid']['cards'] = five['gif']['grid']['cards'][:5]
rc, out = check_story(five); assert rc != 0 and 'exactly 4, 6 or 9' in out, out
bad = copy.deepcopy(base); bad['gif']['grid']['cards'][0]['motif'] = 'sparkles'
rc, out = check_story(bad); assert rc != 0 and 'motif must be one of' in out, out
six = copy.deepcopy(base); six['gif']['grid']['cards'] = six['gif']['grid']['cards'][:6]; assert check_story(six)[0] == 0

# --- every GIF style has a preview, every design has a thumbnail, the grid design builds a grid slide
for g in DS.GIF_STYLES: assert os.path.isfile(os.path.join(SK, 'studio', 'samples', f'gif-{g["id"]}.jpg')), 'no GIF preview ' + g['id']
kind, frag = DS.BY_ID['info-grid']['build'](DS.BY_ID['info-grid']['sample']); assert kind == 'slide' and frag['type'] == 'grid' and len(frag['cards']) == 9

# --- narration: shouted words are read as words, acronyms are spelled, code marks are dropped
n = TN.norm('Run SKILL.md, NEVER skip the API.'); assert 'N E V E R' not in n and 'never' in n.lower() and 'A P I' in n, n
assert '`' not in TN.norm('use `my_var` now') and '_' not in TN.norm('use `my_var` now')

# --- the studio page: carousel has no template step, both formats are always delivered
html = open(os.path.join(SK, 'studio', 'index.html'), encoding='utf-8').read()
assert 'Pick a cover template' not in html and 'Deliver' not in html
assert 'Create carousel (PDF and images)' in html

# --- request prompt carries the chosen design
import studio_app as SA
src = open(os.path.join(SK, 'scripts', 'studio_app.py'), encoding='utf-8').read()
assert 'GIF template (gif.template' in src and "body.get('design')" in src

# --- narration word cap and pacing constants
import timeline as TL; assert (TL.LEAD, TL.GAP) == (.35, .25) or TL.LEAD < .5
# --- every carousel slide has a call to action, and middle slides point at the next one
import carousel as CAR
st, _ = DS.assemble([{'design': i, 'values': DS.BY_ID[i]['sample']} for i in ('cover-bold', 'info-grid', 'info-compare')], None, 'paper', False, 'Sarvesh Talele')
dk = CAR.compile_deck(st); assert all(d['cta'].strip() for d in dk), [d['cta'] for d in dk]
assert dk[1]['cta'].startswith('Next: ') and dk[-1]['cta'], [d['cta'] for d in dk]
st1, _ = DS.assemble([{'design': 'info-grid', 'values': DS.BY_ID['info-grid']['sample']}], None, 'paper', True, 'x'); assert 'swip' not in ' '.join(d['cta'].lower() for d in CAR.compile_deck(st1))

# --- the plugin zip has the manifests and skills/<name>/SKILL.md at its root (what GitHub and plugin uploaders require)
import zipfile
subprocess.run([sys.executable, os.path.join(SK, '..', '..', 'install.py'), '--plugin-zip'], capture_output=True)
zp = os.path.join(SK, '..', '..', 'explainer-studio-plugin.zip'); names = zipfile.ZipFile(zp).namelist()
assert '.claude-plugin/plugin.json' in names and '.codex-plugin/plugin.json' in names and 'skills/explainer-studio/SKILL.md' in names
print('CONTENT TESTS OK')
