"""Design registry for the Design Studio (studio.py studio).

Every entry is one design the person can pick: what it is, when it fits, the fields it needs (with the same length limits the
validator enforces), sample values (the preloaded thumbnail is rendered from them by the real engine) and how the values become
a story.json fragment. The person decides; nothing here chooses for them."""
import re

THEMES = [('paper', 'Claude light (default)'), ('sky', 'Sky (light blue)'), ('mint', 'Mint'), ('sunrise', 'Sunrise'), ('midnight', 'Midnight (dark)')]
ICONS = ('agents bell bolt book branch chart chat check chip clipboard cloud code database doc eye file folder gear globe hand hook key laptop '
         'layers list lock pause pencil plug refresh remote rewind rocket scale search shield slack star table target terminal users wrench').split()

def T(key, label, mx, mn=0, hint='', area=False): return {'key': key, 'type': 'text', 'label': label, 'min': mn, 'max': mx, 'hint': hint, 'area': area}
def L(key, label, mn, mx, item, hint=''): return {'key': key, 'type': 'list', 'label': label, 'min': mn, 'max': mx, 'item': item, 'hint': hint}
def I(key='icon', label='Icon'): return {'key': key, 'type': 'icon', 'label': label}
def SEL(key, label, opts): return {'key': key, 'type': 'select', 'label': label, 'options': list(opts)}
def N(key, label, mx=100): return {'key': key, 'type': 'number', 'label': label, 'min': 0, 'max': mx}
CHIPS = L('chips', 'Topic chips', 2, 4, [I(), T('label', 'Label', 16, 3)], 'Short labels with an icon; they become the icons and labels on the cover')

def _title(layout, v, extra=None):
    t = {'layout': layout, 'hook': v['hook'], 'sub': v.get('sub', ''), 'kicker': v.get('kicker', ''), 'icon': (v.get('chips') or [{}])[0].get('icon', 'bolt')}
    if v.get('accent'): t['accent'] = v['accent']
    if v.get('chips'): t['chips'] = [{'icon': c['icon'], 'label': c['label']} for c in v['chips']]
    t.update(extra or {}); return t

def _rows(v): return [{'label': r['label'], 'value': r['value'], 'pct': int(r['pct'])} for r in v['rows']]

GROUPS_ = ('green', 'blue', 'clay')
MOTIFS_ = ('bars', 'curve', 'tree', 'flow', 'cluster', 'network', 'loop', 'steps', 'split', 'pixels')
DESIGNS = [
    {'id': 'cover-bold', 'group': 'cover', 'name': 'Poster Bold', 'tag': 'Giant headline, one highlighted word, 3D slabs',
     'blurb': 'A bold poster: huge blue headline, one word on a green box, a swoosh and a 3D stack. The strongest scroll-stopper for a claim.',
     'best_for': 'A strong claim or contrarian take', 'theme': 'paper',
     'fields': [T('hook', 'Headline', 60, 10, 'Short and specific'), T('accent', 'Word(s) on the green box', 40, 0, 'Must appear in the headline'), T('kicker', 'Small line above', 26), T('sub', 'One sentence under it', 90), CHIPS],
     'sample': {'hook': 'Claude Code is not a coding tool', 'accent': 'coding tool', 'kicker': 'How Claude Code works', 'sub': 'It can help with anything you can do from the command line',
                'chips': [{'icon': 'terminal', 'label': 'Command line'}, {'icon': 'search', 'label': 'Search files'}, {'icon': 'bolt', 'label': 'Run tools'}, {'icon': 'shield', 'label': 'Safe modes'}]},
     'build': lambda v: ('title', _title('bold', v))},
    {'id': 'cover-stage', 'group': 'cover', 'name': 'Gradient Stage', 'tag': 'Centred headline, floating tags, 3D stack rising from the bottom',
     'blurb': 'A soft blue stage: stacked headline in two weights, a floating tag, icon tiles and ribbons around a 3D stack.',
     'best_for': 'Personal brand, services, introductions', 'theme': 'paper',
     'fields': [T('hook', 'Headline', 60, 10), T('accent', 'Word(s) on the floating tag', 24, 0, 'Must appear in the headline'), T('kicker', 'Small line above', 26), T('sub', 'One sentence under it', 90), CHIPS],
     'sample': {'hook': 'Great design builds better experience', 'accent': 'better', 'kicker': 'Design notes', 'sub': 'Interfaces that solve real problems and create real value',
                'chips': [{'icon': 'pencil', 'label': 'Interfaces'}, {'icon': 'star', 'label': 'Quality'}, {'icon': 'users', 'label': 'People'}]},
     'build': lambda v: ('title', _title('stage', v))},
    {'id': 'cover-editorial', 'group': 'cover', 'name': 'Editorial Masthead', 'tag': 'Serif masthead and a cut-away funnel of stages',
     'blurb': 'Cream paper, serif capitals and a cut-away funnel whose floors are your stages. Calm and authoritative.',
     'best_for': 'Explainers, "what is X" and frameworks', 'theme': 'paper',
     'fields': [T('hook', 'Headline', 60, 10), T('kicker', 'Italic line above', 26), T('sub', 'One line under the rule', 60), CHIPS],
     'sample': {'hook': 'What is a marketing funnel?', 'kicker': 'From awareness to loyalty', 'sub': 'People, interest, action, long-term value',
                'chips': [{'icon': 'eye', 'label': 'Awareness'}, {'icon': 'search', 'label': 'Consideration'}, {'icon': 'check', 'label': 'Conversion'}, {'icon': 'users', 'label': 'Retention'}]},
     'build': lambda v: ('title', _title('editorial', v))},
    {'id': 'cover-terminal', 'group': 'cover', 'name': 'Terminal', 'tag': 'The headline typed into a command window',
     'blurb': 'Dark terminal window with the headline typed out. Good for developer and tooling topics.',
     'best_for': 'Developer tools, commands, workflows', 'theme': 'paper',
     'fields': [T('hook', 'Headline', 60, 10), T('kicker', 'Tag above', 26), T('sub', 'One sentence under it', 90), T('prompt', 'Command shown first', 24)],
     'sample': {'hook': 'Claude Code is not a coding tool', 'kicker': 'How Claude Code works', 'sub': 'It can help with anything you can do from the command line', 'prompt': 'claude'},
     'build': lambda v: ('title', _title('terminal', v, {'prompt': v.get('prompt', '')}))},
    {'id': 'cover-poster', 'group': 'cover', 'name': 'Colour Poster', 'tag': 'Full-bleed colour with one huge line',
     'blurb': 'Edge-to-edge colour with a huge headline and an icon. Fast, loud and simple.',
     'best_for': 'Short, punchy announcements', 'theme': 'paper',
     'fields': [T('hook', 'Headline', 60, 10), T('kicker', 'Small line above', 26), T('sub', 'One sentence under it', 90), I('icon', 'Icon')],
     'sample': {'hook': 'Read this before you give agents less supervision', 'kicker': '3 reads', 'sub': 'Evals and harness engineering for agents you ship', 'icon': 'book'},
     'build': lambda v: ('title', _title('poster', v, {'icon': v.get('icon', 'bolt')}))},

    {'id': 'info-grid', 'group': 'infographic', 'name': 'Card grid poster', 'tag': 'Numbered cards, each with a small diagram',
     'blurb': 'A poster of 4, 6 or 9 numbered cards, each with a mini diagram, a caption, a title and one line. Good for "N ideas explained at a glance".',
     'best_for': 'Lists of tools, algorithms, concepts or tips (4, 6 or 9 items)', 'theme': 'paper',
     'fields': [T('title', 'Poster title', 40, 6), T('kicker', 'Line under the title', 44), L('legend', 'Group labels (optional)', 0, 4, [T('label', 'Label', 20, 3), SEL('group', 'Colour', GROUPS_)]),
                L('cards', 'Cards (use 4, 6 or 9)', 4, 9, [SEL('motif', 'Diagram', MOTIFS_), T('caption', 'Small line under the diagram', 30, 3), T('title', 'Card title', 24, 3), T('sub', 'One line', 70, 10), SEL('group', 'Colour', GROUPS_)], 'A full grid looks best: 4, 6 or 9 cards')],
     'sample': {'title': '9 AI Algorithms Visualised', 'kicker': 'Part 1: the ideas, drawn simply', 'legend': [{'label': 'Supervised', 'group': 'green'}, {'label': 'Ensembles', 'group': 'blue'}, {'label': 'Deep learning', 'group': 'clay'}], 'cards': [{'motif': 'bars', 'caption': 'shrink weights', 'title': 'Ridge Regression', 'sub': 'Shrinks weights with an L2 penalty to reduce overfitting.', 'group': 'green'}, {'motif': 'bars', 'caption': 'some weights = 0', 'title': 'Lasso Regression', 'sub': 'Uses an L1 penalty to push some weights to zero.', 'group': 'green'}, {'motif': 'curve', 'caption': 'fit a curved line', 'title': 'Polynomial Regression', 'sub': 'Adds powers of features to fit a curved relationship.', 'group': 'green'}, {'motif': 'tree', 'caption': 'random splits', 'title': 'Extra Trees', 'sub': 'Combines trees built with random split thresholds.', 'group': 'blue'}, {'motif': 'cluster', 'caption': 'soft membership', 'title': 'Gaussian Mixture', 'sub': 'Fits overlapping Gaussians with soft cluster membership.', 'group': 'clay'}, {'motif': 'network', 'caption': 'learn from errors', 'title': 'Neural Network', 'sub': 'Layers of neurons learn patterns from examples.', 'group': 'clay'}, {'motif': 'split', 'caption': 'draw a boundary', 'title': 'Classifier', 'sub': 'Separates two groups with a learned boundary.', 'group': 'green'}, {'motif': 'loop', 'caption': 'act, reward, repeat', 'title': 'Q-Learning', 'sub': 'Learns action values from the rewards it receives.', 'group': 'blue'}, {'motif': 'pixels', 'caption': 'remove noise', 'title': 'Diffusion Model', 'sub': 'Generates samples by removing noise step by step.', 'group': 'clay'}]},
     'build': lambda v: ('slide', {'type': 'grid', 'title': v['title'], 'kicker': v.get('kicker', ''), 'legend': [{'label': x['label'], 'group': x['group']} for x in v.get('legend', [])], 'cards': [{k: c[k] for k in ('motif', 'caption', 'title', 'sub', 'group')} for c in v['cards']]})},
    {'id': 'info-cone', 'group': 'infographic', 'name': '3D Cone Funnel', 'tag': 'A glossy cone of stages with a card for each',
     'blurb': 'A lit 3D cone in rounded slices that narrows to a spout. Each slice is numbered and joined by a curved leader to a card with icon, line and figure.',
     'best_for': 'Funnels, conversion, filtering, any stages that narrow', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), L('steps', 'Stages (top to bottom)', 3, 5, [I(), T('title', 'Stage', 22, 2), T('sub', 'One line explaining it', 64), T('value', 'Figure (optional)', 26)])],
     'sample': {'title': 'What is a marketing funnel?', 'steps': [{'icon': 'eye', 'title': 'Awareness', 'sub': 'People discover the product through ads and posts', 'value': '10,000'},
                {'icon': 'search', 'title': 'Consideration', 'sub': 'Visitors compare features and reviews', 'value': '1,400'}, {'icon': 'check', 'title': 'Conversion', 'sub': 'A smaller group decides to buy', 'value': '480'},
                {'icon': 'users', 'title': 'Retention', 'sub': 'Buyers return and recommend', 'value': '46%'}]},
     'build': lambda v: ('slide', {'type': 'cone', 'title': v['title'], 'steps': [{'icon': x['icon'], 'title': x['title'], 'sub': x.get('sub', ''), 'value': x.get('value', '')} for x in v['steps']]})},
    {'id': 'info-bars', 'group': 'infographic', 'name': 'Bars', 'tag': 'Compare amounts side by side',
     'blurb': 'Horizontal bars with a value each. Best when sizes matter more than order.',
     'best_for': 'Rankings and comparisons of amounts', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), L('rows', 'Bars', 3, 5, [T('label', 'Label', 24, 2), T('value', 'Value', 8, 1), N('pct', 'Bar length (0-100)')])],
     'sample': {'title': 'Share of traffic by channel', 'rows': [{'label': 'Search', 'value': '46%', 'pct': 46}, {'label': 'Social', 'value': '28%', 'pct': 28}, {'label': 'Email', 'value': '16%', 'pct': 16}]},
     'build': lambda v: ('slide', {'type': 'bars', 'title': v['title'], 'rows': _rows(v)})},
    {'id': 'info-stack', 'group': 'infographic', 'name': 'Layers', 'tag': 'Slabs showing what sits on what',
     'blurb': 'Stacked 3D slabs, each one a layer. Shows architecture and levels.',
     'best_for': 'Layers, tiers, architectures', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), L('rows', 'Layers (top to bottom)', 3, 5, [T('title', 'Layer', 28, 3), T('sub', 'Short description', 64)])],
     'sample': {'title': 'Four layers of an agent setup', 'rows': [{'title': 'Your request', 'sub': 'What you ask for'}, {'title': 'Agent loop', 'sub': 'Plans and acts'}, {'title': 'Tools', 'sub': 'Files, search and commands'}, {'title': 'Your machine', 'sub': 'Where the work lands'}]},
     'build': lambda v: ('slide', {'type': 'stack', 'title': v['title'], 'rows': [{'title': r['title'], 'sub': r.get('sub', '')} for r in v['rows']]})},
    {'id': 'info-loop', 'group': 'infographic', 'name': 'Loop', 'tag': 'Steps that repeat in a circle',
     'blurb': 'A circular cycle with an icon on each step and a label in the middle.',
     'best_for': 'Cycles and repeating workflows', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), T('center', 'Words in the middle', 24), L('steps', 'Steps', 3, 4, [I(), T('title', 'Step', 22, 3), T('sub', 'Short description', 60)])],
     'sample': {'title': 'The agentic loop', 'center': 'repeat until done', 'steps': [{'icon': 'search', 'title': 'Gather context', 'sub': 'Search files to understand the code'}, {'icon': 'code', 'title': 'Take action', 'sub': 'Edit to make changes'}, {'icon': 'check', 'title': 'Verify results', 'sub': 'Run tests to check the work'}]},
     'build': lambda v: ('slide', {'type': 'loop', 'title': v['title'], 'center': v.get('center', ''), 'steps': [{'title': s['title'], 'sub': s.get('sub', ''), 'icon': s['icon']} for s in v['steps']]})},
    {'id': 'info-compare', 'group': 'infographic', 'name': 'Compare', 'tag': 'Two cards side by side',
     'blurb': 'Two columns, 2-3 points each. Before and after, this and that.',
     'best_for': 'Contrasts, versus, before and after', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), T('lh', 'Left heading', 26, 3), L('li', 'Left points', 2, 3, [T('t', 'Point', 60, 6)]), T('rh', 'Right heading', 26, 3), L('ri', 'Right points', 2, 3, [T('t', 'Point', 60, 6)])],
     'sample': {'title': 'Specific beats generic', 'lh': 'Generic', 'li': [{'t': 'Speaks to an audience'}, {'t': 'Could be about anyone'}], 'rh': 'Specific', 'ri': [{'t': 'Speaks to one person'}, {'t': 'Names the exact moment'}]},
     'build': lambda v: ('slide', {'type': 'compare', 'title': v['title'], 'left': {'head': v['lh'], 'items': [x['t'] for x in v['li']]}, 'right': {'head': v['rh'], 'items': [x['t'] for x in v['ri']]}})},
    {'id': 'info-stat', 'group': 'infographic', 'name': 'Big number', 'tag': 'One number with a ring',
     'blurb': 'A single large figure with a progress ring and a line of context.',
     'best_for': 'One headline statistic', 'theme': 'paper',
     'fields': [T('title', 'Slide title', 60, 6), T('value', 'Number', 8, 1), N('pct', 'Ring fill (0-100)'), T('label', 'What the number means', 70, 6), T('sub', 'Context', 100)],
     'sample': {'title': 'Contrast is the workhorse', 'value': '30%', 'pct': 30, 'label': 'of top performers used contradictions', 'sub': 'Two things that do not fit together create tension'},
     'build': lambda v: ('slide', {'type': 'stat', 'title': v['title'], 'value': v['value'], 'pct': int(v['pct']), 'label': v['label'], 'sub': v.get('sub', '')})},
]

# v3 chart slides (engine/charts.js). One entry per chart: family, when it fits (the decision matrix uses the same words), a sample.
def J(key='data', label='Chart data (JSON)'): return {'key': key, 'type': 'json', 'label': label}
CHARTS = [
 ('lollipop', 'Comparison', 'Lollipop', 'A dot on a stick per item', 'Ranking a few items by one number',
  {'title': 'Context window by model family', 'rows': [{'label': 'Model A', 'value': '1M', 'pct': 100}, {'label': 'Model B', 'value': '400K', 'pct': 40}, {'label': 'Model C', 'value': '200K', 'pct': 20}, {'label': 'Model D', 'value': '128K', 'pct': 13}]}),
 ('dumbbell', 'Comparison', 'Dumbbell', 'Two dots per row joined by a bar', 'Before and after, two groups, a gap',
  {'title': 'Task success before and after evals', 'legend': {'a': 'Before', 'b': 'After'}, 'rows': [{'label': 'Code review', 'a': {'value': '41%', 'pct': 41}, 'b': {'value': '78%', 'pct': 78}}, {'label': 'Bug fixing', 'a': {'value': '35%', 'pct': 35}, 'b': {'value': '64%', 'pct': 64}}, {'label': 'Refactoring', 'a': {'value': '52%', 'pct': 52}, 'b': {'value': '81%', 'pct': 81}}]}),
 ('slope', 'Comparison', 'Slope', 'Lines between two moments', 'How a ranking changed between two dates',
  {'title': 'What developers use AI for', 'legend': {'a': '2024', 'b': '2026'}, 'rows': [{'label': 'Writing code', 'a': {'value': '62%', 'pct': 62}, 'b': {'value': '84%', 'pct': 84}}, {'label': 'Debugging', 'a': {'value': '48%', 'pct': 48}, 'b': {'value': '71%', 'pct': 71}}, {'label': 'Docs', 'a': {'value': '55%', 'pct': 55}, 'b': {'value': '58%', 'pct': 58}}]}),
 ('bullet', 'Comparison', 'Bullet', 'A bar against a target', 'Progress against a goal or benchmark',
  {'title': 'Agent eval scores against target', 'target_label': 'Target', 'rows': [{'label': 'Tool use accuracy', 'value': '86%', 'pct': 86, 'target': 90}, {'label': 'Plan quality', 'value': '72%', 'pct': 72, 'target': 80}, {'label': 'Safety checks', 'value': '97%', 'pct': 97, 'target': 95}]}),
 ('radar', 'Comparison', 'Radar', 'A shape per option across 4-6 criteria', 'Comparing models or tools on several criteria',
  {'title': 'Two coding assistants compared', 'axes': ['Speed', 'Accuracy', 'Context', 'Cost', 'Tool use'], 'series': [{'name': 'Assistant A', 'values': [80, 90, 85, 60, 88]}, {'name': 'Assistant B', 'values': [92, 70, 60, 85, 65]}]}),
 ('sankey', 'Flow', 'Sankey', 'Ribbons whose width is the amount', 'Where volume goes: requests, users, tokens',
  {'title': 'Where 1,000 agent requests go', 'flows': [{'from': 'Requests', 'to': 'Cache hit', 'num': 400, 'value': '400'}, {'from': 'Requests', 'to': 'Model call', 'num': 600, 'value': '600'}, {'from': 'Model call', 'to': 'Answered', 'num': 450}, {'from': 'Model call', 'to': 'Tool call', 'num': 150}]}),
 ('alluvial', 'Flow', 'Alluvial', 'Flows across named stages', 'How groups move between stages',
  {'title': 'From prompt to shipped change', 'stages': ['Prompt', 'Plan', 'Result'], 'flows': [{'from': 'Bug report', 'to': 'Small fix', 'num': 60}, {'from': 'Bug report', 'to': 'Refactor', 'num': 40}, {'from': 'Feature', 'to': 'Refactor', 'num': 30}, {'from': 'Feature', 'to': 'New module', 'num': 70}, {'from': 'Small fix', 'to': 'Merged', 'num': 60}, {'from': 'Refactor', 'to': 'Merged', 'num': 50}, {'from': 'Refactor', 'to': 'Reverted', 'num': 20}, {'from': 'New module', 'to': 'Merged', 'num': 70}]}),
 ('network', 'Flow', 'Network', 'A core joined to 4-8 parts', 'Architecture: MCP, integrations, a hub with clients',
  {'title': 'One MCP host, many servers', 'center': 'MCP host', 'nodes': [{'title': 'Files', 'icon': 'folder'}, {'title': 'GitHub', 'icon': 'branch'}, {'title': 'Database', 'icon': 'database'}, {'title': 'Slack', 'icon': 'chat'}, {'title': 'Browser', 'icon': 'globe'}, {'title': 'Calendar', 'icon': 'bell'}], 'links': [[0, 1], [2, 4]]}),
 ('arc', 'Flow', 'Arc diagram', 'Nodes on a line, arcs between them', 'Which steps or parts call each other',
  {'title': 'Which agents talk to each other', 'nodes': ['Planner', 'Coder', 'Tester', 'Reviewer', 'Deployer'], 'arcs': [{'from': 0, 'to': 1, 'label': 'tasks'}, {'from': 1, 'to': 2}, {'from': 2, 'to': 1, 'label': 'fixes'}, {'from': 1, 'to': 3}, {'from': 3, 'to': 4, 'label': 'approve'}]}),
 ('flowchart', 'Flow', 'Flowchart', 'Steps with a yes/no decision that loops', 'Agent loops, retries, approval flows',
  {'title': 'The agent loop', 'steps': [{'title': 'Read the task'}, {'title': 'Plan and edit the code'}, {'title': 'Run the tests'}, {'title': 'Do the tests pass?', 'kind': 'decision', 'yes': 'Yes', 'no': 'No, retry'}, {'title': 'Open a pull request'}]}),
 ('donut', 'Composition', 'Donut', 'Shares of one whole', 'Parts of a total (2-5)',
  {'title': 'Where the tokens go', 'center': {'value': '48%', 'label': 'reading files'}, 'parts': [{'label': 'Reading files', 'value': '48%', 'pct': 48}, {'label': 'Tool output', 'value': '27%', 'pct': 27}, {'label': 'Your messages', 'value': '15%', 'pct': 15}, {'label': 'Answers', 'value': '10%', 'pct': 10}]}),
 ('waffle', 'Composition', 'Waffle / pictogram', '100 squares or icons, one per percent', 'A share people can count',
  {'title': 'How many teams ship with AI review', 'icon': 'users', 'parts': [{'label': 'Use AI review on every PR', 'value': '38%', 'pct': 38}, {'label': 'Use it sometimes', 'value': '41%', 'pct': 41}]}),
 ('treemap', 'Composition', 'Treemap', 'Rectangles sized by share', 'Many parts of a whole, largest first',
  {'title': 'Where engineering time goes', 'parts': [{'label': 'Writing code', 'value': '32%', 'pct': 32}, {'label': 'Reviews', 'value': '21%', 'pct': 21}, {'label': 'Debugging', 'value': '18%', 'pct': 18}, {'label': 'Meetings', 'value': '15%', 'pct': 15}, {'label': 'Docs', 'value': '8%', 'pct': 8}, {'label': 'Setup', 'value': '6%', 'pct': 6}]}),
 ('sunburst', 'Hierarchy', 'Sunburst', 'Rings: categories and their parts', 'A two-level taxonomy',
  {'title': 'The AI engineering stack', 'root': 'AI app', 'branches': [{'title': 'Models', 'children': ['Frontier', 'Open', 'Small']}, {'title': 'Data', 'children': ['RAG', 'Evals']}, {'title': 'Agents', 'children': ['Tools', 'Memory', 'Planning']}, {'title': 'Ops', 'children': ['Tracing', 'Cost']}]}),
 ('mindmap', 'Hierarchy', 'Mind map', 'A central idea with branches', 'Brainstorms, topic overviews',
  {'title': 'Everything in a Claude Code setup', 'root': 'Claude Code', 'branches': [{'title': 'Memory', 'icon': 'book', 'items': ['CLAUDE.md files', 'Auto memory']}, {'title': 'Skills', 'icon': 'star', 'items': ['Reusable workflows', 'Slash commands']}, {'title': 'Tools', 'icon': 'wrench', 'items': ['Shell', 'MCP servers']}, {'title': 'Hooks', 'icon': 'hook', 'items': ['Before a tool', 'After a tool']}]}),
 ('decision', 'Hierarchy', 'Decision tree', 'A question that branches to answers', 'When to use what',
  {'title': 'Which one should you use?', 'q': 'Does the task need the same steps every time?', 'options': [{'label': 'Yes', 'title': 'Write a skill', 'sub': 'Package the steps once and reuse them', 'icon': 'star'}, {'label': 'No, data', 'title': 'Add an MCP server', 'sub': 'Give the agent access to the system it needs', 'icon': 'plug'}, {'label': 'No, rules', 'title': 'Use CLAUDE.md', 'sub': 'Store standards and decisions for every session', 'icon': 'book'}]}),
 ('timeline', 'Time', 'Timeline', 'Dated events on a spine', 'History, releases, a story in order',
  {'title': 'How coding assistants grew up', 'events': [{'when': 'Autocomplete', 'title': 'Next-line suggestions', 'sub': 'Finish the line you are typing', 'icon': 'code'}, {'when': 'Chat', 'title': 'Ask in a side panel', 'sub': 'Explain and draft snippets', 'icon': 'chat'}, {'when': 'Agents', 'title': 'Edit many files', 'sub': 'Plan, run commands and verify', 'icon': 'agents'}, {'when': 'Teams', 'title': 'Agents in parallel', 'sub': 'Split work and merge results', 'icon': 'users'}]}),
 ('gantt', 'Time', 'Gantt / roadmap', 'Bars across a time scale', 'Roadmaps and plans',
  {'title': 'A four-week agent rollout', 'scale': ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 'tasks': [{'title': 'Pick one workflow', 'start': 0, 'end': 22}, {'title': 'Write evals', 'start': 15, 'end': 50}, {'title': 'Pilot with a team', 'start': 40, 'end': 80}, {'title': 'Review and expand', 'start': 75, 'end': 100}]}),
 ('waterfall', 'Time', 'Waterfall', 'Steps up and down to a total', 'What added and what removed',
  {'title': 'Where an hour of agent time went', 'start': {'label': 'Session', 'value': '60 min', 'num': 60}, 'steps': [{'label': 'Waiting on tests', 'value': '-18', 'num': -18}, {'label': 'Retries', 'value': '-9', 'num': -9}, {'label': 'Cache reuse', 'value': '+6', 'num': 6}], 'end': {'label': 'Useful work', 'value': '39 min'}}),
 ('line', 'Time', 'Line / area', 'A trend over time', 'Growth, adoption, cost over months',
  {'title': 'Pull requests merged per week', 'kind': 'area', 'x': ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], 'series': [{'name': 'With agent', 'values': [12, 15, 19, 24, 27, 31]}, {'name': 'Without', 'values': [11, 12, 12, 13, 12, 14]}]}),
 ('heatmap', 'Time', 'Heatmap table', 'A grid of colour-coded numbers', 'Scores of many items on many criteria',
  {'title': 'Benchmark scores by task', 'unit': '%', 'rows': ['Model A', 'Model B', 'Model C'], 'cols': ['Code', 'Math', 'Search', 'Tools'], 'cells': [[88, 74, 81, 90], [79, 85, 70, 76], [65, 60, 72, 58]], 'legend': {'lo': 'Lower', 'hi': 'Higher'}}),
]
for _ty, _fam, _nm, _tag, _best, _smp in CHARTS:
    DESIGNS.append({'id': 'chart-' + _ty, 'group': 'chart', 'family': _fam, 'name': _nm, 'tag': _tag, 'blurb': _tag + '. Best for: ' + _best.lower() + '.', 'best_for': _best, 'theme': 'paper',
                    'fields': [T('title', 'Slide title', 60, 6), J()], 'sample': {'title': _smp['title'], 'data': {k: x for k, x in _smp.items() if k != 'title'}},
                    'build': (lambda ty: lambda v: ('slide', {'type': ty, 'title': v['title'], **v['data']}))(_ty)})
# v3.1 architecture diagrams (engine/arch.js): one diagram for a whole post, in four styles
ARCH = [
 ('sketch', 'Whiteboard sketch', 'Excalidraw-style hand-drawn diagram', 'Explaining a system casually, blog posts, talks',
  {'title': 'How an agent uses its tools', 'style': 'sketch', 'zones': [{'title': 'You'}, {'title': 'Agent'}, {'title': 'Tools'}],
   'nodes': [{'id': 'user', 'title': 'Your request', 'icon': 'chat', 'zone': 0}, {'id': 'plan', 'title': 'Planner', 'sub': 'breaks the task down', 'icon': 'list', 'zone': 1}, {'id': 'mem', 'title': 'Memory', 'sub': 'notes and context', 'icon': 'book', 'zone': 1},
             {'id': 'search', 'title': 'Search', 'icon': 'search', 'zone': 2}, {'id': 'code', 'title': 'Run code', 'icon': 'terminal', 'zone': 2}, {'id': 'files', 'title': 'Files', 'icon': 'folder', 'zone': 2}],
   'edges': [{'from': 'user', 'to': 'plan', 'label': 'task'}, {'from': 'plan', 'to': 'mem'}, {'from': 'plan', 'to': 'search'}, {'from': 'plan', 'to': 'code'}, {'from': 'plan', 'to': 'files', 'dashed': True}]}),
 ('cloud', 'Cloud architecture', 'Zones, service cards, labelled connectors and a legend', 'Application and system architecture',
  {'title': 'How a RAG app answers a question', 'style': 'cloud', 'zones': [{'title': 'Client'}, {'title': 'Edge'}, {'title': 'Services'}, {'title': 'Data'}],
   'nodes': [{'id': 'ui', 'title': 'Web app', 'icon': 'laptop', 'zone': 0}, {'id': 'gw', 'title': 'API gateway', 'sub': 'auth and rate limits', 'icon': 'shield', 'zone': 1},
             {'id': 'ret', 'title': 'Retriever', 'sub': 'finds passages', 'icon': 'search', 'zone': 2}, {'id': 'llm', 'title': 'Language model', 'sub': 'writes the answer', 'icon': 'chip', 'zone': 2},
             {'id': 'vec', 'title': 'Vector index', 'icon': 'database', 'zone': 3}, {'id': 'docs', 'title': 'Document store', 'icon': 'folder', 'zone': 3}],
   'edges': [{'from': 'ui', 'to': 'gw', 'label': 'question'}, {'from': 'gw', 'to': 'ret'}, {'from': 'ret', 'to': 'vec', 'label': 'embed + search'}, {'from': 'ret', 'to': 'llm', 'label': 'top passages'}, {'from': 'vec', 'to': 'docs', 'dashed': True}]}),
 ('flow', 'Swimlane flowchart', 'Actors as lanes, decisions as diamonds, loops on the side', 'Processes, approvals, agent loops',
  {'title': 'How a pull request gets merged', 'style': 'flow', 'lanes': [{'title': 'Developer'}, {'title': 'CI'}, {'title': 'Reviewer'}],
   'steps': [{'id': 'open', 'title': 'Open a pull request', 'lane': 0, 'kind': 'start', 'icon': 'branch'}, {'id': 'test', 'title': 'Run the tests', 'lane': 1, 'icon': 'terminal'}, {'id': 'ok', 'title': 'Tests pass?', 'lane': 1, 'kind': 'decision', 'icon': 'check'},
             {'id': 'review', 'title': 'Review the code', 'lane': 2, 'icon': 'eye'}, {'id': 'appr', 'title': 'Approved?', 'lane': 2, 'kind': 'decision', 'icon': 'users'}, {'id': 'merge', 'title': 'Merge', 'lane': 0, 'kind': 'end', 'icon': 'rocket'}],
   'edges': [{'from': 'open', 'to': 'test'}, {'from': 'test', 'to': 'ok'}, {'from': 'ok', 'to': 'review', 'label': 'yes'}, {'from': 'ok', 'to': 'open', 'label': 'no'}, {'from': 'review', 'to': 'appr'}, {'from': 'appr', 'to': 'merge', 'label': 'yes'}]}),
 ('sequence', 'Sequence diagram', 'Who calls whom, in order, with replies', 'Protocols, API calls, request journeys',
  {'title': 'Signing in with OAuth', 'style': 'sequence', 'actors': [{'title': 'You', 'icon': 'users'}, {'title': 'App', 'icon': 'laptop'}, {'title': 'Auth server', 'icon': 'key'}, {'title': 'API', 'icon': 'database'}],
   'messages': [{'from': 0, 'to': 1, 'text': 'Click sign in'}, {'from': 1, 'to': 2, 'text': 'Redirect with client id'}, {'from': 0, 'to': 2, 'text': 'Approve access'}, {'from': 2, 'to': 1, 'text': 'Authorization code', 'reply': True},
                {'from': 1, 'to': 2, 'text': 'Exchange code for token'}, {'from': 2, 'to': 1, 'text': 'Access token', 'reply': True}, {'from': 1, 'to': 3, 'text': 'Call with the token'}, {'from': 3, 'to': 1, 'text': 'Your data', 'reply': True}]}),
]
for _st, _nm, _tag, _best, _smp in ARCH:
    DESIGNS.append({'id': 'arch-' + _st, 'group': 'architecture', 'family': 'Architecture', 'name': _nm, 'tag': _tag, 'blurb': _tag + '. Best for: ' + _best.lower() + '.', 'best_for': _best, 'theme': 'paper',
                    'fields': [T('title', 'Slide title', 60, 6), J()], 'sample': {'title': _smp['title'], 'data': {k: x for k, x in _smp.items() if k != 'title'}},
                    'build': lambda v: ('slide', {'type': 'arch', 'title': v['title'], **v['data']})})
BY_ID = {d['id']: d for d in DESIGNS}

def public():
    return [{k: d.get(k) for k in ('id', 'group', 'family', 'name', 'tag', 'blurb', 'best_for', 'theme', 'fields', 'sample')} for d in DESIGNS]

def _texts(o):
    if isinstance(o, str): yield o
    elif isinstance(o, (int, float)) and not isinstance(o, bool): yield str(o)
    elif isinstance(o, dict):
        for k, x in o.items():
            if k not in ('icon', 'type', 'layout', 'photo'): yield from _texts(x)
    elif isinstance(o, list):
        for x in o: yield from _texts(x)

def assemble(items, closing, theme, single, brand_name):
    """items: [{design, values}] -> (story dict, source text, slide numbers to deliver). The first cover (if any) is the cover slide."""
    title = None; slides = []
    for it in items:
        d = BY_ID.get(it.get('design'));
        if not d: raise ValueError('unknown design ' + str(it.get('design')))
        kind, frag = d['build'](it['values'])
        if kind == 'title':
            if title is not None: raise ValueError('only one cover per carousel')
            title = frag
        else: slides.append(frag)
    if title is None:
        first = slides[0]; title = {'layout': 'bold', 'hook': first['title'], 'sub': '', 'kicker': '', 'icon': 'bolt'} if False else {'layout': 'classic', 'hook': first['title'], 'sub': '', 'kicker': '', 'icon': 'bolt'}
    cl = {'title': (closing or {}).get('title') or 'What will you try first?', 'kind': 'follow', 'lines': [x for x in ((closing or {}).get('lines') or []) if x][:3]}
    c = {'hook_style': 'plain', 'theme': theme, 'title': title, 'slides': slides, 'closing': cl}
    if single: c['single'] = True
    else: c['short'] = True          # studio carousels may have fewer than the 5 slides the guided workflow asks for: the person chose exactly what goes in
    story = {'meta': {'title': (title.get('hook') or 'design')[:60], 'slug': re.sub(r'[^a-z0-9]+', '-', (title.get('hook') or 'design').lower()).strip('-')[:40] or 'design'}, 'carousel': c}
    src = '\n'.join(t for t in _texts({'a': title, 'b': slides, 'c': cl}) if t) + '\n' + brand_name
    return story, src


# GIF styles shown on the studio's GIF page (preview stills are studio/samples/gif-<id>.jpg, made by gif_samples.py)
GIF_STYLES = [
    {'id': 'arch', 'name': 'Architecture diagram', 'tag': 'Whiteboard sketch, cloud architecture, swimlanes or sequence; flow runs on every connector', 'best': 'How a system or a whole post fits together'},
    {'id': 'chart', 'name': 'Animated chart', 'tag': 'Any of the 21 charts, drawn and revealed', 'best': 'Flows, shares, trends and comparisons with real figures'},
    {'id': 'grid', 'name': 'Card grid poster', 'tag': 'Numbered cards, each with a small moving diagram', 'best': 'Lists of 4, 6 or 9 ideas, tools or algorithms'},
    {'id': 'hub', 'name': 'Hub and cards', 'tag': 'One idea in the middle, nine parts around it', 'best': 'A concept with many parts'},
    {'id': 'columns', 'name': 'Catalogue columns', 'tag': 'Three or four categories with items', 'best': 'A catalogue grouped by type'},
    {'id': 'pipeline', 'name': 'Top-down pipeline', 'tag': 'Start, stages, result', 'best': 'A workflow in order'},
    {'id': 'lanes', 'name': 'Stack lanes', 'tag': 'Layers of a stack or ecosystem', 'best': 'Layers and how they connect'},
    {'id': 'ecosystem', 'name': 'Ecosystem', 'tag': 'A hub with the tools around it', 'best': 'Products and integrations'},
    {'id': 'framework', 'name': 'Framework', 'tag': 'Pillars of a framework', 'best': 'Models with named parts'},
    {'id': 'exploded', 'name': 'Exploded layers', 'tag': '3D plates pulled apart', 'best': 'Architecture in layers'},
    {'id': 'isoflow', 'name': '3D flow', 'tag': 'Isometric steps joined by arrows', 'best': 'Processes with a clear direction'},
    {'id': 'orbit', 'name': 'Orbit', 'tag': 'Parts circling a centre', 'best': 'A core with satellites'},
    {'id': 'stairs', 'name': 'Stairs', 'tag': 'Blocks that climb left to right', 'best': 'Levels, stages, maturity'},
    {'id': 'tower', 'name': 'Tower', 'tag': 'Floors with a small scene each', 'best': 'Stacked stages'},
    {'id': 'skyline', 'name': 'Skyline', 'tag': 'Buildings sized by value', 'best': 'Comparing amounts'},
    {'id': 'conveyor', 'name': 'Conveyor', 'tag': 'Items pass through gates', 'best': 'Filters and pass rates'},
    {'id': 'funnel', 'name': 'Funnel', 'tag': 'Stages that narrow', 'best': 'Conversion and drop-off'},
]
