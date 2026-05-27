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

## AI Agent Commits (Co-Authored-By)

AI agents (Claude Code, etc.) must append a `Co-Authored-By` trailer. Use two `-m` flags — a single `-m` with `\n` does not produce a proper git trailer:

```bash
# ✅ Correct: two -m flags
git commit \
  -m "feat(editor): ノードパレットを右寄せに変更する (#55)" \
  -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

# ❌ Wrong: \n in a single -m does not create a trailer
git commit -m "feat(editor): ... (#55)\nCo-Authored-By: ..."
```

The model name in the trailer should match the model actually used (e.g., `claude-haiku-4-5-20251001` for Haiku, `claude-opus-4-7` for Opus).
