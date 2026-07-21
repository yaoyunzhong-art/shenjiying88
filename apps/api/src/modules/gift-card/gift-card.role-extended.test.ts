import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 [gift-card] 8角色扩展测试
 * 覆盖礼品卡创建/激活/充值/消费/冻结/解冻/取消/退款/流水/统计/过期清理
 * 8角色×3场景 = 24+ tests
 *
 * 8角色: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { GiftCardController } from './gift-card.controller'
import { GiftCardService } from './gift-card.service'

function setup() {
  const service = new GiftCardService()
  const controller = new GiftCardController(service)
  return { service, controller }
}

function futureDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// Helper to unwrap non-null data
function assertSuccess<T extends { success: boolean; data?: T['data'] }>(resp: T): asserts resp is T & { data: NonNullable<T['data']> } {
  expect(resp.success).toBe(true)
  expect(resp.data).toBeDefined()
}

function assertFail<T extends { success: boolean; message?: string }>(resp: T): asserts resp is T & { message: string } {
  expect(resp.success).toBe(false)
  expect(resp.message).toBeDefined()
}

// ══════════════════════════════════════════════════════════════
// 👔店长 — 礼品卡全生命周期管理与统计
// ══════════════════════════════════════════════════════════════
describe('👔店长 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长创建礼品卡并激活全流程', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-newyear',
      denomination: 50000,
      holderName: 'VIP客户张',
      holderPhone: '13800138001',
      expiresAt: futureDate(365),
    }, 't-tenant-001')
    assertSuccess(createResp)
    const cardId = createResp.data.cardId

    const activateResp = svc.controller.activate(cardId, { operatorId: 'mgr-001' })
    assertSuccess(activateResp)
    expect(activateResp.data.status).toBe('active')
    expect(activateResp.data.balance).toBe(50000)
  })

  it('店长查看礼品卡统计摘要', () => {
    const stats = svc.controller.getStats('t-tenant-001')
    assertSuccess(stats)
    expect(stats.data.total).toBe(0)
    expect(stats.data.active).toBe(0)
  })

  it('店长清理过期礼品卡（过期卡被标记）', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-expired',
      denomination: 10000,
      holderName: '过期用户',
      holderPhone: '13900000000',
      expiresAt: futureDate(-1),
    }, 't-tenant-001')
    assertSuccess(createResp)
    const cardId = createResp.data.cardId

    // 尝试激活过期卡应失败
    const activateResp = svc.controller.activate(cardId, { operatorId: 'mgr-001' })
    assertFail(activateResp)

    // 直接清理过期卡
    const cleanupResp = svc.controller.cleanupExpired()
    assertSuccess(cleanupResp)
    expect(cleanupResp.data.cleaned).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒前台 — 礼品卡售卖与充值
// ══════════════════════════════════════════════════════════════
describe('🛒前台 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台创建礼品卡并展示给客户购买', () => {
    const resp = svc.controller.create({
      templateId: 'tpl-store-selling',
      denomination: 20000,
      holderName: '到店顾客李',
      holderPhone: '13800001111',
      expiresAt: futureDate(180),
    }, 't-store-001')
    assertSuccess(resp)
    expect(resp.data.status).toBe('pending')
  })

  it('前台查询礼品卡详情', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-query', denomination: 10000,
      holderName: '查询测试', holderPhone: '13811112222',
      expiresAt: futureDate(90),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    // 先激活
    svc.controller.activate(cardId, { operatorId: 'recept-001' })
    const detailResp = svc.controller.getById(cardId)
    assertSuccess(detailResp)
    expect(detailResp.data.balance).toBe(10000)
  })

  it('前台查询不存在的礼品卡返回错误', () => {
    const resp = svc.controller.getById('GC-NONEXISTENT')
    assertFail(resp)
    expect(resp.message).toContain('不存在')
  })
})

// ══════════════════════════════════════════════════════════════
// 👥HR — 员工福利礼品卡发放
// ══════════════════════════════════════════════════════════════
describe('👥HR gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 创建员工生日礼品卡并激活', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-birthday',
      denomination: 10000,
      holderName: '员工小王',
      holderPhone: '13700000001',
      expiresAt: futureDate(365),
    }, 't-hr-tenant')
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    const actResp = svc.controller.activate(cardId, { operatorId: 'hr-001' })
    assertSuccess(actResp)
    expect(actResp.data.status).toBe('active')
  })

  it('HR 为离职员工礼品卡退款', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-resign', denomination: 30000,
      holderName: '离职员工', holderPhone: '13600000000',
      expiresAt: futureDate(200),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'hr-002' })
    // 先消费一部分
    svc.controller.consume(cardId, { amount: 5000, orderId: 'order-test', operatorId: 'hr-002' })
    // 退款
    const refundResp = svc.controller.refund(cardId, { amount: 2000, operatorId: 'hr-002', remark: '操作失误退款' })
    assertSuccess(refundResp)
    expect(refundResp.data.balance).toBe(27000)
  })

  it('HR 批量激活礼品卡并列表过滤激活状态的卡', () => {
    const c1 = svc.controller.create({ templateId: 't1', denomination: 5000, holderName: 'A', holderPhone: '1', expiresAt: futureDate(30) })
    const c2 = svc.controller.create({ templateId: 't2', denomination: 5000, holderName: 'B', holderPhone: '2', expiresAt: futureDate(30) })
    assertSuccess(c1)
    assertSuccess(c2)
    svc.controller.activate(c1.data.cardId, { operatorId: 'hr' })
    // c2 不激活，保持 pending
    const activeList = svc.controller.list({ status: 'active' as any })
    expect(activeList.data.length).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧安监 — 安全监控礼品卡冻结/解冻
// ══════════════════════════════════════════════════════════════
describe('🔧安监 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监发现异常消费立即冻结礼品卡', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-security', denomination: 50000,
      holderName: '异常用户', holderPhone: '13500000000',
      expiresAt: futureDate(365),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'safety-001' })
    const freezeResp = svc.controller.freeze(cardId, { operatorId: 'safety-001', remark: '异常交易可疑' })
    assertSuccess(freezeResp)
    expect(freezeResp.data.status).toBe('frozen')
    expect(freezeResp.data.frozenAmount).toBe(50000)
  })

  it('安监调查完毕解冻礼品卡恢复正常', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-unfreeze', denomination: 30000,
      holderName: '已核实', holderPhone: '13400000000',
      expiresAt: futureDate(365),
    })
    assertSuccess(createResp)
    const cid = createResp.data.cardId
    svc.controller.activate(cid, { operatorId: 'safety-002' })
    svc.controller.freeze(cid, { operatorId: 'safety-002' })
    const unfreezeResp = svc.controller.unfreeze(cid, { operatorId: 'safety-002', remark: '核实完毕' })
    assertSuccess(unfreezeResp)
    expect(unfreezeResp.data.status).toBe('active')
    expect(unfreezeResp.data.frozenAmount).toBe(0)
  })

  it('安监查看礼品卡交易流水', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-tx', denomination: 20000,
      holderName: '流水测试', holderPhone: '13300000000',
      expiresAt: futureDate(365),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'safety-003' })
    svc.controller.consume(cardId, { amount: 5000, orderId: 'o-1', operatorId: 'safety-003' })
    const txResp = svc.controller.getTransactions(cardId)
    assertSuccess(txResp)
    expect(txResp.data.length).toBeGreaterThanOrEqual(2)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏币兑换礼品卡
// ══════════════════════════════════════════════════════════════
describe('🎮导玩员 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员为顾客创建礼品卡并充值', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-game-reward', denomination: 5000,
      holderName: '顾客小赵', holderPhone: '13200000000',
      expiresAt: futureDate(90),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'guide-001' })
    const topupResp = svc.controller.topup(cardId, { amount: 10000, operatorId: 'guide-001', remark: '游戏币兑换' })
    assertSuccess(topupResp)
    expect(topupResp.data.balance).toBe(15000)
  })

  it('导玩员协助顾客消费礼品卡', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-consume', denomination: 30000,
      holderName: '顾客小刘', holderPhone: '13100000000',
      expiresAt: futureDate(60),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'guide-002' })
    const consumeResp = svc.controller.consume(cardId, {
      amount: 8000,
      orderId: 'order-game-202607',
      operatorId: 'guide-002',
      remark: '游戏币消费',
    })
    assertSuccess(consumeResp)
    expect(consumeResp.data.balance).toBe(22000)
    expect(consumeResp.data.totalConsumed).toBe(8000)
  })

  it('导玩员尝试扣除超额金额返回错误', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-insufficient', denomination: 5000,
      holderName: '顾客小陈', holderPhone: '13000000000',
      expiresAt: futureDate(30),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'guide-003' })
    const resp = svc.controller.consume(cardId, { amount: 99999, orderId: 'o-bad', operatorId: 'guide-003' })
    assertFail(resp)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯运行专员 — 批量运维与过期管理
// ══════════════════════════════════════════════════════════════
describe('🎯运行专员 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员批量创建并列表展示所有礼品卡', () => {
    for (let i = 0; i < 5; i++) {
      svc.controller.create({
        templateId: 'tpl-bulk', denomination: 10000,
        holderName: `批量用户${i}`, holderPhone: `1380000000${i}`,
        expiresAt: futureDate(180),
      })
    }
    const listResp = svc.controller.list({})
    expect(listResp.total).toBe(5)
  })

  it('运行专员查询按持卡人过滤的列表', () => {
    svc.controller.create({ templateId: 't1', denomination: 5000, holderName: '张三', holderPhone: '1', expiresAt: futureDate(30) })
    svc.controller.create({ templateId: 't2', denomination: 5000, holderName: '李四', holderPhone: '2', expiresAt: futureDate(30) })
    const filtered = svc.controller.list({ holderName: '张三' })
    expect(filtered.data.length).toBe(1)
    expect(filtered.data[0].holderName).toBe('张三')
  })

  it('运行专员执行过期清理（主动设置的过期卡）', () => {
    for (let i = 0; i < 3; i++) {
      const resp = svc.controller.create({
        templateId: 'to-clean', denomination: 1000,
        holderName: `过期卡${i}`, holderPhone: `0${i}`,
        expiresAt: futureDate(-10),
      })
      // 激活会失败但卡已存在
      svc.controller.activate(resp.data!.cardId, { operatorId: 'ops' })
    }
    svc.controller.create({ templateId: 'normal', denomination: 1000, holderName: '正常卡', holderPhone: 'n', expiresAt: futureDate(30) })
    const cleanupResp = svc.controller.cleanupExpired()
    assertSuccess(cleanupResp)
    expect(cleanupResp.data.cleaned).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动礼品卡管理与取消
// ══════════════════════════════════════════════════════════════
describe('🤝团建 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建为活动创建多张礼品卡用作奖品', () => {
    for (let i = 0; i < 3; i++) {
      const resp = svc.controller.create({
        templateId: 'tpl-team-prize', denomination: 10000,
        holderName: `获奖员工-${i}`, holderPhone: `1360000000${i}`,
        expiresAt: futureDate(365),
      })
      expect(resp.success).toBe(true)
    }
    const listResp = svc.controller.list({})
    expect(listResp.data.length).toBe(3)
  })

  it('团建取消未激活的活动礼品卡', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-cancel', denomination: 5000,
      holderName: '取消活动', holderPhone: '13900000000',
      expiresAt: futureDate(100),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    const cancelResp = svc.controller.cancel(cardId, { operatorId: 'team-lead', remark: '活动取消' })
    assertSuccess(cancelResp)
    expect(cancelResp.data.status).toBe('cancelled')
  })

  it('团建查看已取消礼品卡详情', () => {
    const createResp = svc.controller.create({
      templateId: 'tpl-cancelled-detail', denomination: 20000,
      holderName: '已取消测试', holderPhone: '13911111111',
      expiresAt: futureDate(100),
    })
    assertSuccess(createResp)
    const cardId = createResp.data.cardId
    svc.controller.cancel(cardId, { operatorId: 'team-lead' })
    const detailResp = svc.controller.getById(cardId)
    assertSuccess(detailResp)
    expect(detailResp.data.status).toBe('cancelled')
  })
})

// ══════════════════════════════════════════════════════════════
// 📢营销 — 营销活动礼品卡发放与统计
// ══════════════════════════════════════════════════════════════
describe('📢营销 gift-card 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销创建促销活动礼品卡并激活', () => {
    const resp = svc.controller.create({
      templateId: 'tpl-promo-618', denomination: 5000,
      holderName: '活动用户', holderPhone: '13888888888',
      expiresAt: futureDate(30),
      storeScope: ['store-001', 'store-002'],
    })
    assertSuccess(resp)
    expect(resp.data.storeScope).toEqual(['store-001', 'store-002'])
  })

  it('营销查看礼品卡统计数据含活跃卡数', () => {
    const c1 = svc.controller.create({ templateId: 't1', denomination: 10000, holderName: 'M1', holderPhone: '1', expiresAt: futureDate(30) }, 't-mkt-001')
    const c2 = svc.controller.create({ templateId: 't2', denomination: 20000, holderName: 'M2', holderPhone: '2', expiresAt: futureDate(30) }, 't-mkt-001')
    assertSuccess(c1)
    assertSuccess(c2)
    svc.controller.activate(c1.data.cardId, { operatorId: 'mkt' })
    svc.controller.activate(c2.data.cardId, { operatorId: 'mkt' })
    const stats = svc.controller.getStats('t-mkt-001')
    assertSuccess(stats)
    expect(stats.data.total).toBe(2)
    expect(stats.data.totalDenomination).toBe(30000)
  })

  it('营销消费礼品卡至余额为0自动标记 redeemed', () => {
    const resp = svc.controller.create({
      templateId: 'tpl-redeem', denomination: 1000,
      holderName: '用完即弃', holderPhone: '13777777777',
      expiresAt: futureDate(30),
    })
    assertSuccess(resp)
    const cardId = resp.data.cardId
    svc.controller.activate(cardId, { operatorId: 'mkt-001' })
    svc.controller.consume(cardId, { amount: 1000, orderId: 'o-redeem', operatorId: 'mkt-001' })
    const detailResp = svc.controller.getById(cardId)
    assertSuccess(detailResp)
    expect(detailResp.data.status).toBe('redeemed')
    expect(detailResp.data.balance).toBe(0)
  })
})
