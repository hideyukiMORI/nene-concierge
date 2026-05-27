# Agent / AI Guide

This file is the entry point for AI agents working on NeNe Concierge.

## Read First

- **Current work & status:** `docs/todo/current.md`
- **Product vision:** `docs/explanation/product-vision.md`
- **Glossary:** `docs/explanation/glossary.md`
- Inheritance map: `docs/inheritance-from-nene2.md`
- Human and AI collaboration: `docs/CONTRIBUTING.md`
- Workflow: `docs/workflow.md`
- Coding standards: `docs/development/coding-standards.md`
- Commit messages: `docs/development/commit-conventions.md`
- AI tool policy: `docs/integrations/ai-tools.md`
- Roadmap: `docs/roadmap.md`

## Operating Rules

- **Issue-driven**: no substantive code, doc, or config change without a GitHub Issue. Create one first.
- **No direct commits to `main`**. Branch `type/issue-number-summary` → PR → merge after checks.
- **Commits**: Conventional Commits; type/scope English, description/body Japanese, `(#issue)` in subject.
- **Full lifecycle** (unless user limits scope): Issue → branch → implement → verify → commit → push → PR → merge → sync `main`.
- Read NENE2 upstream docs for framework behavior; read local docs for product rules.
- **Never expose MCP protocol to embed widget visitors.** MCP is for operator/AI tooling only. See ADR 0002.
- **Never bypass the API layer for AI or MCP tools.** DB access is only through documented HTTP boundaries.
- Keep `docs/todo/current.md` and milestones aligned with Issues and PRs.
- Keep changes focused. Do not mix governance, feature work, and unrelated cleanup in one PR.
- Do not commit secrets, credentials, local `.env` files, or generated build outputs.
- Prefer explicit, typed, testable code over hidden framework behavior.
- When docs and `.cursor/rules/` conflict, update the docs first and keep `.cursor/rules/` concise.

## Project Direction

NeNe Concierge is a self-hosted chat scenario platform on NENE2:

- **Visual scenario editor** — React flow-canvas GUI for building chat flows
- **AI-driven authoring** — MCP and REST API for AI agents to create, read, and update scenarios
- **Conversion-focused embed** — `widget.js` embedded on any same-origin page (contact forms, product pages, cart flows)
- **Action engine** — HTTP API calls, email, Slack, Chatwork triggered from scenario nodes
- **Dual deployment** — Tier A (shared hosting) and Tier B (Docker/VPS); ADR 0003
- **Not** a general-purpose chatbot SaaS — optimized for Japan SMB sales/marketing workflows

## Framework Reference

Install `hideyukimori/nene2` via Composer. For HTTP runtime, middleware, Problem Details, and MCP patterns, NENE2 upstream documentation is authoritative unless a local ADR says otherwise.
