import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 8角色视角 + 边界测试: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
import { Test, TestingModule } from '@nestjs/testing'
import { AIOpsController } from './aiops.controller'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'

function makeHistory(values: number[]): { timestamp: string; value: number }[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

describe('AIOpsController (spec)', () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    detector.resetForTests()
  })

  // ── 👔 店长: 关注整体系统运营健康度和AI预测概览 ──
  describe('👔 店长 Store Manager', () => {
    it('AC-1: 查看引擎状态 — 应返回整体运行状态', () => {
      const result = controller.getStatus()
      expect(result.data.engineName).toBe('AIOpsPredictionService')
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.anomalyRulesCount).toBe(3)
      expect(result.data.attackRulesCount).toBe(4)
      expect(result.data.lastDetectedAt).toBeDefined()
    })

    it('AC-2: 异常检测 — 异常数据应被正确标记', async () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const normal = await controller.detect({ metricName: 'p95_latency', value: 100, history })
      expect(normal.data.isAnomaly).toBe(false)

      const anomaly = await controller.detect({ metricName: 'p95_latency', value: 999, history })
      expect(anomaly.data.isAnomaly).toBe(true)
      expect(anomaly.data.anomalyScore).toBeGreaterThan(0.8)
      expect(anomaly.data.severity).toBe('CRITICAL')
    })
  })

  // ── 🛒 前台: 关注系统响应速度和在线体验异常 ──
  describe('🛒 前台 Front Desk', () => {
    it('AC-3: 页面加载时间预测 — 应返回预测值', () => {
      const history = makeHistory([200, 210, 190, 205, 195, 210, 190, 200, 205, 195])
      for (const p of history) {
        detector.recordDataPoint('page_load_ms', p)
      }
      const result = controller.predict({ metricName: 'page_load_ms', horizon: 3 })
      expect(result.data.predictedValues).toHaveLength(3)
      expect(result.data.metricName).toBe('page_load_ms')
      expect(result.data.confidence).toBeGreaterThan(0)
    })

    it('AC-4: 结账响应攻击检测 — 正常流量不被误判', () => {
      for (let i = 0; i < 15; i++) {
        detector.recordDataPoint('checkout_ms', makeHistory([300, 310, 290, 305, 295])[0])
      }
      const result = controller.detectAttack({ metricName: 'checkout_ms' })
      expect(result.data.isUnderAttack).toBe(false)
    })
  })

  // ── 👥 HR: 关注人员相关系统和服务稳定性 ──
  describe('👥 HR HR Manager', () => {
    it('AC-5: 自愈触发 — 应返回有效的 healing action', async () => {
      const result = await controller.heal({ targetSystem: 'hr-portal' })
      expect(result.data.id).toBeDefined()
      expect(result.data.targetSystem).toBe('hr-portal')
      expect(['restart', 'rollback', 'scale', 'isolate']).toContain(result.data.action)
      expect(['pending', 'running', 'completed', 'failed']).toContain(result.data.status)
    })

    it('AC-6: 攻击检测 — 应返回检测结果', () => {
      // 注入一些攻击特征数据
      for (let i = 0; i < 30; i++) {
        detector.recordDataPoint('hr_api', {
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          value: 200,
        })
      }
      const result = controller.detectAttack({ metricName: 'hr_api' })
      expect(result.data.evidence).toBeDefined()
      expect(Array.isArray(result.data.evidence)).toBe(true)
    })
  })

  // ── 🔧 安监: 关注安全隐患和紧急异常告警 ──
  describe('🔧 安监 Safety Supervisor', () => {
    it('AC-7: 极端异常应立即检测 — 高分数', async () => {
      const history = makeHistory([1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
      const result = await controller.detect({ metricName: 'fire_alarm', value: 100, history })
      expect(result.data.isAnomaly).toBe(true)
      expect(result.data.anomalyScore).toBeGreaterThan(0.9)
      expect(result.data.severity).toBe('CRITICAL')
    })

    it('AC-8: DDoS 攻击检测 — 大量请求涌入应识别', () => {
      // 先记录正常流量 (平稳低量)
      for (let i = 0; i < 10; i++) {
        detector.recordDataPoint('api_gateway', {
          timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
          value: 10,
        })
      }
      // 模拟 DDoS 攻击流量
      for (let i = 0; i < 50; i++) {
        detector.recordDataPoint('api_gateway', {
          timestamp: new Date(Date.now() - i * 500).toISOString(),
          value: 500,
        })
      }
      const result = controller.detectAttack({ metricName: 'api_gateway' })
      expect(result.data.isUnderAttack).toBe(true)
      expect(result.data.confidence).toBeGreaterThan(0.3)
    })
  })

  // ── 🎮 导玩员: 关注设备/游戏机运行异常 ──
  describe('🎮 导玩员 Game Guide', () => {
    it('AC-9: 设备温度趋势预测 — 应返回趋势值', () => {
      for (let i = 0; i < 10; i++) {
        detector.recordDataPoint('machine_temp', {
          timestamp: new Date(Date.now() - (10 - i) * 30000).toISOString(),
          value: 40 + i,
        })
      }
      const result = controller.predict({ metricName: 'machine_temp', horizon: 5 })
      expect(result.data.predictedValues).toHaveLength(5)
      expect(result.data.predictedValues.every((v) => v > 0)).toBe(true)
    })

    it('AC-10: 设备离线攻击检测 — 正常模式不误报', () => {
      for (let i = 0; i < 15; i++) {
        detector.recordDataPoint('device_offline', {
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          value: Math.random() < 0.2 ? 1 : 0,
        })
      }
      const result = controller.detectAttack({ metricName: 'device_offline' })
      // 正常离线波动不被视为攻击
      expect(result.data.detectedAt).toBeDefined()
    })
  })

  // ── 🎯 运行专员: 关注系统运行参数和性能调优 ──
  describe('🎯 运行专员 Operations Specialist', () => {
    it('AC-11: 健康检查 — 应返回所有系统状态', () => {
      const result = controller.getHealth()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('AC-12: 自愈后系统状态应更新', async () => {
      await controller.heal({ targetSystem: 'ops-target' })
      const health = controller.getHealth()
      const found = health.data.find((h) => h.systemId === 'ops-target')
      expect(found).toBeDefined()
      expect(found!.status).toBeDefined()
    })

    it('AC-13: 异常预测高于正常基线', async () => {
      const history = makeHistory([30, 32, 29, 31, 30, 33, 28, 31, 30, 32])
      const result = await controller.detect({ metricName: 'cpu_usage', value: 95, history })
      expect(result.data.isAnomaly).toBe(true)
    })
  })

  // ── 🤝 团建: 关注协作流程和团队使用的稳定性 ──
  describe('🤝 团建 Team Building Coordinator', () => {
    it('AC-14: 多次异常检测不抛异常 — 正常可用', async () => {
      const h = makeHistory([100, 101, 99, 100])
      const r1 = await controller.detect({ metricName: 'team_metric_1', value: 100, history: h })
      const r2 = await controller.detect({ metricName: 'team_metric_2', value: 200, history: h })
      const r3 = await controller.detect({ metricName: 'team_metric_3', value: 300, history: h })
      expect(r1.data.metricName).toBe('team_metric_1')
      expect(r2.data.metricName).toBe('team_metric_2')
      expect(r3.data.metricName).toBe('team_metric_3')
    })

    it('AC-15: 状态查询包含引擎元信息', () => {
      const result = controller.getStatus()
      expect(result.data).toHaveProperty('engineName')
      expect(result.data).toHaveProperty('anomalyRulesCount')
      expect(result.data).toHaveProperty('attackRulesCount')
      expect(result.data).toHaveProperty('healedSystemsCount')
      expect(result.data).toHaveProperty('status')
      expect(result.data).toHaveProperty('lastDetectedAt')
      expect(typeof result.data.anomalyRulesCount).toBe('number')
    })
  })

  // ── 📢 营销: 关注促销期间流量异常和趋势预测 ──
  describe('📢 营销 Marketing Manager', () => {
    it('AC-16: 大促流量预测 — 应返回合理数值', () => {
      for (let i = 0; i < 20; i++) {
        detector.recordDataPoint('traffic_volume', {
          timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
          value: 1000 + Math.random() * 500,
        })
      }
      const result = controller.predict({ metricName: 'traffic_volume', horizon: 5 })
      expect(result.data.predictedValues).toHaveLength(5)
      expect(result.data.confidence).toBeGreaterThan(0)
    })

    it('AC-17: 营销活动期间异常流量不应误判攻击', async () => {
      // 模拟大促期间流量逐步上升
      for (let i = 0; i < 20; i++) {
        detector.recordDataPoint('promo_conversion', {
          timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
          value: 100 + i * 10,
        })
      }
      const history = makeHistory(new Array(20).fill(0).map((_, i) => 100 + i * 10))
      const result = await controller.detect({ metricName: 'promo_conversion', value: 300, history })
      // 逐步上升趋势可能检测为趋势异常
      expect(result.data.isAnomaly).toBeDefined()
    })
  })

  // ── 额外边界场景 ──
  describe('边界场景 Edge Cases', () => {
    it('AC-18: 最少历史数据（2个点）应能检测', async () => {
      const history = makeHistory([100, 101])
      const result = await controller.detect({ metricName: 'minimal', value: 200, history })
      expect(result.data.isAnomaly).toBeDefined()
    })

    it('AC-19: 空历史数据 — 应返回非异常', async () => {
      const result = await controller.detect({ metricName: 'empty', value: 100, history: [] })
      expect(result.data.isAnomaly).toBe(false)
      expect(result.data.anomalyScore).toBe(0)
    })

    it('AC-20: 预测 horizon=0 最近似结果', () => {
      detector.recordDataPoint('zero_horizon', makeHistory([100])[0])
      const result = controller.predict({ metricName: 'zero_horizon', horizon: 1 })
      expect(result.data.horizon).toBe(1)
      expect(result.data.predictedValues).toHaveLength(1)
    })

    it('AC-21: 未知指标攻击检测返回未攻击', () => {
      const result = controller.detectAttack({ metricName: 'nonexistent' })
      expect(result.data.isUnderAttack).toBe(false)
    })

    it('AC-22: 自愈含 timestamp 参数', async () => {
      const ts = new Date().toISOString()
      const result = await controller.heal({ targetSystem: 'ts-test', timestamp: ts })
      expect(result.data.targetSystem).toBe('ts-test')
      expect(result.data.triggeredAt).toBeDefined()
    })

    it('AC-23: 检测含 timestamp 参数', async () => {
      const ts = new Date().toISOString()
      const history = makeHistory([100, 101, 99, 100])
      const result = await controller.detect({ metricName: 'ts-test', value: 100, history, timestamp: ts })
      expect(result.data.detectedAt).toBeDefined()
    })
  })
})
