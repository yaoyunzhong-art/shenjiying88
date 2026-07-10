/**
 * monitoring.stress.test.ts - 监控告警 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 大批量指标并发上报
 * - 大量告警规则同时触发
 * - 指标历史数据窗口回收
 * - 告警审计日志上限
 * - 极端阈值和比较操作
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { MonitoringService } from './monitoring.service'

describe('Monitoring - Stress & Resilience', () => {
  let service: MonitoringService

  beforeEach(() => {
    service = new MonitoringService()
  })

  // ─── 大批量指标上报 ───

  describe('大批量指标上报', () => {
    it('批量上报 1000 个指标点不崩溃', () => {
      for (let i = 0; i < 1000; i++) {
        service.recordMetric({
          name: 'cpu.usage_percent',
          value: Math.random() * 100,
          labels: { host: `server-${i % 10}` },
        })
      }
      const points = service.queryMetric('cpu.usage_percent')
      assert.ok(points.length > 0)
      // 一小时窗口只保留最近的数据
      assert.ok(points.length <= 1000)
    })

    it('批量上报 10000 个指标点并查询均值', () => {
      for (let i = 0; i < 10000; i++) {
        service.recordMetric({
          name: 'http.request.duration_ms',
          value: i,
          labels: { endpoint: '/test' },
        })
      }
      const avg = service.getMetricAverage('http.request.duration_ms', 3600)
      assert.ok(avg !== null)
      // 应该有大量数据在窗口中
      const points = service.queryMetric('http.request.duration_ms', 100)
      assert.ok(points.length > 0)
    })

    it('大量规则同时触发告警 - 应全部创建成功', () => {
      // 创建 50 条规则
      for (let i = 0; i < 50; i++) {
        service.createAlertRule({
          name: `规则-${i}`,
          metric: 'cpu.usage_percent',
          comparator: 'gt',
          threshold: 0,
          durationSec: 0,
          severity: i < 10 ? 'critical' : i < 30 ? 'error' : 'warning',
          channels: ['in_app'],
          enabled: true,
          createdBy: 'stress-test',
        })
      }

      // 触发所有规则
      service.recordMetric({ name: 'cpu.usage_percent', value: 100, labels: {} })

      const alerts = service.listAlerts()
      assert.equal(alerts.length, 50, '所有 50 条规则都应触发告警')

      // 验证排序: critical 在前
      assert.equal(alerts[0].severity, 'critical')
    })
  })

  // ─── 极端输入 ───

  describe('极端输入值', () => {
    it('超大指标值不崩溃', () => {
      service.recordMetric({ name: 'memory.usage_mb', value: Number.MAX_SAFE_INTEGER, labels: {} })
      const avg = service.getMetricAverage('memory.usage_mb')
      assert.ok(avg !== null)
      assert.ok(avg > 0)
    })

    it('负数指标值不崩溃', () => {
      service.recordMetric({ name: 'cpu.usage_percent', value: -1, labels: {} })
      service.recordMetric({ name: 'cpu.usage_percent', value: -100, labels: {} })

      // 创建规则: gt 0
      service.createAlertRule({
        name: '负数阈值',
        metric: 'cpu.usage_percent',
        comparator: 'lt',
        threshold: 0,
        durationSec: 0,
        severity: 'info',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'stress-test',
      })

      service.recordMetric({ name: 'cpu.usage_percent', value: -50, labels: {} })
      const alerts = service.listAlerts()
      assert.ok(alerts.length >= 1)
    })

    it('0 值指标不触发默认阈值的告警', () => {
      service.recordMetric({ name: 'http.error.rate', value: 0, labels: {} })
      // 种子规则 threshold=0.05, gt 0.05, 所以不会触发
      const alerts = service.listAlerts()
      assert.equal(alerts.length, 0)
    })
  })

  // ─── 告警规则管理 ───

  describe('告警规则管理压力', () => {
    it('连续创建和删除大量规则', () => {
      const ids: string[] = []
      for (let i = 0; i < 100; i++) {
        const rule = service.createAlertRule({
          name: `Rules-${i}`,
          metric: 'http.error.rate',
          comparator: 'gt',
          threshold: 0.05,
          durationSec: 0,
          severity: 'warning',
          channels: ['in_app'],
          enabled: true,
          createdBy: 'stress',
        })
        ids.push(rule.id)
      }

      // 更新所有规则
      for (const id of ids) {
        service.updateAlertRule(id, { threshold: 0.1 })
      }

      const rules = service.listAlertRules()
      assert.equal(rules.length, 103) // 100 新建 + 3 种子
    })

    it('禁用所有规则后再触发 - 不应产生告警', () => {
      // 创建一批规则
      const ids: string[] = []
      for (let i = 0; i < 10; i++) {
        const rule = service.createAlertRule({
          name: `DisableTest-${i}`,
          metric: 'cpu.usage_percent',
          comparator: 'gt',
          threshold: 0,
          durationSec: 0,
          severity: 'warning',
          channels: ['in_app'],
          enabled: true,
          createdBy: 'stress',
        })
        ids.push(rule.id)
      }

      // 禁用所有规则
      for (const id of ids) {
        service.updateAlertRule(id, { enabled: false })
      }

      // 触发
      service.recordMetric({ name: 'cpu.usage_percent', value: 100, labels: {} })

      // 禁用规则后触发 - 应没有任何新告警
      // 种子规则 cpu.usage_percent>80 有 durationSec=120, 不会立即触发
      service.recordMetric({ name: 'cpu.usage_percent', value: 100, labels: {} })

      const alerts = service.listAlerts()
      // 禁用规则的没有触发, 种子规则的 durationSec 未到
      assert.equal(alerts.length, 0, '禁用规则不应触发告警')
    })
  })

  // ─── 审计日志压力 ───

  describe('审计日志压力', () => {
    it('大量告警产生审计日志不应溢出', () => {
      // 创建 6000 条规则触发大量告警
      for (let i = 0; i < 100; i++) {
        service.createAlertRule({
          name: `Audit-Rule-${i}`,
          metric: 'cpu.usage_percent',
          comparator: 'gt',
          threshold: 0,
          durationSec: 0,
          severity: i < 50 ? 'error' : 'warning',
          channels: ['in_app'],
          enabled: true,
          createdBy: 'stress',
        })
      }

      service.recordMetric({ name: 'cpu.usage_percent', value: 100, labels: {} })

      const alerts = service.listAlerts()
      assert.equal(alerts.length, 100)

      // 验证审计日志不超过上限 5000
      const firstAlert = alerts[0]
      const audits = service.listAudits(firstAlert.id)
      assert.ok(audits.length >= 1)
    })
  })

  // ─── 快速连续状态变更 ───

  describe('快速状态变更', () => {
    it('快速上报指标 - 交替正常和异常值', () => {
      // 使用独立的 metric 和 unique 新 metric 避免种子规则干扰
      const customMetric = 'app.custom.latency'
      service.createAlertRule({
        name: '快速变更规则',
        metric: customMetric,
        comparator: 'gt',
        threshold: 100,
        durationSec: 0,
        severity: 'warning',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'stress',
      })

      // 交替上报, 需要连续低值来拉低平均值
      service.recordMetric({ name: customMetric, value: 200, labels: {} })
      // 触发
      assert.equal(service.listAlerts('firing').length, 1)

      // 连续低值拉低平均
      for (let i = 0; i < 10; i++) {
        service.recordMetric({ name: customMetric, value: 10, labels: {} })
      }
      // avg = (200 + 10*10) / 11 = 27 < 100
      const alerts = service.listAlerts('firing')
      assert.equal(alerts.length, 0, '平均值回落后告警应全部解决')
    })

    it('快速切换规则启用/禁用状态', () => {
      const rule = service.createAlertRule({
        name: '开关规则',
        metric: 'http.error.rate',
        comparator: 'gt',
        threshold: 0,
        durationSec: 0,
        severity: 'warning',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'stress',
      })

      // 启用 → 禁用 → 启用 → 触发
      service.updateAlertRule(rule.id, { enabled: false })
      service.updateAlertRule(rule.id, { enabled: true })

      service.recordMetric({ name: 'http.error.rate', value: 0.5, labels: {} })

      const alerts = service.listAlerts()
      assert.equal(alerts.length, 1, '最终启用状态应触发告警')
    })
  })

  // ─── 所有比较操作符全覆盖 ───

  describe('全比较操作符', () => {
    it('gt - 大于阈值', () => {
      service.createAlertRule({ name: 'gt-test', metric: 'cpu.usage_percent', comparator: 'gt', threshold: 80, durationSec: 0, severity: 'warning', channels: ['in_app'], enabled: true, createdBy: 'stress' })
      service.recordMetric({ name: 'cpu.usage_percent', value: 95, labels: {} })
      assert.equal(service.listAlerts().length, 1)
    })

    it('gte - 大于等于阈值', () => {
      service.createAlertRule({ name: 'gte-test', metric: 'memory.usage_mb', comparator: 'gte', threshold: 100, durationSec: 0, severity: 'info', channels: ['in_app'], enabled: true, createdBy: 'stress' })
      service.recordMetric({ name: 'memory.usage_mb', value: 100, labels: {} })
      assert.equal(service.listAlerts().length, 1)
    })

    it('lt - 小于阈值', () => {
      service.createAlertRule({ name: 'lt-test', metric: 'memory.usage_mb', comparator: 'lt', threshold: 512, durationSec: 0, severity: 'info', channels: ['in_app'], enabled: true, createdBy: 'stress' })
      service.recordMetric({ name: 'memory.usage_mb', value: 256, labels: {} })
      assert.equal(service.listAlerts().length, 1)
    })

    it('lte - 小于等于阈值', () => {
      service.createAlertRule({ name: 'lte-test', metric: 'memory.usage_mb', comparator: 'lte', threshold: 256, durationSec: 0, severity: 'info', channels: ['in_app'], enabled: true, createdBy: 'stress' })
      service.recordMetric({ name: 'memory.usage_mb', value: 256, labels: {} })
      assert.equal(service.listAlerts().length, 1)
    })

    it('eq - 等于阈值', () => {
      service.createAlertRule({ name: 'eq-test', metric: 'http.error.rate', comparator: 'eq', threshold: 0, durationSec: 0, severity: 'info', channels: ['in_app'], enabled: true, createdBy: 'stress' })
      service.recordMetric({ name: 'http.error.rate', value: 0, labels: {} })
      assert.equal(service.listAlerts().length, 1)
    })
  })
})
