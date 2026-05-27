# ADR 0005: Analytics and AI-Driven Scenario Optimization

## Status

accepted

## Context

NeNe Concierge runs scripted, deterministic scenarios. Each visitor session produces a
stream of events (node visits, branch selections, action executions, drop-offs) that can be
used to:

1. **Visualize** scenario performance — operators see which nodes lose visitors, which
   branches convert, and where the flow stalls.
2. **Feed AI optimization** — an LLM agent receives a structured analytics report and
   proposes scenario edits (node copy, condition reordering, branch pruning) as a draft
   version for human review.

These two consumption patterns share the same underlying data. Designing one without the
other would require a later schema migration; designing both up front costs little in Phase 1.

The period of analysis must be configurable. A campaign scenario launched yesterday needs
a 1-day window; a stable FAQ scenario benefits from a 90-day trend. Fixed windows are
insufficient.

## Decision

### 1. Dual-Use Analytics principle

The same `session_node_events` table is the single source of truth for:

- **Canvas analytics overlay** (Phase 4): node cards show visit count, average dwell time,
  drop-off rate; edge thickness ∝ flow volume; colour-coded by drop-off severity.
- **LLM Analytics Report** (Phase 5): `get_scenario_analytics` MCP tool returns the same
  aggregated data as structured JSON.

```
session_node_events
        │
        ├── Human UI  → React Flow canvas overlay (heatmap, edge weight, colour)
        └── LLM / MCP → get_scenario_analytics() → AI proposes edits → draft → review
```

### 2. Core schema

#### `session_node_events`

```sql
CREATE TABLE session_node_events (
    id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    organization_id INT UNSIGNED     NOT NULL DEFAULT 0,
    session_id      CHAR(36)         NOT NULL,
    scenario_id     INT UNSIGNED     NOT NULL,
    node_id         VARCHAR(64)      NOT NULL,
    entered_at      DATETIME(3)      NOT NULL,   -- millisecond precision
    exited_at       DATETIME(3)      NULL,       -- NULL → visitor dropped here
    branch_taken    VARCHAR(64)      NULL,       -- condition node: selected edge label
    INDEX idx_sne_org      (organization_id),
    INDEX idx_sne_session  (session_id),
    INDEX idx_sne_node     (organization_id, scenario_id, node_id, entered_at)
);
```

Key invariants:
- Every time the Engine advances a session to a node, one row is inserted with `exited_at = NULL`.
- When the session leaves a node (next step called), `exited_at` is set.
- `exited_at` remaining `NULL` at session end indicates drop-off at that node.
- `branch_taken` is only populated for `condition` node types.

#### `sessions.outcome` column

```sql
ALTER TABLE sessions
    ADD COLUMN outcome ENUM('active','completed','dropped','converted')
        NOT NULL DEFAULT 'active';
```

| Value | Meaning |
| --- | --- |
| `active` | Session is in progress |
| `completed` | Visitor reached an `end` node |
| `dropped` | Session timed out or widget closed before `end` |
| `converted` | At least one `action` node fired successfully (email, QR, Slack, …) |

A session can be both `converted` and `completed`.
Use a second boolean column `has_conversion BOOLEAN` rather than overloading `outcome`.

```sql
ALTER TABLE sessions ADD COLUMN has_conversion BOOLEAN NOT NULL DEFAULT 0;
```

### 3. Analytics period filtering

All analytics endpoints and MCP tools accept a `period` parameter:

| Value | Meaning |
| --- | --- |
| `1d` | Last 24 hours |
| `7d` | Last 7 days (default) |
| `30d` | Last 30 days |
| `90d` | Last 90 days |
| `custom` | Requires `from` and `to` query params (ISO 8601 date, inclusive) |

Example API calls:
```
GET /api/v1/scenarios/5/analytics?period=30d
GET /api/v1/scenarios/5/analytics?period=custom&from=2026-05-01&to=2026-05-14
```

Period filtering is applied to `session_node_events.entered_at`.
Periods longer than 90 days may be slow on large datasets; the API may return a
`Retry-After` header suggesting an async export instead.

### 4. Analytics API response shape

```json
{
  "scenario_id": 5,
  "period": "30d",
  "from": "2026-04-27T00:00:00Z",
  "to":   "2026-05-27T23:59:59Z",
  "total_sessions": 1240,
  "completion_rate": 0.42,
  "conversion_rate": 0.28,
  "nodes": [
    {
      "node_id":       "n-03",
      "type":          "condition",
      "label":         "ご用件は？",
      "visits":        980,
      "avg_dwell_ms":  8100,
      "drop_off_rate": 0.20,
      "branches": {
        "購入相談": { "count": 539, "pct": 0.55, "downstream_conversion": 0.61 },
        "資料請求": { "count": 245, "pct": 0.25, "downstream_conversion": 0.18 }
      }
    }
  ],
  "bottlenecks": [
    {
      "node_id":      "n-03",
      "reason":       "high_drop_off",
      "drop_off_rate": 0.20,
      "severity":     "warning"
    }
  ]
}
```

The `bottlenecks` array is computed server-side as a convenience for both the admin UI
(badge on the node card) and LLM agents (quick signal without full node scan).

Severity levels:

| Level | drop_off_rate |
| --- | --- |
| `ok` | < 0.10 |
| `warning` | 0.10 – 0.30 |
| `critical` | > 0.30 |

### 5. Canvas analytics overlay (Phase 4)

The React Flow canvas has two modes toggled by a toolbar button:

| Mode | Description |
| --- | --- |
| **Edit mode** | Default. Drag-and-drop nodes, draw edges, edit properties. |
| **Analytics mode** | Read-only. Each node card shows analytics metrics. Edges are weighted by flow volume. |

In analytics mode each node card shows:
- visit count and percentage of total sessions
- average dwell time (formatted: `8.1s`)
- drop-off rate with severity colour (green / amber / red)
- for `condition` nodes: branch selection percentages as a mini bar chart

Edge display:
- stroke width: `1px` (min) to `8px` (max), proportional to flow volume within the scenario
- colour: same severity scale as node drop-off

Period selector in the toolbar applies to the whole overlay.

### 6. LLM integration strategy

**Phase 5 — External agent (MCP)**

NeNe Concierge exposes:
- `get_scenario(scenario_id)` — full node/edge tree as JSON
- `get_scenario_analytics(scenario_id, period)` — analytics report as above

An external LLM agent (Claude, GPT, etc.) calls these tools, reasons about the data, then
calls `update_node` / `create_draft_version` to propose edits. A human reviews and publishes.

NeNe Concierge itself has no LLM dependency in Phase 5.

**Phase 7 — Embedded LLM engine (optional)**

An `Optimization/` module can be added as an opt-in feature:

```
POST /api/v1/scenarios/{id}/suggest-improvements
  → calls LLM API internally
  → returns draft scenario version ID
  → operator reviews in editor and publishes
```

Configuration:
- `LLM_PROVIDER`: `anthropic` | `openai` | `none` (default)
- `LLM_API_KEY`: credential (never in API responses)
- `OPTIMIZATION_AUTO_DRAFT`: `1` enables nightly cron draft creation

The nightly cron is opt-in per organization, not a default behavior.

### 7. Data retention

Analytics event data can be large. Recommended policy (configurable):

| Table | Default retention |
| --- | --- |
| `session_node_events` | 180 days |
| `sessions` | 365 days |

A background job or manual `DELETE ... WHERE entered_at < ?` enforces retention.
Raw events older than the retention window are dropped; aggregated summaries may be
kept longer (future `analytics_snapshots` table, not in scope for Phase 1).

## Consequences

**Benefits**

- Node-level event granularity supports both heatmap visualization and LLM reasoning
  from Phase 1, with no schema migration required later.
- Period filtering gives operators actionable short-term and long-term views.
- LLM agent integration requires no code changes to NeNe Concierge in Phase 5 — only
  MCP tool documentation.
- The `bottlenecks` array gives the canvas UI and LLM agents a pre-computed signal,
  reducing client-side computation.

**Costs**

- `session_node_events` will be the highest-write table in the system. Index design and
  retention policy are critical.
- Computing `avg_dwell_ms` and branch percentages on-the-fly for large datasets requires
  careful query optimization or a materialized summary table (deferred to Phase 3+).
- `has_conversion` column requires the Engine to update `sessions` when an action fires.

**Follow-up**

- Phase 1: Add `session_node_events` and `sessions.outcome` / `has_conversion` to
  schema migrations. Engine records events on each step.
- Phase 3: Implement `GET /api/v1/scenarios/{id}/analytics` with period filtering.
- Phase 4: Canvas analytics overlay (edit/analytics mode toggle).
- Phase 5: MCP `get_scenario_analytics` tool and LLM workflow documentation.
- Phase 7: `Optimization/` module, embedded LLM, nightly cron draft.

## Related

- ADR 0004 (`organization_id` on all tables — `session_node_events` follows the same rule)
- `docs/explanation/glossary.md` — analytics terms
- `docs/roadmap.md` — phase breakdown
