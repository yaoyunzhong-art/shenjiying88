// perf-monitor.entity.ts - Phase-19 T27 auto
// 用途: 性能监控实体类型定义
import 'reflect-metadata'

/**
 * 性能采样记录
 */
export interface PerfSample {
  route: string
  durationMs: number
  statusCode: number
  timestamp: string
  tenantId?: string
}

/**
 * 路由级别性能统计
 */
export interface PerfStats {
  route: string
  p50: number
  p95: number
  p99: number
  max: number
  count: number
  errorRate: number
}

/**
 * SLA 配置
 */
export interface SlaConfig {
  route: string
  targetP95Ms: number
  warnThresholdP95Ms: number
}

/**
 * 性能总览
 */
export interface PerfSummary {
  totalSamples: number
  routes: number
  slowQueries: number
  slaViolations: number
}

/**
 * SLA 违规记录
 */
export interface SlaViolation {
  route: string
  violations: number
  stats: PerfStats
}

/**
 * 性能告警级别
 */
export enum PerfAlertLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  CRITICAL = 'CRITICAL',
}

/**
 * 性能告警
 */
export interface PerfAlert {
  id: string
  route: string
  level: PerfAlertLevel
  message: string
  p95: number
  threshold: number
  timestamp: string
}

/**
 * 从 PerfStats 构造总览
 */
export function toPerfSummary(stats: PerfStats[]): PerfSummary {
  return {
    totalSamples: stats.reduce((s, r) => s + r.count, 0),
    routes: stats.length,
    slowQueries: 0,
    slaViolations: 0,
  }
}
