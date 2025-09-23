#!/bin/bash
# Beauty Platform Development Server Startup Script v2.1

echo "🚀 Starting Beauty Platform Development Services..."

# --- Config ---
PROJECT_ROOT="/root/projects/beauty"

# --- Force Kill Old Processes on Ports ---
echo "🛑 Force stopping any processes on required ports..."
kill -9 $(lsof -t -i:6021) 2>/dev/null || true
kill -9 $(lsof -t -i:6020) 2>/dev/null || true
kill -9 $(lsof -t -i:6022) 2>/dev/null || true
kill -9 $(lsof -t -i:6028) 2>/dev/null || true
kill -9 $(lsof -t -i:6001) 2>/dev/null || true
sleep 1 # Give a moment for ports to free up

# --- Function to wait for a service ---
wait_for_service() {
  local name=$1
  local port=$2
  echo -n "⏳ Waiting for $name on port $port..."
  for i in {1..30}; do
    # Use curl's silent and fail-fast options
    if curl -sf --connect-timeout 2 "http://localhost:$port/health" > /dev/null; then
      echo " ✅ UP!"
      return 0
    fi
    sleep 1
  done
  echo " ❌ FAILED to start after 30 seconds."
  return 1
}

# --- Start Backend Services ---
echo "--- Starting Backend Services ---"

# Auth Service (Port 6021)
echo "🔐 Starting Auth Service..."
cd "$PROJECT_ROOT/services/auth-service"
MFA_MASTER_KEY="49dd29bc186073af4bdb05f6fd074317a6045409f1ef540696ed05ad09b38c1b" nohup pnpm dev > "$PROJECT_ROOT/logs/auth-dev.log" 2>&1 &

# API Gateway (Port 6020)
echo "🌐 Starting API Gateway..."
cd "$PROJECT_ROOT/services/api-gateway"
nohup pnpm dev > "$PROJECT_ROOT/logs/gateway-dev.log" 2>&1 &

# CRM API (Port 6022)
echo "💼 Starting CRM API..."
cd "$PROJECT_ROOT/services/crm-api"
nohup pnpm dev > "$PROJECT_ROOT/logs/crm-api-dev.log" 2>&1 &

# Notification Service (Port 6028)
echo "🔔 Starting Notification Service..."
cd "$PROJECT_ROOT/services/notification-service"
nohup pnpm dev > "$PROJECT_ROOT/logs/notification-dev.log" 2>&1 &

# --- Wait for Backend ---
wait_for_service "Auth Service" 6021
wait_for_service "API Gateway" 6020
wait_for_service "CRM API" 6022
wait_for_service "Notification Service" 6028

# --- Start Frontend ---
echo "--- Starting Frontend ---"
echo "🎨 Starting Salon CRM Frontend on port 6001..."
cd "$PROJECT_ROOT/apps/salon-crm"
nohup pnpm dev > "$PROJECT_ROOT/logs/crm-fe-dev.log" 2>&1 &

echo ""
echo "✅ All development services initiated."
echo "You can monitor logs in '$PROJECT_ROOT/logs/'"
echo ""
echo "🔗 Endpoints:"
echo "  - 🎨 Salon CRM (Frontend): http://localhost:6001"
echo "  - 🌐 API Gateway:          http://localhost:6020"
echo ""
echo "To stop all services, run: pkill -f 'pnpm dev'"