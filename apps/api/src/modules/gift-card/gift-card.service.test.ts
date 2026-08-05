/**
 * gift-card.service.spec.ts — 礼品卡 Service 测试
 *
 * 覆盖:
 *   - CRUD / 状态流转 / 余额校验 / 过期检测
 *   - 边界条件 / 异常路径 / 空值处理 / 并发场景
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GiftCardService } from './gift-card.service'
import type { GiftCardCreateRequest, GiftCardTopupRequest, GiftCardConsumeRequest } from './gift-card.entity'

describe('GiftCardService', () => {
  let service: GiftCardService

  // ── 辅助工厂 ──

  const validCreateReq = (overrides?: Partial<GiftCardCreateRequest>): GiftCardCreateRequest => ({
    templateId: 'TPL-001',
    denomination: 10000,       // 100 元
    holderName: '张三',
    holderPhone: '13800138000',
    expiresAt: '2099-12-31T23:59:59Z',
    tenantId: 'tenant-1',
    storeScope: [],
    ...overrides,
  })

  const validConsumeReq = (cardId: string, overrides?: Partial<GiftCardConsumeRequest>): GiftCardConsumeRequest => ({
    cardId,
    amount: 1000,   // 10 元
    ...overrides,
  })

  const setUpActiveCard = (denomination = 10000): string => {
    const card = service.create(validCreateReq({ denomination }))
    service.activate(card.cardId)
    return card.cardId
  }

  beforeEach(() => {
    service = new GiftCardService()
  })

  // ═══════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════

  describe('create', () => {
    it('应成功创建 pending 状态的礼品卡', () => {
      const card = service.create(validCreateReq())
      expect(card.cardId).toBeTruthy()
      expect(card.status).toBe('pending')
      expect(card.balance).toBe(0)
      expect(card.denomination).toBe(10000)
      expect(card.currency).toBe('CNY')
    })

    it('面额为 0 应抛出 BadRequestException', () => {
      expect(() => service.create(validCreateReq({ denomination: 0 }))).toThrow('面额必须大于 0')
    })

    it('面额为负数应抛出 BadRequestException', () => {
      expect(() => service.create(validCreateReq({ denomination: -100 }))).toThrow('面额必须大于 0')
    })

    it('持卡人姓名为空应抛出 BadRequestException', () => {
      expect(() => service.create(validCreateReq({ holderName: '' }))).toThrow('持卡人姓名和手机号必填')
    })

    it('持卡人电话为空应抛出 BadRequestException', () => {
      expect(() => service.create(validCreateReq({ holderPhone: '' }))).toThrow('持卡人姓名和手机号必填')
    })

    it('创建后应自动生成 cardId 并记录购买流水', () => {
      const card = service.create(validCreateReq())
      const txs = service.getTransactions(card.cardId)
      expect(txs).toHaveLength(1)
      expect(txs[0].type).toBe('purchase')
      expect(txs[0].amount).toBe(10000)
    })

    it('不同调用生成不同的 cardId', () => {
      const c1 = service.create(validCreateReq())
      const c2 = service.create(validCreateReq())
      expect(c1.cardId).not.toBe(c2.cardId)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // activate
  // ═══════════════════════════════════════════════════════════

  describe('activate', () => {
    it('应成功激活礼品卡（pending → active）', () => {
      const card = service.create(validCreateReq())
      const activated = service.activate(card.cardId)
      expect(activated.status).toBe('active')
      expect(activated.balance).toBe(activated.denomination)
      expect(activated.activatedAt).toBeTruthy()
    })

    it('已激活的卡再次激活应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.activate(cardId)).toThrow('不允许激活')
    })

    it('已过期的卡激活应抛出 BadRequestException 并标记为 expired', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      expect(() => service.activate(card.cardId)).toThrow('已过期')
      const stored = service.getById(card.cardId)
      expect(stored!.status).toBe('expired')
    })

    it('已取消的卡激活应抛出 BadRequestException', () => {
      const card = service.create(validCreateReq())
      service.cancel(card.cardId)
      expect(() => service.activate(card.cardId)).toThrow('不允许激活')
    })

    it('激活后应有 activation 流水', () => {
      const card = service.create(validCreateReq())
      service.activate(card.cardId, 'operator-1')
      const txs = service.getTransactions(card.cardId)
      expect(txs.find((t) => t.type === 'activation')).toBeTruthy()
      expect(txs.find((t) => t.type === 'activation')?.operatorId).toBe('operator-1')
    })

    it('不存在的 cardId 激活应抛出 NotFoundException', () => {
      expect(() => service.activate('NONEXISTENT')).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // topup
  // ═══════════════════════════════════════════════════════════

  describe('topup', () => {
    it('应成功充值', () => {
      const cardId = setUpActiveCard()
      const before = service.getById(cardId)!.balance
      const result = service.topup({ cardId, amount: 5000 })
      expect(result.balance).toBe(before + 5000)
    })

    it('充值金额为 0 应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.topup({ cardId, amount: 0 })).toThrow('充值金额必须大于 0')
    })

    it('充值金额为负数应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.topup({ cardId, amount: -100 })).toThrow('充值金额必须大于 0')
    })

    it('已过期的卡充值应抛出 BadRequestException', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      expect(() => service.topup({ cardId: card.cardId, amount: 5000 })).toThrow('已过期')
    })

    it('已消费完的卡可充值（redeemed → active 并非直接充值）', () => {
      const cardId = setUpActiveCard(1000)
      service.consume(validConsumeReq(cardId, { amount: 1000 }))
      const redeemed = service.getById(cardId)
      expect(redeemed!.status).toBe('redeemed')
      // redeemed 状态不允许充值
      expect(() => service.topup({ cardId, amount: 500 })).toThrow('不允许充值')
    })

    it('不存在的卡充值应抛出 NotFoundException', () => {
      expect(() => service.topup({ cardId: 'NONEXISTENT', amount: 500 })).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // consume
  // ═══════════════════════════════════════════════════════════

  describe('consume', () => {
    it('应成功消费并减少余额', () => {
      const cardId = setUpActiveCard(10000)
      const before = service.getById(cardId)!.balance
      const result = service.consume(validConsumeReq(cardId, { amount: 3000 }))
      expect(result.balance).toBe(before - 3000)
      expect(result.totalConsumed).toBe(3000)
    })

    it('消费金额为 0 应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.consume(validConsumeReq(cardId, { amount: 0 }))).toThrow('消费金额必须大于 0')
    })

    it('消费金额为负数应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.consume(validConsumeReq(cardId, { amount: -100 }))).toThrow('消费金额必须大于 0')
    })

    it('余额不足时应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard(500)
      expect(() => service.consume(validConsumeReq(cardId, { amount: 1000 }))).toThrow('余额不足')
    })

    it('消费到余额为 0 应自动标记为 redeemed', () => {
      const cardId = setUpActiveCard(1000)
      const result = service.consume(validConsumeReq(cardId, { amount: 1000 }))
      expect(result.status).toBe('redeemed')
      expect(result.balance).toBe(0)
    })

    it('已挂失/冻结的卡不允许消费', () => {
      const cardId = setUpActiveCard()
      service.freeze(cardId)
      expect(() => service.consume(validConsumeReq(cardId))).toThrow('不允许消费')
    })

    it('已过期的卡消费应抛出 BadRequestException', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      expect(() => service.consume(validConsumeReq(card.cardId))).toThrow('已过期')
    })

    it('消费后应有 consume 流水记录', () => {
      const cardId = setUpActiveCard()
      service.consume(validConsumeReq(cardId, { orderId: 'ORDER-001', operatorId: 'OP-1' }))
      const txs = service.getTransactions(cardId)
      const consumeTx = txs.find((t) => t.type === 'consume')
      expect(consumeTx).toBeTruthy()
      expect(consumeTx!.orderId).toBe('ORDER-001')
      expect(consumeTx!.operatorId).toBe('OP-1')
    })

    it('不存在的卡消费应抛出 NotFoundException', () => {
      expect(() => service.consume(validConsumeReq('NONEXISTENT'))).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // freeze / unfreeze
  // ═══════════════════════════════════════════════════════════

  describe('freeze', () => {
    it('应成功冻结 active 卡', () => {
      const cardId = setUpActiveCard()
      const result = service.freeze(cardId)
      expect(result.status).toBe('frozen')
      expect(result.frozenAmount).toBe(result.balance)
    })

    it('已冻结的卡再次冻结应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      service.freeze(cardId)
      expect(() => service.freeze(cardId)).toThrow('不允许冻结')
    })

    it('pending 状态的卡不允许冻结', () => {
      const card = service.create(validCreateReq())
      expect(() => service.freeze(card.cardId)).toThrow('不允许冻结')
    })

    it('不存在的卡冻结应抛出 NotFoundException', () => {
      expect(() => service.freeze('NONEXISTENT')).toThrow('不存在')
    })
  })

  describe('unfreeze', () => {
    it('应成功解冻 frozen 卡', () => {
      const cardId = setUpActiveCard()
      service.freeze(cardId)
      const result = service.unfreeze(cardId)
      expect(result.status).toBe('active')
      expect(result.frozenAmount).toBe(0)
    })

    it('未冻结的卡不允许解冻', () => {
      const cardId = setUpActiveCard()
      expect(() => service.unfreeze(cardId)).toThrow('不允许解冻')
    })

    it('已取消的卡不允许解冻', () => {
      const cardId = setUpActiveCard()
      service.cancel(cardId)
      expect(() => service.unfreeze(cardId)).toThrow('不允许解冻')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // cancel
  // ═══════════════════════════════════════════════════════════

  describe('cancel', () => {
    it('应成功取消 pending 卡', () => {
      const card = service.create(validCreateReq())
      const result = service.cancel(card.cardId)
      expect(result.status).toBe('cancelled')
    })

    it('应成功取消 active 卡', () => {
      const cardId = setUpActiveCard()
      const result = service.cancel(cardId)
      expect(result.status).toBe('cancelled')
    })

    it('已取消的卡不允许再次取消', () => {
      const cardId = setUpActiveCard()
      service.cancel(cardId)
      expect(() => service.cancel(cardId)).toThrow('不允许取消')
    })

    it('已消费完的卡不允许取消', () => {
      const cardId = setUpActiveCard(1000)
      service.consume(validConsumeReq(cardId, { amount: 1000 }))
      expect(() => service.cancel(cardId)).toThrow('不允许取消')
    })

    it('取消后余额应归零', () => {
      const cardId = setUpActiveCard()
      service.cancel(cardId, 'OP-1', '客户主动取消')
      const stored = service.getById(cardId)
      expect(stored!.status).toBe('cancelled')
      const txs = service.getTransactions(cardId)
      expect(txs.find((t) => t.type === 'cancel')).toBeTruthy()
    })
  })

  // ═══════════════════════════════════════════════════════════
  // refund
  // ═══════════════════════════════════════════════════════════

  describe('refund', () => {
    it('应成功将消费冲回余额', () => {
      const cardId = setUpActiveCard(10000)
      service.consume(validConsumeReq(cardId, { amount: 3000 }))
      const before = service.getById(cardId)!.balance
      const result = service.refund(cardId, 3000)
      expect(result.balance).toBe(before + 3000)
      expect(result.totalConsumed).toBe(0)
    })

    it('退款金额为 0 应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.refund(cardId, 0)).toThrow('退款金额必须大于 0')
    })

    it('退款金额为负数应抛出 BadRequestException', () => {
      const cardId = setUpActiveCard()
      expect(() => service.refund(cardId, -100)).toThrow('退款金额必须大于 0')
    })

    it('已取消的卡不允许退款', () => {
      const cardId = setUpActiveCard()
      service.cancel(cardId)
      expect(() => service.refund(cardId, 500)).toThrow('不允许退款')
    })

    it('已过期的卡不允许退款', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      expect(() => service.refund(card.cardId, 500)).toThrow('不允许退款')
    })

    it('redeemed 卡退款后应恢复为 active', () => {
      const cardId = setUpActiveCard(1000)
      service.consume(validConsumeReq(cardId, { amount: 1000 }))
      expect(service.getById(cardId)!.status).toBe('redeemed')
      const result = service.refund(cardId, 500)
      expect(result.status).toBe('active')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // query: getById / list / getTransactions / getStats
  // ═══════════════════════════════════════════════════════════

  describe('getById', () => {
    it('存在时应返回卡', () => {
      const card = service.create(validCreateReq())
      expect(service.getById(card.cardId)).toBeTruthy()
    })

    it('不存在时应返回 undefined', () => {
      expect(service.getById('NONEXISTENT')).toBeUndefined()
    })
  })

  describe('list', () => {
    it('应返回全部卡（无过滤）', () => {
      service.create(validCreateReq())
      service.create(validCreateReq({ holderName: '李四' }))
      expect(service.list()).toHaveLength(2)
    })

    it('应支持按 status 过滤', () => {
      const c1 = service.create(validCreateReq())
      service.activate(c1.cardId)
      expect(service.list({ status: 'pending' })).toHaveLength(0)
      expect(service.list({ status: 'active' })).toHaveLength(1)
    })

    it('应支持按 holderName 模糊匹配', () => {
      service.create(validCreateReq({ holderName: '张三丰' }))
      service.create(validCreateReq({ holderName: '李四' }))
      expect(service.list({ holderName: '张三' })).toHaveLength(1)
    })

    it('应支持按 holderPhone 模糊匹配', () => {
      service.create(validCreateReq({ holderPhone: '13800138001' }))
      expect(service.list({ holderPhone: '13800138' })).toHaveLength(1)
    })

    it('应支持按 tenantId 精确过滤', () => {
      service.create(validCreateReq({ tenantId: 'tenant-1' }))
      service.create(validCreateReq({ tenantId: 'tenant-2' }))
      expect(service.list({ tenantId: 'tenant-1' })).toHaveLength(1)
    })

    it('无匹配时应返回空数组', () => {
      expect(service.list({ status: 'active' })).toEqual([])
    })
  })

  describe('getTransactions', () => {
    it('应返回卡的交易流水', () => {
      const card = service.create(validCreateReq())
      const txs = service.getTransactions(card.cardId)
      expect(Array.isArray(txs)).toBe(true)
    })

    it('无流水的卡应返回空数组', () => {
      const card = service.create(validCreateReq())
      // activate 后再查，应有 purchase + activation
      const txs = service.getTransactions(card.cardId)
      expect(txs.length).toBeGreaterThanOrEqual(1)
    })

    it('不存在的卡应抛出 NotFoundException', () => {
      expect(() => service.getTransactions('NONEXISTENT')).toThrow('不存在')
    })
  })

  describe('getStats', () => {
    it('空存储时所有计数为 0', () => {
      const stats = service.getStats()
      expect(stats.total).toBe(0)
      expect(stats.active).toBe(0)
    })

    it('应正确统计各状态的数量', () => {
      const c1 = service.create(validCreateReq())
      service.activate(c1.cardId)
      const c2 = service.create(validCreateReq())
      service.cancel(c2.cardId)
      const stats = service.getStats()
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(1)
      expect(stats.cancelled).toBe(1)
    })

    it('应支持按 tenantId 过滤统计', () => {
      service.create(validCreateReq({ tenantId: 't1' }))
      service.create(validCreateReq({ tenantId: 't2' }))
      expect(service.getStats('t1').total).toBe(1)
      expect(service.getStats('t2').total).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // cleanupExpired
  // ═══════════════════════════════════════════════════════════

  describe('cleanupExpired', () => {
    it('应清理到期卡并将其标记为 expired', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      const count = service.cleanupExpired()
      expect(count).toBe(1)
      expect(service.getById(card.cardId)!.status).toBe('expired')
    })

    it('未到期的卡不应被清理', () => {
      service.create(validCreateReq())
      expect(service.cleanupExpired()).toBe(0)
    })

    it('已取消的卡不应重复标记', () => {
      const card = service.create(validCreateReq({ expiresAt: '2020-01-01T00:00:00Z' }))
      service.cancel(card.cardId)
      expect(service.cleanupExpired()).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 并发/多状态场景
  // ═══════════════════════════════════════════════════════════

  describe('多步骤状态流转', () => {
    it('pending → activate → consume → refund → cancel 完整流转', () => {
      const card = service.create(validCreateReq({ denomination: 5000 }))
      expect(card.status).toBe('pending')

      service.activate(card.cardId)
      expect(service.getById(card.cardId)!.status).toBe('active')

      service.consume(validConsumeReq(card.cardId, { amount: 2000 }))
      const afterConsume = service.getById(card.cardId)!
      expect(afterConsume.balance).toBe(3000)

      service.refund(card.cardId, 1000)
      expect(service.getById(card.cardId)!.balance).toBe(4000)

      service.cancel(card.cardId)
      expect(service.getById(card.cardId)!.status).toBe('cancelled')
    })

    it('pending → freeze → 不允许激活', () => {
      const card = service.create(validCreateReq())
      // pending 不能冻结，先激活
      service.activate(card.cardId)
      service.freeze(card.cardId)
      // freeze 不允许激活
      expect(() => service.activate(card.cardId)).toThrow('不允许激活')
    })
  })

  describe('空值/边界', () => {
    it('storeScope 为空数组可创建', () => {
      const card = service.create(validCreateReq({ storeScope: [] }))
      expect(card.storeScope).toEqual([])
    })

    it('tenantId 为 undefined 可创建', () => {
      const card = service.create(validCreateReq({ tenantId: undefined }))
      expect(card.tenantId).toBeUndefined()
    })

    it('超大面额应可创建', () => {
      const card = service.create(validCreateReq({ denomination: 9_999_999 }))
      expect(card.denomination).toBe(9_999_999)
    })
  })
})
