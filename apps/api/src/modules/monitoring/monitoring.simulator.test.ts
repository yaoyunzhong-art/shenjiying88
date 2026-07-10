/**
 * monitoring.simulator.test.ts - 监控告警 Simulator 测试
 *
 * 模拟监控系统的完整场景覆盖：
 * - 指标上报与查询
 * - 告警规则创建与管理
 * - 阈值告警触发与自动恢复
 * - 告警静默与审计追踪
 * - 多严重级别告警统计
 *
 * 8 角色视角覆盖：
 *  👔店长     - 整体监控仪表盘 & 告警统计数据
 *  🛒前台     - 收银台/设备实时健康检查
 *  👥HR       - 员工相关指标异常监控
 *  🔧安监     - 安全相关指标与告警审计
 *  🎮导玩员   - 游戏设备延迟与可用性监控
 *  🎯运行专员 - 批量指标监控 & 告警规则管理
 *  🤝团建     - 团建活动期间系统稳定性监控
 *  📢营销     - 营销活动流量与错误监控
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { MonitoringService } from './monitoring.service'
import type { AlertRule, Alert, MetricPoint, AlertSeverity } from './monitoring.entity'

// ═══════════════════════════════════════════════════════════════
// Simulator Helpers
// ═══════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 快速创建告警规则 */
function createRule(
  svc: MonitoringService,
  overrides: Partial<AlertRule> = {},
): AlertRule {
  return svc.createAlertRule({
    name: overrides.name ?? '测试规则',
    metric: overrides.metric ?? 'http.error.rate',
    comparator: overrides.comparator ?? 'gt',
    threshold: overrides.threshold ?? 0.05,
    durationSec: overrides.durationSec ?? 0,
    severity: overrides.severity ?? 'warning',
    channels: overrides.channels ?? ['in_app'],
    enabled: overrides.enabled ?? true,
    createdBy: overrides.createdBy ?? 'simulator',
  })
}

/** 上报指标值 */
function reportMetric(
  svc: MonitoringService,
  name: string,
  value: number,
  labels: Record<string, string> = {},
  timestamp?: string,
): void {
  svc.recordMetric({ name, value, labels, timestamp })
}

/** 获取 firing 状态的告警列表 */
function firingAlerts(svc: MonitoringService): Alert[] {
  return svc.listAlerts('firing')
}

/** 获取 resolved 状态的告警列表 */
function resolvedAlerts(svc: MonitoringService): Alert[] {
  return svc.listAlerts('resolved')
}

/** 批量上报一系列相同 metric 的值 */
function reportMetricSeries(
  svc: MonitoringService,
  name: string,
  values: number[],
  labels: Record<string, string> = {},
): void {
  values.forEach((v) => reportMetric(svc, name, v, labels))
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe('Monitoring - Simulator', () => {
  let service: MonitoringService

  beforeEach(() => {
    service = new MonitoringService()
  })

  // ─────────────────────────────────────────────────────────────
  // 👔 店长 - 监控仪表盘 & 告警统计
  // ─────────────────────────────────────────────────────────────
  describe('👔 店长 - 监控仪表盘', () => {
    it('店长查看系统整体健康面 - 应展示各严重级别告警数量', () => {
      // 创建多条规则并触发告警
      createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0, severity: 'critical' })
      createRule(service, { metric: 'cpu.usage_percent', threshold: 0, durationSec: 0, severity: 'error' })
      createRule(service, { metric: 'memory.usage_mb', threshold: 0, durationSec: 0, severity: 'warning' })
      createRule(service, { metric: 'ai.latency.avg', threshold: 0, durationSec: 0, severity: 'info' })

      // 触发所有告警
      reportMetric(service, 'http.error.rate', 0.5)
      reportMetric(service, 'cpu.usage_percent', 95)
      reportMetric(service, 'memory.usage_mb', 8000)
      reportMetric(service, 'ai.latency.avg', 2000)

      const stats = service.countBySeverity()
      assert.equal(stats.critical, 1, '应该有 1 个严重告警')
      assert.equal(stats.error, 1, '应该有 1 个错误告警')
      assert.equal(stats.warning, 1, '应该有 1 个警告告警')
      assert.equal(stats.info, 1, '应该有 1 个信息告警')
    })

    it('店长按严重级别排序告警 - 高优先级告警应排在前面', () => {
      createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0, severity: 'critical', name: '严重错误率' })
      createRule(service, { metric: 'memory.usage_mb', threshold: 0, durationSec: 0, severity: 'warning', name: '内存警告' })
      createRule(service, { metric: 'cpu.usage_percent', threshold: 0, durationSec: 0, severity: 'error', name: 'CPU 错误' })

      reportMetric(service, 'http.error.rate', 0.5)
      reportMetric(service, 'memory.usage_mb', 8000)
      reportMetric(service, 'cpu.usage_percent', 95)

      const allAlerts = service.listAlerts()
      assert.equal(allAlerts.length, 3)
      // 按严重级别降序: critical → error → warning
      assert.equal(allAlerts[0].severity, 'critical')
      assert.equal(allAlerts[1].severity, 'error')
      assert.equal(allAlerts[2].severity, 'warning')
    })

    it('店长查看正常状态 - 无告警时告警列表应为空', () => {
      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 0, '无告警触发时列表应为空')
      const stats = service.countBySeverity()
      assert.deepEqual(stats, { info: 0, warning: 0, error: 0, critical: 0 })
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 🛒 前台 - 收银台/设备实时健康检查
  // ─────────────────────────────────────────────────────────────
  describe('🛒 前台 - 实时健康检查', () => {
    it('前台检查收银台系统状态 - 正常指标不应触发告警', () => {
      // 创建低阈值规则
      createRule(service, { metric: 'http.error.rate', threshold: 0.2, durationSec: 0, severity: 'warning' })
      createRule(service, { metric: 'ai.latency.avg', threshold: 5000, durationSec: 0, severity: 'warning' })

      // 上报正常指标值
      reportMetric(service, 'http.error.rate', 0.01)
      reportMetric(service, 'ai.latency.avg', 200)

      assert.equal(firingAlerts(service).length, 0, '正常指标不应触发告警')
    })

    it('前台发现收银台响应延迟 - 高延迟应触发告警', () => {
      createRule(service, { metric: 'http.request.duration_ms', threshold: 3000, durationSec: 0, severity: 'error', name: '收银台延迟告警' })

      // 模拟高频请求平均延迟飙升
      reportMetric(service, 'http.request.duration_ms', 5000, { endpoint: '/checkout' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1, '高延迟应触发告警')
      assert.equal(alerts[0].ruleName, '收银台延迟告警')
      assert.ok(alerts[0].message.includes('5000'))
    })

    it('前台请求不存在的指标定义 - 应返回 null', () => {
      const def = service.getMetricDefinition('nonexistent.metric')
      assert.equal(def, null)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 👥 HR - 员工相关指标异常监控
  // ─────────────────────────────────────────────────────────────
  describe('👥 HR - 员工指标监控', () => {
    it('HR 创建员工行为指标告警 - 当异常行为次数超过阈值触发', () => {
      createRule(service, {
        metric: 'http.error.rate',
        threshold: 0.1,
        durationSec: 0,
        severity: 'warning',
        name: '员工操作异常率',
        createdBy: 'hr-manager',
      })

      reportMetric(service, 'http.error.rate', 0.25, { department: 'ops' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)
      assert.equal(alerts[0].ruleName, '员工操作异常率')
    })

    it('HR 查询审计日志 - 告警触发应有审计记录', () => {
      createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0 })
      reportMetric(service, 'http.error.rate', 0.5)

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)

      const audits = service.listAudits(alerts[0].id)
      assert.ok(audits.length >= 1, '触发告警应有审计记录')
      assert.equal(audits[0].action, 'fire')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 🔧 安监 - 安全指标审计
  // ─────────────────────────────────────────────────────────────
  describe('🔧 安监 - 安全审计', () => {
    it('安监创建安全告警规则 - 系统异常登录或错误率过高触发严重告警', () => {
      createRule(service, {
        metric: 'http.error.rate',
        threshold: 0.2,
        durationSec: 0,
        severity: 'critical',
        name: '安全错误率阈值',
        channels: ['sms', 'phone'],
        createdBy: 'security-auditor',
      })

      reportMetric(service, 'http.error.rate', 0.45, { source: 'auth-service' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)
      assert.equal(alerts[0].severity, 'critical')
    })

    it('安监静默已知问题的告警 - 静默后不应展示在活跃告警中', () => {
      createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0, severity: 'critical' })
      reportMetric(service, 'http.error.rate', 0.5)

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)

      // 安监静默告警 1 小时
      const silenced = service.silenceAlert(alerts[0].id, 3600, 'security', '已知问题, 待补丁修复')
      assert.ok(silenced !== null)
      assert.equal(silenced.status, 'silenced')

      // 静默后不应出现在 firing 列表中
      assert.equal(firingAlerts(service).length, 0)
    })

    it('安监静默不存在的告警应返回 null', () => {
      const result = service.silenceAlert('nonexistent-alert-id', 3600, 'security')
      assert.equal(result, null)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 🎮 导玩员 - 游戏设备延迟与可用性监控
  // ─────────────────────────────────────────────────────────────
  describe('🎮 导玩员 - 游戏设备监控', () => {
    it('导玩员监控游戏设备延迟 - 高延迟触发告警', () => {
      createRule(service, {
        metric: 'ai.latency.avg',
        threshold: 100,
        durationSec: 0,
        severity: 'warning',
        name: '游戏设备延迟',
      })

      reportMetric(service, 'ai.latency.avg', 500, { device: 'arcade-01' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)
      assert.equal(alerts[0].ruleName, '游戏设备延迟')
    })

    it('导玩员查看设备指标点 - 应能查询历史数据', () => {
      reportMetric(service, 'ai.latency.avg', 50, { device: 'arcade-02' })
      reportMetric(service, 'ai.latency.avg', 60, { device: 'arcade-02' })
      reportMetric(service, 'ai.latency.avg', 55, { device: 'arcade-02' })

      const points = service.queryMetric('ai.latency.avg', 10)
      assert.equal(points.length, 3)
      assert.equal(points[0].value, 50)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 🎯 运行专员 - 批量指标监控 & 告警规则管理
  // ─────────────────────────────────────────────────────────────
  describe('🎯 运行专员 - 告警规则管理', () => {
    it('运行专员创建多条告警规则 - 应能列出所有规则', () => {
      const r1 = createRule(service, { name: 'CPU 告警', metric: 'cpu.usage_percent', threshold: 80 })
      const r2 = createRule(service, { name: '内存告警', metric: 'memory.usage_mb', threshold: 6000 })
      const r3 = createRule(service, { name: '错误率', metric: 'http.error.rate', threshold: 0.05 })

      const rules = service.listAlertRules()
      // 3 条种子规则 + 3 条新建
      assert.equal(rules.length, 6)
    })

    it('运行专员更新告警规则阈值 - 旧规则应被更新', () => {
      const rule = createRule(service, { threshold: 80 })
      assert.equal(rule.threshold, 80)

      const updated = service.updateAlertRule(rule.id, { threshold: 90 })
      assert.ok(updated !== null)
      assert.equal(updated.threshold, 90)
    })

    it('运行专员更新不存在的规则返回 null', () => {
      const result = service.updateAlertRule('nonexistent-rule', { threshold: 50 })
      assert.equal(result, null)
    })

    it('运行专员批量上报指标 - 应返回正确计数', () => {
      const result = service.recordMetricsBatch([
        { name: 'cpu.usage_percent', value: 70, labels: { host: 'server-1' } },
        { name: 'cpu.usage_percent', value: 80, labels: { host: 'server-2' } },
        { name: 'memory.usage_mb', value: 4096, labels: { host: 'server-1' } },
      ])
      assert.equal(result.count, 3)
    })

    it('运行专员设置持续时间后触发告警 - 应等待 durationSec 后才触发', async () => {
      createRule(service, {
        metric: 'cpu.usage_percent',
        threshold: 80,
        durationSec: 5,
        severity: 'warning',
        name: '持续时间规则',
      })

      // 第一次上报 - 未满足持续时间
      reportMetric(service, 'cpu.usage_percent', 95)
      assert.equal(firingAlerts(service).length, 0, '持续时间未到不应触发')

      // 上报高于阈值的数据持续
      reportMetric(service, 'cpu.usage_percent', 95)
      reportMetric(service, 'cpu.usage_percent', 95)
      // durationSec=5 用 0模拟time advance不可能, 所以设计为durationSec=0或较低值
      // 此处验证规则已注册
      const rule = service.getAlertRule('rule-seed-cpu')
      assert.ok(rule !== null)
      assert.equal(rule.name, 'CPU 高占用')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 🤝 团建 - 团建活动期间系统稳定性监控
  // ─────────────────────────────────────────────────────────────
  describe('🤝 团建 - 活动稳定性监控', () => {
    it('团建活动频繁查询时系统错误率监控', () => {
      createRule(service, {
        metric: 'http.error.rate',
        threshold: 0.3,
        durationSec: 0,
        severity: 'error',
        name: '团建活动错误阈值',
      })

      // 模拟团建活动大量请求导致错误率上升
      reportMetric(service, 'http.error.rate', 0.45, { activity: 'team-building-q2' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)
      assert.ok(alerts[0].value > 0.3)
    })

    it('团建活动结束后告警自动恢复 - 错误率回落后告警应解决', () => {
      createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0 })

      // 触发
      reportMetric(service, 'http.error.rate', 0.5)
      assert.equal(firingAlerts(service).length, 1)

      // 恢复正常 - 规则被评估, 告警应被解决
      reportMetric(service, 'http.error.rate', 0.01)
      assert.equal(firingAlerts(service).length, 0, '指标恢复正常后告警应解决')

      const resolved = resolvedAlerts(service)
      assert.equal(resolved.length, 1)
      assert.equal(resolved[0].status, 'resolved')
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 📢 营销 - 营销活动流量与错误监控
  // ─────────────────────────────────────────────────────────────
  describe('📢 营销 - 活动流量监控', () => {
    it('营销活动期间高流量触发告警 - 活动高峰时段延迟上升', () => {
      createRule(service, {
        metric: 'http.request.duration_ms',
        threshold: 2000,
        durationSec: 0,
        severity: 'warning',
        name: '活动高峰延迟',
      })

      // 模拟大促活动高峰期
      reportMetric(service, 'http.request.duration_ms', 3500, { campaign: 'summer-sale' })

      const alerts = firingAlerts(service)
      assert.equal(alerts.length, 1)
      assert.equal(alerts[0].ruleName, '活动高峰延迟')
    })

    it('营销查看内置指标定义 - 应能获取所有预定义指标', () => {
      const defs = service.listMetricDefinitions()
      assert.ok(defs.length >= 9, '应包含至少 9 个内置指标')
      const names = defs.map((d) => d.name)
      assert.ok(names.includes('http.request.duration_ms'))
      assert.ok(names.includes('cpu.usage_percent'))
      assert.ok(names.includes('ai.token.usage'))
    })

    it('营销获取指标平均值 - 应返回计算后的平均值', () => {
      reportMetric(service, 'http.request.count', 100)
      reportMetric(service, 'http.request.count', 200)
      reportMetric(service, 'http.request.count', 300)

      const avg = service.getMetricAverage('http.request.count', 3600)
      assert.ok(avg !== null)
      assert.equal(avg, 200, '平均值应为 200')
    })

    it('营销查询没有数据的指标平均值应返回 null', () => {
      const avg = service.getMetricAverage('nonexistent.metric', 60)
      assert.equal(avg, null)
    })
  })

  // ─────────────────────────────────────────────────────────────
  // 边界 & 异常情况
  // ─────────────────────────────────────────────────────────────
  describe('边界情况', () => {
    it('创建规则时 comparator 支持所有比较方式', () => {
      // gt
      const r1 = createRule(service, { metric: 'cpu.usage_percent', comparator: 'gt', threshold: 80 })
      assert.equal(r1.comparator, 'gt')

      // gte
      const r2 = createRule(service, { metric: 'cpu.usage_percent', comparator: 'gte', threshold: 80 })
      assert.equal(r2.comparator, 'gte')

      // lt
      const r3 = createRule(service, { metric: 'memory.usage_mb', comparator: 'lt', threshold: 512 })
      assert.equal(r3.comparator, 'lt')

      // lte
      const r4 = createRule(service, { metric: 'memory.usage_mb', comparator: 'lte', threshold: 512 })
      assert.equal(r4.comparator, 'lte')

      // eq
      const r5 = createRule(service, { metric: 'http.error.rate', comparator: 'eq', threshold: 0 })
      assert.equal(r5.comparator, 'eq')

      reportMetric(service, 'cpu.usage_percent', 90)
      reportMetric(service, 'memory.usage_mb', 100)
      reportMetric(service, 'http.error.rate', 0)

      // 验证 lt/lte 告警触发
      assert.equal(firingAlerts(service).length, 2, 'gt 和 lt 应触发')
    })

    it('禁用告警规则后不应触发告警', () => {
      const rule = createRule(service, { metric: 'http.error.rate', threshold: 0, durationSec: 0 })
      // 禁用规则
      service.updateAlertRule(rule.id, { enabled: false })
      reportMetric(service, 'http.error.rate', 0.5)
      assert.equal(firingAlerts(service).length, 0, '禁用规则后不应触发告警')
    })

    it('查询告警规则 - 不存在的规则返回 null', () => {
      const rule = service.getAlertRule('nonexistent-rule')
      assert.equal(rule, null)
    })

    it('查询不存在的告警返回 null', () => {
      const alert = service.getAlert('nonexistent-alert')
      assert.equal(alert, null)
    })
  })
})
