# Design Studio

A local web app where **you** choose the design, instead of the plugin choosing for you.

```
python3 skills/explainer-studio/scripts/studio.py studio
```

It prints a link that only your computer can open (random token, 127.0.0.1 only). Then:

1. **What are you making?** One image, or a carousel.
2. **Pick the design.** Every design is shown as a sample rendered by the real engine, so what you see is what you get. Covers: Poster Bold, Gradient Stage, Editorial Masthead, Terminal, Colour Poster. Infographics: Funnel, Bars, Layers, Loop, Compare, Big number.
3. **Write your content.** Each design's fields use the same length limits as the validator, with live counters.
4. **Generate.** For a carousel the studio asks PDF, separate images, or both, and does not build until you choose. Single images come out as a 1080x1350 PNG.

Covers carry no photo. Your profile photo appears only in the header avatar and the follow button.

Files are written under `~/.cache/explainer-studio/studio_jobs/`. Studio carousels may have 2-7 slides because you choose exactly what goes in (the guided workflow still asks for 5-7).

Add a design: append an entry to `scripts/designs.py` (fields, sample values, build function), then run `python3 scripts/studio_jobs.py` to render its thumbnail into `studio/samples/`.

Coming next: GIF and Reel designs in the same studio.
