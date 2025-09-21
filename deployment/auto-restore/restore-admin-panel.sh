#!/bin/bash

# Admin Panel Auto-Restore Script
# Делегирует восстановление на smart-restore-manager (мониторинг без PM2)

set -e

MANAGER_SCRIPT="/root/projects/beauty/deployment/auto-restore/smart-restore-manager.sh"
LOG_FILE="/root/projects/beauty/logs/restore-admin-panel.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ADMIN_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting Admin Panel restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart admin-panel"
"$MANAGER_SCRIPT" restore admin-panel
