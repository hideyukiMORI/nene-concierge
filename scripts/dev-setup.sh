#!/usr/bin/env bash
# scripts/dev-setup.sh
# 開発環境の初期セットアップ。クローン後またはリポジトリを新しい環境に持ち込んだ際に一度だけ実行する。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== NeNe Concierge dev setup ==="

# ── 1. Git hooks ──────────────────────────────────────────────────────────────
echo ""
echo "📎 Git hooks を .githooks/ に向ける..."
git -C "$REPO_ROOT" config core.hooksPath .githooks
chmod +x "$REPO_ROOT/.githooks/"*
echo "   OK: pre-commit hook が有効になりました"

# ── 2. Frontend 依存関係 ──────────────────────────────────────────────────────
echo ""
echo "📦 Frontend npm install..."
npm install --prefix "$REPO_ROOT/frontend"
echo "   OK"

# ── 3. 確認 ───────────────────────────────────────────────────────────────────
echo ""
echo "🔍 Frontend type-check..."
npm run type-check --prefix "$REPO_ROOT/frontend"
echo "   OK"

echo ""
echo "✅ セットアップ完了"
echo ""
echo "次のステップ:"
echo "  docker compose up -d          # API サーバー起動"
echo "  npm run build --prefix frontend  # フロントエンドビルド"
