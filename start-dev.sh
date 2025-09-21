#!/bin/bash
# Beauty Platform Development Server Startup Script

echo "🚀 Starting Beauty Platform Development Services..."

# Kill existing processes
pkill -f "ts-node.*server.ts"
pkill -f "vite.*6002"

# Start Auth Service
echo "🔐 Starting Auth Service on port 6021..."
cd /root/beauty-platform/services/auth-service
JWT_SECRET="your-super-secret-jwt-key-change-in-production-beauty-platform-2025" \
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production-beauty-platform-2025" \
NODE_ENV=development \
npx ts-node src/server.ts &

# Wait for Auth Service to start
sleep 3

# Start Admin Panel
echo "🌐 Starting Admin Panel on port 6002..."
cd /root/beauty-platform/apps/admin-panel
npm run dev -- --host 0.0.0.0 --port 6002 &

# Wait for services to start
sleep 5

# Check services
echo "📊 Checking services status..."
echo "Auth Service: $(curl -s http://localhost:6021/health | grep -o '"success":true' || echo '❌ FAILED')"
echo "Admin Panel: $(curl -s -I http://localhost:6002 | grep -o 'HTTP/1.1 200 OK' || echo '❌ FAILED')"

echo ""
echo "✅ Beauty Platform Development Services Started!"
echo "🔐 Auth Service: http://localhost:6021"
echo "🌐 Admin Panel: http://localhost:6002"
echo ""
echo "Test credentials:"
echo "Email: admin@beauty-platform.com"
echo "Password: admin123"
echo ""
echo "To stop services: pkill -f ts-node && pkill -f vite"