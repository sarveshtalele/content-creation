# Packages and releases

## Versioning

Semantic versioning. One version number lives in four places, and the tests refuse a mismatch:

| File | Field |
|---|---|
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |
| `.codex-plugin/plugin.json` | `version` |
| `CHANGELOG.md` | the top `## x.y.z` heading |

A breaking change, such as renamed commands or paths, bumps the major version (4.0.0 renamed explainer-studio to content-creation).

## Packages

```bash
python3 install.py zip
```

| File | Contents | For |
|---|---|---|
| `dist/content-creation-plugin-<version>.zip` | `.claude-plugin/`, `.codex-plugin/`, `.agent-plugin/plugin.json`, `hooks/`, `commands/`, `skills/content-creation/`, `docs/` (without the demo videos), `install.py`, `install.sh`, README, LICENSE, CHANGELOG, CREDITS, SECURITY | Claude Code, Codex and Antigravity: unzip, then `python3 install.py install`; or a plugin upload |
| `dist/content-creation-skill-<version>.zip` | `content-creation/` (the skill folder only) | ChatGPT Skills > Upload, or any agent that takes a skill folder |
| `dist/SHA256SUMS.txt` | SHA-256 of both zips | verifying a download |

Never packaged:
- `node_modules` (setup installs the runtime)
- `outputs/` (renders), caches, `__pycache__`, render folders
- the test home `_studio_home`, and broken links

`tests/test_content.py` builds the plugin zip and checks its contents.

## Release checklist

1. Bump the version in the four files above and add the `CHANGELOG.md` entry.
2. Run the checks:
   ```bash
   cd skills/content-creation
   for t in tests/test_*.py; do python3 $t || break; done
   python3 scripts/logos.py && python3 scripts/selftest.py
   python3 tests/e2e/run_all.py --only gif,carousel,charts,arch,thumbs,banner,app
   ```
3. Regenerate samples if designs changed: `python3 scripts/studio_jobs.py`, `python3 scripts/gif_samples.py`, `python3 scripts/studio.py catalog`.
4. Commit on `v3`, fast-forward `main`, push both.
5. Build the packages: `python3 install.py zip`.
6. Tag and publish:
   ```bash
   git tag -a v<version> -m "content-creation <version>"
   git push origin v<version>
   gh release create v<version> dist/content-creation-plugin-<version>.zip dist/content-creation-skill-<version>.zip dist/SHA256SUMS.txt \
     --title "content-creation <version>" --notes-file <notes.md>
   ```
7. Reinstall locally: `python3 install.py reinstall`.

## Installing from a release

```bash
curl -LO https://github.com/sarveshtalele/content-creation/releases/download/v<version>/content-creation-plugin-<version>.zip
curl -LO https://github.com/sarveshtalele/content-creation/releases/download/v<version>/SHA256SUMS.txt
shasum -a 256 -c SHA256SUMS.txt --ignore-missing
unzip content-creation-plugin-<version>.zip -d content-creation && cd content-creation
python3 install.py install && python3 skills/content-creation/scripts/setup.py
```
