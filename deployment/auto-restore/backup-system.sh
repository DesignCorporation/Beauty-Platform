#!/bin/bash

# Beauty Platform Auto-Restore System - Backup Manager
# Создает backup всех критических конфигураций

set -e

BACKUP_DIR="/root/beauty-platform/deployment/auto-restore/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/root/beauty-platform/logs/backup-system.log"

# Создаем директории
mkdir -p "$BACKUP_DIR/configs/$TIMESTAMP"
mkdir -p "$BACKUP_DIR/ecosystem/$TIMESTAMP"
mkdir -p "$BACKUP_DIR/env/$TIMESTAMP"
mkdir -p "$BACKUP_DIR/packages/$TIMESTAMP"
mkdir -p "/root/beauty-platform/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔄 Starting backup process..."

# 1. Backup PM2 ecosystem files
log "📦 Backing up PM2 ecosystem configurations..."
if [ -f "/root/ecosystem.config.js" ]; then
    cp "/root/ecosystem.config.js" "$BACKUP_DIR/ecosystem/$TIMESTAMP/"
fi

# Find and backup all ecosystem files in services
find /root/beauty-platform/services -name "ecosystem.config.js" -exec cp {} "$BACKUP_DIR/ecosystem/$TIMESTAMP/" \;

# 2. Backup environment files
log "🔐 Backing up environment files..."
cp /root/beauty-platform/.env "$BACKUP_DIR/env/$TIMESTAMP/" 2>/dev/null || true
cp /root/beauty-platform/.env.production "$BACKUP_DIR/env/$TIMESTAMP/" 2>/dev/null || true

# Backup service-specific env files
for service_dir in /root/beauty-platform/services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        if [ -f "$service_dir/.env" ]; then
            cp "$service_dir/.env" "$BACKUP_DIR/env/$TIMESTAMP/${service_name}.env"
        fi
    fi
done

# 3. Backup package.json files
log "📋 Backing up package configurations..."
cp /root/beauty-platform/package.json "$BACKUP_DIR/packages/$TIMESTAMP/root-package.json"

for service_dir in /root/beauty-platform/services/*/; do
    if [ -d "$service_dir" ]; then
        service_name=$(basename "$service_dir")
        if [ -f "$service_dir/package.json" ]; then
            cp "$service_dir/package.json" "$BACKUP_DIR/packages/$TIMESTAMP/${service_name}-package.json"
        fi
    fi
done

for app_dir in /root/beauty-platform/apps/*/; do
    if [ -d "$app_dir" ]; then
        app_name=$(basename "$app_dir")
        if [ -f "$app_dir/package.json" ]; then
            cp "$app_dir/package.json" "$BACKUP_DIR/packages/$TIMESTAMP/${app_name}-package.json"
        fi
    fi
done

# 4. Create service configuration snapshot
log "⚙️ Creating service configuration snapshot..."
cat > "$BACKUP_DIR/configs/$TIMESTAMP/service-status.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "pm2_list": $(pm2 jlist),
    "critical_services": {
        "auth_service": {
            "port": 6021,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-auth-service") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-auth-service") | .pm2_env.status // "not_found"')"
        },
        "crm_api": {
            "port": 6022,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-crm-api-6022") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-crm-api-6022") | .pm2_env.status // "not_found"')"
        },
        "admin_panel": {
            "port": 6002,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-admin-panel-6002") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-admin-panel-6002") | .pm2_env.status // "not_found"')"
        },
        "api_gateway": {
            "port": 6020,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-api-gateway-6020") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-api-gateway-6020") | .pm2_env.status // "not_found"')"
        },
        "mcp_server": {
            "port": 6025,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-mcp-server") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-mcp-server") | .pm2_env.status // "not_found"')"
        },
        "images_api": {
            "port": 6026,
            "restarts": $(pm2 jlist | jq '.[] | select(.name=="beauty-images-api") | .pm2_env.restart_time // 0'),
            "status": "$(pm2 jlist | jq -r '.[] | select(.name=="beauty-images-api") | .pm2_env.status // "not_found"')"
        }
    }
}
EOF

# 5. Cleanup old backups (keep only last 10)
log "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR/configs" && ls -t | tail -n +11 | xargs -r rm -rf
cd "$BACKUP_DIR/ecosystem" && ls -t | tail -n +11 | xargs -r rm -rf
cd "$BACKUP_DIR/env" && ls -t | tail -n +11 | xargs -r rm -rf
cd "$BACKUP_DIR/packages" && ls -t | tail -n +11 | xargs -r rm -rf

log "✅ Backup completed successfully to: $BACKUP_DIR/*/TIMESTAMP"
log "📊 Backup size: $(du -sh $BACKUP_DIR/$TIMESTAMP | cut -f1)"

exit 0