# Inheritance from NENE2

NeNe Concierge inherits engineering governance from [NENE2](https://github.com/hideyukiMORI/NENE2). This document is the source of truth for what is inherited, what is adapted, and what is NeNe Concierge–specific.

## Relationship

| Layer | Repository | Role |
| --- | --- | --- |
| Framework runtime | [NENE2](https://github.com/hideyukiMORI/NENE2) | HTTP runtime, DI, middleware, Problem Details, OpenAPI/MCP patterns |
| Chat scenario platform | **NeNe Concierge** (this repo) | Scenario engine, action adapters, embed widget, admin UI |
| CMS upstream (optional) | [NeNe Records](https://github.com/hideyukiMORI/nene-records) | Structured content API — **client only** |
| Knowledge base upstream (optional) | [NeNe Corpus](https://github.com/hideyukiMORI/nene-corpus) | Corpus search API — **client only** |
| Reference trials | [NENE2-FT](https://github.com/hideyukiMORI/NENE2-FT) | Patterns and friction notes from field trials |

NeNe Concierge is a **consumer project**, not a fork of NENE2. Framework code stays in NENE2; product code stays here.

## Inherited by policy (same rules)

| Topic | Local document |
| --- | --- |
| Issue-driven workflow | `docs/workflow.md` |
| Conventional Commits | `docs/development/commit-conventions.md` |
| Self-review before PR | `docs/review/` |
| ADR operation | `docs/adr/` |
| AI agent workflow | `docs/integrations/ai-tools.md`, `AGENTS.md` |

## Inherited by reference (framework behavior)

| Topic | NENE2 upstream |
| --- | --- |
| HTTP runtime (PSR-7/15/17) | `docs/development/http-runtime.md` |
| Middleware order and security | `docs/development/middleware-security.md` |
| Request validation layers | `docs/development/request-validation.md` |
| Problem Details errors | `docs/development/api-error-responses.md` |
| Authentication boundaries | `docs/development/authentication-boundary.md` |
| OpenAPI conventions | `docs/integrations/openapi.md` |
| MCP tool policy | `docs/integrations/mcp-tools.md` |
| Database adapter boundaries | `docs/development/database-migrations.md` |
| Domain / use case layering | `docs/development/domain-layer.md` |

Install NENE2 as a Composer dependency and treat `vendor/hideyukimori/nene2/docs/` as the framework reference.

## Adapted for NeNe Concierge

| Topic | NeNe Concierge choice |
| --- | --- |
| Product goal | Self-hosted chat scenario platform with action engine (not CMS, not knowledge chat) |
| Public Problem Details base URL | `https://nene-concierge.dev/problems/` |
| Namespace | `NeNeConcierge\` |
| Language policy | English for public docs, OpenAPI, API errors; Japanese allowed in Issues, PRs, commits |
| Deployment | Tier A shared hosting + Tier B Docker/VPS — `docs/deployment/` (ADR 0003) |
| External services | Email (SMTP), Slack API, Chatwork API, configurable HTTP webhooks |

## NeNe Concierge–specific (not inherited)

Record these in ADRs or product docs when they stabilize:

- Scenario and node data model
- Session state machine design
- Action adapter interface and retry policy
- Scenario version and publish lifecycle
- MCP tool scope for AI scenario authoring
- Embed widget trigger model
- Upstream API client policy (ADR 0002)
- Dual deployment policy (ADR 0003)

## When upstream and local docs conflict

1. Update the **local source-of-truth doc** in this repository first.
2. If the conflict is about **framework behavior**, prefer NENE2 upstream unless an ADR documents a deliberate deviation.
3. Keep `.cursor/rules/` as a short summary; do not duplicate full policy text there.

## Verification commands (after scaffold)

```bash
composer check
composer openapi
composer mcp
npm run check --prefix frontend
```
