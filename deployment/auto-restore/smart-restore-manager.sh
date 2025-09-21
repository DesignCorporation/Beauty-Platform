#!/bin/bash

# Smart Auto-Restore Manager v2.0
# Безопасное восстановление сервисов с детальным логированием
# Author: Claude AI Assistant

set -e

SCRIPT_DIR="/root/beauty-platform/deployment/auto-restore"
LOG_DIR="/root/beauty-platform/logs/auto-restore"
CONFIG_FILE="$SCRIPT_DIR/restore-config.json"
PNPM_PATH="/root/.local/share/pnpm/pnpm"
MAX_RESTARTS=3
RESTART_WINDOW_MINUTES=60
ATTEMPTS_DIR="$SCRIPT_DIR/attempts"
ALERTS_DIR="$LOG_DIR/alerts"

# Создаём директории для логов
mkdir -p "$LOG_DIR"

# Создаём директорию для попыток
mkdir -p "$ATTEMPTS_DIR"

# Создаём директорию для алертов
mkdir -p "$ALERTS_DIR"

# Функция детального логирования в JSON формате
log_json() {
    local service="$1"
    local action="$2" 
    local status="$3"
    local message="$4"
    local error="$5"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local log_entry=$(cat <<EOF
{
  "timestamp": "$timestamp",
  "service": "$service",
  "action": "$action",
  "status": "$status",
  "message": "$message"$(if [ -n "$error" ]; then echo ",\"error\": \"$error\""; fi)
}
EOF
)
    
    # Логируем в общий файл и файл сервиса
    echo "$log_entry" >> "$LOG_DIR/smart-restore.log"
    echo "$log_entry" >> "$LOG_DIR/$service.log"
    
    # Также обычный лог для читаемости
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SMART_RESTORE[$service]: $action - $status: $message" | tee -a "$LOG_DIR/readable.log"
}

# Функция простого логирования  
log() {
    local service="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SMART_RESTORE[$service]: $message" | tee -a "$LOG_DIR/readable.log"
}

# Функция отправки критичных алертов
send_critical_alert() {
    local service="$1"
    local message="$2"
    local alert_type="${3:-circuit_breaker}"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local readable_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Создаём файл алерта
    local alert_file="$ALERTS_DIR/${service}_${alert_type}_$(date +%s).alert"
    
    cat > "$alert_file" << EOF
{
  "timestamp": "$timestamp",
  "service": "$service", 
  "alert_type": "$alert_type",
  "message": "$message",
  "severity": "critical",
  "requires_manual_intervention": true,
  "recovery_command": "$0 reset-circuit-breaker $service"
}
EOF
    
    # Логируем в специальный файл для алертов
    echo "[$readable_time] 🚨 CRITICAL ALERT: $service - $message" >> "$LOG_DIR/critical-alerts.log"
    
    # Выводим в консоль с яркими цветами
    echo -e "\033[31;1m🚨 CRITICAL ALERT: $service\033[0m"
    echo -e "\033[33;1m⚠️  $message\033[0m"
    echo -e "\033[36;1mℹ️  Recovery: $0 reset-circuit-breaker $service\033[0m"
    echo
    
    # В будущем здесь можно добавить:
    # - Отправку Telegram сообщения  
    # - Email уведомление
    # - Integration с админ-панелью для уведомлений
}

# Функция сброса circuit breaker для сервиса
reset_circuit_breaker() {
    local service="$1"
    
    if [ -z "$service" ]; then
        echo "❌ Error: Service name required"
        echo "Usage: $0 reset-circuit-breaker <service-name>"
        return 1
    fi
    
    local attempts_file="$ATTEMPTS_DIR/$service.attempts"
    
    if [ -f "$attempts_file" ]; then
        rm -f "$attempts_file"
        log_json "$service" "circuit_breaker_reset" "success" "Circuit breaker reset manually by user"
        echo "✅ Circuit breaker reset for service: $service"
        echo "ℹ️  Service can now be restored normally"
    else
        echo "ℹ️  No circuit breaker found for service: $service (already clear)"
    fi
}

# Функция показа статуса circuit breaker
show_circuit_breaker_status() {
    echo "🔍 Circuit Breaker Status:"
    echo "=========================="
    
    local found_any=false
    for service in "${!SERVICES[@]}"; do
        local attempts_file="$ATTEMPTS_DIR/$service.attempts"
        if [ -f "$attempts_file" ]; then
            local attempt_count=$(wc -l < "$attempts_file")
            if [ "$attempt_count" -gt 0 ]; then
                found_any=true
                local last_attempt=$(tail -1 "$attempts_file")
                local last_time=$(date -d "@$last_attempt" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")
                
                if [ "$attempt_count" -ge "$MAX_RESTARTS" ]; then
                    echo "🚨 $service: TRIPPED ($attempt_count/$MAX_RESTARTS attempts, last: $last_time)"
                    echo "   Recovery: $0 reset-circuit-breaker $service"
                else
                    echo "⚠️  $service: $attempt_count/$MAX_RESTARTS attempts (last: $last_time)"
                fi
            fi
        fi
    done
    
    if [ "$found_any" = false ]; then
        echo "✅ All circuit breakers are clear"
    fi
    
    echo
    echo "📊 Recent critical alerts:"
    if [ -f "$LOG_DIR/critical-alerts.log" ]; then
        tail -5 "$LOG_DIR/critical-alerts.log" || echo "   No recent alerts"
    else
        echo "   No alerts file found"
    fi
}

# Проверка статуса сервиса
check_service_status() {
    local service="$1"
    local port="$2"
    local service_dir="$3"

    log_json "$service" "status_check" "started" "Checking service health"

    # Специальная проверка для PostgreSQL
    if [ "$service" == "postgresql" ]; then
        if pg_isready -h localhost -p "$port" -q; then
            log_json "$service" "health_check" "success" "PostgreSQL is ready for connections"
            return 0
        else
            log_json "$service" "health_check" "failed" "PostgreSQL is not responding to pg_isready"
            return 1
        fi
    fi

    # Специальная проверка для Context7 MCP Server
    if [ "$service" == "context7" ]; then
        if curl -sf --connect-timeout 3 "http://localhost:$port/ping" >/dev/null 2>&1; then
            log_json "$service" "health_check" "success" "Context7 MCP Server responds to /ping"
            return 0
        else
            log_json "$service" "health_check" "failed" "Context7 MCP Server not responding to /ping"
            return 1
        fi
    fi

    # 1. Проверяем процесс на порту для всех остальных
    if ! lsof -i ":$port" -t >/dev/null 2>&1; then
        log_json "$service" "process_check" "failed" "No process found on port $port"
        return 2
    fi

    log_json "$service" "process_check" "success" "Process found on port $port"

    # 2. Проверяем HTTP ответ
    # Специальная проверка для API Gateway, который может быть "degraded" (503)
    if [ "$service" == "api-gateway" ]; then
        # Выполняем curl и получаем http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:$port/health")

        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 503 ]; then
            log_json "$service" "health_check" "success" "API Gateway is responding with code $http_code (Healthy or Degraded)"
            return 0
        else
            log_json "$service" "health_check" "failed" "API Gateway responded with code $http_code"
            return 1
        fi
    fi

    # Стандартная проверка для остальных веб-сервисов
    if curl -sf --connect-timeout 3 "http://localhost:$port/health" >/dev/null 2>&1 || \
       curl -sf --connect-timeout 3 "http://localhost:$port" >/dev/null 2>&1; then
        log_json "$service" "health_check" "success" "Service responds to HTTP requests"
        return 0
    else
        log_json "$service" "health_check" "warning" "Process exists but HTTP not responding"
        return 1
    fi
}

# Диагностика проблем
diagnose_service() {
    local service="$1" 
    local port="$2"
    local service_dir="$3"
    
    log_json "$service" "diagnosis" "started" "Running comprehensive diagnosis"
    
    local issues=0
    
    # Проверка директории
    if [ ! -d "$service_dir" ]; then
        log_json "$service" "diagnosis" "error" "Service directory not found: $service_dir"
        return 1
    fi
    
    # Проверка package.json
    if [ ! -f "$service_dir/package.json" ]; then
        log_json "$service" "diagnosis" "error" "package.json not found in $service_dir"
        ((issues++))
    fi
    
    # Проверка node_modules
    if [ ! -d "$service_dir/node_modules" ]; then
        log_json "$service" "diagnosis" "warning" "node_modules not found - will need installation"
        ((issues++))
    fi
    
    # Проверка занятости порта другим процессом
    if netstat -tulpn 2>/dev/null | grep ":$port " | grep -v "$service" >/dev/null; then
        local blocking_process=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}')
        log_json "$service" "diagnosis" "error" "Port $port blocked by: $blocking_process"
        ((issues++))
    fi
    
    log_json "$service" "diagnosis" "completed" "Found $issues potential issues"
    return $issues
}

# Безопасная остановка сервиса
safe_stop_service() {
    local service="$1"
    local port="$2"
    
    log_json "$service" "stop_attempt" "started" "Attempting graceful shutdown"
    
    # Ищем PID процесса на порту
    local pid=$(lsof -t -i:"$port" 2>/dev/null || true)
    
    if [ -z "$pid" ]; then
        log_json "$service" "stop_attempt" "success" "Service already stopped"
        return 0
    fi
    
    # Graceful shutdown (SIGTERM)
    log_json "$service" "graceful_stop" "started" "Sending SIGTERM to PID $pid"
    kill -TERM "$pid" 2>/dev/null || true
    
    # Ждём до 10 секунд
    for i in {1..10}; do
        if ! kill -0 "$pid" 2>/dev/null; then
            log_json "$service" "graceful_stop" "success" "Process stopped gracefully in ${i}s"
            return 0
        fi
        sleep 1
    done
    
    # Принудительная остановка (SIGKILL)
    log_json "$service" "force_stop" "started" "Graceful stop timeout, forcing kill"
    kill -KILL "$pid" 2>/dev/null || true
    sleep 2
    
    if ! kill -0 "$pid" 2>/dev/null; then
        log_json "$service" "force_stop" "success" "Process force-killed"
        return 0
    else
        log_json "$service" "force_stop" "failed" "Failed to kill process $pid"
        return 1
    fi
}

# Установка зависимостей с проверками
safe_install_deps() {
    local service="$1"
    local service_dir="$2"
    
    log_json "$service" "deps_install" "started" "Installing dependencies with pnpm"
    
    cd /root/beauty-platform
    
    # Проверяем pnpm
    if [ ! -f "$PNPM_PATH" ]; then
        log_json "$service" "deps_install" "error" "pnpm not found at $PNPM_PATH"
        return 1
    fi
    
    # Очищаем старые зависимости
    rm -rf "$service_dir/node_modules" "$service_dir/package-lock.json" 2>/dev/null || true
    
    # Устанавливаем через pnpm с таймаутом
    if timeout 300 "$PNPM_PATH" install --filter="*$(basename "$service_dir")*" 2>&1; then
        log_json "$service" "deps_install" "success" "Dependencies installed successfully"
        return 0
    else
        local exit_code=$?
        log_json "$service" "deps_install" "failed" "pnpm install failed" "exit_code: $exit_code"
        return 1
    fi
}

# Безопасный запуск сервиса
safe_start_service() {
    local service="$1"
    local port="$2"
    local service_dir="$3"
    local start_command="$4"
    
    log_json "$service" "start_attempt" "started" "Starting service with command: $start_command"
    
    cd "$service_dir"
    
    # Запускаем в фоне с переадресацией логов
    local service_log="$LOG_DIR/${service}-service.log"
    nohup bash -c "$start_command" > "$service_log" 2>&1 &
    local service_pid=$!
    
    # Ждём запуска (до 30 секунд)
    for i in {1..30}; do
        if lsof -i ":$port" -t >/dev/null 2>&1; then
            log_json "$service" "start_attempt" "success" "Service started on port $port (PID: $service_pid)"
            return 0
        fi
        sleep 1
    done
    
    log_json "$service" "start_attempt" "failed" "Service failed to start within 30 seconds"
    return 1
}

# Главная функция восстановления сервиса
restore_service() {
    local service="$1"
    local port="$2"
    local service_dir="$3"
    local start_command="$4"

    # 1. Проверяем текущий статус. Если сервис здоров, выходим.
    if check_service_status "$service" "$port" "$service_dir"; then
        # Убираем старые записи о попытках, если сервис снова здоров
        rm -f "$ATTEMPTS_DIR/$service.attempts" 2>/dev/null || true
        log_json "$service" "restore_session" "skipped" "Service already healthy"
        return 0
    fi

    log_json "$service" "restore_session" "started" "Service is down, starting restore procedure"

    # --- CIRCUIT BREAKER LOGIC ---
    local attempts_file="$ATTEMPTS_DIR/$service.attempts"
    touch "$attempts_file" # Убедимся, что файл существует

    # Очищаем старые попытки, которые были раньше, чем RESTART_WINDOW_MINUTES
    local now=$(date +%s)
    local window_start=$(($now - ($RESTART_WINDOW_MINUTES * 60)))
    awk -v window_start="$window_start" '$1 >= window_start' "$attempts_file" > "$attempts_file.tmp" && mv "$attempts_file.tmp" "$attempts_file"

    # Проверяем количество недавних попыток
    local attempt_count=$(wc -l < "$attempts_file")
    if [ "$attempt_count" -ge "$MAX_RESTARTS" ]; then
        local alert_message="Service has failed $attempt_count times in the last $RESTART_WINDOW_MINUTES minutes. Manual intervention required."
        log_json "$service" "circuit_breaker" "tripped" "Restore aborted. $alert_message"
        send_critical_alert "$service" "$alert_message" "circuit_breaker"
        return 1 # Прерываем восстановление
    fi
    # --- END CIRCUIT BREAKER LOGIC ---

    # Логируем новую попытку восстановления *перед* ее началом
    echo "$(date +%s)" >> "$attempts_file"
    log_json "$service" "restore_attempt" "logged" "Logging restore attempt #$((attempt_count + 1))"

    # 2. Диагностируем проблемы
    diagnose_service "$service" "$port" "$service_dir" || true

    # 3. Безопасно останавливаем (на случай, если процесс "завис")
    if ! safe_stop_service "$service" "$port"; then
        log_json "$service" "restore_session" "failed" "Failed to stop service safely"
        return 1
    fi

    # 4. Устанавливаем зависимости (если нужно)
    if [[ "$service" != "postgresql" ]]; then
        if [ ! -d "$service_dir/node_modules" ]; then
            if ! safe_install_deps "$service" "$service_dir"; then
                return 1
            fi
        fi
    fi

    # 5. Запускаем сервис
    if safe_start_service "$service" "$port" "$service_dir" "$start_command"; then
        log_json "$service" "restore_session" "success" "Service restored successfully"
        # После успешного запуска очищаем счетчик попыток
        rm -f "$attempts_file" 2>/dev/null || true
        return 0
    else
        log_json "$service" "restore_session" "failed" "Service failed to start after restore"
        return 1
    fi
}

# Конфигурация сервисов
declare -A SERVICES
SERVICES[landing-page]="6000:/root/beauty-platform/apps/landing-page:npm run dev"
SERVICES[admin-panel]="6002:/root/beauty-platform/apps/admin-panel:npm run dev"
SERVICES[salon-crm]="6001:/root/beauty-platform/apps/salon-crm:npm run dev"
SERVICES[client-portal]="6003:/root/beauty-platform/apps/client-booking:npm run build && npm start"
SERVICES[api-gateway]="6020:/root/beauty-platform/services/api-gateway:npm start"  
SERVICES[auth-service]="6021:/root/beauty-platform/services/auth-service:ENABLE_TRACING=false MFA_MASTER_KEY=49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b npx tsx src/server.ts"
SERVICES[mcp-server]="6025:/root/beauty-platform/services/mcp-server:npm run dev"
SERVICES[images-api]="6026:/root/beauty-platform/services/images-api:PORT=6026 node src/server.js"
SERVICES[crm-api]="6022:/root/beauty-platform/services/crm-api:npm run dev"
SERVICES[backup-service]="6027:/root/beauty-platform/services/backup-service:PORT=6027 node dist/server.js"
SERVICES[postgresql]="6100:/var/lib/postgresql/16/main:systemctl start postgresql"
SERVICES[context7]="6024:/root/context7:bun run dist/index.js --transport http --port 6024"
SERVICES[notification-service]="6028:/root/beauty-platform/services/notification-service:pnpm run dev"

# Функция управления
case "${1:-help}" in
    "restore")
        service_name="$2"
        if [ -z "$service_name" ]; then
            echo "Usage: $0 restore <service-name>"
            echo "Available services: ${!SERVICES[@]}"
            exit 1
        fi
        
        if [ -z "${SERVICES[$service_name]}" ]; then
            echo "Unknown service: $service_name"
            exit 1
        fi
        
        IFS=':' read -r port service_dir start_command <<< "${SERVICES[$service_name]}"
        restore_service "$service_name" "$port" "$service_dir" "$start_command"
        ;;
        
    "status")
        service_name="$2"
        if [ -n "$service_name" ]; then
            if [ -z "${SERVICES[$service_name]}" ]; then
                echo "Unknown service: $service_name"
                exit 1
            fi
            IFS=':' read -r port service_dir start_command <<< "${SERVICES[$service_name]}"
            check_service_status "$service_name" "$port" "$service_dir"
        else
            for service in "${!SERVICES[@]}"; do
                IFS=':' read -r port service_dir start_command <<< "${SERVICES[$service]}"
                echo -n "$service: "
                if check_service_status "$service" "$port" "$service_dir" >/dev/null 2>&1; then
                    echo "✅ HEALTHY"
                else
                    echo "❌ DOWN"
                fi
            done
        fi
        ;;

    "stop")
        service_name="$2"
        if [ -z "$service_name" ]; then
            echo "Usage: $0 stop <service-name>"
            echo "Available services: ${!SERVICES[@]}"
            exit 1
        fi

        if [ -z "${SERVICES[$service_name]}" ]; then
            echo "Unknown service: $service_name"
            exit 1
        fi

        IFS=':' read -r port service_dir start_command <<< "${SERVICES[$service_name]}"
        if safe_stop_service "$service_name" "$port"; then
            log_json "$service_name" "manual_stop" "success" "Service stopped by operator"
            echo "✅ Service $service_name stopped"
        else
            log_json "$service_name" "manual_stop" "failed" "Failed to stop service manually"
            echo "❌ Failed to stop service $service_name"
            exit 1
        fi
        ;;

    "logs")
        service_name="$2"
        if [ -n "$service_name" ]; then
            if [ -f "$LOG_DIR/$service_name.log" ]; then
                tail -f "$LOG_DIR/$service_name.log"
            else
                echo "No logs found for service: $service_name"
            fi
        else
            tail -f "$LOG_DIR/readable.log"
        fi
        ;;
        
    "reset-circuit-breaker")
        service_name="$2"
        if [ -z "$service_name" ]; then
            echo "Usage: $0 reset-circuit-breaker <service-name>"
            echo "Available services: ${!SERVICES[@]}"
            exit 1
        fi
        
        if [ -z "${SERVICES[$service_name]}" ]; then
            echo "Unknown service: $service_name"
            exit 1
        fi
        
        reset_circuit_breaker "$service_name"
        ;;
        
    "circuit-breaker-status")
        service_name="$2"
        if [ -n "$service_name" ]; then
            if [ -z "${SERVICES[$service_name]}" ]; then
                echo "Unknown service: $service_name"
                exit 1
            fi
            show_circuit_breaker_status "$service_name"
        else
            echo "Circuit breaker status for all services:"
            echo "========================================"
            for service in "${!SERVICES[@]}"; do
                echo ""
                show_circuit_breaker_status "$service"
            done
        fi
        ;;
        
    "restore-all")
        echo "🚀 Starting bulk restore of all failed services..."
        failed_count=0
        restored_count=0
        
        for service in "${!SERVICES[@]}"; do
            IFS=':' read -r port service_dir start_command <<< "${SERVICES[$service]}"
            
            echo -n "Checking $service... "
            if ! check_service_status "$service" "$port" "$service_dir" >/dev/null 2>&1; then
                echo "❌ DOWN - attempting restore"
                failed_count=$((failed_count + 1))
                
                if restore_service "$service" "$port" "$service_dir" "$start_command"; then
                    restored_count=$((restored_count + 1))
                    echo "  ✅ $service restored successfully"
                else
                    echo "  ❌ $service restore failed"
                fi
            else
                echo "✅ HEALTHY"
            fi
        done
        
        echo ""
        echo "📊 Bulk restore completed:"
        echo "  Failed services found: $failed_count"
        echo "  Successfully restored: $restored_count"
        echo "  Still failing: $((failed_count - restored_count))"
        ;;
        
    "help"|*)
        echo "Smart Auto-Restore Manager v3.0 - Enhanced Circuit Breaker Edition"
        echo ""
        echo "Usage: $0 <command> [service-name]"
        echo ""
        echo "Commands:"
        echo "  restore <service>         - Restore specific service"
        echo "  restore-all               - Restore all failed services (bulk operation)"
        echo "  status [service]          - Check service status"
        echo "  logs [service]            - Show logs"
        echo "  reset-circuit-breaker <service>  - Reset circuit breaker for service"
        echo "  circuit-breaker-status [service] - Show circuit breaker status"
        echo ""
        echo "Available services: ${!SERVICES[@]}"
        echo ""
        echo "Logs location: $LOG_DIR"
        echo "Alerts location: $ALERTS_DIR"
        echo ""
        echo "🔧 Circuit Breaker Info:"
        echo "  Max restarts: $MAX_RESTARTS failures"
        echo "  Time window: $RESTART_WINDOW_MINUTES minutes"
        echo "  When triggered: Service stops auto-restoration + critical alert sent"
        ;;
esac
