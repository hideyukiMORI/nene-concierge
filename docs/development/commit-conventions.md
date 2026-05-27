# Commit Conventions

NeNe Concierge follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), inherited from NENE2.

## Format

```
<type>(<scope>): <description> (#<issue>)

[optional body]

[optional footer]
```

- `type` and `scope`: **English**
- `description` and body: **Japanese** preferred
- Issue number: required in the subject line
- Public API breaking changes: add `!` after scope or `BREAKING CHANGE:` footer

## Types

| type | 用途 |
| --- | --- |
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `refactor` | 機能変更なしのコード変更 |
| `test` | テストの追加・変更 |
| `build` | 依存関係・ビルド設定 |
| `ci` | CI 設定 |
| `chore` | メンテナンス |

## Scopes (examples)

| scope | 対象 |
| --- | --- |
| `scenario` | シナリオ CRUD・バージョン管理 |
| `node` | ノード定義・バリデーション |
| `engine` | シナリオ実行エンジン |
| `session` | 訪問者セッション |
| `action` | アクションアダプター（email/slack/chatwork/http） |
| `widget` | Embed widget |
| `editor` | シナリオエディタ React UI |
| `admin` | 管理 UI |
| `auth` | 認証・認可 |
| `mcp` | MCP ツール |
| `docs` | ドキュメント |
| `ci` | CI 設定 |

## Examples

```
feat(scenario): シナリオ CRUD API を追加する (#5)
feat(action): Slack 通知アクションアダプターを実装する (#18)
fix(engine): 条件ノードの分岐評価でデフォルトエッジが選択されないバグを修正する (#31)
docs(adr): ADR 0003 デュアルデプロイポリシーを追加する (#2)
refactor(session): セッションステートを readonly DTO に変更する (#44)
test(engine): シナリオ実行エンジンのユニットテストを追加する (#50)
```
