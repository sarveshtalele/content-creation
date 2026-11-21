<div align="center">

# explainer-studio

**Paste a source. Get one grounded, on-brand LinkedIn diagram GIF. Ask for a Reel or a post only when you want one.**

Works in Claude Code, Codex, Antigravity and Gemini CLI from one skill folder. ChatGPT is supported for the text steps only.

`6 diagram templates` · `1080x1350 LinkedIn portrait` · `flowing-dot arrows` · `grounded in the source` · `review gate before delivery`

</div>

---

## What it does

You paste an article, essay, URL or GitHub repo. The plugin reads it once, **picks the diagram that fits the shape of the content**, and renders one animated GIF in your personal brand. A male-voice narrated Reel (MP4) and a LinkedIn post are built **only if you ask**.

| You say | You get |
|---|---|
| *"Make a LinkedIn diagram from this"* (or just paste a source) | 1 GIF, 1080x1350, animated |
| *"...and a video"* / *"make a Reel"* | + narrated 1080x1920 MP4, subtitles, poster |
| *"...and a post"* | + LinkedIn post with arrow bullets, link, closing CTA |

Nothing is delivered until every automated gate passes **and** a reviewer has looked at the contact sheets (see [Review gate](#review-gate)).

## The six diagrams

The plugin chooses one with `studio.py pick` (a deterministic score over the source's wording and structure). The agent may override with a reason.

| Template | Best for | Preview |
|---|---|---|
| **pipeline** | ordered steps, workflows, request paths | <img src="docs/img/pipeline.jpg" width="190"> |
| **columns** | a catalogue grouped by category | <img src="docs/img/columns.jpg" width="190"> |
| **lanes** | layers of a stack | <img src="docs/img/lanes.jpg" width="190"> |
| **hub** | one concept with named parts | <img src="docs/img/hub.jpg" width="190"> |
| **ecosystem** | one core fanning out to 3-5 sections | <img src="docs/img/ecosystem.jpg" width="190"> |
| **framework** | a 6 or 9 part framework, each part a mini-diagram, plus takeaways | <img src="docs/img/framework.jpg" width="190"> |

Every template shares the header, palette, flowing-dot arrows (the dots travel along each arrow so the diagram reads as a running workflow) and the "Follow Sarvesh Talele" footer. The Claude spark appears only when the source mentions Claude. Details and how to add your own: [docs/TEMPLATES.md](docs/TEMPLATES.md).

## How it works

```mermaid
flowchart LR
  S[Source<br/>URL, repo, text, file] --> I[ingest<br/>chunks + ids, secrets redacted]
  I --> P[pick<br/>best template + skeleton]
  P --> A[Agent writes story.json<br/>the only LLM step]
  A --> C{check<br/>schema, grounding,<br/>metrics}
  C -- fix list --> A
  C -- OK --> B[build<br/>GIF / Reel / post]
  B --> R{review<br/>deterministic gates<br/>+ contact sheets}
  R -- failed gate --> A
  R -- 100% --> V[Agent looks at the sheets<br/>writes attest.json]
  V --> F[finalize<br/>final/ folder]
```

The model is used for exactly one thing: writing a compact `story.json` from the source. Everything else (ingest, template choice, validation, voice, rendering, measurement, review) is code, so the same input produces the same output.

**Token budget.** The agent reads the source once, runs `pick` (about 250 tokens: template, limits, fill-in skeleton), writes only the content, and sees only failures from `check`/`review`. GIF-only runs skip the narration schema entirely. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Install

Needs `node >= 20`, `python >= 3.9`, `ffmpeg >= 7`, `git`.

```bash
git clone https://github.com/sarveshtalele/content-creation.git && cd content-creation
sh install.sh [project-dir]                       # copies the skill to every supported agent location
sh skills/explainer-studio/scripts/setup.sh       # one time: headless browser, voice model (checksum-verified), python packages
python3 skills/explainer-studio/scripts/studio.py doctor     # must print READY
```

| Platform | Where the skill lives | How |
|---|---|---|
| **Claude Code** | `~/.claude/skills/` or as a plugin | `claude plugin marketplace add ./content-creation` then `/plugin install explainer-studio@explainer-studio-marketplace`, or `sh install.sh` |
| **Codex** | `~/.agents/skills/` or `<repo>/.agents/skills/` | `sh install.sh /path/to/project`, restart Codex, say `$explainer-studio` or describe the task |
| **Antigravity** | `~/.gemini/config/skills/`, `<workspace>/.agents/skills/`; CLI: `~/.gemini/antigravity-cli/skills/` | `sh install.sh /path/to/project` |
| **Gemini CLI** | `~/.gemini/skills/` or `~/.agents/skills/`; workspace `.gemini/skills/` | `sh install.sh` or `gemini skills link ./content-creation/skills`; verify with `/skills list` |
| **ChatGPT** | Skills > Create > Upload | `sh install.sh --zip`, upload `explainer-studio-skill.zip` |

**ChatGPT limits.** Its sandbox usually cannot download the browser and voice model. Use it for the grounded story, validation, accuracy report and post; build GIFs and Reels in one of the local agents.

## Use it

Tell your agent what you want and paste the source:

> *Create a LinkedIn diagram from https://github.com/owner/repo*
> *Make a Reel from this article* (male narrator, 90 seconds or less)
> *GIF and post from this essay*

If you give a source and no artifact, you get the GIF. The agent runs the pipeline in [SKILL.md](skills/explainer-studio/SKILL.md). To drive it yourself:

```bash
S=skills/explainer-studio/scripts/studio.py
python3 $S ingest <URL|owner/repo|file|dir|-> --out work     # chunks the source (public hosts only)
python3 $S pick work                                          # best template + limits + skeleton
# write work/story.json (see the skeleton), then:
python3 $S check work                                         # repeat until CHECK OK
python3 $S build work                                         # gif by default; --artifacts reel,gif,post|all
python3 $S review work                                        # gates + contact sheets in work/out/review/
python3 $S finalize work                                      # after attest.json; copies to work/final/
```

Command reference: `doctor | spec [--icons] | ingest | pick | check | eval | post | build | review | finalize`.

## Review gate

`review` runs deterministic gates and prints only the ones that fail:

| Area | Gates |
|---|---|
| Story | schema and limits, every claim cited with a verbatim quote, ungrounded names or numbers rejected, accuracy metrics above thresholds |
| GIF | exactly 4:5, size under 5 MB, text legible long enough, nothing overlapping or leaking, arrows animating |
| Reel | 1080x1920, audio present, 90 s or less, loudness -16..-12 LUFS, true peak, speech-to-text matches every script line |
| Post | exact closing CTA lines |

At 100% it writes contact sheets. The reviewer opens them and confirms legibility, no clipping, fidelity to the source and arrow logic in `attest.json`. `finalize` refuses unless gates are 100% and the attestation token matches the current files. Metrics are lexical proxies for faithfulness, not proof of truth; the visual check is a look at stills. See [docs/EVALUATION.md](docs/EVALUATION.md).

## Voice

The Reel uses Kokoro (offline, Apache-2.0) with the male voice `am_michael`. Change `voice` and `speed` in [`config/brand.json`](skills/explainer-studio/config/brand.json); `am_onyx`, `bm_george` and others are available. Narration follows a fixed arc: question hook, stakes, answer, how, proof, takeaway, then a question or challenge to the viewer.

## Customise

| I want to... | Edit |
|---|---|
| change name, tagline, avatar, post CTA, voice | `skills/explainer-studio/config/brand.json`, `assets/` |
| add a diagram template | [docs/TEMPLATES.md](docs/TEMPLATES.md) (engine file + spec + skeleton + fixture) |
| change colours or fonts | `engine/kit.js` (`C`), `assets/fonts/` |
| change thresholds or limits | `scripts/validate_story.py` (`SPEC`), `scripts/evaluate.py` |

## Security

Source text is treated as untrusted data. URLs are fetched from public hosts only, secrets are redacted before anything is written, repo clones run without hooks and symlinks, and downloads are checksum-verified. Details and reporting: [SECURITY.md](SECURITY.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).

## Verify

```bash
python3 skills/explainer-studio/scripts/selftest.py          # all fixtures: ingest, check, pick, post
python3 skills/explainer-studio/tests/test_security.py       # SSRF, secret redaction, symlinks
```

## Licence and credits

MIT, see [LICENSE](LICENSE). Third-party notices: [CREDITS.md](CREDITS.md).
