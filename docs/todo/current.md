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
| ADR 0005 アナリティクス + AI最適化設計 | ✅ | #5 |
| roadmap.md アナリティクス・AI最適化フェーズ反映 | ✅ | #5 |
| glossary.md アナリティクス用語追加 | ✅ | #5 |

---

**Phase 1 — Scenario Engine MVP: 進行中 🔄**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| `organizations`, `organization_users` スキーマ + マイグレーション | ✅ | #7 |
| `Organization` モジュール（src/Organization/） | ✅ | #7 |
| `OrgResolverMiddleware` + 解決戦略 4 種 | ✅ | #7 |
| JWT Bearer 認証（AdminAuth モジュール） | ✅ | #7 |
| `scenarios`, `nodes`, `edges` スキーマ + マイグレーション | 🔲 | #8 |
| `sessions`, `messages` スキーマ + `outcome` + `has_conversion` | 🔲 | #8 |
| **`session_node_events`** スキーマ + マイグレーション | 🔲 | #8 |
| シナリオ CRUD API + OpenAPI | 🔲 | #8 |
| セッション作成 / ステップ / 終了 API（訪問者向け） | 🔲 | #8 |
| **Engine がノード遷移時に `session_node_event` を記録** | 🔲 | #8 |
| `message` / `end` ノードタイプ | 🔲 | #8 |
| PHPUnit テスト（SQLite） | 🔲 | #8 |

---

## 次の作業（Issue #8）

```
feat(scenario+engine): Phase 1 シナリオエンジン MVP
```

- シナリオ CRUD + バージョン管理（scenarios / nodes / edges テーブル）
- セッション管理（sessions + session_node_events テーブル、ADR 0005）
- Engine: メッセージノード → 終端ノードの最小ステートマシン
- OpenAPI 拡張

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
- Issue 番号を常に作業項目に紐づけること。
