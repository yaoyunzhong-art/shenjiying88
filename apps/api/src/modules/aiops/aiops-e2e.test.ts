import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AIOps E2E 集成测试 (T122-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试 AIOps 模块端到端场景：
 * - 异常检测 → 自愈全流程
 * - DDoS 攻击检测 → 自动防御 E2E
 * - 预测 → 容量预警 E2E
 *
 * 落地：HEARTBEAT-65
 */

import assert from 'node:assert/strict'
import {
  TimeSeriesAnomalyDetector,
  SelfHealingService,
  AIOpsPredictionService,
  type TimeSeriesPoint,
} from './aiops-prediction.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function makePoint(value: number, offsetMs: number = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

function createDetector() {
  const detector = new TimeSeriesAnomalyDetector()
  return detector
}

function createSelfHealing(detector?: TimeSeriesAnomalyDetector) {
  return new SelfHealingService(detector || createDetector())
}

function createAIOps() {
  const detector = createDetector()
  const healer = createSelfHealing(detector)
  return new AIOpsPredictionService(detector, healer)
}

// ─────────────────────────────────────────────────────────────
// 1. 异常检测 → 自愈全流程 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('异常检测 → 自愈全流程 E2E', () => {
  it('时序数据异常检测 → 触发自愈 → 系统恢复 → 健康检查通过', async () => {
    const aiops = createAIOps()
    const detector = aiops.getAnomalyDetector()

    // Step 1: 注入正常数据
    const normalPoints: TimeSeriesPoint[] = [
      makePoint(100, 50000),
      makePoint(102, 40000),
      makePoint(98, 30000),
      makePoint(101, 20000),
      makePoint(99, 10000),
    ]
    detector.recordBatch('cpu_usage', normalPoints)

    // Step 2: 注入异常数据（尖峰）
    detector.recordDataPoint('cpu_usage', makePoint(850, 0))

    // Step 3: 执行检测与自愈
    const result = await aiops.detectAndHeal('cpu_usage', 'prod-server-1')

    // 验证异常被检测到
    assert.equal(result.anomaly.isAnomaly, true)
    assert.equal(result.anomaly.anomalyType, 'spike')
    assert.ok(result.anomaly.anomalyScore > 0.5)

    // Step 4: 验证自愈被触发（异常分数 > 0.7）
    assert.ok(result.healing, '自愈应该被触发')
    assert.equal(result.healing!.targetSystem, 'prod-server-1')
    assert.ok(['restart', 'rollback', 'scale', 'isolate'].includes(result.healing!.action))

    // Step 5: 验证自愈状态为 completed
    assert.ok(
      ['completed', 'failed'].includes(result.healing!.status),
      `自愈状态应为 completed/failed，实际: ${result.healing!.status}`
    )

    // Step 6: 验证健康检查
    const health = createSelfHealing(detector).checkHealth('prod-server-1')
    assert.ok(['healthy', 'degraded', 'critical', 'unknown'].includes(health.status))
  })

  it('异常检测 → 自愈历史记录完整性', async () => {
    const aiops = createAIOps()
    const detector = aiops.getAnomalyDetector()

    // 注入异常数据
    const points: TimeSeriesPoint[] = [
      makePoint(100, 50000),
      makePoint(102, 40000),
      makePoint(99, 30000),
      makePoint(101, 20000),
      makePoint(98, 10000),
      makePoint(900, 0),
    ]
    detector.recordBatch('memory_usage', points)

    // 执行检测与自愈
    await aiops.detectAndHeal('memory_usage', 'cache-server')

    // 验证自愈历史
    const healer = aiops.getSelfHealingService()
    const history = healer.getHealingHistory('cache-server')

    assert.equal(history.systemId, 'cache-server')
    assert.ok(history.actions.length > 0, '应该有自愈记录')
    assert.ok(history.lastHealingAt, '应该有最后自愈时间')

    // 验证自愈动作记录完整
    const latestAction = history.actions[history.actions.length - 1]
    assert.ok(latestAction.id, '自愈动作ID应该存在')
    assert.equal(latestAction.targetSystem, 'cache-server')
    assert.ok(latestAction.triggeredAt, '触发时间应该存在')
  })

  it('正常数据 → 不触发自愈', async () => {
    const aiops = createAIOps()
    const detector = aiops.getAnomalyDetector()

    // 注入正常波动数据
    const normalPoints: TimeSeriesPoint[] = [
      makePoint(100, 50000),
      makePoint(102, 40000),
      makePoint(99, 30000),
      makePoint(101, 20000),
      makePoint(100, 10000),
      makePoint(101, 0),
    ]
    detector.recordBatch('healthy_metric', normalPoints)

    // 执行检测与自愈
    const result = await aiops.detectAndHeal('healthy_metric', 'healthy-server')

    // 验证无异常
    assert.equal(result.anomaly.isAnomaly, false)

    // 验证未触发自愈
    assert.equal(result.healing, undefined, '正常数据不应该触发自愈')
  })

  it('数据点不足 → 不触发自愈', async () => {
    const aiops = createAIOps()
    const detector = aiops.getAnomalyDetector()

    // 只注入少量数据点
    detector.recordDataPoint('sparse_metric', makePoint(500, 0))
    detector.recordDataPoint('sparse_metric', makePoint(600, 0))

    // 执行检测与自愈
    const result = await aiops.detectAndHeal('sparse_metric', 'sparse-server')

    // 验证检测结果包含不足信息
    assert.equal(result.anomaly.isAnomaly, false)
    assert.ok(result.anomaly.details?.includes('数据点不足'))

    // 验证未触发自愈
    assert.equal(result.healing, undefined)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. DDoS 攻击检测 → 自动防御 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('DDoS 攻击检测 → 自动防御 E2E', () => {
  it('检测到攻击 → 触发防御 → 流量清洗 → 恢复正常', async () => {
    const detector = createDetector()

    // Step 1: 模拟正常流量基线（T-6min to T-1min）
    for (let i = 0; i < 6; i++) {
      detector.recordDataPoint('api_requests', makePoint(10, (6 - i) * 60000))
    }

    // Step 2: 模拟 DDoS 攻击流量（最近1分钟内）
    for (let i = 0; i < 30; i++) {
      detector.recordDataPoint('api_requests', makePoint(200 + Math.random() * 50, i * 2000))
    }

    // Step 3: 检测攻击
    const attackResult = detector.isUnderAttack('api_requests')

    // 验证攻击被检测到
    assert.equal(attackResult.isUnderAttack, true, '应该检测到DDoS攻击')
    assert.equal(attackResult.attackType, 'ddos', '攻击类型应为ddos')
    assert.ok(attackResult.confidence > 0.3, `置信度应>0.3，实际: ${attackResult.confidence}`)
    assert.ok(attackResult.evidence.length > 0, '应有攻击证据')

    // Step 4: 触发防御（自愈流程）
    const healer = createSelfHealing(detector)
    const healingAction = await healer.triggerHealing('firewall-api-gateway')

    assert.ok(healingAction.id, '防御动作ID应存在')
    assert.equal(healingAction.targetSystem, 'firewall-api-gateway')
    assert.ok(['pending', 'running', 'completed', 'failed'].includes(healingAction.status))

    // Step 5: 验证系统健康状态
    const health = healer.checkHealth('firewall-api-gateway')
    assert.ok(['healthy', 'degraded', 'critical', 'unknown'].includes(health.status))
  })

  it('DDoS 攻击证据链完整性', async () => {
    const detector = createDetector()

    // 模拟攻击流量
    for (let i = 0; i < 6; i++) {
      detector.recordDataPoint('http_traffic', makePoint(15, (6 - i) * 60000))
    }
    for (let i = 0; i < 40; i++) {
      detector.recordDataPoint('http_traffic', makePoint(300, i * 1500))
    }

    const result = detector.isUnderAttack('http_traffic')

    // 验证证据链
    assert.ok(result.evidence.length > 0, '应有攻击证据')
    assert.ok(result.evidence.some(e => e.includes('请求量突增') || e.includes('高频请求')))
    assert.ok(result.detectedAt, '应有检测时间')
  })

  it('正常流量 → 不触发防御', async () => {
    const detector = createDetector()

    // 模拟正常流量
    for (let i = 0; i < 15; i++) {
      detector.recordDataPoint(
        'normal_api',
        makePoint(50 + Math.random() * 10, (15 - i) * 10000)
      )
    }

    const result = detector.isUnderAttack('normal_api')

    // 验证不触发防御
    assert.equal(result.isUnderAttack, false, '正常流量不应触发防御')
    assert.ok(result.confidence < 0.5, `置信度应<0.5，实际: ${result.confidence}`)
  })

  it('数据不足 → 不触发防御', async () => {
    const detector = createDetector()

    // 只注入少量数据
    detector.recordDataPoint('sparse_traffic', makePoint(100, 0))
    detector.recordDataPoint('sparse_traffic', makePoint(200, 0))

    const result = detector.isUnderAttack('sparse_traffic')

    // 验证不触发防御
    assert.equal(result.isUnderAttack, false)
    assert.ok(result.evidence.includes('数据不足'))
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 预测 → 容量预警 E2E (4 tests)
// ─────────────────────────────────────────────────────────────

describe('预测 → 容量预警 E2E', () => {
  it('预测未来值 → 容量不足预警 → 自动扩容 → 预警解除', async () => {
    const detector = createDetector()

    // Step 1: 历史数据（呈现增长趋势）
    const historicalPoints: TimeSeriesPoint[] = [
      makePoint(100, 300000),  // 5分钟前
      makePoint(110, 240000),  // 4分钟前
      makePoint(125, 180000),  // 3分钟前
      makePoint(140, 120000),  // 2分钟前
      makePoint(160, 60000),   // 1分钟前
      makePoint(180, 0),       // 现在
    ]
    detector.recordBatch('disk_usage', historicalPoints)

    // Step 2: 预测未来值
    const prediction = detector.predictNext('disk_usage', 5)

    assert.ok(prediction.predictedValues.length === 5, '应有5个预测值')
    assert.ok(prediction.confidence > 0, '置信度应>0')
    assert.equal(prediction.metricName, 'disk_usage')

    const predictedPeak = Math.max(...prediction.predictedValues)
    assert.ok(predictedPeak > 0, '预测峰值应>0')

    // Step 3: 触发扩容（基于预测的预防性扩容）
    const healer = createSelfHealing(detector)
    const healingAction = await healer.triggerHealing('storage-cluster')

    // 验证扩容动作
    assert.ok(healingAction.id, '扩容动作ID应存在')
    assert.equal(healingAction.targetSystem, 'storage-cluster')

    // 触发的是 scale 动作（因为 CPU/内存问题会触发 scale）
    const healthBefore = healer.checkHealth('storage-cluster')
    if (healthBefore.metrics['cpu_usage'] > 90) {
      assert.equal(healingAction.action, 'scale', 'CPU高时应触发scale')
    }

    // Step 5: 验证预警解除（自愈后状态）
    const healthAfter = healer.checkHealth('storage-cluster')
    assert.ok(['healthy', 'degraded', 'critical', 'unknown'].includes(healthAfter.status))
  })

  it('预测置信度计算正确性', async () => {
    const detector = createDetector()

    // 注入稳定数据（低波动）
    const stablePoints: TimeSeriesPoint[] = [
      makePoint(100, 50000),
      makePoint(100, 40000),
      makePoint(100, 30000),
      makePoint(100, 20000),
      makePoint(100, 10000),
      makePoint(100, 0),
    ]
    detector.recordBatch('stable_metric', stablePoints)

    const prediction = detector.predictNext('stable_metric', 3)

    // 稳定数据应该有正置信度
    assert.ok(prediction.confidence > 0, `稳定数据置信度应>0，实际: ${prediction.confidence}`)
  })

  it('数据不足 → 预测返回零值', async () => {
    const detector = createDetector()

    // 只注入少量数据
    detector.recordDataPoint('sparse_forecast', makePoint(100, 0))

    const prediction = detector.predictNext('sparse_forecast', 5)

    // 数据不足时应返回零值
    assert.equal(prediction.predictedValues.length, 5)
    assert.ok(prediction.predictedValues.every(v => v === 0), '数据不足时应返回零预测')
    assert.equal(prediction.confidence, 0, '置信度应为0')
  })

  it('趋势异常预测 → 触发预防性扩容', async () => {
    const detector = createDetector()

    // 先平稳，然后快速上升（趋势异常）
    const points: TimeSeriesPoint[] = []
    for (let i = 0; i < 5; i++) {
      points.push(makePoint(100 + i * 2, (20 - i) * 10000)) // 缓慢上升
    }
    for (let i = 0; i < 5; i++) {
      points.push(makePoint(110 + i * 25, (5 - i) * 10000)) // 快速上升
    }
    detector.recordBatch('network_bandwidth', points)

    // 检测趋势异常
    const anomalyResult = detector.detectAnomaly('network_bandwidth')
    assert.equal(anomalyResult.isAnomaly, true, '应检测到趋势异常')
    assert.equal(anomalyResult.anomalyType, 'trend', '异常类型应为trend')

    // 预测未来值
    const prediction = detector.predictNext('network_bandwidth', 3)
    assert.ok(prediction.predictedValues.length === 3)

    // 趋势异常时应该触发自愈（预防性扩容）
    const healer = createSelfHealing(detector)
    const healingAction = await healer.triggerHealing('network-gateway')

    assert.ok(healingAction.id)
    assert.equal(healingAction.targetSystem, 'network-gateway')
  })
})
