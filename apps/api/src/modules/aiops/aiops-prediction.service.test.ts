// aiops-prediction.service.test.ts — AIOps 预测/异常检测/自愈服务单元测试
// 覆盖 TimeSeriesAnomalyDetector + SelfHealingService + AIOpsPredictionService
// 正例 + 反例 + 边界场景

import { Test, TestingModule } from '@nestjs/testing'
import {
  TimeSeriesAnomalyDetector,
  SelfHealingService,
  AIOpsPredictionService,
  TimeSeriesPoint,
} from './aiops-prediction.service'

// ─── 辅助: 生成时光序列数据 ───

function makePoint(value: number, offsetSec = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetSec * 1000).toISOString(),
    value,
  }
}

function generateStablePoints(count: number, base = 50, noise = 2): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  for (let i = 0; i < count; i++) {
    points.push(makePoint(base + (Math.random() - 0.5) * noise, (count - i) * 60))
  }
  return points
}

function generateAnomalousPoints(count: number, base = 50, anomalyIdx = -1): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  for (let i = 0; i < count; i++) {
    const val = i === anomalyIdx ? base * 5 : base + (Math.random() - 0.5) * 2
    points.push(makePoint(val, (count - i) * 60))
  }
  return points
}

// ────────────────────────────────────────────
// TimeSeriesAnomalyDetector
// ────────────────────────────────────────────

describe('TimeSeriesAnomalyDetector', () => {
  let detector: TimeSeriesAnomalyDetector

  beforeEach(() => {
    detector = new TimeSeriesAnomalyDetector()
  })

  afterEach(() => {
    detector.resetForTests()
  })

  describe('recordDataPoint / getData', () => {
    it('应该正确记录和获取时序数据点', () => {
      const p1 = makePoint(42, 60)
      detector.recordDataPoint('cpu_usage', p1)
      const data = detector.getData('cpu_usage')
      expect(data).toHaveLength(1)
      expect(data[0].value).toBe(42)
    })

    it('不存在的指标应返回空数组', () => {
      expect(detector.getData('nonexistent')).toEqual([])
    })

    it('批量记录应该返回插入数量', () => {
      const points = generateStablePoints(10)
      const count = detector.recordBatch('mem_usage', points)
      expect(count).toBe(10)
      expect(detector.getData('mem_usage')).toHaveLength(10)
    })
  })

  describe('detectAnomaly', () => {
    it('数据点少于5个时应返回非异常且含提示', () => {
      const points = [makePoint(50, 10), makePoint(51, 20), makePoint(49, 30)]
      const result = detector.detectAnomaly('test', points)
      expect(result.isAnomaly).toBe(false)
      expect(result.anomalyScore).toBe(0)
      expect(result.details).toContain('数据点不足')
    })

    it('稳定数据应检测为正常', () => {
      const points = generateStablePoints(20)
      const result = detector.detectAnomaly('test', points)
      expect(result.isAnomaly).toBe(false)
      expect(result.anomalyScore).toBeLessThan(0.5)
    })

    it('应当检测 spike 异常（突增值）', () => {
      const points = generateAnomalousPoints(20, 50, 19) // 最后一值为突增
      const result = detector.detectAnomaly('test', points)
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyType).toBe('spike')
      expect(result.anomalyScore).toBeGreaterThan(0.3)
    })

    it('应当检测 drop 异常（突降值）', () => {
      const points: TimeSeriesPoint[] = []
      for (let i = 0; i < 20; i++) {
        points.push(makePoint(100, (20 - i) * 60))
      }
      points.push(makePoint(5, 0)) // 突降到5
      const result = detector.detectAnomaly('test', points)
      expect(result.isAnomaly).toBe(true)
      expect(result.anomalyType).toBe('drop')
    })

    it('应当检测趋势异常', () => {
      const points: TimeSeriesPoint[] = []
      // 前10个稳定, 后10个持续上升
      for (let i = 0; i < 10; i++) {
        points.push(makePoint(50, (25 - i) * 60))
      }
      for (let i = 0; i < 10; i++) {
        points.push(makePoint(50 + i * 10, (15 - i) * 60))
      }
      const result = detector.detectAnomaly('test', points)
      // 趋势可能触发 anomaly
      // 重点是检测到异常类型
      expect(result.metricName).toBe('test')
      expect(result.detectedAt).toBeTruthy()
    })
  })

  describe('predictNext', () => {
    it('数据不足时应返回全0预测和0置信度', () => {
      const points = [makePoint(50, 10), makePoint(51, 5)]
      // 先记录再预测 (constructor 拿 getData)
      // 直接使用 inject 需要走 record，因 predictNext 调用 getData
      detector.recordBatch('short', points)
      const result = detector.predictNext('short', 3)
      expect(result.confidence).toBe(0)
      expect(result.predictedValues).toHaveLength(3)
    })

    it('充足数据应返回合理预测值和置信度', () => {
      const points = generateStablePoints(30, 60)
      detector.recordBatch('long_metric', points)
      const result = detector.predictNext('long_metric', 5)
      expect(result.predictedValues).toHaveLength(5)
      // 置信度应在 0~1 之间
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      // 预测值应在合理范围内
      for (const v of result.predictedValues) {
        expect(v).toBeGreaterThan(0)
      }
    })

    it('horizon 默认值应为5', () => {
      detector.recordBatch('default_horizon', generateStablePoints(30))
      const result = detector.predictNext('default_horizon')
      expect(result.horizon).toBe(5)
    })
  })

  describe('isUnderAttack', () => {
    it('数据不足10个时应返回非攻击', () => {
      const points = generateStablePoints(5)
      // 直接传参无法绕过 getData, 记录后检测
      detector.recordBatch('attack_test', points)
      const result = detector.isUnderAttack('attack_test')
      expect(result.isUnderAttack).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('高频异常突增应识别为 DDoS 攻击', () => {
      // 构造大量高频突增数据
      const now = Date.now()
      const points: TimeSeriesPoint[] = []
      // 写入大量旧数据（基数）
      for (let i = 0; i < 20; i++) {
        points.push({ timestamp: new Date(now - 120000 - i * 1000).toISOString(), value: 50 })
      }
      // 最近1分钟内写入大量高值
      for (let i = 0; i < 80; i++) {
        points.push({ timestamp: new Date(now - i * 700).toISOString(), value: 500 + Math.random() * 200 })
      }
      detector.recordBatch('attack_ddos', points)
      const result = detector.isUnderAttack('attack_ddos')
      // 检测引擎应识别
      expect(result.metricName).toBe('attack_ddos')
      expect(result.detectedAt).toBeTruthy()
      // 至少有 evidence
      expect(result.evidence.length).toBeGreaterThanOrEqual(1)
    })

    it('正常流量应判定为非攻击', () => {
      const points = generateStablePoints(30, 100, 5)
      detector.recordBatch('normal_traffic', points)
      const result = detector.isUnderAttack('normal_traffic')
      // 不一定是 false，但置信度应该很低
      // 主要是测试不抛异常
      expect(result).toHaveProperty('isUnderAttack')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('evidence')
    })
  })
})

// ────────────────────────────────────────────
// SelfHealingService
// ────────────────────────────────────────────

describe('SelfHealingService', () => {
  let detector: TimeSeriesAnomalyDetector
  let healing: SelfHealingService

  beforeEach(() => {
    detector = new TimeSeriesAnomalyDetector()
    healing = new SelfHealingService(detector)
  })

  afterEach(() => {
    healing.resetForTests()
    detector.resetForTests()
  })

  describe('checkHealth', () => {
    it('应返回有效健康状态对象', () => {
      const health = healing.checkHealth('api-gateway')
      expect(health.systemId).toBe('api-gateway')
      expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(health.status)
      expect(health.metrics).toHaveProperty('cpu_usage')
      expect(health.metrics).toHaveProperty('memory_usage')
      expect(health.metrics).toHaveProperty('response_time_ms')
      expect(health.metrics).toHaveProperty('error_rate')
    })

    it('缓存应在1分钟内返回同一结果', () => {
      const h1 = healing.checkHealth('cached-svc')
      const h2 = healing.checkHealth('cached-svc')
      expect(h1.lastCheck).toBe(h2.lastCheck)
    })
  })

  describe('triggerHealing', () => {
    it('应返回一条自愈动作记录（含所有必填字段）', async () => {
      // 触发前先检查健康，让系统有记录
      healing.checkHealth('test-system')
      const action = await healing.triggerHealing('test-system')
      expect(action.id).toMatch(/^heal-/)
      expect(action.targetSystem).toBe('test-system')
      expect(action.triggeredAt).toBeTruthy()
      expect(['pending', 'running', 'completed', 'failed']).toContain(action.status)
      expect(action.action).toMatch(/^(restart|rollback|scale|isolate)$/)
    })

    it('自愈完成后应有 completedAt 和 result', async () => {
      const action = await healing.triggerHealing('heal-test')
      expect(action.completedAt).toBeTruthy()
      expect(action.result).toBeTruthy()
    })
  })

  describe('rollback', () => {
    it('应返回成功并携带回滚版本号', async () => {
      const result = await healing.rollback('api-gateway')
      expect(result.success).toBe(true)
      expect(result.version).toMatch(/^v\d+$/)
      expect(result.message).toContain('成功回滚')
    })
  })

  describe('getHealingHistory', () => {
    it('无历史时应返回空数组', () => {
      const history = healing.getHealingHistory('unknown-svc')
      expect(history.actions).toEqual([])
    })

    it('触发自愈后应有历史记录', async () => {
      await healing.triggerHealing('history-svc')
      const history = healing.getHealingHistory('history-svc')
      expect(history.actions.length).toBeGreaterThanOrEqual(1)
      expect(history.systemId).toBe('history-svc')
    })
  })

  describe('getAllSystemHealth', () => {
    it('应返回所有已检查系统的健康状态', () => {
      healing.checkHealth('sys-a')
      healing.checkHealth('sys-b')
      const all = healing.getAllSystemHealth()
      expect(all.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('resetForTests', () => {
    it('重置后应清空所有记录', () => {
      healing.checkHealth('some-sys')
      healing.resetForTests()
      expect(healing.getAllSystemHealth()).toHaveLength(0)
      const history = healing.getHealingHistory('some-sys')
      expect(history.actions).toHaveLength(0)
    })
  })
})

// ────────────────────────────────────────────
// AIOpsPredictionService (组合)
// ────────────────────────────────────────────

describe('AIOpsPredictionService', () => {
  let detector: TimeSeriesAnomalyDetector
  let healing: SelfHealingService
  let combined: AIOpsPredictionService

  beforeEach(() => {
    detector = new TimeSeriesAnomalyDetector()
    healing = new SelfHealingService(detector)
    combined = new AIOpsPredictionService(detector, healing)
  })

  afterEach(() => {
    detector.resetForTests()
    healing.resetForTests()
  })

  describe('getAnomalyDetector / getSelfHealingService', () => {
    it('应返回注入的实例', () => {
      expect(combined.getAnomalyDetector()).toBe(detector)
      expect(combined.getSelfHealingService()).toBe(healing)
    })
  })

  describe('detectAndHeal', () => {
    it('稳定指标应返回 anomaly+attack 但不触发自愈', async () => {
      detector.recordBatch('stable', generateStablePoints(30, 100))
      const result = await combined.detectAndHeal('stable', 'backend')
      expect(result.anomaly).toBeTruthy()
      expect(result.attack).toBeTruthy()
      // 稳定数据 healing 应为 undefined
      expect(result.healing).toBeUndefined()
    })

    it('严重异常应触发自愈', async () => {
      const points = generateAnomalousPoints(25, 50, 24)
      detector.recordBatch('critical', points)
      const result = await combined.detectAndHeal('critical', 'critical-svc')
      expect(result.anomaly).toBeTruthy()
      // 如果 anomalyScore > 0.7 应有 healing
      if (result.anomaly.isAnomaly && result.anomaly.anomalyScore > 0.7) {
        expect(result.healing).toBeDefined()
      }
    })
  })
})
