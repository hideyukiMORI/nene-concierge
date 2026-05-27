# Roadmap

NeNe Concierge is a self-hosted, multi-tenant chat scenario platform on NENE2 — build guided chat flows visually, let AI author them via MCP, embed them at conversion points, and trigger real-world actions.

## North Star

Operators and AI agents can:

- design chat scenario flows visually (nodes, branches, conditions, rich media, actions)
- publish flows as an **embed widget** on any same-origin page
- display product cards, sliders, media carousels, and booking pickers inside a scenario
- trigger external actions (email, Slack, Chatwork, HTTP, QR code issuance) from within a scenario
- connect scenarios to NeNe Records / NeNe Shop / NeNe Booking via HTTP — drive purchases and confirm reservations
- create, update, and preview scenarios programmatically via MCP and REST API — full GUI parity
- manage multiple organizations from a single instance (ADR 0004)
- **visualize** scenario performance on the canvas — node heatmaps, edge flow weights, drop-off alerts
- **let AI optimize** scenarios from analytics data — period-filtered reports feed LLM agents that propose edits as draft versions for human review (ADR 0005)

## Phase 0: Governance and Foundation

Goal: make contribution, AI operation, and NENE2 inheritance unambiguous.

- README and product vision
- Issue-driven workflow and commit conventions
- Inheritance map from NENE2
- ADR 0001 (governance), ADR 0002 (separation), ADR 0003 (deployment), ADR 0004 (multi-tenancy), ADR 0005 (analytics + AI optimization)
- AGENTS.md and CLAUDE.md for AI agents
- Self-review checklists and contributing guide
- NENE2 consumer scaffold, `GET /health`, OpenAPI baseline, CI

**Status: ✅ completed (2026-05-27).**

Milestone: `docs/milestones/2026-05-governance-and-foundation.md`

## Phase 1: Scenario Engine MVP

Goal: smallest vertical slice — define a scenario, run it, track a session, and capture analytics events.

- `organizations`, `organization_users` schema (multi-tenancy foundation, ADR 0004)
- `scenarios`, `nodes`, `edges`, `sessions`, `messages` schema and migrations (all with `organization_id`)
- **`sessions.outcome` + `sessions.has_conversion`** — session result tracking (ADR 0005)
- **`session_node_events`** schema and migration — node-level visit / dwell / branch events (ADR 0005)
- Scenario CRUD API + OpenAPI
- Session create / step / end API (visitor-facing)
- Engine records a `session_node_event` on every node transition
- `message` and `end` node types
- PHPUnit + SQLite tests

## Phase 2: Condition Nodes and Variables

Goal: branching flows and visitor-collected state.

- `condition` node type with branch evaluation
- Engine records `branch_taken` in `session_node_events` for condition nodes
- Session variable collection from `message` nodes
- Variable interpolation in message text
- Admin preview endpoint (simulate scenario without a real session)

## Phase 3: Action Engine + Analytics API

Goal: connect scenarios to the outside world and surface performance data.

- `action` node type with typed adapters: Email, Slack, Chatwork, HTTP
- **QR code action adapter** — issue QR codes (coupons, tickets, confirmation slips) from a scenario node
- Engine sets `has_conversion = true` on sessions when an action fires
- Action credential management (admin API + UI)
- `action_logs` audit table
- Action retry / failure handling policy
- **`GET /api/v1/scenarios/{id}/analytics`** — aggregated node analytics with period filtering
  - `period`: `1d` / `7d` / `30d` / `90d` / `custom` (with `from` / `to`)
  - Response: visit counts, avg dwell, drop-off rates, branch percentages, `bottlenecks[]`
- Operator docs for each action type

## Phase 4: Embed Widget and Admin UI

Goal: operable product without curl; Tier A install path; visual scenario analytics.

- React scenario editor (canvas): node palette, drag-and-drop, edge drawing
- **Analytics overlay mode** — toggle between Edit and Analytics on the canvas
  - Node cards: visit count, avg dwell time, drop-off rate (colour-coded by severity)
  - Edge weight: stroke width proportional to flow volume
  - Period selector in toolbar (1d / 7d / 30d / 90d / custom)
  - Bottleneck badges on high-drop-off nodes
- **Rich media node UI** — slider, image carousel, PDF/resource viewer inside the widget
- Admin UI: scenario list, publish/draft lifecycle, session logs, action logs
- `widget.js` embed bundle (same-origin)
- Trigger configuration (page load, scroll, exit intent)
- Tier A deliverables: web installer, release ZIP, shared-hosting docs

## Phase 5: MCP Tools and AI Authoring

Goal: AI-native scenario management — full GUI parity via API/MCP; LLM-driven optimization.

- MCP tool catalog: scenario CRUD, node operations, publish/draft, preview, organization management
- **`get_scenario_analytics(scenario_id, period)`** MCP tool — returns the Phase 3 analytics report
- AI optimization workflow: LLM agent reads analytics → identifies bottlenecks → proposes edits as draft → human reviews → publish
- AI-authored scenario workflow (draft → human review → publish)
- Scenario import/export (JSON round-trip)
- Operator docs: "let AI optimize your scenario" — example prompts and MCP call sequences
- **Goal state**: AI can create an organization, build a complete scenario (rich media, actions, QR), configure credentials, analyse performance, and propose improvements — entirely via MCP in one pass

## Phase 6: Upstream Integrations

Goal: connect scenarios to NeNe Records ecosystem for sales and reservation flows.

- **NeNe Records** read-only client — CMS content (product descriptions, FAQs) in message nodes
- **NeNe Shop integration** — product card node, cart creation, purchase confirmation inside a scenario
- **NeNe Booking integration** — availability picker node, reservation confirmation inside a scenario
- NeNe Corpus search client — FAQ branch content from corpus
- Unified variable context (visitor answers + upstream data)
- Integration contract documentation (OpenAPI for each upstream)

## Phase 7: Embedded AI Optimization Engine (optional)

Goal: one-click AI scenario improvement for operators who do not run external agents.

- `Optimization/` module with embedded LLM client (`LLM_PROVIDER`: `anthropic` | `openai`)
- `POST /api/v1/scenarios/{id}/suggest-improvements` — calls LLM internally, returns draft version ID
- Nightly optimization cron (opt-in per organization via `OPTIMIZATION_AUTO_DRAFT=1`)
- Analytics snapshots table for long-term trend data beyond the 180-day event retention window
- `GET /api/v1/scenarios/{id}/analytics/trends` — week-over-week and month-over-month deltas
