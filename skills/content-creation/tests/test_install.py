"""Installer on any OS, in a throwaway home: install for every agent, upgrade from explainer-studio 3.x, hooks merged with
the person's own (no duplicates), uninstall removes only ours. run: python tests/test_install.py"""
import json, os, subprocess, sys, tempfile
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
H = tempfile.mkdtemp(prefix='install-home-')
ENV = {k: v for k, v in os.environ.items() if k not in ('CONTENT_CREATION_HOME', 'EXPLAINER_HOME')}
ENV.update(HOME=H, USERPROFILE=H, PYTHONIOENCODING='utf-8')   # expanduser reads HOME on macOS/Linux, USERPROFILE on Windows
J = lambda *p: os.path.join(H, *p)


def put(p, text):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f: f.write(text)


def inst(*a):
    r = subprocess.run([sys.executable, os.path.join(R, 'install.py'), *a], capture_output=True, text=True, encoding='utf-8', errors='replace', env=ENV)
    assert r.returncode == 0, r.stdout + r.stderr; return r.stdout


def hooks(f): return json.load(open(f, encoding='utf-8'))


# a 3.x install: old skill, old command, old data folder, an old hook entry next to the person's own
put(J('.claude', 'skills', 'explainer-studio', 'SKILL.md'), 'old')
put(J('.claude', 'commands', 'explainer.md'), 'Use the explainer-studio skill')
put(J('.claude', 'commands', 'mine.md'), 'my own command')
put(J('.cache', 'explainer-studio', 'brand.json'), '{"name": "Me"}')
put(J('.claude', 'settings.json'), json.dumps({'model': 'x', 'hooks': {'UserPromptSubmit': [
    {'hooks': [{'type': 'command', 'command': 'python3 /old/explainer-studio/scripts/gate_hook.py --harness claude'}]},
    {'hooks': [{'type': 'command', 'command': 'mine.sh'}]}]}}))

out = inst('install'); inst('install')   # twice: no duplicates
assert 'installed for: claude, codex, antigravity' in out, out
for skill in (J('.claude', 'skills', 'content-creation'), J('.agents', 'skills', 'content-creation'), J('.gemini', 'config', 'skills', 'content-creation')):
    assert os.path.isfile(os.path.join(skill, 'SKILL.md')) and os.path.isfile(os.path.join(skill, 'scripts', 'gate_hook.py')), skill
assert not os.path.exists(J('.claude', 'skills', 'explainer-studio')) and not os.path.exists(J('.claude', 'commands', 'explainer.md'))
assert os.path.isfile(J('.claude', 'commands', 'content-creation.md')) and os.path.isfile(J('.claude', 'commands', 'mine.md'))
assert json.load(open(J('.cache', 'content-creation', 'brand.json'), encoding='utf-8'))['name'] == 'Me' and not os.path.exists(J('.cache', 'explainer-studio'))

cl = hooks(J('.claude', 'settings.json')); ups = [h['hooks'][0]['command'] for h in cl['hooks']['UserPromptSubmit']]
assert cl['model'] == 'x' and 'mine.sh' in ups and sum('gate_hook.py' in c for c in ups) == 1 and not any('explainer-studio' in c for c in ups), ups
assert sum('gate_hook.py' in json.dumps(h) for h in cl['hooks']['PreToolUse']) == 1
cx = hooks(J('.codex', 'hooks.json')); assert 'UserPromptSubmit' in cx['hooks'] and 'PreToolUse' in cx['hooks']
ag = hooks(J('.gemini', 'config', 'hooks.json')); assert set(ag['content-creation-gates']) == {'PreInvocation', 'PreToolUse'}

# the registered hook command runs on this OS and records nothing for an ordinary message
cmd = cl['hooks']['UserPromptSubmit'][-1]['hooks'][0]['command']
r = subprocess.run(cmd, shell=True, input='{"prompt": "hello"}', capture_output=True, text=True, encoding='utf-8', errors='replace', env=ENV)
assert r.returncode == 0 and r.stdout.strip() == '', (cmd, r.stdout, r.stderr)

assert 'claude' in inst('status')
inst('uninstall')
for skill in (J('.claude', 'skills', 'content-creation'), J('.agents', 'skills', 'content-creation')): assert not os.path.exists(skill)
cl = hooks(J('.claude', 'settings.json')); assert json.dumps(cl).count('gate_hook.py') == 0 and 'mine.sh' in json.dumps(cl) and cl['model'] == 'x'
assert os.path.isfile(J('.claude', 'commands', 'mine.md')) and os.path.isfile(J('.cache', 'content-creation', 'brand.json'))   # never the person's own files
print('install: all checks passed')
