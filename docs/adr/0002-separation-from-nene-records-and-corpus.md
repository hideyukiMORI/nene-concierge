# ADR 0002: Separate Product from NeNe Records and NeNe Corpus

## Status

accepted

## Context

NeNe Concierge may benefit from NeNe Records (structured CMS content) and NeNe Corpus (knowledge base Q&A) as upstream data sources. Early design must decide whether these are integrated at the codebase level or kept separate with HTTP boundaries.

Alternatives considered:

1. **Embed scenario chat inside NeNe Records** — rejected; reverses dependency direction and couples CMS availability to chat availability.
2. **Share database with NeNe Corpus** — rejected; couples schemas and bypasses API contracts.
3. **Independent product with HTTP clients** (chosen): NeNe Concierge calls upstream APIs only when needed; does not share code or DB.

## Decision

NeNe Concierge is a **separate repository and deployable unit**:

- Dependency direction: `NeNe Concierge → NeNe Records API` (optional, read-only)
- Dependency direction: `NeNe Concierge → NeNe Corpus API` (optional, read-only)
- No shared PHP codebase beyond Composer dependency on NENE2.
- No scenario engine, action adapters, or widget code in NeNe Records or NeNe Corpus.
- Upstream clients live in `src/Upstream/` as typed HTTP adapters behind interfaces.
- MCP protocol is **not** exposed to embed widget visitors.

```
Embed widget visitor
    ↓
NeNe Concierge API (session state, scenario engine, action engine)
    ↓ (optional, read-only)
NeNe Records API / NeNe Corpus API
    ↓
Their respective databases (never accessed directly)
```

## Consequences

**Benefits**

- NeNe Records and NeNe Corpus remain stable when NeNe Concierge deploys or fails.
- Each product can be hosted independently.
- Clear security boundary: action adapter credentials stay in NeNe Concierge only.
- Clean OSS story: three products, one framework.

**Costs**

- Three repos to maintain; upstream API contracts must stay documented.
- Upstream integration features require HTTP client code instead of in-process calls.

**Follow-up**

- Document upstream client env vars when Phase 6 upstream integrations begin.
- Add contract tests when upstream APIs are consumed.

## Related

- Product vision: `docs/explanation/product-vision.md`
- `docs/inheritance-from-nene2.md`
- [NeNe Records](https://github.com/hideyukiMORI/nene-records)
- [NeNe Corpus](https://github.com/hideyukiMORI/nene-corpus)
