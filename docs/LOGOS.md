# Official logos

Any icon in any design can be an official technology logo: architecture nodes, swimlane steps, stage panels, chart icons, carousel slides, thumbnails and the newsletter banner. Write `logo:NAME` wherever an icon goes:

```json
{ "id": "store", "title": "Amazon S3", "sub": "documents", "icon": "logo:aws-s3", "zone": 3 }
```

## The accuracy rule

**A logo appears only for a technology the source names.** `studio.py check` refuses any other:

```text
FIX   logo:github: the source never names it (looked for: github). Use a line icon instead (studio.py spec --icons)
```

Everything the source does not name gets one of the engine's line icons (`studio.py spec --icons`). For example, an article that says "open a pull request" but never names GitHub gets the `branch` icon, not the GitHub logo. Never guess a vendor.

How the check matches:
- It drops the `-icon` suffix and vendor prefixes (`aws-`, `amazon-`, `google-`, `microsoft-`, `apache-`), then looks for the remaining words in the source, ignoring case and allowing a space or hyphen between them: `logo:aws-step-functions` matches "step functions".
- Some names have aliases, for example:
  - `model-context-protocol` matches "MCP"
  - `kubernetes` matches "k8s"
  - `postgresql` matches "postgres"
  - `aws-elastic-cache` matches "ElastiCache"
  - `openai` matches "ChatGPT"
  - `visual-studio-code` matches "VS Code"

  The full list is `ALIAS` in `scripts/logos.py`.

## What ships

204 logos from the Iconify **logos** set (`@iconify-json/logos` 1.2.21, CC0-1.0), in `skills/content-creation/data/logos.json` (500 KB). They include:

| Group | Examples |
|---|---|
| AWS (67 services) | `aws-bedrock`, `aws-s3`, `aws-lambda`, `aws-api-gateway`, `aws-open-search`, `aws-eks`, `aws-glue`, `aws-iam`, `aws-cloudwatch`, `aws-dynamodb`, `aws-sqs`, `aws-step-functions` |
| Google Cloud, Azure | `google-cloud`, `google-cloud-platform`, `google-cloud-run`, `google-cloud-functions`, `google-drive`, `microsoft-azure` |
| AI | `claude`, `claude-code`, `anthropic`, `openai`, `google-gemini`, `mistral-ai`, `meta`, `langchain`, `pinecone` |
| Code and CI | `git`, `github`, `github-actions`, `github-copilot`, `gitlab`, `jenkins`, `circleci`, `visual-studio-code`, `cursor` |
| Platform | `docker`, `kubernetes`, `helm`, `terraform`, `vercel`, `netlify`, `cloudflare`, `nginx` |
| Data | `postgresql`, `mysql`, `mongodb`, `redis`, `kafka`, `elasticsearch`, `snowflake`, `databricks`, `duckdb` |
| Observability | `grafana`, `prometheus`, `datadog`, `sentry`, `pagerduty`, `opentelemetry` |
| Work | `slack`, `notion`, `jira`, `confluence`, `linear`, `figma`, `zoom`, `asana` |
| Languages | `python`, `javascript`, `typescript`, `nodejs`, `go`, `rust`, `java`, `swift`, `react`, `nextjs` |

`logo:slack` draws the square mark (`slack-icon`) when the set has one, and the full logo otherwise.

## Commands

```bash
python3 S/scripts/studio.py logos aws              # search: prints logo:aws-s3 logo:aws-lambda ...
python3 S/scripts/studio.py spec --logos claude    # the same search, from spec
python3 S/scripts/studio.py logos --add supabase,airbyte    # fetch more from the Iconify logos set (api.iconify.design)
python3 S/scripts/studio.py logos --import ~/Downloads/Asset-Package   # an official icon pack you downloaded
```

**`--add`** fetches the named icons once from the Iconify API and keeps them in `~/.cache/content-creation/logos.json`.

**`--import DIR`** reads every `.svg` under `DIR`, such as the official AWS Architecture Icons, Azure or Google Cloud icon packs you downloaded yourself.
- **Names:** each file name becomes a logo name, lower-cased, with size suffixes and `Arch_`/`Res_` prefixes dropped. For example, `Arch_Amazon-Simple-Storage-Service_64.svg` becomes `logo:amazon-simple-storage-service`.
- **Clean-up:** scripts and foreign objects are stripped; only the artwork is kept.
- **Priority:** imported and added logos win over the bundled ones.

These vendor packs are not bundled, because their terms limit redistribution. Importing your own copy keeps you within them.

## How logos are drawn

- Unchanged: no recolouring, no stretching, original aspect ratio.
- On a white rounded tile, so they read on any background, inside the node's icon tile (cards), badge (decision diamonds), stage tile (panels) or checklist tile (banner).
- Only the logos a story uses are packed into each render (`data.json` in the render folder), so renders stay small.
- They animate like any icon: in the GIF and MP4 they pop and glow in workflow order.

## Trademarks

Logos are trademarks of their owners. content-creation shows a logo only to name a technology the source itself names (nominative use). It is not affiliated with or endorsed by any of them. See [CREDITS.md](../CREDITS.md).
