#!/bin/bash

# Salon CRM Auto-Restore Script
# Делегирует восстановление smart-restore-manager'у

set -e

SERVICE_NAME="beauty-salon-crm-6001"
SERVICE_PORT=6001
SERVICE_DIR="/root/projects/beauty/apps/salon-crm"
LOG_FILE="/root/projects/beauty/logs/restore-salon-crm.log"
MANAGER_SCRIPT="/root/projects/beauty/deployment/auto-restore/smart-restore-manager.sh"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SALON_CRM_RESTORE: $1" | tee -a "$LOG_FILE"
}

log "🚨 Starting Salon CRM restore..."

if [ ! -x "$MANAGER_SCRIPT" ]; then
    log "❌ smart-restore-manager.sh not found at $MANAGER_SCRIPT"
    exit 1
fi

log "🔁 Using smart-restore-manager to restart salon-crm"
"$MANAGER_SCRIPT" restore salon-crm
