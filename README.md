# NeNe Concierge

[![Backend CI](https://github.com/hideyukiMORI/nene-concierge/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/hideyukiMORI/nene-concierge/actions/workflows/backend-ci.yml)
[![PHP 8.4](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://www.php.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-85EA2D?logo=swagger)](./docs/openapi/openapi.yaml)

**Build chat scenarios visually. Let AI write them. Convert visitors into customers.**

NeNe Concierge is a self-hosted, open-source chat scenario platform built on [NENE2](https://github.com/hideyukiMORI/NENE2). Design guided conversation flows with a visual editor, embed them on any page as a conversion-focused widget, and let AI agents generate or update scenarios via MCP and API — without sending visitor data to a SaaS vendor.

**Primary audience:** Sales and marketing teams at Japan SMB — embed a concierge on product pages, contact forms, and checkout flows to qualify leads, answer questions, and trigger automated actions (email, Slack, Chatwork, external API calls).

> **Example operator:** A regional brand's marketing staff builds a product inquiry flow in the scenario editor, deploys the widget on the homepage, and routes hot leads to Chatwork — no engineers required day-to-day. Meanwhile, an AI agent refreshes FAQ branches overnight via MCP.

## Goals

- **Visual scenario editor** — drag-and-drop nodes, condition branches, and action steps in a React flow canvas
- **AI-driven scenario authoring** — AI agents can create, read, update, and preview scenarios via MCP and REST API
- **Conversion-focused embed** — one `<script>` tag on any page (contact forms, product pages, cart flows)
- **Action engine** — trigger HTTP API calls, send emails, notify Slack / Chatwork from within a scenario
- **Self-hosted OSS** — MIT licensed; run on shared hosting (Tier A) or Docker/VPS (Tier B)
- **Secure by design** — API boundaries, audit logs, no DB bypass for AI tools

## Architecture

```
Scenario Editor (React) ─┐
AI agents (MCP / API)   ─┼──→  NeNe Concierge API (NENE2)  ──→  DB
Embed widget            ─┘             │
                                       ├── Action Engine ──→  Email / Slack / Chatwork / HTTP
                                       └── (optional) ──→  NeNe Records / NeNe Corpus APIs
```

- **Backend**: PHP 8.4, NENE2 framework, Handler → UseCase → Repository
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS — scenario canvas + admin UI
- **API contract**: OpenAPI 3.1 ([`docs/openapi/openapi.yaml`](./docs/openapi/openapi.yaml))
- **MCP**: scenario CRUD tools, AI-authoring operations
- **Embed widget**: same-origin `widget.js` for visitor-facing chat

## Current Status

**Phases 0–2 complete; Phases 3–4 mostly complete** (last verified: 2026-07-09)

| Area | State |
| --- | --- |
| Product vision and roadmap | ✅ |
| Engineering governance (NENE2 inheritance) | ✅ |
| Repository scaffold | ✅ |
| Backend scaffold (NENE2 consumer) | ✅ |
| OpenAPI baseline | ✅ |
| Scenario engine MVP | ✅ |
| Scenario editor UI (React Flow visual editor) | ✅ |
| Admin SPA (React Router, 6-language localization) | ✅ |
| Analytics overlay + session / action logs | ✅ |
| Embed widget (`widget.js`) | ✅ |
| Action engine (email / Slack / Chatwork / HTTP) | ✅ |
| MCP tools (27-tool catalog) | ✅ |
| AI scenario generation endpoint | 🔲 |
| Frontend CI + tests | 🔶 (unit tests done; component tests remain — #58) |

See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/todo/current.md`](./docs/todo/current.md).

## Quick Start

```bash
git clone https://github.com/hideyukiMORI/nene-concierge.git
cd nene-concierge
cp .env.example .env
docker compose up --build -d
curl -fsS http://localhost:8790/health
```

> See [`docs/development/docker.md`](./docs/development/docker.md) for full setup details.

## Contributing

| Topic | Document |
| --- | --- |
| **Product vision** | [`docs/explanation/product-vision.md`](./docs/explanation/product-vision.md) |
| **Glossary** | [`docs/explanation/glossary.md`](./docs/explanation/glossary.md) |
| **Start here (agents)** | [`AGENTS.md`](./AGENTS.md) |
| NENE2 inheritance map | [`docs/inheritance-from-nene2.md`](./docs/inheritance-from-nene2.md) |
| Workflow | [`docs/workflow.md`](./docs/workflow.md) |
| Commit conventions | [`docs/development/commit-conventions.md`](./docs/development/commit-conventions.md) |
| Coding standards | [`docs/development/coding-standards.md`](./docs/development/coding-standards.md) |
| Roadmap | [`docs/roadmap.md`](./docs/roadmap.md) |
| Full contributing guide | [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) |

Work from GitHub Issues. Do not commit directly to `main`.

## License

MIT — see [LICENSE](./LICENSE).

## Related Projects

| Project | Role |
| --- | --- |
| [NENE2](https://github.com/hideyukiMORI/NENE2) | Framework runtime |
| [NeNe Records](https://github.com/hideyukiMORI/nene-records) | Optional CMS upstream |
| [NeNe Corpus](https://github.com/hideyukiMORI/nene-corpus) | Optional knowledge base upstream |
