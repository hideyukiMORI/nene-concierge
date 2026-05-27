# Roadmap

NeNe Concierge is a self-hosted chat scenario platform on NENE2 — build guided chat flows visually, let AI author them via MCP, embed them at conversion points, and trigger real-world actions.

## North Star

Operators and AI agents can:

- design chat scenario flows visually (nodes, branches, conditions, actions)
- publish flows as an **embed widget** on any same-origin page
- trigger external actions (email, Slack, Chatwork, HTTP) from within a scenario
- create, update, and preview scenarios programmatically via MCP and REST API
- audit visitor sessions and action logs through the admin UI

## Phase 0: Governance and Foundation

Goal: make contribution, AI operation, and NENE2 inheritance unambiguous.

- README and product vision
- Issue-driven workflow and commit conventions
- Inheritance map from NENE2
- ADR 0001 (governance), ADR 0002 (separation), ADR 0003 (deployment)
- AGENTS.md and CLAUDE.md for AI agents
- Self-review checklists and contributing guide
- NENE2 consumer scaffold, `GET /health`, OpenAPI baseline, CI

**Status: in progress.**

Milestone: `docs/milestones/2026-05-governance-and-foundation.md`

## Phase 1: Scenario Engine MVP

Goal: smallest vertical slice — define a scenario, run it, track a session.

- `scenarios`, `nodes`, `edges`, `sessions`, `messages` schema and migrations
- Scenario CRUD API + OpenAPI
- Session create / step / end API (visitor-facing)
- `message` and `end` node types
- PHPUnit + SQLite tests
- NENE2 consumer project scaffold (`composer.json`, check scripts)

## Phase 2: Condition Nodes and Variables

Goal: branching flows and visitor-collected state.

- `condition` node type with branch evaluation
- Session variable collection from `message` nodes
- Variable interpolation in message text
- Admin preview endpoint (simulate scenario without a real session)

## Phase 3: Action Engine

Goal: connect scenarios to the outside world.

- `action` node type with typed adapters: Email, Slack, Chatwork, HTTP
- Action credential management (admin API + UI)
- `action_logs` audit table
- Action retry / failure handling policy
- Operator docs for each action type

## Phase 4: Embed Widget and Admin UI

Goal: operable product without curl; Tier A install path.

- React scenario editor (canvas): node palette, drag-and-drop, edge drawing
- Admin UI: scenario list, publish/draft lifecycle, session logs, action logs
- `widget.js` embed bundle (same-origin)
- Trigger configuration (page load, scroll, exit intent)
- Tier A deliverables: web installer, release ZIP, shared-hosting docs

## Phase 5: MCP Tools and AI Authoring

Goal: AI-native scenario management.

- MCP tool catalog: scenario CRUD, node operations, publish/draft, preview
- AI-authored scenario workflow (draft → human review → publish)
- Scenario import/export (JSON round-trip)
- Operator docs: "let AI write your scenario"

## Phase 6: Upstream Integrations

Goal: optional content enrichment from NeNe Records and NeNe Corpus.

- NeNe Records read-only client (product catalog data in scenarios)
- NeNe Corpus search client (FAQ branch content from corpus)
- Unified variable context (visitor answers + upstream data)
