# Glossary

Canonical English terms for NeNe Concierge documentation, OpenAPI, code comments, and AI agent output.

**Naming rules (code, API, DB):** [`docs/development/naming-conventions.md`](../development/naming-conventions.md)

---

## How to use this glossary

1. In **English docs and OpenAPI**, use the **Canonical term** exactly.
2. In **Issues and PRs (Japanese)**, you may use the **Japanese note** column on first mention, then the canonical English term in backticks.
3. Adding or changing a term requires updating this file in the same PR.

---

## Multi-tenancy

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **organization** | A tenant unit. One organization corresponds to one operator company or client. All data rows carry `organization_id`. ADR 0004. | 組織 / テナント | "tenant" (acceptable in code comments; public docs use **organization**) |
| **organization slug** | A URL-safe identifier for an organization used in subdomain or path-prefix resolution (e.g., `acme`). Unique across the instance. | 組織スラッグ | "tenant key", "org key" |
| **organization_id** | The integer partition key present in every tenant-scoped table. `DEFAULT 0` is the single-tenant sentinel. | 組織 ID | "tenant_id" (use `organization_id` in schema and code) |
| **single-tenant sentinel** | `organization_id = 0` used by self-hosted single-org installs. No `organizations` row is required. | シングルテナント番兵値 | — |
| **tenant resolution** | The process of determining `organization_id` from an incoming HTTP request. Configured by `TENANT_RESOLUTION` env var. | テナント解決 | "org detection" |
| **superadmin** | A system-level operator who can manage organizations across the instance. Bypasses normal org resolution. | スーパーアドミン | "root admin", "system admin" |

---

## Deployment and product shape

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **Tier A** | PHP **shared hosting** deployment path: ZIP upload, web installer, MySQL. Primary operator audience: Japan SMB. | ティア A / 共用ホスティング向け | "rental server tier", "hosting-only" |
| **Tier B** | **Docker / VPS** deployment path: `docker compose up`. | ティア B / Docker・VPS 向け | "cloud-only", "dev tier" |
| **dual deployment** | Same codebase and API; Tier A and Tier B differ only in packaging and installer. ADR 0003. | デュアルデプロイ | "two products" |
| **web installer** | Browser-based first-time setup (DB, admin account, credentials). Tier A deliverable. | Web インストーラ | "setup wizard" |
| **release ZIP** | Distribution archive with `vendor/` bundled for Tier A upload. | 配布 ZIP | "deployment pack" |

---

## Scenarios and flows

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **scenario** | A versioned, named chat flow consisting of nodes and edges. A scenario has a publish lifecycle. Table: `scenarios`. | シナリオ | "flow", "script" (in casual use OK; spec uses **scenario**) |
| **scenario version** | An immutable snapshot of a scenario. Published versions are never overwritten. | シナリオバージョン | "draft" (use `status` field instead) |
| **node** | A single step in a scenario. Types: `message`, `condition`, `action`, `end`. Table: `nodes`. | ノード | "step", "block" |
| **edge** | A directed connection between two nodes. Carries the condition label when leaving a `condition` node. Table: `edges`. | エッジ / 遷移 | "link", "arrow" |
| **condition node** | A node that branches the flow based on visitor input or context variables. | 条件ノード | "branch node", "if node" |
| **action node** | A node that triggers an external operation (email, Slack, Chatwork, HTTP, QR code issuance). | アクションノード | "webhook node", "integration node" |
| **message node** | A node that displays text (and optionally collects visitor input). | メッセージノード | "chat bubble node", "text node" |
| **media node** | A node that displays rich content: image slider, media carousel, or PDF/resource viewer. Phase 4. | メディアノード | "slider node", "image node" |
| **product node** | A node that renders a NeNe Shop product card inside the scenario. Phase 6. | 商品ノード | "shop node" |
| **booking node** | A node that renders a NeNe Booking availability picker inside the scenario. Phase 6. | 予約ノード | "reservation node" |
| **end node** | A terminal node that closes the session. | 終端ノード | "exit node", "close node" |
| **canvas** | The visual editing surface in the scenario editor (React flow graph). | キャンバス | "editor", "diagram" (unless referring to the whole editor UI) |

---

## Actions

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **action** | An external operation triggered by an action node: email, Slack notification, Chatwork notification, or generic HTTP API call. | アクション | "webhook" (unless specifically HTTP webhook) |
| **action adapter** | A PHP class that implements one action type (e.g., `SlackActionAdapter`). Module: `Action/`. | アクションアダプター | "integration", "connector" |
| **action log** | An audit record of each action execution: timestamp, action type, outcome, scenario/session context. Table: `action_logs`. | アクションログ | "webhook log", "notification log" |
| **HTTP action** | An action that calls a configurable external HTTP endpoint (POST/GET with payload). | HTTP アクション | "webhook" (acceptable in user-facing copy only) |
| **QR action** | An action that generates a QR code (coupon, ticket, confirmation slip) at a scenario step. The QR payload and expiry are configurable. | QR アクション | "QR code node" (the node type is `action`; QR is the adapter) |

---

## Embed widget and visitor session

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **embed widget** | The `widget.js` bundle plus one same-origin `<script>` tag placed on an existing page. | 埋め込みウィジェット | "chat plugin", "widget snippet" |
| **same origin** | Widget and API share scheme + host + port; avoids CORS on shared hosting. | 同一オリジン | "same domain" (acceptable in casual Japanese) |
| **visitor** | An end-user interacting with the embed widget. Anonymous by default; may provide identity via form input within a scenario. | 訪問者 | "user" (reserved for admin accounts), "customer" |
| **session** | A single visitor interaction with a scenario from open to close. Table: `sessions`. | セッション | "conversation", "chat" (unless casual copy) |
| **session state** | The current node pointer and collected variable values for an active session. | セッションステート | "chat state", "context" |
| **variable** | A named value collected or inferred during a session (e.g., visitor name, selected product). | 変数 | "slot", "field" (unless referring to a form field) |
| **trigger** | The condition that opens the widget on a page (e.g., page load, scroll depth, exit intent). | トリガー | "activation", "entry" |

---

## Operator and auth

| Canonical term | Definition | Japanese note | Do not use |
| --- | --- | --- | --- |
| **operator** | An authenticated admin user who manages scenarios, credentials, and settings. JWT Bearer. | オペレーター / 管理者 | "admin" (acceptable in UI labels; spec uses **operator**) |
| **operator role** | Access tier for an operator: `owner`, `editor`, `viewer` (exact set TBD in Phase 1). | オペレーターロール | "permission level" |
| **MCP tool** | An operator/AI-facing operation exposed via MCP protocol. Never exposed to visitors. | MCP ツール | "API tool" (use only when referring to OpenAPI operations) |

---

## NeNe ecosystem

| Canonical term | Definition |
| --- | --- |
| **NENE2** | The PHP micro-framework runtime (`hideyukimori/nene2`). |
| **NeNe Records** | Optional upstream CMS; NeNe Concierge may call its read APIs for content in message nodes. |
| **NeNe Shop** | A NeNe Records extension (or sibling product) providing a simple shopping cart / purchase flow. NeNe Concierge integrates via HTTP for product display and purchase confirmation inside scenarios. |
| **NeNe Booking** | A NeNe Records extension (or sibling product) providing a reservation / appointment booking flow. NeNe Concierge integrates via HTTP for availability display and reservation confirmation inside scenarios. |
| **NeNe Corpus** | Optional upstream knowledge base; NeNe Concierge may call its search APIs for FAQ-branch content. |
