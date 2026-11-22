#!/usr/bin/env python3
"""Install the explainer-studio skill for Codex, Antigravity, Gemini CLI and Claude Code. Same on macOS, Linux and Windows.
usage: python install.py [project-dir]     copy the skill to every agent location (+ the project's .agents/skills)
       python install.py --zip             build explainer-studio-skill.zip (ChatGPT: Skills > Create > Upload) and explainer-studio-plugin.zip (GitHub / plugin upload)"""
import os, shutil, sys, zipfile
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'skills', 'explainer-studio')
SKIP = ('__pycache__', 'node_modules', '.cache')
def ignore(_d, names): return [n for n in names if n in SKIP or n.endswith('.pyc')]

def zip_skill():
    out = os.path.join(HERE, 'explainer-studio-skill.zip')
    if os.path.exists(out): os.remove(out)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(SRC):
            dirs[:] = [d for d in dirs if d not in SKIP]
            for f in files:
                if f.endswith('.pyc'): continue
                p = os.path.join(root, f); z.write(p, os.path.join('explainer-studio', os.path.relpath(p, SRC)).replace(os.sep, '/'))
    print('created', out, '(upload it in ChatGPT: Skills > Create > Upload)')

def zip_plugin():
    """The whole plugin (manifests at the root, skills/<name>/SKILL.md), which is what GitHub and plugin uploaders expect; the skill zip above has the skill folder at its root and is only for ChatGPT."""
    out = os.path.join(HERE, 'explainer-studio-plugin.zip')
    if os.path.exists(out): os.remove(out)
    keep = ['.claude-plugin', '.codex-plugin', 'skills', 'docs', 'README.md', 'LICENSE', 'CHANGELOG.md', 'CREDITS.md', 'SECURITY.md']
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for k in keep:
            base = os.path.join(HERE, k)
            if os.path.isfile(base): z.write(base, k); continue
            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if d not in SKIP]
                for f in files:
                    if f.endswith('.pyc'): continue
                    p = os.path.join(root, f); z.write(p, os.path.relpath(p, HERE).replace(os.sep, '/'))
        m = os.path.join(HERE, '.codex-plugin', 'plugin.json')
        z.write(m, '.agent-plugin/plugin.json')      # same manifest for agents that look for .agent-plugin
    print('created', out, '(plugin archive: upload to GitHub or a plugin marketplace)')

def put(dst):
    shutil.rmtree(dst, ignore_errors=True); os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copytree(SRC, dst, ignore=ignore); print('installed:', dst)

def main():
    a = sys.argv[1:]
    if a[:1] == ['--zip']: zip_skill(); return zip_plugin()
    if a[:1] == ['--plugin-zip']: return zip_plugin()
    H = os.path.expanduser('~'); P = a[0] if a else ''
    put(os.path.join(H, '.agents', 'skills', 'explainer-studio'))                          # Codex (user)
    put(os.path.join(H, '.gemini', 'config', 'skills', 'explainer-studio'))                # Antigravity (global)
    put(os.path.join(H, '.claude', 'skills', 'explainer-studio'))                          # Claude Code (user skill)
    if os.path.isdir(os.path.join(H, '.gemini')): put(os.path.join(H, '.gemini', 'antigravity-cli', 'skills', 'explainer-studio'))   # Antigravity CLI
    if P: put(os.path.join(P, '.agents', 'skills', 'explainer-studio'))                    # Codex + Antigravity (workspace)
    py = 'python' if os.name == 'nt' else 'python3'; s = os.path.join(SRC, 'scripts')
    print(f'Next (once, shared by every installed copy):\n  {py} "{os.path.join(s, "setup.py")}"\n  {py} "{os.path.join(s, "studio.py")}" doctor')
    print(f'Claude Code plugin route: claude plugin marketplace add "{HERE}"')
if __name__ == '__main__': main()
