# ADR 0003: Dual Deployment and Embed Widget

## Status

accepted

## Context

NeNe Concierge targets Japan SMB operators who already run company websites on PHP-capable shared hosting. Developers and VPS operators prefer Docker Compose. Both audiences need the same product: scenario engine, action triggers, admin UI, and embed widget.

The consumer-facing embed widget is added to an **existing homepage** — not replacing it. Same-origin deployment avoids CORS complexity on shared hosting.

Alternatives considered:

1. **Docker-only** — rejected for Japan SMB reach; shared hosting is the larger addressable market.
2. **Shared-hosting-only** — rejected; developers and VPS users need a fast, reproducible path.
3. **Dual deployment, single codebase** (chosen): same API and widget; Tier A and Tier B differ in packaging and docs only.

## Decision

NeNe Concierge supports **two deployment tiers** with one runtime codebase:

| Tier | Audience | Install path |
| --- | --- | --- |
| **A — Shared hosting** | Japan SMB primary | ZIP + web installer + FTP/SSH; MySQL |
| **B — Docker / VPS** | Developers, VPS, private cloud | `docker compose up` |

**Embed widget:**
- One `<script>` tag on any page under the **same origin** as the NeNe Concierge install.
- `widget.js` handles trigger evaluation, scenario session lifecycle, and UI rendering.
- CSS handles loading state and animation UX.
- Widget communicates with the API via plain JSON over HTTP — never MCP.

**Admin UI:**
- React SPA served from the same origin.
- JWT Bearer auth for operator sessions.

**MCP:**
- Operator/AI-facing only.
- Never embedded in the widget or exposed to visitor-facing endpoints.

## Consequences

**Benefits**

- Reaches Japan SMB market on shared hosting.
- Same codebase simplifies maintenance.
- Same-origin embed avoids CORS configuration burden for Tier A operators.

**Costs**

- Release ZIP build process must bundle `vendor/` for Tier A upload.
- Web installer is a Phase 0 deliverable for Tier A.
- Must validate MySQL and SQLite compatibility in tests.

**Follow-up**

- Document Tier A installer process in `docs/deployment/shared-hosting.md`.
- Document Tier B Docker setup in `docs/development/docker.md`.
- Add release ZIP build to CI pipeline in Phase 4.

## Related

- Product vision: `docs/explanation/product-vision.md`
- Glossary: `docs/explanation/glossary.md` (Tier A, Tier B, embed widget, same origin)
