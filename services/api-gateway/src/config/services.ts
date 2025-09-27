/**
 * API Gateway Services Configuration
 * ⚠️  AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * This file is generated from @beauty-platform/service-registry
 * To make changes, update the unified registry and run:
 * pnpm --filter api-gateway run generate:services
 *
 * Generated: 2025-09-27T13:38:34.127Z
 */

export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  timeout?: number;
  retries?: number;
  healthCheck?: string;
}

export interface SecurityConfig {
  enableHelmet: boolean;
  enableCompression: boolean;
  enableLogging: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

export interface APIGatewayConfig {
  services: Record<string, ServiceConfig>;
  port: number;
  host: string;
  security: SecurityConfig;
  corsOrigins: string[];
  rateLimit: RateLimitConfig;
}

// Services integrated with API Gateway (auto-generated from unified registry)
export const SERVICES: Record<string, ServiceConfig> = {
  "auth-service": {
    "name": "Auth Service",
    "url": "http://localhost:6021",
    "path": "/auth",
    "timeout": 30000,
    "retries": 3,
    "healthCheck": "/health"
  },
  "crm-api": {
    "name": "CRM API",
    "url": "http://localhost:6022",
    "path": "/crm",
    "timeout": 30000,
    "retries": 3,
    "healthCheck": "/health"
  },
  "mcp-server": {
    "name": "MCP Server",
    "url": "http://localhost:6025",
    "path": "/mcp",
    "timeout": 15000,
    "retries": 2,
    "healthCheck": "/health"
  },
  "images-api": {
    "name": "Images API",
    "url": "http://localhost:6026",
    "path": "/images",
    "timeout": 60000,
    "retries": 2,
    "healthCheck": "/health"
  },
  "notification-service": {
    "name": "Notification Service",
    "url": "http://localhost:6028",
    "path": "/notifications",
    "timeout": 20000,
    "retries": 2,
    "healthCheck": "/health"
  },
  "payment-service": {
    "name": "Payment Service",
    "url": "http://localhost:6029",
    "path": "/payments",
    "timeout": 45000,
    "retries": 3,
    "healthCheck": "/health"
  }
};

// Full API Gateway configuration
export const API_GATEWAY_CONFIG: APIGatewayConfig = {
  "services": {
    "auth-service": {
      "name": "Auth Service",
      "url": "http://localhost:6021",
      "path": "/auth",
      "timeout": 30000,
      "retries": 3,
      "healthCheck": "/health"
    },
    "crm-api": {
      "name": "CRM API",
      "url": "http://localhost:6022",
      "path": "/crm",
      "timeout": 30000,
      "retries": 3,
      "healthCheck": "/health"
    },
    "mcp-server": {
      "name": "MCP Server",
      "url": "http://localhost:6025",
      "path": "/mcp",
      "timeout": 15000,
      "retries": 2,
      "healthCheck": "/health"
    },
    "images-api": {
      "name": "Images API",
      "url": "http://localhost:6026",
      "path": "/images",
      "timeout": 60000,
      "retries": 2,
      "healthCheck": "/health"
    },
    "notification-service": {
      "name": "Notification Service",
      "url": "http://localhost:6028",
      "path": "/notifications",
      "timeout": 20000,
      "retries": 2,
      "healthCheck": "/health"
    },
    "payment-service": {
      "name": "Payment Service",
      "url": "http://localhost:6029",
      "path": "/payments",
      "timeout": 45000,
      "retries": 3,
      "healthCheck": "/health"
    }
  },
  "port": 6020,
  "host": "localhost",
  "security": {
    "enableHelmet": true,
    "enableCompression": true,
    "enableLogging": true
  },
  "corsOrigins": [
    "http://localhost:3000",
    "http://localhost:6000",
    "http://localhost:6001",
    "http://localhost:6002",
    "http://localhost:6003",
    "https://salon.beauty.designcorp.eu",
    "https://admin.beauty.designcorp.eu",
    "https://client.beauty.designcorp.eu",
    "https://beauty.designcorp.eu"
  ],
  "rateLimit": {
    "windowMs": 900000,
    "max": 1000,
    "message": "Too many requests from this IP, please try again later."
  }
};

export default SERVICES;
