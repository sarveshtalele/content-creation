#!/usr/bin/env python3
"""Harness hook for content-creation approval gates (Claude Code, Codex, Antigravity). Standard library only.

  gate_hook.py prompt [--harness claude|codex|antigravity]   UserPromptSubmit (Claude, Codex) / PreInvocation (Antigravity):
      records "approve plan XXXX" / "approve final XXXX" when the person's own message is exactly that.
  gate_hook.py tool   [--harness ...]                         PreToolUse: denies tool calls that touch the gate records,
      so only the person can approve. Building without approval is refused by studio.py itself."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gates as G

TOUCH = re.compile(r'[/\\]\.gates\b|\.gates[/\\]|gates\.approve|gates\.from_message|gate_hook\.py["\']?\s+prompt')


def main(argv):
    ev = argv[1] if len(argv) > 1 else ''
    harness = argv[argv.index('--harness') + 1] if '--harness' in argv else 'claude'
    raw = sys.stdin.read()
    try: data = json.loads(raw or '{}')
    except ValueError: data = {}
    if ev == 'prompt':
        note = G.from_message(data.get('prompt') or data.get('lastUserInput') or '', 'person:' + harness)
        if note and harness != 'antigravity': print(note)      # plain text is added to the agent's context
        return 0
    if ev == 'tool':
        ti = data.get('tool_input') if isinstance(data.get('tool_input'), (dict, str)) else data
        if TOUCH.search(json.dumps(ti)):
            why = 'content-creation: approvals are recorded only from the person\'s own message (approve plan XXXX / approve final XXXX). Ask the person; do not read or write the gate records.'
            if harness == 'antigravity': print(json.dumps({'decision': 'deny', 'reason': why}))
            else: print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny', 'permissionDecisionReason': why}}))
        return 0
    return 0


if __name__ == '__main__':
    try: sys.exit(main(sys.argv))
    except Exception as e:   # a broken hook must never block the person's session
        print('content-creation gate hook error: ' + str(e), file=sys.stderr); sys.exit(0)
