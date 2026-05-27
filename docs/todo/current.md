# Current Work

Last updated: 2026-05-27

## 状態サマリー

**Phase 0 — Governance and Foundation: 進行中**

| 項目 | 状態 |
| --- | --- |
| README + product vision | ✅ |
| AGENTS.md + CLAUDE.md | ✅ |
| docs 骨格（roadmap / workflow / glossary / ADR 0001〜0003） | ✅ |
| ADR 0004 マルチテナント方針 | ✅ （#1） |
| product-vision.md・roadmap.md・glossary.md 拡張ビジョン反映 | ✅ （#1） |
| NENE2 consumer scaffold（composer.json / docker） | 🔲 （#2） |
| `GET /health` エンドポイント | 🔲 （#2） |
| OpenAPI baseline | 🔲 （#2） |
| CI（Backend） | 🔲 （#2） |

---

## Phase 0 残りタスク

| 優先 | 項目 | Issue | メモ |
| --- | --- | --- | --- |
| P1 | **composer.json + NENE2 インストール** | #2 | `hideyukimori/nene2` を require |
| P1 | **compose.yaml + .env.example** | #2 | app + mysql サービス |
| P1 | **`GET /health`** | #2 | NENE2 ランタイム動作確認 |
| P1 | **OpenAPI baseline** | #2 | `info` + `/health` パスのみ |
| P1 | **CI ワークフロー** | #2 | `.github/workflows/backend-ci.yml` |

---

## 次フェーズ（Phase 1）

Phase 0 完了後に着手。

| 優先 | 項目 |
| --- | --- |
| P1 | `organizations`, `organization_users` スキーマ + マイグレーション（ADR 0004） |
| P1 | `scenarios`, `nodes`, `edges` スキーマ + マイグレーション（organization_id 付き） |
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
- Issue 番号を常に作業項目に紐づけること。
