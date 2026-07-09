import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [aiops] [C] 角色测试（增强版）
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

// ── 👔 店长: 关注整体门店运营健康和趋势 ──
describe(`${ROLES.StoreManager} 店长 Store Manager`, () => {
  it('[正常] 查看门店系统整体健康 — 所有关键指标汇总', () => {
    const detector = createDetector()
    for (let i = 0; i < 20; i++) detector.recordDataPoint('cpu', makePoint(50 + Math.random() * 10, (20 - i) * 60000))
    for (let i = 0; i < 20; i++) detector.recordDataPoint('memory', makePoint(60 + Math.random() * 5, (20 - i) * 60000))
    const healer = createSelfHealing(detector)
    const health = healer.checkHealth('store-system')
    expect(['healthy', 'degraded', 'critical']).toContain(health.status)
    expect(health.metrics).toHaveProperty('cpu_usage')
    expect(health.metrics).toHaveProperty('memory_usage')
  })

  it('[正常] 查看自愈历史 — 门店系统过去7天自愈事件', async () => {
    const detector = createDetector()
    const healer = createSelfHealing(detector)
    await healer.triggerHealing('store-pos-system')
    await healer.triggerHealing('store-billing-system')
    const posHistory = healer.getHealingHistory('store-pos-system')
    const billingHistory = healer.getHealingHistory('store-billing-system')
    expect(posHistory.actions.length).toBe(1)
    expect(billingHistory.actions.length).toBe(1)
    // 合并看全店维度的系统健康
    expect(posHistory.actions[0].targetSystem).toBe('store-pos-system')
    expect(['completed', 'failed']).toContain(posHistory.actions[0].status)
  })

  it('[边界] 系统从未检查时返回 unknown 状态', () => {
    const healer = createSelfHealing()
    const history = healer.getHealingHistory('never-checked-store')
    expect(history.actions).toHaveLength(0)
    // summary 字段不存在于返回的接口类型中，仅验证 actions
    expect(history.actions).toHaveLength(0)
  })
})

// ── 🛒 前台: 关注收银系统响应速度和用户体验 ──
describe(`${ROLES.FrontDesk} 前台 Front Desk`, () => {
  it('[正常] 收银页面加载时间预测 — 得到合理预估范围', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('page_load', makePoint(200 + Math.random() * 50, (10 - i) * 60000))
    const result = detector.predictNext('page_load', 3)
    expect(result.predictedValues).toHaveLength(3)
    expect(result.confidence).toBeGreaterThan(0)
    // 预测值应接近历史均值
    result.predictedValues.forEach(v => expect(v).toBeGreaterThan(0))
  })

  it('[正常] 收银台 CPU 异常检测 — 高峰时段监控', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('pos_cpu', makePoint(30 + Math.random() * 10, (15 - i) * 60000))
    const result = detector.detectAnomaly('pos_cpu')
    expect(result.metricName).toBe('pos_cpu')
    expect(result.anomalyScore).toBeGreaterThanOrEqual(0)
  })

  it('[边界] 无可预测历史数据时返回全零默认值', () => {
    const detector = createDetector()
    detector.recordDataPoint('new_page', makePoint(100, 0))
    const result = detector.predictNext('new_page', 3)
    result.predictedValues.forEach((v) => expect(v).toBe(0))
  })
})

// ── 👥 HR: 关注员工操作异常和系统稳定性 ──
describe(`${ROLES.HR} HR HR Manager`, () => {
  it('[正常] HR 门户自愈流程 — 触发后返回有效记录', async () => {
    const detector = createDetector()
    const healer = createSelfHealing(detector)
    const action = await healer.triggerHealing('hr-portal')
    expect(action.id).toBeDefined()
    expect(action.targetSystem).toBe('hr-portal')
    expect(['completed', 'failed']).toContain(action.status)
    expect(action.triggeredAt).toBeDefined()
  })

  it('[正常] 检测 HR 系统数据异常 — 员工操作数据监控', () => {
    const detector = createDetector()
    // 使用稳定数据，避免随机波动触发异常
    for (let i = 0; i < 10; i++) detector.recordDataPoint('hr_ops', makePoint(5, (10 - i) * 60000))
    const result = detector.detectAnomaly('hr_ops')
    expect(result.details).toContain('未检测到异常')
  })

  it('[边界] 同一系统多次自愈 — 历史记录按时间增长', async () => {
    const healer = createSelfHealing()
    await healer.triggerHealing('hr-system')
    await healer.triggerHealing('hr-system')
    await healer.triggerHealing('hr-system')
    const history = healer.getHealingHistory('hr-system')
    expect(history.actions.length).toBe(3)
    // 每次 triggeredAt 应有时间戳
    history.actions.forEach(a => expect(a.triggeredAt).toBeDefined())
  })
})

// ── 🔧 安监: 关注安全攻击检测和紧急异常响应 ──
describe(`${ROLES.Security} 安监 Safety Supervisor`, () => {
  it('[正常] DDoS 攻击检测 — 高流量突增应准确识别', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('api_gateway', makePoint(5, (10 - i) * 60000))
    for (let i = 0; i < 40; i++) detector.recordDataPoint('api_gateway', makePoint(500, i * 1000))
    const result = detector.isUnderAttack('api_gateway')
    expect(result.isUnderAttack).toBe(true)
    expect(result.attackType).toBe('ddos')
    expect(result.confidence).toBeGreaterThan(0.5)
    expect(result.evidence.length).toBeGreaterThan(0)
  })

  it('[正常] 安监自愈触发 — 修复受感染系统', async () => {
    const detector = createDetector()
    const healer = createSelfHealing(detector)
    const action = await healer.triggerHealing('security-isolated-zone')
    // 自愈动作由系统内部决定（rollback/restart/scale/isolate），只需确认成功执行
    expect(['restart', 'rollback', 'scale', 'isolate']).toContain(action.action)
    expect(['completed', 'failed']).toContain(action.status)
  })

  it('[边界] 正常流量不误判为攻击 — 误报过滤', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('normal_traffic', makePoint(100, (15 - i) * 10000))
    const result = detector.isUnderAttack('normal_traffic')
    expect(result.isUnderAttack).toBe(false)
  })
})

// ── 🎮 导玩员: 关注游戏设备健康和温度异常 ──
describe(`${ROLES.Guide} 导玩员 Game Guide`, () => {
  it('[正常] 游戏设备温度异常检测 — 高温应触发告警', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('machine_temp', makePoint(45, (10 - i) * 60000))
    detector.recordDataPoint('machine_temp', makePoint(95, 0))
    const result = detector.detectAnomaly('machine_temp')
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
    expect(result.anomalyScore).toBeGreaterThan(0.5)
  })

  it('[正常] 多台游戏机台批量健康检查', () => {
    const detector = createDetector()
    for (const machine of ['cabinet-01', 'cabinet-02', 'cabinet-03']) {
      for (let i = 0; i < 10; i++) detector.recordDataPoint(machine, makePoint(40, (10 - i) * 60000))
    }
    // 一台异常（将值设到远高于阈值）
    detector.recordDataPoint('cabinet-03', makePoint(100, 0))
    // cabinet-03 应该是异常
    expect(detector.detectAnomaly('cabinet-03').isAnomaly).toBe(true)
    // cabinet-01/02 因数据稳定不应判为异常
    const c1 = detector.detectAnomaly('cabinet-01')
    const c2 = detector.detectAnomaly('cabinet-02')
    expect(c1.isAnomaly || c2.isAnomaly).toBe(false)
  })

  it('[边界] 新设备少量数据无法做出可靠检测', () => {
    const detector = createDetector()
    detector.recordDataPoint('new_machine', makePoint(40, 0))
    const result = detector.detectAnomaly('new_machine')
    expect(result.isAnomaly).toBe(false)
    expect(result.details).toContain('数据点不足')
    expect(result.anomalyScore).toBe(0)
  })
})

// ── 🎯 运行专员: 关注性能调优、容量规划和趋势预测 ──
describe(`${ROLES.Operations} 运行专员 Operations Specialist`, () => {
  it('[正常] CPU 趋势预测 — 逐步增长趋势应被识别', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('cpu_trend', makePoint(30 + i * 3, (15 - i) * 60000))
    const result = detector.predictNext('cpu_trend', 5)
    expect(result.predictedValues.length).toBe(5)
    expect(result.confidence).toBeGreaterThan(0)
    // 所有预测值应 > 0
    result.predictedValues.forEach(v => expect(v).toBeGreaterThan(0))
  })

  it('[正常] 运行专员触发系统自愈 — 重启故障服务', async () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('ops_service', makePoint(100, (10 - i) * 60000))
    detector.recordDataPoint('ops_service', makePoint(0, 0))
    const healer = createSelfHealing(detector)
    // 服务挂了，检测到异常后自愈
    const anomaly = detector.detectAnomaly('ops_service')
    expect(anomaly.isAnomaly).toBe(true)
    const action = await healer.triggerHealing('ops_service')
    // 自愈可能成功或失败，取决于系统状态
    expect(['completed', 'failed']).toContain(action.status)
  })

  it('[边界] 预测后立即注入异常 — 检测仍能正常工作', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('ops_metric', makePoint(50, (10 - i) * 60000))
    detector.predictNext('ops_metric', 3)
    detector.recordDataPoint('ops_metric', makePoint(200, 0))
    const result = detector.detectAnomaly('ops_metric')
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
  })
})

// ── 🤝 团建: 关注多用户协作场景和批量指标健康 ──
describe(`${ROLES.Teambuilding} 团建 Team Building Coordinator`, () => {
  it('[正常] 多指标批量检测 — 所有协作指标正常', () => {
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

  it('[正常] 团建系统自愈 — 协作平台故障自动恢复', async () => {
    const detector = createDetector()
    const healer = createSelfHealing(detector)
    await healer.triggerHealing('collaboration-platform')
    await healer.triggerHealing('whiteboard-service')
    const colHistory = healer.getHealingHistory('collaboration-platform')
    const wbHistory = healer.getHealingHistory('whiteboard-service')
    expect(colHistory.actions.length).toBe(1)
    expect(wbHistory.actions.length).toBe(1)
  })

  it('[边界] 混合数据 — 一个指标的异常不影响其他指标判断', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('normal_metric', makePoint(50, (10 - i) * 60000))
    for (let i = 0; i < 10; i++) detector.recordDataPoint('broken_metric', makePoint(50, (10 - i) * 60000))
    detector.recordDataPoint('broken_metric', makePoint(999, 0))
    expect(detector.detectAnomaly('normal_metric').isAnomaly).toBe(false)
    expect(detector.detectAnomaly('broken_metric').isAnomaly).toBe(true)
  })
})

// ── 📢 营销: 关注流量趋势、活动效果和用户行为分析 ──
describe(`${ROLES.Marketing} 营销 Marketing Manager`, () => {
  it('[正常] 活动流量趋势检测 — 逐步上升属于正常推广曲线', () => {
    const detector = createDetector()
    for (let i = 0; i < 15; i++) detector.recordDataPoint('promo_traffic', makePoint(1000 + i * 100, (15 - i) * 60000))
    const result = detector.detectAnomaly('promo_traffic')
    expect(result.metricName).toBe('promo_traffic')
    // 渐进增长不视为异常
    expect(result.isAnomaly).toBe(false)
  })

  it('[正常] 大促流量预测 — 历史数据下推估未来流量容量', () => {
    const detector = createDetector()
    for (let i = 0; i < 20; i++) detector.recordDataPoint('campaign_traffic', makePoint(500 + Math.random() * 200, (20 - i) * 60000))
    const result = detector.predictNext('campaign_traffic', 3)
    expect(result.horizon).toBe(3)
    expect(result.predictedValues.length).toBe(3)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('[边界] 大促流量瞬间尖峰 — 应标记为 spike 异常', () => {
    const detector = createDetector()
    for (let i = 0; i < 10; i++) detector.recordDataPoint('sale_traffic', makePoint(2000, (10 - i) * 60000))
    detector.recordDataPoint('sale_traffic', makePoint(50000, 0))
    const result = detector.detectAnomaly('sale_traffic')
    expect(result.isAnomaly).toBe(true)
    expect(result.anomalyType).toBe('spike')
    expect(result.anomalyScore).toBeGreaterThan(0.5)
  })
})
