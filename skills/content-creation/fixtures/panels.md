# How a team ships a change with Claude Code

This is how a team ships a change, stage by stage, from a Slack alert to production.

A change starts as an alert in Slack. Claude reads the alert and writes intent.md, and the owner approves it.

Claude Code turns the approved spec.md into plan.md. The engineer accepts the plan, and Claude Code writes the code and tests.

Every pull request runs in GitHub Actions. The evals pass before anyone reviews, and the review findings go back to Claude Code.

A release manager approves the release gate. Only then does the change reach production, and monitoring watches it there.
