# Current Work

Last updated: 2026-05-27

## 状態サマリー

**Phase 0 — Governance and Foundation: 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| README + product vision | ✅ | — |
| AGENTS.md + CLAUDE.md | ✅ | — |
| docs 骨格（roadmap / workflow / glossary / ADR 0001〜0003） | ✅ | — |
| ADR 0004 マルチテナント方針 | ✅ | #1 |
| product-vision.md・roadmap.md・glossary.md 拡張ビジョン反映 | ✅ | #1 |
| NENE2 consumer scaffold（composer.json / docker） | ✅ | #2 |
| `GET /health` エンドポイント | ✅ | #2 |
| OpenAPI baseline | ✅ | #2 |
| CI（Backend: PHPUnit / PHPStan / CS-Fixer / OpenAPI） | ✅ | #2 |

---

## 次フェーズ（Phase 1）— シナリオエンジン MVP

Issue 化してから着手すること。

| 優先 | 項目 | メモ |
| --- | --- | --- |
| P1 | `organizations`, `organization_users` スキーマ + マイグレーション | ADR 0004 参照 |
| P1 | `Organization` モジュール（src/Organization/） | nene-records パターン準拠 |
| P1 | `OrgResolverMiddleware` + 解決戦略 4 種 | ADR 0004 参照 |
| P1 | `scenarios`, `nodes`, `edges` スキーマ + マイグレーション | organization_id 付き |
| P1 | シナリオ CRUD API + OpenAPI | |
| P1 | `sessions`, `messages` スキーマ | |
| P1 | セッション作成 / ステップ / 終了 API（訪問者向け） | |
| P1 | `message` / `end` ノードタイプ | |
| P1 | PHPUnit テスト（SQLite） | |
| P1 | JWT Bearer 認証（AdminAuth モジュール） | nene-records パターン準拠 |

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
- Issue 番号を常に作業項目に紐づけること。
