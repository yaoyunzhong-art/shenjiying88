/**
 * 监控告警 - Service (V10 Day 9 Phase 93)
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  MetricDefinition, MetricPoint, AlertRule, Alert, AlertAuditLog,
  AlertSeverity, AlertChannel,
} from './monitoring.entity'
import { BUILTIN_METRICS, SEVERITY_RANK } from './monitoring.entity'

@Injectable()
export class MonitoringService {
  private readonly metricDefs = new Map<string, MetricDefinition>()
  /** 指标点 (按 metric name 分桶) */
  private readonly metricPoints = new Map<string, MetricPoint[]>()
  private readonly alertRules = new Map<string, AlertRule>()
  private readonly alerts = new Map<string, Alert>()
  private readonly audits: AlertAuditLog[] = []
  /** 评估状态: ruleId -> firstFireTimestamp */
  private readonly evalState = new Map<string, number>()

  constructor() {
    BUILTIN_METRICS.forEach((m) => this.metricDefs.set(m.name, m))
    this.seed()
  }

  // ============ 1. 指标定义 ============

  listMetricDefinitions(): MetricDefinition[] {
    return Array.from(this.metricDefs.values())
  }

  getMetricDefinition(name: string): MetricDefinition | null {
    return this.metricDefs.get(name) ?? null
  }

  // ============ 2. 指标上报 ============

  recordMetric(point: Omit<MetricPoint, 'timestamp'>): MetricPoint {
    const full: MetricPoint = { ...point, timestamp: new Date().toISOString() }
    const list = this.metricPoints.get(point.name) ?? []
    list.push(full)
    // 保留最近 1 小时
    const oneHourAgo = Date.now() - 3600 * 1000
    while (list.length > 0 && new Date(list[0].timestamp).getTime() < oneHourAgo) {
      list.shift()
    }
    this.metricPoints.set(point.name, list)
    // 评估告警规则
    this.evaluateRules(point.name)
    return full
  }

  /** 批量上报 */
  recordMetricsBatch(points: Omit<MetricPoint, 'timestamp'>[]): { count: number } {
    points.forEach((p) => this.recordMetric(p))
    return { count: points.length }
  }

  /** 查询指标点 */
  queryMetric(name: string, limit = 100): MetricPoint[] {
    const list = this.metricPoints.get(name) ?? []
    return list.slice(-limit)
  }

  /** 计算平均值 */
  getMetricAverage(name: string, windowSec = 60): number | null {
    const list = this.metricPoints.get(name) ?? []
    const cutoff = Date.now() - windowSec * 1000
    const recent = list.filter((p) => new Date(p.timestamp).getTime() >= cutoff)
    if (recent.length === 0) return null
    return recent.reduce((s, p) => s + p.value, 0) / recent.length
  }

  // ============ 3. 告警规则 ============

  createAlertRule(input: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const id = `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const rule: AlertRule = { ...input, id, createdAt: now, updatedAt: now }
    this.alertRules.set(id, rule)
    return rule
  }

  listAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values())
  }

  getAlertRule(id: string): AlertRule | null {
    return this.alertRules.get(id) ?? null
  }

  updateAlertRule(id: string, patch: Partial<AlertRule>): AlertRule | null {
    const r = this.alertRules.get(id)
    if (!r) return null
    const updated = { ...r, ...patch, id: r.id, updatedAt: new Date().toISOString() }
    this.alertRules.set(id, updated)
    return updated
  }

  // ============ 4. 告警评估 ============

  /** 评估所有规则 (针对某个 metric) */
  private evaluateRules(metricName: string): void {
    const rules = Array.from(this.alertRules.values()).filter(
      (r) => r.enabled && r.metric === metricName,
    )
    for (const rule of rules) {
      this.evaluateRule(rule)
    }
  }

  private evaluateRule(rule: AlertRule): void {
    const avg = this.getMetricAverage(rule.metric)
    if (avg === null) return

    const matched = this.compare(avg, rule.comparator, rule.threshold)
    const stateKey = rule.id

    if (matched) {
      const firstFire = this.evalState.get(stateKey)
      const now = Date.now()
      if (firstFire === undefined) {
        // 首次匹配: 记录开始时间
        this.evalState.set(stateKey, now)
        // 如果 durationSec=0, 立即触发
        if (rule.durationSec <= 0) {
          const existing = Array.from(this.alerts.values()).find(
            (a) => a.ruleId === rule.id && a.status === 'firing',
          )
          if (!existing) this.fireAlert(rule, avg)
        }
        return
      }
      const duration = (now - firstFire) / 1000
      if (duration >= rule.durationSec) {
        // 检查是否已有 firing 告警
        const existing = Array.from(this.alerts.values()).find(
          (a) => a.ruleId === rule.id && a.status === 'firing',
        )
        if (!existing) this.fireAlert(rule, avg)
      }
    } else {
      this.evalState.delete(stateKey)
      // 解决 firing 告警
      const existing = Array.from(this.alerts.values()).find(
        (a) => a.ruleId === rule.id && a.status === 'firing',
      )
      if (existing) this.resolveAlert(existing.id, avg)
    }
  }

  private compare(value: number, op: AlertRule['comparator'], threshold: number): boolean {
    switch (op) {
      case 'gt': return value > threshold
      case 'gte': return value >= threshold
      case 'lt': return value < threshold
      case 'lte': return value <= threshold
      case 'eq': return value === threshold
    }
  }

  private fireAlert(rule: AlertRule, currentValue: number): Alert {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const alert: Alert = {
      id, ruleId: rule.id, ruleName: rule.name,
      severity: rule.severity, status: 'firing',
      value: currentValue, threshold: rule.threshold,
      message: `${rule.metric} ${rule.comparator} ${rule.threshold} (current: ${currentValue.toFixed(2)})`,
      firedAt: new Date().toISOString(),
      receivers: [],
    }
    this.alerts.set(id, alert)
    this.recordAudit({ alertId: id, action: 'fire' })
    return alert
  }

  private resolveAlert(id: string, finalValue: number): void {
    const a = this.alerts.get(id)
    if (!a) return
    a.status = 'resolved'
    a.resolvedAt = new Date().toISOString()
    a.value = finalValue
    this.recordAudit({ alertId: id, action: 'resolve' })
  }

  silenceAlert(id: string, durationSec: number, operator: string, reason?: string): Alert | null {
    const a = this.alerts.get(id)
    if (!a) return null
    a.status = 'silenced'
    a.silencedUntil = new Date(Date.now() + durationSec * 1000).toISOString()
    this.recordAudit({ alertId: id, action: 'silence', operator, reason })
    return a
  }

  // ============ 5. 告警查询 ============

  listAlerts(status?: Alert['status']): Alert[] {
    let alerts = Array.from(this.alerts.values())
    if (status) alerts = alerts.filter((a) => a.status === status)
    return alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  }

  getAlert(id: string): Alert | null {
    return this.alerts.get(id) ?? null
  }

  /** 严重告警计数 */
  countBySeverity(): Record<AlertSeverity, number> {
    const result: Record<AlertSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 }
    for (const a of this.alerts.values()) {
      if (a.status === 'firing') result[a.severity]++
    }
    return result
  }

  // ============ 6. 审计 ============

  listAudits(alertId: string): AlertAuditLog[] {
    return this.audits.filter((a) => a.alertId === alertId)
  }

  private recordAudit(input: Omit<AlertAuditLog, 'id' | 'timestamp'>): void {
    this.audits.push({
      ...input,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    })
    if (this.audits.length > 5000) this.audits.shift()
  }

  // ============ 7. 种子 ============

  private seed(): void {
    const now = new Date().toISOString()

    this.alertRules.set('rule-seed-error-rate', {
      id: 'rule-seed-error-rate', name: '高错误率告警',
      metric: 'http.error.rate', comparator: 'gt', threshold: 0.05,
      durationSec: 60, severity: 'error',
      channels: ['in_app', 'webhook'], enabled: true,
      createdBy: 'system', createdAt: now, updatedAt: now,
    })
    this.alertRules.set('rule-seed-ai-latency', {
      id: 'rule-seed-ai-latency', name: 'AI 延迟告警',
      metric: 'ai.latency.avg', comparator: 'gt', threshold: 1000,
      durationSec: 30, severity: 'warning',
      channels: ['in_app'], enabled: true,
      createdBy: 'system', createdAt: now, updatedAt: now,
    })
    this.alertRules.set('rule-seed-cpu', {
      id: 'rule-seed-cpu', name: 'CPU 高占用',
      metric: 'cpu.usage_percent', comparator: 'gt', threshold: 80,
      durationSec: 120, severity: 'warning',
      channels: ['email'], enabled: true,
      createdBy: 'system', createdAt: now, updatedAt: now,
    })
  }
}
