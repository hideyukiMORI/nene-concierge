# Current Work

Last updated: 2026-05-27

## 状態サマリー

**Phase 0 — Governance and Foundation: 進行中**

| 項目 | 状態 |
| --- | --- |
| README + product vision | ✅ |
| AGENTS.md + CLAUDE.md | ✅ |
| docs 骨格（roadmap / workflow / glossary / ADR 0001〜0003） | ✅ |
| NENE2 consumer scaffold（composer.json / docker） | 🔲 |
| `GET /health` エンドポイント | 🔲 |
| OpenAPI baseline | 🔲 |
| CI（Backend + Frontend） | 🔲 |
| GitHub Issue #1 作成 | 🔲 |

---

## Phase 0 残りタスク

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | **GitHub Issue #1 作成** | Phase 0 ガバナンス Issue |
| P1 | **composer.json + NENE2 インストール** | `hideyukimori/nene2` を require |
| P1 | **docker-compose.yml + .env.example** | app + mysql サービス |
| P1 | **`GET /health`** | NENE2 ランタイム動作確認 |
| P1 | **OpenAPI baseline** | `info` + `/health` パスのみ |
| P1 | **CI ワークフロー** | `.github/workflows/backend-ci.yml` |
| P2 | **自己レビューチェックリスト** | `docs/review/` |
| P2 | **マイルストーンドキュメント** | `docs/milestones/2026-05-governance-and-foundation.md` |

---

## 次フェーズ（Phase 1）

Phase 0 完了後に Issue 化してから着手。

| 優先 | 項目 |
| --- | --- |
| P1 | `scenarios`, `nodes`, `edges` スキーマ + マイグレーション |
| P1 | シナリオ CRUD API + OpenAPI |
| P1 | `sessions`, `messages` スキーマ |
| P1 | セッション作成 / ステップ / 終了 API（訪問者向け） |
| P1 | `message` / `end` ノードタイプ |
| P1 | PHPUnit テスト（SQLite） |

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
