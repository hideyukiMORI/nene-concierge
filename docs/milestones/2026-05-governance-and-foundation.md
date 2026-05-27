# Milestone: Governance and Foundation

**Target:** 2026-05 (Phase 0)
**Status:** in progress

## Goal

Make contribution, AI operation, and NENE2 inheritance unambiguous before writing product code.

## Acceptance Criteria

- [ ] README describes the product clearly
- [ ] Product vision is documented (`docs/explanation/product-vision.md`)
- [ ] Glossary covers core domain terms (`docs/explanation/glossary.md`)
- [ ] ADR 0001 (governance), ADR 0002 (separation), ADR 0003 (deployment) are accepted
- [ ] `AGENTS.md` and `CLAUDE.md` enable AI agents to start work without context loss
- [ ] `docs/workflow.md` and `docs/CONTRIBUTING.md` define the contribution process
- [ ] `docs/inheritance-from-nene2.md` maps NENE2 governance inheritance
- [ ] NENE2 consumer scaffold: `composer.json` with `hideyukimori/nene2`, `docker-compose.yml`, `.env.example`
- [ ] `GET /health` returns `{"status":"ok"}` in Docker
- [ ] OpenAPI baseline in `docs/openapi/openapi.yaml` (info + /health path)
- [ ] Backend CI workflow passes (PHPStan + CS-Fixer + OpenAPI validation)
- [ ] `docs/todo/current.md` reflects current state

## Issues

| Issue | Summary |
| --- | --- |
| #1 | Phase 0: ガバナンス・基盤セットアップ |
