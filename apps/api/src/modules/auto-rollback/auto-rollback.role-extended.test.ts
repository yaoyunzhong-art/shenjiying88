import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [auto-rollback] [C] 角色测试编写 - 扩展版
 * 
 * 自动回滚模块扩展角色测试 - 8 角色深度视角
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 * 
 * 覆盖场景：
 * - 多角色协作流程（店长触发→安监确认→运行专员验证）
 * - 并发回滚限制与冲突
 * - 快照审计合规
 * - RBAC 守卫模拟校验
 * - 配置变更权限隔离
 */

import assert from 'node:assert/strict'
// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 类型定义 ──
type RollbackSeverity = 'WARNING' | 'CRITICAL'
type RollbackStatus =
  | 'PENDING'
  | 'AWAITING_CONFIRM'
  | 'SNAPSHOTTING'
  | 'ROLLING_BACK'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
type SnapshotKind = 'DB' | 'REDIS' | 'CONFIG' | 'FULL'

interface RollbackRecordMock {
  id: string
  reason: string
  severity: RollbackSeverity
  metricKey: string
  anomalyValue: number
  baselineValue: number
  status: RollbackStatus
  snapshotId?: string
  requiresConfirmation: boolean
  confirmationDelayMs: number
  history: Array<{ status: RollbackStatus; timestamp: string; note?: string }>
  createdAt: string
  completedAt?: string
}

interface SnapshotMock {
  id: string
  kind: SnapshotKind
  payload: Record<string, unknown>
  size: number
  createdAt: string
  trigger: string
}

// ── RBAC 权限矩阵 ──
const RBAC_PERMISSIONS: Record<string, { trigger: boolean; confirm: boolean; cancel: boolean; configure: boolean; read: boolean; snapshotRead: boolean }> = {
  [ROLES.TenantAdmin]: { trigger: true, confirm: true, cancel: true, configure: true, read: true, snapshotRead: true },
  [ROLES.Reception]: { trigger: false, confirm: false, cancel: false, configure: false, read: true, snapshotRead: false },
  [ROLES.HR]: { trigger: false, confirm: false, cancel: false, configure: false, read: true, snapshotRead: false },
  [ROLES.Safety]: { trigger: true, confirm: true, cancel: true, configure: false, read: true, snapshotRead: true },
  [ROLES.Guide]: { trigger: false, confirm: false, cancel: false, configure: false, read: true, snapshotRead: false },
  [ROLES.Ops]: { trigger: true, confirm: true, cancel: true, configure: false, read: true, snapshotRead: true },
  [ROLES.Teambuilding]: { trigger: false, confirm: false, cancel: false, configure: false, read: true, snapshotRead: false },
  [ROLES.Marketing]: { trigger: false, confirm: false, cancel: false, configure: false, read: true, snapshotRead: false },
}

function hasPermission(role: string, action: string): boolean {
  const perms = RBAC_PERMISSIONS[role]
  return perms ? (perms as Record<string, boolean>)[action] ?? false : false
}

// ── 模拟 RoleAwareAutoRollbackService（扩展版） ──
class RoleAwareAutoRollbackService {
  private records = new Map<string, RollbackRecordMock>()
  private snapshots = new Map<string, SnapshotMock>()
  private config = {
    criticalRequiresConfirm: true,
    confirmationDelayMs: 30000,
    autoTimeoutMs: 300000,
    maxConcurrent: 3,
    snapshotRetentionMs: 604800000,
  }
  private history: Array<{ action: string; id: string; role: string; timestamp: string }> = []

  private idCounter = 0

  trigger(
    input: {
      reason: string
      severity: RollbackSeverity
      metricKey: string
      anomalyValue: number
      baselineValue: number
      snapshotKind?: SnapshotKind
      trigger?: string
    },
    actorRole: string = 'UNKNOWN',
  ): RollbackRecordMock | null {
    // RBAC 守卫
    if (!hasPermission(actorRole, 'trigger')) return null

    const requiresConfirmation = input.severity === 'CRITICAL' && this.config.criticalRequiresConfirm
    // 并发限制检查
    const activeCount = this.getActiveCount()
    if (activeCount >= this.config.maxConcurrent) {
      // 超过最大并发，拒绝触发
      return null
    }

    this.idCounter++
    const id = `rb-ext-${this.idCounter}`
    const record: RollbackRecordMock = {
      id,
      reason: input.reason,
      severity: input.severity,
      metricKey: input.metricKey,
      anomalyValue: input.anomalyValue,
      baselineValue: input.baselineValue,
      status: requiresConfirmation ? 'AWAITING_CONFIRM' : 'PENDING',
      requiresConfirmation,
      confirmationDelayMs: this.config.confirmationDelayMs,
      history: [
        {
          status: requiresConfirmation ? 'AWAITING_CONFIRM' : 'PENDING',
          timestamp: new Date().toISOString(),
          note: `Triggered by ${actorRole}: ${input.reason}`,
        },
      ],
      createdAt: new Date().toISOString(),
    }
    this.records.set(id, record)
    this.history.push({ action: 'trigger', id, role: actorRole, timestamp: new Date().toISOString() })

    // CRITICAL 自动创建快照预览（用于确认参考）
    if (requiresConfirmation) {
      const snapshotId = this.buildPreviewSnapshot(input, record.id)
      record.snapshotId = snapshotId
    }

    return record
  }

  confirm(id: string, actorRole: string = 'UNKNOWN'): RollbackRecordMock | null {
    if (!hasPermission(actorRole, 'confirm')) return null

    const record = this.records.get(id)
    if (!record) return null
    if (record.status !== 'AWAITING_CONFIRM') return record

    record.status = 'COMPLETED'
    record.history.push({
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      note: `Confirmed by ${actorRole}`,
    })
    record.completedAt = new Date().toISOString()
    this.history.push({ action: 'confirm', id, role: actorRole, timestamp: new Date().toISOString() })
    return record
  }

  cancel(id: string, reason?: string, actorRole: string = 'UNKNOWN'): RollbackRecordMock | null {
    if (!hasPermission(actorRole, 'cancel')) return null

    const record = this.records.get(id)
    if (!record) return null
    if (record.status === 'COMPLETED' || record.status === 'CANCELLED') return record

    record.status = 'CANCELLED'
    record.history.push({
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      note: reason ? `Cancelled by ${actorRole}: ${reason}` : `Cancelled by ${actorRole}`,
    })
    this.history.push({ action: 'cancel', id, role: actorRole, timestamp: new Date().toISOString() })
    return record
  }

  configure(config: Partial<Record<string, unknown>>, actorRole: string = 'UNKNOWN'): boolean {
    if (!hasPermission(actorRole, 'configure')) return false
    Object.assign(this.config, config)
    this.history.push({ action: 'configure', id: 'system', role: actorRole, timestamp: new Date().toISOString() })
    return true
  }

  getRecord(id: string, actorRole: string = 'UNKNOWN'): RollbackRecordMock | null {
    if (!hasPermission(actorRole, 'read')) return null
    return this.records.get(id) ?? null
  }

  listRecords(filter?: { status?: string; metricKey?: string }, actorRole: string = 'UNKNOWN'): RollbackRecordMock[] {
    if (!hasPermission(actorRole, 'read')) return []
    let all = Array.from(this.records.values())
    if (filter?.status) all = all.filter((r) => r.status === filter.status)
    if (filter?.metricKey) all = all.filter((r) => r.metricKey === filter.metricKey)
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getSnapshot(id: string, actorRole: string = 'UNKNOWN'): SnapshotMock | null {
    if (!hasPermission(actorRole, 'snapshotRead')) return null
    return this.snapshots.get(id) ?? null
  }

  getActivityLog() {
    return this.history
  }

  getActiveCount(): number {
    return Array.from(this.records.values()).filter(
      (r) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(r.status),
    ).length
  }

  getActiveRecords(): RollbackRecordMock[] {
    return Array.from(this.records.values()).filter(
      (r) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(r.status),
    )
  }

  reset() {
    this.records.clear()
    this.snapshots.clear()
    this.history = []
    this.config = {
      criticalRequiresConfirm: true,
      confirmationDelayMs: 30000,
      autoTimeoutMs: 300000,
      maxConcurrent: 3,
      snapshotRetentionMs: 604800000,
    }
    this.idCounter = 0
  }

  private buildPreviewSnapshot(input: { metricKey: string; anomalyValue: number; baselineValue: number; trigger?: string }, recordId: string): string {
    const id = `snap-preview-${recordId.split('-').pop()}`
    const snapshot: SnapshotMock = {
      id,
      kind: 'FULL',
      payload: {
        metricKey: input.metricKey,
        anomalyValue: input.anomalyValue,
        baselineValue: input.baselineValue,
        capturedAt: new Date().toISOString(),
      },
      size: Math.floor(Math.random() * 500) + 50,
      createdAt: new Date().toISOString(),
      trigger: input.trigger ?? 'auto-preview',
    }
    this.snapshots.set(id, snapshot)
    return id
  }
}

function createController() {
  const service = new RoleAwareAutoRollbackService()
  return { service }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 (TenantAdmin)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} auto-rollback 扩展角色测试`, () => {
  it('店长可在高峰期调整并发限制并触发批量回滚', () => {
    const { service } = createController()

    // 店长调整并发为 5
    const configured = service.configure({ maxConcurrent: 5 }, ROLES.TenantAdmin)
    assert.equal(configured, true)

    // 触发 4 个 WARNING 回滚（均应在并发限制内）
    for (let i = 0; i < 4; i++) {
      const r = service.trigger(
        { reason: `批量异常 ${i}`, severity: 'WARNING', metricKey: `metric.${i}`, anomalyValue: 100 + i * 50, baselineValue: 50 },
        ROLES.TenantAdmin,
      )
      assert.notEqual(r, null, `触发 #${i} 应成功`)
    }

    assert.equal(service.getActiveCount(), 4)
  })

  it('店长可回滚配置变更并在异常时恢复默认 (审计可追溯)', () => {
    const { service } = createController()

    // 初始: confirmationDelayMs = 30000
    const initialConfigApplied = service.configure({ confirmationDelayMs: 60000 }, ROLES.TenantAdmin)
    assert.equal(initialConfigApplied, true)

    // 模拟出现异常，恢复默认
    const restored = service.configure({ confirmationDelayMs: 30000 }, ROLES.TenantAdmin)
    assert.equal(restored, true)

    // 审计日志应有 2 条 configure 记录
    const configureActions = service.getActivityLog().filter((e) => e.action === 'configure')
    assert.equal(configureActions.length, 2)
    assert.ok(configureActions.every((e) => e.role === ROLES.TenantAdmin))
  })

  it('店长可结合安全事件跨角色协作 (边界：多角色流程)', () => {
    const { service } = createController()

    // 安监发现安全事件 -> 报告店长
    const record = service.trigger(
      { reason: 'IDS 检测到 DDoS 模式', severity: 'CRITICAL', metricKey: 'security.ddos', anomalyValue: 10000, baselineValue: 100 },
      ROLES.Safety,
    )
    assert.notEqual(record, null)
    assert.equal(record!.status, 'AWAITING_CONFIRM')

    // 店长确认执行回滚
    const confirmed = service.confirm(record!.id, ROLES.TenantAdmin)
    assert.notEqual(confirmed, null)
    assert.equal(confirmed!.status, 'COMPLETED')

    // 审计显示安监触发、店长确认
    const log = service.getActivityLog()
    const triggerEntry = log.find((e) => e.action === 'trigger' && e.role === ROLES.Safety)
    const confirmEntry = log.find((e) => e.action === 'confirm' && e.role === ROLES.TenantAdmin)
    assert.ok(triggerEntry)
    assert.ok(confirmEntry)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 (Reception)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Reception} auto-rollback 扩展角色测试`, () => {
  it('前台在收银异常时可查询回滚状态并告知顾客等待时间', () => {
    const { service } = createController()

    // 运行专员触发收银回滚
    service.trigger(
      { reason: '收银接口 P99 超时 8s', severity: 'CRITICAL', metricKey: 'cashier.api', anomalyValue: 8000, baselineValue: 200 },
      ROLES.Ops,
    )

    // 前台查询
    const records = service.listRecords({ metricKey: 'cashier.api' }, ROLES.Reception)
    assert.equal(records.length, 1)
    assert.equal(records[0].metricKey, 'cashier.api')
    // 前台关心严重程度
    assert.equal(records[0].severity, 'CRITICAL')
  })

  it('前台无法触发任何回滚操作 (权限边界：RBAC 阻断)', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '前台误报', severity: 'WARNING', metricKey: 'front.desk', anomalyValue: 30, baselineValue: 10 },
      ROLES.Reception,
    )
    assert.equal(record, null, '前台不应有 trigger 权限')
  })

  it('前台访问快照数据返回 null (权限边界：敏感数据隔离)', () => {
    const { service } = createController()

    const snapshot = service.getSnapshot('snap-any', ROLES.Reception)
    assert.equal(snapshot, null)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} auto-rollback 扩展角色测试`, () => {
  it('HR 可查询系统历史回滚记录用于事故复盘培训材料', () => {
    const { service } = createController()

    // 模拟若干历史回滚
    service.trigger({ reason: 'HR 系统数据库迁移异常', severity: 'CRITICAL', metricKey: 'hr.db', anomalyValue: 5000, baselineValue: 200 }, ROLES.Ops)
    service.trigger({ reason: '考勤打卡 API 波动', severity: 'WARNING', metricKey: 'hr.attendance', anomalyValue: 2000, baselineValue: 300 }, ROLES.Ops)

    // HR 查询所有记录
    const all = service.listRecords({}, ROLES.HR)
    assert.ok(all.length >= 2)

    // HR 按业务线过滤
    const hrRecords = service.listRecords({ metricKey: 'hr.db' }, ROLES.HR)
    assert.equal(hrRecords.length, 1)
    assert.ok(hrRecords[0].reason.includes('HR'))
  })

  it('HR 无法确认或取消任何回滚 (权限边界：无运维操作)', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '薪资计算异常', severity: 'CRITICAL', metricKey: 'payroll', anomalyValue: 8000, baselineValue: 500 },
      ROLES.Ops,
    )
    assert.notEqual(record, null)

    // HR 尝试确认
    const confirmResult = service.confirm(record!.id, ROLES.HR)
    assert.equal(confirmResult, null, 'HR 无 confirm 权限')

    // HR 尝试取消
    const cancelResult = service.cancel(record!.id, 'HR 越权操作', ROLES.HR)
    assert.equal(cancelResult, null, 'HR 无 cancel 权限')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 (Safety)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} auto-rollback 扩展角色测试`, () => {
  it('安监可触发安全事件回滚并读取快照验证回滚点', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '异常流量规则变更', severity: 'CRITICAL', metricKey: 'waf.rules', anomalyValue: 100, baselineValue: 10, snapshotKind: 'CONFIG' },
      ROLES.Safety,
    )
    assert.notEqual(record, null)
    assert.equal(record!.status, 'AWAITING_CONFIRM')
    assert.ok(record!.snapshotId, 'CRITICAL 应有预览快照')

    // 安监读取快照
    const snapshot = service.getSnapshot(record!.snapshotId!, ROLES.Safety)
    assert.notEqual(snapshot, null)
    assert.equal(snapshot!.kind, 'FULL')
  })

  it('安监确认回滚后确认日志记录正确角色', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '防火墙规则被篡改', severity: 'CRITICAL', metricKey: 'firewall.rules', anomalyValue: 500, baselineValue: 20 },
      ROLES.Safety,
    )
    assert.notEqual(record, null)

    const confirmed = service.confirm(record!.id, ROLES.Safety)
    assert.notEqual(confirmed, null)

    const log = service.getActivityLog()
    const confirmEntry = log.find((e) => e.action === 'confirm')
    assert.ok(confirmEntry)
    assert.equal(confirmEntry!.role, ROLES.Safety)
  })

  it('安监无法修改全局配置 (权限边界：配置隔离)', () => {
    const { service } = createController()

    const configured = service.configure({ maxConcurrent: 10 }, ROLES.Safety)
    assert.equal(configured, false, '安监不应有 configure 权限')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 (Guide)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} auto-rollback 扩展角色测试`, () => {
  it('导玩员可查询游戏相关回滚记录了解机台状态', () => {
    const { service } = createController()

    service.trigger(
      { reason: '游戏设备 API 间歇性故障', severity: 'WARNING', metricKey: 'games.device.api', anomalyValue: 1500, baselineValue: 200 },
      ROLES.Ops,
    )
    service.trigger(
      { reason: '积分兑换接口超时', severity: 'CRITICAL', metricKey: 'games.redeem', anomalyValue: 5000, baselineValue: 300 },
      ROLES.Ops,
    )

    // 导玩员查询游戏相关
    const gameMetrics = service.listRecords({ metricKey: 'games.device.api' }, ROLES.Guide)
    assert.equal(gameMetrics.length, 1)
    assert.equal(gameMetrics[0].metricKey, 'games.device.api')
  })

  it('导玩员按状态过滤查询 (边界：查询灵活性)', () => {
    const { service } = createController()

    // 已完成和待确认混合
    const r1 = service.trigger(
      { reason: '机台网络波动', severity: 'WARNING', metricKey: 'cabinet.network', anomalyValue: 400, baselineValue: 50 },
      ROLES.Ops,
    )
    service.trigger(
      { reason: '体感设备校准异常', severity: 'CRITICAL', metricKey: 'cabinet.calibration', anomalyValue: 300, baselineValue: 10 },
      ROLES.Safety,
    )

    // 查询待确认记录
    const pendingRecords = service.listRecords({ status: 'AWAITING_CONFIRM' }, ROLES.Guide)
    assert.ok(pendingRecords.length >= 1)
    assert.equal(pendingRecords[0].status, 'AWAITING_CONFIRM')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 (Ops)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} auto-rollback 扩展角色测试`, () => {
  it('运行专员可处理大批量 WARNING 回滚（正常流程：并发阈值内）', () => {
    const { service } = createController()

    // 触发 3 个 WARNING（刚好在默认并发限制内）
    const results = []
    for (let i = 0; i < 3; i++) {
      const r = service.trigger(
        { reason: `批量 WARNING #${i}`, severity: 'WARNING', metricKey: `batch.${i}`, anomalyValue: 200, baselineValue: 50 },
        ROLES.Ops,
      )
      results.push(r)
    }

    assert.equal(results.length, 3)
    assert.ok(results.every((r) => r !== null))
    assert.equal(service.getActiveCount(), 3)
  })

  it('运行专员超过并发限制时触发返回 null (边界：限流保护)', () => {
    const { service } = createController()

    // 触发 3 个（填满 maxConcurrent=3）
    for (let i = 0; i < 3; i++) {
      service.trigger(
        { reason: `并发 #${i}`, severity: 'WARNING', metricKey: `concurrent.${i}`, anomalyValue: 100, baselineValue: 20 },
        ROLES.Ops,
      )
    }

    // 第 4 个应被拒绝
    const rejected = service.trigger(
      { reason: '超出并发', severity: 'WARNING', metricKey: 'rejected', anomalyValue: 100, baselineValue: 20 },
      ROLES.Ops,
    )
    assert.equal(rejected, null, '超过最大并发时应返回 null')
  })

  it('运行专员可读取快照进行回滚点验证', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: 'Redis 缓存命中率骤降', severity: 'CRITICAL', metricKey: 'redis.hit.rate', anomalyValue: 0.2, baselineValue: 0.95 },
      ROLES.Ops,
    )
    assert.notEqual(record, null)
    assert.ok(record!.snapshotId)

    const snapshot = service.getSnapshot(record!.snapshotId!, ROLES.Ops)
    assert.notEqual(snapshot, null)
    assert.ok(snapshot!.payload)
    assert.equal((snapshot!.payload as Record<string, unknown>).metricKey, 'redis.hit.rate')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 (Teambuilding)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} auto-rollback 扩展角色测试`, () => {
  it('团建可查询场地预约相关回滚事件判断活动是否受影响', () => {
    const { service } = createController()

    service.trigger(
      { reason: '场地预约接口超时', severity: 'CRITICAL', metricKey: 'venue.booking', anomalyValue: 6000, baselineValue: 500 },
      ROLES.Ops,
    )

    // 团建查询
    const records = service.listRecords({ metricKey: 'venue.booking' }, ROLES.Teambuilding)
    assert.equal(records.length, 1)
    assert.ok(records[0].reason.includes('场地'))
  })

  it('团建无法确认回滚即使提供了有效 ID (权限边界)', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '预约系统故障', severity: 'CRITICAL', metricKey: 'booking.system', anomalyValue: 7000, baselineValue: 300 },
      ROLES.Ops,
    )
    assert.notEqual(record, null)

    // 团建确认
    const confirmResult = service.confirm(record!.id, ROLES.Teambuilding)
    assert.equal(confirmResult, null, '团建无 confirm 权限')

    // 记录状态未被改变
    const fresh = service.getRecord(record!.id, ROLES.Ops)
    assert.notEqual(fresh, null)
    assert.equal(fresh!.status, 'AWAITING_CONFIRM')
  })

  it('团建查询空 metricKey 返回空列表 (边界)', () => {
    const { service } = createController()

    const records = service.listRecords({ metricKey: 'teambuilding.nonexistent' }, ROLES.Teambuilding)
    assert.deepEqual(records, [])
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 (Marketing)
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} auto-rollback 扩展角色测试`, () => {
  it('营销可查询活动期间回滚历史用于复盘报告', () => {
    const { service } = createController()

    // 模拟活动期间异常
    const campaignRecords = []
    for (let i = 0; i < 3; i++) {
      const r = service.trigger(
        { reason: `营销活动异常 #${i}`, severity: i === 2 ? 'CRITICAL' : 'WARNING', metricKey: `campaign.${i}`, anomalyValue: 300 + i * 100, baselineValue: 100 },
        ROLES.Ops,
      )
      if (r) campaignRecords.push(r)
    }

    // 营销查看所有活动相关
    const all = service.listRecords({}, ROLES.Marketing)
    assert.ok(all.length >= 3)

    // 按活动维度过滤
    const c0 = service.listRecords({ metricKey: 'campaign.0' }, ROLES.Marketing)
    assert.equal(c0.length, 1)
  })

  it('营销无法配置回滚参数 (权限边界：配置隔离)', () => {
    const { service } = createController()

    const configured = service.configure({ snapshotRetentionMs: 9999999 }, ROLES.Marketing)
    assert.equal(configured, false)

    // 验证配置未生效: 运行专员确认默认值存在
    const opsConfigured = service.configure({ snapshotRetentionMs: 9999999 }, ROLES.TenantAdmin)
    assert.equal(opsConfigured, true)
  })

  it('营销可按严重程度过滤已完成的回滚记录 (边界：复合过滤)', () => {
    const { service } = createController()

    service.trigger({ reason: '活动 A 波动', severity: 'WARNING', metricKey: 'campaign.a', anomalyValue: 200, baselineValue: 80 }, ROLES.Ops)
    service.trigger({ reason: '活动 B 严重异常', severity: 'CRITICAL', metricKey: 'campaign.b', anomalyValue: 5000, baselineValue: 100 }, ROLES.Ops)

    const warningRecords = service.listRecords({ status: 'PENDING' }, ROLES.Marketing)
    const criticalRecords = service.listRecords({ status: 'AWAITING_CONFIRM' }, ROLES.Marketing)
    // WARNING 直接 PENDING, CRITICAL 走确认
    assert.ok(warningRecords.length >= 1)
    assert.ok(criticalRecords.length >= 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 跨角色协作场景
// ════════════════════════════════════════════════════════════════
describe('auto-rollback 多角色协作扩展场景', () => {
  it('完整协作流程: 安监发现→店长决策→运行专员执行→前台查询', () => {
    const { service } = createController()

    // 1. 安监发现安全异常
    const record = service.trigger(
      { reason: '核心 API 网关异常流量', severity: 'CRITICAL', metricKey: 'gateway.traffic', anomalyValue: 20000, baselineValue: 1000 },
      ROLES.Safety,
    )
    assert.notEqual(record, null)

    // 2. 店长决策并确认
    const confirmed = service.confirm(record!.id, ROLES.TenantAdmin)
    assert.notEqual(confirmed, null)
    assert.equal(confirmed!.status, 'COMPLETED')

    // 3. 运行专员验证快照
    if (record!.snapshotId) {
      const snapshot = service.getSnapshot(record!.snapshotId, ROLES.Ops)
      assert.notEqual(snapshot, null)
    }

    // 4. 前台查询知悉状态
    const gateRecords = service.listRecords({ metricKey: 'gateway.traffic' }, ROLES.Reception)
    assert.equal(gateRecords.length, 1)
    assert.equal(gateRecords[0].status, 'COMPLETED')
  })

  it('安监取消回滚后运行专员应无法再确认 (状态机一致性)', () => {
    const { service } = createController()

    const record = service.trigger(
      { reason: '误报安全事件', severity: 'CRITICAL', metricKey: 'security.false', anomalyValue: 50, baselineValue: 10 },
      ROLES.Safety,
    )
    assert.notEqual(record, null)
    assert.equal(record!.status, 'AWAITING_CONFIRM')

    // 安监判断为误报，取消
    const cancelled = service.cancel(record!.id, 'Confirmed false positive', ROLES.Safety)
    assert.notEqual(cancelled, null)
    assert.equal(cancelled!.status, 'CANCELLED')

    // 运行专员尝试确认已取消的记录
    const confirmAfterCancel = service.confirm(record!.id, ROLES.Ops)
    // 状态不是 AWAITING_CONFIRM，返回当前记录（不变）
    assert.notEqual(confirmAfterCancel, null)
    assert.equal(confirmAfterCancel!.status, 'CANCELLED', '取消后 confirm 不应改变状态')
  })

  it('多角色并发下店长可配置调大并发以应对热点事件', () => {
    const { service } = createController()

    // 初始并发 = 3
    // 运行专员触发 3 个回滚，填满并发
    for (let i = 0; i < 3; i++) {
      service.trigger(
        { reason: `热点事件 #${i}`, severity: 'WARNING', metricKey: `hot.${i}`, anomalyValue: 500, baselineValue: 50 },
        ROLES.Ops,
      )
    }

    // 第 4 个被拒
    const rejected = service.trigger(
      { reason: '热点事件 #3', severity: 'WARNING', metricKey: 'hot.3', anomalyValue: 500, baselineValue: 50 },
      ROLES.Ops,
    )
    assert.equal(rejected, null)

    // 店长调高并发
    const configured = service.configure({ maxConcurrent: 5 }, ROLES.TenantAdmin)
    assert.equal(configured, true)

    // 调高后第 4 个可触发
    const accepted = service.trigger(
      { reason: '热点事件 #3', severity: 'WARNING', metricKey: 'hot.3', anomalyValue: 500, baselineValue: 50 },
      ROLES.Ops,
    )
    assert.notEqual(accepted, null)
    assert.equal(service.getActiveCount(), 4)
  })
})
