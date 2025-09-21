#!/bin/bash

# MCP Server Auto-Restore Script

set -e

MANAGER_SCRIPT="/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh"
LOG_FILE="/root/beauty-platform/logs/restore-mcp-server.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MCP_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting MCP Server restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart mcp-server"
"$MANAGER_SCRIPT" restore mcp-server
