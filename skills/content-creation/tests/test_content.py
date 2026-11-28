"""Unit tests: card grid validation, GIF style previews, narration normalisation, request prompt with a chosen design, studio JS has no leftover template step."""
import os, sys, json, copy, subprocess, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.dirname(HERE); sys.path.insert(0, os.path.join(SK, 'scripts'))
import designs as DS, tts_norm as TN

# --- grid: the design's own sample passes the validator, the 4/6/9 rule and motif list are enforced
def check_story(story, md='fixtures/grid.md'):
    W = tempfile.mkdtemp(); py = sys.executable
    subprocess.run([py, os.path.join(SK, 'scripts', 'studio.py'), 'ingest', os.path.join(SK, md), '--out', W], capture_output=True)
    json.dump(story, open(os.path.join(W, 'story.json'), 'w', encoding='utf-8'))
    r = subprocess.run([py, os.path.join(SK, 'scripts', 'studio.py'), 'check', W], capture_output=True, text=True, encoding='utf-8', errors='replace'); shutil.rmtree(W, ignore_errors=True)
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
js = open(os.path.join(SK, 'studio', 'js', 'media.js'), encoding='utf-8').read(); assert "format: st.mode === 'carousel' ? 'both'" in js and '/api/walk' in js and '/api/cover' in js

# --- request prompt carries the chosen design
import studio_app as SA
src = open(os.path.join(SK, 'scripts', 'studio_app.py'), encoding='utf-8').read()
assert 'GIF template (gif.template' in src and "body.get('design')" in src

# --- narration word cap and pacing constants
import timeline as TL; assert (TL.LEAD, TL.GAP) == (.35, .25) or TL.LEAD < .5
# --- no text CTA strip: the deck carries no 'cta'; the page draws only the brand pill
import carousel as CAR
st, _ = DS.assemble([{'design': i, 'values': DS.BY_ID[i]['sample']} for i in ('cover-bold', 'info-grid', 'info-compare')], None, 'paper', False, 'Sarvesh Talele')
assert not any('cta' in d for d in CAR.compile_deck(st)), CAR.compile_deck(st)
assert "'fr-brand'" in open(os.path.join(SK, 'engine', 'carousel.js'), encoding='utf-8').read() and "'fr-cta'" not in open(os.path.join(SK, 'engine', 'carousel.js'), encoding='utf-8').read()

# --- the plugin zip has the manifests and skills/<name>/SKILL.md at its root (what GitHub and plugin uploaders require)
import zipfile
subprocess.run([sys.executable, os.path.join(SK, '..', '..', 'install.py'), 'zip'], capture_output=True)
ver = json.load(open(os.path.join(SK, '..', '..', '.claude-plugin', 'plugin.json'), encoding='utf-8'))['version']
zp = os.path.join(SK, '..', '..', 'dist', f'content-creation-plugin-{ver}.zip'); names = zipfile.ZipFile(zp).namelist()
assert os.path.isfile(os.path.join(SK, '..', '..', 'dist', 'SHA256SUMS.txt'))
assert '.claude-plugin/plugin.json' in names and '.codex-plugin/plugin.json' in names and 'skills/content-creation/SKILL.md' in names and 'commands/content-creation.md' in names
assert not any('node_modules' in n or '__pycache__' in n or '.film-' in n or '/outputs/' in n or 'docs/media/' in n or 'explainer' in n for n in names)
assert 'hooks/hooks.json' in names and 'skills/content-creation/scripts/gate_hook.py' in names and 'skills/content-creation/data/logos.json' in names
# --- finished files are copied to the outputs folder
import studio as ST
W = tempfile.mkdtemp(); os.makedirs(os.path.join(W, 'out', 'carousel')); os.makedirs(os.path.join(W, 'out', 'review'))
for f in ('out/a.gif', 'out/a.mp4', 'out/a.pdf', 'out/carousel/a-01.png', 'out/eval.json', 'out/review/x.png'): open(os.path.join(W, f), 'wb').write(b'x')
os.environ['CONTENT_CREATION_OUTPUTS'] = os.path.join(W, 'outputs'); od = ST.publish_outputs(W, 'demo')
got = sorted(os.path.relpath(os.path.join(r, f), od).replace(os.sep, '/') for r, _, fs in os.walk(od) for f in fs)
assert got == ['a.gif', 'a.mp4', 'a.pdf', 'carousel/a-01.png'], got
print('CONTENT TESTS OK')
