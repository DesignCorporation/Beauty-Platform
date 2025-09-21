#!/bin/bash

# API Gateway Auto-Restore Script
# Делегируем восстановление smart-restore-manager'у

set -e

MANAGER_SCRIPT="/root/beauty-platform/deployment/auto-restore/smart-restore-manager.sh"
LOG_FILE="/root/beauty-platform/logs/restore-api-gateway.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] GATEWAY_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting API Gateway restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart api-gateway"
"$MANAGER_SCRIPT" restore api-gateway
