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

**Phase 3 — Embed Widget + Action Engine: 一部完了 🔶**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| Action アダプター（Email / Slack / Chatwork / HTTP） | ✅ | #13 |
| `action` ノードタイプ（Engine 統合・has_conversion・プレビュースキップ） | ✅ | #13 |
| ActionCredential CRUD API | ✅ | #13 |
| アナリティクス API（visit_count / dwell_ms / drop_off_rate / branch_percentages） | ✅ | #13 |
| PSR-18/17 実装（CurlHttpClient 等） | ✅ | #13 |
| Embed widget（訪問者向け JS） | 🔲 | TBD |

---

**Phase 4 — MCP ツール・AI シナリオ生成: 一部完了 🔶**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| OpenAPI spec 全エンドポイント定義（v0.2.0） | ✅ | #15 |
| MCP ツールカタログ（docs/mcp/tools.json）18 ツール | ✅ | #15 |
| mcp-server.sh Docker Compose ラッパー | ✅ | #15 |
| composer check に MCP 検証 (@mcp) 追加 | ✅ | #15 |
| AI シナリオ生成エンドポイント | 🔲 | TBD |

---

**Embed Widget — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| frontend/ セットアップ（TypeScript + esbuild、npm run check） | ✅ | #21 |
| src/widget/types.ts: API 型定義 | ✅ | #21 |
| src/widget/api.ts: fetchAppearance / startSession / stepSession | ✅ | #21 |
| src/widget/style.ts: Shadow DOM CSS（position 4 種・カラーパラメータ化） | ✅ | #21 |
| src/widget/ui.ts: DOM 構築・メッセージバブル・選択肢ボタン | ✅ | #21 |
| src/widget/index.ts: エントリポイント（data-scenario-id 読み取り・ライフサイクル） | ✅ | #21 |
| public_html/widget.js: ビルド成果物（13.4 KB IIFE） | ✅ | #21 |
| trigger_type: page_load 自動オープン / manual ボタンのみ | ✅ | #21 |
| is_terminal: true でセッション終了表示 | ✅ | #21 |

---

**Appearance モジュール — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| Appearance VO + AppearancePosition / AppearanceTrigger Enum | ✅ | #19 |
| PdoAppearanceRepository（ON DUPLICATE KEY UPDATE） | ✅ | #19 |
| GetAppearanceUseCase（行未存在 → デフォルト返却、永続化しない） | ✅ | #19 |
| UpsertAppearanceUseCase（完全置換 PUT） | ✅ | #19 |
| GET /api/v1/appearance・PUT /api/v1/appearance（Hex + Enum 検証） | ✅ | #19 |
| GET /api/v1/public/appearance（認証不要・embed widget 向け） | ✅ | #19 |
| DB マイグレーション 0014（appearances テーブル、organization_id UNIQUE FK） | ✅ | #19 |
| OpenAPI v0.3.0: 3 エンドポイント + AppearanceResponse / UpsertAppearanceRequest | ✅ | #19 |
| MCP catalog: getAppearance (read) / upsertAppearance (write) → 計 22 ツール | ✅ | #19 |
| テスト 8 本 | ✅ | #19 |

---

**Phase 5 — Import / Export: 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| ScenarioExportDocument VO（SCHEMA_VERSION=1） | ✅ | #17 |
| ExportScenarioUseCase / ExportScenarioHandler（GET /api/v1/scenarios/{id}/export） | ✅ | #17 |
| ImportScenarioUseCase / ImportScenarioHandler（POST /api/v1/scenarios/import） | ✅ | #17 |
| ノード ID 再生成（UUID v4）・エッジ参照リマップ | ✅ | #17 |
| OpenAPI / MCP catalog に export/import ツール追加（20 ツール） | ✅ | #17 |
| ラウンドトリップテスト 12 本 | ✅ | #17 |

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
- Issue 番号を常に作業項目に紐づけること。
