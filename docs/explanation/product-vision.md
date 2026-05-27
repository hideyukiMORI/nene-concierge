# Product Vision

NeNe Concierge is a self-hosted chat scenario platform built on [NENE2](https://github.com/hideyukiMORI/NENE2). This document records why the product exists, what it optimizes for, and how it relates to the NeNe ecosystem.

## Origin

Many small and medium businesses lose visitors at critical conversion points — product pages, contact forms, checkout flows — because there is no interactive guide to qualify intent, answer questions, and route leads. Existing chat solutions either lock data into SaaS subscriptions or require developer integration per deployment. Meanwhile, AI tools that can generate and update chat scripts are maturing rapidly.

NeNe Concierge offers a different model: **run a conversion-focused chat scenario platform on infrastructure you control**, design flows visually, and let AI agents maintain and improve those flows via documented API boundaries — not by rewriting your codebase.

The product showcases NENE2's strengths — OpenAPI-first APIs, Clean Architecture, MCP-ready ops boundaries, and field-trial-grade security — in a **sales and marketing product**, not a demo.

## North Star

Operators and AI agents can:

- design chat scenario flows visually (nodes, branches, actions) through an admin UI
- publish those flows as an **embed widget** on any same-origin page
- trigger real-world actions (email, Slack, Chatwork, external HTTP) from within a scenario
- create, read, update, and preview scenarios programmatically via MCP and REST API
- audit all visitor sessions, action executions, and scenario changes

Visitors get a guided, responsive experience. Operators keep their data and customize logic without a recurring SaaS fee.

NeNe Concierge is **not** a PHP framework. It is a **product** that consumes NENE2.

## Target Operators and Markets

**Primary — Japan SMB sales and marketing teams**

Non-engineer staff who maintain websites (often on shared hosting or a simple VPS) and need a conversion tool they can configure themselves. The scenario editor should feel approachable without coding. Day-to-day scenario editing requires no CLI or SSH.

**Secondary — Tier B developers and VPS operators**

Docker Compose for local development and production deployments. Same API and widget as Tier A.

**AI agent operators**

Teams where AI agents are responsible for generating seasonal campaigns, updating FAQ branches, or responding to product line changes by editing scenarios via MCP — while a human approves before publishing.

## Primary Use Case

NeNe Concierge optimizes for **conversion-point chat on an existing company website**:

- A **scenario** is placed on a product page, contact form, or checkout page.
- When a visitor reaches the trigger threshold (page dwell, scroll depth, exit intent — configurable), the **embed widget** opens.
- The visitor follows the scripted flow: branch conditions select paths based on answers or inferred context.
- At key steps, **action nodes** fire: send a notification to Chatwork, call a CRM API, send a confirmation email.
- Sessions and action logs are available in the admin UI for review.

**Not the primary story:** open-ended LLM chat where the AI improvises answers. NeNe Concierge runs scripted, deterministic scenarios. AI involvement is in **authoring** scenarios, not in answering visitors live (though an AI-handoff node type is a future option).

## Primary Persona

A fictional but representative operator:

> A **regional food or beverage brand** runs its product website on shared hosting. A **marketing staff member** — not an engineer — currently answers product inquiries manually by email. Leadership wants a smarter contact form: one that qualifies the visitor's intent (retail inquiry vs. wholesale vs. press), routes leads to the right Chatwork room, and sends an auto-reply. After Phase 3, they should open the scenario editor, drag out a few nodes, configure Chatwork credentials, preview in the browser, and publish — without touching PHP or `.env` files directly.

The same pattern applies to **equipment showrooms**, **regional tourism operators**, **specialty retailers**, and any SMB where staff manage web content but do not write code.

## Dual Deployment

Same codebase, two installation paths (ADR 0003):

| Tier | Path | Scenario delivery |
| --- | --- | --- |
| **Tier A — shared hosting** | Release ZIP + web installer + MySQL | Sync JSON (widget CSS for UX) |
| **Tier B — Docker / VPS** | `docker compose up` | Sync JSON |

## AI-Driven Scenario Authoring

This is the differentiating capability:

```
Human operator: edits scenario in GUI
AI agent:       creates / updates scenario via MCP or REST API
Both:           publish scenarios through the same versioned publish flow
```

An AI agent can be given a product catalog and a conversion goal, then generate a full scenario tree — FAQ branches, qualification questions, action nodes — which a human reviews and publishes. Seasonal updates, A/B variants, and post-analytics improvements can be handed off to an AI agent on a schedule.

MCP tools map directly to REST API operations. Agents never touch the database.

## Philosophy

### 1. Scripted scenarios, not open-ended LLM

Deterministic scenario execution is the default. Visitors experience a responsive, guided flow — not unpredictable LLM output. AI involvement is in scenario design and maintenance.

### 2. Actions are first-class citizens

Triggering external systems (email, Slack, Chatwork, HTTP webhooks) is a core product feature, not a plugin. Action nodes are documented, typed, and auditable.

### 3. Embed first

The primary consumer surface is the `widget.js` embed on an **existing site**. No rebuild of the operator's homepage is required. Same-origin embed avoids CORS on shared hosting.

### 4. Self-hosted OSS first

MIT license. Dual deployment: Docker Compose for Tier B; web installer + release ZIP for Tier A shared hosting.

### 5. MCP for AI agents, not for visitors

MCP protocol is an operator/agent interface. Visitor-facing endpoints speak plain JSON. These surfaces are completely separated.

### 6. Separation from NeNe Records and NeNe Corpus

NeNe Records owns structured CMS content. NeNe Corpus owns knowledge chat and document Q&A. NeNe Concierge owns scenario-driven chat and action execution. Integration is HTTP-only — NeNe Concierge may call NeNe Records or NeNe Corpus APIs as data sources, never share their databases or codebases. See ADR 0002.

```
NENE2 (framework)
  ├── NeNe Records   (CMS — optional data source)
  ├── NeNe Corpus    (knowledge chat — optional data source)
  └── NeNe Concierge (scenario chat + actions — this repo)
```

## Comparison

| Aspect | SaaS chatbot | Open-ended LLM chat | NeNe Concierge |
| --- | --- | --- | --- |
| License / cost | Subscription | API usage + infra | OSS + hosting + API (optional) |
| Scenario control | Vendor-defined | Prompt-based | Visual editor + versioned |
| AI authoring | Varies | N/A | MCP + REST API (core feature) |
| Action engine | Varies / addon | N/A | Built-in (email, Slack, Chatwork, HTTP) |
| Data location | Vendor cloud | Your infra | Your DB |
| Shared hosting | Vendor-hosted | Usually Docker-only | **Tier A** target |
| Visitor experience | Varies | Open-ended | Guided, deterministic |

## Relationship to NENE2

```
NENE2              → framework (Packagist: hideyukimori/nene2)
NeNe Concierge     → product (this repository)
NeNe Records       → optional upstream CMS
NeNe Corpus        → optional upstream knowledge base
```

- Framework changes belong in NENE2.
- Scenario engine, action adapters, widget, and product MCP tools belong here.
- See `docs/inheritance-from-nene2.md` for governance boundaries.

## Non-goals

- Rebuilding a general-purpose chatbot SaaS or LLM platform
- WordPress plugin integration (coexist on same domain is fine)
- Embedding chat inside NeNe Records or NeNe Corpus
- Exposing MCP protocol to embed widget visitors
- Direct database access for AI or MCP tools
- Real-time LLM-answered visitor chat (scripted scenarios only; AI handoff is a future option node type)
- Docker-only deployment (shared hosting must remain a first-class path)

## Naming

- **NeNe Concierge** — a concierge who guides visitors on your site.
- **scenario** — a versioned chat flow (nodes, branches, actions).
- **node** — a single step in a scenario (message, condition, action, end).
- **action** — an external operation triggered from a node (email, Slack, Chatwork, HTTP).
- **embed widget** — `widget.js` plus one same-origin `<script>` tag.

All terms: [`docs/explanation/glossary.md`](./glossary.md).
