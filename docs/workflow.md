# Workflow

NeNe Concierge uses GitHub Issues for work tracking and local Markdown for project memory. This workflow inherits [NENE2 `docs/workflow.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md).

See also: `docs/inheritance-from-nene2.md`.

## Standard Flow

1. Create or reuse a focused GitHub Issue.
2. Confirm context in `docs/roadmap.md`, `docs/milestones/`, and `docs/todo/current.md`.
3. Create a branch from `main` named like `type/issue-number-summary`.
4. Implement the smallest useful change.
5. Update docs, roadmap, milestone, or TODO files when the decision or state changes.
6. Review the relevant self-review checklist in `docs/review/`.
7. Run the narrowest meaningful verification available.
8. Commit with Conventional Commits and include the Issue number in the subject.
9. Push the branch and create a PR linked to the Issue.
10. Merge after review and checks pass.
11. Return local `main` to the merged, clean state.

**Do not commit directly to `main`.** Every merge to `main` goes through a PR tied to an Issue.

**Exceptions (direct `main` commit is allowed):**
- `docs/todo/current.md` status-only updates (task state changes, no new decisions)
- Typo fixes in documentation with zero behavior change

**Issue granularity:** Multiple related UI micro-adjustments (spacing, color, radius tweaks) may share a single Issue and be batched into one PR. Use judgment — if two changes can be reviewed together without confusion, they belong in the same Issue.

## Branch Names

```
type/issue-number-summary
```

Examples:
- `docs/1-governance-foundation`
- `feat/5-scenario-crud-api`
- `feat/12-action-slack-adapter`
- `fix/20-session-state-reset`

## Commit Message Format

```
<type>(<scope>): <日本語の説明> (#<issue>)
```

- `type` and `scope`: English
- description and body: Japanese allowed
- Public API changes: add `!` or `BREAKING CHANGE:` footer

**AI agents must append Co-Authored-By. Use two `-m` flags (a single `-m` with a literal `\n` does not create a trailer):**

```bash
git commit \
  -m "feat(editor): ノードパレットを右寄せに変更する (#55)" \
  -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

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

## GitHub Labels

Use these labels with `gh issue create --label`:

| Label | 用途 |
| --- | --- |
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `build` | ビルド・CI・依存関係 |
| `bug` | 不具合レポート |
| `enhancement` | 改善・拡張リクエスト |
| `phase-0` 〜 `phase-3` | フェーズ紐づけ |
| `good first issue` | 初回コントリビューター向け |
| `help wanted` | レビュー・協力募集 |

Example: `gh issue create --label "feat,enhancement"`

## PR Requirements

Every PR should include:

- purpose
- change summary
- verification results
- self-review checklist used (example: `Self-review: backend-api`)
- related Issue — `Closes #N` in the PR body
- remaining risks or follow-up work

## Local Project Memory

- `docs/roadmap.md`: long-lived direction and phases
- `docs/milestones/`: medium-sized goals and acceptance criteria
- `docs/todo/current.md`: current task board
- `docs/adr/`: major architecture decisions
- `docs/inheritance-from-nene2.md`: NENE2 governance inheritance map

## AI Agent Responsibilities

When asked to complete work, AI agents should run the **full lifecycle** unless the user narrows scope (investigation only, no commit, no PR, etc.):

1. Create or reuse a GitHub Issue.
2. Create a branch from `main`.
3. Implement the smallest useful change.
4. Run verification commands.
5. Commit, push, create PR, wait for CI, merge, sync `main`.
6. Update `docs/todo/current.md`.
