#!/bin/bash

# Beauty Platform Alert System
# Система уведомлений о критических сбоях и восстановлениях

set -e

ENV_FILE="/root/beauty-platform/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
fi

ALERT_LOG="/root/beauty-platform/logs/alerts.log"
CRITICAL_LOG="/root/beauty-platform/logs/critical-alerts.log"
WEBHOOK_URL="${WEBHOOK_URL:-}"  # Можно настроить Slack/Discord webhook
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-admin@beauty-platform.com}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $1" | tee -a "$ALERT_LOG"
}

critical_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: $1" | tee -a "$CRITICAL_LOG"
    log "🚨 CRITICAL: $1"
}

send_webhook_alert() {
    local message="$1"
    local severity="$2"
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🚨 Beauty Platform Alert\",
                \"attachments\": [{
                    \"color\": \"$([ "$severity" = "critical" ] && echo "danger" || echo "warning")\",
                    \"fields\": [{
                        \"title\": \"Service Alert\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }, {
                        \"title\": \"Server\",
                        \"value\": \"$(hostname) ($(hostname -I | awk '{print $1}'))\",
                        \"short\": true
                    }]
                }]
            }" 2>/dev/null || true
    fi
}

send_telegram_alert() {
    local message="$1"
    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        return
    fi

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${message}" \
        -d "disable_web_page_preview=true" \
        >/dev/null 2>&1 || true
}

send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENTS" 2>/dev/null || true
    elif command -v sendmail >/dev/null 2>&1; then
        {
            echo "To: $EMAIL_RECIPIENTS"
            echo "Subject: $subject"
            echo ""
            echo "$message"
        } | sendmail "$EMAIL_RECIPIENTS" 2>/dev/null || true
    fi
}

alert_service_down() {
    local service="$1"
    local port="$2"
    local failure_count="$3"
    
    local message="🔴 Service DOWN: $service (port $port) - Failures: $failure_count"
    log "$message"
    send_telegram_alert "$message"
    
    if (( failure_count >= 5 )); then
        critical_log "Service $service has failed $failure_count times"
        send_webhook_alert "$message" "critical"
        send_email_alert "CRITICAL: Beauty Platform Service Down" "$message"
    else
        send_webhook_alert "$message" "warning"
    fi
}

alert_service_restored() {
    local service="$1"
    local port="$2"
    local downtime="$3"
    
    local message="✅ Service RESTORED: $service (port $port) - Downtime: ${downtime}s"
    log "$message"
    send_telegram_alert "$message"
    send_webhook_alert "$message" "good"
}

alert_auto_restore_triggered() {
    local service="$1"
    local attempt="$2"
    
    local message="🔄 AUTO-RESTORE triggered for $service (attempt #$attempt)"
    log "$message"
    send_telegram_alert "$message"
    
    if (( attempt >= 3 )); then
        critical_log "Multiple restore attempts for $service"
        send_webhook_alert "$message" "critical"
    else
        send_webhook_alert "$message" "warning"
    fi
}

alert_restore_failed() {
    local service="$1"
    local error_log="$2"
    
    local message="❌ RESTORE FAILED for $service - Manual intervention required"
    critical_log "$message"
    send_telegram_alert "$message"
    
    local full_message="$message

Recent error logs:
$(tail -10 "$error_log" 2>/dev/null || echo "No error logs available")

Server: $(hostname) ($(hostname -I | awk '{print $1}'))
Time: $(date)
"
    
    send_webhook_alert "$message" "critical"
    send_email_alert "URGENT: Beauty Platform Restore Failed" "$full_message"
}

alert_system_resources() {
    local resource_type="$1"
    local usage="$2"
    local threshold="$3"
    
    local message="⚠️ High $resource_type usage: $usage (threshold: $threshold)"
    log "$message"
    send_telegram_alert "$message"
    
    if [[ "$resource_type" == "memory" ]] && (( $(echo "$usage > 90" | bc -l) )); then
        critical_log "Critical memory usage: $usage%"
        send_webhook_alert "$message" "critical"
    else
        send_webhook_alert "$message" "warning"  
    fi
}

alert_mass_failure() {
    local failed_services="$1"
    local count="$2"
    
    local message="🚨 MASS FAILURE: $count services down simultaneously: $failed_services"
    critical_log "$message"
    send_telegram_alert "$message"
    
    local full_message="$message

This indicates a potential infrastructure issue or cascading failure.
Immediate investigation required.

Server: $(hostname)
Time: $(date)
Load: $(uptime)
Memory: $(free -h | grep Mem)
Disk: $(df -h /)
"
    
    send_webhook_alert "$message" "critical"
    send_email_alert "EMERGENCY: Beauty Platform Mass Failure" "$full_message"
}

generate_daily_report() {
    local report_file="/root/beauty-platform/logs/daily-report-$(date +%Y%m%d).txt"
    
    cat > "$report_file" << EOF
Beauty Platform Daily Status Report
Generated: $(date)
Server: $(hostname) ($(hostname -I | awk '{print $1}'))

=== SERVICE STATUS ===
$(pm2 list)

=== TODAY'S ALERTS ===
$(grep "$(date +%Y-%m-%d)" "$ALERT_LOG" 2>/dev/null | tail -20 || echo "No alerts today")

=== CRITICAL ISSUES ===
$(grep "$(date +%Y-%m-%d)" "$CRITICAL_LOG" 2>/dev/null || echo "No critical issues today")

=== SYSTEM RESOURCES ===
Memory: $(free -h | grep Mem)
Disk: $(df -h /)
Load: $(uptime)

=== LOG SIZES ===
$(ls -lh /root/beauty-platform/logs/*.log 2>/dev/null | tail -10 || echo "No logs found")
EOF

    log "📊 Daily report generated: $report_file"
    
    # Send daily report via email
    send_email_alert "Beauty Platform Daily Report - $(date +%Y-%m-%d)" "$(cat "$report_file")"
}

# Функции для использования другими скриптами
case "${1:-help}" in
    "service-down")
        alert_service_down "$2" "$3" "$4"
        ;;
    "service-restored")
        alert_service_restored "$2" "$3" "$4"
        ;;
    "restore-triggered")
        alert_auto_restore_triggered "$2" "$3"
        ;;
    "restore-failed")
        alert_restore_failed "$2" "$3"
        ;;
    "system-resources")
        alert_system_resources "$2" "$3" "$4"
        ;;
    "mass-failure")
        alert_mass_failure "$2" "$3"
        ;;
    "daily-report")
        generate_daily_report
        ;;
    "test")
        log "🧪 Testing alert system..."
        alert_service_down "test-service" "9999" "1"
        echo "Test alert sent to logs and webhooks"
        ;;
    *)
        echo "Beauty Platform Alert System"
        echo "Usage: $0 {service-down|service-restored|restore-triggered|restore-failed|system-resources|mass-failure|daily-report|test}"
        echo ""
        echo "Examples:"
        echo "  $0 service-down auth-service 6021 3"
        echo "  $0 service-restored crm-api 6022 45"
        echo "  $0 restore-triggered admin-panel 2"
        echo "  $0 daily-report"
        ;;
esac
