"""gallery: every design the plugin can make, as one list for the Design Studio's gallery (and for tests).

Each item: id (what you tell the agent), media (gif | carousel | reel | thumbnail | walkthrough), category, name, tag, best,
img (still in studio/samples), motion (looping MP4 preview, or None), aspect (CSS aspect ratio), action:
  request      the agent writes and builds it (GIF, Reel): the panel prepares a ready request with this design
  render       built here from its fields (carousel covers, infographics, charts, architecture slides)
  cover        Reel cover layout, rendered here
  thumb        thumbnail / blog cover layout, rendered here at every size
  walk         opens the walkthrough builder
The list is built from designs.py, so it never drifts from what the engine can render."""
import os
HERE = os.path.dirname(os.path.abspath(__file__)); SAMPLES = os.path.join(os.path.dirname(HERE), 'studio', 'samples')
GIF_FAMILY = {'funnel': 'Data', 'chart': 'Data', 'skyline': 'Data', 'arch': 'Architecture', 'hub': 'Architecture', 'orbit': 'Architecture', 'ecosystem': 'Architecture',
              'lanes': 'Architecture', 'exploded': 'Architecture', 'pipeline': 'Process', 'isoflow': 'Process', 'stairs': 'Process', 'conveyor': 'Process',
              'columns': 'Lists and frameworks', 'grid': 'Lists and frameworks', 'framework': 'Lists and frameworks', 'tower': 'Lists and frameworks'}
REEL_COVERS = {'hero': 'Hook + mini diagram', 'question': 'Giant hook, underline, tags', 'number': 'One real figure in a ring', 'split': 'Two lists joined by an arrow', 'face': 'Your photo with the hook'}
THUMBS = {'face': 'Your photo with 3-6 outlined words', 'number': 'One real figure in a ring', 'diagram': 'The hook with a mini flow', 'versus': 'Two lists side by side', 'editorial': 'A calm blog header'}

def _has(f): return os.path.isfile(os.path.join(SAMPLES, f))
def items():
    import designs as DS
    out = []
    for g in DS.GIF_STYLES:
        out.append({'id': g['id'], 'media': 'gif', 'category': GIF_FAMILY.get(g['id'], 'Diagrams'), 'name': g['name'], 'tag': g['tag'], 'best': g['best'],
                    'img': f"gif-{g['id']}.jpg", 'motion': f"gif-{g['id']}.mp4" if _has(f"gif-{g['id']}.mp4") else None, 'aspect': '4/5', 'action': 'request'})
    cat = {'cover': 'Covers', 'infographic': 'Infographics', 'architecture': 'Architecture'}
    for d in DS.DESIGNS:
        c = cat.get(d['group']) or ('Charts: ' + d.get('family', '').lower())
        out.append({'id': d['id'], 'media': 'carousel', 'category': c, 'name': d['name'], 'tag': d['tag'], 'best': d['best_for'], 'img': d['id'] + '.jpg', 'motion': None, 'aspect': '4/5', 'action': 'render'})
    for k, v in REEL_COVERS.items():
        out.append({'id': 'reelcover-' + k, 'layout': k, 'media': 'reel', 'category': 'Reel covers', 'name': k.title() + ' cover', 'tag': v, 'best': 'The 1080x1920 cover of a Reel', 'img': f'reelcover-{k}.jpg', 'motion': None, 'aspect': '9/16', 'action': 'cover'})
    out.append({'id': 'reel', 'media': 'reel', 'category': 'Reels', 'name': 'Narrated Reel', 'tag': 'Claude light, kinetic hook, camera moves, counters, your CTA on every frame', 'best': 'Explaining one idea in under a minute',
                'img': 'reel.jpg' if _has('reel.jpg') else 'reelcover-hero.jpg', 'motion': 'reel.mp4' if _has('reel.mp4') else None, 'aspect': '9/16', 'action': 'request'})
    out.append({'id': 'walkthrough', 'media': 'walkthrough', 'category': 'Walkthrough videos', 'name': 'Verified walkthrough', 'tag': 'A real guide run by Playwright, every step checked', 'best': 'Showing how to use a website or app',
                'img': 'walkthrough.jpg' if _has('walkthrough.jpg') else 'reelcover-hero.jpg', 'motion': 'walkthrough.mp4' if _has('walkthrough.mp4') else None, 'aspect': '9/16', 'action': 'walk'})
    for k, v in THUMBS.items():
        out.append({'id': 'thumb-' + k, 'layout': k, 'media': 'thumbnail', 'category': 'Thumbnails and blog covers', 'name': k.title() + ' thumbnail', 'tag': v, 'best': 'YouTube, link previews, LinkedIn newsletters, dev.to and Hashnode covers',
                    'img': f'thumb-{k}.jpg', 'motion': None, 'aspect': '16/9', 'action': 'thumb'})
    return [i for i in out if _has(i['img'])]
