#!/bin/bash

# Beauty Platform Health Monitor
# Непрерывный мониторинг всех критических сервисов с автоматическим восстановлением

set -e

ENV_FILE="/root/projects/beauty/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
fi

MONITOR_LOG="/root/projects/beauty/logs/health-monitor.log"
ALERT_LOG="/root/projects/beauty/logs/health-alerts.log"
RUN_DIR="/root/projects/beauty/deployment/auto-restore/run"
PID_FILE="$RUN_DIR/beauty-health-monitor.pid"
CHECK_INTERVAL=30  # Проверка каждые 30 секунд
FAILURE_THRESHOLD=5  # Количество последовательных неудач перед восстановлением

# Критические сервисы для мониторинга
declare -A CRITICAL_SERVICES=(
    ["auth-service"]="6021:beauty-auth-service:http://localhost:6021/health"
    ["crm-api"]="6022:beauty-crm-api-6022:http://localhost:6022/health"
    ["admin-panel"]="6002:beauty-admin-panel-6002:http://localhost:6002/"
    ["salon-crm"]="6001:beauty-salon-crm:http://localhost:6001/"
    ["client-portal"]="6003:beauty-client-portal:http://localhost:6003/"
    ["api-gateway"]="6020:api-gateway-6020:http://localhost:6020/health"
    ["mcp-server"]="6025:beauty-mcp-server:http://localhost:6025/health"
    ["images-api"]="6026:beauty-images-api:http://localhost:6026/health"
)

# Счетчики неудач
declare -A FAILURE_COUNTS
declare -A LAST_STATUS
declare -A RESTART_COUNTS

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MONITOR: $1" | tee -a "$MONITOR_LOG"
}

alert() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $message" | tee -a "$ALERT_LOG"
    log "🚨 ALERT: $message"
    send_telegram_alert "$message"
}

initialize_counters() {
    mkdir -p "$RUN_DIR"
    echo $$ > "$PID_FILE"
    for service in "${!CRITICAL_SERVICES[@]}"; do
        FAILURE_COUNTS["$service"]=0
        LAST_STATUS["$service"]="unknown"
        RESTART_COUNTS["$service"]=0
    done
}

check_service_health() {
    local service="$1"
    local config="${CRITICAL_SERVICES[$service]}"
    local port=$(echo "$config" | cut -d: -f1)
    local pm2_name=$(echo "$config" | cut -d: -f2)
    local health_url=$(echo "$config" | cut -d: -f3)
    
    # 1. Проверяем статус в PM2
    local pm2_status
    if command -v pm2 >/dev/null 2>&1; then
        pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$pm2_name\") | .pm2_env.status" 2>/dev/null || echo "not_found")
    else
        pm2_status="not_found"
    fi
    [[ -z "$pm2_status" ]] && pm2_status="not_found"
    
    # 2. Проверяем порт
    local port_check=$(lsof -t -i:$port 2>/dev/null | wc -l)
    
    # 3. Проверяем HTTP endpoint
    local http_check="false"
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" \
        --ipv4 \
        --connect-timeout 5 \
        --max-time 10 \
        --retry 2 \
        --retry-delay 1 \
        --retry-connrefused \
        "$health_url" 2>/dev/null || echo "000")
    if [[ "$http_status" =~ ^2 ]]; then
        http_check="true"
    elif [[ "$service" == "api-gateway" && "$http_status" == "503" ]]; then
        http_check="degraded"
    elif [[ "$http_status" == 000* && "$port_check" -gt 0 ]]; then
        http_check="assumed"
        log "⚠️ $service HTTP check returned 000 but port is open; assuming service is responding"
    fi
    
    # Определяем общий статус службы (2 из 3 проверок должны пройти)
    local checks_passed=0
    [[ "$pm2_status" == "online" || "$pm2_status" == "not_found" ]] && checks_passed=$((checks_passed + 1))
    [[ "$port_check" -gt 0 ]] && checks_passed=$((checks_passed + 1))
    [[ "$http_check" == "true" || "$http_check" == "degraded" || "$http_check" == "assumed" ]] && checks_passed=$((checks_passed + 1))
    
    if [[ "$checks_passed" -ge 2 ]]; then
        return 0  # Healthy (2 of 3 checks passed)
    else
        log "🔍 $service health check failed - PM2: $pm2_status, Port: $port_check, HTTP: $http_status ($http_check) (passed: $checks_passed/3)"
        return 1  # Unhealthy
    fi
}

trigger_service_restore() {
    local service="$1"
    local config="${CRITICAL_SERVICES[$service]}"
    local pm2_name=$(echo "$config" | cut -d: -f2)
    
    alert "Triggering auto-restore for $service (failures: ${FAILURE_COUNTS[$service]})"
    
    RESTART_COUNTS["$service"]=$((${RESTART_COUNTS["$service"]} + 1))
    
    case "$service" in
        "auth-service")
            /root/projects/beauty/deployment/auto-restore/restore-auth-service.sh &
            ;;
        "crm-api")
            /root/projects/beauty/deployment/auto-restore/restore-crm-api.sh &
            ;;
        "admin-panel")
            /root/projects/beauty/deployment/auto-restore/restore-admin-panel.sh &
            ;;
        "salon-crm")
            /root/projects/beauty/deployment/auto-restore/restore-salon-crm.sh &
            ;;
        "api-gateway")
            /root/projects/beauty/deployment/auto-restore/restore-api-gateway.sh &
            ;;
        "mcp-server")
            /root/projects/beauty/deployment/auto-restore/restore-mcp-server.sh &
            ;;
        "images-api")
            /root/projects/beauty/deployment/auto-restore/restore-images-api.sh &
            ;;
        *)
            alert "Unknown service for restore: $service"
            # Fallback: generic PM2 restart
            pm2 restart "$pm2_name" 2>/dev/null || true
            ;;
    esac
}

generate_status_report() {
    local report_file="/root/projects/beauty/logs/health-status-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "monitoring_duration": "$(($(date +%s) - START_TIME)) seconds",
    "services": {
EOF

    local first=true
    for service in "${!CRITICAL_SERVICES[@]}"; do
        if [ "$first" = false ]; then
            echo "," >> "$report_file"
        fi
        first=false
        
        local config="${CRITICAL_SERVICES[$service]}"
        local port=$(echo "$config" | cut -d: -f1)
        local pm2_name=$(echo "$config" | cut -d: -f2)
        local health_url=$(echo "$config" | cut -d: -f3)
        local pm2_restarts=$(pm2 jlist | jq ".[] | select(.name==\"$pm2_name\") | .pm2_env.restart_time // 0" 2>/dev/null || echo 0)
        
        cat >> "$report_file" << EOF
        "$service": {
            "port": $port,
            "pm2_name": "$pm2_name",
            "health_url": "$health_url",
            "last_status": "${LAST_STATUS[$service]}",
            "failure_count": ${FAILURE_COUNTS[$service]},
            "auto_restarts": ${RESTART_COUNTS[$service]},
            "pm2_restarts": $pm2_restarts,
            "current_status": "$(check_service_health "$service" && echo "healthy" || echo "unhealthy")"
        }
EOF
    done

    cat >> "$report_file" << EOF
    }
}
EOF

    log "📊 Status report generated: $report_file"
}

main_monitoring_loop() {
    log "🚀 Starting Beauty Platform Health Monitor"
    log "📋 Monitoring ${#CRITICAL_SERVICES[@]} critical services"
    log "⏱️  Check interval: ${CHECK_INTERVAL}s, Failure threshold: $FAILURE_THRESHOLD"
    
    initialize_counters
    local cycle_count=0
    START_TIME=$(date +%s)
    
    log "⏳ Warmup: waiting 15 seconds before first health check"
    sleep 15

    while true; do
        cycle_count=$((cycle_count + 1))
        
        # Каждый 10-й цикл делаем подробный отчет
        if (( cycle_count % 10 == 0 )); then
            log "📊 Health check cycle #$cycle_count"
            generate_status_report
        fi
        
        for service in "${!CRITICAL_SERVICES[@]}"; do
            if check_service_health "$service"; then
                # Сервис здоров
                if [[ "${LAST_STATUS[$service]}" != "healthy" ]]; then
                    log "✅ $service is now healthy"
                fi
                FAILURE_COUNTS["$service"]=0
                LAST_STATUS["$service"]="healthy"
            else
                # Сервис нездоров
                FAILURE_COUNTS["$service"]=$((${FAILURE_COUNTS["$service"]} + 1))
                LAST_STATUS["$service"]="unhealthy"
                
                log "❌ $service failed health check (${FAILURE_COUNTS[$service]}/$FAILURE_THRESHOLD)"
                
                # Если достигли порога - запускаем восстановление
                if (( ${FAILURE_COUNTS["$service"]} >= FAILURE_THRESHOLD )); then
                    trigger_service_restore "$service"
                    # Сбрасываем счетчик, чтобы дать время на восстановление
                    FAILURE_COUNTS["$service"]=0
                    sleep 60  # Дополнительная пауза после восстановления
                fi
            fi
        done
        
        sleep $CHECK_INTERVAL
    done
}

# Обработка сигналов для корректного завершения
trap 'log "🛑 Health monitor stopped"; exit 0' SIGTERM SIGINT

# Создаем директории для логов
mkdir -p "/root/projects/beauty/logs"

# Запускаем основной цикл мониторинга
trap 'rm -f "$PID_FILE"; exit 0' SIGINT SIGTERM

main_monitoring_loop
