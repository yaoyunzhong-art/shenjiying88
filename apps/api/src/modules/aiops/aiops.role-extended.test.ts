import { describe, it, expect, beforeEach } from 'vitest'
import {
  AIOpsPredictionService,
  TimeSeriesAnomalyDetector,
  SelfHealingService,
} from './aiops-prediction.service'

/**
 * 🐜 [aiops] 角色扩展测试
 * 覆盖异常检测、预测、攻击检测、自愈的边界场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function setup() {
  const anomalyDetector = new TimeSeriesAnomalyDetector()
  const selfHealingService = new SelfHealingService(anomalyDetector)
  const aiopsService = new AIOpsPredictionService(anomalyDetector, selfHealingService)
  return { anomalyDetector, selfHealingService, aiopsService }
}

describe(`${ROLES.StoreManager} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长检查系统整体状态', async () => {
    await svc.selfHealingService.triggerHealing('system-a')
    const h = svc.selfHealingService.getAllSystemHealth()
    expect(Array.isArray(h)).toBe(true)
  })

  it('店长查看空健康记录返回空数组', () => {
    const h = svc.selfHealingService.getAllSystemHealth()
    expect(h).toHaveLength(0)
  })
})

describe(`${ROLES.FrontDesk} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台记录正常数据点无异常', () => {
    for (let i = 0; i < 10; i++) {
      svc.anomalyDetector.recordDataPoint('visitors', { timestamp: new Date(Date.now() - i * 60000).toISOString(), value: 50 + Math.random() * 10 })
    }
    const r = svc.anomalyDetector.detectAnomaly('visitors')
    expect(r.isAnomaly).toBe(false)
    expect(r.anomalyScore).toBeLessThan(0.5)
  })
})

describe(`${ROLES.HR} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 查看系统健康检查结果', () => {
    const h = svc.selfHealingService.checkHealth('hr-system')
    expect(h.systemId).toBe('hr-system')
    expect(['healthy', 'degraded', 'critical']).toContain(h.status)
    expect(h.metrics).toHaveProperty('cpu_usage')
    expect(h.metrics).toHaveProperty('memory_usage')
  })
})

describe(`${ROLES.Safety} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监检测攻击模式数据不足时返回安全', () => {
    const r = svc.anomalyDetector.isUnderAttack('api-requests')
    expect(r.isUnderAttack).toBe(false)
    expect(r.evidence).toContain('数据不足')
  })

  it('安监回滚系统返回版本信息', async () => {
    const r = await svc.selfHealingService.rollback('system-b')
    expect(r.success).toBe(true)
    expect(r.version).toMatch(/^v\d+/)
  })
})

describe(`${ROLES.Guide} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员预测数据不足时返回 0 置信度', () => {
    const p = svc.anomalyDetector.predictNext('game-popularity', 3)
    expect(p.horizon).toBe(3)
    expect(p.predictedValues).toHaveLength(3)
    expect(p.confidence).toBe(0)
  })
})

describe(`${ROLES.Ops} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员记录批量数据并检测异常', () => {
    const points = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      value: i < 18 ? 100 : 500, // last 2 points are spikes
    }))
    svc.anomalyDetector.recordBatch('cpu', points)
    const r = svc.anomalyDetector.detectAnomaly('cpu')
    expect(r.isAnomaly).toBe(true)
    expect(r.anomalyType).toMatch(/spike|drop/)
  })

  it('运行专员检测到攻击时触发自愈', async () => {
    const now = Date.now()
    for (let i = 0; i < 100; i++) {
      svc.anomalyDetector.recordDataPoint('requests', { timestamp: new Date(now - i * 1000).toISOString(), value: 1000 + Math.random() * 500 })
    }
    const r = await svc.aiopsService.detectAndHeal('requests', 'web-server')
    expect(r.anomaly).toBeDefined()
    expect(r.attack).toBeDefined()
  })
})

describe(`${ROLES.Teambuilding} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建专员获取自愈历史', async () => {
    await svc.selfHealingService.triggerHealing('team-system')
    const h = svc.selfHealingService.getHealingHistory('team-system')
    expect(h.actions.length).toBeGreaterThanOrEqual(1)
    expect(h.actions[0].targetSystem).toBe('team-system')
  })
})

describe(`${ROLES.Marketing} aiops 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销专员记录高并发数据模拟攻击场景', () => {
    const now = Date.now()
    for (let i = 0; i < 60; i++) {
      svc.anomalyDetector.recordDataPoint('traffic', { timestamp: new Date(now - i * 1000).toISOString(), value: i < 50 ? 100 : 5000 })
    }
    const r = svc.anomalyDetector.detectAnomaly('traffic')
    expect(r.isAnomaly).toBe(true)
  })

  it('营销专员查询无历史系统的预测返回空向量', () => {
    const p = svc.anomalyDetector.predictNext('no-data', 2)
    expect(p.predictedValues).toEqual([0, 0])
    expect(p.confidence).toBe(0)
  })
})
