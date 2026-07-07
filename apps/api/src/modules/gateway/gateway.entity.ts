// gateway.entity.ts — Gateway API 网关实体类型定义

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface GatewayRequest {
  path: string
  method: string
  headers: Record<string, string | string[] | undefined>
  query?: Record<string, string>
  body?: any
  ip?: string
  timestamp?: number
}

export interface GatewayResponse {
  statusCode: number
  body: any
  headers?: Record<string, string>
}

export interface RouteConfig {
  service: string
  pathPattern: string
  methods: string[]
  timeout?: number
}

export interface QuotaStatus {
  clientId: string
  endpoint: string
  tokens: number
  maxTokens: number
  refillRate: number
  lastRefillAt: number
}

export interface APIKey {
  keyId: string
  key: string
  name: string
  ownerId: string
  scopes: string[]
  createdAt: number
  revokedAt?: number
  expiresAt?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

export interface AuthResult {
  authenticated: boolean
  clientId?: string
  ownerId?: string
  scopes?: string[]
  error?: string
}

export interface RouteResult {
  service: string
  timeout: number
}

export interface GatewayLogEntry {
  timestamp: number
  path: string
  method: string
  statusCode?: number
  responseTime?: number
  clientId?: string
  ip?: string
}
