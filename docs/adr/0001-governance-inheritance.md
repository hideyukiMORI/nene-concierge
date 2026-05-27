# ADR 0001: Inherit NENE2 Governance

## Status

accepted

## Context

NeNe Concierge is a product built on NENE2. It needs engineering governance for Issue-driven workflow, commit conventions, AI agent boundaries, and code quality. Writing this from scratch duplicates effort and diverges from the NeNe ecosystem standard.

## Decision

NeNe Concierge **inherits NENE2 governance by policy**:

- Issue-driven workflow (GitHub Issues, branch per Issue, PR per branch)
- Conventional Commits with Japanese description body
- Self-review checklists before PR
- ADR-documented decisions
- AI agent operating rules in `AGENTS.md`
- Explicit, typed PHP with `declare(strict_types=1)` and PSR-12

NENE2 documentation at `vendor/hideyukimori/nene2/docs/` is the authoritative reference for framework behavior. Local `docs/` override only when a deliberate product-level deviation is recorded in an ADR.

`.cursor/rules/` keeps concise summaries; full policy text lives in `docs/`.

## Consequences

**Benefits**

- Consistent contributor experience across the NeNe ecosystem.
- AI agents can transfer workflow knowledge from NENE2 / NeNe Records / NeNe Corpus.
- Reduced governance maintenance burden.

**Costs**

- Must update local docs when NENE2 governance changes in a breaking way.
- Product-specific adaptations must be explicitly documented to avoid confusion.

**Follow-up**

- Document NeNe Concierge–specific adaptations in `docs/inheritance-from-nene2.md`.
- Add product-specific self-review checklists in `docs/review/`.

## Related

- `docs/inheritance-from-nene2.md`
- [NENE2 governance docs](https://github.com/hideyukiMORI/NENE2/tree/main/docs)
