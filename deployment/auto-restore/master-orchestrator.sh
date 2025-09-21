#!/bin/bash

# Beauty Platform Master Auto-Restore Orchestrator
# Главный контроллер системы автоматического восстановления

set -e

ENV_FILE="/root/beauty-platform/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
fi

SCRIPT_DIR="/root/beauty-platform/deployment/auto-restore"
LOG_FILE="/root/beauty-platform/logs/master-orchestrator.log"
RUN_DIR="$SCRIPT_DIR/run"
PID_FILE="$RUN_DIR/beauty-auto-restore.pid"

# Проверяем, что скрипт не запущен дважды
mkdir -p "$RUN_DIR"
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Master orchestrator already running with PID $OLD_PID"
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

# Записываем PID
echo $$ > "$PID_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MASTER: $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "🛑 Master orchestrator shutting down..."
    rm -f "$PID_FILE"
    
    # Остановить health monitor
    local monitor_pid_file="$RUN_DIR/beauty-health-monitor.pid"
    if [ -f "$monitor_pid_file" ]; then
        MONITOR_PID=$(cat "$monitor_pid_file")
        kill "$MONITOR_PID" 2>/dev/null || true
        rm -f "$monitor_pid_file"
    fi
    
    exit 0
}

trap cleanup SIGTERM SIGINT

initialize_system() {
    log "🚀 Initializing Beauty Platform Auto-Restore System"
    
    # Создаем необходимые директории
    mkdir -p "/root/beauty-platform/logs"
    mkdir -p "/root/beauty-platform/deployment/auto-restore/backups"
    
    # Делаем все скрипты исполняемыми
    chmod +x "$SCRIPT_DIR"/*.sh
    
    # Создаем начальный backup
    log "📦 Creating initial backup..."
    "$SCRIPT_DIR/backup-system.sh" || {
        log "⚠️ Initial backup failed, continuing..."
    }
    
    # Применяем расширенную конфигурацию PM2
    log "⚙️ Applying enhanced PM2 configuration..."
    if [ -f "$SCRIPT_DIR/enhanced-ecosystem.config.js" ]; then
        # Backup current PM2 config
        pm2 save
        
        # Update PM2 configuration (осторожно, не перезапускаем сразу)
        log "📋 Enhanced PM2 config available, manual application recommended"
    fi
    
    log "✅ System initialization complete"
}

start_health_monitor() {
    log "🔍 Starting health monitor..."
    
    # Проверяем, не запущен ли уже
    local monitor_pid_file="$RUN_DIR/beauty-health-monitor.pid"
    if [ -f "$monitor_pid_file" ]; then
        MONITOR_PID=$(cat "$monitor_pid_file")
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            log "ℹ️ Health monitor already running with PID $MONITOR_PID"
            return 0
        fi
    fi
    
    # Запускаем health monitor в фоне
    nohup "$SCRIPT_DIR/health-monitor.sh" > "/dev/null" 2>&1 &
    MONITOR_PID=$!
    echo "$MONITOR_PID" > "$monitor_pid_file"
    
    log "👁️ Health monitor started with PID $MONITOR_PID"
}

setup_cron_jobs() {
    log "⏰ Setting up automated maintenance tasks..."
    
    # Добавляем cron задачи
    (crontab -l 2>/dev/null || true; cat << 'EOF'
# Beauty Platform Auto-Restore System
*/30 * * * * /root/beauty-platform/deployment/auto-restore/backup-system.sh >/dev/null 2>&1
0 6 * * * /root/beauty-platform/deployment/auto-restore/alert-system.sh daily-report >/dev/null 2>&1
0 */6 * * * /root/beauty-platform/deployment/auto-restore/system-maintenance.sh >/dev/null 2>&1
EOF
    ) | crontab -
    
    log "📅 Cron jobs configured: backups every 30min, daily reports at 6AM, maintenance every 6h"
}

monitor_system_resources() {
    while true; do
        # Проверяем использование ресурсов
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
        CPU_LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs)
        
        # Алерты при критических значениях
        if (( $(echo "$MEMORY_USAGE > 85.0" | bc -l) )); then
            "$SCRIPT_DIR/alert-system.sh" system-resources "memory" "$MEMORY_USAGE" "85"
        fi
        
        if (( DISK_USAGE > 85 )); then
            "$SCRIPT_DIR/alert-system.sh" system-resources "disk" "$DISK_USAGE" "85"
        fi
        
        if (( $(echo "$CPU_LOAD > 4.0" | bc -l) )); then
            "$SCRIPT_DIR/alert-system.sh" system-resources "cpu" "$CPU_LOAD" "4.0"
        fi
        
        # Логируем статус каждые 10 минут
        if (( $(date +%M) % 10 == 0 )); then
            log "📊 Resources: Memory ${MEMORY_USAGE}%, Disk ${DISK_USAGE}%, CPU Load ${CPU_LOAD}"
        fi
        
        sleep 60
    done
}

perform_emergency_procedures() {
    local scenario="$1"
    
    case "$scenario" in
        "mass-failure")
            log "🚨 EMERGENCY: Mass service failure detected"
            
            # Список всех критических сервисов
            CRITICAL_SERVICES=(
                "auth-service:6021"
                "crm-api:6022"
                "admin-panel:6002"
                "api-gateway:6020"
                "mcp-server:6025"
                "images-api:6026"
            )
            
            local failed_count=0
            local failed_services=""
            
            # Проверяем каждый сервис
            for service_info in "${CRITICAL_SERVICES[@]}"; do
                service=$(echo "$service_info" | cut -d: -f1)
                port=$(echo "$service_info" | cut -d: -f2)
                
                if ! curl -sf --connect-timeout 3 "http://localhost:$port/health" >/dev/null 2>&1; then
                    failed_count=$((failed_count + 1))
                    failed_services="$failed_services $service"
                fi
            done
            
            if (( failed_count >= 3 )); then
                log "💥 CRITICAL: $failed_count services down: $failed_services"
                "$SCRIPT_DIR/alert-system.sh" mass-failure "$failed_services" "$failed_count"
                
                # Попытка массового восстановления
                log "🔄 Attempting mass recovery..."
                for service_info in "${CRITICAL_SERVICES[@]}"; do
                    service=$(echo "$service_info" | cut -d: -f1)
                    port=$(echo "$service_info" | cut -d: -f2)
                    
                    if ! curl -sf --connect-timeout 2 "http://localhost:$port/health" >/dev/null 2>&1; then
                        log "🚑 Emergency restore: $service"
                        "$SCRIPT_DIR/restore-$service.sh" &
                    fi
                done
                
                # Ждем результатов восстановления
                sleep 60
                
                # Повторная проверка
                local recovered=0
                for service_info in "${CRITICAL_SERVICES[@]}"; do
                    service=$(echo "$service_info" | cut -d: -f1)
                    port=$(echo "$service_info" | cut -d: -f2)
                    
                    if curl -sf --connect-timeout 3 "http://localhost:$port/health" >/dev/null 2>&1; then
                        recovered=$((recovered + 1))
                    fi
                done
                
                log "📈 Recovery result: $recovered/$((${#CRITICAL_SERVICES[@]})) services restored"
            fi
            ;;
            
        "database-failure")
            log "🚨 EMERGENCY: Database connectivity failure"
            # TODO: Implement database recovery procedures
            ;;
            
        "cascade-failure")
            log "🚨 EMERGENCY: Cascading service failure"
            # TODO: Implement cascade failure recovery
            ;;
    esac
}

show_status() {
    echo "Beauty Platform Auto-Restore System Status"
    echo "=========================================="
    echo "Master PID: $$"
    echo "Started: $(ps -o lstart= -p $$)"
    echo ""
    
    if [ -f "/var/run/beauty-health-monitor.pid" ]; then
        MONITOR_PID=$(cat "/var/run/beauty-health-monitor.pid")
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            echo "Health Monitor: RUNNING (PID $MONITOR_PID)"
        else
            echo "Health Monitor: STOPPED"
        fi
    else
        echo "Health Monitor: NOT STARTED"
    fi
    
    echo ""
    echo "Recent Activity:"
    tail -10 "$LOG_FILE" 2>/dev/null || echo "No recent activity"
}

# Основной режим работы
case "${1:-start}" in
    "start")
        log "🚀 Starting Beauty Platform Auto-Restore Master Orchestrator"
        initialize_system
        start_health_monitor
        setup_cron_jobs
        
        log "🎯 System is now monitoring and will auto-restore failed services"
        log "💡 Use 'master-orchestrator.sh status' to check system status"
        
        # Основной цикл мониторинга ресурсов
        monitor_system_resources
        ;;
        
    "stop")
        cleanup
        ;;
        
    "status")
        show_status
        ;;
        
    "emergency")
        perform_emergency_procedures "$2"
        ;;
        
    "test")
        log "🧪 Testing auto-restore system..."
        "$SCRIPT_DIR/alert-system.sh" test
        echo "Test completed - check logs in $LOG_FILE"
        ;;
        
    *)
        echo "Beauty Platform Master Auto-Restore Orchestrator"
        echo "Usage: $0 {start|stop|status|emergency|test}"
        echo ""
        echo "Commands:"
        echo "  start     - Start the auto-restore system"
        echo "  stop      - Stop the auto-restore system"  
        echo "  status    - Show system status"
        echo "  emergency - Handle emergency scenarios"
        echo "  test      - Test the alert system"
        ;;
esac
