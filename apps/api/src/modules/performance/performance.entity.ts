// ── 性能模块实体类型定义 ─────────────────────────────────────────────

// ── 缓存相关 ─────────────────────────────────────────────────────────

export type CacheTier = 'l1' | 'l2' | 'l3'
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl'

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  tier: CacheTier
  createdAt: Date
  accessedAt: Date
  accessCount: number
  sizeBytes: number
  ttlMs?: number
  tags?: string[]
}

export interface CacheStats {
  tier: CacheTier
  totalKeys: number
  totalBytes: number
  hitCount: number
  missCount: number
  hitRate: number
  evictionCount: number
}

export interface MultiLevelConfig {
  l1: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number }
  l2: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  l3: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  readThrough: boolean
  writeThrough: boolean
  prefetchEnabled: boolean
}

export interface GlobalCacheStats {
  totalHits: number
  totalMisses: number
  overallHitRate: number
  totalKeys: number
  totalBytes: number
}

// ── 数据库优化相关 ───────────────────────────────────────────────────

export type QueryType = 'select' | 'insert' | 'update' | 'delete' | 'transaction'
export type IndexType = 'btree' | 'hash' | 'gin' | 'gist' | 'brin'

export interface QueryAnalysis {
  query: string
  queryType: QueryType
  estimatedCost: number
  rowsExamined: number
  rowsReturned: number
  executionTime: number
  recommendations: string[]
  indexUsed?: string
  tableName?: string
}

export interface IndexCandidate {
  tableName: string
  column: string
  indexName: string
  indexType: IndexType
  selectivity: number
  estimatedSize: number
  recommendation: 'create' | 'drop' | 'consider'
  reason: string
}

export interface ConnectionPoolConfig {
  minConnections: number
  maxConnections: number
  acquireTimeout: number
  idleTimeout: number
  connectionTimeout: number
  healthCheckInterval: number
}

export interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  avgAcquireTime: number
  avgQueryTime: number
  hitRate: number
  connectionErrors: number
}

export interface QueryExecutionPlan {
  query: string
  nodeType: string
  estimatedCost: number
  estimatedRows: number
  actualRows: number
  actualTime: number[]
  warnings: string[]
}

export interface RewriteResult {
  rewritten: string
  improvement: string
}

// ── K6 压测相关 ─────────────────────────────────────────────────────

export type LoadPattern = 'constant' | 'ramp' | 'peak' | 'stress' | 'spike'
export type StatusCode = 'ok' | 'error' | 'timeout' | 'crash'

export interface LoadTestConfig {
  name: string
  vu: number
  duration: number
  pattern: LoadPattern
  targetRPS?: number
  stages?: { duration: number; vu: number }[]
}

export interface RequestMetric {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  statusCode: number
  responseTime: number
  timestamp: Date
  success: boolean
  error?: string
}

export interface AggregateMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  timeoutRequests: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  requestsPerSecond: number
  errorRate: number
  throughputBytesPerSec: number
}

export interface LoadTestResult {
  config: LoadTestConfig
  metrics: AggregateMetrics
  duration: number
  startedAt: Date
  completedAt: Date
  statusCode: StatusCode
  bottlenecks: string[]
}

export interface LoadTestEndpoint {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  weight: number
}

export interface OptimizationSuggestion {
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  expectedGain: string
}

// ── K8s 弹性伸缩相关 ───────────────────────────────────────────────

export type MetricSource = 'cpu' | 'memory' | 'requests_per_second' | 'latency' | 'custom'
export type ScalingAction = 'scale_up' | 'scale_down' | 'scale_stabilize'
export type DeploymentStatus = 'healthy' | 'degraded' | 'critical' | 'unknown'

export interface HPAPolicy {
  name: string
  metric: MetricSource
  targetValue: number
  targetPercent: number
  minReplicas: number
  maxReplicas: number
  stabilizationWindowSeconds: number
  cooldownSeconds: number
  enabled: boolean
}

export interface ReplicaMetrics {
  timestamp: Date
  cpuPercent: number
  memoryPercent: number
  requestsPerSecond: number
  latencyMs: number
  currentReplicas: number
}

export interface ScalingDecision {
  action: ScalingAction
  targetReplicas: number
  reason: string
  currentMetrics: ReplicaMetrics
  triggeredBy: MetricSource
  confidence: number
  cooldownRemainingSeconds: number
}

export interface DeploymentHealth {
  name: string
  status: DeploymentStatus
  readyReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  conditions: { type: string; status: string; message?: string }[]
  lastScaleAt?: Date
  uptimePercent: number
}

export interface DeploymentListEntry {
  name: string
  status: DeploymentStatus
}

export interface ScaleHistoryEntry {
  timestamp: Date
  from: number
  to: number
  reason: string
}

export interface CostEstimate {
  cpuCostPerHour: number
  memoryCostPerHour: number
  totalPerHour: number
  totalPerMonth: number
}

export interface CreateHPAPolicyRequest {
  name: string
  metric: MetricSource
  targetValue: number
  targetPercent: number
  minReplicas: number
  maxReplicas: number
  stabilizationWindowSeconds: number
  cooldownSeconds: number
  enabled: boolean
}
