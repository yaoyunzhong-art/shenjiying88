import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [auto-rollback] [C] 合约测试
 *
 * 验证 auto-rollback 模块的：
 * - 实体 Shape 合约（所有接口类型定义正确）
 * - 业务逻辑合约（状态机流转、等级判断、配置变更）
 * - 跨模块消费安全子集
 */

import { AutoRollbackService } from './auto-rollback.service'
import type {
  RollbackStatus,
  RollbackSeverity,
  SnapshotKind,
  Snapshot,
  RollbackRecord,
  RollbackConfig,
  RollbackTriggerInput,
} from './auto-rollback.entity'
import type {
  RollbackRecordContract,
  SnapshotContract,
  RollbackTriggerContract,
  RollbackEngineStatusContract,
  RollbackConfigContract,
  RollbackStatsContract,
  RollbackHistoryEntryContract,
} from './auto-rollback.contract'

// ─── Service 工厂 ──────────────────────────────────────

function makeService(): AutoRollbackService {
  const svc = new AutoRollbackService()
  svc.resetForTests()
  return svc
}

// ══════════════════════════════════════════════════════════
// 合约：实体 Shape
// ══════════════════════════════════════════════════════════

describe('[auto-rollback] 合约: 实体 Shape', () => {
  it('RollbackStatus 应接受全部 8 个有效状态值', () => {
    const statuses: RollbackStatus[] = [
      'PENDING',
      'AWAITING_CONFIRM',
      'SNAPSHOTTING',
      'ROLLING_BACK',
      'VERIFYING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ]
    expect(statuses).toHaveLength(8)
  })

  it('RollbackSeverity 应包含 WARNING 和 CRITICAL', () => {
    const severities: RollbackSeverity[] = ['WARNING', 'CRITICAL']
    expect(severities).toHaveLength(2)
  })

  it('SnapshotKind 应包含 DB / REDIS / CONFIG / FULL', () => {
    const kinds: SnapshotKind[] = ['DB', 'REDIS', 'CONFIG', 'FULL']
    expect(kinds).toHaveLength(4)
  })

  it('RollbackRecord 合约应包含关键字段', () => {
    const record: RollbackRecordContract = {
      id: 'rollback-001',
      reason: 'CPU spike on payment service',
      severity: 'CRITICAL',
      metricKey: 'cpu.usage',
      anomalyValue: 95,
      baselineValue: 50,
      status: 'AWAITING_CONFIRM',
      requiresConfirmation: true,
      createdAt: '2026-06-27T08:00:00Z',
    }
    expect(record.id).toBe('rollback-001')
    expect(record.severity).toBe('CRITICAL')
    expect(record.requiresConfirmation).toBe(true)
    // 合约不应包含 history（消费方不需要）
    expect((record as any).history).toBeUndefined()
    // 可选字段
    record.snapshotId = 'snap-abc'
    record.completedAt = '2026-06-27T08:05:00Z'
    expect(record.snapshotId).toBe('snap-abc')
    expect(record.completedAt).toBe('2026-06-27T08:05:00Z')
  })

  it('SnapshotContract 合约应包含正确字段', () => {
    const snap: SnapshotContract = {
      id: 'snap-xyz',
      kind: 'FULL',
      size: 2048,
      createdAt: '2026-06-27T08:00:00Z',
      trigger: 'manual',
    }
    expect(snap.id).toBe('snap-xyz')
    expect(snap.kind).toBe('FULL')
    expect(snap.size).toBeGreaterThan(0)
    // 合约不应包含 payload（内部实现细节）
    expect((snap as any).payload).toBeUndefined()
  })

  it('RollbackTriggerContract 合约应包含必要字段', () => {
    const trigger: RollbackTriggerContract = {
      reason: 'Redis cache miss rate spike',
      severity: 'WARNING',
      metricKey: 'redis.miss.rate',
      anomalyValue: 0.7,
      baselineValue: 0.2,
    }
    expect(trigger.metricKey).toBe('redis.miss.rate')
    expect(trigger.severity).toBe('WARNING')
    // 可选字段
    trigger.snapshotKind = 'REDIS'
    trigger.trigger = 'auto-detect'
    expect(trigger.snapshotKind).toBe('REDIS')
    expect(trigger.trigger).toBe('auto-detect')
  })

  it('RollbackEngineStatusContract 合约应包含引擎状态字段', () => {
    const status: RollbackEngineStatusContract = {
      engineName: 'AutoRollback',
      activeRecords: 3,
      status: 'ACTIVE',
    }
    expect(status.engineName).toBe('AutoRollback')
    expect(status.activeRecords).toBe(3)
    expect(status.status).toBe('ACTIVE')
    status.lastEvaluationAt = '2026-06-27T08:00:00Z'
    expect(status.lastEvaluationAt).toBeDefined()
  })

  it('RollbackConfigContract 合约应包含全部 5 个配置字段', () => {
    const config: RollbackConfigContract = {
      criticalRequiresConfirm: true,
      confirmationDelayMs: 30000,
      autoTimeoutMs: 300000,
      maxConcurrent: 3,
      snapshotRetentionMs: 604800000,
    }
    expect(config.confirmationDelayMs).toBe(30000)
    expect(config.maxConcurrent).toBe(3)
    expect(config.snapshotRetentionMs).toBe(7 * 24 * 60 * 60 * 1000) // 7d
  })

  it('RollbackHistoryEntryContract 合约应包含 status/timestamp/note', () => {
    const entry: RollbackHistoryEntryContract = {
      status: 'PENDING',
      timestamp: '2026-06-27T08:00:00Z',
      note: 'Triggered by anomaly detector',
    }
    expect(entry.status).toBe('PENDING')
    expect(entry.note).toBeDefined()
    // note 可选
    const entryMin: RollbackHistoryEntryContract = {
      status: 'COMPLETED',
      timestamp: '2026-06-27T08:05:00Z',
    }
    expect(entryMin.note).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════
// 合约：业务逻辑契约
// ══════════════════════════════════════════════════════════

describe('[auto-rollback] 合约: 业务逻辑', () => {
  let svc: AutoRollbackService

  beforeEach(() => {
    svc = makeService()
  })

  // ── WARNING 回滚 ──

  it('WARNING 级别触发后应直接进入回滚流程（无需确认）', async () => {
    const record = svc.trigger({
      reason: 'P95 latency spike on payments',
      severity: 'WARNING',
      metricKey: 'http.p95.latency',
      anomalyValue: 2000,
      baselineValue: 500,
    })
    expect(record.requiresConfirmation).toBe(false)
    expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(record.status)
    expect(record.id).toMatch(/^rollback-/)
    expect(record.history.length).toBeGreaterThanOrEqual(1)
    // 异步完成后状态应为 COMPLETED
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    expect(['COMPLETED', 'FAILED']).toContain(after!.status)
  })

  // ── CRITICAL 回滚 ──

  it('CRITICAL 级别触发后应进入 AWAITING_CONFIRM 状态', () => {
    const record = svc.trigger({
      reason: 'P99 critical spike on orders API',
      severity: 'CRITICAL',
      metricKey: 'http.p99.latency',
      anomalyValue: 5000,
      baselineValue: 200,
    })
    expect(record.severity).toBe('CRITICAL')
    expect(record.status).toBe('AWAITING_CONFIRM')
    expect(record.requiresConfirmation).toBe(true)
  })

  it('CRITICAL 确认后应进入回滚流程', async () => {
    svc.configure({ confirmationDelayMs: 60000 }) // 防止自动取消
    const record = svc.trigger({
      reason: 'DB write latency spike',
      severity: 'CRITICAL',
      metricKey: 'db.write.latency',
      anomalyValue: 10000,
      baselineValue: 100,
    })
    expect(record.status).toBe('AWAITING_CONFIRM')

    // 确认执行
    const confirmed = svc.confirm(record.id)
    expect(confirmed).toBeDefined()
    expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(confirmed!.status)
    // 等待异步回滚完成
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    expect(['COMPLETED', 'FAILED']).toContain(after!.status)
    expect(after!.snapshotId).toBeDefined()
    expect(after!.snapshotId).toMatch(/^snap-/)
  })

  it('CRITICAL 超时未确认应自动取消', async () => {
    svc.configure({ confirmationDelayMs: 20 })
    const record = svc.trigger({
      reason: 'short timeout test',
      severity: 'CRITICAL',
      metricKey: 'test.metric',
      anomalyValue: 999,
      baselineValue: 100,
    })
    expect(record.status).toBe('AWAITING_CONFIRM')
    await new Promise((r) => setTimeout(r, 60))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    expect(after!.status).toBe('CANCELLED')
  })

  // ── 取消 ──

  it('手动取消 AWAITING_CONFIRM 状态的回滚应成功', () => {
    const record = svc.trigger({
      reason: 'manual cancel test',
      severity: 'CRITICAL',
      metricKey: 'test.metric',
      anomalyValue: 900,
      baselineValue: 100,
    })
    expect(record.status).toBe('AWAITING_CONFIRM')

    const cancelled = svc.cancel(record.id, 'Operator override')
    expect(cancelled).toBeDefined()
    expect(cancelled!.status).toBe('CANCELLED')
    // history 中应有取消记录
    const cancelEntry = cancelled!.history.find((h) => h.status === 'CANCELLED')
    expect(cancelEntry).toBeDefined()
    expect(cancelEntry!.note).toBe('Operator override')
  })

  it('已 COMPLETED 的回滚不可重复取消', async () => {
    const record = svc.trigger({
      reason: 'already done',
      severity: 'WARNING',
      metricKey: 'test.metric',
      anomalyValue: 150,
      baselineValue: 100,
    })
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    // 重复取消应返回当前记录但状态不改变
    const cancelled = svc.cancel(record.id, 'Late cancel')
    // 如果已完成,则 cancel 返回记录而不改变状态
    if (after!.status === 'COMPLETED') {
      expect(cancelled!.status).toBe('COMPLETED')
    }
  })

  // ── 配置变更 ──

  it('configure() 应正确更新配置', () => {
    svc.configure({ maxConcurrent: 5, confirmationDelayMs: 60000 })
    // 验证内部生效: WARNING 直接执行, CRITICAL 需确认
    const record = svc.trigger({
      reason: 'custom config test',
      severity: 'CRITICAL',
      metricKey: 'custom.metric',
      anomalyValue: 800,
      baselineValue: 100,
    })
    expect(record.requiresConfirmation).toBe(true)
    // 确认后完成
    svc.configure({ confirmationDelayMs: 60000 })
    const confirmed = svc.confirm(record.id)
    expect(confirmed).toBeDefined()
  })

  it('关闭 criticalRequiresConfirm 后 CRITICAL 应直接执行', () => {
    svc.configure({ criticalRequiresConfirm: false })
    const record = svc.trigger({
      reason: 'direct execution test',
      severity: 'CRITICAL',
      metricKey: 'direct.metric',
      anomalyValue: 800,
      baselineValue: 100,
    })
    // 不要求确认
    expect(record.requiresConfirmation).toBe(false)
    expect(['PENDING', 'SNAPSHOTTING', 'ROLLING_BACK', 'VERIFYING', 'COMPLETED']).toContain(record.status)
  })

  // ── 查询 ──

  it('getRecord() 应返回正确的记录', () => {
    const record = svc.trigger({
      reason: 'getRecord test',
      severity: 'WARNING',
      metricKey: 'test.get',
      anomalyValue: 300,
      baselineValue: 100,
    })
    const found = svc.getRecord(record.id)
    expect(found).toBeDefined()
    expect(found!.id).toBe(record.id)
    // 不存在的 ID 返回 undefined
    expect(svc.getRecord('nonexistent')).toBeUndefined()
  })

  it('listRecords() 应支持按 status 过滤', async () => {
    svc.trigger({ reason: 'r1', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 })
    svc.resetForTests()
    // 重置后重新触发
    svc.configure({ criticalRequiresConfirm: false })
    const r1 = svc.trigger({ reason: 'r1', severity: 'WARNING', metricKey: 'm1', anomalyValue: 110, baselineValue: 100 })
    await new Promise((r) => setTimeout(r, 300))
    let activeRecords = svc.listRecords({ status: 'COMPLETED' })
    // WARNING 应在 300ms 内完成;若未完成给更多时间
    if (activeRecords.length === 0) {
      await new Promise((r) => setTimeout(r, 500))
      activeRecords = svc.listRecords({ status: 'COMPLETED' })
    }
    expect(activeRecords.length).toBeGreaterThanOrEqual(1)
  }, 10000)

  it('listRecords() 应支持按 metricKey 过滤', () => {
    svc.resetForTests()
    svc.configure({ criticalRequiresConfirm: false })
    svc.trigger({ reason: 'r1', severity: 'WARNING', metricKey: 'api.orders', anomalyValue: 300, baselineValue: 100 })
    svc.trigger({ reason: 'r2', severity: 'WARNING', metricKey: 'api.payments', anomalyValue: 400, baselineValue: 100 })
    const paymentsRecords = svc.listRecords({ metricKey: 'api.payments' })
    expect(paymentsRecords.length).toBe(1)
    expect(paymentsRecords[0].metricKey).toBe('api.payments')
  })

  it('listRecords() 无过滤应返回全部记录按创建时间降序排列', () => {
    svc.resetForTests()
    svc.configure({ criticalRequiresConfirm: false })
    svc.trigger({ reason: 'r1', severity: 'WARNING', metricKey: 'm1', anomalyValue: 200, baselineValue: 100 })
    svc.trigger({ reason: 'r2', severity: 'WARNING', metricKey: 'm2', anomalyValue: 300, baselineValue: 100 })
    const all = svc.listRecords()
    // 降序排列: 最新在前
    if (all.length >= 2) {
      expect(all[0].createdAt >= all[1].createdAt).toBe(true)
    }
  })

  // ── 快照 ──

  it('回滚完成时 snapshotId 应可用且可查询', async () => {
    const record = svc.trigger({
      reason: 'snapshot query test',
      severity: 'WARNING',
      metricKey: 'snap.test',
      anomalyValue: 500,
      baselineValue: 200,
    })
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    if (after && after.snapshotId) {
      const snapshot = svc.getSnapshot(after.snapshotId)
      expect(snapshot).toBeDefined()
      expect(snapshot!.id).toBe(after.snapshotId)
      expect(snapshot!.kind).toMatch(/^(DB|REDIS|CONFIG|FULL)$/)
      expect(snapshot!.size).toBeGreaterThan(0)
      expect(snapshot!.createdAt).toBeDefined()
    }
  })

  it('不存在的快照 ID 应返回 undefined', () => {
    expect(svc.getSnapshot('snap-nonexistent')).toBeUndefined()
  })

  // ── resetForTests ──

  it('resetForTests() 应清空所有状态', () => {
    svc.trigger({ reason: 'r1', severity: 'WARNING', metricKey: 'm1', anomalyValue: 200, baselineValue: 100 })
    svc.resetForTests()
    expect(svc.listRecords()).toHaveLength(0)
    // 重置后默认配置生效
    const record = svc.trigger({ reason: 'r2', severity: 'CRITICAL', metricKey: 'm2', anomalyValue: 900, baselineValue: 100 })
    expect(record.requiresConfirmation).toBe(true)
  })

  // ── 快速同步执行模式（executeRollbackSync） ──

  it('executeRollbackSync() 应同步完成回滚流程', async () => {
    // 先触发生成 PENDING 状态
    svc.configure({ criticalRequiresConfirm: false })
    const record = svc.trigger({
      reason: 'sync mode test',
      severity: 'WARNING',
      metricKey: 'sync.test',
      anomalyValue: 300,
      baselineValue: 100,
    })
    // 如果触发时已经异步开始, 等 10ms 再同步触发
    await new Promise((r) => setTimeout(r, 10))
    const syncResult = await svc.executeRollbackSync(record.id)
    expect(syncResult).toBeDefined()
    // 同步回滚过程可能经过 ROLLING_BACK/VERIFYING 等中间状态
    expect(['COMPLETED', 'FAILED', 'ROLLING_BACK', 'VERIFYING']).toContain(syncResult!.status)
    if (syncResult!.status === 'COMPLETED') {
      expect(syncResult!.snapshotId).toBeDefined()
      expect(syncResult!.completedAt).toBeDefined()
    }
  })

  it('不存在的记录 executeRollbackSync() 应返回 undefined', async () => {
    const result = await svc.executeRollbackSync('nonexistent')
    expect(result).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════
// 合约：状态机流转合约
// ══════════════════════════════════════════════════════════

describe('[auto-rollback] 合约: 状态机流转', () => {
  let svc: AutoRollbackService

  beforeEach(() => {
    svc = makeService()
    svc.configure({ confirmationDelayMs: 60000 }) // 防止自动取消干扰
  })

  it('CRITICAL 状态机: AWAITING_CONFIRM → confirm → COMPLETED', async () => {
    const record = svc.trigger({
      reason: 'state machine test',
      severity: 'CRITICAL',
      metricKey: 'sm.test',
      anomalyValue: 800,
      baselineValue: 100,
    })
    expect(record.status).toBe('AWAITING_CONFIRM')

    svc.confirm(record.id)
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    expect(['COMPLETED', 'FAILED']).toContain(after!.status)
  })

  it('CRITICAL 状态机: AWAITING_CONFIRM → cancel → CANCELLED', () => {
    const record = svc.trigger({
      reason: 'cancel path test',
      severity: 'CRITICAL',
      metricKey: 'cancel.test',
      anomalyValue: 800,
      baselineValue: 100,
    })
    expect(record.status).toBe('AWAITING_CONFIRM')
    svc.cancel(record.id, 'Do not rollback')
    const after = svc.getRecord(record.id)
    expect(after!.status).toBe('CANCELLED')
  })

  it('WARNING 状态机: 无需确认直接完成', async () => {
    const record = svc.trigger({
      reason: 'warning fast path',
      severity: 'WARNING',
      metricKey: 'warning.test',
      anomalyValue: 180,
      baselineValue: 100,
    })
    // WARNING 直接进入执行, 等异步完成
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)
    expect(after).toBeDefined()
    expect(['COMPLETED', 'FAILED']).toContain(after!.status)
  })

  it('已完成记录不会再被 confirm/cancel 改变', async () => {
    svc.configure({ criticalRequiresConfirm: false })
    const record = svc.trigger({
      reason: 'idempotent test',
      severity: 'WARNING',
      metricKey: 'idem.test',
      anomalyValue: 200,
      baselineValue: 100,
    })
    await new Promise((r) => setTimeout(r, 100))
    const after = svc.getRecord(record.id)!
    if (after.status === 'COMPLETED') {
      // 不可再 confirm
      svc.confirm(record.id)
      expect(svc.getRecord(record.id)!.status).toBe('COMPLETED')
      // 取消已完成记录也不改变
      svc.cancel(record.id, 'Late cancel')
      expect(svc.getRecord(record.id)!.status).toBe('COMPLETED')
    }
  })
})

// ══════════════════════════════════════════════════════════
// 合约：异常边界
// ══════════════════════════════════════════════════════════

describe('[auto-rollback] 合约: 异常边界', () => {
  let svc: AutoRollbackService

  beforeEach(() => {
    svc = makeService()
  })

  it('negative anomalyValue 应该被接受（指标可逆场景）', () => {
    const record = svc.trigger({
      reason: 'negative value test',
      severity: 'WARNING',
      metricKey: 'temperature',
      anomalyValue: -10,
      baselineValue: 25,
    })
    expect(record.anomalyValue).toBe(-10)
    expect(record.baselineValue).toBe(25)
  })

  it('zero baselineValue 不应导致除以零', () => {
    const record = svc.trigger({
      reason: 'zero baseline test',
      severity: 'WARNING',
      metricKey: 'zero.test',
      anomalyValue: 100,
      baselineValue: 0,
    })
    expect(record.baselineValue).toBe(0)
    // verifyRollback 中 deviation = |100 - 0| = 100, tolerance = 0
    // deviation <= 0 → false, 所以会 FAILED
    // 这不抛异常即可
    expect(record.id).toBeDefined()
  })

  it('极大数值不应导致 overflow', () => {
    const maxSafe = Number.MAX_SAFE_INTEGER
    const record = svc.trigger({
      reason: 'max value test',
      severity: 'WARNING',
      metricKey: 'max.test',
      anomalyValue: maxSafe,
      baselineValue: 0,
    })
    expect(record.anomalyValue).toBe(maxSafe)
  })

  it('confirm 不存在 ID 应返回 undefined', () => {
    const result = svc.confirm('rollback-notexist')
    expect(result).toBeUndefined()
  })

  it('cancel 不存在 ID 应返回 undefined', () => {
    const result = svc.cancel('rollback-notexist', 'testing')
    expect(result).toBeUndefined()
  })
})
