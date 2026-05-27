# AI Tool Policy

NeNe Concierge inherits AI tool policy from NENE2 with product-specific additions.

## General Rules

- AI tools operate through documented HTTP API boundaries only.
- No direct database access for any AI or MCP tool.
- No production credentials in AI tool context.
- MCP tools are operator/AI-facing — never exposed to embed widget visitors.

## MCP Tool Scope

MCP tools for NeNe Concierge are planned for Phase 5. The intended scope:

| Safety level | Operations |
| --- | --- |
| `read` | List scenarios, get scenario detail, get node tree, get session logs, get action logs |
| `write` | Create scenario draft, update node, add edge, update scenario metadata |
| `admin` | Publish scenario, archive scenario, manage action credentials |
| `destructive` | Delete scenario, delete session data |

**Phase 0–4**: `read` tools only, added alongside the REST API.
**Phase 5**: `write` and `admin` tools with auth, audit, and request ID.

## Action Adapter Credentials

Action adapters (Slack, Chatwork, Email SMTP, HTTP webhooks) use credentials stored in `.env` or the admin settings DB:

- Credentials must never appear in API responses (even masked versions only in admin UI).
- Credentials must never be logged.
- AI/MCP tools must never return or modify raw credential values.

## AI Scenario Authoring (Phase 5)

When an AI agent authors a scenario via MCP:

1. Agent creates a scenario in `draft` status.
2. Agent builds nodes and edges via MCP write tools.
3. Human operator reviews in the scenario editor UI.
4. Human operator publishes (MCP `publish` or UI button).

AI agents cannot publish scenarios autonomously (by default; operator may configure otherwise via an explicit setting).

## Local MCP Server (after Phase 5 scaffold)

```bash
docker compose run --rm -e NENE_CONCIERGE_LOCAL_API_BASE_URL=http://app app \
  php tools/local-mcp-server.php
```
