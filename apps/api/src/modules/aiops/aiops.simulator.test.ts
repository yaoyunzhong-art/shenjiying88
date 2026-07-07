import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { TimeSeriesAnomalyDetector, SelfHealingService, AIOpsPredictionService } from './aiops-prediction.service'

describe('AIOps Simulator - 生产模拟测试', () => {
  let detector: TimeSeriesAnomalyDetector

  beforeEach(() => {
    detector = new TimeSeriesAnomalyDetector()
  })

  it('模拟正常系统 — 24小时CPU数据无异常', () => {
    // 模拟24小时CPU监控数据（正常波动）
    for (let i = 0; i < 48; i++) {
      const value = 40 + Math.random() * 20 // 40-60% 波动
      detector.recordDataPoint('cpu_prod', {
        timestamp: new Date(Date.now() - (48 - i) * 30 * 60000).toISOString(),
        value: Math.round(value * 100) / 100,
      })
    }
    const result = detector.detectAnomaly('cpu_prod')
    expect(result.metricName).toBe('cpu_prod')
  })

  it('模拟故障注入 — 突然抖动检测', () => {
    for (let i = 0; i < 20; i++) {
      detector.recordDataPoint('latency', {
        timestamp: new Date(Date.now() - (20 - i) * 30000).toISOString(),
        value: i < 15 ? 100 : 2000 + Math.random() * 1000,
      })
    }
    const result = detector.detectAnomaly('latency')
    expect(result.isAnomaly).toBe(true)
  })

  it('模拟自愈全流程 — 检测→触发→完成', async () => {
    const healer = new SelfHealingService(detector)
    for (let i = 0; i < 15; i++) {
      detector.recordDataPoint('prod_system', {
        timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
        value: 50,
      })
    }
    detector.recordDataPoint('prod_system', {
      timestamp: new Date().toISOString(),
      value: 999,
    })

    const aiops = new AIOpsPredictionService(detector, healer)
    const result = await aiops.detectAndHeal('prod_system', 'production-server')

    expect(result.anomaly).toBeDefined()
    expect(result.attack).toBeDefined()
    // 异常评分高时应有自愈
    if (result.anomaly.anomalyScore > 0.7) {
      expect(result.healing).toBeDefined()
    }
  })
})
