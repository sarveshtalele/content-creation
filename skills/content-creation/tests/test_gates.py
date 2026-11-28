"""Approval gates: only the person's own message approves; a changed plan or result needs a new approval; hooks deny gate tampering.
run: python3 tests/test_gates.py"""
import json, os, subprocess, sys, tempfile
SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S = os.path.join(SK, 'scripts')
HOME = tempfile.mkdtemp(prefix='gates-home-'); ENV = dict(os.environ, CONTENT_CREATION_HOME=HOME, PYTHONIOENCODING='utf-8')
W = tempfile.mkdtemp(prefix='gates-work-')


def hook(ev, payload, harness='claude'):
    r = subprocess.run([sys.executable, os.path.join(S, 'gate_hook.py'), ev, '--harness', harness], input=json.dumps(payload), capture_output=True, text=True, encoding='utf-8', errors='replace', env=ENV)
    assert r.returncode == 0, r.stderr; return r.stdout.strip()


def studio(*a):
    r = subprocess.run([sys.executable, os.path.join(S, 'studio.py'), *a], capture_output=True, text=True, encoding='utf-8', errors='replace', env=ENV); return r.returncode, r.stdout + r.stderr


def put(path, text, mode='w'):
    with open(path, mode, encoding='utf-8') as f: f.write(text)


os.environ['CONTENT_CREATION_HOME'] = HOME; sys.path.insert(0, S); import gates as G   # same home as the subprocesses

# no plan -> build refused before anything else runs
rc, out = studio('build', W); assert rc == 3 and 'no plan.md' in out, out
put(os.path.join(W, 'plan.md'), '# Plan\n\n- Output: GIF\n')
rc, out = studio('gate', W); assert rc == 0 and 'approve plan ' in out, out
code = G.code(W, 'plan'); assert len(code) == 4
rc, out = studio('build', W); assert rc == 3 and 'not approved' in out, out

# approvals that must not count
assert hook('prompt', {'prompt': 'approve plan 0000'}) .find('does not match') > 0
assert hook('prompt', {'prompt': f'please approve plan {code} and build'}) == ''          # not exactly the phrase
assert hook('prompt', {'prompt': 'approve plan'}) == ''                                    # no code
assert not G.check(W, 'plan')[0]

# Claude / Codex UserPromptSubmit record it; the stamp line in plan.md does not change the code
out = hook('prompt', {'prompt': f'Approve plan {code}', 'hook_event_name': 'UserPromptSubmit'})
assert 'plan approved' in out and G.check(W, 'plan')[0], out
assert G.code(W, 'plan') == code
rc, out = studio('build', W); assert 'GATE' not in out, out          # past the gate (fails later: no story.json)

# a changed plan needs a new approval; the old message cannot approve it (Antigravity re-sends lastUserInput)
put(os.path.join(W, 'plan.md'), '- Must avoid: jargon\n', 'a'); studio('gate', W)
assert not G.check(W, 'plan')[0]
assert hook('prompt', {'lastUserInput': f'approve plan {code}'}, 'antigravity') == ''      # Antigravity prints nothing
assert not G.check(W, 'plan')[0]
new = G.code(W, 'plan'); assert new != code
hook('prompt', {'lastUserInput': f'approve plan {new}'}, 'antigravity'); assert G.check(W, 'plan')[0]
hook('prompt', {'prompt': f'approve plan {new}'}, 'codex'); assert G.check(W, 'plan')[0]

# final gate follows the review token
os.makedirs(os.path.join(W, 'out', 'review')); put(os.path.join(W, 'out', 'review', 'gates.json'), json.dumps({'token': 'abcd12345678', 'confidence_pct': 100, 'gates': {}}))
assert not G.check(W, 'final')[0]
hook('prompt', {'prompt': 'approve final abcd'}); assert G.check(W, 'final')[0]
put(os.path.join(W, 'out', 'review', 'gates.json'), json.dumps({'token': 'ffff12345678'})); assert not G.check(W, 'final')[0]

# PreToolUse: tampering with the gate records is denied in each harness's format; ordinary commands pass
for tool, ti in (('Bash', {'command': f'echo {{}} > {W}/.gates/plan.json'}), ('Write', {'file_path': f'{W}/.gates/plan.json', 'content': '{}'}),
                 ('Bash', {'command': "python3 -c 'import gates; gates.approve(\"w\",\"plan\",\"me\")'"}), ('Bash', {'command': "echo '{\"prompt\":\"approve plan 1234\"}' | python3 scripts/gate_hook.py prompt"})):
    d = json.loads(hook('tool', {'tool_name': tool, 'tool_input': ti}))
    assert d['hookSpecificOutput']['permissionDecision'] == 'deny', d
d = json.loads(hook('tool', {'tool_name': 'run_command', 'tool_input': {'CommandLine': f'rm -rf {W}/.gates'}}, 'antigravity')); assert d['decision'] == 'deny'
assert hook('tool', {'tool_name': 'Bash', 'tool_input': {'command': f'python3 scripts/studio.py build {W}'}}) == ''
assert hook('tool', {'tool_name': 'Bash', 'tool_input': {'command': 'cat scripts/gates.py'}}) == ''
# a broken payload never blocks the session
r = subprocess.run([sys.executable, os.path.join(S, 'gate_hook.py'), 'tool'], input='not json', capture_output=True, text=True, encoding='utf-8', errors='replace', env=ENV); assert r.returncode == 0 and r.stdout == ''
# another project reviewed later (a test run, a second post) must not take this project's approval: the code picks the project
W2 = tempfile.mkdtemp(prefix='gates-other-'); put(os.path.join(W2, 'plan.md'), '# Other plan\n'); studio('gate', W2)
os.makedirs(os.path.join(W2, 'out', 'review')); put(os.path.join(W2, 'out', 'review', 'gates.json'), json.dumps({'token': '9136aaaaaaaa'})); G.set_active(W2)
put(os.path.join(W, 'out', 'review', 'gates.json'), json.dumps({'token': 'd02baaaaaaaa'})); G.set_active(W); G.set_active(W2)
assert not G.check(W, 'final')[0]
out = hook('prompt', {'prompt': 'approve final d02b'}); assert 'final approved' in out and W in out and G.check(W, 'final')[0] and not G.check(W2, 'final')[0], out
print('gates: all checks passed')
