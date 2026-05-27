# Milestone: Governance and Foundation

**Target:** 2026-05 (Phase 0)
**Status:** ✅ completed (2026-05-27)

## Goal

Make contribution, AI operation, and NENE2 inheritance unambiguous before writing product code.

## Acceptance Criteria

- [x] README describes the product clearly
- [x] Product vision is documented (`docs/explanation/product-vision.md`)
- [x] Glossary covers core domain terms (`docs/explanation/glossary.md`)
- [x] ADR 0001 (governance), ADR 0002 (separation), ADR 0003 (deployment), ADR 0004 (multi-tenancy) are accepted
- [x] `AGENTS.md` and `CLAUDE.md` enable AI agents to start work without context loss
- [x] `docs/workflow.md` and `docs/CONTRIBUTING.md` define the contribution process
- [x] `docs/inheritance-from-nene2.md` maps NENE2 governance inheritance
- [x] NENE2 consumer scaffold: `composer.json` with `hideyukimori/nene2`, `compose.yaml`, `.env.example`
- [x] `GET /health` returns `{"status":"ok"}` in Docker
- [x] OpenAPI baseline in `docs/openapi/openapi.yaml` (info + /health path)
- [x] Backend CI workflow passes (PHPStan + CS-Fixer + OpenAPI validation)
- [x] `docs/todo/current.md` reflects current state

## Issues

| Issue | Summary |
| --- | --- |
| #1 | Phase 0: ガバナンス・基盤セットアップ |
