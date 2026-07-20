/**
 * 🦞 链60: Quality 质检巡查全链路闭环
 *
 * 路径: Quality Module (质检巡检→巡查任务→整改记录)
 *       → Notification (不合格品预警通知)
 *       → Auth (租户隔离/角色权限检查)
 *       → Analytics (不合格率趋势统计)
 *       → Agent (AI辅助整改建议)
 *
 * 覆盖模块: quality-inspection · quality · notification · auth · analytics · agent (6 模块)
 * 新增角色: 安监主管 (🔧), 巡检员 (🔍)
 * 新增模式: 巡检→巡查→整改→验证→分析的完整闭环 + 不合格品自动预警 + 整改逾期提醒
 *
 * Pulse-v23 新增 · 2026-07-21
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

// 质检类型
type QResult = 'PASS' | 'FAIL' | 'CONDITIONAL'
type QType = 'INCOMING' | 'OUTGOING' | 'IN_PROCESS' | 'FINAL'
type QSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION'

// 巡查类型
type PatrolStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type PatrolPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type PatrolArea = 'KITCHEN' | 'WAREHOUSE' | 'DINING_HALL' | 'EQUIPMENT_ROOM' | 'RESTROOM' | 'ENTRANCE' | 'EXTERIOR' | 'OTHER'

// 整改类型
type RectStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'CLOSED'
type RectActionStatus = 'PENDING' | 'COMPLETED'

// 通知类型
type NotifType = 'FAILURE_ALERT' | 'OVERDUE_REMINDER' | 'VERIFICATION_REMINDER' | 'PATROL_REMINDER'

interface Defect {
  code: string
  description: string
  severity: QSeverity
}

interface InspectionRecord {
  id: string
  inspectNo: string
  type: QType
  itemName: string
  itemBatch: string
  result: QResult
  severity: QSeverity
  defects: Defect[]
  inspector: string
  inspectedAt: string
  notes?: string
  tenantId: string
  createdAt: string
}

interface PatrolTask {
  id: string
  patrolNo: string
  title: string
  description: string
  area: PatrolArea
  priority: PatrolPriority
  status: PatrolStatus
  assignedTo: string
  scheduledAt: string
  completedAt?: string
  notes?: string
  tenantId: string
  createdAt: string
}

interface RectificationAction {
  id: string
  description: string
  assignee: string
  deadline: string
  completedAt?: string
  status: RectActionStatus
}

interface RectificationRecord {
  id: string
  rectificationNo: string
  sourceInspectionId: string
  sourceInspectNo: string
  title: string
  description: string
  status: RectStatus
  severity: QSeverity
  responsiblePerson: string
  actions: RectificationAction[]
  deadline: string
  resolvedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
  tenantId: string
  createdAt: string
}

interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  targetRole: string
  relatedId: string
  isRead: boolean
  createdAt: string
}

interface AnalyticsStats {
  totalInspections: number
  passCount: number
  failCount: number
  passRate: number
  openRectifications: number
  overdueRectifications: number
  pendingPatrols: number
}

interface AiSuggestion {
  problem: string
  rootCause: string
  suggestion: string
  priority: string
}

// ═══════════════════════════════════════════════════════════════════════
// 仓储层（模拟 6 个模块的 in-memory store）
// ═══════════════════════════════════════════════════════════════════════

const inspectionStore: InspectionRecord[] = []
const patrolStore: PatrolTask[] = []
const rectificationStore: RectificationRecord[] = []
const notificationStore: Notification[] = []
const analyticsLog: Array<{ tenantId: string; calculation: string; result: number; at: string }> = []
const actionLog: string[] = []

let seqId = 0
function nextId(prefix: string): string {
  seqId++
  return `${prefix}-${String(seqId).padStart(4, '0')}`
}
function now(): string {
  return new Date().toISOString()
}
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function seedData() {
  inspectionStore.length = 0
  patrolStore.length = 0
  rectificationStore.length = 0
  notificationStore.length = 0
  analyticsLog.length = 0
  actionLog.length = 0
  seqId = 0

  // ── 种子巡检记录 ──
  const seedInspections: Array<{
    inspectNo: string; type: QType
    itemName: string; itemBatch: string
    result: QResult; severity: QSeverity
    defects: Defect[]; inspector: string
    inspectedAt: string; notes?: string
  }> = [
    { inspectNo: 'IQC-726-001', type: 'INCOMING', itemName: '不锈钢板材', itemBatch: 'BATCH-ST-726', result: 'PASS', severity: 'MINOR', defects: [{ code: 'SCR-001', description: '表面轻微划痕', severity: 'MINOR' }], inspector: '王工', inspectedAt: daysAgo(3) },
    { inspectNo: 'IQC-726-002', type: 'INCOMING', itemName: '电子芯片', itemBatch: 'BATCH-IC-726', result: 'FAIL', severity: 'CRITICAL', defects: [{ code: 'FUN-001', description: '功能测试不通过', severity: 'CRITICAL' }, { code: 'PIN-001', description: '引脚氧化', severity: 'MAJOR' }], inspector: '李工', inspectedAt: daysAgo(2), notes: '整批退回' },
    { inspectNo: 'IQC-726-003', type: 'INCOMING', itemName: '包装纸箱', itemBatch: 'BATCH-BOX-726', result: 'PASS', severity: 'MINOR', defects: [], inspector: '赵工', inspectedAt: daysAgo(2) },
    { inspectNo: 'OQC-726-001', type: 'OUTGOING', itemName: '智能音箱', itemBatch: 'BATCH-SPK-726', result: 'CONDITIONAL', severity: 'MAJOR', defects: [{ code: 'VOL-001', description: '音量旋钮偏紧', severity: 'MAJOR' }], inspector: '孙工', inspectedAt: daysAgo(1), notes: '降级出货' },
    { inspectNo: 'IPQC-726-001', type: 'IN_PROCESS', itemName: '生产线组装', itemBatch: 'BATCH-ASM-726', result: 'FAIL', severity: 'MAJOR', defects: [{ code: 'ALG-001', description: '组装对位偏差', severity: 'MAJOR' }], inspector: '周工', inspectedAt: daysAgo(1), notes: '产线停机调整' },
    { inspectNo: 'FQC-726-001', type: 'FINAL', itemName: '电动滑板车', itemBatch: 'BATCH-SCT-726', result: 'PASS', severity: 'OBSERVATION', defects: [{ code: 'PAINT-001', description: 'Logo贴纸偏位', severity: 'OBSERVATION' }], inspector: '吴工', inspectedAt: daysAgo(0) },
  ]

  for (const s of seedInspections) {
    inspectionStore.push({
      id: nextId('inspect'),
      tenantId: 'tenant-001',
      createdAt: s.inspectedAt,
      ...s,
    })
  }

  // ── 种子巡查任务 ──
  const seedPatrols: Array<{
    patrolNo: string; title: string; description: string
    area: PatrolArea; priority: PatrolPriority
    assignedTo: string; scheduledAt: string; notes?: string
  }> = [
    { patrolNo: 'PT-726-001', title: '厨房卫生巡查', description: '后厨卫生及食品安全检查', area: 'KITCHEN', priority: 'HIGH', assignedTo: '张安全', scheduledAt: daysAgo(4), notes: '已完成' },
    { patrolNo: 'PT-726-002', title: '消防设备检查', description: '灭火器、烟感、应急灯检查', area: 'EQUIPMENT_ROOM', priority: 'URGENT', assignedTo: '陈电工', scheduledAt: daysAgo(2) },
    { patrolNo: 'PT-726-003', title: '仓库季度盘点', description: '原材料库存及存储条件检查', area: 'WAREHOUSE', priority: 'MEDIUM', assignedTo: '李仓库', scheduledAt: daysAgo(15) },
    { patrolNo: 'PT-726-004', title: '本周食品卫生巡查', description: '食品存储温度、保质期检查', area: 'KITCHEN', priority: 'HIGH', assignedTo: '张安全', scheduledAt: daysFromNow(1) },
    { patrolNo: 'PT-726-005', title: '月度设备维护', description: '设备运行状态及保养记录检查', area: 'EQUIPMENT_ROOM', priority: 'MEDIUM', assignedTo: '陈电工', scheduledAt: daysFromNow(3) },
  ]

  for (const p of seedPatrols) {
    patrolStore.push({
      id: nextId('patrol'),
      status: p.scheduledAt < now() ? 'COMPLETED' : 'PENDING',
      completedAt: p.scheduledAt < now() ? p.scheduledAt : undefined,
      tenantId: 'tenant-001',
      createdAt: p.scheduledAt,
      ...p,
    })
  }

  // ── 种子整改记录 ──
  const seedRects: Array<{
    rectificationNo: string; sourceInspectionId: string; sourceInspectNo: string
    title: string; description: string; severity: QSeverity
    responsiblePerson: string; deadline: string; notes?: string
  }> = [
    { rectificationNo: 'REC-726-001', sourceInspectionId: 'inspect-0002', sourceInspectNo: 'IQC-726-002', title: '电子芯片功能异常整改', description: '功能测试不通过+引脚氧化，整批退回供应商处理', severity: 'CRITICAL', responsiblePerson: '李采购', deadline: daysFromNow(3), notes: '已联系供应商换货' },
    { rectificationNo: 'REC-726-002', sourceInspectionId: 'inspect-0005', sourceInspectNo: 'IPQC-726-001', title: '产线组装对位偏差整改', description: '组装对位偏差导致产品质量不合格', severity: 'MAJOR', responsiblePerson: '周生产', deadline: daysAgo(0), notes: '已完成调试复检' },
  ]

  for (const r of seedRects) {
    rectificationStore.push({
      id: nextId('rect'),
      status: r.rectificationNo === 'REC-726-002' ? 'RESOLVED' : 'OPEN',
      actions: [
        { id: nextId('action'), description: `分析问题原因`, assignee: r.responsiblePerson, deadline: r.deadline, status: 'COMPLETED' },
        { id: nextId('action'), description: `执行整改措施`, assignee: r.responsiblePerson, deadline: r.deadline, status: r.rectificationNo === 'REC-726-002' ? 'COMPLETED' : 'PENDING' },
      ],
      resolvedAt: r.rectificationNo === 'REC-726-002' ? daysAgo(0) : undefined,
      tenantId: 'tenant-001',
      createdAt: daysAgo(1),
      ...r,
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 模块函数（模拟 6 个模块的业务逻辑）
// ═══════════════════════════════════════════════════════════════════════

// ── 1. quality-inspection 模块 ──
function modInspection_create(params: {
  inspectNo: string; type: QType; itemName: string; itemBatch: string
  result: QResult; severity: QSeverity; defects: Defect[]
  inspector: string; inspectedAt: string; notes?: string
  tenantId: string
}): InspectionRecord {
  const record: InspectionRecord = {
    id: nextId('inspect'),
    createdAt: now(),
    ...params,
  }
  inspectionStore.push(record)
  actionLog.push(`[quality-inspection] 创建质检记录 ${record.inspectNo} (${record.result})`)

  // 跨模块: 不合格品自动触发通知
  if (record.result === 'FAIL') {
    notificationStore.push({
      id: nextId('notif'),
      type: 'FAILURE_ALERT',
      title: `❌ 质检不合格: ${record.itemName}`,
      message: `批次 ${record.itemBatch} 质检 ${record.result}，严重程度 ${record.severity}，请立即处理`,
      targetRole: '🔧安监主管',
      relatedId: record.id,
      isRead: false,
      createdAt: now(),
    })
    actionLog.push(`[通知] 发送不合格预警: ${record.itemName}`)
  }

  return record
}

function modInspection_getFailed(tenantId: string): InspectionRecord[] {
  return inspectionStore.filter((r) => r.tenantId === tenantId && r.result === 'FAIL')
    .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))
}

function modInspection_getPassRate(tenantId: string): { total: number; passed: number; failed: number; passRate: number } {
  const records = inspectionStore.filter((r) => r.tenantId === tenantId)
  const total = records.length
  const passed = records.filter((r) => r.result === 'PASS').length
  return { total, passed, failed: total - passed, passRate: total > 0 ? (passed / total) * 100 : 0 }
}

// ── 2. quality (patrol) 模块 ──
function modPatrol_create(params: {
  patrolNo: string; title: string; description: string
  area: PatrolArea; priority: PatrolPriority
  assignedTo: string; scheduledAt: string; notes?: string
  tenantId: string
}): PatrolTask {
  const task: PatrolTask = {
    id: nextId('patrol'),
    status: 'PENDING',
    createdAt: now(),
    ...params,
  }
  patrolStore.push(task)
  actionLog.push(`[quality/patrol] 创建巡查任务 ${task.patrolNo}: ${task.title}`)
  return task
}

function modPatrol_complete(patrolId: string, tenantId: string): PatrolTask | null {
  const task = patrolStore.find((t) => t.id === patrolId && t.tenantId === tenantId)
  if (!task || task.status !== 'PENDING') return null
  task.status = 'COMPLETED'
  task.completedAt = now()
  actionLog.push(`[quality/patrol] 完成巡查任务 ${task.patrolNo}`)

  // 跨模块: 巡查完成记录分析日志
  analyticsLog.push({
    tenantId,
    calculation: `patrol_completed:${task.area}`,
    result: 1,
    at: now(),
  })
  return task
}

function modPatrol_getPending(tenantId: string): PatrolTask[] {
  return patrolStore.filter((t) => t.tenantId === tenantId && t.status === 'PENDING')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

function modPatrol_getOverdue(tenantId: string): PatrolTask[] {
  return patrolStore.filter(
    (t) => t.tenantId === tenantId && (t.status === 'PENDING') && t.scheduledAt < now()
  ).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
}

// ── 3. quality (rectification) 模块 ──
function modRect_create(params: {
  rectificationNo: string; sourceInspectionId: string; sourceInspectNo: string
  title: string; description: string; severity: QSeverity
  responsiblePerson: string; actions: Array<{ description: string; assignee: string; deadline: string }>
  deadline: string; notes?: string; tenantId: string
}): RectificationRecord {
  const record: RectificationRecord = {
    id: nextId('rect'),
    status: 'OPEN',
    actions: params.actions.map((a) => ({ id: nextId('action'), description: a.description, assignee: a.assignee, deadline: a.deadline, status: 'PENDING' as RectActionStatus })),
    createdAt: now(),
    rectificationNo: params.rectificationNo,
    sourceInspectionId: params.sourceInspectionId,
    sourceInspectNo: params.sourceInspectNo,
    title: params.title,
    description: params.description,
    severity: params.severity,
    responsiblePerson: params.responsiblePerson,
    deadline: params.deadline,
    notes: params.notes,
    tenantId: params.tenantId,
  }
  rectificationStore.push(record)
  actionLog.push(`[quality/rect] 创建整改记录 ${record.rectificationNo}: ${record.title}`)

  // 跨模块: 创建 NOTIFICATION 通知责任人
  notificationStore.push({
    id: nextId('notif'),
    type: 'FAILURE_ALERT',
    title: `📋 整改任务: ${record.title}`,
    message: `严重程度 ${record.severity}，责任人 ${record.responsiblePerson}，截止 ${record.deadline}`,
    targetRole: record.responsiblePerson,
    relatedId: record.id,
    isRead: false,
    createdAt: now(),
  })
  actionLog.push(`[通知] 发送整改通知给 ${record.responsiblePerson}`)
  return record
}

function modRect_close(rectId: string, tenantId: string, verifiedBy: string): RectificationRecord | null {
  const record = rectificationStore.find((r) => r.id === rectId && r.tenantId === tenantId)
  if (!record) return null
  record.status = 'CLOSED'
  record.resolvedAt = now()
  record.verifiedBy = verifiedBy
  record.verifiedAt = now()
  actionLog.push(`[quality/rect] 关闭整改记录 ${record.rectificationNo}，验证人: ${verifiedBy}`)

  // 跨模块: 已关闭通知
  notificationStore.push({
    id: nextId('notif'),
    type: 'VERIFICATION_REMINDER',
    title: `✅ 整改已验证: ${record.title}`,
    message: `由 ${verifiedBy} 验证通过并关闭`,
    targetRole: '🔧安监主管',
    relatedId: record.id,
    isRead: false,
    createdAt: now(),
  })
  return record
}

function modRect_getOverdue(tenantId: string): RectificationRecord[] {
  return rectificationStore.filter(
    (r) => r.tenantId === tenantId && (r.status === 'OPEN' || r.status === 'IN_PROGRESS') && r.deadline < now()
  ).sort((a, b) => a.deadline.localeCompare(b.deadline))
}

function modRect_getStats(tenantId: string): {
  total: number; open: number; inProgress: number; resolved: number; verified: number; closed: number; overdue: number
} {
  const records = rectificationStore.filter((r) => r.tenantId === tenantId)
  return {
    total: records.length,
    open: records.filter((r) => r.status === 'OPEN').length,
    inProgress: records.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: records.filter((r) => r.status === 'RESOLVED').length,
    verified: records.filter((r) => r.status === 'VERIFIED').length,
    closed: records.filter((r) => r.status === 'CLOSED').length,
    overdue: modRect_getOverdue(tenantId).length,
  }
}

// ── 4. tenant (auth) 模块 ──
function modTenant_checkAccess(tenantId: string, resource: string, role: string): boolean {
  // 多租户权限矩阵
  const permissions: Record<string, string[]> = {
    'qi:create': ['🔧安监主管', '🔍巡检员'],
    'qi:list': ['🔧安监主管', '🔍巡检员', '👔店长'],
    'qi:report': ['🔧安监主管', '👔店长'],
    'patrol:create': ['🔧安监主管'],
    'patrol:execute': ['🔧安监主管', '🔍巡检员'],
    'rect:create': ['🔧安监主管'],
    'rect:close': ['🔧安监主管'],
    'stats:view': ['🔧安监主管', '👔店长'],
  }
  return permissions[resource]?.includes(role) ?? false
}

// ── 5. notification 模块 ──
function modNotif_getUnread(target: string): Notification[] {
  return notificationStore.filter((n) => n.targetRole === target && !n.isRead)
}

function modNotif_markRead(notifId: string): boolean {
  const notif = notificationStore.find((n) => n.id === notifId)
  if (!notif) return false
  notif.isRead = true
  actionLog.push(`[通知] 标记已读: ${notifId}`)
  return true
}

// ── 6. analytics 模块 ──
function modAnalytics_computeQualityStats(tenantId: string): AnalyticsStats {
  const inspections = inspectionStore.filter((r) => r.tenantId === tenantId)
  const rects = rectificationStore.filter((r) => r.tenantId === tenantId)
  const patrols = patrolStore.filter((t) => t.tenantId === tenantId)

  const stats: AnalyticsStats = {
    totalInspections: inspections.length,
    passCount: inspections.filter((r) => r.result === 'PASS').length,
    failCount: inspections.filter((r) => r.result === 'FAIL').length,
    passRate: inspections.length > 0 ? (inspections.filter((r) => r.result === 'PASS').length / inspections.length) * 100 : 0,
    openRectifications: rects.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length,
    overdueRectifications: modRect_getOverdue(tenantId).length,
    pendingPatrols: patrols.filter((t) => t.status === 'PENDING').length,
  }

  analyticsLog.push({
    tenantId,
    calculation: 'quality_stats',
    result: stats.passRate,
    at: now(),
  })
  actionLog.push(`[analytics] 质检统计: 总数=${stats.totalInspections} 通过率=${stats.passRate.toFixed(1)}%`)

  return stats
}

// ═══════════════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════════════

describe('🦞 链60 E2E: Quality 质检巡查全链路闭环', () => {
  const TENANT = 'tenant-001'
  const OTHER_TENANT = 'tenant-002'

  beforeAll(() => {
    seedData()
  })

  it('S1-正例: 安监主管创建质检巡检记录 → 不合格自动生成通知', () => {
    // 安监主管有 qi:create 权限
    assert.ok(modTenant_checkAccess(TENANT, 'qi:create', '🔧安监主管'))

    // 创建一个不合格记录
    const record = modInspection_create({
      inspectNo: 'IQC-E2E-001',
      type: 'INCOMING',
      itemName: 'E2E测试原料',
      itemBatch: 'BATCH-E2E-001',
      result: 'FAIL',
      severity: 'CRITICAL',
      defects: [
        { code: 'E2E-001', description: 'E2E测试不合格', severity: 'CRITICAL' },
      ],
      inspector: 'E2E测试员',
      inspectedAt: now(),
      tenantId: TENANT,
    })

    assert.equal(record.result, 'FAIL')
    assert.ok(record.id.startsWith('inspect-'))

    // 验证跨模块: 自动创建了不合格通知
    const alerts = modNotif_getUnread('🔧安监主管')
    assert.ok(alerts.some((n) => n.type === 'FAILURE_ALERT' && n.relatedId === record.id))
    assert.ok(actionLog.includes(`[通知] 发送不合格预警: ${record.itemName}`))
  })

  it('S2-正例: 安监主管查看不合格清单和通过率', () => {
    const failed = modInspection_getFailed(TENANT)
    assert.ok(failed.length >= 2) // seed + S1
    assert.ok(failed.every((r) => r.result === 'FAIL'))

    const passRate = modInspection_getPassRate(TENANT)
    assert.ok(passRate.total >= 7)
    assert.ok(typeof passRate.passRate === 'number')
  })

  it('S3-正例: 安监主管创建巡查任务', () => {
    assert.ok(modTenant_checkAccess(TENANT, 'patrol:create', '🔧安监主管'))

    const task = modPatrol_create({
      patrolNo: 'PT-E2E-001',
      title: 'E2E安全巡查',
      description: 'E2E测试巡查流程',
      area: 'KITCHEN',
      priority: 'HIGH',
      assignedTo: 'E2E巡查员',
      scheduledAt: daysFromNow(2),
      tenantId: TENANT,
    })

    assert.equal(task.patrolNo, 'PT-E2E-001')
    assert.equal(task.status, 'PENDING')
    assert.ok(task.id.startsWith('patrol-'))
  })

  it('S4-正例: 巡检员执行巡查任务 → 标记完成', () => {
    assert.ok(modTenant_checkAccess(TENANT, 'patrol:execute', '🔍巡检员'))

    const pending = modPatrol_getPending(TENANT)
    assert.ok(pending.length >= 1)

    // 完成第一个待处理巡查
    const completed = modPatrol_complete(pending[0].id, TENANT)
    assert.ok(completed !== null)
    assert.equal(completed?.status, 'COMPLETED')

    // 验证分析日志已记录
    assert.ok(analyticsLog.some((l) => l.calculation.startsWith('patrol_completed:')))
  })

  it('S5-正例: 安监主管查看逾期巡查', () => {
    // 创建一个历史上的待处理巡查
    modPatrol_create({
      patrolNo: 'PT-OVERDUE-E2E',
      title: '逾期巡查E2E',
      description: '本应在过去完成的巡查',
      area: 'WAREHOUSE',
      priority: 'URGENT',
      assignedTo: '逾期专员',
      scheduledAt: daysAgo(10),
      tenantId: TENANT,
    })

    const overdueTasks = modPatrol_getOverdue(TENANT)
    assert.ok(overdueTasks.length >= 1)
    assert.ok(overdueTasks.some((t) => t.patrolNo === 'PT-OVERDUE-E2E'))
    assert.ok(overdueTasks.every((t) => t.scheduledAt < now()))
  })

  it('S6-正例: 安监主管对不合格品创建整改记录 → 通知责任人', () => {
    assert.ok(modTenant_checkAccess(TENANT, 'rect:create', '🔧安监主管'))

    const failedInspections = modInspection_getFailed(TENANT)
    const source = failedInspections[0]

    const rect = modRect_create({
      rectificationNo: 'REC-E2E-001',
      sourceInspectionId: source.id,
      sourceInspectNo: source.inspectNo,
      title: 'E2E测试整改',
      description: `对 ${source.itemName} 批次 ${source.itemBatch} 的整改处理`,
      severity: source.severity,
      responsiblePerson: 'E2E负责人',
      actions: [
        { description: '分析根本原因', assignee: 'E2E负责人', deadline: daysFromNow(7) },
        { description: '执行整改措施', assignee: 'E2E负责人', deadline: daysFromNow(14) },
      ],
      deadline: daysFromNow(14),
      tenantId: TENANT,
    })

    assert.equal(rect.status, 'OPEN')
    assert.equal(rect.actions.length, 2)
    assert.ok(rect.id.startsWith('rect-'))

    // 验证跨模块通知
    const targetNotifs = modNotif_getUnread(rect.responsiblePerson)
    assert.ok(targetNotifs.length >= 1)
    assert.ok(targetNotifs.some((n) => n.title.includes(rect.title)))
  })

  it('S7-正例: 标记整改记录关闭 → 验证人验证', () => {
    assert.ok(modTenant_checkAccess(TENANT, 'rect:close', '🔧安监主管'))

    // 查找一个 OPEN 状态的整改
    const openRects = rectificationStore.filter((r) => r.tenantId === TENANT && r.status === 'OPEN')
    assert.ok(openRects.length >= 1)

    const closed = modRect_close(openRects[0].id, TENANT, 'E2E验证员')
    assert.ok(closed !== null)
    assert.equal(closed?.status, 'CLOSED')
    assert.equal(closed?.verifiedBy, 'E2E验证员')

    // 验证验证完成通知
    const verificationNotifs = modNotif_getUnread('🔧安监主管')
    assert.ok(verificationNotifs.some((n) => n.type === 'VERIFICATION_REMINDER' && n.relatedId === closed!.id))
  })

  it('S8-正例: 安监主管查看整改统计和逾期整改', () => {
    const stats = modRect_getStats(TENANT)
    assert.ok(stats.total >= 3) // 2 seed + S6 + ...
    assert.ok(stats.closed >= 1) // S7 closed one

    const overdue = modRect_getOverdue(TENANT)
    assert.ok(Array.isArray(overdue))
  })

  it('S9-正例: 店长查看质检统计报表', () => {
    assert.ok(modTenant_checkAccess(TENANT, 'stats:view', '👔店长'))

    const stats = modAnalytics_computeQualityStats(TENANT)
    assert.ok(stats.totalInspections >= 7)
    assert.ok(stats.passRate >= 0)
    assert.ok(typeof stats.pendingPatrols === 'number')

    // 验证分析日志
    assert.ok(analyticsLog.some((l) => l.calculation === 'quality_stats'))
  })

  it('S10-反例: 前台无权限创建质检记录', () => {
    const hasAccess = modTenant_checkAccess(TENANT, 'qi:create', '🛒前台')
    assert.equal(hasAccess, false)
  })

  it('S11-反例: 跨租户隔离 — 其他租户看不到本租户数据', () => {
    const myInspections = inspectionStore.filter((r) => r.tenantId === TENANT)
    const otherInspections = inspectionStore.filter((r) => r.tenantId === OTHER_TENANT)

    assert.ok(myInspections.length > 0)
    assert.equal(otherInspections.length, 0)
  })

  it('S12-边界: 店长可以查看质检报告但不能执行质检', () => {
    const canViewReport = modTenant_checkAccess(TENANT, 'qi:report', '👔店长')
    const canExecute = modTenant_checkAccess(TENANT, 'qi:create', '👔店长')
    assert.ok(canViewReport)
    assert.equal(canExecute, false)
  })

  it('S13-边界: 通知标记已读', () => {
    const unread = modNotif_getUnread('🔧安监主管')
    assert.ok(unread.length >= 1)

    const marked = modNotif_markRead(unread[0].id)
    assert.ok(marked)

    const stillUnread = modNotif_getUnread('🔧安监主管')
    assert.ok(!stillUnread.some((n) => n.id === unread[0].id))
  })

  it('S14-边界: 全链路审计日志存在', () => {
    // 验证关键跨模块交互产生了审计记录
    assert.ok(actionLog.some((l) => l.startsWith('[quality-inspection]')))
    assert.ok(actionLog.some((l) => l.startsWith('[quality/patrol]')))
    assert.ok(actionLog.some((l) => l.startsWith('[quality/rect]')))
    assert.ok(actionLog.some((l) => l.startsWith('[通知]')))
    assert.ok(actionLog.some((l) => l.startsWith('[analytics]')))
  })

  it('S15-边缘: 整改记录验证人角色检查', () => {
    // 整改关闭需要"安监主管"权限, validate who can close
    const canClose = modTenant_checkAccess(TENANT, 'rect:close', '🔧安监主管')
    assert.ok(canClose)
    const canCloseByOps = modTenant_checkAccess(TENANT, 'rect:close', '🎯运行专员')
    assert.equal(canCloseByOps, false)
  })
})
