# CLAUDE.md — NeNe Concierge

Claude Code / AI エージェント向け実行ガイド。このファイルだけで作業を開始できる状態を保つ。
詳細ポリシーの正本は `docs/` 以下に分散しているが、**判断に迷ったらここに戻る**。

---

## プロダクト一言要約

自己ホスト型チャットシナリオプラットフォーム（MIT）。ビジュアルエディタでチャットフローを構築し、AI が MCP/API でシナリオを生成・更新し、**embed widget** としてあらゆるページのコンバージョンポイントに設置できる。メール送信・Slack/Chatwork 通知・外部 API 呼び出しを**アクションノード**として組み込める営業・マーケティングツール。

```
シナリオエディタ (React) ─┐
AI エージェント (MCP/API) ─┼──→  NeNe Concierge API (NENE2/PHP 8.4)  ──→  DB
Embed widget             ─┘                    │
                                               ├── Action Engine ──→  Email / Slack / Chatwork / HTTP
                                               └── (任意) ──→  NeNe Records / NeNe Corpus
```

---

## 現在の開発状況

> **最終更新: 2026-05-27**（`docs/todo/current.md` が正本）

| フェーズ | 状態 |
| --- | --- |
| Phase 0 ガバナンス・基盤 | 🔲 進行中 |
| Phase 1 シナリオエンジン MVP | 🔲 バックログ |
| Phase 2 シナリオエディタ UI | 🔲 バックログ |
| Phase 3 Embed Widget + アクションエンジン | 🔲 バックログ |
| Phase 4 MCP ツール・AI シナリオ生成 | 🔲 バックログ |

---

## ワークフロー（守れない場合は作業しない）

1. **GitHub Issue を作成**（または番号を確認）する。Issue なしに編集しない。
2. `docs/roadmap.md`, `docs/todo/current.md`, 関連 Issue/PR を確認する。
3. `main` から `type/issue-number-summary` ブランチを切る。
4. 実装 → 品質チェック（後述）→ commit。
5. PR 作成：`Closes #N` + セルフレビューチェックリスト名を本文に記載。
6. CI green → merge → ローカル `main` sync。
7. `docs/todo/current.md` を最新状態に更新する。

**コミット形式（Conventional Commits）:**
```
<type>(<scope>): <日本語の説明> (#<issue>)
```
- `type`/`scope` は英語。`description`/`body` は日本語可。
- 例: `feat(scenario): シナリオ CRUD API を追加する (#5)`

**絶対禁止:**
- `main` への直接 commit/push
- Issue なしのコード・ドキュメント変更
- `.env` / トークン / パスワードのコミット

---

## アーキテクチャ規約

### PHP レイヤー構造

```
Handler → UseCase → RepositoryInterface → PdoRepository
```

| レイヤー | 責務 | やってはいけないこと |
| --- | --- | --- |
| Handler | HTTP パース・DTO 構築・UseCase 呼び出し・JSON レスポンス | SQL・ビジネスロジック・外部 API 直呼び出し |
| UseCase | ビジネスロジック・シナリオ実行オーケストレーション | `$_SERVER`・PDO・生 HTTP クライアント |
| Repository | SQL / 永続化のみ | HTTP・セッションロジック |
| Action アダプター (`Action/`) | 外部サービス（Email・Slack・Chatwork・HTTP）呼び出し | ドメイン不変条件 |

**全 PHP ファイルに `declare(strict_types=1);`。クラスは `final readonly` 推奨。**

### モジュール構成（`src/`）— ドメイン別、レイヤー別フォルダ禁止

```
src/
  ApplicationServiceProvider.php   # DI ルート
  Http/               # フロントコントローラー・RuntimeContainerFactory
  AdminAuth/          # JWT Bearer 認証
  Scenario/           # シナリオ CRUD・バージョン管理
  Node/               # ノード定義（メッセージ・条件・アクション・終端）
  Session/            # 訪問者チャットセッション管理
  Message/            # セッション内メッセージ履歴
  Engine/             # シナリオ実行エンジン（ステート機械）
  Action/             # アクションアダプター（Email・Slack・Chatwork・HTTP）
  Appearance/         # ウィジェット外観設定
  Install/            # Web インストーラー（Tier A 専用）
```

### ドメインルール

- **シナリオは不変バージョン管理**: 公開済みシナリオは上書きしない。新バージョンとして保存する。
- **アクションは非同期キュー可能**: アクションノード実行は UseCase 内で同期実行するが、将来キュー化できる interface にする。
- **embed widget は MCP を話さない**: 訪問者向けエンドポイントと AI/オペレーター向けエンドポイントを明確に分離する。
- **DB への直接 AI アクセス禁止**: MCP ツールはすべてドキュメント済み HTTP 操作に対応する。

---

## 品質チェックコマンド（実装後に追加）

```bash
docker compose run --rm app composer check   # tests + PHPStan + CS-Fixer + OpenAPI + MCP
npm run check --prefix frontend              # type-check + lint + test
```

---

## 正本ドキュメント一覧

| 目的 | ドキュメント |
| --- | --- |
| プロダクトビジョン | `docs/explanation/product-vision.md` |
| 用語集 | `docs/explanation/glossary.md` |
| AI エージェント入口 | `AGENTS.md` |
| ワークフロー | `docs/workflow.md` |
| コーディング規約 | `docs/development/coding-standards.md` |
| コミット規約 | `docs/development/commit-conventions.md` |
| NENE2 継承マップ | `docs/inheritance-from-nene2.md` |
| ロードマップ | `docs/roadmap.md` |
| 現在のタスク | `docs/todo/current.md` |
| ADR | `docs/adr/` |
