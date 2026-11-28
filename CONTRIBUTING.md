# Contributing

Thanks for building on content-creation.

## Setup
```bash
git clone https://github.com/sarveshtalele/content-creation.git && cd content-creation
python3 skills/content-creation/scripts/setup.py && python3 skills/content-creation/scripts/studio.py doctor
```

Windows: use `py -3` instead of `python3` and `\` in paths.

## Before a pull request
1. All unit tests and the self-test pass: `for t in skills/content-creation/tests/test_*.py; do python3 "$t"; done`, `python3 skills/content-creation/scripts/logos.py`, `python3 skills/content-creation/tests/test_install.py` and `python3 skills/content-creation/scripts/selftest.py`. CI runs them on Windows, macOS and Linux with Python 3.11, 3.12 and 3.13, then renders end to end on all three systems.
   For engine or web-app changes, also run `python3 skills/content-creation/tests/e2e/run_all.py` (every media with gates and evaluations, plus the Playwright app tour) and attach its REPORT.md summary.
2. For visual changes: build the affected fixture, run `studio.py review`, open the contact sheet, and attach the preview.
3. Keep SKILL.md short; put detail in `docs/`.
4. No new runtime dependencies without discussion; keep Python to the standard library.

## Guidelines
- New designs: add an entry to `scripts/designs.py`, render its sample with `python3 scripts/studio_jobs.py`, and run `studio.py catalog` so the design catalogue shows it.
- Agents never build before the person chooses a design and approves the plan; keep those rules in `SKILL.md` and `commands/content-creation.md`, and never weaken `scripts/gates.py` or `scripts/gate_hook.py`.
- Official logos only for technologies the source names (`scripts/logos.py`); new bundled logos must be CC0 or similarly free to redistribute.
- Deterministic by default: no randomness, no wall-clock in rendering.
- Every limit lives in `validate_story.py` (`SPEC`); do not hard-code a second copy.
- New templates follow [docs/TEMPLATES.md](docs/TEMPLATES.md) and ship with a fixture.
- Treat all source content as untrusted; see [SECURITY.md](SECURITY.md).
- Commit messages: imperative, one line, no co-author trailers.

## Community
Be kind and constructive: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Use the issue templates for bugs and design requests; report security problems privately ([SECURITY.md](SECURITY.md)).

## Release
See [docs/RELEASING.md](docs/RELEASING.md): bump the version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, add a CHANGELOG.md entry, build the packages with `python3 install.py zip`, and publish a GitHub release with the zips and `SHA256SUMS.txt`.
