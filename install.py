#!/usr/bin/env python3
"""explainer-studio installer and lifecycle manager. Same on macOS, Linux and Windows; Python 3.9+ standard library only.

usage: python install.py install   [--for claude,codex,antigravity|all] [--project DIR] [--setup]
       python install.py update    [--no-pull]        pull the latest version (fast-forward only), reinstall the same agents
       python install.py reinstall                    remove and install again, same agents
       python install.py uninstall [--for ...] [--purge] [--yes] [--dry-run]
       python install.py clean     [--jobs] [--dry-run]   remove render folders and caches (never your library or brand)
       python install.py status                       what is installed where, and the version
       python install.py zip                          dist/explainer-studio-plugin.zip and dist/explainer-studio-skill.zip

Where each agent gets the skill and the commands:
  claude       ~/.claude/skills/explainer-studio        + ~/.claude/commands/explainer*.md
  codex        ~/.agents/skills/explainer-studio        + ~/.codex/prompts/explainer*.md
  antigravity  ~/.gemini/config/skills/explainer-studio + ~/.gemini/antigravity/global_workflows/explainer*.md
  --project    <DIR>/.agents/skills/explainer-studio    (workspace copy for Codex and Antigravity)
Claude Code can also use the plugin route instead of a copy: claude plugin marketplace add <this folder>, then
claude plugin install explainer-studio@explainer-studio-marketplace (do not use both for Claude)."""
import argparse, json, os, shutil, subprocess, sys, time, zipfile

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'skills', 'explainer-studio'); CMDS = os.path.join(HERE, 'commands')
H = os.path.expanduser('~'); EH = os.environ.get('EXPLAINER_HOME') or os.path.join(H, '.cache', 'explainer-studio'); STATE = os.path.join(EH, 'install.json')
SKIP = {'__pycache__', 'node_modules', '.cache', '.pytest_cache', '_studio_home'}
VERSION = json.load(open(os.path.join(HERE, '.claude-plugin', 'plugin.json'), encoding='utf-8'))['version']
AGENTS = {
    'claude': {'skill': os.path.join(H, '.claude', 'skills', 'explainer-studio'), 'cmds': os.path.join(H, '.claude', 'commands')},
    'codex': {'skill': os.path.join(H, '.agents', 'skills', 'explainer-studio'), 'cmds': os.path.join(H, '.codex', 'prompts')},
    'antigravity': {'skill': os.path.join(H, '.gemini', 'config', 'skills', 'explainer-studio'), 'cmds': os.path.join(H, '.gemini', 'antigravity', 'global_workflows')},
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
    rt = os.path.join(SRC, 'runtime', 'node_modules')            # share the installed runtime instead of copying 100+ MB per agent
    if os.path.isdir(rt):
        try: os.symlink(rt, os.path.join(dst, 'runtime', 'node_modules'), target_is_directory=True)
        except OSError: pass                                     # Windows without developer mode: setup.py installs it in the copy on first run
    say('  skill    ', dst)
def copy_cmds(dst_dir, skill_path):
    os.makedirs(dst_dir, exist_ok=True)
    for f in sorted(os.listdir(CMDS)):
        if f.endswith('.md'):
            t = open(os.path.join(CMDS, f), encoding='utf-8').read().replace('<skill>', skill_path.replace(os.sep, '/'))
            open(os.path.join(dst_dir, f), 'w', encoding='utf-8', newline='\n').write(t); say('  command  ', os.path.join(dst_dir, f))
def our_cmds(d): return [os.path.join(d, f) for f in sorted(os.listdir(CMDS)) if f.endswith('.md') and os.path.isfile(os.path.join(d, f))] if os.path.isdir(d) else []

def install(a):
    st = load_state(); ags = agents_arg(a.for_)
    for ag in ags:
        say(f'[{ag}]'); P = AGENTS[ag]; copy_skill(P['skill']); copy_cmds(P['cmds'], P['skill'])
        if ag not in st['agents']: st['agents'].append(ag)
    if a.project:
        d = os.path.join(os.path.abspath(a.project), '.agents', 'skills', 'explainer-studio'); say('[project]'); copy_skill(d)
        if os.path.abspath(a.project) not in st['projects']: st['projects'].append(os.path.abspath(a.project))
    save_state(st); py = 'python' if os.name == 'nt' else 'python3'
    if a.setup: subprocess.call([sys.executable, os.path.join(SRC, 'scripts', 'setup.py')])
    say(f'\nexplainer-studio {VERSION} installed for: {", ".join(ags) or "-"}.' + ('' if a.setup else f'\nNext, once: {py} "{os.path.join(SRC, "scripts", "setup.py")}"  then  {py} "{os.path.join(SRC, "scripts", "studio.py")}" doctor'))
    say('In your agent: /explainer <url or text>  ·  /explainer-studio (web app)  ·  /explainer-walkthrough  ·  /explainer-setup'); return 0

def uninstall(a):
    st = load_state(); ags = agents_arg(a.for_); gone = []
    for ag in ags:
        P = AGENTS[ag]; gone += ([P['skill']] if os.path.exists(P['skill']) else []) + our_cmds(P['cmds'])
    if a.for_ in (None, 'all'): gone += [p for p in (os.path.join(pr, '.agents', 'skills', 'explainer-studio') for pr in st['projects']) if os.path.exists(p)]
    if a.purge and os.path.isdir(EH): gone.append(EH)
    if not gone: say('Nothing to remove.'); return 0
    say('Will remove:'); [say('  ' + g) for g in gone]
    if a.dry_run: return 0
    if a.purge and not a.yes: say('\n--purge also deletes your brand, library index and Design Studio jobs. Add --yes to confirm.'); return 2
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
    st = load_state(); say(f'explainer-studio {VERSION} (repository: {HERE})')
    for ag, P in AGENTS.items():
        ok = os.path.isfile(os.path.join(P['skill'], 'SKILL.md')); say(f"  {ag:<12} {'installed' if ok else '-':<10} {P['skill'] if ok else ''}  {len(our_cmds(P['cmds']))} command(s)")
    for p in st['projects']: say('  project      ' + p)
    say('  data         ' + EH + (' (brand, library index, studio jobs)' if os.path.isdir(EH) else ' (not created yet)')); return 0

def zips(a):
    dist = os.path.join(HERE, 'dist'); os.makedirs(dist, exist_ok=True)
    def add(z, base, arc):
        if os.path.isfile(base): z.write(base, arc); return
        for r, ds, fs in os.walk(base):
            ds[:] = [d for d in ds if d not in SKIP and not d.startswith('.film-')]
            for f in fs:
                if not f.endswith('.pyc') and f != '.DS_Store': p = os.path.join(r, f); z.write(p, os.path.join(arc, os.path.relpath(p, base)).replace(os.sep, '/'))
    pz = os.path.join(dist, 'explainer-studio-plugin.zip')
    with zipfile.ZipFile(pz, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in ('.claude-plugin', '.codex-plugin', 'commands', 'skills', 'docs', 'install.py', 'install.sh', 'README.md', 'LICENSE', 'CHANGELOG.md', 'CREDITS.md', 'SECURITY.md'): add(z, os.path.join(HERE, k), k)
        z.write(os.path.join(HERE, '.codex-plugin', 'plugin.json'), '.agent-plugin/plugin.json')
    sz = os.path.join(dist, 'explainer-studio-skill.zip')
    with zipfile.ZipFile(sz, 'w', zipfile.ZIP_DEFLATED) as z: add(z, SRC, 'explainer-studio')
    say('created ' + pz + ' (plugin: GitHub release or plugin upload)\ncreated ' + sz + ' (skill only: ChatGPT Skills > Upload)'); return 0

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
