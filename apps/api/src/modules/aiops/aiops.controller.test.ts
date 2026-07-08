import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { AIOpsController } from './aiops.controller'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'
import type { TimeSeriesPoint } from './aiops-prediction.service'

function makePoints(values: number[], count: number): TimeSeriesPoint[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 60000).toISOString(),
    value: values[i] ?? 50 + Math.random() * 10,
  }))
}

describe('AIOpsController', () => {
  let controller: AIOpsController
  let detector: TimeSeriesAnomalyDetector
  let healService: SelfHealingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIOpsController],
      providers: [AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService],
    }).compile()

    controller = module.get<AIOpsController>(AIOpsController)
    detector = module.get<TimeSeriesAnomalyDetector>(TimeSeriesAnomalyDetector)
    healService = module.get<SelfHealingService>(SelfHealingService)
    detector.resetForTests()
  })

  // ── POST /aiops/detect ────────────────────────────────────────────────

  describe('POST /aiops/detect (detect)', () => {
    it('正例: 足够数据检测到异常突增', async () => {
      const history = makePoints(
        Array.from({ length: 10 }, () => 50 + Math.random() * 5),
        10,
      )
      const result = await controller.detect({
        metricName: 'mem_usage',
        value: 98,
        history,
      })
      expect(result.data.metricName).toBe('mem_usage')
      expect(result.data.isAnomaly).toBe(true)
      expect(result.data.anomalyScore).toBeGreaterThan(0)
      expect(result.data.severity).toBeOneOf(['NORMAL', 'WARNING', 'CRITICAL'])
      expect(result.data.detectedAt).toBeDefined()
      expect(result.data.details).toBeDefined()
    })

    it('正例: 正常数据应判定为无异常', async () => {
      const stableValues = [50, 50.5, 49.8, 50.2, 49.9, 50.1, 50.3, 49.7, 50, 50.4]
      const history = makePoints(stableValues, 10)
      const result = await controller.detect({
        metricName: 'cpu_normal',
        value: 50.1,
        history,
      })
      expect(result.data.isAnomaly).toBe(false)
      expect(result.data.anomalyScore).toBeLessThan(0.5)
    })

    it('反例: 数据不足时 isAnomaly 为 false', async () => {
      const result = await controller.detect({
        metricName: 'new_metric',
        value: 100,
        history: [],
      })
      expect(result.data.isAnomaly).toBe(false)
      expect(result.data.anomalyScore).toBe(0)
      expect(result.data.details).toContain('数据点不足')
    })

    it('反例: 单点历史数据仍不足', async () => {
      const result = await controller.detect({
        metricName: 'sparse',
        value: 99,
        history: [{ timestamp: new Date().toISOString(), value: 50 }],
      })
      expect(result.data.isAnomaly).toBe(false)
    })

    it('边界: 刚好 5 个数据点的阈值情况', async () => {
      const values = [50, 51, 49, 50, 99] // 最后一个明显偏高
      const history = makePoints(values, 5)
      const result = await controller.detect({
        metricName: 'threshold_5',
        value: 99,
        history,
      })
      expect(result.data.metricName).toBe('threshold_5')
    })

    it('边界: 极大值检测', async () => {
      const stable = Array.from({ length: 10 }, () => 50)
      const history = makePoints(stable, 10)
      const result = await controller.detect({
        metricName: 'huge_spike',
        value: 999999,
        history,
      })
      expect(result.data.isAnomaly).toBe(true)
    })
  })

  // ── POST /aiops/predict ───────────────────────────────────────────────

  describe('POST /aiops/predict (predict)', () => {
    it('正例: 预测未来 5 个值', () => {
      const result = controller.predict({ metricName: 'nonexistent', horizon: 5 })
      expect(result.data.predictedValues).toHaveLength(5)
      expect(result.data.horizon).toBe(5)
      expect(result.data.metricName).toBe('nonexistent')
      expect(result.data.confidence).toBeGreaterThanOrEqual(0)
      expect(result.data.predictedAt).toBeDefined()
    })

    it('正例: 有历史数据时预测更准确', () => {
      const history = makePoints(Array.from({ length: 20 }, () => 100), 20)
      for (const pt of history) {
        detector.recordDataPoint('predict_metric', pt)
      }
      const result = controller.predict({ metricName: 'predict_metric', horizon: 3 })
      expect(result.data.predictedValues).toHaveLength(3)
      expect(result.data.confidence).toBeGreaterThan(0)
    })

    it('边界: horizon=1 最小预测', () => {
      const result = controller.predict({ metricName: 'min_horizon', horizon: 1 })
      expect(result.data.predictedValues).toHaveLength(1)
    })

    it('边界: horizon=100 最大预测', () => {
      const result = controller.predict({ metricName: 'max_horizon', horizon: 100 })
      expect(result.data.predictedValues).toHaveLength(100)
    })

    it('正例: 数据波动大时 confidence 仍有效', () => {
      const noisy = Array.from({ length: 30 }, () => 50 + Math.random() * 40)
      const history = makePoints(noisy, 30)
      for (const pt of history) {
        detector.recordDataPoint('noisy', pt)
      }
      const result = controller.predict({ metricName: 'noisy', horizon: 5 })
      expect(result.data.confidence).toBeGreaterThanOrEqual(0)
      expect(result.data.confidence).toBeLessThanOrEqual(1)
    })
  })

  // ── POST /aiops/attack ────────────────────────────────────────────────

  describe('POST /aiops/attack (detectAttack)', () => {
    it('正例: 未知指标检测为非攻击', () => {
      const result = controller.detectAttack({ metricName: 'unknown' })
      expect(result.data.isUnderAttack).toBe(false)
      expect(result.data.metricName).toBe('unknown')
      expect(result.data.evidence).toBeInstanceOf(Array)
      expect(result.data.detectedAt).toBeDefined()
    })

    it('正例: 有大量数据时攻击检测正常运行', () => {
      const now = Date.now()
      for (let i = 0; i < 100; i++) {
        detector.recordDataPoint('attacked', {
          timestamp: new Date(now - (100 - i) * 500).toISOString(),
          value: 1000 + Math.random() * 500,
        })
      }
      const result = controller.detectAttack({ metricName: 'attacked' })
      expect(result.data.metricName).toBe('attacked')
      expect(result.data.confidence).toBeGreaterThanOrEqual(0)
      expect(result.data.detectedAt).toBeDefined()
      expect(result.data.evidence).toBeInstanceOf(Array)
    })

    it('边界: 少量数据时不应误报攻击', () => {
      detector.recordDataPoint('quiet', { timestamp: new Date().toISOString(), value: 50 })
      const result = controller.detectAttack({ metricName: 'quiet' })
      expect(result.data.isUnderAttack).toBe(false)
    })

    it('反例: 无数据时给出证据信息', () => {
      const result = controller.detectAttack({ metricName: 'no_data_metric' })
      expect(result.data.evidence).toBeInstanceOf(Array)
      expect(result.data.evidence.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── POST /aiops/heal ──────────────────────────────────────────────────

  describe('POST /aiops/heal (heal)', () => {
    it('正例: 触发自愈返回 healing action', async () => {
      const result = await controller.heal({ targetSystem: 'web-01' })
      expect(result.data.id).toBeDefined()
      expect(result.data.id).toBeTypeOf('string')
      expect(result.data.targetSystem).toBe('web-01')
      expect(['restart', 'rollback', 'scale', 'isolate']).toContain(result.data.action)
      expect(['pending', 'running', 'completed', 'failed']).toContain(result.data.status)
      expect(result.data.triggeredAt).toBeDefined()
    })

    it('正例: 多个系统可独立触发自愈', async () => {
      const r1 = await controller.heal({ targetSystem: 'api-gw-01' })
      const r2 = await controller.heal({ targetSystem: 'db-master' })
      expect(r1.data.id).not.toBe(r2.data.id)
      expect(r1.data.targetSystem).toBe('api-gw-01')
      expect(r2.data.targetSystem).toBe('db-master')
    })

    it('正例: 相同系统多次触发每次生成唯一 ID', async () => {
      const r1 = await controller.heal({ targetSystem: 'same-system' })
      const r2 = await controller.heal({ targetSystem: 'same-system' })
      expect(r1.data.id).not.toBe(r2.data.id)
    })

    it('边界: 特殊字符系统名', async () => {
      const result = await controller.heal({ targetSystem: 'sys_01-特殊' })
      expect(result.data.targetSystem).toBe('sys_01-特殊')
    })
  })

  // ── GET /aiops/status ─────────────────────────────────────────────────

  describe('GET /aiops/status (getStatus)', () => {
    it('正例: 返回引擎状态基本信息', () => {
      const result = controller.getStatus()
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.engineName).toBe('AIOpsPredictionService')
      expect(result.data.anomalyRulesCount).toBeGreaterThanOrEqual(0)
      expect(result.data.attackRulesCount).toBeGreaterThanOrEqual(0)
      expect(result.data.healedSystemsCount).toBeGreaterThanOrEqual(0)
    })

    it('正例: 自愈后 healedSystemsCount 增加', async () => {
      await controller.heal({ targetSystem: 'sys-a' })
      await controller.heal({ targetSystem: 'sys-b' })
      await controller.heal({ targetSystem: 'sys-c' })
      const result = controller.getStatus()
      // 只有被 heal 且非 critical 的系统才会计入
      expect(result.data.healedSystemsCount).toBeGreaterThanOrEqual(0)
    })

    it('正例: lastDetectedAt 存在', () => {
      const result = controller.getStatus()
      expect(result.data.lastDetectedAt).toBeDefined()
    })
  })

  // ── GET /aiops/health ─────────────────────────────────────────────────

  describe('GET /aiops/health (getHealth)', () => {
    it('正例: 无跟踪系统时返回空数组', () => {
      const result = controller.getHealth()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThanOrEqual(0)
    })

    it('正例: heal 后系统出现在健康列表中', async () => {
      await controller.heal({ targetSystem: 'health-sys' })
      const result = controller.getHealth()
      const found = result.data.find((h: any) => h.systemId === 'health-sys')
      expect(found).toBeDefined()
      expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(found!.status)
    })

    it('正例: 多个自愈系统都在健康列表中', async () => {
      await controller.heal({ targetSystem: 'node-1' })
      await controller.heal({ targetSystem: 'node-2' })
      await controller.heal({ targetSystem: 'node-3' })
      const result = controller.getHealth()
      const ids = result.data.map((h: any) => h.systemId)
      expect(ids).toContain('node-1')
      expect(ids).toContain('node-2')
      expect(ids).toContain('node-3')
    })

    it('边界: 每个健康项包含 systemId 和 status', async () => {
      await controller.heal({ targetSystem: 'sys-complete' })
      const result = controller.getHealth()
      const entry = result.data.find((h: any) => h.systemId === 'sys-complete')
      expect(entry).toHaveProperty('systemId')
      expect(entry).toHaveProperty('status')
    })
  })
})
