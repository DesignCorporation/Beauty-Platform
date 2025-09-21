# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL 15+
- Redis (optional, for caching)
- Docker & Docker Compose (optional)
- Nginx (for production)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/DesignCorporation/Beauty-Platform.git
cd Beauty-Platform
```

### 2. Install Dependencies
```bash
# Install pnpm globally if not installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Database Setup
```bash
# Start PostgreSQL (if using Docker)
docker run -d \
  --name beauty-postgres \
  -e POSTGRES_USER=beauty_platform_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=beauty_platform_new \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd core/database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 5. Start Services

#### Option A: Start All Services
```bash
# Start all services in development mode
pnpm dev:all

# Or start specific services
pnpm --filter auth-service dev
pnpm --filter admin-panel dev
pnpm --filter salon-crm dev
```

#### Option B: Start Core Services Only
```bash
# Terminal 1: Auth Service
cd services/auth-service
pnpm dev

# Terminal 2: API Gateway
cd services/api-gateway
pnpm dev

# Terminal 3: CRM API
cd services/crm-api
PORT=6022 pnpm dev

# Terminal 4: Admin Panel
cd apps/admin-panel
pnpm dev

# Terminal 5: Salon CRM
cd apps/salon-crm
pnpm dev
```

### 6. Verify Installation
```bash
# Check health endpoints
curl http://localhost:6020/health  # API Gateway
curl http://localhost:6021/health  # Auth Service
curl http://localhost:6001         # Salon CRM
curl http://localhost:6002         # Admin Panel
```

## Docker Deployment

### Using Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: beauty_platform_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: beauty_platform_new
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api-gateway:
    build:
      context: .
      dockerfile: services/api-gateway/Dockerfile
    ports:
      - "6020:6020"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://beauty_platform_user:secure_password@postgres:5432/beauty_platform_new
    depends_on:
      - postgres
      - redis

  auth-service:
    build:
      context: .
      dockerfile: services/auth-service/Dockerfile
    ports:
      - "6021:6021"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://beauty_platform_user:secure_password@postgres:5432/beauty_platform_new
    depends_on:
      - postgres

  # Add other services...

volumes:
  postgres_data:
```

### Build and Run
```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### 1. Server Requirements
- Ubuntu 22.04 LTS or similar
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- SSL certificates (Let's Encrypt)

### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/beauty-platform

# API Gateway
server {
    listen 80;
    server_name api.beauty.designcorp.eu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.beauty.designcorp.eu;

    ssl_certificate /etc/letsencrypt/live/api.beauty.designcorp.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.beauty.designcorp.eu/privkey.pem;

    location / {
        proxy_pass http://localhost:6020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Salon CRM
server {
    listen 443 ssl http2;
    server_name crm.beauty.designcorp.eu;

    ssl_certificate /etc/letsencrypt/live/crm.beauty.designcorp.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.beauty.designcorp.eu/privkey.pem;

    root /var/www/beauty-platform/apps/salon-crm/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:6020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.beauty.designcorp.eu;

    ssl_certificate /etc/letsencrypt/live/admin.beauty.designcorp.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.beauty.designcorp.eu/privkey.pem;

    root /var/www/beauty-platform/apps/admin-panel/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:6020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. PM2 Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Start services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor services
pm2 monit

# View logs
pm2 logs
```

### 4. Database Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-beauty-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/beauty-platform"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="beauty_platform_new"
DB_USER="beauty_platform_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-beauty-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-beauty-db.sh") | crontab -
```

### 5. SSL Certificates
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d beauty.designcorp.eu
sudo certbot --nginx -d api.beauty.designcorp.eu
sudo certbot --nginx -d crm.beauty.designcorp.eu
sudo certbot --nginx -d admin.beauty.designcorp.eu

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check all services status
curl http://localhost:6020/api/monitoring/services

# Check specific service
curl http://localhost:6020/health

# Auto-restore status
./deployment/auto-restore/smart-restore-manager.sh status
```

### Log Management
```bash
# View service logs
pm2 logs auth-service
pm2 logs api-gateway

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Performance Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Database performance
psql -U beauty_platform_user -d beauty_platform_new -c "SELECT * FROM pg_stat_activity;"
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :6020

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U beauty_platform_user -d beauty_platform_new -h localhost
```

#### 3. Service Won't Start
```bash
# Check logs
pm2 logs service-name --lines 100

# Restart service
pm2 restart service-name

# Rebuild service
cd services/service-name
pnpm build
pm2 restart service-name
```

#### 4. Migration Issues
```bash
# Reset database (CAUTION: Development only)
npx prisma migrate reset

# Force migration
npx prisma migrate deploy --skip-seed
```

## Security Checklist

- [ ] Environment variables secured
- [ ] Database passwords strong
- [ ] SSL certificates valid
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] JWT secrets rotated
- [ ] Backup system working
- [ ] Monitoring alerts setup
- [ ] Error logging configured

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Deploy multiple instances of services
- Use Redis for session management
- Implement database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

---

*Last updated: 2025-01-21*