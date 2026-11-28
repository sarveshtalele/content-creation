# Customise the CTA, hook and look, then rebuild

Everything you see on a finished GIF or Reel comes from one of three places. Change the place, rebuild, review. Nothing else needs to be touched.

| You want to change | Where it lives | Command |
|---|---|---|
| The **follow pill** on every GIF and Reel (name, tagline, "Follow" word, avatar) | your brand file | `studio.py brand ...` |
| The **closing lines of the LinkedIn post** | your brand file | `studio.py brand --cta ...` |
| The **narrator** (voice and speed) | your brand file | `studio.py brand --voice ... --speed ...` |
| The **hook** (GIF title, GIF subtitle, post opening question, Reel opening question) | `work/story.json` | edit, then `studio.py check` |
| The **content** or the **template** | `work/story.json` | edit, then `studio.py check` |

Your brand is saved in `~/.cache/content-creation/brand.json` (Windows: `%USERPROFILE%\.cache\content-creation\brand.json`), with your avatar next to it. It overrides the defaults shipped in `config/brand.json` and **survives re-installs and updates**. `studio.py brand --reset` removes it.

## 1. Update the CTA and rebuild

```bash
S=skills/content-creation/scripts/studio.py          # Windows: py -3 skills\content-creation\scripts\studio.py

python3 $S brand --name "Your Name" \
                 --follow "Follow" \
                 --tagline "What you post about" \
                 --avatar ~/Pictures/me.png \
                 --cta "♻️ Repost to help others find this." \
                 --cta "➕ Follow Your Name for more."

python3 $S build work --artifacts gif     # or: reel | post | gif,post | all
python3 $S review work                    # gates + contact sheets in work/out/review/
# look at the sheets, write work/out/review/attest.json exactly as review prints it, then:
python3 $S finalize work                  # fresh files land in work/final/
```

What each option does:

| Option | Shows up as | Limit (the pill is one line) |
|---|---|---|
| `--name` | the bold name in **Follow Name** | 2 to 30 characters |
| `--follow` | the verb: Follow, Join, Subscribe, Read | 3 to 14 characters |
| `--tagline` | the text after the arrow | 4 to 44 characters |
| `--avatar` | the round photo inside the pill | `.png` `.jpg` `.webp`, up to 2 MB, square works best |
| `--photo` | your cut-out photo on the LinkedIn newsletter banner | a PNG with a transparent background is used as it is; any other photo is cut out on macOS with Apple's Vision framework, offline (needs the Xcode command line tools once). Saved as `photo_cutout.png` in your data folder |
| `--cta` (repeat per line) | the closing lines of the LinkedIn post, copied exactly | 1 to 4 lines, 5 to 220 characters each |
| `--voice`, `--speed` | the Reel narrator (`am_michael`, `am_onyx`, `bm_george`, ...) | speed 0.8 to 1.2 |

Run `studio.py brand` with no options to print what is currently in effect.

**Rebuilding is cheap.** `build` re-renders from `story.json`, so a new CTA never needs the source again. Reels reuse the cached voice for every line you did not change, so only edited lines are re-synthesised. The previous `final/` folder stays until `finalize` replaces it, and the old attestation stops matching as soon as the files change, so a stale file can never be delivered by mistake.

> **Where is `work`?** It is the folder you passed to `ingest` the first time. Keep it. If it is gone, run `ingest` on the source again and restore `story.json` from your chat or version control.

### Your photo on the newsletter banner

```bash
python3 $S brand --photo ~/Pictures/me.jpg     # cut out once, reused by every banner
python3 $S thumbs work --sizes newsletter --layouts banner
```

Without a cut-out photo the banner shows your avatar in a round frame. `brand --reset` removes the photo with the rest of your brand.

## 2. Change the hook

A hook is the first thing a reader sees. Each artifact has its own, all in `work/story.json`:

| Artifact | Field | Rule (checked for you) |
|---|---|---|
| **GIF** headline | `gif.title` | 3 to 40 characters |
| **GIF** subtitle | `gif.subtitle` | 10 to 64 characters |
| **Post** opening line | `post.hook` | a question ending in `?`, 15 to 150 characters |
| **Reel** opening line | the first beat (`role: "hook"`) and the first scene (`type: "hook"`, field `p.q`) | a question ending in `?`; first scene must be a hook |

Then:

```bash
python3 $S check work     # repeat until it prints CHECK OK
python3 $S build work --artifacts gif,post
python3 $S review work && python3 $S finalize work
```

**Writing a hook that travels:**

- Lead with the reader's problem or a surprising fact, in your words: *"Why does one slow request take down a whole platform?"*
- Put one concrete number or name in it. Numbers and names stay grounded, because they must appear in the source.
- Keep it to one idea. The GIF title has 40 characters, so cut adjectives before nouns.
- Test two versions: copy `story.json` to `story.b.json`, change only the hook, build each, and compare the final frames.

**Grounding still applies.** A hook that introduces a number, name or claim the source does not contain is rejected by `check` with a `FIX` line. That is on purpose: a punchy line that is not true costs more than it earns. Rephrase using words from the source, or add the fact to the source file and re-run `ingest`.

## 3. Ask your agent to do it

You do not have to type the commands. In Claude Code, Codex, Antigravity or Gemini CLI:

> *Change my CTA tagline to "Practical AI, made simple", then rebuild the GIF in `work/` and finalize it.*

> *Rewrite the hook as a question about cost, keep the facts, rebuild the GIF and the post.*

> *Use "Join" instead of "Follow" and my new avatar at ~/me.png. Rebuild the Reel too.*

The agent runs `brand`, `check`, `build`, `review`, looks at the contact sheets, attests and finalizes. You get the new files only when every gate is 100%.

## 4. Troubleshooting

| Symptom | Fix |
|---|---|
| `brand` says a field has the wrong length | the pill is one line; shorten the text |
| Build prints `LAYOUT ERRORS` | a text no longer fits its box; shorten it as the message says |
| `check` says a name or number is not in the source | rephrase using the source's own words |
| `finalize` says the attestation does not match | files changed after `review`; run `review` again and attest the new token |
| Old CTA still appears | you rebuilt a different folder, or an old `final/` is being opened; check the file's modified time |
| Avatar looks stretched | use a square image, 256 to 512 px |

To change **colours, fonts, thresholds** or add a **template**, see [TEMPLATES.md](TEMPLATES.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).
