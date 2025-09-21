#!/bin/bash

# Images API Auto-Restore Script

set -e

MANAGER_SCRIPT="/root/projects/beauty/deployment/auto-restore/smart-restore-manager.sh"
LOG_FILE="/root/projects/beauty/logs/restore-images-api.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] IMAGES_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting Images API restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart images-api"
"$MANAGER_SCRIPT" restore images-api
