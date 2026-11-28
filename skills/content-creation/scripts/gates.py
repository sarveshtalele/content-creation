"""Approval gates. The person approves the plan before anything is built, and the reviewed result before finalize.

Approvals come from the person: gate_hook.py records them from the person's own message ("approve plan 7f3a"),
and the Design Studio and editor record them when the person clicks build. Each approval stores the hash of what was
approved (plan.md, or the review token), so a changed plan or a rebuilt result needs a new approval.
The 4-character code is the start of that hash: a stale message cannot approve a newer plan."""
import hashlib, json, os, re, time

from common import data_home
EH = data_home()
ACTIVE = os.path.join(EH, 'active.json')
STAMP = '\n## Approve\n'
STAMP_RE = re.compile(r'\n## Approve\n\nTo approve this plan, the person types exactly: `approve plan [0-9a-f]{4}`\n')
PHRASE = re.compile(r'\s*approve\s+(plan|final)\s+([0-9a-f]{4})\s*[.!]?\s*', re.I)


def _load(p):
    try: return json.load(open(p, encoding='utf-8'))
    except Exception: return {}


def plan_text(work):
    p = os.path.join(work, 'plan.md')
    if not os.path.isfile(p): return ''
    t = STAMP_RE.sub('\n', open(p, encoding='utf-8').read())   # only the exact stamp is left out; any other edit, anywhere, changes the hash
    return t.rstrip() + '\n'


def current(work, gate):
    """Full hash of what this gate approves: plan.md without its approval stamp, or the review token."""
    if gate == 'plan':
        t = plan_text(work); return hashlib.sha256(t.encode()).hexdigest() if t.strip() else ''
    return _load(os.path.join(work, 'out', 'review', 'gates.json')).get('token', '')


def code(work, gate): return current(work, gate)[:4]


def recent():
    """Projects that asked for an approval most recently first (gate and review add them; up to 20)."""
    d = _load(ACTIVE); return d.get('recent') or ([d['work']] if d.get('work') else [])


def set_active(work):
    w = os.path.abspath(work); r = [w] + [x for x in recent() if x != w]
    os.makedirs(EH, exist_ok=True); json.dump({'work': w, 'recent': r[:20], 'at': int(time.time())}, open(ACTIVE, 'w', encoding='utf-8'))


def active(): return _load(ACTIVE).get('work', '')


def stamp(work):
    """Write the approval line at the end of plan.md and make this the active project. Returns the code."""
    c = code(work, 'plan')
    if not c: return ''
    body = plan_text(work)   # read before opening for write (that truncates the file)
    with open(os.path.join(work, 'plan.md'), 'w', encoding='utf-8', newline='\n') as f: f.write(body + STAMP + f'\nTo approve this plan, the person types exactly: `approve plan {c}`\n')
    set_active(work); return c


def approve(work, gate, by, given=None):
    """Record an approval. `given` is the code from the person's message; it must match the current plan or review."""
    cur = current(work, gate)
    if not cur: return False, f'nothing to approve: no {"plan.md" if gate == "plan" else "review"} in {work}'
    if given is not None and given.lower() != cur[:4]: return False, f'code {given} does not match the current {gate} (its code is {cur[:4]}); the {gate} changed, so check it again'
    d = os.path.join(work, '.gates'); os.makedirs(d, exist_ok=True)
    json.dump({'sha': cur, 'by': by, 'at': time.strftime('%Y-%m-%d %H:%M:%S')}, open(os.path.join(d, gate + '.json'), 'w', encoding='utf-8'))
    return True, f'{gate} approved ({cur[:4]}) for {work}'


def check(work, gate):
    rec = _load(os.path.join(work, '.gates', gate + '.json')); cur = current(work, gate)
    if rec.get('sha') and rec['sha'] == cur: return True, ''
    if gate == 'plan':
        if not cur: return False, 'GATE: no plan.md yet. Run studio.py plan DIR, agree the plan with the person, then studio.py gate DIR and wait for their approval.'
        why = 'plan.md changed since it was approved' if rec else 'the plan is not approved yet'
        return False, f'GATE: {why}. Show the person plan.md and ask them to type: approve plan {cur[:4]}  (studio.py gate DIR prints it). Do not build before that.'
    if not cur: return False, 'GATE: run studio.py review first.'
    why = 'the outputs changed since they were approved' if rec else 'the result is not approved yet'
    return False, f'GATE: {why}. Show the person the review sheets and ask them to type: approve final {cur[:4]}'


def from_message(text, by):
    """Approval from the person's own message. Returns a short note, or '' when the message is not an approval."""
    m = PHRASE.fullmatch(text or '')
    if not m: return ''
    gate, given = m.group(1).lower(), m.group(2).lower()
    works = [w for w in recent() if os.path.isdir(w)]
    if not works: return 'content-creation: no project is waiting for an approval (run studio.py gate DIR first).'
    match = [w for w in works if code(w, gate) == given]   # the code picks the project, so another project or a test run cannot take the approval
    ok, msg = approve(match[0], gate, by, given) if match else approve(works[0], gate, by, given)
    return 'content-creation: ' + msg + ('' if ok else '. Not approved.')


def approve_ui(work, by):
    """The person clicked build in the Design Studio or the editor (their own action), or a test/sample job builds a throwaway folder."""
    if not plan_text(work).strip():
        open(os.path.join(work, 'plan.md'), 'w', encoding='utf-8', newline='\n').write(f'# Plan\n\nBuilt by the person from {by}.\n')
    return approve(work, 'plan', by)
