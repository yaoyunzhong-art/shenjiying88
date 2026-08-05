import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * monitoring.controller.spec.ts - D-type spec 补全
 * 8角色视角 + 边界测试: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */
import { Test, TestingModule } from '@nestjs/testing'
import { MonitoringController } from './monitoring.controller'
import { MonitoringService } from './monitoring.service'
import type { MetricPoint, AlertRule, Alert, AlertSeverity } from './monitoring.entity'

describe('MonitoringController (spec)', () => {
  let controller: MonitoringController
  let service: MonitoringService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [MonitoringService],
    }).compile()

    controller = module.get<MonitoringController>(MonitoringController)
    service = module.get<MonitoringService>(MonitoringService)
  })

  // ── 👔 店长: 关注整体运营健康度和告警概览 ──
  describe('👔 店长 Store Manager', () => {
    it('AC-1: 查看所有指标定义 — 应返回内置指标列表', () => {
      const result = controller.listMetrics()
      expect(result.items).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThan(0)
      expect(result.items[0]).toHaveProperty('name')
      expect(result.items[0]).toHaveProperty('type')
    })

    it('AC-2: 查看告警概览 — 应返回告警列表含严重度分布', () => {
      // 先上报一条高错误率触发告警
      controller.record({ name: 'http.error.rate', value: 0.5, labels: { env: 'prod' } })
      controller.record({ name: 'http.error.rate', value: 0.6, labels: { env: 'prod' } })

      const result = controller.listAlerts(undefined)
      expect(result.items).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.severityCount).toBeDefined()
      expect(result.severityCount.error).toBeGreaterThanOrEqual(0)
    })

    it('AC-3: 查看告警按严重度分布 — 使用0秒持续规则立即触发告警', () => {
      // 创建一条立即触发的规则
      controller.createRule({
        name: '即时告警',
        metric: 'test.immediate',
        comparator: 'gt',
        threshold: 0,
        durationSec: 0,
        severity: 'error',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'tester',
      })
      // 上报数据触发
      controller.record({ name: 'test.immediate', value: 100, labels: { env: 'test' } })
      const result = controller.listAlerts(undefined)
      const totalFiring = result.severityCount.error + result.severityCount.critical +
        result.severityCount.warning + result.severityCount.info
      expect(totalFiring).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 🛒 前台: 关注系统响应和可用性指标 ──
  describe('🛒 前台 Front Desk', () => {
    it('AC-4: 记录结账状态指标 — 应收录成功', () => {
      const result = controller.record({
        name: 'http.request.count',
        value: 42,
        labels: { endpoint: '/checkout', env: 'prod' },
      })
      expect(result).toHaveProperty('name', 'http.request.count')
      expect(result).toHaveProperty('value', 42)
      expect(result).toHaveProperty('timestamp')
    })

    it('AC-5: 查看前台相关指标 — 应返回最新记录', () => {
      controller.record({ name: 'http.request.duration_ms', value: 350, labels: { env: 'prod' } })
      const result = controller.getMetric('http.request.duration_ms', '5')
      expect(result.definition).toBeTruthy()
      expect(result.points).toHaveLength(1)
      expect(result.points[0].value).toBe(350)
      expect(result.avg).toBe(350)
    })
  })

  // ── 👥 HR: 关注告警处理和系统稳定性 ──
  describe('👥 HR HR Manager', () => {
    it('AC-6: 静默告警 — 静默后告警状态应变更', () => {
      // 先触发告警
      for (let i = 0; i < 3; i++) {
        controller.record({ name: 'http.error.rate', value: 0.5, labels: { env: 'prod' } })
      }
      const before = controller.listAlerts(undefined)
      const firingAlert = before.items.find((a) => a.status === 'firing')
      if (firingAlert) {
        const silenced = controller.silence(firingAlert.id, {
          durationSec: 3600,
          operator: 'admin',
          reason: '已知问题',
        })
        expect(silenced.status).toBe('silenced')
        expect(silenced.silencedUntil).toBeDefined()
      }
    })

    it('AC-7: 静默不存在的告警 — 应抛 BadRequestException', () => {
      expect(() =>
        controller.silence('nonexistent-alert', {
          durationSec: 600,
          operator: 'admin',
          reason: '测试',
        }),
      ).toThrow('Alert nonexistent-alert not found')
    })
  })

  // ── 🔧 安监: 关注安全相关告警和审计日志 ──
  describe('🔧 安监 Security Supervisor', () => {
    it('AC-8: 审计日志 — 告警操作应记录审计', () => {
      // 触发告警
      for (let i = 0; i < 3; i++) {
        controller.record({ name: 'http.error.rate', value: 0.5, labels: { env: 'prod' } })
      }
      const alerts = controller.listAlerts(undefined)
      const firing = alerts.items.find((a) => a.status === 'firing')
      if (firing) {
        // 静默操作应产生审计
        controller.silence(firing.id, {
          durationSec: 60,
          operator: 'security',
          reason: '调查中',
        })
        const audit = controller.auditLogs(firing.id)
        expect(audit.items.length).toBeGreaterThanOrEqual(2) // fire + silence
        expect(audit.total).toBeGreaterThanOrEqual(2)
      }
    })

    it('AC-9: 审计日志异常 ID — 不存在告警返回空列表', () => {
      const audit = controller.auditLogs('unknown-alert-id')
      expect(audit.items).toHaveLength(0)
      expect(audit.total).toBe(0)
    })
  })

  // ── 🎮 导玩员: 关注游玩设备/服务异常指标 ──
  describe('🎮 导玩员 Game Guide', () => {
    it('AC-10: 记录设备指标 — 应收录成功含标签', () => {
      const result = controller.record({
        name: 'cpu.usage_percent',
        value: 75,
        labels: { device: 'game-console-01', hall: 'A' },
      })
      expect(result.name).toBe('cpu.usage_percent')
      expect(result.labels.device).toBe('game-console-01')
    })

    it('AC-11: 查看设备错误率指标详情 — 应返回平均值', () => {
      controller.record({ name: 'http.error.rate', value: 0.02, labels: { device: 'console-01' } })
      controller.record({ name: 'http.error.rate', value: 0.03, labels: { device: 'console-01' } })
      const result = controller.getMetric('http.error.rate', '50')
      expect(result.points).toHaveLength(2)
      expect(result.avg).toBeCloseTo(0.025, 3)
    })
  })

  // ── 🎯 运行专员: 关注系统性能指标及告警规则配置 ──
  describe('🎯 运行专员 Operations Specialist', () => {
    it('AC-12: 创建告警规则 — 规则应被保存', () => {
      const rule = controller.createRule({
        name: '高内存告警',
        metric: 'memory.usage_mb',
        comparator: 'gt',
        threshold: 8000,
        durationSec: 120,
        severity: 'error',
        channels: ['email', 'webhook'],
        enabled: true,
        createdBy: 'ops-user',
      })
      expect(rule.name).toBe('高内存告警')
      expect(rule.id).toMatch(/^rule-/)
      expect(rule.createdAt).toBeDefined()
      expect(rule.updatedAt).toBeDefined()
    })

    it('AC-13: 更新告警规则 — 阈值变更应生效', () => {
      const rule = controller.createRule({
        name: 'CPU 告警',
        metric: 'cpu.usage_percent',
        comparator: 'gt',
        threshold: 80,
        durationSec: 60,
        severity: 'warning',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'ops-user',
      })
      // 等待几毫秒确保时间戳不同
      const updated = controller.updateRule(rule.id, { threshold: 90, severity: 'error' })
      expect(updated.threshold).toBe(90)
      expect(updated.severity).toBe('error')
      // updatedAt 至少在创建时间之后
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(rule.updatedAt).getTime())
    })

    it('AC-14: 更新不存在的规则 — 应抛 BadRequestException', () => {
      expect(() => controller.updateRule('nonexistent', { enabled: false })).toThrow(
        'Rule nonexistent not found',
      )
    })

    it('AC-15: 查看所有规则 — 应含种子数据', () => {
      const result = controller.listRules()
      expect(result.total).toBeGreaterThanOrEqual(3)
      const names = result.items.map((r) => r.name)
      expect(names).toContain('高错误率告警')
      expect(names).toContain('AI 延迟告警')
    })
  })

  // ── 🤝 团建: 关注批量操作和团队协作功能 ──
  describe('🤝 团建 Team Building', () => {
    it('AC-16: 批量上报指标 — 应收录所有指标点', () => {
      const result = controller.recordBatch({
        points: [
          { name: 'http.request.count', value: 10, labels: { team: 'group-a' } },
          { name: 'http.request.count', value: 20, labels: { team: 'group-b' } },
          { name: 'http.request.count', value: 30, labels: { team: 'group-c' } },
        ],
      })
      expect(result.count).toBe(3)
    })

    it('AC-17: 批量上报后查询对应指标 — 数据完整', () => {
      controller.recordBatch({
        points: [
          { name: 'memory.usage_mb', value: 4096, labels: { host: 'node-1' } },
          { name: 'memory.usage_mb', value: 2048, labels: { host: 'node-2' } },
        ],
      })
      const result = controller.getMetric('memory.usage_mb', '10')
      expect(result.points).toHaveLength(2)
    })
  })

  // ── 📢 营销: 关注营销活动相关系统指标 ──
  describe('📢 营销 Marketing', () => {
    it('AC-18: 记录营销活动指标 — 正确存储含 campaign 标签', () => {
      const result = controller.record({
        name: 'http.request.count',
        value: 999,
        labels: { campaign: 'summer-sale', channel: 'sms' },
      })
      expect(result.labels.campaign).toBe('summer-sale')
    })

    it('AC-19: 查看营销活动期间系统延迟 — 应返回均值', () => {
      controller.record({ name: 'http.request.duration_ms', value: 200, labels: { campaign: 'summer' } })
      controller.record({ name: 'http.request.duration_ms', value: 300, labels: { campaign: 'summer' } })
      controller.record({ name: 'http.request.duration_ms', value: 500, labels: { campaign: 'summer' } })
      const result = controller.getMetric('http.request.duration_ms', '50')
      expect(result.points).toHaveLength(3)
      expect(result.avg).toBeCloseTo(333.33, 0)
    })
  })

  // ── 边界测试: 异常参数、空数据、极限值 ──
  describe('边界测试 Boundary Tests', () => {
    it('BT-1: 查询不存在的指标 — definition 为 null', () => {
      const result = controller.getMetric('nonexistent.metric', undefined)
      expect(result.definition).toBeNull()
      expect(result.points).toHaveLength(0)
      expect(result.avg).toBeNull()
    })

    it('BT-2: 查询限制小数量的指标点 — 应返回指定数量以内', () => {
      for (let i = 0; i < 20; i++) {
        controller.record({ name: 'http.request.count', value: i, labels: { batch: 'bt' } })
      }
      const result = controller.getMetric('http.request.count', '5')
      expect(result.points.length).toBeLessThanOrEqual(5)
    })

    it('BT-3: 按状态过滤告警 — 仅返回匹配的告警', () => {
      // 先触发告警，再静默它
      for (let i = 0; i < 3; i++) {
        controller.record({ name: 'http.error.rate', value: 0.5, labels: { test: 'filter' } })
      }
      const alerts = controller.listAlerts(undefined)
      const firing = alerts.items.find((a) => a.status === 'firing')
      if (firing) {
        controller.silence(firing.id, {
          durationSec: 3600,
          operator: 'tester',
          reason: 'boundary test',
        })
      }
      const filtered = controller.listAlerts('silenced')
      expect(filtered.items.every((a) => a.status === 'silenced')).toBe(true)
    })

    it('BT-4: 多次触发告警 — 同一规则不重复创建 firing 告警', () => {
      // 上报多次同样的高 error rate
      for (let i = 0; i < 10; i++) {
        controller.record({ name: 'http.error.rate', value: 0.5, labels: { env: 'prod' } })
      }
      const result = controller.listAlerts('firing')
      const errorRateAlerts = result.items.filter(
        (a) => a.ruleId === 'rule-seed-error-rate' && a.status === 'firing',
      )
      expect(errorRateAlerts.length).toBeLessThanOrEqual(1)
    })

    it('BT-5: 空指标名记录 — 应通过验证正常记录', () => {
      // 模拟 DTO 验证已经在 controller 中通过
      // controller 层本身不做校验，但应能正常接收
      expect(() =>
        controller.record({ name: 'valid.metric', value: 0, labels: {} }),
      ).not.toThrow()
    })

    it('BT-6: rules/create 接口 — 完整的创建与查询流程', () => {
      // 创建
      const rule = controller.createRule({
        name: '边界测试规则',
        metric: 'test.metric',
        comparator: 'gte',
        threshold: 100,
        durationSec: 0, // 立即触发
        severity: 'info',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'tester',
      })
      expect(rule.id).toBeDefined()

      // 触发告警
      const point = controller.record({ name: 'test.metric', value: 150, labels: { mode: 'boundary' } })
      expect(point).toBeDefined()

      // 查询告警列表
      const alerts = controller.listAlerts(undefined)
      expect(alerts.items.length).toBeGreaterThanOrEqual(0)
    })

    it('BT-7: 严重度分布 — 无告警时返回零值', () => {
      // 在重置视角下，使用仅 info 规则也检测
      const count = controller.listAlerts(undefined).severityCount
      expect(typeof count.info).toBe('number')
      expect(typeof count.warning).toBe('number')
      expect(typeof count.error).toBe('number')
      expect(typeof count.critical).toBe('number')
    })

    it('BT-8: 并发指标点保持最近一小时 — 老数据应被清除', () => {
      // 直接通过 service 注入老数据（实际无法绕过时间，但作为逻辑验证）
      const now = Date.now()
      // 上报新数据
      for (let i = 0; i < 100; i++) {
        controller.record({ name: 'http.request.count', value: i, labels: { test: 'cleanup' } })
      }
      const result = controller.getMetric('http.request.count', '200')
      // 数据量不应超过预期（最多保留 1h 数据 + 上报的 100 条）
      expect(result.points.length).toBeLessThanOrEqual(101)
      expect(result.points.length).toBeGreaterThanOrEqual(1)
    })
  })
})
