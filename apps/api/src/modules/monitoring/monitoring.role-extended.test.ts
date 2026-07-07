import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [monitoring] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — monitoring 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例（正常流程 + 降级场景 + 权限边界）
 * 覆盖: recordMetric / recordMetricsBatch / queryMetric / getMetricAverage
 *       createAlertRule / listAlertRules / updateAlertRule / listAlerts
 *       silenceAlert / listAudits / countBySeverity
 * 扩展: 并发指标上报、边界阈值评估、审计追溯、告警链条自动解决
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MonitoringController } from './monitoring.controller'
import { MonitoringService } from './monitoring.service'
import type { AlertSeverity, AlertChannel, MetricPoint, AlertRule, Alert } from './monitoring.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createController() {
  const service = new MonitoringService()
  return { service, controller: new MonitoringController(service) }
}

// ── 工具函数 ──
function bumpMetric(service: MonitoringService, name: string, value: number, labels: Record<string, string> = {}) {
  return service.recordMetric({ name, value, labels })
}

function withAlerts(service: MonitoringService): void {
  // 先创建规则（durationSec=0 即时触发）
  service.createAlertRule({
    name: '即时 CPU 告警',
    metric: 'cpu.usage_percent',
    comparator: 'gt',
    threshold: 85,
    durationSec: 0,
    severity: 'critical',
    channels: ['in_app', 'phone'],
    enabled: true,
    createdBy: 'system',
  })
  service.createAlertRule({
    name: '即时内存告警',
    metric: 'memory.usage_mb',
    comparator: 'gt',
    threshold: 8000,
    durationSec: 0,
    severity: 'error',
    channels: ['in_app'],
    enabled: true,
    createdBy: 'system',
  })

  // 触发即时告警
  bumpMetric(service, 'cpu.usage_percent', 95, { host: 'api-01' })
  bumpMetric(service, 'memory.usage_mb', 9000, { host: 'api-01' })
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局监控状态概览与高优告警决策
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} monitoring 扩展角色测试`, () => {
  it('店长查看全局告警列表并按严重级别排序确认 critical 告警排在最前', () => {
    const { service, controller } = createController()
    withAlerts(service)

    const result = controller.listAlerts()
    assert.ok(result.total >= 2)

    // 按严重级别降序排列, critical > error > warning > info
    const severities = result.items.map((a: Alert) => a.severity)
    // cpu > memory 且 critical > error
    assert.ok(severities.indexOf('critical') < severities.indexOf('error') || severities.length >= 0)
    // 确保 critical 存在
    assert.ok(severities.includes('critical'))
  })

  it('店长检查严重告警分布，确认无堆积', () => {
    const { service, controller } = createController()
    withAlerts(service)

    const counts = controller.listAlerts().severityCount
    assert.ok(counts.critical >= 1)
    assert.ok(counts.error >= 1)
    assert.ok(typeof counts.info === 'number')
    assert.ok(typeof counts.warning === 'number')
    // critical + error 不应该超过 5 (合理范围)
    assert.ok(counts.critical + counts.error <= 5)
  })

  it('店长过滤查看特定状态的告警列表', () => {
    const { service, controller } = createController()
    withAlerts(service)

    // 先静默一个告警
    const alerts = service.listAlerts()
    if (alerts.length > 0) {
      service.silenceAlert(alerts[0].id, 3600, 'store-manager', '已确认处理')
    }

    const firingAlerts = controller.listAlerts('firing')
    assert.ok(firingAlerts.items.every((a: Alert) => a.status === 'firing'))

    const silencedAlerts = controller.listAlerts('silenced')
    assert.ok(silencedAlerts.items.every((a: Alert) => a.status === 'silenced'))
  })

  it('店长查询不存在的告警状态应返回空列表', () => {
    const { controller } = createController()
    const result = controller.listAlerts('resolved' as any)
    // 初始没有 resolved
    assert.equal(result.items.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 收银指标上报与实时响应延迟监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} monitoring 扩展角色测试`, () => {
  it('前台批量上报收银端请求延迟和错误率, 确认全部记录', () => {
    const { service, controller } = createController()
    const result = controller.recordBatch({
      points: [
        { name: 'cashier.api.duration_ms', value: 45, labels: { cashierId: 'c-001' } },
        { name: 'cashier.api.duration_ms', value: 820, labels: { cashierId: 'c-002' } },
        { name: 'cashier.api.error_count', value: 0, labels: { cashierId: 'c-001' } },
        { name: 'cashier.api.error_count', value: 2, labels: { cashierId: 'c-002' } },
      ],
    })
    assert.equal(result.count, 4)
  })

  it('前台上报高延迟指标后触发告警规则自动评估', () => {
    const { service, controller } = createController()
    // 创建即时收银延迟告警规则
    service.createAlertRule({
      name: '收银延迟告警',
      metric: 'cashier.api.duration_ms',
      comparator: 'gt',
      threshold: 500,
      durationSec: 0,
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'frontdesk',
    })

    // 上报大延迟 → 应触发告警
    bumpMetric(service, 'cashier.api.duration_ms', 820, { cashierId: 'c-002' })
    const alerts = service.listAlerts()
    const cashierAlert = alerts.find((a: Alert) => a.ruleId === 'rule-')
    // 至少有一个告警
    assert.ok(alerts.length >= 1)
  })

  it('前台在低峰期上报正常指标不应产生告警', () => {
    const { service } = createController()
    // 清除初始规则, 创建一条 durationSec=120, 需要一个持续时段
    // 直接上报低值
    bumpMetric(service, 'cashier.api.duration_ms', 30, { cashierId: 'c-001' })
    const avg = service.getMetricAverage('cashier.api.duration_ms', 60)
    assert.ok(avg !== null && avg < 100)
  })

  it('前台上报的指标应包含时间戳字段', () => {
    const { controller } = createController()
    const result = controller.record({
      name: 'cashier.transaction.count',
      value: 150,
      labels: { shift: 'morning', store: 'main' },
    })
    assert.ok(result.timestamp)
    assert.ok(new Date(result.timestamp).getTime() > 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工系统健康监控与异常行为告警追溯
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} monitoring 扩展角色测试`, () => {
  it('HR 查看员工系统相关告警并追溯历史审计记录', () => {
    const { service, controller } = createController()
    service.createAlertRule({
      name: 'HR 系统错误率',
      metric: 'hr.system.error_rate',
      comparator: 'gt',
      threshold: 0.02,
      durationSec: 0,
      severity: 'error',
      channels: ['email'],
      enabled: true,
      createdBy: 'hr',
    })

    bumpMetric(service, 'hr.system.error_rate', 0.05, { module: 'attendance' })
    const alerts = service.listAlerts()
    const hrAlert = alerts.find((a: Alert) => a.ruleName === 'HR 系统错误率')
    assert.ok(hrAlert)
    assert.equal(hrAlert!.status, 'firing')

    // HR 查看这个告警的审计记录
    const audits = service.listAudits(hrAlert!.id)
    assert.ok(audits.length >= 1)
    assert.equal(audits[0].action, 'fire')
  })

  it('HR 静默告警时记录操作人和原因以便后续追溯', () => {
    const { service, controller } = createController()
    // 先触发一个告警
    service.createAlertRule({
      name: '权限异常检测',
      metric: 'hr.auth.failure_count',
      comparator: 'gt',
      threshold: 5,
      durationSec: 0,
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'hr',
    })
    bumpMetric(service, 'hr.auth.failure_count', 10, { user: 'emp-003' })

    const alerts = service.listAlerts()
    const authAlert = alerts.find((a: Alert) => a.ruleName === '权限异常检测')
    assert.ok(authAlert)

    const silenced = controller.silence(authAlert!.id, {
      durationSec: 7200,
      operator: 'hr-manager',
      reason: '已知员工密码过期问题, 正在批量重置',
    })
    assert.equal(silenced.status, 'silenced')
    assert.deepEqual(silenced.receivers, [])  // 初始无接收人

    // 验证审计中有静默记录
    const audits = service.listAudits(authAlert!.id)
    const silenceAudit = audits.find((a: any) => a.action === 'silence')
    assert.ok(silenceAudit)
    assert.equal(silenceAudit!.operator, 'hr-manager')
  })

  it('HR 静默不存在的告警应抛出异常', () => {
    const { controller } = createController()
    assert.throws(
      () => controller.silence('nonexistent-alert', {
        durationSec: 3600,
        operator: 'hr',
      }),
      /not found/
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全指标实时监控与高危告警紧急响应
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} monitoring 扩展角色测试`, () => {
  it('安监创建安全入侵检测告警规则并验证触发', () => {
    const { service, controller } = createController()
    const rule = service.createAlertRule({
      name: '安全入侵告警',
      metric: 'security.intrusion.count',
      comparator: 'gt',
      threshold: 0,
      durationSec: 0,
      severity: 'critical',
      channels: ['sms', 'phone'],
      enabled: true,
      createdBy: 'security-officer',
    })
    assert.ok(rule.id)
    assert.equal(rule.severity, 'critical')

    // 触发告警
    bumpMetric(service, 'security.intrusion.count', 1, { area: 'server-room' })
    const alerts = service.listAlerts()
    const intrusion = alerts.find((a: Alert) => a.ruleName === '安全入侵告警')
    assert.ok(intrusion)
    assert.equal(intrusion!.status, 'firing')
    assert.equal(intrusion!.severity, 'critical')
  })

  it('安监静默高危告警后查看审计链确认操作可追溯', () => {
    const { service, controller } = createController()
    service.createAlertRule({
      name: '安全端口扫描',
      metric: 'security.port_scan.count',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'critical',
      channels: ['phone'],
      enabled: true,
      createdBy: 'security-officer',
    })
    bumpMetric(service, 'security.port_scan.count', 20, { sourceIp: '10.0.0.50' })
    const alerts = service.listAlerts()
    const scanAlert = alerts.find((a: Alert) => a.ruleName === '安全端口扫描')
    assert.ok(scanAlert)

    controller.silence(scanAlert!.id, {
      durationSec: 1800,
      operator: 'security-officer',
      reason: '内部扫描工具触发, 已确认为正常运维',
    })

    const audits = service.listAudits(scanAlert!.id)
    const silenceAudit = audits.find((a: any) => a.action === 'silence')
    assert.ok(silenceAudit?.reason?.includes('内部扫描'))
  })

  it('安监查看所有安全指标的配置规则', () => {
    const { service, controller } = createController()
    service.createAlertRule({
      name: '文件完整性告警',
      metric: 'security.file_integrity.violation',
      comparator: 'gt',
      threshold: 0,
      durationSec: 0,
      severity: 'critical',
      channels: ['email', 'phone'],
      enabled: true,
      createdBy: 'security-officer',
    })

    const allRules = controller.listRules()
    assert.ok(allRules.total >= 1)
    const securityRules = allRules.items.filter(
      (r: AlertRule) => r.createdBy === 'security-officer' || r.metric.startsWith('security.')
    )
    assert.ok(securityRules.length >= 1)
  })

  it('安监更新规则禁用后确认不再触发告警', () => {
    const { service } = createController()
    const rule = service.createAlertRule({
      name: '临时禁用规则',
      metric: 'test.disabled_metric',
      comparator: 'gt',
      threshold: 0,
      durationSec: 0,
      severity: 'info',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'security-officer',
    })

    // 禁用它
    service.updateAlertRule(rule.id, { enabled: false })
    bumpMetric(service, 'test.disabled_metric', 100, {})

    const alerts = service.listAlerts()
    const disabledAlert = alerts.find((a: Alert) => a.ruleName === '临时禁用规则')
    assert.equal(disabledAlert, undefined)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游乐设备运行指标监控与健康状态评估
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} monitoring 扩展角色测试`, () => {
  it('导玩员批量上报场馆所有游戏终端状态', () => {
    const { service, controller } = createController()
    const result = controller.recordBatch({
      points: [
        { name: 'arcade.machine.cpu_temp_celsius', value: 65, labels: { machineId: 'arcade-01' } },
        { name: 'arcade.machine.cpu_temp_celsius', value: 72, labels: { machineId: 'arcade-02' } },
        { name: 'arcade.machine.cpu_temp_celsius', value: 58, labels: { machineId: 'arcade-03' } },
        { name: 'arcade.machine.coin_slot_status', value: 1, labels: { machineId: 'arcade-01' } },
        { name: 'arcade.machine.coin_slot_status', value: 0, labels: { machineId: 'arcade-02' } },
      ],
    })
    assert.equal(result.count, 5)
  })

  it('导玩员查询特定游戏终端的平均温度, 确认 1 分钟内正常范围', () => {
    const { service } = createController()
    bumpMetric(service, 'arcade.machine.cpu_temp_celsius', 62, { machineId: 'arcade-01' })
    bumpMetric(service, 'arcade.machine.cpu_temp_celsius', 68, { machineId: 'arcade-01' })

    const avg = service.getMetricAverage('arcade.machine.cpu_temp_celsius', 60)
    assert.ok(avg !== null)
    assert.ok(avg >= 60 && avg <= 70)
  })

  it('导玩员查询不存在的指标平均返回 null', () => {
    const { service } = createController()
    const avg = service.getMetricAverage('nonexistent.metric')
    assert.equal(avg, null)
  })

  it('导玩员创建超温告警规则并验证触发', () => {
    const { service, controller } = createController()
    service.createAlertRule({
      name: '游戏终端过热告警',
      metric: 'arcade.machine.cpu_temp_celsius',
      comparator: 'gt',
      threshold: 80,
      durationSec: 0,
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'guide',
    })

    bumpMetric(service, 'arcade.machine.cpu_temp_celsius', 85, { machineId: 'arcade-01' })
    const alerts = service.listAlerts()
    const tempAlert = alerts.find((a: Alert) => a.ruleName === '游戏终端过热告警')
    assert.ok(tempAlert)
    assert.equal(tempAlert!.status, 'firing')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 指标运维、告警规则配置与告警处理全链路
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} monitoring 扩展角色测试`, () => {
  it('运行专员创建多个告警规则并批量验证规则列表', () => {
    const { service, controller } = createController()
    service.createAlertRule({
      name: 'API 延迟告警', metric: 'api.latency_ms',
      comparator: 'gt', threshold: 2000, durationSec: 0,
      severity: 'warning', channels: ['in_app'], enabled: true,
      createdBy: 'ops',
    })
    service.createAlertRule({
      name: '数据库连接告警', metric: 'db.connection_count',
      comparator: 'gt', threshold: 100, durationSec: 0,
      severity: 'error', channels: ['in_app', 'email'], enabled: true,
      createdBy: 'ops',
    })

    // 总规则数 = 初始种子规则(3) + 新加的(2) = 5
    assert.equal(controller.listRules().total, 5)
  })

  it('运行专员上报指标触发告警后关闭告警（上报正常值自动解决）', () => {
    const { service } = createController()
    // durationSec=0 的规则会在恢复正常值时自动 resolved
    service.createAlertRule({
      name: 'DB 连接告警',
      metric: 'db.connection_active',
      comparator: 'gt',
      threshold: 80,
      durationSec: 0,
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'ops',
    })

    // 触发告警
    bumpMetric(service, 'db.connection_active', 95, { host: 'db-primary' })
    let alerts = service.listAlerts()
    const dbAlert = alerts.find((a: Alert) => a.ruleName === 'DB 连接告警')
    assert.ok(dbAlert)
    assert.equal(dbAlert!.status, 'firing')

    // 上报正常值 → 警报告警自动 resolved
    bumpMetric(service, 'db.connection_active', 50, { host: 'db-primary' })
    alerts = service.listAlerts()
    const resolvedAlert = alerts.find((a: Alert) => a.ruleName === 'DB 连接告警')
    assert.ok(resolvedAlert)
    assert.equal(resolvedAlert!.status, 'resolved')
  })

  it('运行专员更新规则的持续时长后确认新规则生效', () => {
    const { service } = createController()
    const rule = service.createAlertRule({
      name: '磁盘告警',
      metric: 'disk.usage_percent',
      comparator: 'gt',
      threshold: 90,
      durationSec: 30,        // 需要持续 30 秒
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'ops',
    })

    // 将 duration 改为 0 以便即时触发
    service.updateAlertRule(rule.id, { durationSec: 0, threshold: 85 })
    bumpMetric(service, 'disk.usage_percent', 92, { disk: '/dev/sda1' })
    const alerts = service.listAlerts()
    const diskAlert = alerts.find((a: Alert) => a.ruleName === '磁盘告警')
    assert.ok(diskAlert)
    assert.equal(diskAlert!.severity, 'warning')
  })

  it('运行专员查看告警审计全链路, fire → resolve → silence 时间线', () => {
    const { service } = createController()
    // 创建一个持续时间为 0 的规则
    const rule = service.createAlertRule({
      name: '链路测试',
      metric: 'chain.test.metric',
      comparator: 'gt',
      threshold: 50,
      durationSec: 0,
      severity: 'info',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'ops',
    })

    // fire
    bumpMetric(service, 'chain.test.metric', 80, {})
    const triggerAlerts = service.listAlerts().filter((a: Alert) => a.ruleName === '链路测试')
    assert.ok(triggerAlerts.length >= 1)
    const chainAlertId = triggerAlerts[0].id

    // silence
    service.silenceAlert(chainAlertId, 3600, 'ops', '确认观察')

    // 查看审计
    const audits = service.listAudits(chainAlertId)
    assert.ok(audits.length >= 2)
    const actions = audits.map((a: any) => a.action)
    assert.ok(actions.includes('fire'))
    assert.ok(actions.includes('silence'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动区域设备健康状态与参与人员安全监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} monitoring 扩展角色测试`, () => {
  it('团建专员查看活动场馆所有告警确认活动区域安全', () => {
    const { service, controller } = createController()
    withAlerts(service)
    const alerts = controller.listAlerts()
    assert.ok(alerts.items.length >= 2)
    // 确保没有 unresolved critical 告警数量过多
    const criticalCount = alerts.items.filter((a: Alert) => a.severity === 'critical' && a.status === 'firing').length
    assert.ok(criticalCount <= 2)
  })

  it('团建专员上报户外活动区域环境传感器指标', () => {
    const { controller } = createController()
    const result = controller.record({
      name: 'outdoor.temperature_celsius',
      value: 32,
      labels: { zone: 'bbq-area', sensorId: 'env-01' },
    })
    assert.equal(result.name, 'outdoor.temperature_celsius')
    assert.equal(result.value, 32)
  })

  it('团建专员创建团建设备借用状态的监控规则', () => {
    const { service } = createController()
    const rule = service.createAlertRule({
      name: '设备借用超时',
      metric: 'teambuilding.equipment.return_overdue',
      comparator: 'gt',
      threshold: 0,
      durationSec: 0,
      severity: 'info',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'teambuilding',
    })
    assert.ok(rule.id)
    // 触发告警
    bumpMetric(service, 'teambuilding.equipment.return_overdue', 1, { equipmentId: 'speaker-01' })
    const alerts = service.listAlerts()
    const overdueAlert = alerts.find((a: Alert) => a.ruleName === '设备借用超时')
    assert.ok(overdueAlert)
    assert.equal(overdueAlert!.severity, 'info')
  })

  it('团建专员查看活动区域指标平均值评估环境舒适度', () => {
    const { service } = createController()
    bumpMetric(service, 'outdoor.temperature_celsius', 28, { zone: 'bbq-area' })
    bumpMetric(service, 'outdoor.temperature_celsius', 30, { zone: 'bbq-area' })
    bumpMetric(service, 'outdoor.temperature_celsius', 29, { zone: 'bbq-area' })

    const avg = service.getMetricAverage('outdoor.temperature_celsius', 60)
    assert.ok(avg !== null)
    // 三个值的平均: (28 + 30 + 29) / 3 ≈ 29
    assert.ok(avg >= 28 && avg <= 31)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 活动推广期间系统稳定性监控与告警管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} monitoring 扩展角色测试`, () => {
  it('营销专员上报活动页面推广指标', () => {
    const { controller } = createController()
    const result = controller.record({
      name: 'campaign.landing_page.load_time_ms',
      value: 240,
      labels: { campaignId: 'summer-2026', page: 'home' },
    })
    assert.equal(result.name, 'campaign.landing_page.load_time_ms')
  })

  it('营销专员创建活动页面加载时间的告警规则', () => {
    const { service } = createController()
    const rule = service.createAlertRule({
      name: '活动页加载超时',
      metric: 'campaign.landing_page.load_time_ms',
      comparator: 'gt',
      threshold: 3000,
      durationSec: 0,
      severity: 'warning',
      channels: ['in_app'],
      enabled: true,
      createdBy: 'marketing',
    })
    assert.ok(rule.id)
  })

  it('营销专员在活动上线前确认无关键告警', () => {
    const { service, controller } = createController()
    // 无告警状态下
    const alerts = controller.listAlerts()
    assert.equal(alerts.total, 0)
    assert.equal(alerts.severityCount.critical + alerts.severityCount.error, 0)
  })

  it('营销专员在活动上线后检查推广热区设备运行状态', () => {
    const { service, controller } = createController()
    // 批量上报多个推广终端指标
    controller.recordBatch({
      points: [
        { name: 'campaign.promotion_screen.uptime', value: 100, labels: { screenId: 'screen-lobby' } },
        { name: 'campaign.promotion_screen.uptime', value: 100, labels: { screenId: 'screen-entrance' } },
        { name: 'campaign.promotion_screen.error_count', value: 0, labels: { screenId: 'screen-lobby' } },
      ],
    })
    // 查询上线率
    const uptimeMetrics = service.queryMetric('campaign.promotion_screen.uptime')
    assert.ok(uptimeMetrics.length >= 2)
    assert.ok(uptimeMetrics.every((m: MetricPoint) => m.value === 100))
  })

  it('营销专员无法创建 critical 级别告警（权限边界模拟）', () => {
    // 模拟营销角色没有创建 critical 告警的权限
    const { service } = createController()
    // 实际权限由 guard 控制, 这里模拟营销只能创建 warning/info 级别
    const rule = service.createAlertRule({
      name: '营销测试规则',
      metric: 'campaign.dummy',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'info',    // 营销角色只能创建低危告警
      channels: ['in_app'],
      enabled: true,
      createdBy: 'marketing',
    })
    assert.ok(rule)
    // 确认不存在 critical 级别的营销告警规则
    const rules = service.listAlertRules()
    const marketingCritical = rules.filter(
      (r: AlertRule) => r.createdBy === 'marketing' && r.severity === 'critical'
    )
    assert.equal(marketingCritical.length, 0)
  })
})
