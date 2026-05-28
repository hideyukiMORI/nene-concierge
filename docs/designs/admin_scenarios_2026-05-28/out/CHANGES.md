# NeNe Concierge Admin — Scenario Editor Redesign v2

**日付:** 2026-05-28
**対象:** `/admin/scenarios/:id`
**方向性:** Variant C "Studio v2" — スリムサイドバー + ピルグループ固定ヘッダー + モダンノードカード + 右ドロワー固定 + ボトムドック + 5テーマ対応

---

## 取り込み手順

1. `out/` の各ファイルを本番リポジトリ `nene-concierge` の対応パスへ上書き
2. 翻訳キーの追加が必要 (下記参照)
3. `npm run build --prefix frontend` でビルド
4. `[data-nca-theme='*']` 属性での切替動作を確認

### 既存パス → 上書き対応

```
out/public_html/admin/index.html
  → public_html/admin/index.html

out/frontend/src/admin/theme.ts
  → frontend/src/admin/theme.ts

out/frontend/src/admin/components/Layout.tsx
  → frontend/src/admin/components/Layout.tsx

out/frontend/src/admin/components/ScenarioFormPage.tsx
  → frontend/src/admin/components/ScenarioFormPage.tsx

out/frontend/src/admin/components/editor/NodeTypes.tsx
  → frontend/src/admin/components/editor/NodeTypes.tsx

out/frontend/src/admin/components/editor/NodeConfigPanel.tsx
  → frontend/src/admin/components/editor/NodeConfigPanel.tsx
```

---

## 主要な変更点

### 1. デザイントークン (`public_html/admin/index.html`)

#### 追加トークン (各テーマブロックに追加)

- `--nca-color-primary-fg` / `--nca-color-primary-tint` / `--nca-color-primary-ring`
- `--nca-color-success-fg` / `--nca-color-success-pill-bg` / `--nca-color-danger-fg`
- `--nca-color-surface-alt` (ドロワー背景・カード代替面)
- `--nca-color-text-faint` (mono ID 表示等の最薄テキスト)
- `--nca-radius-node: 2px` (ノードカード専用、CAD/dev tool 風)
- `--nca-sidebar-width-slim: 54px` (エディタ用)
- `--nca-editor-header-height: 46px`
- `--nca-editor-drawer-width: 320px`
- `--nca-shadow-elevated` (フローティングカード用)
- `--nca-glass-bg` / `--nca-glass-dock-bg` (半透明 + backdrop-filter 想定)
- `--nca-minimap-bg` (ライトはベージュ寄り、ダークは半透明グレー)
- `--nca-canvas-bg` / `--nca-canvas-dot` (キャンバスのドットグリッド)
- `--nca-edge-stroke` (React Flow のエッジストローク)

#### ノード色トークン (4タイプ × 5プロパティ × 8テーマ)

各テーマで以下を定義:
- `--nca-node-{type}-stripe` (上端アクセント、ハンドル枠)
- `--nca-node-{type}-body` (カードの背景。ダークでは色染め、ライトでは off-white tint)
- `--nca-node-{type}-edge` (カードボーダー、馴染ませる色)
- `--nca-node-{type}-chip` (choice/icon chip 背景)
- `--nca-node-{type}-chip-edge` (chip ボーダー)

色味の方針:
- **Default Light**: muted slate-blue / dijon / dusty violet / warm slate
- **Default Dark**: vivid blue / orange / purple / slate (ダーク識別性優先)
- **GitHub**: GH Primer 由来だが彩度を 15-20% 落とした dusty 版
- **Solarized**: 公式 8 アクセント (blue, orange, violet, base01)
- **Dracula**: cyan, orange, pink (action), comment
- **Monokai**: cyan, orange, purple (action), comment

### 2. `theme.ts` — 新トークン追加

`T.primaryFg`, `T.successFg`, `T.dangerFg`, `T.glassBg`, `T.glassDockBg`, `T.minimapBg`, `T.canvasBg`, `T.canvasDot`, `T.edgeStroke`, `T.radiusNode`, `T.sidebarWidthSlim`, `T.editorHeaderH`, `T.editorDrawerW`, `T.surfaceAlt`, `T.textFaint`, `T.successPillBg`, `T.shadowElevated`, `T.primaryTint`, `T.primaryRing` を追加。

新規 `NODE_TOKENS` エクスポート — 4タイプ × 5プロパティを CSS 変数文字列で返す。コンポーネントはこれを参照すれば全テーマ自動追従。

### 3. `Layout.tsx` — エディタ用 slim サイドバー

`variant="editor"` 時のみ **54px アイコンのみサイドバー** に切替。通常画面は従来通り 240px/52px のトグル可能サイドバー。NavItem / SlimNavItem の 2 種類を用意。

### 4. `ScenarioFormPage.tsx` — ピルグループ固定ヘッダー

36px → **46px** に拡大。中身を 4 つのピルコンテナにグループ化:

- **左ピル**: `<` Back + Title (inline edit + truncate) + Status pill (drop-down) + 説明トグル
- **中央ピル**: 🔍 Search + ⌘K (実装は別途、placeholder のみ)
- **右ピル 1 (`add`)**: Message / Condition / Action / End の追加チップ (dot + label)
- **右ピル 2 (actions)**: Analytics / History / **Save** (primary 色)
- **円ボタン**: Trash (削除)

破棄したもの:
- 旧 cBtn helper (ピル内 iconBtn に置き換え)
- `📊 Analytics` / `💾 Save` の文字ラベル付き並列ボタン (ピル内に集約)
- 旧スタイルの "scenarios /" breadcrumb (削除済)

### 5. `NodeTypes.tsx` — モダンノードカード

旧: 22px の太いカラーヘッダー + 角丸 3px
新:
- 角丸 **2px** (`--nca-radius-node`)
- 上端 **2px** の細いアクセントエッジ
- ボディはノード色でほんのり染色 (ダーク識別性UP)
- ヘッダー行: アイコンチップ (16×16) + ラベル (bold) + ID (mono, 右肩)
- Analytics 表示は mono フォントに統一

各色は CSS 変数 (`var(--nca-node-*-*)`) 経由なのでテーマ切替に自動追従。

### 6. `NodeConfigPanel.tsx` — タブ付きドロワー

旧: フラットなフォーム並び
新:
- 上端 3px のタイプアクセント
- ヘッダー: タイプアイコンチップ + ラベル + `Type · ID` (mono) + 閉じる
- タブ: **Config** / Analytics / Connections
- ラベルは uppercase mono (10.5px) で密度高めの dev tool 感
- Condition は Variable / Operator を 2 カラムで横並び + `Preview` ブロックで式表示
- Action の QR フィールドも 2 カラム化
- フッター: 編集情報 + 削除 (アイコン + ラベル)

---

## 必要な翻訳キー追加 (i18n)

```ts
// frontend/src/admin/i18n/messages/ja.ts に追加
'common.close':       '閉じる',
'common.remove':      '削除',
'common.search':      'ノード / アクションを検索…',
'common.history':     '履歴',
'node.tab.config':       '設定',
'node.tab.analytics':    '分析',
'node.tab.connections':  '接続',
'node.edited':           '更新済み',
'node.variableHint':     '次のノードで参照する変数名',
```

英語他言語にも対応キーを追加してください。

---

## 既存コード互換性

- **NODE_COLORS export**: 旧シグネチャ `{ bg, header, text }` を維持。新コードは `NODE_TOKENS` を直接利用推奨。
- **Layout 共通プリミティブ** (`Btn` / `Badge` / `Field` / `PageTitle` 等): 既存と同じインターフェース・スタイルを維持。
- **applyFocus / removeFocus**: 既存と同じ実装。
- **i18n キー**: 既存キーには触れていません。上記の追加分のみ必要。

---

## 既知の TODO / 別途実装

1. **検索機能 (⌘K)**: ヘッダーには placeholder のみ配置。Cmd+K でモーダル開く機能は別途実装。
2. **履歴 (History)**: ヘッダーボタンは配置済み。クリック時の動作は未実装。
3. **NodeConfigPanel の Connections タブ**: プレースホルダーのみ。エッジ情報を親 (ScenarioCanvas) から渡す配線が必要。
4. **`onClose` prop** for NodeConfigPanel: 親 (ScenarioCanvas) で setSelectedNode(null) のコールバックを渡す必要あり。
5. **ScenarioCanvas.tsx の更新**: minimap の色味、ボトムドック (zoom + status)、ドロワー閉時の挙動など、Canvas 側の見た目調整は本コミットに含めず別途対応推奨。React Flow のミニマップは独自実装に置き換えるか、`MiniMap` コンポーネントのスタイル props で `--nca-minimap-bg` を当てる。

---

## テーマ切替テスト

`document.documentElement.dataset.ncaTheme = 'github-dark'` 等で確認:

- `default-light` (= :root)
- `default-dark`
- `github-light`
- `github-dark`
- `solarized-light`
- `solarized-dark`
- `dracula-dark`
- `monokai-dark`

各テーマで以下が同期して変わることを確認:
- ノードカード 4 色
- サイドバー背景・テキスト
- Save ボタン色 (primary)
- Published バッジ色 (success)
- キャンバスドットグリッド
- ミニマップ背景
- React Flow エッジストローク (`--nca-edge-stroke`)
