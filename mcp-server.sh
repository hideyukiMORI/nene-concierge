#!/usr/bin/env bash
# NeNe Concierge MCP server — Docker Compose wrapper
#
# Usage (Claude Code ~/.claude/claude_code_config.json):
#   {
#     "mcpServers": {
#       "nene-concierge": {
#         "command": "/path/to/nene-concierge/mcp-server.sh"
#       }
#     }
#   }
#
# Environment variables (set in .env or export before running):
#   NENE2_LOCAL_API_BASE_URL   Base URL of the running API (default: http://app)
#   NENE2_LOCAL_JWT_SECRET     JWT secret for write/admin/destructive tool calls
#
# The API must be running before starting the MCP server:
#   docker compose up -d

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec docker compose \
  --project-directory "$SCRIPT_DIR" \
  run --rm \
  -e NENE2_LOCAL_API_BASE_URL="${NENE2_LOCAL_API_BASE_URL:-http://app}" \
  -e NENE2_LOCAL_JWT_SECRET="${NENE2_LOCAL_JWT_SECRET:-}" \
  app \
  php vendor/hideyukimori/nene2/tools/local-mcp-server.php
