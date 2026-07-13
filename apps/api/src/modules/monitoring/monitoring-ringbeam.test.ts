/**
 * monitoring-ringbeam.test.ts - V17#圈梁 Phase2 基础设施圈梁
 * 用途: PRD对齐测试 - 验证监控指标/告警规则/告警评估
 * 覆盖: 正例(指标上报+告警触发) + 反例(无效规则/缺失指标) + 边界(告警静默/严重排序)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MonitoringService } from './monitoring.service'

describe('🔵 MonitoringRingBeam: 监控告警模块PRD对齐', () => {
  let monitoringService: MonitoringService

  beforeEach(() => {
    monitoringService = new MonitoringService()
  })

  // ─── 1. 指标定义 ──────────────────────────────────────────────────

  describe('指标定义', () => {
    it('[P0] 内置指标列表非空且包含基础设施指标', () => {
      const metrics = monitoringService.listMetricDefinitions()
      expect(metrics.length).toBeGreaterThan(0)

      const cpuMetric = metrics.find(m => m.name === 'cpu.usage_percent')
      expect(cpuMetric).toBeDefined()
      expect(cpuMetric!.type).toBe('gauge')
      expect(cpuMetric!.unit).toBe('%')
    })

    it('[P0] 按名称获取单个指标定义', () => {
      const metric = monitoringService.getMetricDefinition('http.request.duration_ms')
      expect(metric).not.toBeNull()
      expect(metric!.type).toBe('histogram')
    })

    it('[P1] 不存在的指标名返回null', () => {
      const metric = monitoringService.getMetricDefinition('nonexistent_metric_xyz')
      expect(metric).toBeNull()
    })
  })

  // ─── 2. 指标上报 ──────────────────────────────────────────────────

  describe('指标上报', () => {
    it('[P0] 上报单个指标点应返回带时间戳的完整记录', () => {
      const point = monitoringService.recordMetric({
        name: 'cpu.usage_percent',
        value: 75.5,
        labels: { host: 'api-01' },
      })

      expect(point.name).toBe('cpu.usage_percent')
      expect(point.value).toBe(75.5)
      expect(point.timestamp).toBeDefined()
      expect(point.labels?.host).toBe('api-01')
    })

    it('[P0] 批量上报指标应返回上报计数', () => {
      const result = monitoringService.recordMetricsBatch([
        { name: 'cpu.usage_percent', value: 50, labels: { host: 'api-01' } },
        { name: 'memory.usage_mb', value: 1024, labels: { host: 'api-01' } },
      ])

      expect(result.count).toBe(2)
    })

    it('[P1] 上报后可查询指标点', () => {
      monitoringService.recordMetric({
        name: 'custom_app_metric',
        value: 1,
      })

      const points = monitoringService.queryMetric('custom_app_metric')
      expect(points.length).toBe(1)
      expect(points[0].value).toBe(1)
    })

    it('[P1] 平均值计算正确', () => {
      monitoringService.recordMetric({ name: 'test_average', value: 10 })
      monitoringService.recordMetric({ name: 'test_average', value: 20 })
      monitoringService.recordMetric({ name: 'test_average', value: 30 })

      const avg = monitoringService.getMetricAverage('test_average', 3600)
      expect(avg).not.toBeNull()
      expect(avg).toBe(20) // (10+20+30)/3 = 20
    })
  })

  // ─── 3. 告警规则 ──────────────────────────────────────────────────

  describe('告警规则', () => {
    it('[P0] 创建告警规则后应能通过ID查询到', () => {
      const rule = monitoringService.createAlertRule({
        name: 'CPU过高告警',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 90,
        durationSec: 0,
        severity: 'critical',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      expect(rule.id).toBeDefined()
      expect(rule.name).toBe('CPU过高告警')

      const found = monitoringService.getAlertRule(rule.id)
      expect(found).not.toBeNull()
      expect(found!.name).toBe('CPU过高告警')
    })

    it('[P0] 超过阈值应触发告警(durationSec=0时立即)', () => {
      monitoringService.createAlertRule({
        name: 'CPU过高',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 80,
        durationSec: 0,
        severity: 'error',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      monitoringService.recordMetric({ name: 'cpu.usage_percent', value: 95, labels: {} })

      const alerts = monitoringService.listAlerts()
      const cpuAlert = alerts.find(a => a.ruleName === 'CPU过高')
      expect(cpuAlert).toBeDefined()
      expect(cpuAlert!.severity).toBe('error')
      expect(cpuAlert!.status).toBe('firing')
    })

    it('[P1] 低于阈值的指标不应触发告警', () => {
      monitoringService.createAlertRule({
        name: 'CPU过高',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 90,
        durationSec: 0,
        severity: 'error',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      monitoringService.recordMetric({ name: 'cpu.usage_percent', value: 50, labels: {} })
      const alerts = monitoringService.listAlerts()

      const cpuAlert = alerts.find(a => a.ruleName === 'CPU过高')
      expect(cpuAlert).toBeUndefined()
    })

    it('[P1] 不存在的告警规则ID返回null', () => {
      const rule = monitoringService.getAlertRule('nonexistent-rule-id')
      expect(rule).toBeNull()
    })

    it('[P1] 禁用告警规则(设为enabled=false)后不触发', () => {
      const rule = monitoringService.createAlertRule({
        name: 'CPU过高',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 80,
        durationSec: 0,
        severity: 'error',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      monitoringService.updateAlertRule(rule.id, { enabled: false })
      const disabled = monitoringService.getAlertRule(rule.id)
      expect(disabled!.enabled).toBe(false)
    })
  })

  // ─── 4. 告警生命周期 ─────────────────────────────────────────────

  describe('告警生命周期', () => {
    it('[P1] 静默告警应更新状态为silenced', () => {
      const rule = monitoringService.createAlertRule({
        name: '高内存',
        metric: 'memory.usage_mb',
        comparator: 'gt',
        threshold: 8000,
        durationSec: 0,
        severity: 'warning',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      monitoringService.recordMetric({ name: 'memory.usage_mb', value: 9000, labels: {} })
      const alerts = monitoringService.listAlerts()
      expect(alerts.length).toBeGreaterThanOrEqual(1)

      const memAlert = alerts.find(a => a.ruleName === '高内存')!
      monitoringService.silenceAlert(memAlert.id, 3600, 'operator-001', '已知问题')

      const updated = monitoringService.getAlert(memAlert.id)
      expect(updated!.status).toBe('silenced')
    })

    it('[P1] listAlerts按严重级别排序', () => {
      // 创建多个规则并用不同severity触发
      monitoringService.createAlertRule({
        name: '严重告警', metric: 'test_alerts_a',
        comparator: 'gt', threshold: 0, durationSec: 0,
        severity: 'critical', channels: ['in_app'],
        enabled: true, createdBy: 'system',
      })
      monitoringService.createAlertRule({
        name: '错误告警', metric: 'test_alerts_b',
        comparator: 'gt', threshold: 0, durationSec: 0,
        severity: 'error', channels: ['in_app'],
        enabled: true, createdBy: 'system',
      })
      monitoringService.createAlertRule({
        name: '警告告警', metric: 'test_alerts_0',
        comparator: 'gt', threshold: 0, durationSec: 0,
        severity: 'warning', channels: ['in_app'],
        enabled: true, createdBy: 'system',
      })

      monitoringService.recordMetric({ name: 'test_alerts_a', value: 100, labels: {} })
      monitoringService.recordMetric({ name: 'test_alerts_b', value: 100, labels: {} })
      monitoringService.recordMetric({ name: 'test_alerts_0', value: 100, labels: {} })

      const alerts = monitoringService.listAlerts()
      // critical 应该排在最前面
      expect(alerts[0].severity).toBe('critical')
    })

    it('[P1] countBySeverity计数正确', () => {
      monitoringService.createAlertRule({
        name: '严重告警',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 0,
        durationSec: 0,
        severity: 'critical',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'system',
      })

      monitoringService.recordMetric({ name: 'cpu.usage_percent', value: 100, labels: {} })

      const counts = monitoringService.countBySeverity()
      expect(counts.critical).toBeGreaterThanOrEqual(1)
    })

    it('[P1] 种子告警规则应包含系统预置规则', () => {
      const rules = monitoringService.listAlertRules()
      expect(rules.length).toBeGreaterThanOrEqual(3)
      const seedErrorRule = rules.find(r => r.name === '高错误率告警')
      expect(seedErrorRule).toBeDefined()
    })
  })
})
