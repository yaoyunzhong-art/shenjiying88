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

// ============ Gateway Analytics ============

/** 网关分析指标汇总 */
export interface GatewayAnalyticsSummary {
  totalRequests: number
  totalErrors: number
  errorRate: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  uniqueClients: number
  uniqueEndpoints: number
  periodStart: number
  periodEnd: number
}

/** 端点级分析 */
export interface EndpointAnalytics {
  path: string
  method: string
  requestCount: number
  errorCount: number
  avgLatencyMs: number
  p95LatencyMs: number
  lastAccessedAt: number
}

/** 客户端级分析 */
export interface ClientAnalytics {
  clientId: string
  ownerId: string
  requestCount: number
  distinctEndpoints: number
  rateLimitHits: number
  quotaUtilization: number
  lastActiveAt: number
}

/** 时间序列数据点 */
export interface TimeSeriesPoint {
  timestamp: number
  value: number
  label?: string
}

/** 异常检测结果 */
export interface AnomalyDetectionResult {
  detected: boolean
  metric: string
  currentValue: number
  baselineMean: number
  baselineStdDev: number
  deviationFactor: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

/** 分析查询参数 */
export interface AnalyticsQuery {
  startTime?: number
  endTime?: number
  resolution?: '1m' | '5m' | '1h' | '1d'
  endpoint?: string
  clientId?: string
}
