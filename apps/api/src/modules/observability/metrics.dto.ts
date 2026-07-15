/**
 * metrics.dto.ts — 可观测性模块 DTO
 *
 * 为监控面板、告警规则 CRUD 等提供请求/响应结构。
 */

import type { AlertRule } from './metrics.entity'

// ── 查询 /metrics 返回的前端友好结构 ──
export interface MetricsListResponse {
  metrics: string[]
  count: number
}

// ── 健康检查响应 ──
export interface HealthzResponse {
  status: 'ok' | 'degraded' | 'down'
  metrics: number
  uptimeSeconds: number
}

// ── 告警规则 CRUD ──
export interface CreateAlertRuleRequest {
  name: string
  metricName: string
  operator: '>' | '<' | '>=' | '<=' | '=='
  threshold: number
  duration: string
  severity: 'info' | 'warning' | 'critical'
  description?: string
}

export interface UpdateAlertRuleRequest {
  name?: string
  metricName?: string
  operator?: '>' | '<' | '>=' | '<=' | '=='
  threshold?: number
  duration?: string
  severity?: 'info' | 'warning' | 'critical'
  description?: string
}

export interface AlertRuleResponse extends AlertRule {
  id: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}
