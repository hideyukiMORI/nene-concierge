# NeNe Concierge Admin — v2 Redesign

**日付:** 2026-05-28
**対象:** 管理画面 SPA — 7 ページ全面リデザイン
**バリアント:** Default / GitHub / Solarized / Ubuntu / Dracula / Monokai (計 10 テーマバリアント)

---

## クイックスタート (レビュー)

```
1. unzip
2. redesign/index.html をブラウザで開く
3. 各ページのタイルから移動 (Dashboard / Scenarios / Appearance / Credentials / Action Logs / Sessions / Settings)
4. 右下のテーマスイッチャーで 6 テーマ × ライト/ダークを切替 (localStorage で永続)
```

> サーバー不要。静的ファイルのみ。Chrome / Safari / Firefox の最新版で確認。

---

## ファイル構成

```
redesign/
├── index.html              ← ハブ (各ページへのリンク + サムネ)
├── _shared.css             ← デザイントークン + 全テーマ override + 共通コンポーネント CSS
├── _sidebar.js             ← サイドバー (Bracket ブランド) を全ページに注入
├── _theme-switcher.js      ← 右下のテーマ切替ウィジェット
├── dashboard.html          ← KPI + スパークライン + Top scenarios + Recent failures
├── scenarios.html          ← シナリオ一覧 (filter / sort / status pill)
├── appearance.html         ← 外観設定 (color / position / trigger + ライブプレビュー)
├── credentials.html        ← クレデンシャル一覧 + 新規追加フォーム + adapter タグ
├── action-logs.html        ← ログ一覧 (success/failure pill + adapter + monospace error)
├── sessions.html           ← セッション一覧 + 右ドロワー (会話履歴 + 収集変数)
└── settings.html           ← 6 テーマピッカーグリッド
```

---

## デザインポリシー

### トーン
- **dev tool 寄り** — モノスペースを多用、密度高め、装飾を排除
- **muted designerly** — ライトテーマは彩度を 15-20% 落とした dusty トーン
- **Bracket ブランド** — `[n]` モノスペース + 点滅カーソル + `nene.concierge` ワードマーク

### 共通ルール
- ラベル: モノスペース uppercase + `0.06em letter-spacing` (`.field-label`, `.card-sub`, `.section-head .label`)
- ID・タイムスタンプ: モノスペース `.mono`
- Status / Outcome pill: 22px 高、dot + ラベル、`.pill .pill-success` 等
- Adapter タグ: `.adapter .adapter-{http,email,slack,chatwork}` 専用トーン
- Card: 角丸 4px (`--nca-radius-lg`) + 控えめなシャドウ + padding 16px 18px
- 角丸: 2px (`--nca-radius-sm`) / 3px (`--nca-radius-md`) / 4px (`--nca-radius-lg`)
- テーブル行: hover で `--nca-color-surface-hover`、最後の行のボーダーなし

### スペーシング
- gap は全体的にタイト (12-18px)、過剰な余白なし
- main 内 padding: 28px 36px
- card padding: 16px 18px
- field margin-bottom: 12px
- kpi-grid gap: 8px

---

## テーマ切替の仕組み

```html
<html lang="ja" data-nca-theme="default-light">
```

`data-nca-theme` 属性を `<html>` に設定するだけで `_shared.css` 内の `[data-nca-theme='*']` ブロックが適用されます。

**サポートしているキー:**

| キー | 種別 |
|---|---|
| `default-light` (省略時) | Default Light (Teal) |
| `default-dark` | Default Dark |
| `github-light` | GitHub Light |
| `github-dark` | GitHub Dark |
| `solarized-light` | Solarized Light |
| `solarized-dark` | Solarized Dark |
| `ubuntu-light` | Ubuntu Light |
| `ubuntu-dark` | Ubuntu Dark |
| `dracula-dark` | Dracula (dark only) |
| `monokai-dark` | Monokai (dark only) |

`_theme-switcher.js` は `localStorage.nca-theme` に選択を永続化します。

---

## 主要トークン (CSS Custom Properties)

### カラー
- `--nca-color-primary` / `-fg` / `-hover` / `-tint` — テーマアクセント
- `--nca-color-bg` / `-surface` / `-surface-alt` / `-surface-hover` — 面
- `--nca-color-sidebar` / `-text` / `-title` / `-active` — サイドバー
- `--nca-color-text` / `-strong` / `-muted` / `-faint` — テキスト 4 段
- `--nca-color-border` / `-input` / `-light` — 罫線 3 段
- `--nca-color-danger-fg` / `-bg` / `-border` / `-text` — エラー系
- `--nca-color-success-fg` / `-pill-bg` — 成功系
- `--nca-badge-{draft|pub|arch}-{bg|color}` — シナリオステータス

### サイズ
- `--nca-font-{xs,sm,base,md,lg,xl,2xl}` (11-22px)
- `--nca-control-height` (28px) / `-sm` (24px) / `-xs` (20px)
- `--nca-radius-{sm,md,lg,xl}` (2/3/4/9999px)
- `--nca-sidebar-width` (240px)

### モーション
- `--nca-transition-fast` (150ms ease)
- `--nca-transition-normal` (200ms ease)

---

## 取り込み手順 (次のステップ)

### 視覚レビュー OK 後の TSX 化

1. `_shared.css` の `:root` トークンは既に `out/public_html/admin/index.html` に同期済み
2. 各ページの HTML 構造を React コンポーネントに置き換え:

```
redesign/dashboard.html    → frontend/src/admin/components/DashboardPage.tsx
redesign/scenarios.html    → frontend/src/admin/components/ScenariosPage.tsx
redesign/appearance.html   → frontend/src/admin/components/AppearancePage.tsx
redesign/credentials.html  → frontend/src/admin/components/CredentialsPage.tsx
redesign/action-logs.html  → frontend/src/admin/components/ActionLogsPage.tsx
redesign/sessions.html     → frontend/src/admin/components/SessionsPage.tsx
redesign/settings.html     → frontend/src/admin/components/SettingsPage.tsx
```

3. サイドバー (`_sidebar.js` 相当) は `Layout.tsx` で既に展開済み (Bracket ブランド適用済)
4. テーマ切替ウィジェット (`_theme-switcher.js`) は **本番では不要** — 設定画面 (`SettingsPage`) でテーマ選択するため

### 必要な i18n キー追加

```ts
// frontend/src/admin/i18n/messages/ja.ts に追加
'common.search':     '検索…',
'common.export':     'エクスポート',
'common.refresh':    '再読み込み',
'dashboard.title':   'ダッシュボード',
// その他、各ページ用のセクション見出し・ヘルプテキスト
```

---

## 既知の TODO / 別途実装

1. **検索バー (⌘K / `/`)** — UI のみ配置。グローバル検索の実装は別途。
2. **Export CSV** — Logs / Sessions のエクスポートボタンは UI のみ。
3. **Pagination** — UI のみ。`useState` でページ管理 + API 連動が必要。
4. **Sessions 詳細ドロワー** — 現状静的表示。行クリックで `selectedSessionId` 管理 + API 呼び出しが必要。
5. **Appearance のライブプレビュー** — フォーム値とプレビューの双方向同期が必要 (`useState`)。
6. **テーマ永続化** — `_theme-switcher.js` は localStorage に永続化するが、本番では `useTheme` Context (既存) と統合。

---

## デザインの判断ログ

- **Bracket ブランド** に決定 — ターミナル / dev tool の空気感が SaaS 管理画面に最適。点滅カーソルは「生きてる」サインとして残置
- **ノードカード v2** (角丸 2px + ノード色染めボディ) はエディタ専用なので admin pages では使用せず
- **ライト色は muted** — `#3B82F6` のような生のブルーは "業務アプリ感" が出るので避け、`#5B7CB8` (slate-blue) など彩度落とした dusty トーンに統一
- **モノスペース大量採用** — Label / ID / Time / Count はすべてモノで、Inter (本文) と対比
- **テーブル行のシマシマなし** — 行 hover + 最後のボーダーなしで `light + airy` を維持
- **ベージュ寄りミニマップ背景** — Solarized の paper トーンに馴染ませる方針 (エディタ側)

---

## 質問・フィードバック先

このディレクトリの内容で OK なら、次の TSX 化フェーズで以下を確認してください:

- 上記 i18n キー追加に問題ないか
- `SettingsPage` のテーマピッカーの localStorage key 名は `nca-theme` で良いか (既存と整合)
- Sessions 詳細ドロワーの `_analytics` データスキーマは想定通りか
