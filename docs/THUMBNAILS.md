# Thumbnails and blog covers

`studio.py thumbs DIR [--sizes youtube,og,devto,hashnode] [--layouts face,number,diagram,versus,editorial] [--text "3-6 WORDS"]`

Renders every requested size × every layout the story supports into `out/thumbs/<slug>-<size>-<layout>.png` (and the shared `outputs/` folder). Every image goes through the layout gates (overflow, overlap, text inside the safe margins) before it is saved.

| Size | Pixels | Where it is used |
|---|---|---|
| `youtube` | 1280×720 | YouTube video thumbnail |
| `og` | 1200×630 | Open Graph link preview (LinkedIn, X, Slack) and the default blog header |
| `newsletter` | 1920×1080 | LinkedIn newsletter and article cover image |
| `devto` | 1000×420 | dev.to cover image |
| `hashnode` | 1600×840 | Hashnode cover image |

| Layout | What it shows | Offered when |
|---|---|---|
| `face` | your photo, 3–6 outlined words, saturated clay background | always |
| `number` | one real figure in a ring (a percentage fills the ring to its value) | the thumbnail text, hook or a big line holds a figure (% or unit, or 10 and up) |
| `diagram` | the hook and a mini flow of 3–4 steps | the story has a flow or list scene |
| `versus` | two lists side by side with a VS seal | the story has two list scenes |
| `editorial` | a calm blog header: serif headline, one line, topic tags | always |

Every layout carries your personal branding: your profile photo (cropped onto the face for small circles, head and shoulders for the large face layout), your name and your tagline. If the crop misses your face, set `face_x` / `face_y` (percent of the photo) in your brand file.

Words: `thumb.text` (6–40 characters, from the source) and `thumb.kicker` in story.json; without them the hook is used. The command warns above 7 words.

## Design rules (from current thumbnail research)

- One focal point: a face, a figure, a diagram or a contrast; never a collage.
- 3–6 large words. Outline or shadow them so they read on any background.
- Saturated mid-tone backgrounds (clay, deep ink). Pure white thumbnails disappear in light mode.
- A face, when used, fills about a quarter to a third of the frame.
- Treat the middle ~70% as the working area; keep a 7% margin.
- YouTube stamps the duration bottom-right: nothing important goes there (the layouts keep that corner clear).
- Keep the same fonts, palette and layout across posts so people recognise your work in a feed.
- The thumbnail must match what the video or post delivers.

Sources: Blare Media's 2026 thumbnail best practices (citing vidIQ's 2026 study of 500 breakout videos: 69% showed a face, 56% high-contrast colour, median of five words of text), and Henry David's 2026 YouTube thumbnail design guide.
