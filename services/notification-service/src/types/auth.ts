export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  type: 'access_token' | 'client_access_token';
  iat?: number;
  exp?: number;
}

export interface RequestContext {
  user: JWTPayload;
  tenantId: string;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}