# Current Work

Last updated: 2026-07-18 (suppressions 増量防止 ratchet #182 完了を反映)

## 直近の完了（2026-05-31 → 2026-07-09）

| 項目 | 状態 | Issue / PR |
| --- | --- | --- |
| バックエンド UT 全域カバレッジ（未テストモジュール + 境界値） | ✅ | #132 (PR #133) |
| Handler 層 + GetUserByIdUseCase の UT 追加 | ✅ | #134 (PR #135) |
| フロントエンド UT（Vitest セットアップ + 全機能テスト）+ Frontend CI | ✅ | #57 #58 (PR #136 #137) |
| ローカル Docker ポートを 87xx/3790 に固定（ポートマップを CLAUDE.md へ） | ✅ | #138 (PR #139) |
| フロントエンド共通スタイル定数・RightPane / CloseIcon 抽出（重複排除） | ✅ | #140 (PR #141) |
| 本番 JWT フェイルクローズ — dev secret フォールバック廃止 | ✅ | #144 (PR #145) |
| 自前 resolveJwtSecret を撤去し NENE2 GuardedJwtSecretResolver へ移行 | ✅ | #146 (PR #147) |
| README Current Status 節を実態（Phase 0-2 完了・Phase 3-4 ほぼ完了）に同期 | ✅ | #155 (PR #156) |

---

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

**Admin UI — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| React 19 + React Router v7 + TypeScript による管理画面 SPA | ✅ | #23 |
| esbuild esnext ターゲット（admin は常にモダンブラウザ） | ✅ | #23 |
| 認証: JWT localStorage (nene_admin_token) / LoginPage | ✅ | #23 |
| RequireAuth + Layout ネストルーティング（Outlet 方式） | ✅ | #23 |
| ScenariosPage: 一覧・削除・Badge ステータス表示 | ✅ | #23 |
| ScenarioFormPage: 新規作成・編集・削除・公開 | ✅ | #23 |
| AppearancePage: カラーピッカー + 位置・トリガー設定 | ✅ | #23 |
| CredentialsPage: クレデンシャル一覧・作成・削除 | ✅ | #23 |
| 共通 UI: PageTitle / Card / Btn / Badge / ErrorMsg / Field / Select | ✅ | #23 |
| public_html/admin/index.html + app.js ビルド成果物 | ✅ | #23 |

---

**ビジュアルシナリオエディタ — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| PUT /api/v1/scenarios/{id}/graph — ノード・エッジ一括保存 | ✅ | #25 |
| SaveScenarioGraphHandler / UseCase / Input VO 3 種 | ✅ | #25 |
| PHPUnit 7 テスト (118 tests 全通過) | ✅ | #25 |
| OpenAPI v0.4.0: SaveScenarioGraphRequest スキーマ | ✅ | #25 |
| MCP catalog: saveScenarioGraph (write) ツール | ✅ | #25 |
| @xyflow/react (React Flow v12) キャンバスエディタ | ✅ | #26 |
| 4 種カスタムノード (message / condition / action / end) | ✅ | #26 |
| ノードパレット・ドラッグ移動・エッジ接続・Delete 削除 | ✅ | #26 |
| NodeConfigPanel: 右パネルでノードタイプ別設定編集 | ✅ | #26 |
| ScenarioFormPage: メタ情報バー + キャンバス統合レイアウト | ✅ | #26 |
| app.css バンドル (React Flow スタイル 17.2 KB) | ✅ | #26 |

---

**CSS変数テーマトークン — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| public_html/admin/index.html: :root ブロックに --nca-* 変数定義 | ✅ | #28 |
| frontend/src/admin/theme.ts: T.* 定数ファイル（nene-corpus cssVars パターン） | ✅ | #28 |
| 全8コンポーネントのハードコード値を T.* に置換 | ✅ | #28 |

---

**管理画面 6言語ローカライズ — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| frontend/src/admin/i18n/ ディレクトリ新設 | ✅ | #30 |
| locales.ts: SupportedLocale 型・LOCALES・resolveLocale() | ✅ | #30 |
| translate.ts: {{param}} 補間付き translate() | ✅ | #30 |
| i18n-context.tsx: I18nProvider / useTranslation() | ✅ | #30 |
| messages/en.ts: 英語カタログ（ソースオブトゥルース） | ✅ | #30 |
| messages/ja.ts: 日本語 | ✅ | #30 |
| messages/fr.ts: フランス語 | ✅ | #30 |
| messages/zh-Hans.ts: 中国語（簡体字） | ✅ | #30 |
| messages/pt-BR.ts: ポルトガル語（ブラジル） | ✅ | #30 |
| messages/de.ts: ドイツ語 | ✅ | #30 |
| 全8コンポーネントを useTranslation() に移行 | ✅ | #30 |
| サイドバーフッターにロケールセレクタ追加 | ✅ | #30 |
| FOUC 防止の早期ロケール検出（index.tsx） | ✅ | #30 |

---

**管理画面デザインリフレッシュ — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| カラーシステム hex → OKLCH 全面移行 | ✅ | #32 |
| アクセントカラー blue → teal oklch(62% 0.14 192) | ✅ | #32 |
| nene-records AppShell スタイルサイドバー | ✅ | #32 |
| NavLink ホバーステート | ✅ | #32 |
| Admin バッジ pill（サイドバー + ログイン画面） | ✅ | #32 |

---

**管理画面ロケール別 Web フォント — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| @fontsource/inter / noto-sans-jp / noto-sans-sc インストール | ✅ | #34 |
| esbuild woff2/woff ローダー追加（outdir 方式） | ✅ | #34 |
| frontend/src/admin/fonts.ts 新設 | ✅ | #34 |
| frontend/src/admin/i18n/locale-fonts.ts 新設 | ✅ | #34 |
| applyLocaleFontFamily() → --nca-font-body CSS 変数方式 | ✅ | #34 |
| FOUC 防止早期適用（index.tsx） | ✅ | #34 |

---

**管理画面テーマピッカー — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| admin-theme-config.ts: Default/GitHub/Solarized/Dracula/Monokai 定義 | ✅ | #36 |
| theme-context.tsx: ThemeProvider / useTheme() / detectAdminTheme() / applyAdminTheme() | ✅ | #36 |
| index.html: 8テーマ × CSS変数オーバーライドブロック（`[data-nca-theme='...']`） | ✅ | #36 |
| FOUC 防止早期テーマ検出（index.tsx） | ✅ | #36 |
| サイドバーテーマスウォッチ + ☀/🌙 トグル | ✅ | #36 |
| テーマ選択を Settings ページへ移動（サイドバーはトグルのみ残す） | ✅ | #38 |
| SettingsPage.tsx: ThemeCard ミニプレビュー グリッド | ✅ | #38 |
| /settings ルート + nav.settings リンク追加 | ✅ | #38 |
| 全6言語に settings.* / theme.* キー追加 | ✅ | #38 |

---

**Analytics オーバーレイ — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| NodeAnalyticsData / ScenarioAnalyticsResponse 型 + getScenarioAnalytics() | ✅ | #40 |
| Edit ↔ Analytics セグメントコントロール | ✅ | #40 |
| 期間セレクタ 1D / 7D / 30D / 90D | ✅ | #40 |
| ノードオーバーレイ: 訪問数 + 離脱率色分け (緑/橙/赤) | ✅ | #40 |
| ボトルネックノード: 赤ボーダー + ⚠ バッジ | ✅ | #40 |
| ConditionNode: 分岐割合 pill バッジ | ✅ | #40 |
| Analytics サマリーパネル（右パネル）: 総セッション・完了・CV | ✅ | #40 |
| Analytics モード中は編集操作を無効化 | ✅ | #40 |
| 全6言語 analytics i18n キー追加 | ✅ | #40 |

---

**action_logs 監査テーブル + 管理画面 UI — 完了 ✅**

| 項目 | 状態 | Issue |
| --- | --- | --- |
| ActionLogRepositoryInterface に listByOrganization() / countByOrganization() 追加 | ✅ | #42 |
| PdoActionLogRepository 実装（フィルター + ページネーション） | ✅ | #42 |
| ListActionLogsHandler 新規作成（GET /api/v1/action-logs） | ✅ | #42 |
| OpenAPI v0.5.0 + MCP catalog listActionLogs ツール（計 23 ツール） | ✅ | #42 |
| ListActionLogsHandlerTest 7 本 | ✅ | #42 |
| ActionLogsPage.tsx: フィルター + テーブル + ページネーション | ✅ | #42 |
| /action-logs ルート + サイドバーナビリンク | ✅ | #42 |
| tableRow CSS トークン + 全8テーマ変数追加 | ✅ | #42 |

---

**セッションログ一覧・詳細 — 完了 ✅** (PR #45 マージ済み)

| 項目 | 状態 | Issue |
| --- | --- | --- |
| ChatSessionRepositoryInterface に listByOrganization() / countByOrganization() 追加 | ✅ | #44 |
| PdoChatSessionRepository 実装（preview 除外・フィルター・ページネーション） | ✅ | #44 |
| ListSessionsHandler 新規作成（GET /api/v1/sessions） | ✅ | #44 |
| GetSessionDetailHandler 新規作成（GET /api/v1/sessions/{session_id}） | ✅ | #44 |
| EngineServiceProvider / EngineRouteRegistrar に両ハンドラー登録 | ✅ | #44 |
| PHPUnit: ListSessionsHandlerTest 8本 + GetSessionDetailHandlerTest 5本 | ✅ | #44 |
| OpenAPI v0.6.0: SessionSummary / SessionDetail / SessionMessage スキーマ追加 | ✅ | #44 |
| MCP catalog: listSessions + getSessionDetail ツール追加（計 26 ツール） | ✅ | #44 |
| SessionsPage.tsx: フィルターバー・テーブル・詳細サイドパネル | ✅ | #44 |
| api.ts: SessionSummary / SessionDetail 型 + listSessions() / getSessionDetail() | ✅ | #44 |
| /sessions ルート + サイドバーナビリンク | ✅ | #44 |
| surfaceHover CSS トークン + 全8テーマ変数追加 | ✅ | #44 |
| 全6言語に sessions.* キー追加 | ✅ | #44 |

---

**フロントエンド品質基盤 — 一部完了 🔶**（CI + 単体テスト済 / 追加のコンポーネントテスト #58 残）

| 項目 | 状態 | Issue |
| --- | --- | --- |
| `.github/workflows/frontend-ci.yml` 新設（type-check + build ステップ） | ✅ | #57 |
| `tsconfig.json` の `noEmit` + `strict` 設定確認 | ✅ | #57 |
| `npm run type-check` / `npm run build` スクリプト整備 | ✅ | #57 |
| Vitest + @testing-library/react セットアップ | ✅ | #58 (PR #136) |
| 全機能ユニットテスト実装 + CI に `npm run test` ステップ追加 | ✅ | #57 #58 (PR #136 #137) |
| 追加のコンポーネントテスト（ScenarioCanvas / NodeConfigPanel / SessionsPage 等）拡充 | 🔲 | #58 (open) |
| **ESLint ゲート導入**（nene2-standards 共有 config・既存 522 違反を native bulk-suppressions で凍結・CI を `npm run check` 経由に集約）フリート 13/13 達成 | ✅ | #178 (PR #179) |
| **suppressions 増量防止 ratchet**（`eslint-suppressions.json` を origin/main と diff・エントリ追加/件数増=FAIL・削除のみ PASS・`check` に組込） | ✅ | #182 (PR #183) |

---

**ユーザー管理 — 完了 ✅** (PR #117)

| 項目 | 状態 | Issue |
| --- | --- | --- |
| /api/v1/users CRUD (list/create/update/delete) | ✅ | #116 |
| 最後の superadmin 降格 / 削除ガード | ✅ | #116 |
| CapabilityResolver: GET /users も ManageUsers 必須化 | ✅ | #116 |
| UsersPage (desktop table + mobile cards + BottomSheet form) | ✅ | #116 |
| nav.users + サイドバー icon | ✅ | #116 |
| en/ja に users.* キー追加 | ✅ | #116 |

---

**シナリオ編集履歴 横断ビュー — 完了 ✅** (PR #123)

| 項目 | 状態 | Issue |
| --- | --- | --- |
| GET /api/v1/scenario-revisions (横断検索 + フィルター + ページネーション) | ✅ | #122 |
| ScenarioRevisionRepositoryInterface: searchByOrganization() + countByOrganization() | ✅ | #122 |
| LEFT JOIN scenarios で scenario_name 同梱 | ✅ | #122 |
| /history ページ (PC table + モバイル card list) | ✅ | #122 |
| フィルター: シナリオ / 操作種別 / 期間 / 検索キーワード | ✅ | #122 |
| ページャ (limit 50, prev/next) | ✅ | #122 |
| サイドバーに 履歴 ナビ追加 | ✅ | #122 |
| en/ja に history.* / nav.history / common.prev / common.next | ✅ | #122 |

---

**Me エンドポイント + サイドバー組織表示 — 完了 ✅** (PR #121)

| 項目 | 状態 | Issue |
| --- | --- | --- |
| GET /api/v1/me (id / email / role + 所属組織 + 現在組織) | ✅ | #120 |
| 新モジュール src/Me/ (PSR-4 Handler→UseCase→Repository) | ✅ | #120 |
| AdminApiAuthMiddleware: /api/v1/me を ADMIN_ONLY_PREFIXES に追加 (GET でも認証必須) | ✅ | #120 |
| CapabilityResolver: /api/v1/me は認証済みなら誰でも通す | ✅ | #120 |
| Layout サイドバー: OrgIndicator (現在組織名 + 他組織数 + slim 時イニシャル) | ✅ | #120 |
| en/ja に me.* キー追加 | ✅ | #120 |

**未対応 (将来 Issue)**: 実際の組織切替 (JWT org_id claim + resolver 上書き戦略)

---

**シナリオ編集履歴 (created_by / updated_by + scenario_revisions) — 完了 ✅** (PR #119)

| 項目 | 状態 | Issue |
| --- | --- | --- |
| JWT claim に user_id 追加 (副次効果: DeleteUserHandler self-delete バグ修正) | ✅ | #118 |
| ActorContext::fromRequest() | ✅ | #118 |
| scenarios に created_by_user_id / updated_by_user_id 列追加 | ✅ | #118 |
| scenario_revisions テーブル新設 + ScenarioRevisionRecorder | ✅ | #118 |
| Create / Update / Delete / SaveGraph で履歴追記 | ✅ | #118 |
| GET /api/v1/scenarios/{id}/history | ✅ | #118 |
| ScenarioHistoryPanel (PC ヘッダー + モバイル kebab) | ✅ | #118 |
| en/ja に history.* キー追加 | ✅ | #118 |

---

**管理画面 v2 リデザイン (PC + Mobile + Wide) — 完了 ✅**

PR #100 でスタックされた全 PR (#74 #76 #79 #90-#98 + 2-pane) を一括 main にマージ。

| 項目 | 状態 | Issue |
| --- | --- | --- |
| 3 段階レスポンシブ (desktop / tablet / mobile) | ✅ | #73 |
| 全 7 ページ完全実装 + ThemeSwitcher ウィジェット | ✅ | #75 |
| Studio v2 Canvas 復元 (BottomDock / dots / edges / minimap) | ✅ | #78 |
| モバイル UI プリミティブ (MobileHeader / Sheet / FAB / CardList / Pill 等) | ✅ | #81 |
| Dashboard モバイル (Alert / KPI 2-col / Sparkline) | ✅ | #82 |
| Scenarios モバイル (Filter chips / SwipeRow / FAB) | ✅ | #83 |
| Sessions モバイル (Card list / BottomSheet 詳細) | ✅ | #84 |
| ActionLogs モバイル (Failure 左赤ボーダー / Adapter chip) | ✅ | #85 |
| ScenarioEditor モバイル (簡易ヘッダー / BottomSheet NodeConfig / FAB) | ✅ | #86 |
| Credentials モバイル (Adapter 色分け Card / FAB) | ✅ | #87 |
| Appearance モバイル (Sticky preview chip + 縦並びフォーム) | ✅ | #88 |
| Settings モバイル (6 テーマピッカー 2 カラム) | ✅ | #89 |
| レスポンシブ 2-pane (≥1441 Sessions / ActionLogs / Appearance / Dashboard) | ✅ | #99 |
| Layout providesHeader unmount/remount 無限ループ修正 | ✅ | #80 配下 |
| レイアウト検証用ダミーデータシーダー | ✅ | — |

---

## Operating Notes

- このファイルはマイルストーン完了時またはセッション終了時に更新する。
- FT ループは NENE2 本体のみ。このリポジトリには FT ループはない。
- main がクリーンな状態でセッションを終えること。
- Issue 番号を常に作業項目に紐づけること。
