#!/bin/bash

# Beauty Platform Auto-Restore Dashboard
# Управляющая панель для системы автоматического восстановления

set -e

SCRIPT_DIR="/root/projects/beauty/deployment/auto-restore"
LOG_DIR="/root/projects/beauty/logs"

show_header() {
    clear
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Beauty Platform Auto-Restore System            ║"
    echo "║                        Dashboard v1.0                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

show_system_status() {
    echo "🔍 SYSTEM STATUS"
    echo "════════════════════════════════════════════════════════════════"
    
    # Master orchestrator status
    if [ -f "/var/run/beauty-auto-restore.pid" ]; then
        MASTER_PID=$(cat "/var/run/beauty-auto-restore.pid")
        if kill -0 "$MASTER_PID" 2>/dev/null; then
            echo "✅ Master Orchestrator: RUNNING (PID $MASTER_PID)"
        else
            echo "❌ Master Orchestrator: STOPPED (stale PID)"
        fi
    else
        echo "⚪ Master Orchestrator: NOT STARTED"
    fi
    
    # Health monitor status  
    if [ -f "/var/run/beauty-health-monitor.pid" ]; then
        MONITOR_PID=$(cat "/var/run/beauty-health-monitor.pid")
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            echo "✅ Health Monitor: RUNNING (PID $MONITOR_PID)"
        else
            echo "❌ Health Monitor: STOPPED (stale PID)"
        fi
    else
        echo "⚪ Health Monitor: NOT STARTED"
    fi
    
    echo ""
}

show_services_status() {
    echo "🔧 CRITICAL SERVICES STATUS"
    echo "════════════════════════════════════════════════════════════════"
    
    declare -A SERVICES=(
        ["Auth Service"]="6021:beauty-auth-service"
        ["CRM API"]="6022:beauty-crm-api-6022"
        ["Admin Panel"]="6002:beauty-admin-panel-6002"
        ["API Gateway"]="6020:beauty-api-gateway-6020"
        ["MCP Server"]="6025:beauty-mcp-server"
        ["Images API"]="6026:beauty-images-api"
    )
    
    for service_name in "${!SERVICES[@]}"; do
        local config="${SERVICES[$service_name]}"
        local port=$(echo "$config" | cut -d: -f1)
        local pm2_name=$(echo "$config" | cut -d: -f2)
        
        # PM2 status
        local pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$pm2_name\") | .pm2_env.status" 2>/dev/null || echo "not_found")
        local restarts=$(pm2 jlist | jq ".[] | select(.name==\"$pm2_name\") | .pm2_env.restart_time // 0" 2>/dev/null || echo "0")
        
        # Port check
        local port_status="❌"
        if lsof -t -i:$port >/dev/null 2>&1; then
            port_status="✅"
        fi
        
        # Health check
        local health_status="❌"
        if curl -sf --connect-timeout 2 "http://localhost:$port/health" >/dev/null 2>&1; then
            health_status="✅"
        elif curl -sf --connect-timeout 2 "http://localhost:$port/" >/dev/null 2>&1; then
            health_status="⚠️"
        fi
        
        printf "%-15s %s Port:%s Health:%s PM2:%s Restarts:%s\n" \
            "$service_name" "$port_status" "$port" "$health_status" "$pm2_status" "$restarts"
    done
    echo ""
}

show_system_resources() {
    echo "📊 SYSTEM RESOURCES"
    echo "════════════════════════════════════════════════════════════════"
    
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')
    local disk_usage=$(df -h / | awk 'NR==2{print $5}')
    local cpu_load=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs)
    
    echo "💾 Memory Usage: $memory_usage"
    echo "💿 Disk Usage: $disk_usage" 
    echo "⚡ CPU Load: $cpu_load"
    echo "⏰ Uptime: $(uptime -p)"
    echo ""
}

show_recent_activity() {
    echo "📝 RECENT ACTIVITY"
    echo "════════════════════════════════════════════════════════════════"
    
    if [ -f "$LOG_DIR/health-alerts.log" ]; then
        echo "🚨 Recent Alerts:"
        tail -5 "$LOG_DIR/health-alerts.log" 2>/dev/null | while read -r line; do
            echo "   $line"
        done
    else
        echo "ℹ️ No recent alerts"
    fi
    
    echo ""
    
    if [ -f "$LOG_DIR/health-monitor.log" ]; then
        echo "👁️ Health Monitor:"
        tail -3 "$LOG_DIR/health-monitor.log" 2>/dev/null | while read -r line; do
            echo "   $line"
        done
    else
        echo "ℹ️ Health monitor not active"
    fi
    
    echo ""
}

show_menu() {
    echo "🎛️  CONTROL MENU"
    echo "════════════════════════════════════════════════════════════════"
    echo "1) Start Auto-Restore System"
    echo "2) Stop Auto-Restore System" 
    echo "3) System Status (detailed)"
    echo "4) Run Full Test Suite"
    echo "5) Create Backup Now"
    echo "6) View Recent Logs"
    echo "7) Emergency Service Restore"
    echo "8) System Maintenance"
    echo "9) Generate Report"
    echo "0) Exit"
    echo ""
    echo -n "Select option [0-9]: "
}

start_system() {
    echo "🚀 Starting Auto-Restore System..."
    if "$SCRIPT_DIR/master-orchestrator.sh" start > /dev/null 2>&1; then
        echo "✅ System started successfully"
        sleep 2
    else
        echo "❌ Failed to start system"
    fi
}

stop_system() {
    echo "🛑 Stopping Auto-Restore System..."
    if "$SCRIPT_DIR/master-orchestrator.sh" stop; then
        echo "✅ System stopped successfully"
    else
        echo "❌ Failed to stop system"
    fi
}

run_tests() {
    echo "🧪 Running Full Test Suite..."
    echo ""
    "$SCRIPT_DIR/test-system.sh" full
    echo ""
    echo "Press any key to continue..."
    read -n 1 -s
}

create_backup() {
    echo "📦 Creating System Backup..."
    if "$SCRIPT_DIR/backup-system.sh"; then
        echo "✅ Backup completed successfully"
    else
        echo "❌ Backup failed"
    fi
    sleep 2
}

view_logs() {
    echo "📋 Recent Log Files:"
    echo "1) Health Monitor"
    echo "2) Alerts"
    echo "3) Master Orchestrator"
    echo "4) All PM2 processes"
    echo "0) Back to main menu"
    echo ""
    echo -n "Select log [0-4]: "
    read -n 1 log_choice
    echo ""
    
    case "$log_choice" in
        1) tail -50 "$LOG_DIR/health-monitor.log" 2>/dev/null || echo "No health monitor logs" ;;
        2) tail -50 "$LOG_DIR/health-alerts.log" 2>/dev/null || echo "No alerts" ;;
        3) tail -50 "$LOG_DIR/master-orchestrator.log" 2>/dev/null || echo "No orchestrator logs" ;;
        4) pm2 logs --lines 50 ;;
        *) return ;;
    esac
    
    echo ""
    echo "Press any key to continue..."
    read -n 1 -s
}

emergency_restore() {
    echo "🚑 Emergency Service Restore"
    echo ""
    echo "Select service to restore:"
    echo "1) Auth Service (6021)"
    echo "2) CRM API (6022) - Critical!"
    echo "3) Admin Panel (6002)"
    echo "4) API Gateway (6020)"
    echo "5) MCP Server (6025)"
    echo "6) Images API (6026)"
    echo "0) Cancel"
    echo ""
    echo -n "Select service [0-6]: "
    read -n 1 service_choice
    echo ""
    
    case "$service_choice" in
        1) echo "🔄 Restoring Auth Service..."; "$SCRIPT_DIR/restore-auth-service.sh" ;;
        2) echo "🔄 Restoring CRM API..."; "$SCRIPT_DIR/restore-crm-api.sh" ;;
        3) echo "🔄 Restoring Admin Panel..."; "$SCRIPT_DIR/restore-admin-panel.sh" ;;
        4) echo "🔄 Restoring API Gateway..."; "$SCRIPT_DIR/restore-api-gateway.sh" ;;
        5) echo "🔄 Restoring MCP Server..."; "$SCRIPT_DIR/restore-mcp-server.sh" ;;
        6) echo "🔄 Restoring Images API..."; "$SCRIPT_DIR/restore-images-api.sh" ;;
        *) echo "Cancelled"; return ;;
    esac
    
    echo ""
    echo "Press any key to continue..."
    read -n 1 -s
}

system_maintenance() {
    echo "🧹 Running System Maintenance..."
    if "$SCRIPT_DIR/system-maintenance.sh"; then
        echo "✅ Maintenance completed successfully"
    else
        echo "❌ Maintenance failed"
    fi
    sleep 2
}

generate_report() {
    echo "📊 Generating System Report..."
    "$SCRIPT_DIR/alert-system.sh" daily-report
    echo "✅ Report generated successfully"
    sleep 2
}

main_loop() {
    while true; do
        show_header
        show_system_status
        show_services_status
        show_system_resources
        show_recent_activity
        show_menu
        
        read -n 1 choice
        echo ""
        echo ""
        
        case "$choice" in
            1) start_system ;;
            2) stop_system ;;
            3) "$SCRIPT_DIR/master-orchestrator.sh" status; echo ""; echo "Press any key to continue..."; read -n 1 -s ;;
            4) run_tests ;;
            5) create_backup ;;
            6) view_logs ;;
            7) emergency_restore ;;
            8) system_maintenance ;;
            9) generate_report ;;
            0) echo "👋 Goodbye!"; exit 0 ;;
            *) echo "❌ Invalid option"; sleep 1 ;;
        esac
    done
}

# Проверяем права доступа
if [ "$EUID" -ne 0 ]; then
    echo "❌ This dashboard requires root privileges"
    echo "Please run: sudo $0"
    exit 1
fi

# Создаем необходимые директории
mkdir -p "$LOG_DIR"

# Запускаем главный цикл
main_loop