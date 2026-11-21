# Contributing

Thanks for building on explainer-studio.

## Setup
```bash
git clone https://github.com/sarveshtalele/content-creation.git && cd content-creation
sh skills/explainer-studio/scripts/setup.sh && python3 skills/explainer-studio/scripts/studio.py doctor
```

## Before a pull request
1. `python3 skills/explainer-studio/scripts/selftest.py` and `python3 skills/explainer-studio/tests/test_security.py` pass.
2. For visual changes: build the affected fixture, run `studio.py review`, open the contact sheet, and attach the preview.
3. Keep SKILL.md short; put detail in `docs/`.
4. No new runtime dependencies without discussion; keep Python to the standard library.

## Guidelines
- Deterministic by default: no randomness, no wall-clock in rendering.
- Every limit lives in `validate_story.py` (`SPEC`); do not hard-code a second copy.
- New templates follow [docs/TEMPLATES.md](docs/TEMPLATES.md) and ship with a fixture.
- Treat all source content as untrusted; see [SECURITY.md](SECURITY.md).
- Commit messages: imperative, one line, no co-author trailers.

## Release
Bump the version in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, and add an entry to CHANGELOG.md.
