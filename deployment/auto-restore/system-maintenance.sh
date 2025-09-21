#!/bin/bash

# Beauty Platform System Maintenance
# Автоматическое обслуживание и очистка системы

set -e

LOG_FILE="/root/beauty-platform/logs/maintenance.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MAINTENANCE: $1" | tee -a "$LOG_FILE"
}

log "🧹 Starting system maintenance..."

# 1. Очистка старых логов
log "📝 Cleaning up old logs..."
find /root/beauty-platform/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
find /root/beauty-platform/logs -name "*.log.*" -mtime +3 -delete 2>/dev/null || true

# Ротация больших логов
for logfile in /root/beauty-platform/logs/*.log; do
    if [ -f "$logfile" ] && [ $(stat --format=%s "$logfile") -gt 104857600 ]; then # 100MB
        mv "$logfile" "$logfile.$(date +%Y%m%d_%H%M%S)"
        touch "$logfile"
        log "📦 Rotated large log: $(basename "$logfile")"
    fi
done

# 2. Очистка PM2 логов
log "🗑️ Cleaning PM2 logs..."
pm2 flush 2>/dev/null || true

# 3. Очистка системных временных файлов
log "🧽 Cleaning temporary files..."
find /tmp -name "beauty-*" -mtime +1 -delete 2>/dev/null || true
find /var/tmp -name "*beauty*" -mtime +2 -delete 2>/dev/null || true

# 4. Проверка и очистка node_modules кеша
log "📦 Cleaning npm cache..."
npm cache verify 2>/dev/null || true

# 5. Проверка дискового пространства
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
log "💿 Disk usage: ${DISK_USAGE}%"

if (( DISK_USAGE > 80 )); then
    log "⚠️ High disk usage detected, performing aggressive cleanup..."
    
    # Очистка Docker (если есть)
    if command -v docker >/dev/null; then
        docker system prune -f --volumes 2>/dev/null || true
    fi
    
    # Очистка старых backups
    find /root/beauty-platform/deployment/auto-restore/backups -type d -mtime +14 -exec rm -rf {} \; 2>/dev/null || true
fi

# 6. Проверка состояния процессов PM2
log "⚙️ Checking PM2 processes health..."
UNHEALTHY_COUNT=0

pm2 jlist | jq -r '.[] | select(.pm2_env.status != "online") | .name' 2>/dev/null | while read -r service_name; do
    if [ -n "$service_name" ]; then
        log "🔄 Restarting unhealthy service: $service_name"
        pm2 restart "$service_name" 2>/dev/null || true
        UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    fi
done

# 7. Обновление системного времени
log "⏰ Syncing system time..."
ntpdate -s time.nist.gov 2>/dev/null || timedatectl set-ntp true 2>/dev/null || true

# 8. Создание snapshot текущего состояния
log "📸 Creating system snapshot..."
cat > "/root/beauty-platform/logs/maintenance-snapshot-$(date +%Y%m%d_%H%M%S).json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "disk_usage": "${DISK_USAGE}%",
    "memory_usage": "$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')",
    "load_average": "$(uptime | awk -F'load average:' '{print $2}')",
    "pm2_processes": $(pm2 jlist 2>/dev/null || echo "[]"),
    "maintenance_actions": [
        "Log cleanup completed",
        "PM2 logs flushed", 
        "Temporary files cleaned",
        "NPM cache verified",
        "System time synced"
    ]
}
EOF

log "✅ System maintenance completed"
exit 0