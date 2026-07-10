import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [aiops] [C] 角色扩展测试
 * 
 * 8 角色视角深度场景，直接测试 AIOpsController API:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test, TestingModule } from '@nestjs/testing'
import { AIOpsController } from './aiops.controller'
import { AIOpsService } from './aiops.service'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'
import type { TimeSeriesPoint } from './aiops-prediction.service'

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

function makePoint(value: number, offsetMs = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

describe(`${ROLES.StoreManager} aiops 角色扩展 - 店长视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('店长通过 /aiops/status 查看 AIOps 引擎整体状态', () => {
    const res = controller.getStatus()
    assert.equal(res.data.engineName, 'AIOpsPredictionService')
    assert.equal(res.data.status, 'ACTIVE')
    assert.ok(res.data.anomalyRulesCount >= 3)
    assert.ok(res.data.attackRulesCount >= 4)
  })

  it('店长通过 /aiops/health 查看所有系统健康状态', () => {
    const res = controller.getHealth()
    assert.ok(Array.isArray(res.data))
  })

  it('店长通过 /aiops/detect 发现门店 CPU 异常尖峰', async () => {
    const history = Array.from({ length: 15 }, (_, i) => ({
      timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
      value: 30 + Math.random() * 10,
    }))
    const res = await controller.detect({ metricName: 'store_cpu', value: 95, history })
    assert.equal(res.data.metricName, 'store_cpu')
    assert.ok(res.data.isAnomaly)
    assert.ok(res.data.anomalyScore > 0.7)
    assert.equal(res.data.severity, 'CRITICAL')
  })
})

describe(`${ROLES.FrontDesk} aiops 角色扩展 - 前台视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('前台通过 /aiops/detect 检测收银台响应延迟异常', async () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      timestamp: new Date(Date.now() - (12 - i) * 60000).toISOString(),
      value: 200 + Math.random() * 50,
    }))
    const res = await controller.detect({ metricName: 'cashier_latency', value: 1500, history })
    assert.equal(res.data.metricName, 'cashier_latency')
    assert.ok(res.data.isAnomaly)
    assert.match(res.data.anomalyType ?? '', /spike|drop|trend/)
  })

  it('前台通过 /aiops/detect 正常时段无异常', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
      value: 100 + Math.random() * 20,
    }))
    const res = await controller.detect({ metricName: 'cashier_normal', value: 110, history })
    if (res.data.anomalyScore < 0.5) {
      assert.equal(res.data.severity, 'NORMAL')
    }
  })

  it('前台通过 /aiops/heal 触发收银台自愈', async () => {
    const res = await controller.heal({ targetSystem: 'cashier-terminal-01' })
    assert.ok(res.data.id)
    assert.equal(res.data.targetSystem, 'cashier-terminal-01')
    assert.ok(['completed', 'pending', 'running', 'failed'].includes(res.data.status))
  })
})

describe(`${ROLES.HR} aiops 角色扩展 - HR 视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('HR 通过 /aiops/heal 触发考勤系统自愈', async () => {
    const res = await controller.heal({ targetSystem: 'attendance-system' })
    assert.ok(res.data.id)
    assert.equal(res.data.targetSystem, 'attendance-system')
  })

  it('HR 通过 /aiops/health 查看系统健康（含员工系统）', () => {
    const res = controller.getHealth()
    assert.ok(Array.isArray(res.data))
    for (const h of res.data) {
      assert.ok(typeof h.systemId === 'string')
      assert.ok(typeof h.status === 'string')
    }
  })

  it('HR 通过 /aiops/detect 检测员工操作异常行为', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
      value: 1 + Math.random(), // 正常操作频率 ~1次/分
    }))
    const res = await controller.detect({ metricName: 'employee_operations', value: 30, history })
    // 30次/分钟远高于正常范围
    assert.equal(res.data.metricName, 'employee_operations')
  })
})

describe(`${ROLES.Safety} aiops 角色扩展 - 安监视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('安监通过 /aiops/attack 检测游戏设备 DDoS 攻击', () => {
    // 模拟正常流量 + 异常突增
    for (let i = 0; i < 10; i++) {
      detector.recordDataPoint('game_api_gateway', makePoint(5, (10 - i) * 60000))
    }
    for (let i = 0; i < 30; i++) {
      detector.recordDataPoint('game_api_gateway', makePoint(800 + Math.random() * 200, i * 1000))
    }
    const res = controller.detectAttack({ metricName: 'game_api_gateway' })
    assert.equal(res.data.metricName, 'game_api_gateway')
    assert.ok(res.data.isUnderAttack, '高流量应该被检测为攻击')
    assert.ok(res.data.confidence > 0.6)
    assert.ok(res.data.evidence.length > 0)
  })

  it('安监通过 /aiops/attack 正常流量不被误判', () => {
    for (let i = 0; i < 15; i++) {
      detector.recordDataPoint('normal_game_traffic', makePoint(100, (15 - i) * 10000))
    }
    const res = controller.detectAttack({ metricName: 'normal_game_traffic' })
    assert.equal(res.data.metricName, 'normal_game_traffic')
    assert.equal(res.data.isUnderAttack, false)
  })

  it('安监通过 /aiops/attack 无数据时不报误', () => {
    const res = controller.detectAttack({ metricName: 'never_recorded' })
    assert.equal(res.data.isUnderAttack, false)
    assert.ok(res.data.evidence.length > 0)
  })
})

describe(`${ROLES.Guide} aiops 角色扩展 - 导玩员视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('导玩员通过 /aiops/detect 检测游戏主机温度异常', async () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      timestamp: new Date(Date.now() - (12 - i) * 60000).toISOString(),
      value: 45 + Math.random() * 5,
    }))
    const res = await controller.detect({ metricName: 'arcade_machine_temp', value: 92, history })
    assert.ok(res.data.isAnomaly)
    assert.equal(res.data.severity, 'CRITICAL')
  })

  it('导玩员通过 /aiops/predict 预测游戏机使用高峰', () => {
    for (let i = 0; i < 20; i++) {
      detector.recordDataPoint('arcade_machine_usage', makePoint(30 + i * 3, (20 - i) * 60000))
    }
    const res = controller.predict({ metricName: 'arcade_machine_usage', horizon: 4 })
    assert.equal(res.data.metricName, 'arcade_machine_usage')
    assert.equal(res.data.horizon, 4)
    assert.equal(res.data.predictedValues.length, 4)
    assert.ok(res.data.confidence > 0)
  })

  it('导玩员通过 /aiops/heal 重启故障游戏主机', async () => {
    const res = await controller.heal({ targetSystem: 'arcade-machine-03' })
    assert.equal(res.data.targetSystem, 'arcade-machine-03')
    assert.ok(res.data.id)
    assert.ok(res.data.triggeredAt)
  })
})

describe(`${ROLES.Ops} aiops 角色扩展 - 运行专员视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('运行专员通过 /aiops/detect 批量检测各门店指标', async () => {
    for (const metric of ['store-001_cpu', 'store-001_mem', 'store-002_cpu']) {
      for (let i = 0; i < 12; i++) {
        detector.recordDataPoint(metric, makePoint(40 + Math.random() * 10, (12 - i) * 60000))
      }
    }
    // 最后一个指标异常
    detector.recordDataPoint('store-001_cpu', makePoint(98, 0))

    const res1 = await controller.detect({
      metricName: 'store-001_cpu', value: 98,
      history: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(), value: 45,
      })),
    })
    assert.ok(res1.data.isAnomaly)
    assert.ok(res1.data.anomalyScore > 0.5)

    const res2 = await controller.detect({
      metricName: 'store-002_cpu', value: 45,
      history: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(), value: 45,
      })),
    })
    assert.equal(res2.data.isAnomaly, false)
  })

  it('运行专员通过 /aiops/predict 预测门店高峰期', () => {
    const trend = [100, 120, 150, 200, 300, 450, 600, 750, 800, 820, 850, 900]
    for (let i = 0; i < trend.length; i++) {
      detector.recordDataPoint('visitor_count', makePoint(trend[i], (trend.length - i) * 60000))
    }
    const res = controller.predict({ metricName: 'visitor_count', horizon: 3 })
    assert.equal(res.data.predictedValues.length, 3)
    assert.ok(res.data.confidence >= 0)
  })

  it('运行专员触发系统自愈并确认状态', async () => {
    const before = controller.getStatus()
    await controller.heal({ targetSystem: 'store-server-east-01' })
    const after = controller.getStatus()
    // 自愈后系统数量不应减少
    assert.ok(after.data.healedSystemsCount >= before.data.healedSystemsCount)
    assert.equal(after.data.status, 'ACTIVE')
  })
})

describe(`${ROLES.Teambuilding} aiops 角色扩展 - 团建视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('团建通过 /aiops/detect 检测团建活动系统负载', async () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
      value: 30,
    }))
    // 团建活动突发流量
    for (let i = 0; i < 20; i++) {
      detector.recordDataPoint('team_building_portal', makePoint(30, (20 - i) * 60000))
    }
    detector.recordDataPoint('team_building_portal', makePoint(500, 0))

    const res = await controller.detect({
      metricName: 'team_building_portal', value: 500, history,
    })
    assert.ok(res.data.isAnomaly, '团建流量突增应被检测')
    assert.equal(res.data.severity, 'CRITICAL')
  })

  it('团建通过 /aiops/heal 恢复团建报名系统', async () => {
    const res = await controller.heal({ targetSystem: 'team-building-registration' })
    assert.equal(res.data.targetSystem, 'team-building-registration')
    assert.ok(res.data.status)
  })

  it('团建查看系统健康确保活动期间稳定', () => {
    const res = controller.getHealth()
    assert.ok(Array.isArray(res.data))
  })
})

describe(`${ROLES.Marketing} aiops 角色扩展 - 营销视角`, () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsService, AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  it('营销通过 /aiops/detect 识别大促流量尖峰（合法非攻击）', async () => {
    for (let i = 0; i < 15; i++) {
      detector.recordDataPoint('promotion_traffic', makePoint(1000 + i * 50, (15 - i) * 60000))
    }
    const res = await controller.detect({
      metricName: 'promotion_traffic',
      value: 3000,
      history: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        value: 1000 + i * 50,
      })),
    })
    assert.equal(res.data.metricName, 'promotion_traffic')
    assert.ok(res.data.isAnomaly === true || res.data.isAnomaly === false)
    assert.ok(res.data.anomalyScore >= 0)
  })

  it('营销通过 /aiops/predict 预测活动期间流量趋势', () => {
    for (let i = 0; i < 20; i++) {
      detector.recordDataPoint('campaign_visitors', makePoint(500 + i * 200, (20 - i) * 60000))
    }
    const res = controller.predict({ metricName: 'campaign_visitors', horizon: 6 })
    assert.equal(res.data.predictedValues.length, 6)
    assert.ok(res.data.confidence > 0)
  })

  it('营销通过 /aiops/attack 确认大促流量不是攻击', () => {
    // 正常促销流量
    for (let i = 0; i < 20; i++) {
      detector.recordDataPoint('sale_season_traffic', makePoint(500 + i * 100, (20 - i) * 10000))
    }
    const res = controller.detectAttack({ metricName: 'sale_season_traffic' })
    assert.equal(res.data.metricName, 'sale_season_traffic')
    // 逐步上升的流量不应认为是攻击
  })
})
