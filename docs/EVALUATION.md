# Evaluation and accuracy

What is measured, what is enforced, and what the numbers mean.

## Story checks (`studio.py check`)

| Metric | Meaning | Gate |
|---|---|---|
| claim_support | share of beats whose cited quote is verbatim in the cited chunk | threshold in `evaluate.py` |
| overlap | lexical overlap between each beat and its cited chunk | mean threshold |
| recall@k | BM25 retrieval of the cited chunk for each claim, top k | threshold |
| precision@k | share of retrieved top-k chunks that are cited | reported |
| MRR | mean reciprocal rank of the cited chunk | threshold |
| coverage | share of the source's most salient chunks that the story uses | threshold |
| entity groundedness | names, numbers, versions in the story that appear in the source | no ungrounded terms |
| gif_text_support | share of GIF words found in the source | at least 0.75 |
| gif_coverage | salient source chunks reflected in the GIF | reported |

These are lexical proxies. They catch invented names, numbers and unsupported wording; they cannot prove that a paraphrase is true.

## Review gates (`studio.py review`)

Story check, accuracy report, GIF 4:5 / size / layout / readability / animation, Reel 1080x1920 / audio / duration / loudness / true peak / speech-to-text match, post CTA lines. Any failure blocks `finalize`.

`check` also enforces the logo rule: every `logo:NAME` must be a known logo and its technology must be named in the source ([LOGOS.md](LOGOS.md)).

## Approval gates

Before any of this, the person approves the plan (`approve plan XXXX`), and after review the result (`approve final XXXX`). `build`, `thumbs` and `cover` exit 3 without the first; `finalize` without the second. See [APPROVAL_GATES.md](APPROVAL_GATES.md).

## Attestation

At 100% gates, the reviewer opens `out/review/*.png` and writes `attest.json` with the token printed by `review` and four true/false checks: text legible, nothing overlaps or is clipped, matches the source, arrows follow the logic. `finalize` verifies the token against the current file hashes, so any rebuild after review requires a new review.

## Automated tests

| Test | Covers |
|---|---|
| `tests/test_gates.py` | approvals only from the exact phrase and the current code; a changed plan or result needs a new approval; Claude Code, Codex and Antigravity payloads; tampering denied in each agent's format; broken payloads never block |
| `tests/test_content.py` | design registry, story building, the plugin package contents (versioned zip, checksums, hooks, logos, no old names) |
| `tests/test_platform.py` | portability (encodings, paths) and the version in every manifest and the changelog |
| `tests/test_security.py` | SSRF guard, secret redaction, safe file handling |
| `tests/test_studio.py` | the Design Studio server: tokens, hosts, sample stories |
| `tests/test_matrix.py` | the decision matrix |
| `scripts/logos.py` | logo resolution, the grounding rule, logo collection from a story |
| `scripts/selftest.py` | every fixture ingests, checks and picks; a build without an approved plan is refused |
| `tests/e2e/run_all.py` | real renders of every media: GIFs (including stage panels with logos), carousel, 21 chart slides, five architecture styles, 25 thumbnails, the newsletter banner at three sizes, Reel, walkthrough, and a Playwright tour of the Design Studio |

## Known limits

- A visual check by a model or person looking at stills can miss subtle issues in frames it did not sample.
- Speech-to-text verification needs the optional ASR model (`python3 scripts/setup.py asr`); without it the speech gate fails rather than passing silently.
- Source fidelity depends on the source; the plugin does not fact-check the source itself.

## Layout checks on the final frame (GIF)

Besides the per-frame checks (overflow, leak, overlap, safe area), the validator inspects the finished frame:

| Check | Fails when |
|---|---|
| `BOX-OVERLAP` | two boxes overlap by more than 6x6 px and one is not inside the other (bands and section headers set `bg` and are exempt) |
| `EMPTY-CARD` | a card taller than 100 px leaves more than 32% of its height empty above or below its text (round hubs are exempt) |

A GIF is only finalized when both pass, the contact sheets have been looked at, and the attest token matches.
