#!/usr/bin/env python3
"""content-creation installer and lifecycle manager. Same on macOS, Linux and Windows; Python 3.9+ standard library only.

usage: python install.py install   [--for claude,codex,antigravity|all] [--project DIR] [--setup]
       python install.py update    [--no-pull]        pull the latest version (fast-forward only), reinstall the same agents
       python install.py reinstall                    remove and install again, same agents
       python install.py uninstall [--for ...] [--purge] [--yes] [--dry-run]
       python install.py clean     [--jobs] [--dry-run]   remove render folders and caches (never your library or brand)
       python install.py status                       what is installed where, and the version
       python install.py zip                          dist/content-creation-plugin-<version>.zip, dist/content-creation-skill-<version>.zip, dist/SHA256SUMS.txt

Where each agent gets the skill and the commands:
  claude       ~/.claude/skills/content-creation        + ~/.claude/commands/content-creation*.md
  codex        ~/.agents/skills/content-creation        + ~/.codex/prompts/content-creation*.md
  antigravity  ~/.gemini/config/skills/content-creation + ~/.gemini/antigravity/global_workflows/content-creation*.md
Each also gets the approval-gate hooks: ~/.claude/settings.json, ~/.codex/hooks.json, ~/.gemini/config/hooks.json
  --project    <DIR>/.agents/skills/content-creation    (workspace copy for Codex and Antigravity)
Claude Code can also use the plugin route instead of a copy: claude plugin marketplace add <this folder>, then
claude plugin install content-creation@content-creation-marketplace (do not use both for Claude)."""
import argparse, json, os, shutil, subprocess, sys, time, zipfile

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'skills', 'content-creation'); CMDS = os.path.join(HERE, 'commands')
H = os.path.expanduser('~')
def data_home():   # same rule as scripts/common.py: before 4.0 the data folder was ~/.cache/explainer-studio; it is moved once
    env = os.environ.get('CONTENT_CREATION_HOME') or os.environ.get('EXPLAINER_HOME')
    if env: return env
    new, old = os.path.join(H, '.cache', 'content-creation'), os.path.join(H, '.cache', 'explainer-studio')
    if not os.path.exists(new) and os.path.isdir(old):
        try: os.rename(old, new)
        except OSError: return old
    return new
EH = data_home(); STATE = os.path.join(EH, 'install.json')
SKIP = {'__pycache__', 'node_modules', '.cache', '.pytest_cache', '_studio_home', 'outputs'}   # outputs: renders made inside the repo, never shipped
VERSION = json.load(open(os.path.join(HERE, '.claude-plugin', 'plugin.json'), encoding='utf-8'))['version']
AGENTS = {
    'claude': {'skill': os.path.join(H, '.claude', 'skills', 'content-creation'), 'cmds': os.path.join(H, '.claude', 'commands')},
    'codex': {'skill': os.path.join(H, '.agents', 'skills', 'content-creation'), 'cmds': os.path.join(H, '.codex', 'prompts')},
    'antigravity': {'skill': os.path.join(H, '.gemini', 'config', 'skills', 'content-creation'), 'cmds': os.path.join(H, '.gemini', 'antigravity', 'global_workflows')},
}

def say(*a): print(*a, flush=True)
def load_state():
    try: return json.load(open(STATE, encoding='utf-8'))
    except Exception: return {'agents': [], 'projects': []}
def save_state(s):
    os.makedirs(EH, exist_ok=True); s['version'] = VERSION; s['at'] = time.strftime('%Y-%m-%d %H:%M'); json.dump(s, open(STATE, 'w', encoding='utf-8'), indent=1)
def agents_arg(v): return list(AGENTS) if v in (None, 'all') else [a.strip() for a in v.split(',') if a.strip() in AGENTS]
def ignore(_d, names): return [n for n in names if n in SKIP or n.endswith('.pyc') or n.startswith('.film-')]

def copy_skill(dst):
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copytree(SRC, dst, ignore=ignore)
    shared = os.path.join(EH, 'node', 'node_modules'); rt = shared if os.path.isdir(shared) else os.path.join(SRC, 'runtime', 'node_modules')   # one runtime for every copy (setup.py installs it once)
    if os.path.isdir(rt):
        link = os.path.join(dst, 'runtime', 'node_modules')
        try: os.symlink(rt, link, target_is_directory=True)
        except OSError:
            if os.name == 'nt': subprocess.run(['cmd', '/c', 'mklink', '/J', link, rt], capture_output=True)   # a junction needs no admin rights or developer mode
    say('  skill    ', dst)
def copy_cmds(dst_dir, skill_path):
    os.makedirs(dst_dir, exist_ok=True)
    for f in sorted(os.listdir(CMDS)):
        if f.endswith('.md'):
            t = open(os.path.join(CMDS, f), encoding='utf-8').read().replace('<skill>', skill_path.replace(os.sep, '/'))
            open(os.path.join(dst_dir, f), 'w', encoding='utf-8', newline='\n').write(t); say('  command  ', os.path.join(dst_dir, f))
# Approval-gate hooks (scripts/gate_hook.py): record "approve plan XXXX" from the person's own message, deny agent edits to gate records.
HOOK_CFG = {'claude': os.path.join(H, '.claude', 'settings.json'), 'codex': os.path.join(H, '.codex', 'hooks.json'), 'antigravity': os.path.join(H, '.gemini', 'config', 'hooks.json')}
TOOLS = {'claude': 'Bash|Write|Edit|MultiEdit|NotebookEdit', 'codex': 'Bash|apply_patch'}
def _ours(h): j = json.dumps(h); return 'gate_hook.py' in j and ('content-creation' in j or 'explainer-studio' in j)   # also the pre-4.0 entries
def register_hooks(ag, skill, on=True):
    f = HOOK_CFG[ag]; py = sys.executable.replace('\\', '/'); hook = os.path.join(skill, 'scripts', 'gate_hook.py').replace('\\', '/')
    try: cfg = json.load(open(f, encoding='utf-8')) if os.path.isfile(f) else {}
    except ValueError: say(f'  hooks     skipped: {f} is not valid JSON (left untouched)'); return
    cmd = lambda ev: {'type': 'command', 'command': f'"{py}" "{hook}" {ev} --harness {ag}', 'timeout': 10}
    if ag == 'antigravity':
        cfg.pop('content-creation-gates', None); cfg.pop('explainer-studio-gates', None)
        if on: cfg['content-creation-gates'] = {'PreInvocation': [cmd('prompt')], 'PreToolUse': [{'matcher': 'run_command', 'hooks': [cmd('tool')]}]}
    else:
        hk = cfg.setdefault('hooks', {})
        for ev in ('UserPromptSubmit', 'PreToolUse'): hk[ev] = [h for h in hk.get(ev, []) if not _ours(h)]
        if on: hk['UserPromptSubmit'].append({'hooks': [cmd('prompt')]}); hk['PreToolUse'].append({'matcher': TOOLS[ag], 'hooks': [cmd('tool')]})
        for ev in ('UserPromptSubmit', 'PreToolUse'):
            if not hk[ev]: hk.pop(ev)
        if not hk: cfg.pop('hooks')
    os.makedirs(os.path.dirname(f), exist_ok=True); tmp = f + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as o: json.dump(cfg, o, indent=2)
    os.replace(tmp, f); say(('  hooks     ' if on else '  unhooked  ') + f + (' (Codex asks you to trust it once: /hooks)' if on and ag == 'codex' else ''))

def our_cmds(d): return [os.path.join(d, f) for f in sorted(os.listdir(CMDS)) if f.endswith('.md') and os.path.isfile(os.path.join(d, f))] if os.path.isdir(d) else []

LEGACY_CMDS = ('explainer.md', 'explainer-studio.md', 'explainer-setup.md', 'explainer-walkthrough.md', 'explainer-update.md', 'explainer-clean.md', 'explainer-uninstall.md')
def remove_legacy(ag):
    """Before 4.0 the plugin was called explainer-studio: remove that copy and its /explainer commands so only one version answers."""
    P = AGENTS[ag]; old = os.path.join(os.path.dirname(P['skill']), 'explainer-studio')
    if os.path.isdir(old) and os.path.isfile(os.path.join(old, 'SKILL.md')): shutil.rmtree(old, ignore_errors=True); say('  removed  ', old, '(old name)')
    for f in LEGACY_CMDS:
        p = os.path.join(P['cmds'], f)
        if os.path.isfile(p) and 'explainer-studio' in open(p, encoding='utf-8', errors='replace').read(): os.remove(p); say('  removed  ', p, '(old name)')

def install(a):
    st = load_state(); ags = agents_arg(a.for_)
    for ag in ags:
        say(f'[{ag}]'); P = AGENTS[ag]; remove_legacy(ag); copy_skill(P['skill']); copy_cmds(P['cmds'], P['skill']); register_hooks(ag, P['skill'])
        if ag not in st['agents']: st['agents'].append(ag)
    if a.project:
        d = os.path.join(os.path.abspath(a.project), '.agents', 'skills', 'content-creation'); say('[project]'); copy_skill(d)
        if os.path.abspath(a.project) not in st['projects']: st['projects'].append(os.path.abspath(a.project))
    save_state(st); py = 'python' if os.name == 'nt' else 'python3'
    if a.setup: subprocess.call([sys.executable, os.path.join(SRC, 'scripts', 'setup.py')])
    say(f'\ncontent-creation {VERSION} installed for: {", ".join(ags) or "-"}.' + ('' if a.setup else f'\nNext, once: {py} "{os.path.join(SRC, "scripts", "setup.py")}"  then  {py} "{os.path.join(SRC, "scripts", "studio.py")}" doctor'))
    say('In your agent: /content-creation <url or text>  ·  /content-creation-studio (web app)  ·  /content-creation-walkthrough  ·  /content-creation-setup'); return 0

def uninstall(a):
    st = load_state(); ags = agents_arg(a.for_); gone = []
    for ag in ags:
        P = AGENTS[ag]; gone += ([P['skill']] if os.path.exists(P['skill']) else []) + our_cmds(P['cmds'])
    if a.for_ in (None, 'all'): gone += [p for p in (os.path.join(pr, '.agents', 'skills', 'content-creation') for pr in st['projects']) if os.path.exists(p)]
    if a.purge and os.path.isdir(EH): gone.append(EH)
    if not gone: say('Nothing to remove.'); return 0
    say('Will remove:'); [say('  ' + g) for g in gone]
    if a.dry_run: return 0
    if a.purge and not a.yes: say('\n--purge also deletes your brand, library index and Design Studio jobs. Add --yes to confirm.'); return 2
    for ag in ags:
        if os.path.exists(AGENTS[ag]['skill']): register_hooks(ag, AGENTS[ag]['skill'], on=False)
        remove_legacy(ag)
    for g in gone:
        if os.path.islink(g) or os.path.isfile(g): os.remove(g)
        else: shutil.rmtree(g, ignore_errors=True)
    if not a.purge: st['agents'] = [x for x in st['agents'] if x not in ags]; st['projects'] = [] if a.for_ in (None, 'all') else st['projects']; save_state(st)
    say('Removed.'); return 0

def clean(a):
    junk = []
    try: projects = json.load(open(os.path.join(EH, 'library_dirs.json'), encoding='utf-8'))
    except Exception: projects = []
    roots = [SRC] + [AGENTS[ag]['skill'] for ag in load_state()['agents']] + projects   # the repo, installed copies, and project folders you built in
    for r in dict.fromkeys(roots):
        if not os.path.isdir(r): continue
        for d, ds, fs in os.walk(r):
            if 'node_modules' in ds: ds.remove('node_modules')
            for x in list(ds):
                if x in ('__pycache__', '.pytest_cache', '_studio_home') or x.startswith('.film-') or (x == '.cache' and d != EH): junk.append(os.path.join(d, x)); ds.remove(x)
            junk += [os.path.join(d, f) for f in fs if f.endswith('.pyc') or f.endswith('.lock') or f == '.DS_Store']
    jobs = os.path.join(EH, 'studio_jobs')
    if a.jobs and os.path.isdir(jobs): junk += [os.path.join(jobs, j) for j in os.listdir(jobs) if time.time() - os.path.getmtime(os.path.join(jobs, j)) > 30 * 86400]
    size = sum(sum(os.path.getsize(os.path.join(p, f)) for p, _, fs in os.walk(j) for f in fs) if os.path.isdir(j) else os.path.getsize(j) for j in junk if os.path.exists(j))
    say(f'{len(junk)} item(s), {size / 1048576:.1f} MB' + (' (dry run)' if a.dry_run else ''))
    for j in junk:
        if a.dry_run: say('  ' + j); continue
        shutil.rmtree(j, ignore_errors=True) if os.path.isdir(j) else os.remove(j)
    return 0

def update(a):
    if not a.no_pull and os.path.isdir(os.path.join(HERE, '.git')):
        if subprocess.run(['git', '-C', HERE, 'status', '--porcelain', '--untracked-files=no'], capture_output=True, text=True).stdout.strip():
            say('Local changes in this folder: commit or stash them, then run update again (nothing was overwritten).'); return 2
        r = subprocess.run(['git', '-C', HERE, 'pull', '--ff-only'], capture_output=True, text=True); say((r.stdout + r.stderr).strip())
        if r.returncode: return r.returncode
        os.execv(sys.executable, [sys.executable, os.path.abspath(__file__), 'reinstall'])   # run the new installer code
    return reinstall(a)

def reinstall(a):
    st = load_state()
    if not st['agents'] and not st['projects']: say('Nothing installed yet: python install.py install'); return 1
    ns = argparse.Namespace(for_=','.join(st['agents']) or 'none', project=None, setup=False)
    if st['agents']: install(ns)
    for p in st['projects']: install(argparse.Namespace(for_='none', project=p, setup=False))
    return 0

def status(a):
    st = load_state(); say(f'content-creation {VERSION} (repository: {HERE})')
    for ag, P in AGENTS.items():
        ok = os.path.isfile(os.path.join(P['skill'], 'SKILL.md')); say(f"  {ag:<12} {'installed' if ok else '-':<10} {P['skill'] if ok else ''}  {len(our_cmds(P['cmds']))} command(s)")
    for p in st['projects']: say('  project      ' + p)
    say('  data         ' + EH + (' (brand, library index, studio jobs)' if os.path.isdir(EH) else ' (not created yet)')); return 0

def zips(a):
    dist = os.path.join(HERE, 'dist'); os.makedirs(dist, exist_ok=True)
    def add(z, base, arc):
        if os.path.isfile(base): z.write(base, arc); return
        for r, ds, fs in os.walk(base):
            ds[:] = [d for d in ds if d not in SKIP and not d.startswith('.film-') and os.path.join(r, d) != os.path.join(HERE, 'docs', 'media')]   # the demo videos stay on GitHub
            for f in fs:
                p = os.path.join(r, f)
                if f in SKIP or not os.path.exists(p): continue   # node_modules links, broken links
                if not f.endswith('.pyc') and f != '.DS_Store': z.write(p, os.path.join(arc, os.path.relpath(p, base)).replace(os.sep, '/'))
    pz = os.path.join(dist, f'content-creation-plugin-{VERSION}.zip')
    with zipfile.ZipFile(pz, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in ('.claude-plugin', '.codex-plugin', 'hooks', 'commands', 'skills', 'docs', 'install.py', 'install.sh', 'README.md', 'LICENSE', 'CHANGELOG.md', 'CREDITS.md', 'SECURITY.md'): add(z, os.path.join(HERE, k), k)
        z.write(os.path.join(HERE, '.codex-plugin', 'plugin.json'), '.agent-plugin/plugin.json')
    sz = os.path.join(dist, f'content-creation-skill-{VERSION}.zip')
    with zipfile.ZipFile(sz, 'w', zipfile.ZIP_DEFLATED) as z: add(z, SRC, 'content-creation')
    import hashlib
    sums = ''.join(f'{hashlib.sha256(open(p, "rb").read()).hexdigest()}  {os.path.basename(p)}\n' for p in (pz, sz))
    open(os.path.join(dist, 'SHA256SUMS.txt'), 'w', encoding='utf-8', newline='\n').write(sums)
    say('created ' + pz + ' (plugin: Claude Code, Codex, Antigravity; GitHub release asset)\ncreated ' + sz + ' (skill only: ChatGPT Skills > Upload)\ncreated ' + os.path.join(dist, 'SHA256SUMS.txt')); return 0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd')
    i = sp.add_parser('install'); i.add_argument('--for', dest='for_', default='all'); i.add_argument('--project'); i.add_argument('--setup', action='store_true')
    u = sp.add_parser('uninstall'); u.add_argument('--for', dest='for_', default='all'); u.add_argument('--purge', action='store_true'); u.add_argument('--yes', action='store_true'); u.add_argument('--dry-run', action='store_true')
    c = sp.add_parser('clean'); c.add_argument('--jobs', action='store_true'); c.add_argument('--dry-run', action='store_true')
    up = sp.add_parser('update'); up.add_argument('--no-pull', action='store_true')
    for n in ('reinstall', 'status', 'zip'): sp.add_parser(n)
    a = ap.parse_args(sys.argv[1:] or ['install'])
    if a.cmd == 'install' and getattr(a, 'for_', None) and a.for_ != 'all' and not agents_arg(a.for_) and a.for_ != 'none': ap.error('--for takes claude, codex, antigravity or all')
    return {'install': install, 'uninstall': uninstall, 'clean': clean, 'update': update, 'reinstall': reinstall, 'status': status, 'zip': zips}[a.cmd](a)

if __name__ == '__main__': sys.exit(main())
