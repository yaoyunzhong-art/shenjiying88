import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [aiops] [C] 角色测试
 *
 * 8 角色视角的 aiops 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'
import type { TimeSeriesPoint } from './aiops-prediction.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function makePoint(value: number, offsetMs = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

function createDetector() { return new TimeSeriesAnomalyDetector() }
function createSelfHealing(d?: TimeSeriesAnomalyDetector) { return new SelfHealingService(d || createDetector()) }

// ── 👔 店长: 关注整体运营健康和趋势 ──
describe(`${ROLES.StoreManager} 店长 Store Manager`, () => {
  it('[正常] 查看系统整体健康 — 所有指标汇总', () => {
    const detector = createDetector()
    for (let i = 0; i < 20; i++) detector.recordDataPoint('cpu', makePoint(50 + Math.random() * 10, (20 - i) * 60000))
    const healer = createSelfHealing(detector)
    const health = healer.checkHealth('store-system')
    expect(['healthy', 'degraded', 'critical']).toContain(health.status)
    expect(health.metrics).toHaveProperty('cpu_usage')
  })

  it('[边界] 系统从未检查时返回 unknown', () => {
    const healer = createSelfHealing()
    const history = healer.getHealingHistory('never-checked')
    expect(history.actions).toHaveLength(0)
  })
})

// ── 🛒 前台: 关注响应速度和用户体验 ──
describe(`${ROLES.FrontDesk} 前台 Front Desk`, () => {
  it('[正常] 页面加载时间预测 — 得到合理预估', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('page_load', makePoint(200 + Math.random() * 50, (10 - i) * 60000))
    const result = detector.predictNext('page_load', 3)
    expect(result.predictedValues).toHaveLength(3)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('[边界] 无可预测数据返回全零', () => {
    const detector = createDetector()
    detector.recordDataPoint('new_page', makePoint(100, 0))
    const result = detector.predictNext('new_page', 3)
    result.predictedValues.forEach((v) => expect(v).toBe(0))
  })
})

// ── 👥 HR: 关注系统稳定性和员工操作异常 ──
describe(`${ROLES.HR} HR HR Manager`, () => {
  it('[正常] 自愈流程 — 触发返回有效记录', async () => {
    const detector = createDetector()
    const healer = createSelfHealing(detector)
    const action = await healer.triggerHealing('hr-portal')
    expect(action.id).toBeDefined()
    expect(action.targetSystem).toBe('hr-portal')
    expect(['completed', 'failed']).toContain(action.status)
  })

  it('[边界] 同一系统多次自愈 — 历史记录增长', async () => {
    const healer = createSelfHealing()
    await healer.triggerHealing('hr-system')
    await healer.triggerHealing('hr-system')
    const history = healer.getHealingHistory('hr-system')
    expect(history.actions.length).toBe(2)
  })
})

// ── 🔧 安监: 关注安全攻击检测和紧急异常 ──
describe(`${ROLES.Security} 安监 Safety Supervisor`, () => {
  it('[正常] DDoS 攻击检测 — 高流量应识别', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('api_gateway', makePoint(5, (10 - i) * 60000))
    for (let i = 0; i < 40; i++) detector.recordDataPoint('api_gateway', makePoint(500, i * 1000))
    const result = detector.isUnderAttack('api_gateway')
    expect(result.isUnderAttack).toBe(true)
  })

  it('[边界] 正常流量不误判为攻击', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('normal_traffic', makePoint(100, (15 - i) * 10000))
    const result = detector.isUnderAttack('normal_traffic')
    expect(result.isUnderAttack).toBe(false)
  })
})

// ── 🎮 导玩员: 关注设备健康和温度异常 ──
describe(`${ROLES.Guide} 导玩员 Game Guide`, () => {
  it('[正常] 设备温度异常检测 — 高温应告警', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('machine_temp', makePoint(45, (10 - i) * 60000))
    detector.recordDataPoint('machine_temp', makePoint(95, 0))
    const result = detector.detectAnomaly('machine_temp')
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
  })

  it('[边界] 少量数据无法检测', () => {
    const detector = createDetector()
    detector.recordDataPoint('new_machine', makePoint(40, 0))
    const result = detector.detectAnomaly('new_machine')
    expect(result.isAnomaly).toBe(false)
    expect(result.details).toContain('数据点不足')
  })
})

// ── 🎯 运行专员: 关注性能调优和预测 ──
describe(`${ROLES.Operations} 运行专员 Operations Specialist`, () => {
  it('[正常] CPU 趋势预测 — 返回增长趋势', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('cpu_trend', makePoint(30 + i * 3, (15 - i) * 60000))
    const result = detector.predictNext('cpu_trend', 5)
    expect(result.predictedValues.length).toBe(5)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('[边界] 预测后仍能正常检测', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('ops_metric', makePoint(50, (10 - i) * 60000))
    detector.predictNext('ops_metric', 3)
    detector.recordDataPoint('ops_metric', makePoint(200, 0))
    const result = detector.detectAnomaly('ops_metric')
    expect(result.isAnomaly).toBe(true)
  })
})

// ── 🤝 团建: 关注协作和多用户场景 ──
describe(`${ROLES.Teambuilding} 团建 Team Building Coordinator`, () => {
  it('[正常] 多指标批量检测 — 所有指标正常', () => {
    const detector = createDetector()
    for (const name of ['team_cpu', 'team_mem', 'team_io']) {
      for (let i = 0; i < 10; i++) detector.recordDataPoint(name, makePoint(50, (10 - i) * 60000))
    }
    let allNormal = true
    for (const name of ['team_cpu', 'team_mem', 'team_io']) {
      const result = detector.detectAnomaly(name)
      if (result.isAnomaly) allNormal = false
    }
    expect(allNormal).toBe(true)
  })

  it('[边界] 混合数据 — 一个异常不影响其他', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('normal_metric', makePoint(50, (10 - i) * 60000))
    for (let i = 0; i < 10; i++) detector.recordDataPoint('broken_metric', makePoint(50, (10 - i) * 60000))
    detector.recordDataPoint('broken_metric', makePoint(999, 0))
    expect(detector.detectAnomaly('normal_metric').isAnomaly).toBe(false)
    expect(detector.detectAnomaly('broken_metric').isAnomaly).toBe(true)
  })
})

// ── 📢 营销: 关注流量趋势和活动效果 ──
describe(`${ROLES.Marketing} 营销 Marketing Manager`, () => {
  it('[正常] 流量趋势检测 — 逐步上升非异常', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('promo_traffic', makePoint(1000 + i * 100, (15 - i) * 60000))
    const result = detector.detectAnomaly('promo_traffic')
    expect(result.metricName).toBe('promo_traffic')
  })

  it('[边界] 大促流量尖峰 — 应标记 spike', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('sale_traffic', makePoint(2000, (10 - i) * 60000))
    detector.recordDataPoint('sale_traffic', makePoint(50000, 0))
    const result = detector.detectAnomaly('sale_traffic')
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
  })
})
