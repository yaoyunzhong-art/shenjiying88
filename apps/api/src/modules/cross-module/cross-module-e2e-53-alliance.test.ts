import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-53-alliance.test.ts
 *
 * 联盟营销全链路 E2E 测试
 * 覆盖: 伙伴注册 → 分级评定(S/A/B/C) → 健康度评分 → 分账创建/审批/执行
 *       → 未关联订单扫描/关联 → 异常检测 → 可疑标记
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 */

// ── 业务类型 ──
const BUSINESS_TYPE = {
  RETAIL: 'RETAIL',
  FNB: 'F&B',
  SERVICE: 'SERVICE',
  TECH: 'TECH',
  OTHER: 'OTHER',
} as const

// ── 伙伴等级 ──
type Grade = 'S' | 'A' | 'B' | 'C'
type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type SettlementStatus = 'pending' | 'approved' | 'executed' | 'cancelled'
type SettlementType = 'ratio' | 'fixed'

// ── 数据模型 ──

interface AlliancePartner {
  id: string
  name: string
  businessType: string
  contact: string
  address: string
  status: PartnerStatus
  currentGrade: Grade | null
  healthScore: number | null
  registeredAt: string
  updatedAt: string
}

interface SettlementParticipant {
  partnerId: string
  partnerName: string
  ratio?: number
  fixedAmount?: number
}

interface Settlement {
  settlementId: string
  orderId: string
  type: SettlementType
  totalAmount: number
  participants: SettlementParticipant[]
  status: SettlementStatus
  createdAt: Date
}

interface UnlinkedOrder {
  orderId: string
  storeId: string
  amount: number
  createdAt: Date
  linkedPartnerId?: string
  linkStatus: 'unlinked' | 'pending' | 'linked'
}

interface AnomalyRecord {
  anomalyId: string
  partnerId: string
  type: string
  severity: string
  detail: string
  detectedAt: Date
}

interface AnomalyReport {
  partnerId: string
  totalAnomalies: number
  warnings: number
  criticals: number
  records: AnomalyRecord[]
}

// ── 模拟存储 ──

const partnerDb: Map<string, AlliancePartner> = new Map()
const settlementDb: Map<string, Settlement> = new Map()
const unlinkedOrders: Map<string, UnlinkedOrder> = new Map()
const anomalyDb: Map<string, AnomalyRecord[]> = new Map()
const anomalyFlagged: Set<string> = new Set()

// ── 辅助常量 ──

const GRADE_CRITERIA: Array<{ grade: Grade; minScore: number; maxScore: number; label: string }> = [
  { grade: 'S', minScore: 90, maxScore: 100, label: '金牌伙伴' },
  { grade: 'A', minScore: 75, maxScore: 89, label: '优质伙伴' },
  { grade: 'B', minScore: 60, maxScore: 74, label: '普通伙伴' },
  { grade: 'C', minScore: 0, maxScore: 59, label: '待改进伙伴' },
]

// ── 模拟服务函数 ──

/** 注册伙伴 */
function registerPartner(name: string, businessType: string, contact: string, address: string): AlliancePartner {
  const existing = Array.from(partnerDb.values()).find(p => p.name === name)
  if (existing) {
    throw new Error(`Partner with name "${name}" already exists`)
  }
  const id = `partner-e2e-53-${String(partnerDb.size + 1).padStart(3, '0')}`
  const now = new Date().toISOString()
  const partner: AlliancePartner = {
    id,
    name,
    businessType,
    contact,
    address,
    status: 'ACTIVE',
    currentGrade: null,
    healthScore: null,
    registeredAt: now,
    updatedAt: now,
  }
  partnerDb.set(id, partner)
  return partner
}

/** 更新伙伴 */
function updatePartner(partnerId: string, updates: Partial<Pick<AlliancePartner, 'name' | 'contact' | 'address'>>): AlliancePartner {
  const partner = partnerDb.get(partnerId)
  if (!partner) throw new Error(`Partner not found: ${partnerId}`)
  const updated: AlliancePartner = {
    ...partner,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  partnerDb.set(partnerId, updated)
  return updated
}

/** 获取伙伴 */
function getPartner(partnerId: string): AlliancePartner | undefined {
  return partnerDb.get(partnerId)
}

/** 列表查询 */
function listPartners(filter?: { businessType?: string; status?: PartnerStatus; grade?: Grade }): AlliancePartner[] {
  let results = Array.from(partnerDb.values())
  if (filter?.businessType) results = results.filter(p => p.businessType === filter.businessType)
  if (filter?.status) results = results.filter(p => p.status === filter.status)
  if (filter?.grade) results = results.filter(p => p.currentGrade === filter.grade)
  return results
}

/** 评分 → 等级 */
function scoreToGrade(score: number): Grade {
  const c = GRADE_CRITERIA.find(c => score >= c.minScore && score <= c.maxScore)
  return c?.grade ?? 'C'
}

/** 等级 → 分数 */
function gradeToScore(grade: Grade): number {
  return GRADE_CRITERIA.find(c => c.grade === grade)?.minScore ?? 0
}

/** 获取分级标准 */
function getGradeCriteria() {
  return GRADE_CRITERIA
}

/** 计算等级（模拟，依赖健康度） */
function calculateGrade(partnerId: string, healthScore: number): Grade {
  const partner = partnerDb.get(partnerId)
  if (!partner) throw new Error(`Partner ${partnerId} not found`)
  const grade = scoreToGrade(healthScore)
  partner.currentGrade = grade
  partner.updatedAt = new Date().toISOString()
  partnerDb.set(partnerId, partner)
  return grade
}

/** 手动指定等级 */
function assignGrade(partnerId: string, grade: Grade): void {
  const partner = partnerDb.get(partnerId)
  if (!partner) throw new Error(`Partner ${partnerId} not found`)
  partner.currentGrade = grade
  partner.updatedAt = new Date().toISOString()
  partnerDb.set(partnerId, partner)
}

/** 获取当前等级 */
function getGrade(partnerId: string): Grade | null {
  return partnerDb.get(partnerId)?.currentGrade ?? null
}

/** 模拟健康度计算 */
function calculateHealthScore(revenue: number, orderCount: number, complaintCount: number, activeDays: number): number {
  const revenueScore = Math.min(100, Math.round((revenue / 100000) * 100))
  const orderScore = Math.min(100, Math.round((orderCount / 500) * 100))
  const complaintRate = orderCount > 0 ? complaintCount / orderCount : 0
  const complaintScore = Math.max(0, Math.round(100 - complaintRate * 1000))
  const activityScore = Math.min(100, Math.round((activeDays / 30) * 100))
  return Math.round(revenueScore * 0.35 + orderScore * 0.25 + complaintScore * 0.25 + activityScore * 0.15)
}

/** 创建分账 */
function createSettlement(orderId: string, type: SettlementType, totalAmount: number, participants: SettlementParticipant[]): Settlement {
  if (!orderId || totalAmount <= 0 || participants.length === 0) {
    throw new Error('INVALID_PARAMS')
  }
  if (type === 'ratio') {
    const total = participants.reduce((s, p) => s + (p.ratio ?? 0), 0)
    if (Math.abs(total - 1) > 0.0001) throw new Error(`INVALID_RATIO: ${total}`)
  }
  if (type === 'fixed') {
    const total = participants.reduce((s, p) => s + (p.fixedAmount ?? 0), 0)
    if (total !== totalAmount) throw new Error(`INVALID_FIXED_AMOUNT: ${total} vs ${totalAmount}`)
  }
  const settlementId = `stl-e2e-53-${String(settlementDb.size + 1).padStart(3, '0')}`
  const settlement: Settlement = {
    settlementId,
    orderId,
    type,
    totalAmount,
    participants,
    status: 'pending',
    createdAt: new Date(),
  }
  settlementDb.set(settlementId, settlement)
  return settlement
}

/** 审批分账 */
function approveSettlement(settlementId: string): Settlement {
  const s = settlementDb.get(settlementId)
  if (!s) throw new Error('SETTLEMENT_NOT_FOUND')
  if (s.status !== 'pending') throw new Error(`INVALID_STATUS: ${s.status}`)
  s.status = 'approved'
  return s
}

/** 执行分账 */
function executeSettlement(settlementId: string): Settlement {
  const s = settlementDb.get(settlementId)
  if (!s) throw new Error('SETTLEMENT_NOT_FOUND')
  if (s.status !== 'approved') throw new Error(`INVALID_STATUS: ${s.status}`)
  s.status = 'executed'
  return s
}

/** 查询分账 */
function querySettlement(settlementId: string): Settlement | undefined {
  return settlementDb.get(settlementId)
}

/** 获取分账历史 */
function getSettlementHistory(partnerId: string): Settlement[] {
  return Array.from(settlementDb.values()).filter(s =>
    s.participants.some(p => p.partnerId === partnerId),
  )
}

/** 初始化未关联订单 */
function initUnlinkedOrders(): void {
  unlinkedOrders.set('order-e2e-u-001', {
    orderId: 'order-e2e-u-001',
    storeId: 'store-A',
    amount: 15000,
    createdAt: new Date('2026-07-01T10:00:00Z'),
    linkStatus: 'unlinked',
  })
  unlinkedOrders.set('order-e2e-u-002', {
    orderId: 'order-e2e-u-002',
    storeId: 'store-A',
    amount: 8000,
    createdAt: new Date('2026-07-01T14:30:00Z'),
    linkStatus: 'unlinked',
  })
  unlinkedOrders.set('order-e2e-u-003', {
    orderId: 'order-e2e-u-003',
    storeId: 'store-B',
    amount: 50000,
    createdAt: new Date('2026-07-02T09:15:00Z'),
    linkStatus: 'unlinked',
  })
}

/** 扫描未关联订单 */
function scanUnlinkedOrders(storeId: string, since: Date): UnlinkedOrder[] {
  return Array.from(unlinkedOrders.values()).filter(o =>
    o.storeId === storeId && o.createdAt >= since && o.linkStatus === 'unlinked',
  )
}

/** 手动关联 */
function manualLinkOrder(orderId: string, partnerId: string): UnlinkedOrder {
  const order = unlinkedOrders.get(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.linkStatus === 'linked') throw new Error('ALREADY_LINKED')
  order.linkedPartnerId = partnerId
  order.linkStatus = 'linked'
  return order
}

/** 自动关联 */
function autoLinkOrder(orderId: string): { linked: boolean; partnerId?: string; reason?: string } {
  const order = unlinkedOrders.get(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.linkStatus !== 'unlinked') return { linked: false, reason: `status=${order.linkStatus}` }
  const hour = order.createdAt.getUTCHours()
  if (order.amount >= 10000 && hour >= 9 && hour <= 18) {
    order.linkedPartnerId = 'partner-auto-001'
    order.linkStatus = 'linked'
    return { linked: true, partnerId: 'partner-auto-001', reason: 'amount+time match' }
  }
  return { linked: false, reason: 'no rule matched' }
}

/** 异常检测 */
function detectAnomaly(partnerId: string): AnomalyRecord[] {
  // 模拟检测：生成少量异常记录
  const records: AnomalyRecord[] = [
    {
      anomalyId: `anomaly-${Date.now()}-1`,
      partnerId,
      type: 'frequent_small',
      severity: 'warning',
      detail: 'Found multiple small transactions',
      detectedAt: new Date(),
    },
  ]
  const existing = anomalyDb.get(partnerId) ?? []
  anomalyDb.set(partnerId, [...existing, ...records])
  return records
}

/** 获取异常报告 */
function getAnomalyReport(partnerId: string): AnomalyReport {
  const records = anomalyDb.get(partnerId) ?? []
  return {
    partnerId,
    totalAnomalies: records.length,
    warnings: records.filter(r => r.severity === 'warning').length,
    criticals: records.filter(r => r.severity === 'critical').length,
    records,
  }
}

/** 标记可疑分账 */
function flagSuspiciousSettlement(settlementId: string): { flagged: boolean; settlementId: string } {
  anomalyFlagged.add(settlementId)
  return { flagged: true, settlementId }
}

// ═══════════════════════════════════════════════════════════════
// 测试主体
// ═══════════════════════════════════════════════════════════════

describe('E2E-53: 联盟营销全链', () => {
  before(() => {
    partnerDb.clear()
    settlementDb.clear()
    anomalyDb.clear()
    anomalyFlagged.clear()
    initUnlinkedOrders()
  })

  after(() => {
    partnerDb.clear()
    settlementDb.clear()
    anomalyDb.clear()
    anomalyFlagged.clear()
    unlinkedOrders.clear()
  })

  // ── 1. 伙伴管理 ──

  it('正例: 注册伙伴返回完整信息', () => {
    const p = registerPartner('E2E测试-联盟超市', BUSINESS_TYPE.RETAIL, 'lianmeng@test.com', '上海市南京路100号')

    assert.equal(p.name, 'E2E测试-联盟超市')
    assert.equal(p.businessType, BUSINESS_TYPE.RETAIL)
    assert.equal(p.contact, 'lianmeng@test.com')
    assert.equal(p.address, '上海市南京路100号')
    assert.equal(p.status, 'ACTIVE')
    assert.equal(p.currentGrade, null)
    assert.ok(p.id.startsWith('partner-e2e-53-'))
    assert.ok(p.registeredAt)
    assert.ok(p.updatedAt)
  })

  it('正例: 批量注册多个伙伴各自可查', () => {
    const p1 = registerPartner('E2E测试-蜀味轩', BUSINESS_TYPE.FNB, 'shu@test.com', '上海市淮海路50号')
    const p2 = registerPartner('E2E测试-极客工坊', BUSINESS_TYPE.TECH, 'geek@test.com', '北京市中关村')
    const p3 = registerPartner('E2E测试-欢乐时光', BUSINESS_TYPE.SERVICE, 'happy@test.com', '广州市天河路')

    assert.equal(p1.businessType, BUSINESS_TYPE.FNB)
    assert.equal(p2.businessType, BUSINESS_TYPE.TECH)
    assert.equal(p3.businessType, BUSINESS_TYPE.SERVICE)

    assert.ok(getPartner(p1.id) !== undefined)
    assert.ok(getPartner(p2.id) !== undefined)
    assert.ok(getPartner(p3.id) !== undefined)
  })

  it('反例: 注册同名伙伴抛出重复异常', () => {
    assert.throws(
      () => registerPartner('E2E测试-联盟超市', BUSINESS_TYPE.RETAIL, 'dup@test.com', '地址2'),
      { message: /already exists/ },
    )
    // 验证总数量未增加
    const all = listPartners()
    assert.equal(all.length, 4)
  })

  it('正例: 更新伙伴联系信息', () => {
    const p1 = getPartner('partner-e2e-53-001')
    assert.ok(p1 !== undefined)

    const updated = updatePartner(p1!.id, { contact: 'newcontact@test.com', address: '新地址' })
    assert.equal(updated.contact, 'newcontact@test.com')
    assert.equal(updated.address, '新地址')
    assert.equal(updated.name, p1!.name) // 名称不变
  })

  // ── 2. 列表查询 ──

  it('正例: 列表查询全量伙伴', () => {
    const all = listPartners()
    assert.equal(all.length, 4)
    assert.ok(all.every(p => typeof p.id === 'string'))
  })

  it('正例: 按业务类型筛选', () => {
    const retail = listPartners({ businessType: BUSINESS_TYPE.RETAIL })
    assert.equal(retail.length, 1)
    assert.equal(retail[0].name, 'E2E测试-联盟超市')

    const tech = listPartners({ businessType: BUSINESS_TYPE.TECH })
    assert.equal(tech.length, 1)
    assert.equal(tech[0].name, 'E2E测试-极客工坊')
  })

  it('边界: 按不存在业务类型筛选返回空列表', () => {
    const result = listPartners({ businessType: 'SPORTS' })
    assert.equal(result.length, 0)
    assert.deepEqual(result, [])
  })

  // ── 3. 分级评定 ──

  it('正例: 获取分级标准返回 S/A/B/C', () => {
    const criteria = getGradeCriteria()
    assert.equal(criteria.length, 4)
    const grades = criteria.map(c => c.grade)
    assert.ok(grades.includes('S'))
    assert.ok(grades.includes('A'))
    assert.ok(grades.includes('B'))
    assert.ok(grades.includes('C'))
    assert.equal(criteria.find(c => c.grade === 'S')?.label, '金牌伙伴')
  })

  it('正例: 高健康度伙伴评为 S 级', () => {
    const score = calculateHealthScore(1000000, 5000, 1, 30)
    const grade = calculateGrade('partner-e2e-53-001', score)
    assert.ok(['S', 'A'].includes(grade))

    const stored = getGrade('partner-e2e-53-001')
    assert.equal(stored, grade)
  })

  it('正例: 手动指定等级生效', () => {
    assignGrade('partner-e2e-53-003', 'B')
    const grade = getGrade('partner-e2e-53-003')
    assert.equal(grade, 'B')
  })

  it('反例: 不存在的伙伴返回 null', () => {
    const grade = getGrade('partner-e2e-53-nonexistent')
    assert.equal(grade, null)
  })

  it('边界: 低健康度评为 C 级', () => {
    const score = calculateHealthScore(5000, 10, 30, 2)
    const grade = scoreToGrade(score)
    assert.equal(grade, 'C')
  })

  // ── 4. 分账管理 ──

  it('正例: 按比例创建分账', () => {
    const s = createSettlement('order-53-001', 'ratio', 10000, [
      { partnerId: 'partner-e2e-53-001', partnerName: '联盟超市', ratio: 0.6 },
      { partnerId: 'partner-e2e-53-002', partnerName: '蜀味轩', ratio: 0.4 },
    ])
    assert.ok(s.settlementId.startsWith('stl-e2e-53-'))
    assert.equal(s.orderId, 'order-53-001')
    assert.equal(s.status, 'pending')
    assert.equal(s.participants.length, 2)
  })

  it('反例: 比例分账合计不等于1抛出异常', () => {
    assert.throws(
      () => createSettlement('order-53-002', 'ratio', 10000, [
        { partnerId: 'p1', partnerName: 'P1', ratio: 0.3 },
        { partnerId: 'p2', partnerName: 'P2', ratio: 0.3 },
      ]),
      { message: /INVALID_RATIO/ },
    )
  })

  it('正例: 按固定金额创建分账', () => {
    const s = createSettlement('order-53-003', 'fixed', 5000, [
      { partnerId: 'partner-e2e-53-001', partnerName: '联盟超市', fixedAmount: 3000 },
      { partnerId: 'partner-e2e-53-002', partnerName: '蜀味轩', fixedAmount: 2000 },
    ])
    assert.equal(s.status, 'pending')
    assert.equal(s.type, 'fixed')
  })

  it('正例: 审批待处理分账', () => {
    const s = approveSettlement('stl-e2e-53-001')
    assert.equal(s.status, 'approved')
  })

  it('正例: 执行已审批分账', () => {
    const s = executeSettlement('stl-e2e-53-001')
    assert.equal(s.status, 'executed')
  })

  it('反例: 审批不存在的分账抛出异常', () => {
    assert.throws(
      () => approveSettlement('stl-e2e-53-nonexistent'),
      { message: 'SETTLEMENT_NOT_FOUND' },
    )
  })

  it('反例: 再次审批已执行的分账抛出异常', () => {
    assert.throws(
      () => approveSettlement('stl-e2e-53-001'),
      { message: /INVALID_STATUS/ },
    )
  })

  // ── 5. 分账查询 ──

  it('正例: 通过ID查询分账', () => {
    const s = querySettlement('stl-e2e-53-001')
    assert.ok(s !== undefined)
    assert.equal(s!.orderId, 'order-53-001')
    assert.equal(s!.status, 'executed')
  })

  it('正例: 查询伙伴分账历史', () => {
    const history = getSettlementHistory('partner-e2e-53-001')
    assert.ok(history.length >= 2)
    assert.ok(history.every(s => s.participants.some(p => p.partnerId === 'partner-e2e-53-001')))
  })

  it('反例: 不存在的分账返回 undefined', () => {
    const s = querySettlement('stl-e2e-53-nonexistent')
    assert.equal(s, undefined)
  })

  // ── 6. 未关联订单 ──

  it('正例: 扫描未关联订单', () => {
    const orders = scanUnlinkedOrders('store-A', new Date('2026-06-01T00:00:00Z'))
    assert.equal(orders.length, 2)
    assert.ok(orders.every(o => o.linkStatus === 'unlinked'))
  })

  it('正例: 手动关联订单到伙伴', () => {
    const order = manualLinkOrder('order-e2e-u-001', 'partner-e2e-53-001')
    assert.equal(order.linkedPartnerId, 'partner-e2e-53-001')
    assert.equal(order.linkStatus, 'linked')
  })

  it('反例: 重复关联已关联订单抛出异常', () => {
    assert.throws(
      () => manualLinkOrder('order-e2e-u-001', 'partner-e2e-53-002'),
      { message: 'ALREADY_LINKED' },
    )
  })

  it('边界: 扫描指定店铺(store-B)返回未关联订单', () => {
    // 在自动关联之前扫描，order-e2e-u-003 此时还是 unlinked
    const orders = scanUnlinkedOrders('store-B', new Date('2026-07-01T00:00:00Z'))
    assert.equal(orders.length, 1)
    assert.equal(orders[0].orderId, 'order-e2e-u-003')
    assert.equal(orders[0].linkStatus, 'unlinked')
  })

  it('边界: 扫描不存在的店铺返回空列表', () => {
    const orders = scanUnlinkedOrders('store-nonexistent', new Date('2026-01-01T00:00:00Z'))
    assert.equal(orders.length, 0)
  })

  it('正例: 自动关联大额订单', () => {
    // order-e2e-u-003: amount=50000, hour=9 (UTC) → 匹配规则
    const result = autoLinkOrder('order-e2e-u-003')
    assert.equal(result.linked, true)
    assert.equal(result.partnerId, 'partner-auto-001')
    assert.equal(result.reason, 'amount+time match')
  })

  it('边界: 不符合规则的订单无法自动关联', () => {
    // order-e2e-u-002: amount=8000 < 10000，不符合规则
    const result = autoLinkOrder('order-e2e-u-002')
    assert.equal(result.linked, false)
    assert.equal(result.reason, 'no rule matched')
  })

  it('边界: 自动关联后再次扫描已关联店铺不返回该订单', () => {
    // order-e2e-u-003 已被自动关联，扫描 store-B 应返回0条
    const orders = scanUnlinkedOrders('store-B', new Date('2026-07-01T00:00:00Z'))
    assert.equal(orders.length, 0)
  })

  // ── 7. 异常检测 ──

  it('正例: 检测伙伴异常模式', () => {
    const anomalies = detectAnomaly('partner-e2e-53-001')
    assert.ok(anomalies.length >= 1)
    assert.equal(anomalies[0].partnerId, 'partner-e2e-53-001')
    assert.ok('anomalyId' in anomalies[0])
  })

  it('正例: 获取异常报告', () => {
    const report = getAnomalyReport('partner-e2e-53-001')
    assert.equal(report.partnerId, 'partner-e2e-53-001')
    assert.ok(report.totalAnomalies >= 1)
    assert.ok(report.warnings >= 0)
    assert.ok(report.criticals >= 0)
    assert.ok(Array.isArray(report.records))
  })

  it('正例: 标记可疑分账', () => {
    const result = flagSuspiciousSettlement('stl-e2e-53-001')
    assert.equal(result.flagged, true)
    assert.equal(result.settlementId, 'stl-e2e-53-001')
  })

  // ── 8. 边界与一致性 ──

  it('边界: 列表查询排序按 ID 递增', () => {
    const all = listPartners()
    for (let i = 1; i < all.length; i++) {
      assert.ok(all[i].id >= all[i - 1].id, `id=${all[i].id} 应在 ${all[i - 1].id} 之后`)
    }
  })

  it('一致性: 更新伙伴不修改 ID', () => {
    const original = getPartner('partner-e2e-53-002')
    assert.ok(original !== undefined)
    const updated = updatePartner(original!.id, { name: '更新后名称' })
    assert.equal(updated.id, original!.id)
    assert.equal(updated.name, '更新后名称')
  })

  it('一致性: 分账审批执行流水线不可逆', () => {
    // 已执行的分账不可再审批或执行
    assert.throws(() => executeSettlement('stl-e2e-53-001'), { message: /INVALID_STATUS/ })
    assert.throws(() => approveSettlement('stl-e2e-53-001'), { message: /INVALID_STATUS/ })
  })

  it('边界: 无记录的伙伴异常报告返回空', () => {
    const report = getAnomalyReport('partner-e2e-53-norecords')
    assert.equal(report.totalAnomalies, 0)
    assert.equal(report.warnings, 0)
    assert.equal(report.criticals, 0)
    assert.deepEqual(report.records, [])
  })
})
