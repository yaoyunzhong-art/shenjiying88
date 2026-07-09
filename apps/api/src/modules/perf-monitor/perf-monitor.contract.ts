/**
 * 🐜 自动: [perf-monitor] [D] contract 补全
 *
 * 性能监控：跨模块合约类型
 * 定义 perf-monitor 模块对外暴露的稳定合约接口，
 * 供其他模块（observability, monitoring, ops-manual 等）消费。
 */
import type {
  PerfSample,
  PerfStats,
  SlaConfig,
  PerfSummary,
  SlaViolation,
  PerfAlert,
  PerfAlertLevel,
} from './perf-monitor.entity'

/**
 * 性能采样合约（跨模块安全子集）
 */
export interface PerfSampleContract {
  route: string
  durationMs: number
  statusCode: number
  timestamp: string
  tenantId?: string
}

/**
 * 路由性能统计合约（跨模块安全子集）
 */
export interface PerfStatsContract {
  route: string
  p50: number
  p95: number
  p99: number
  max: number
  count: number
  errorRate: number
}

/**
 * SLA 配置合约（跨模块安全子集）
 */
export interface SlaConfigContract {
  route: string
  targetP95Ms: number
  warnThresholdP95Ms: number
}

/**
 * 性能总览合约
 */
export interface PerfSummaryContract {
  totalSamples: number
  routes: number
  slowQueries: number
  slaViolations: number
}

/**
 * SLA 违规合约
 */
export interface SlaViolationContract {
  route: string
  violations: number
  stats: PerfStatsContract
}

/**
 * 性能告警合约
 */
export interface PerfAlertContract {
  id: string
  route: string
  level: PerfAlertLevel
  message: string
  p95: number
  threshold: number
  timestamp: string
}

/**
 * 记录采样请求合约
 */
export interface RecordSampleRequestContract {
  route: string
  durationMs: number
  statusCode: number
  timestamp?: string
  tenantId?: string
}

/**
 * 注册 SLA 请求合约
 */
export interface RegisterSlaRequestContract {
  route: string
  targetP95Ms: number
  warnThresholdP95Ms: number
}

/**
 * 路由统计查询合约
 */
export interface RouteStatsQueryContract {
  route: string
}

/**
 * 慢查询查询合约
 */
export interface SlowQueriesQueryContract {
  limit?: number
}

/**
 * 重置请求合约
 */
export interface ResetRequestContract {
  confirm?: boolean
}

/**
 * 记录采样响应合约
 */
export interface RecordSampleResponseContract {
  accepted: boolean
  total: number
}

/**
 * 注册 SLA 响应合约
 */
export interface RegisterSlaResponseContract {
  route: string
  registered: boolean
}

/**
 * 重置响应合约
 */
export interface ResetResponseContract {
  reset: boolean
}

/**
 * 模块导出合约映射
 * 用于跨模块类型安全引用
 */
export interface PerfMonitorContractMap {
  // Entities
  PerfSample: PerfSampleContract
  PerfStats: PerfStatsContract
  SlaConfig: SlaConfigContract
  PerfSummary: PerfSummaryContract
  SlaViolation: SlaViolationContract
  PerfAlert: PerfAlertContract

  // Requests
  RecordSampleRequest: RecordSampleRequestContract
  RegisterSlaRequest: RegisterSlaRequestContract
  RouteStatsQuery: RouteStatsQueryContract
  SlowQueriesQuery: SlowQueriesQueryContract
  ResetRequest: ResetRequestContract

  // Responses
  RecordSampleResponse: RecordSampleResponseContract
  RegisterSlaResponse: RegisterSlaResponseContract
  ResetResponse: ResetResponseContract

  // Enums
  PerfAlertLevel: PerfAlertLevel
}
