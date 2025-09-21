#!/bin/bash

# Client Portal Auto-Restore Script
# Делегирует восстановление smart-restore-manager'у

set -e

LOG_FILE="/root/beauty-platform/logs/restore-client-portal.log"
MANAGER_SCRIPT="/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CLIENT_PORTAL_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting Client Portal restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart client-portal"
"$MANAGER_SCRIPT" restore client-portal
