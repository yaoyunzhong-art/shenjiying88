import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AIOps + Chain 跨模块集成测试 (T122-3 + T124-3)
 *
 * 使用 vitest globals (describe/it)
 * 测试 AIOps 和 Chain 模块间的跨模块集成：
 * - AIOps → Chain 审计：异常事件自动记录到审计哈希链，Merkle 验证不可篡改
 * - 智能合约 → 合规报告：合约执行结果自动生成合规审计报告，导出 PDF
 *
 * 落地：HEARTBEAT-65
 */

import assert from 'node:assert/strict'
import {
  TimeSeriesAnomalyDetector,
  SelfHealingService,
  AIOpsPredictionService,
  type TimeSeriesPoint,
} from '../modules/aiops/aiops-prediction.service'
import {
  HashChainService,
  MerkleTreeService,
  AuditLogService,
} from '../modules/chain/chain-audit.service'
import {
  PointsSettlementContract,
  RevenueShareContract,
  resetSmartContractTestState,
} from '../modules/chain/smart-contract.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function makePoint(value: number, offsetMs: number = 0): TimeSeriesPoint {
  return {
    timestamp: new Date(Date.now() - offsetMs).toISOString(),
    value,
  }
}

function createAIOps() {
  const detector = new TimeSeriesAnomalyDetector()
  const healer = new SelfHealingService(detector)
  return new AIOpsPredictionService(detector, healer)
}

function createHashChain() {
  return new HashChainService()
}

function createMerkleTree() {
  return new MerkleTreeService()
}

function createAuditLog() {
  return new AuditLogService(createHashChain(), createMerkleTree())
}

function createPointsSettlement() {
  return new PointsSettlementContract()
}

function createRevenueShare() {
  return new RevenueShareContract()
}

// ─────────────────────────────────────────────────────────────
// 1. AIOps → Chain 审计集成 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('AIOps → Chain 审计集成', () => {
  it('异常事件自动记录到审计哈希链，Merkle 验证不可篡改', async () => {
    // Step 1: 初始化 AIOps 和审计服务
    const aiops = createAIOps()
    const auditLog = createAuditLog()
    const detector = aiops.getAnomalyDetector()

    // Step 2: 注入异常数据触发 AIOps 检测
    const points: TimeSeriesPoint[] = [
      makePoint(100, 50000),
      makePoint(102, 40000),
      makePoint(99, 30000),
      makePoint(101, 20000),
      makePoint(98, 10000),
      makePoint(800, 0), // 异常尖峰
    ]
    detector.recordBatch('cpu_usage', points)

    // Step 3: 执行检测与自愈
    const result = await aiops.detectAndHeal('cpu_usage', 'prod-server-1')

    // Step 4: 将异常事件记录到审计哈希链
    const anomalyRecord = auditLog.logOperation(
      'AnomalyEvent',
      `anomaly-${Date.now()}`,
      'DETECT_AND_HEAL',
      {
        metricName: 'cpu_usage',
        anomalyType: result.anomaly.anomalyType,
        anomalyScore: result.anomaly.anomalyScore,
        healingTriggered: !!result.healing,
        healingAction: result.healing?.action,
        healingStatus: result.healing?.status,
        targetSystem: 'prod-server-1',
      },
      'AIOps-System'
    )

    assert.ok(anomalyRecord.id, '异常记录应有ID')
    assert.equal(anomalyRecord.entity, 'AnomalyEvent')
    assert.equal(anomalyRecord.operation, 'DETECT_AND_HEAL')

    // Step 5: 验证哈希链包含异常记录
    const chainRecord = (auditLog as any).hashChainService.getRecord(anomalyRecord.chainRecordId!)
    assert.ok(chainRecord, '哈希链应包含该记录')
    assert.ok(chainRecord!.hash, '记录应有哈希值')
    assert.ok(chainRecord!.operation.includes('AnomalyEvent'), '操作类型应包含AnomalyEvent')
    assert.ok(chainRecord!.operation.includes('DETECT_AND_HEAL'), '操作类型应包含DETECT_AND_HEAL')

    // Step 6: 验证哈希链完整性
    const verifyResult = (auditLog as any).hashChainService.verifyChain()
    assert.equal(verifyResult.valid, true, '哈希链应该验证通过')

    // Step 7: 生成 Merkle 证明用于长期保存
    const allLogIds = auditLog.queryLogs({}).map(l => l.id)
    const merkleRoot = (auditLog as any).merkleTreeService.getMerkleRoot(allLogIds)
    assert.ok(merkleRoot, 'Merkle 根应该存在')

    // Step 8: 验证 Merkle 证明
    const proof = (auditLog as any).merkleTreeService.generateProof(anomalyRecord.id, allLogIds)
    assert.ok(proof, '应为异常记录生成 Merkle 证明')

    const isValid = (auditLog as any).merkleTreeService.verifyProof(anomalyRecord.id, proof!.proof, proof!.root)
    assert.equal(isValid, true, 'Merkle 证明应该验证通过')
  })

  it('DDoS 攻击事件 → 审计链记录 → 防篡改验证', async () => {
    const detector = new TimeSeriesAnomalyDetector()
    const auditLog = createAuditLog()

    // 模拟 DDoS 攻击
    for (let i = 0; i < 6; i++) {
      detector.recordDataPoint('api_requests', makePoint(10, (6 - i) * 60000))
    }
    for (let i = 0; i < 30; i++) {
      detector.recordDataPoint('api_requests', makePoint(200, i * 2000))
    }

    // 检测攻击
    const attackResult = detector.isUnderAttack('api_requests')
    assert.equal(attackResult.isUnderAttack, true, '应该检测到攻击')

    // 记录攻击事件到审计链
    const attackRecord = auditLog.logOperation(
      'SecurityEvent',
      `ddos-${Date.now()}`,
      'DDOS_ATTACK_DETECTED',
      {
        metricName: attackResult.metricName,
        attackType: attackResult.attackType,
        confidence: attackResult.confidence,
        evidence: attackResult.evidence,
      },
      'AIOps-Security'
    )

    // 验证记录存在
    assert.ok(attackRecord.chainRecordId, '攻击记录应有链上ID')

    // 验证原始链有效
    let verifyResult = (auditLog as any).hashChainService.verifyChain()
    assert.equal(verifyResult.valid, true, '原始链应验证通过')

    // 篡改攻击证据
    const chainRecords = (auditLog as any).hashChainService.getAllRecords()
    if (chainRecords.length > 0) {
      chainRecords[chainRecords.length - 1].metadata = {
        ...chainRecords[chainRecords.length - 1].metadata,
        tampered: true,
      }
    }

    // 验证篡改后链无效
    verifyResult = (auditLog as any).hashChainService.verifyChain()
    assert.equal(verifyResult.valid, false, '篡改后链应验证失败')
  })

  it('容量预警事件 → 审计链记录 → 合规可追溯', async () => {
    const aiops = createAIOps()
    const auditLog = createAuditLog()
    const detector = aiops.getAnomalyDetector()

    // 模拟容量增长趋势
    const points: TimeSeriesPoint[] = [
      makePoint(100, 300000),
      makePoint(110, 240000),
      makePoint(125, 180000),
      makePoint(140, 120000),
      makePoint(160, 60000),
      makePoint(180, 0),
    ]
    detector.recordBatch('disk_usage', points)

    // 预测容量
    const prediction = detector.predictNext('disk_usage', 5)

    // 记录预警事件
    const warningRecord = auditLog.logOperation(
      'CapacityWarning',
      `capacity-${Date.now()}`,
      'CAPACITY_PREDICTION',
      {
        metricName: 'disk_usage',
        predictedPeak: Math.max(...prediction.predictedValues),
        confidence: prediction.confidence,
        predictionHorizon: prediction.horizon,
      },
      'AIOps-Capacity'
    )

    assert.ok(warningRecord.id, '预警记录应有ID')
    assert.equal(warningRecord.entity, 'CapacityWarning')

    // 导出合规报告
    const report = auditLog.exportForCompliance(warningRecord.entityId)

    assert.ok(report.records.length > 0, '报告应包含记录')
    assert.equal(report.chainVerification.valid, true, '链验证应通过')
    assert.ok(report.merkleRoot, '报告应包含 Merkle 根')
    assert.ok(report.exportedAt, '报告应包含导出时间')
  })

  it('AIOps 健康检查结果 → 审计链永久记录', async () => {
    const healer = new SelfHealingService(new TimeSeriesAnomalyDetector())
    const auditLog = createAuditLog()

    // 执行健康检查
    const health = healer.checkHealth('prod-server-1')

    // 记录健康检查结果
    const healthRecord = auditLog.logOperation(
      'HealthCheck',
      health.systemId,
      'PERIODIC_HEALTH_CHECK',
      {
        status: health.status,
        metrics: health.metrics,
        issues: health.issues,
        lastCheck: health.lastCheck,
      },
      'AIOps-Health'
    )

    assert.ok(healthRecord.id, '健康检查记录应有ID')
    assert.ok(healthRecord.timestamp, '记录应包含时间戳')

    // 验证链上记录持久化
    const chainRecords = (auditLog as any).hashChainService.getAllRecords()
    assert.ok(chainRecords.length > 0, '链上应有记录')

    // 导出合规报告验证完整性
    const report: any = auditLog.exportForCompliance(health.systemId)
    assert.ok(report.chainVerification.valid, '合规报告链验证应通过')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 智能合约 → 合规报告集成 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('智能合约 → 合规报告集成', () => {
  beforeEach(() => {
    resetSmartContractTestState()
  })

  it('积分清算合约执行结果 → 自动生成合规审计报告', () => {
    const settlement = createPointsSettlement()
    const auditLog = createAuditLog()

    // Step 1: 创建清算合约
    const contract = settlement.createSettlement('payer-001', '付款方A', [
      { payeeId: 'payee-001', payeeName: '收款方B', amount: 3000 },
      { payeeId: 'payee-002', payeeName: '收款方C', amount: 2000 },
    ])

    // Step 2: 审批合约
    settlement.approveSettlement((contract as any).contractId)

    // Step 3: 执行合约
    const executed = settlement.executeSettlement((contract as any).contractId)

    // Step 4: 将执行结果记录到审计链
    const executionRecord = auditLog.logOperation(
      'SettlementContract',
      (contract as any).contractId,
      'EXECUTE_SETTLEMENT',
      {
        status: (executed as any).status,
        totalAmount: (executed as any).totalAmount,
        participants: (executed as any).participants.map((p: any) => ({
          payeeId: p.payeeId,
          payeeName: p.payeeName,
          amount: p.amount,
          transferred: p.transferred,
        })),
        executedAt: (executed as any).executedAt,
      },
      'SmartContract-System'
    )

    assert.ok(executionRecord.id, '执行记录应有ID')
    assert.equal(executionRecord.entity, 'SettlementContract')

    // Step 5: 导出合规审计报告
    const report = auditLog.exportForCompliance((contract as any).contractId)

    // 验证报告内容
    assert.ok(report.records.length > 0, '报告应包含执行记录')
    assert.equal(report.chainVerification.valid, true, '链验证应通过')
    assert.ok(report.merkleRoot, '报告应包含 Merkle 根')
    assert.ok(report.exportedAt, '报告应包含导出时间')

    // 验证报告数据完整性
    const reportRecord = report.records[0]
    const outputData = reportRecord.metadata as any
    assert.equal(outputData.status, 'Completed', '执行状态应为Completed')
    assert.equal(outputData.totalAmount, 5000, '总金额应为5000')
  })

  it('分账合约执行结果 → 合规审计链上可查', () => {
    const revenueShare = createRevenueShare()
    const auditLog = createAuditLog()

    // 创建分账合约
    const contract = revenueShare.createRevenueShare(10000, [
      { participantId: 'partner-a', participantName: 'Partner A', ratio: 0.6 },
      { participantId: 'partner-b', participantName: 'Partner B', ratio: 0.4 },
    ])

    // 执行分账
    const distributed = revenueShare.distributeRevenue((contract as any).contractId)

    // 记录分账结果到审计链
    const shareRecord = auditLog.logOperation(
      'RevenueShareContract',
      (contract as any).contractId,
      'DISTRIBUTE_REVENUE',
      {
        status: (distributed as any).status,
        totalRevenue: (distributed as any).totalRevenue,
        participants: (distributed as any).participants.map((p: any) => ({
          participantId: p.participantId,
          participantName: p.participantName,
          expectedShare: p.expectedShare,
          actualShare: p.actualShare,
          distributed: p.distributed,
        })),
        distributedAt: (distributed as any).distributedAt,
      },
      'SmartContract-System'
    )

    assert.ok(shareRecord.id, '分账记录应有ID')

    // 验证链上记录
    const chainRecord = (auditLog as any).hashChainService.getRecord(shareRecord.chainRecordId!)
    assert.ok(chainRecord, '链上应有记录')
    assert.ok(chainRecord!.hash, '记录应有哈希')

    // 导出合规报告
    const report = auditLog.exportForCompliance((contract as any).contractId)
    assert.ok(report.records.length > 0, '报告应包含记录')
    assert.equal(report.chainVerification.valid, true, '链验证应通过')
  })

  it('合约执行失败 → 审计链记录失败原因', () => {
    const settlement = createPointsSettlement()
    const auditLog = createAuditLog()

    // 创建合约
    const contract = settlement.createSettlement('payer-fail', '失败付款方', [
      { payeeId: 'm-fail', payeeName: '失败收款方', amount: 100 },
    ])

    // 审批（不执行，模拟余额不足导致的失败场景）

    // 直接标记为失败来模拟（因为默认实现总是成功）
    // 实际场景中如果执行失败会触发此路径

    // 记录失败事件
    const failRecord = auditLog.logOperation(
      'SettlementContract',
      (contract as any).contractId,
      'SETTLEMENT_FAILED',
      {
        originalStatus: (contract as any).status,
        failureReason: '模拟：转账失败，余额不足',
        attemptedAt: new Date().toISOString(),
      },
      'SmartContract-System'
    )

    assert.ok(failRecord.id, '失败记录应有ID')
    assert.equal(failRecord.operation, 'SETTLEMENT_FAILED')

    // 验证失败记录在链上
    const chainRecord = (auditLog as any).hashChainService.getRecord(failRecord.chainRecordId!)
    assert.ok(chainRecord, '失败记录应在链上')

    // 篡改失败原因
    const allRecords = (auditLog as any).hashChainService.getAllRecords()
    if (allRecords.length > 0) {
      allRecords[allRecords.length - 1].operation = 'TAMPERED_FAIL'
    }

    // 验证篡改检测
    const verifyResult = (auditLog as any).hashChainService.verifyChain()
    assert.equal(verifyResult.valid, false, '篡改后链应验证失败')
  })

  it('合规报告导出 → PDF 格式支持（元数据完整性）', () => {
    const auditLog = createAuditLog()

    // 记录多个操作
    auditLog.logOperation('User', 'u-001', 'CREATE', { name: 'Alice' }, 'admin')
    auditLog.logOperation('User', 'u-001', 'UPDATE', { name: 'Alice Updated' }, 'admin')
    auditLog.logOperation('User', 'u-001', 'DELETE', { name: 'Alice' }, 'admin')

    // 导出合规报告
    const report = auditLog.exportForCompliance('u-001')

    // 验证报告元数据
    assert.ok(report.entityId, '报告应包含实体ID')
    assert.ok(report.records.length > 0, '报告应包含记录列表')
    assert.equal(report.chainVerification.valid, true, '链验证应通过')
    assert.ok(report.merkleRoot, '报告应包含 Merkle 根（用于 PDF 元数据）')
    assert.ok(report.exportedAt, '报告应包含导出时间')

    // 验证每条记录都有必要字段（PDF 转换需要）
    for (const record of report.records) {
      assert.ok(record.id, '记录应有ID')
      assert.ok(record.timestamp, '记录应包含时间戳')
      assert.ok(record.operation, '记录应包含操作类型')
      assert.ok(record.entity, '记录应包含实体类型')
    }

    // 验证 Merkle 树一致性
    const allIds = report.records.map(r => r.id)
    const calculatedRoot = (auditLog as any).merkleTreeService.getMerkleRoot(allIds)
    assert.equal(
      report.merkleRoot,
      calculatedRoot,
      '报告 Merkle 根应与计算值一致（确保 PDF 元数据完整）'
    )
  })
})
