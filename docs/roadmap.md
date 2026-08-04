# Roadmap

NeNe Concierge is a self-hosted, multi-tenant chat scenario platform on NENE2 — build guided chat flows visually, let AI author them via MCP, embed them at conversion points, and trigger real-world actions.

> **Status last verified: 2026-07-29** (measured against `main`, not self-reported).
>
> **Phase numbering warning.** This document's phases (0–7) are the *original plan* numbering.
> `CLAUDE.md` and the private handover doc (`nene-origin/internal-docs/concierge/todo/current.md`)
> use a *shipping* numbering that diverged as work landed out of order. They are not
> interchangeable — always state which numbering you mean. Mapping:
>
> | Roadmap (this file) | Shipping numbering (CLAUDE.md / current.md) |
> | --- | --- |
> | Phase 3 Action Engine + Analytics API | part of "Phase 3 Embed Widget + アクションエンジン" |
> | Phase 4 Embed Widget and Admin UI | rest of "Phase 3" + 管理画面 SPA / エディタ / オーバーレイ |
> | Phase 5 MCP Tools and AI Authoring | "Phase 4 MCP ツール・AI シナリオ生成" + "Phase 5 Import/Export" |
> | Phase 6 Upstream Integrations | (not represented) |
> | Phase 7 Embedded AI Optimization | (not represented) |
>
> Reconciling the two numbering schemes into one is deliberately **out of scope** of the
> 2026-07-29 sync (it is a naming decision, not a fact); the mapping above is the interim contract.

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

**Status: ✅ completed** (#7 / #8).

## Phase 2: Condition Nodes and Variables

Goal: branching flows and visitor-collected state.

- `condition` node type with branch evaluation
- Engine records `branch_taken` in `session_node_events` for condition nodes
- Session variable collection from `message` nodes
- Variable interpolation in message text
- Admin preview endpoint (simulate scenario without a real session)

**Status: ✅ completed** (#11).

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

**Status: 🔶 mostly completed.** Shipped: all five adapters incl. `QrCodeActionAdapter` (#13),
`has_conversion`, credential CRUD + UI (#13), `action_logs` + admin page (#42), the analytics
endpoint with period filtering and `bottlenecks[]` (#13).
**Not shipped:** action retry / failure-handling policy (no retry logic exists in `src/`),
and operator docs per action type.

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

**Status: 🔶 mostly completed.** Shipped: React Flow canvas editor with 4 node types (#26),
analytics overlay with period selector and bottleneck badges (#40), the full admin SPA
(scenarios / sessions / action logs / credentials / appearance / settings / users / history),
6-locale i18n (#30), and `public_html/widget.js` (#21, 27 KB IIFE — the widget is **done**;
older docs that list it as outstanding are stale).
**Trigger parity: reached (#204).** The widget now implements all four `AppearanceTrigger`
values — `page_load`, `scroll` (opens once past 50 % read depth), `exit_intent` (opens once
when the pointer leaves the top of the viewport), and `manual`. Verified in a real browser,
not only in unit tests. Note that `exit_intent` cannot fire on pointerless devices, and
`scroll` cannot fire on a page that is shorter than the viewport — the widget logs a warning
in that case rather than failing silently.
**Not shipped:** rich media node UI (slider / carousel / PDF viewer); Tier A deliverables
(web installer, release ZIP, shared-hosting docs) are **entirely unimplemented** —
there is no `public_html/install.php` and no `src/Install/`.

## Phase 5: MCP Tools and AI Authoring

Goal: AI-native scenario management — full GUI parity via API/MCP; LLM-driven optimization.

- MCP tool catalog: scenario CRUD, node operations, publish/draft, preview, organization management
- **`get_scenario_analytics(scenario_id, period)`** MCP tool — returns the Phase 3 analytics report
- AI optimization workflow: LLM agent reads analytics → identifies bottlenecks → proposes edits as draft → human reviews → publish
- AI-authored scenario workflow (draft → human review → publish)
- Scenario import/export (JSON round-trip)
- Operator docs: "let AI optimize your scenario" — example prompts and MCP call sequences
- **Goal state**: AI can create an organization, build a complete scenario (rich media, actions, QR), configure credentials, analyse performance, and propose improvements — entirely via MCP in one pass

**Status: 🔶 partially completed.** Shipped: MCP catalog with **27 tools** (`docs/mcp/tools.json`,
validated in `composer check`), `getScenarioAnalytics`, `saveScenarioGraph`, preview
(`startPreviewSession` / `stepPreviewSession`), and scenario import/export round-trip (#17).
**Not shipped:** the AI authoring and AI optimization workflows — there is **no scenario
generation endpoint** (measured: zero generation operations across the 31 OpenAPI operations
and the 27 MCP tools) — and the operator docs for AI-driven optimization.

## Phase 6: Upstream Integrations

Goal: connect scenarios to NeNe Records ecosystem for sales and reservation flows.

- **NeNe Records** read-only client — CMS content (product descriptions, FAQs) in message nodes
- **NeNe Shop integration** — product card node, cart creation, purchase confirmation inside a scenario
- **NeNe Booking integration** — availability picker node, reservation confirmation inside a scenario
- NeNe Corpus search client — FAQ branch content from corpus
- Unified variable context (visitor answers + upstream data)
- Integration contract documentation (OpenAPI for each upstream)

**Status: 🔲 not started.**

## Phase 7: Embedded AI Optimization Engine (optional)

Goal: one-click AI scenario improvement for operators who do not run external agents.

- `Optimization/` module with embedded LLM client (`LLM_PROVIDER`: `anthropic` | `openai`)
- `POST /api/v1/scenarios/{id}/suggest-improvements` — calls LLM internally, returns draft version ID
- Nightly optimization cron (opt-in per organization via `OPTIMIZATION_AUTO_DRAFT=1`)
- Analytics snapshots table for long-term trend data beyond the 180-day event retention window
- `GET /api/v1/scenarios/{id}/analytics/trends` — week-over-week and month-over-month deltas

**Status: 🔲 not started.** (Optional phase — gated on Phase 5's AI authoring workflow landing first.)
