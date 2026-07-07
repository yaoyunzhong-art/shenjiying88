import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: AIOps 异常预测 + 自愈 单元测试 (22 tests)
import {
  TimeSeriesAnomalyDetector,
  SelfHealingService,
  AIOpsPredictionService,
  type TimeSeriesPoint,
} from './aiops-prediction.service'

// ─── 辅助工厂 ───

function makePoint(value: number, offsetMs: number = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

function createDetector() {
  return new TimeSeriesAnomalyDetector()
}

function createSelfHealing(detector?: TimeSeriesAnomalyDetector) {
  return new SelfHealingService(detector || createDetector())
}

function createAIOps() {
  const detector = createDetector()
  const healer = createSelfHealing(detector)
  return new AIOpsPredictionService(detector, healer)
}

// ─── TimeSeriesAnomalyDetector ───

describe('TimeSeriesAnomalyDetector', () => {
  let detector: TimeSeriesAnomalyDetector

  beforeEach(() => {
    detector = createDetector()
  })

  // ── recordDataPoint / recordBatch ──

  describe('recordDataPoint', () => {
    it('should record a single data point', () => {
      const point = makePoint(100, 0)
      detector.recordDataPoint('cpu_usage', point)

      const data = detector.getData('cpu_usage')
      expect(data).toHaveLength(1)
      expect(data[0].value).toBe(100)
    })

    it('should append points without overwriting', () => {
      detector.recordDataPoint('requests', makePoint(10, 60000))
      detector.recordDataPoint('requests', makePoint(20, 30000))
      detector.recordDataPoint('requests', makePoint(30, 0))

      const data = detector.getData('requests')
      expect(data).toHaveLength(3)
    })

    it('should evict points older than 24h', () => {
      detector.recordDataPoint('latency', makePoint(100, 25 * 60 * 60 * 1000)) // 25小时前
      detector.recordDataPoint('latency', makePoint(200, 0)) // 现在

      const data = detector.getData('latency')
      expect(data).toHaveLength(1)
      expect(data[0].value).toBe(200)
    })
  })

  describe('recordBatch', () => {
    it('should record multiple points at once', () => {
      const points = [makePoint(10, 40000), makePoint(20, 30000), makePoint(30, 20000)]
      const count = detector.recordBatch('requests', points)

      expect(count).toBe(3)
      expect(detector.getData('requests')).toHaveLength(3)
    })

    it('should return 0 for empty batch', () => {
      const count = detector.recordBatch('empty', [])
      expect(count).toBe(0)
    })
  })

  // ── detectAnomaly ──

  describe('detectAnomaly', () => {
    it('should return no anomaly for normal data', () => {
      // 正常波动数据
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(102, 40000),
        makePoint(98, 30000),
        makePoint(101, 20000),
        makePoint(99, 10000),
        makePoint(100, 0),
      ]
      detector.recordBatch('normal_metric', points)

      const result = detector.detectAnomaly('normal_metric')
      expect(result.isAnomaly).toBe(false)
      expect(result.anomalyScore).toBeLessThan(0.5)
    })

    it('should detect spike anomaly', () => {
      // 正常数据中突然出现尖峰
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(102, 40000),
        makePoint(99, 30000),
        makePoint(101, 20000),
        makePoint(98, 10000),
        makePoint(500, 0), // 突增到500
      ]
      detector.recordBatch('spike_metric', points)

      const result = detector.detectAnomaly('spike_metric')
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyType).toBe('spike')
      expect(result.anomalyScore).toBeGreaterThan(0.5)
    })

    it('should detect drop anomaly', () => {
      // 正常数据中突然下降
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(102, 40000),
        makePoint(99, 30000),
        makePoint(101, 20000),
        makePoint(98, 10000),
        makePoint(5, 0), // 突降到5
      ]
      detector.recordBatch('drop_metric', points)

      const result = detector.detectAnomaly('drop_metric')
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyType).toBe('drop')
    })

    it('should detect trend anomaly', () => {
      // 先平稳，然后持续上升
      const points: TimeSeriesPoint[] = []
      for (let i = 0; i < 5; i++) {
        points.push(makePoint(100 + i * 2, (20 - i) * 10000)) // 缓慢上升
      }
      for (let i = 0; i < 5; i++) {
        points.push(makePoint(110 + i * 20, (5 - i) * 10000)) // 快速上升
      }
      detector.recordBatch('trend_metric', points)

      const result = detector.detectAnomaly('trend_metric')
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyType).toBe('trend')
    })

    it('should return insufficient data for < 5 points', () => {
      detector.recordDataPoint('few_points', makePoint(100, 0))
      detector.recordDataPoint('few_points', makePoint(200, 0))

      const result = detector.detectAnomaly('few_points')
      expect(result.isAnomaly).toBe(false)
      expect(result.details).toContain('数据点不足')
    })
  })

  // ── predictNext ──

  describe('predictNext', () => {
    it('should predict future values based on historical data', () => {
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(110, 40000),
        makePoint(120, 30000),
        makePoint(130, 20000),
        makePoint(140, 10000),
        makePoint(150, 0),
      ]
      detector.recordBatch('growing_metric', points)

      const result = detector.predictNext('growing_metric', 3)
      expect(result.predictedValues).toHaveLength(3)
      expect(result.metricName).toBe('growing_metric')
      expect(result.horizon).toBe(3)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should return zero predictions for insufficient data', () => {
      detector.recordDataPoint('sparse', makePoint(100, 0))

      const result = detector.predictNext('sparse', 5)
      expect(result.predictedValues).toHaveLength(5)
      expect(result.confidence).toBe(0)
    })

    it('should return zero predictions for nonexistent metric', () => {
      const result = detector.predictNext('ghost', 3)
      expect(result.predictedValues).toHaveLength(3)
      expect(result.predictedValues.every((v) => v === 0)).toBe(true)
    })
  })

  // ── isUnderAttack ──

  describe('isUnderAttack', () => {
    it('should detect DDoS attack via sudden traffic spike', () => {
      // 先记录正常流量 (older window: T-6min to T-1min)
      for (let i = 0; i < 6; i++) {
        detector.recordDataPoint('api_requests', makePoint(10, (6 - i) * 60000))
      }
      // 然后大量请求涌入（模拟DDoS）- recent window: T-60s to now
      for (let i = 0; i < 30; i++) {
        detector.recordDataPoint('api_requests', makePoint(200, i * 2000))
      }

      const result = detector.isUnderAttack('api_requests')
      expect(result.isUnderAttack).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.3)
      expect(result.attackType).toBe('ddos')
      expect(result.evidence.length).toBeGreaterThan(0)
    })

    it('should not flag normal traffic as attack', () => {
      for (let i = 0; i < 15; i++) {
        detector.recordDataPoint('normal_traffic', makePoint(50 + Math.random() * 10, (15 - i) * 10000))
      }

      const result = detector.isUnderAttack('normal_traffic')
      expect(result.isUnderAttack).toBe(false)
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('should return insufficient data for < 10 points', () => {
      detector.recordDataPoint('sparse_traffic', makePoint(100, 0))
      detector.recordDataPoint('sparse_traffic', makePoint(200, 0))

      const result = detector.isUnderAttack('sparse_traffic')
      expect(result.isUnderAttack).toBe(false)
      expect(result.evidence).toContain('数据不足')
    })
  })
})

// ─── SelfHealingService ───

describe('SelfHealingService', () => {
  let selfHealing: SelfHealingService

  beforeEach(() => {
    selfHealing = createSelfHealing()
  })

  // ── checkHealth ──

  describe('checkHealth', () => {
    it('should return system health status', async () => {
      const health = selfHealing.checkHealth('test-system')

      expect(health.systemId).toBe('test-system')
      expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(health.status)
      expect(health.lastCheck).toBeDefined()
      expect(health.metrics).toBeDefined()
    })

    it('should return cached result within 1 minute', async () => {
      const health1 = selfHealing.checkHealth('cached-system')
      const health2 = selfHealing.checkHealth('cached-system')

      // 两次检查应该返回相同结果（缓存）
      expect(health1.lastCheck).toBe(health2.lastCheck)
    })
  })

  // ── triggerHealing ──

  describe('triggerHealing', () => {
    it('should trigger healing and return action record', async () => {
      const action = await selfHealing.triggerHealing('healing-target')

      expect(action.id).toBeDefined()
      expect(action.targetSystem).toBe('healing-target')
      expect(['restart', 'rollback', 'scale', 'isolate']).toContain(action.action)
      expect(['pending', 'running', 'completed', 'failed']).toContain(action.status)
      expect(action.triggeredAt).toBeDefined()
    })

    it('should update action status to completed on success', async () => {
      const action = await selfHealing.triggerHealing('healthy-target')

      // 自愈后状态应该是completed或failed，不应该是running或pending
      expect(['completed', 'failed']).toContain(action.status)
    })

    it('should record healing in history', async () => {
      await selfHealing.triggerHealing('history-target')

      const history = selfHealing.getHealingHistory('history-target')
      expect(history.systemId).toBe('history-target')
      expect(history.actions.length).toBeGreaterThan(0)
    })
  })

  // ── rollback ──

  describe('rollback', () => {
    it('should rollback to previous healthy version', async () => {
      const result = await selfHealing.rollback('rollback-target')

      expect(result.success).toBe(true)
      expect(result.version).toBeDefined()
      expect(result.message).toContain('v')
    })
  })

  // ── getHealingHistory ──

  describe('getHealingHistory', () => {
    it('should return empty history for unknown system', () => {
      const history = selfHealing.getHealingHistory('unknown-system')

      expect(history.systemId).toBe('unknown-system')
      expect(history.actions).toHaveLength(0)
    })

    it('should return healing actions for known system', async () => {
      await selfHealing.triggerHealing('history-system')
      await selfHealing.triggerHealing('history-system')

      const history = selfHealing.getHealingHistory('history-system')
      expect(history.actions.length).toBe(2)
      expect(history.lastHealingAt).toBeDefined()
    })
  })
})

// ─── AIOpsPredictionService ───

describe('AIOpsPredictionService', () => {
  let aiops: AIOpsPredictionService

  beforeEach(() => {
    aiops = createAIOps()
  })

  // ── getAnomalyDetector / getSelfHealingService ──

  describe('getAnomalyDetector', () => {
    it('should return anomaly detector instance', () => {
      const detector = aiops.getAnomalyDetector()
      expect(detector).toBeInstanceOf(TimeSeriesAnomalyDetector)
    })
  })

  describe('getSelfHealingService', () => {
    it('should return self healing service instance', () => {
      const healer = aiops.getSelfHealingService()
      expect(healer).toBeInstanceOf(SelfHealingService)
    })
  })

  // ── detectAndHeal ──

  describe('detectAndHeal', () => {
    it('should perform detect and heal for anomaly', async () => {
      const detector = aiops.getAnomalyDetector()

      // 注入异常数据
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(102, 40000),
        makePoint(99, 30000),
        makePoint(101, 20000),
        makePoint(98, 10000),
        makePoint(800, 0), // 严重异常
      ]
      detector.recordBatch('critical_metric', points)

      const result = await aiops.detectAndHeal('critical_metric', 'critical-system')

      expect(result.anomaly).toBeDefined()
      expect(result.attack).toBeDefined()
      // 异常分数>0.7，应该触发自愈
      expect(result.healing).toBeDefined()
    })

    it('should not trigger healing for normal metrics', async () => {
      const detector = aiops.getAnomalyDetector()

      // 正常数据
      const points: TimeSeriesPoint[] = [
        makePoint(100, 50000),
        makePoint(102, 40000),
        makePoint(99, 30000),
        makePoint(101, 20000),
        makePoint(100, 10000),
        makePoint(101, 0),
      ]
      detector.recordBatch('normal_metric', points)

      const result = await aiops.detectAndHeal('normal_metric', 'normal-system')

      expect(result.anomaly.isAnomaly).toBe(false)
      expect(result.healing).toBeUndefined()
    })
  })
})
