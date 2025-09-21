# Beauty Platform - Backup Service Integration Guide

## 🔗 Интеграция с Admin Panel

### 1. Конфигурация фронтенда

Добавьте в Admin Panel следующие переменные окружения:

```bash
# apps/admin-panel/.env
NEXT_PUBLIC_BACKUP_SERVICE_URL=http://135.181.156.117:6027
NEXT_PUBLIC_BACKUP_WS_URL=ws://135.181.156.117:6027/backup-ws
```

### 2. API интеграция

```typescript
// apps/admin-panel/src/services/backup.ts
import axios from 'axios'

const BACKUP_API = process.env.NEXT_PUBLIC_BACKUP_SERVICE_URL + '/api/backup'

export class BackupService {
  private getHeaders() {
    const token = localStorage.getItem('accessToken')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async getSystemStatus() {
    const response = await axios.get(`${BACKUP_API}/status`, {
      headers: this.getHeaders()
    })
    return response.data.status
  }

  async listBackups(page = 1, limit = 20) {
    const response = await axios.get(`${BACKUP_API}/list`, {
      params: { page, limit },
      headers: this.getHeaders()
    })
    return response.data
  }

  async createBackup(description?: string) {
    const response = await axios.post(`${BACKUP_API}/create`, {
      type: 'manual',
      description
    }, {
      headers: this.getHeaders()
    })
    return response.data
  }

  async deleteBackup(backupId: string, force = false) {
    const response = await axios.delete(`${BACKUP_API}/${backupId}`, {
      data: { force },
      headers: this.getHeaders()
    })
    return response.data
  }

  getDownloadUrl(backupId: string, component?: string) {
    const token = localStorage.getItem('accessToken')
    const baseUrl = `${BACKUP_API}/${backupId}/download`
    const params = new URLSearchParams()
    
    if (component) params.append('component', component)
    
    return `${baseUrl}?${params.toString()}&token=${token}`
  }
}
```

### 3. WebSocket интеграция

```typescript
// apps/admin-panel/src/hooks/useBackupWebSocket.ts
import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

export function useBackupWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [backupProgress, setBackupProgress] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const wsUrl = process.env.NEXT_PUBLIC_BACKUP_WS_URL!
    const newSocket = io(wsUrl, {
      path: '/backup-ws/'
    })

    // Аутентификация
    newSocket.emit('authenticate', { token })

    newSocket.on('authenticated', () => {
      setIsConnected(true)
      newSocket.emit('subscribe-backup-events')
    })

    newSocket.on('backup-progress', (event) => {
      setBackupProgress(event)
    })

    newSocket.on('backup-completed', (event) => {
      setBackupProgress(null)
      // Показать уведомление об успешном завершении
    })

    newSocket.on('backup-error', (event) => {
      setBackupProgress(null)
      // Показать ошибку
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return {
    socket,
    isConnected,
    backupProgress
  }
}
```

## 🚦 Развертывание в production

### 1. Установка сервиса

```bash
cd /root/beauty-platform/services/backup-service

# Установка зависимостей
pnpm install

# Сборка
pnpm run build

# Развертывание
./deploy.sh
```

### 2. Проверка статуса

```bash
# Проверка PM2
pm2 status backup-service

# Проверка логов
pm2 logs backup-service --lines 20

# Health check
curl http://135.181.156.117:6027/health
```

### 3. Nginx конфигурация

Добавьте в nginx конфигурацию для проксирования:

```nginx
# /etc/nginx/sites-available/backup-service
server {
    listen 80;
    server_name backup-api.beauty.designcorp.eu;

    location / {
        proxy_pass http://localhost:6027;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /backup-ws/ {
        proxy_pass http://localhost:6027;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/backup-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Безопасность

### 1. JWT токен

Backup Service использует те же JWT токены что и Auth Service. Убедитесь что `JWT_SECRET` идентичен в обоих сервисах.

### 2. Авторизация

Доступ к backup системе имеют только пользователи с ролью `SUPER_ADMIN`.

### 3. CORS

Разрешены запросы только с доменов Beauty Platform.

## 📊 Мониторинг

### 1. Health checks

```bash
# Системный статус
curl -H "Authorization: Bearer <token>" \
     http://135.181.156.117:6027/api/backup/status

# Список активных операций
curl -H "Authorization: Bearer <token>" \
     http://135.181.156.117:6027/api/backup/list?limit=1
```

### 2. Логи

```bash
# PM2 логи
pm2 logs backup-service

# Backup логи
tail -f /var/log/beauty-backup.log

# System журнал
journalctl -u backup-service -f
```

## 🎯 UI компоненты

### Рекомендуемые компоненты для Admin Panel:

1. **BackupSystemStatus** - Карточка со статусом системы
2. **BackupList** - Таблица с backup'ами и действиями
3. **CreateBackupButton** - Кнопка создания backup'а
4. **BackupProgressModal** - Modal с real-time прогрессом
5. **BackupConfigPanel** - Панель настроек системы

### Пример компонента:

```tsx
// apps/admin-panel/src/components/backup/BackupSystemStatus.tsx
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackupService } from '@/services/backup'

const backupService = new BackupService()

export function BackupSystemStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['backup-status'],
    queryFn: () => backupService.getSystemStatus(),
    refetchInterval: 30000 // Обновляем каждые 30 секунд
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Система резервного копирования</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Статус</p>
            <p className={`font-medium ${
              status?.backupService.status === 'healthy' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {status?.backupService.status}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Последний backup</p>
            <p className="font-medium">
              {status?.lastBackup 
                ? new Date(status.lastBackup.timestamp).toLocaleString()
                : 'Нет данных'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Свободного места</p>
            <p className="font-medium">
              {status?.storage.available} MB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Активные операции</p>
            <p className="font-medium">
              {status?.activeOperations.length || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🚨 Troubleshooting

### Проблема: "Service not responding"

1. Проверьте статус PM2: `pm2 status backup-service`
2. Проверьте порт: `netstat -tlnp | grep 6027`
3. Проверьте логи: `pm2 logs backup-service`

### Проблема: "Authentication failed"

1. Проверьте JWT_SECRET в .env файлах
2. Убедитесь что пользователь имеет роль SUPER_ADMIN
3. Проверьте формат токена: `Bearer <token>`

### Проблема: "Backup script not found"

1. Проверьте существование скрипта: `ls -la /root/SCRIPTS/production-backup.sh`
2. Проверьте права выполнения: `chmod +x /root/SCRIPTS/production-backup.sh`
3. Проверьте путь в конфигурации

## 📞 Поддержка

При возникновении проблем с интеграцией:

1. Проверьте все endpoints через curl
2. Используйте test-service.js для проверки API
3. Проверьте WebSocket соединение в браузере
4. Убедитесь что все переменные окружения настроены правильно