## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## How it was checked

- [ ] `for t in skills/content-creation/tests/test_*.py; do python3 "$t"; done`
- [ ] `python3 skills/content-creation/scripts/selftest.py` and `python3 skills/content-creation/tests/test_install.py`
- [ ] Works on Windows too: no POSIX-only paths, every `open()` and subprocess text read has `encoding='utf-8'` (`test_platform.py` checks)
- [ ] Approval gates untouched, or the change is covered by `tests/test_gates.py`
- [ ] Visual change: affected media built, `studio.py review` at 100%, contact sheet attached below
- [ ] New design: entry in `scripts/designs.py`, sample rendered (`studio_jobs.py`), `studio.py catalog` regenerated
- [ ] Docs and CHANGELOG updated

## Screens
