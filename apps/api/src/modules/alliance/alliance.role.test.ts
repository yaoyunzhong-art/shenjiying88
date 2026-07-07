/**
 * alliance.role.test.ts · 联盟管理 5 角色视角测试
 *
 * 👔店长 · 🤝团建 · 📢营销 · 🎯运行专员 · 🛒前台
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { AllianceController } from './alliance.controller'
import { AlliancePartner, PartnerGradingService, HealthScoreService } from './alliance-grade.service'
import {
  CrossMerchantSettlementService,
  UnlinkedOrderDetector,
  AnomalyDetectionService,
  SettlementError,
} from './alliance-settlement.service'

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
  Ops: '🎯运行专员',
  Reception: '🛒前台',
}

// ── 辅助函数 ──
function makeController(): AllianceController {
  const partnerService = new AlliancePartner()
  const gradingService = new PartnerGradingService()
  const healthService = new HealthScoreService()
  const settlementService = new CrossMerchantSettlementService()
  const orderDetector = new UnlinkedOrderDetector()
  const anomalyService = new AnomalyDetectionService()
  return new AllianceController(
    partnerService,
    gradingService,
    healthService,
    settlementService,
    orderDetector,
    anomalyService,
  )
}

function makeParticipant(partnerId: string, partnerName: string, ratio: number) {
  return { partnerId, partnerName, ratio, fixedAmount: undefined }
}

/** 声明注册结果为成功 + 带 data 的快捷类型 */
function asData<T>(r: { success: boolean; data?: T; message?: string }): { success: true; data: T } {
  return r as { success: true; data: T }
}
function asFail(r: { success: boolean; message?: string }): { success: false; message: string } {
  return r as { success: false; message: string }
}

// ──────────────────── 👔 店长 · 联盟店管理 ────────────────────
describe(`${ROLES.TenantAdmin} alliance 联盟店管理角色测试`, () => {
  let ctrl: AllianceController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以注册新的联盟伙伴（正常流程）', () => {
    const result = ctrl.registerPartner({
      name: '联盟伙伴一店',
      businessType: 'RETAIL',
      contact: '13800000001',
      address: '北京市朝阳区',
    })
    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.equal(result.data.name, '联盟伙伴一店')
    assert.equal(result.data.businessType, 'RETAIL')
    assert.equal(result.data.status, 'ACTIVE')
  })

  it('店长可以更新联盟伙伴信息（正常流程）', () => {
    const reg = ctrl.registerPartner({
      name: '联盟伙伴二店',
      businessType: 'F&B',
      contact: '13800000002',
      address: '上海市浦东新区',
    }) as { success: true; data: { id: string } }
    const updated = ctrl.updatePartner(reg.data.id, { contact: '13900000002', address: '上海市静安区' }) as { success: true; data: { contact: string; address: string } }
    assert.equal(updated.success, true)
    assert.equal(updated.data.contact, '13900000002')
    assert.equal(updated.data.address, '上海市静安区')
  })

  it('店长可以查看联盟伙伴详情（正常流程）', () => {
    const reg = ctrl.registerPartner({
      name: '联盟伙伴三店',
      businessType: 'SERVICE',
      contact: '13800000003',
      address: '广州市天河区',
    }) as { success: true; data: { id: string } }
    const detail = ctrl.getPartner(reg.data.id) as { success: true; data: { name: string } }
    assert.equal(detail.success, true)
    assert.equal(detail.data.name, '联盟伙伴三店')
  })

  it('店长可以列出所有联盟伙伴（正常流程）', () => {
    ctrl.registerPartner({ name: '伙伴A', businessType: 'RETAIL', contact: '13800000101', address: '北京' })
    ctrl.registerPartner({ name: '伙伴B', businessType: 'F&B', contact: '13800000102', address: '上海' })
    const list = ctrl.listPartners({})
    assert.equal(list.success, true)
    assert.ok(list.total >= 2)
  })

  it('店长注册重复名称的伙伴应被拒绝（边界）', () => {
    ctrl.registerPartner({ name: '重复名称伙伴', businessType: 'RETAIL', contact: '13800000111', address: '深圳' })
    const result = ctrl.registerPartner({ name: '重复名称伙伴', businessType: 'TECH', contact: '13800000112', address: '广州' }) as { success: false; message: string }
    assert.equal(result.success, false)
    assert.ok(result.message.includes('already exists'))
  })

  it('店长获取不存在的伙伴应返回失败（边界）', () => {
    const result = ctrl.getPartner('nonexistent-partner') as { success: false; message: string }
    assert.equal(result.success, false)
    assert.ok(result.message.includes('not found'))
  })
})

// ──────────────────── 🤝 团建 · 联盟活动 ────────────────────
describe(`${ROLES.Teambuilding} alliance 联盟活动角色测试`, () => {
  let ctrl: AllianceController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以查看分级标准了解联盟品质（正常流程）', () => {
    const result = ctrl.getGradeCriteria()
    assert.equal(result.success, true)
    assert.ok(result.data.length >= 4)
    const grades = result.data.map((g: any) => g.grade)
    assert.ok(grades.includes('S'))
    assert.ok(grades.includes('A'))
    assert.ok(grades.includes('B'))
    assert.ok(grades.includes('C'))
  })

  it('团建可以注册新的联盟伙伴（团建场地合作）', () => {
    const result = ctrl.registerPartner({
      name: '团建合作农场',
      businessType: 'SERVICE',
      contact: '13800000201',
      address: '杭州市西湖区',
    })
    assert.equal(result.success, true)
    assert.equal(result.data.name, '团建合作农场')
  })

  it('团建可以为伙伴手动指定等级方便活动筛选（正常流程）', () => {
    const reg = ctrl.registerPartner({
      name: '团建场地A',
      businessType: 'SERVICE',
      contact: '13800000202',
      address: '北京市海淀区',
    })
    const assign = ctrl.gradingService.assignGrade(reg.data.id, 'A')
    const result = ctrl.assignGrade(reg.data.id, { grade: 'A' })
    assert.equal(result.success, true)
    assert.ok(result.message.includes('A'))

    const gradeResult = ctrl.getGrade(reg.data.id)
    assert.equal(gradeResult.success, true)
    assert.equal(gradeResult.data.grade, 'A')
  })

  it('团建可以查看联盟健康度判断活动适配度', () => {
    const reg = ctrl.registerPartner({
      name: '团建水上乐园',
      businessType: 'SERVICE',
      contact: '13800000203',
      address: '三亚市',
    })
    const health = ctrl.calculateHealth(reg.data.id)
    assert.equal(health.success, true)
    assert.equal(health.data.healthScore, 50) // 无指标数据时默认50

    // 设置指标后重新计算
    ctrl.setMetrics(reg.data.id, { revenue: 200000, orderCount: 800, complaintCount: 2, activeDays: 25 })
    const updatedHealth = ctrl.calculateHealth(reg.data.id)
    assert.equal(updatedHealth.success, true)
    assert.ok(updatedHealth.data.healthScore > 50)
  })

  it('团建查看健康度趋势用于活动决策', () => {
    const reg = ctrl.registerPartner({
      name: '团建拓展基地',
      businessType: 'SERVICE',
      contact: '13800000204',
      address: '成都市',
    })
    const trend = ctrl.getHealthTrend(reg.data.id)
    assert.equal(trend.success, true)
    assert.ok(Array.isArray(trend.data))
    assert.ok(trend.data.length > 0)
  })
})

// ──────────────────── 📢 营销 · 联盟营销 ────────────────────
describe(`${ROLES.Marketing} alliance 联盟营销角色测试`, () => {
  let ctrl: AllianceController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以注册跨行业的联盟伙伴用于交叉营销', () => {
    const result = ctrl.registerPartner({
      name: '茶饮联名伙伴',
      businessType: 'F&B',
      contact: '13800000301',
      address: '深圳市南山区',
    })
    assert.equal(result.success, true)
    assert.equal(result.data.businessType, 'F&B')
  })

  it('营销可以按行业类型筛选联盟伙伴', () => {
    ctrl.registerPartner({ name: '服装店', businessType: 'RETAIL', contact: '13800000311', address: '北京' })
    ctrl.registerPartner({ name: '火锅店', businessType: 'F&B', contact: '13800000312', address: '北京' })
    ctrl.registerPartner({ name: '科技公司', businessType: 'TECH', contact: '13800000313', address: '北京' })

    const retailPartners = ctrl.listPartners({ businessType: 'RETAIL' })
    assert.equal(retailPartners.success, true)
    assert.ok(retailPartners.total >= 1)

    const fbPartners = ctrl.listPartners({ businessType: 'F&B' })
    assert.ok(fbPartners.total >= 1)
  })

  it('营销可以计算并查看伙伴等级用于分群营销', () => {
    const reg = ctrl.registerPartner({
      name: '高端消费伙伴',
      businessType: 'RETAIL',
      contact: '13800000321',
      address: '上海市黄浦区',
    })
    const pid = reg.data.id
    ctrl.assignGrade(pid, { grade: 'S' })

    const grade = ctrl.getGrade(pid)
    assert.equal(grade.success, true)
    assert.equal(grade.data.grade, 'S')
  })

  it('营销可以发起分账结算（营销活动分摊）', () => {
    const regA = ctrl.registerPartner({ name: '营销合作伙伴A', businessType: 'RETAIL', contact: '13800000331', address: '北京' })
    const regB = ctrl.registerPartner({ name: '营销合作伙伴B', businessType: 'F&B', contact: '13800000332', address: '上海' })

    const settlement = ctrl.createSettlement({
      orderId: 'mkt-order-001',
      type: 'ratio',
      totalAmount: 10000,
      participants: [
        makeParticipant(regA.data.id, '合作伙伴A', 0.6),
        makeParticipant(regB.data.id, '合作伙伴B', 0.4),
      ],
    })
    assert.equal(settlement.success, true)
    assert.ok(settlement.data.settlementId)
    assert.equal(settlement.data.status, 'pending')
  })

  it('营销可以批准并执行分账结算（正常流程）', () => {
    const regA = ctrl.registerPartner({ name: '结算伙伴A', businessType: 'RETAIL', contact: '13800000341', address: '北京' })
    const regB = ctrl.registerPartner({ name: '结算伙伴B', businessType: 'F&B', contact: '13800000342', address: '上海' })

    const created = ctrl.createSettlement({
      orderId: 'mkt-order-002',
      type: 'ratio',
      totalAmount: 50000,
      participants: [
        makeParticipant(regA.data.id, '结算伙伴A', 0.7),
        makeParticipant(regB.data.id, '结算伙伴B', 0.3),
      ],
    })
    const sid = created.data.settlementId

    const approved = ctrl.approveSettlement(sid)
    assert.equal(approved.success, true)
    assert.equal(approved.data.status, 'approved')

    const executed = ctrl.executeSettlement(sid)
    assert.equal(executed.success, true)
    assert.equal(executed.data.status, 'executed')
  })

  it('营销创建比例不合法的分账应被拒绝（边界）', () => {
    const result = ctrl.createSettlement({
      orderId: 'mkt-order-bad',
      type: 'ratio',
      totalAmount: 10000,
      participants: [
        { partnerId: 'p1', partnerName: 'P1', ratio: 0.3 },
        { partnerId: 'p2', partnerName: 'P2', ratio: 0.3 },
      ],
    })
    assert.equal(result.success, false)
    assert.equal(result.code, 'INVALID_RATIO')
  })
})

// ──────────────────── 🎯 运行专员 · 联盟结算 ────────────────────
describe(`${ROLES.Ops} alliance 联盟结算角色测试`, () => {
  let ctrl: AllianceController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以创建多种类型的分账（正常流程）', () => {
    const regA = ctrl.registerPartner({ name: '结算商户甲', businessType: 'RETAIL', contact: '13800000401', address: '北京' })
    const regB = ctrl.registerPartner({ name: '结算商户乙', businessType: 'SERVICE', contact: '13800000402', address: '上海' })

    // 按比例分账
    const ratioStl = ctrl.createSettlement({
      orderId: 'ops-order-001',
      type: 'ratio',
      totalAmount: 20000,
      participants: [
        makeParticipant(regA.data.id, '商户甲', 0.5),
        makeParticipant(regB.data.id, '商户乙', 0.5),
      ],
    })
    assert.equal(ratioStl.success, true)
    assert.equal(ratioStl.data.type, 'ratio')

    // 按固定金额分账
    const fixedStl = ctrl.createSettlement({
      orderId: 'ops-order-002',
      type: 'fixed',
      totalAmount: 10000,
      participants: [
        { partnerId: regA.data.id, partnerName: '商户甲', ratio: undefined, fixedAmount: 6000 },
        { partnerId: regB.data.id, partnerName: '商户乙', ratio: undefined, fixedAmount: 4000 },
      ],
    })
    assert.equal(fixedStl.success, true)
    assert.equal(fixedStl.data.type, 'fixed')
  })

  it('运行专员可以查询分账详情（正常流程）', () => {
    const reg = ctrl.registerPartner({ name: '查询商户', businessType: 'RETAIL', contact: '13800000411', address: '深圳' })
    const created = ctrl.createSettlement({
      orderId: 'ops-order-003',
      type: 'ratio',
      totalAmount: 30000,
      participants: [makeParticipant(reg.data.id, '商户', 1.0)],
    })
    const sid = created.data.settlementId
    const queried = ctrl.querySettlement(sid)
    assert.equal(queried.success, true)
    assert.equal(queried.data.settlementId, sid)
  })

  it('运行专员可以查看伙伴分账历史', () => {
    const reg = ctrl.registerPartner({ name: '历史查询商户', businessType: 'RETAIL', contact: '13800000421', address: '广州' })
    ctrl.createSettlement({
      orderId: 'ops-hist-001', type: 'ratio', totalAmount: 10000,
      participants: [makeParticipant(reg.data.id, '商户', 1.0)],
    })
    ctrl.createSettlement({
      orderId: 'ops-hist-002', type: 'ratio', totalAmount: 20000,
      participants: [makeParticipant(reg.data.id, '商户', 1.0)],
    })

    const history = ctrl.getSettlementHistory(reg.data.id)
    assert.equal(history.success, true)
    assert.ok(history.total >= 2)
  })

  it('运行专员可以扫描未关联订单（正常流程）', () => {
    const result = ctrl.scanUnlinkedOrders({ storeId: 'store-A', since: '2026-01-01T00:00:00Z' })
    assert.equal(result.success, true)
    assert.ok(result.data.total >= 2)
    assert.ok(result.data.orders.every((o: any) => o.linkStatus === 'unlinked'))
  })

  it('运行专员可以手动关联订单到伙伴（正常流程）', () => {
    const reg = ctrl.registerPartner({ name: '关联商户', businessType: 'RETAIL', contact: '13800000431', address: '北京' })
    const result = ctrl.linkOrder('order-u-001', { partnerId: reg.data.id })
    assert.equal(result.success, true)
    assert.equal(result.data.linkStatus, 'linked')
    assert.equal(result.data.linkedPartnerId, reg.data.id)
  })

  it('运行专员可以触发自动关联规则', () => {
    const result = ctrl.autoLinkOrder('order-u-002')
    assert.equal(result.success, true)
    // 8000 < 10000 阈值，规则不应匹配
    assert.equal(result.data.linked, false)
  })

  it('运行专员关联已关联的订单应被拒绝（边界）', () => {
    // 先手动关联
    const reg = ctrl.registerPartner({ name: '已关联商户', businessType: 'RETAIL', contact: '13800000441', address: '北京' })
    ctrl.linkOrder('order-u-001', { partnerId: reg.data.id })

    // 再关联应失败
    const result = ctrl.linkOrder('order-u-001', { partnerId: reg.data.id })
    assert.equal(result.success, false)
    assert.equal(result.code, 'ALREADY_LINKED')
  })

  it('运行专员可以检测异常结算模式（正常流程）', () => {
    const reg = ctrl.registerPartner({ name: '异常检测商户', businessType: 'RETAIL', contact: '13800000451', address: '北京' })
    const anomaly = ctrl.detectAnomaly(reg.data.id)
    assert.equal(anomaly.success, true)
    assert.ok(anomaly.data.count >= 0)
  })

  it('运行专员可以标记可疑分账（正常流程）', () => {
    const reg = ctrl.registerPartner({ name: '可疑分账商户', businessType: 'RETAIL', contact: '13800000461', address: '北京' })
    const created = ctrl.createSettlement({
      orderId: 'ops-flagged-order',
      type: 'ratio',
      totalAmount: 5000,
      participants: [makeParticipant(reg.data.id, '商户', 1.0)],
    })
    const flag = ctrl.flagSuspicious(created.data.settlementId)
    assert.equal(flag.success, true)
    assert.equal(flag.data.flagged, true)
  })
})

// ──────────────────── 🛒 前台 · 联盟会员查询 ────────────────────
describe(`${ROLES.Reception} alliance 联盟会员查询角色测试`, () => {
  let ctrl: AllianceController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以查看联盟伙伴列表（正常流程）', () => {
    ctrl.registerPartner({ name: '前台可见伙伴A', businessType: 'RETAIL', contact: '13800000501', address: '北京' })
    ctrl.registerPartner({ name: '前台可见伙伴B', businessType: 'F&B', contact: '13800000502', address: '上海' })

    const list = ctrl.listPartners({})
    assert.equal(list.success, true)
    assert.ok(list.total >= 2)
  })

  it('前台可以查看单联盟伙伴详情（正常流程）', () => {
    const reg = ctrl.registerPartner({
      name: '前台可见伙伴C',
      businessType: 'SERVICE',
      contact: '13800000503',
      address: '广州市天河区',
    })
    const detail = ctrl.getPartner(reg.data.id)
    assert.equal(detail.success, true)
    assert.equal(detail.data.name, '前台可见伙伴C')
  })

  it('前台可以按行业筛选查询联盟伙伴', () => {
    ctrl.registerPartner({ name: '零售伙伴', businessType: 'RETAIL', contact: '13800000511', address: '北京' })

    const filtered = ctrl.listPartners({ businessType: 'RETAIL' })
    assert.equal(filtered.success, true)
    assert.ok(filtered.total >= 1)
    filtered.data.forEach((p: any) => {
      assert.equal(p.businessType, 'RETAIL')
    })
  })

  it('前台可以查看伙伴等级信息用于向顾客推荐', () => {
    const reg = ctrl.registerPartner({
      name: '推荐联盟商户',
      businessType: 'RETAIL',
      contact: '13800000521',
      address: '上海市浦东新区',
    })
    ctrl.assignGrade(reg.data.id, { grade: 'A' })

    const grade = ctrl.getGrade(reg.data.id)
    assert.equal(grade.success, true)
    assert.equal(grade.data.grade, 'A')
  })

  it('前台查询不存在的伙伴应返回明确错误（边界）', () => {
    const result = ctrl.getPartner('non-existent-front-desk')
    assert.equal(result.success, false)
    assert.ok(result.message.includes('not found'))
  })

  it('前台查看健康度因素了解服务质量', () => {
    const reg = ctrl.registerPartner({
      name: '优质联盟商户',
      businessType: 'SERVICE',
      contact: '13800000531',
      address: '杭州市',
    })
    ctrl.setMetrics(reg.data.id, { revenue: 300000, orderCount: 1000, complaintCount: 1, activeDays: 28 })

    const factors = ctrl.getHealthFactors(reg.data.id)
    assert.equal(factors.success, true)
    assert.ok(factors.data.revenueScore > 0)
    assert.ok(factors.data.overall > 0)
  })
})
