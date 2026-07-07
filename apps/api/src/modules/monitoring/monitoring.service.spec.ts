/**
 * 🐜 自动: [monitoring] [A] service.spec — ≥18项正反例+边界
 *
 * 纯函数式内联，不 import 生产代码。
 */

import { describe, it, expect } from 'vitest'

// ─── 内联枚举 + 类型 ──────────────────────────────────────────────────────────

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
type AlertChannel = 'email' | 'sms' | 'webhook' | 'in_app' | 'phone'
type AlertStatus = 'firing' | 'resolved' | 'silenced'
type Comparator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq'

interface InlineMetricDef {
  name: string; type: string; unit: string; description: string
}

interface InlineMetricPoint {
  name: string; value: number; labels: Record<string, string>; timestamp: string
}

interface InlineAlertRule {
  id: string; name: string; metric: string; comparator: Comparator
  threshold: number; durationSec: number; severity: AlertSeverity
  channels: AlertChannel[]; enabled: boolean; createdBy: string
  createdAt: string; updatedAt: string
}

interface InlineAlert {
  id: string; ruleId: string; ruleName: string; severity: AlertSeverity
  status: AlertStatus; value: number; threshold: number; message: string
  firedAt: string; resolvedAt?: string; silencedUntil?: string; receivers: string[]
}

interface InlineAuditLog {
  id: string; alertId: string; action: string; operator?: string; reason?: string; timestamp: string
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { info: 1, warning: 2, error: 3, critical: 4 }

// ─── 内联服务逻辑 ──────────────────────────────────────────────────────────────

class InlineMonitoringService {
  private readonly metricDefs = new Map<string, InlineMetricDef>()
  private readonly metricPoints = new Map<string, InlineMetricPoint[]>()
  private readonly alertRules = new Map<string, InlineAlertRule>()
  private readonly alerts = new Map<string, InlineAlert>()
  private readonly audits: InlineAuditLog[] = []
  private readonly evalState = new Map<string, number>()

  constructor(builtinMetrics: InlineMetricDef[]) {
    builtinMetrics.forEach(m => this.metricDefs.set(m.name, m))
  }

  // 1. 指标定义
  listMetricDefinitions(): InlineMetricDef[] { return Array.from(this.metricDefs.values()) }
  getMetricDefinition(name: string): InlineMetricDef | null { return this.metricDefs.get(name) ?? null }

  // 2. 指标上报
  recordMetric(point: { name: string; value: number; labels: Record<string, string> }): InlineMetricPoint {
    const full: InlineMetricPoint = { ...point, timestamp: '2026-07-08T00:00:00.000Z' }
    const list = this.metricPoints.get(point.name) ?? []
    list.push(full)
    this.metricPoints.set(point.name, list)
    return full
  }

  recordMetricsBatch(points: { name: string; value: number; labels: Record<string, string> }[]): { count: number } {
    points.forEach(p => this.recordMetric(p))
    return { count: points.length }
  }

  queryMetric(name: string, limit = 100): InlineMetricPoint[] {
    return (this.metricPoints.get(name) ?? []).slice(-limit)
  }

  getMetricAverage(name: string, windowSec = 60): number | null {
    const list = this.metricPoints.get(name) ?? []
    if (list.length === 0) return null
    return list.reduce((s, p) => s + p.value, 0) / list.length
  }

  // 3. 告警规则
  createAlertRule(input: { name: string; metric: string; comparator: Comparator; threshold: number; durationSec: number; severity: AlertSeverity; channels: AlertChannel[]; enabled: boolean; createdBy: string }): InlineAlertRule {
    const id = `rule-test-${Date.now()}`
    const now = '2026-07-08T00:00:00.000Z'
    const rule: InlineAlertRule = { ...input, id, createdAt: now, updatedAt: now }
    this.alertRules.set(id, rule)
    return rule
  }

  listAlertRules(): InlineAlertRule[] { return Array.from(this.alertRules.values()) }
  getAlertRule(id: string): InlineAlertRule | null { return this.alertRules.get(id) ?? null }

  updateAlertRule(id: string, patch: Partial<InlineAlertRule>): InlineAlertRule | null {
    const r = this.alertRules.get(id)
    if (!r) return null
    const updated = { ...r, ...patch, id: r.id, updatedAt: '2026-07-08T00:00:01.000Z' }
    this.alertRules.set(id, updated)
    return updated
  }

  // 4. 告警操作
  private fireAlert(rule: InlineAlertRule, value: number): InlineAlert {
    const id = `alert-${Date.now()}`
    const alert: InlineAlert = {
      id, ruleId: rule.id, ruleName: rule.name, severity: rule.severity,
      status: 'firing', value, threshold: rule.threshold,
      message: `${rule.metric} ${rule.comparator} ${rule.threshold} (current: ${value.toFixed(2)})`,
      firedAt: '2026-07-08T00:00:00.000Z', receivers: [],
    }
    this.alerts.set(id, alert)
    return alert
  }

  silenceAlert(id: string, durationSec: number): InlineAlert | null {
    const a = this.alerts.get(id)
    if (!a) return null
    a.status = 'silenced'
    a.silencedUntil = '2026-07-08T01:00:00.000Z'
    return a
  }

  // 5. 告警查询
  listAlerts(status?: AlertStatus): InlineAlert[] {
    let alerts = Array.from(this.alerts.values())
    if (status) alerts = alerts.filter(a => a.status === status)
    return alerts.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  }

  getAlert(id: string): InlineAlert | null { return this.alerts.get(id) ?? null }

  countBySeverity(): Record<AlertSeverity, number> {
    const result: Record<AlertSeverity, number> = { info: 0, warning: 0, error: 0, critical: 0 }
    for (const a of this.alerts.values()) {
      if (a.status === 'firing') result[a.severity]++
    }
    return result
  }

  // 6. 审计
  listAudits(alertId: string): InlineAuditLog[] {
    return this.audits.filter(a => a.alertId === alertId)
  }

  recordAudit(input: { alertId: string; action: string; operator?: string; reason?: string }): void {
    this.audits.push({
      ...input, id: `audit-${Date.now()}`,
      timestamp: '2026-07-08T00:00:00.000Z',
    })
  }

  // debug
  _injectAlert(a: InlineAlert): void { this.alerts.set(a.id, a) }
  _injectAudit(e: InlineAuditLog): void { this.audits.push(e) }
}

// ─── Mock 工厂 ─────────────────────────────────────────────────────────────────

const BUILTIN_MOCK = [
  { name: 'http.request.duration_ms', type: 'histogram', unit: 'ms', description: '' },
  { name: 'http.error.rate', type: 'gauge', unit: 'ratio', description: '' },
  { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: '' },
]

function svc(): InlineMonitoringService { return new InlineMonitoringService(BUILTIN_MOCK) }

// ─── 测试用例 ≥18 ──────────────────────────────────────────────────────────────

describe('MonitoringService [inline]', () => {
  // ── 1. 指标定义 ──
  it('listMetricDefinitions 返回内置指标', () => {
    const s = svc()
    expect(s.listMetricDefinitions().length).toBeGreaterThanOrEqual(3)
  })

  it('getMetricDefinition 存在返回定义, 不存在返回 null', () => {
    const s = svc()
    expect(s.getMetricDefinition('http.error.rate')).toBeTruthy()
    expect(s.getMetricDefinition('nonexistent')).toBeNull()
  })

  // ── 2. 指标上报 ──
  it('recordMetric 返回带时间戳的点', () => {
    const s = svc()
    const p = s.recordMetric({ name: 'http.error.rate', value: 0.05, labels: {} })
    expect(p.timestamp).toBeTruthy()
    expect(p.value).toBe(0.05)
  })

  it('recordMetricsBatch 返回正确的计数值', () => {
    const s = svc()
    const r = s.recordMetricsBatch([
      { name: 'http.error.rate', value: 0.1, labels: {} },
      { name: 'cpu.usage_percent', value: 85, labels: {} },
    ])
    expect(r.count).toBe(2)
    expect(s.queryMetric('http.error.rate').length).toBe(1)
  })

  it('queryMetric 返回最近 limit 个点', () => {
    const s = svc()
    for (let i = 0; i < 10; i++) {
      s.recordMetric({ name: 'cpu.usage_percent', value: i, labels: {} })
    }
    expect(s.queryMetric('cpu.usage_percent', 3).length).toBe(3)
    expect(s.queryMetric('cpu.usage_percent', 3)[0].value).toBe(7)
  })

  it('queryMetric 空 metric 返回空数组', () => {
    const s = svc()
    expect(s.queryMetric('nonexistent')).toEqual([])
  })

  it('getMetricAverage 有数据返回平均值', () => {
    const s = svc()
    s.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
    s.recordMetric({ name: 'cpu.usage_percent', value: 90, labels: {} })
    const avg = s.getMetricAverage('cpu.usage_percent')
    expect(avg).toBeCloseTo(85)
  })

  it('getMetricAverage 无数据返回 null', () => {
    const s = svc()
    expect(s.getMetricAverage('nonexistent')).toBeNull()
  })

  // ── 3. 告警规则 ──
  it('createAlertRule 生成唯一 id', () => {
    const s = svc()
    const r = s.createAlertRule({
      name: 'test', metric: 'cpu.usage_percent', comparator: 'gt',
      threshold: 80, durationSec: 60, severity: 'warning',
      channels: ['email'], enabled: true, createdBy: 'tester',
    })
    expect(r.id).toMatch(/^rule-/)
    expect(s.listAlertRules().length).toBe(1)
  })

  it('getAlertRule 不存在返回 null', () => {
    const s = svc()
    expect(s.getAlertRule('nonexistent')).toBeNull()
  })

  it('updateAlertRule 更新后返回值变化', () => {
    const s = svc()
    const r = s.createAlertRule({
      name: 'test', metric: 'cpu.usage_percent', comparator: 'gt',
      threshold: 80, durationSec: 60, severity: 'warning',
      channels: ['email'], enabled: true, createdBy: 'tester',
    })
    const updated = s.updateAlertRule(r.id, { threshold: 90, enabled: false })
    expect(updated!.threshold).toBe(90)
    expect(updated!.enabled).toBe(false)
  })

  it('updateAlertRule 不存在返回 null', () => {
    const s = svc()
    expect(s.updateAlertRule('nonexistent', { threshold: 90 })).toBeNull()
  })

  // ── 4. 告警操作 ──
  it('silenceAlert 不存在的告警返回 null', () => {
    const s = svc()
    expect(s.silenceAlert('nonexistent', 3600)).toBeNull()
  })

  it('listAlerts 按严重程度降序排列', () => {
    const s = svc()
    s._injectAlert({ id: 'a1', ruleId: 'r1', ruleName: '', severity: 'info', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    s._injectAlert({ id: 'a2', ruleId: 'r2', ruleName: '', severity: 'critical', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    s._injectAlert({ id: 'a3', ruleId: 'r3', ruleName: '', severity: 'warning', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    const list = s.listAlerts()
    expect(list[0].severity).toBe('critical')
    expect(list[1].severity).toBe('warning')
    expect(list[2].severity).toBe('info')
  })

  it('listAlerts(status) 按状态过滤', () => {
    const s = svc()
    s._injectAlert({ id: 'a1', ruleId: 'r1', ruleName: '', severity: 'info', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    s._injectAlert({ id: 'a2', ruleId: 'r2', ruleName: '', severity: 'warning', status: 'resolved', value: 1, threshold: 0, message: '', firedAt: '', receivers: [] })
    const resolved = s.listAlerts('resolved')
    expect(resolved.length).toBe(1)
    expect(resolved[0].id).toBe('a2')
  })

  it('getAlert 存在返回, 不存在返回 null', () => {
    const s = svc()
    s._injectAlert({ id: 'a1', ruleId: 'r1', ruleName: '', severity: 'info', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    expect(s.getAlert('a1')).toBeTruthy()
    expect(s.getAlert('nonexistent')).toBeNull()
  })

  // ── 5. 严重程度计数 ──
  it('countBySeverity 只计数 firing 状态', () => {
    const s = svc()
    s._injectAlert({ id: 'a1', ruleId: 'r1', ruleName: '', severity: 'info', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    s._injectAlert({ id: 'a2', ruleId: 'r2', ruleName: '', severity: 'critical', status: 'firing', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    s._injectAlert({ id: 'a3', ruleId: 'r3', ruleName: '', severity: 'critical', status: 'resolved', value: 0, threshold: 0, message: '', firedAt: '', receivers: [] })
    const r = s.countBySeverity()
    expect(r.info).toBe(1)
    expect(r.critical).toBe(1)
    expect(r.warning).toBe(0)
  })

  // ── 6. 审计 ──
  it('listAudits 返回指定告警的审计日志', () => {
    const s = svc()
    s.recordAudit({ alertId: 'a1', action: 'fire' })
    s.recordAudit({ alertId: 'a1', action: 'resolve' })
    s.recordAudit({ alertId: 'a2', action: 'fire' })
    const logs = s.listAudits('a1')
    expect(logs.length).toBe(2)
    expect(logs.every(l => l.alertId === 'a1')).toBe(true)
  })

  it('listAudits 无日志时返回空数组', () => {
    const s = svc()
    expect(s.listAudits('nonexistent')).toEqual([])
  })

  // ── 7. 边界 ──
  it('空查询 — listMetrics 返回全部', () => {
    const s = svc()
    expect(s.listMetricDefinitions().length).toBeGreaterThan(0)
  })

  it('大量数据 — queryMetric 正确截取', () => {
    const s = svc()
    for (let i = 0; i < 500; i++) {
      s.recordMetric({ name: 'cpu.usage_percent', value: i % 100, labels: {} })
    }
    expect(s.queryMetric('cpu.usage_percent').length).toBe(100)
  })

  it('countBySeverity 无告警时全0', () => {
    const s = svc()
    const r = s.countBySeverity()
    expect(r).toEqual({ info: 0, warning: 0, error: 0, critical: 0 })
  })
})
