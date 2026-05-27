# Contributing to NeNe Concierge

NeNe Concierge inherits NENE2 engineering discipline. This guide covers what is specific to this repository.

## Before You Start

1. Read `AGENTS.md` (entry point for AI agents).
2. Read `docs/explanation/product-vision.md`.
3. Read `docs/todo/current.md` for current state.
4. Read `docs/inheritance-from-nene2.md` to understand what comes from NENE2.

## Issue-Driven Development

Every code, doc, or config change must be backed by a GitHub Issue. This applies to both human and AI contributors.

- Check existing Issues before creating a new one.
- One Issue = one focused change.
- Tag Issues with the appropriate phase label (e.g., `phase-0`, `phase-1`).

## Branch and Commit Rules

See `docs/workflow.md` for the full standard flow.

**Branch naming:** `type/issue-number-summary`
**Commit format:** `<type>(<scope>): <Japanese description> (#issue)`

## Code Standards

- PHP 8.4 with `declare(strict_types=1)` in every file.
- PSR-12 formatting (enforced by CS-Fixer).
- Handler → UseCase → Repository layering; no SQL in handlers, no HTTP in use cases.
- `final readonly` classes preferred for value objects and DTOs.
- See `docs/development/coding-standards.md` for the full ruleset.

## Testing

- Unit tests for use cases and domain logic (SQLite, no real HTTP).
- HTTP contract tests for public API endpoints.
- Run: `docker compose run --rm app composer check`

## Documentation

- Update `docs/todo/current.md` when a milestone changes state.
- Add an ADR (`docs/adr/`) for any architecture, dependency, or deployment decision.
- Update `docs/explanation/glossary.md` when introducing new canonical terms.
- English for public docs, OpenAPI, and API errors. Japanese is fine in Issues, PRs, commits, and `.cursor/rules/`.

## Self-Review Checklists

Before creating a PR, use the relevant checklist from `docs/review/`:

| File | For |
| --- | --- |
| `docs/review/backend-api.md` | API endpoints, handlers, validation |
| `docs/review/openapi-contract.md` | OpenAPI schema and examples |
| `docs/review/frontend.md` | React / TypeScript / Vite |
| `docs/review/docs-policy.md` | Documentation changes |

State which checklist you used in the PR body.

## Security

- No secrets, credentials, or `.env` files in commits.
- Action adapter credentials (Slack tokens, Chatwork tokens, SMTP passwords) go in `.env` only; never in scenario JSON or API responses.
- MCP tools are operator/AI-facing only; never expose MCP protocol to embed widget visitors.
- DB is never accessed directly by AI or MCP tools; use documented HTTP boundaries.

## Questions

Open a GitHub Issue with the `question` label, or start a Discussion.
