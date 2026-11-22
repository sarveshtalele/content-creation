"""readercard: a clean, page-like image (1280x900) for a link whose real page cannot be captured (blocked network, login wall, CSS blocked).
It is labelled as a summary, never presented as a screenshot, and shows only text you give it (paraphrase it; do not paste long passages)."""
import html, json
def render(spec):
    e = lambda s: html.escape(str(s or ''))
    acc = spec.get('accent', '#D97757'); paras = ''.join(f'<p>{e(p)}</p>' for p in spec.get('paragraphs', [])); lis = ''.join(f'<li>{e(b)}</li>' for b in spec.get('bullets', []))
    return f'''<!doctype html><meta charset="utf-8"><style>
*{{box-sizing:border-box}}body{{margin:0;width:1280px;height:780px;background:#fff;font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#1a1a1a;overflow:hidden}}
.top{{display:flex;align-items:center;justify-content:space-between;padding:26px 72px;border-bottom:1px solid #eee}}.site{{font-weight:800;font-size:28px;letter-spacing:-.01em}}.site i{{display:inline-block;width:16px;height:16px;border-radius:5px;background:{acc};margin-right:12px}}
.tag{{font-size:20px;font-weight:700;color:{acc};background:{acc}1f;border-radius:999px;padding:8px 18px}}
main{{padding:36px 72px 0;max-width:1180px}}h1{{font-family:Georgia,"Times New Roman",serif;font-size:54px;line-height:1.08;margin:0 0 18px;letter-spacing:-.01em}}
.by{{font-size:22px;color:#666;margin-bottom:22px}}.by b{{color:#1a1a1a}}p{{font-size:27px;line-height:1.45;margin:0 0 16px;color:#333}}ul{{margin:0;padding-left:34px}}li{{font-size:27px;line-height:1.4;margin-bottom:8px;color:#333}}li::marker{{color:{acc}}}
.note{{position:absolute;left:72px;right:72px;bottom:28px;font-size:20px;color:#8a8a8a;border-top:1px solid #eee;padding-top:14px}}
</style><div class="top"><div class="site"><i></i>{e(spec.get('site'))}</div><div class="tag">{e(spec.get('tag', 'SUMMARY'))}</div></div>
<main><h1>{e(spec.get('title'))}</h1><div class="by">{spec.get('byline_html') or e(spec.get('byline'))}</div>{paras}<ul>{lis}</ul></main>
<div class="note">{e(spec.get('note', 'Summary written for this carousel; open the link for the full page.'))}</div>'''
