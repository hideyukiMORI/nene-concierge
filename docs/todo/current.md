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

**Phase 1 — Scenario Engine MVP: 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| `organizations`, `organization_users` スキーマ + マイグレーション | ✅ | #7 |
| `Organization` モジュール（src/Organization/） | ✅ | #7 |
| `OrgResolverMiddleware` + 解決戦略 4 種 | ✅ | #7 |
| JWT Bearer 認証（AdminAuth モジュール） | ✅ | #7 |
| `scenarios`, `nodes`, `edges` スキーマ + マイグレーション | ✅ | #8 |
| `sessions`, `messages`, `session_node_events` スキーマ + マイグレーション | ✅ | #8 |
| シナリオ CRUD API（src/Scenario/） | ✅ | #8 |
| セッション作成 / ステップ API（src/Engine/ 訪問者向け public エンドポイント） | ✅ | #8 |
| Engine がノード遷移時に `session_node_event` を記録 | ✅ | #8 |
| `message` / `end` ノードタイプ | ✅ | #8 |
| PHPUnit テスト 46本 / PHPStan level 8 クリーン | ✅ | #8 |

---

**Phase 2 — 条件ノード・変数・プレビュー: 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| `condition` ノードタイプ + ConditionEvaluator（eq/neq/contains/exists/not_exists） | ✅ | #11 |
| `branch_taken` を `session_node_events` に記録 (ADR 0005) | ✅ | #11 |
| セッション変数収集（collect_variable + answer） | ✅ | #11 |
| 変数補間 `{{variable_name}}` | ✅ | #11 |
| 管理者プレビューエンドポイント（draft/published 両対応） | ✅ | #11 |
| `SessionOutcome::Preview` 追加・migration 0011 | ✅ | #11 |

---

**Phase 3 — Embed Widget + Action Engine: バックログ 🔲**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| Embed widget（訪問者向け JS） | 🔲 | TBD |
| Action アダプター（Email / Slack / Chatwork / HTTP） | 🔲 | TBD |
| `condition` / `action` ノードタイプ | 🔲 | TBD |

---

**Phase 4 — MCP ツール・AI シナリオ生成: バックログ 🔲**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| MCP ツール定義 | 🔲 | TBD |
| AI シナリオ生成エンドポイント | 🔲 | TBD |

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
- Issue 番号を常に作業項目に紐づけること。
