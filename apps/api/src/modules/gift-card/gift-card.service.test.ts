/**
 * 🧪 GiftCardService 单元测试
 * 覆盖: create / activate / topup / consume / freeze / unfreeze / cancel / refund / list / getById / getTransactions / getStats / cleanupExpired
 * 三件套：正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GiftCardService } from './gift-card.service'

function createFreshService(): GiftCardService {
  return new GiftCardService()
}

// ════════════════════════════════════════════════════════════
// 辅助：创建一张待激活的礼品卡
// ════════════════════════════════════════════════════════════

function makePendingCard(svc: GiftCardService, denom = 10000) {
  return svc.create({
    templateId: 'tpl-default',
    denomination: denom,
    holderName: '张三',
    holderPhone: '13800138000',
    expiresAt: '2027-12-31T23:59:59Z',
    tenantId: 'default',
    sourceOrderId: 'order-001',
  })
}

describe('GiftCardService', () => {
  // ════════════════════════════════════════════════════════════
  // create — 创建礼品卡
  // ════════════════════════════════════════════════════════════

  describe('create', () => {
    it('[正例] 创建礼品卡成功，状态为 pending', () => {
      const svc = createFreshService()
      const card = svc.create({
        templateId: 'tpl-default',
        denomination: 5000,
        holderName: '李四',
        holderPhone: '13900139000',
        expiresAt: '2027-12-31T23:59:59Z',
      })
      expect(card.cardId).toMatch(/^GC/)
      expect(card.status).toBe('pending')
      expect(card.balance).toBe(0) // pending 时余额为 0
      expect(card.denomination).toBe(5000)
      expect(card.holderName).toBe('李四')
      expect(card.totalConsumed).toBe(0)
    })

    it('[正例] 创建时自动产生交易记录（purchase）', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      const txs = svc.getTransactions(card.cardId)
      expect(txs.length).toBe(1)
      expect(txs[0].type).toBe('purchase')
    })

    it('[正例] 创建后可通过 list 查到', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      const all = svc.list()
      expect(all.some(c => c.cardId === card.cardId)).toBe(true)
    })

    it('[反例] 面额 <= 0 抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.create({
        templateId: 'tpl-default',
        denomination: 0,
        holderName: '测试',
        holderPhone: '13900139000',
        expiresAt: '2027-12-31T23:59:59Z',
      })).toThrow('面额必须大于 0')
    })

    it('[反例] 负数面额抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.create({
        templateId: 'tpl-default',
        denomination: -100,
        holderName: '测试',
        holderPhone: '13900139000',
        expiresAt: '2027-12-31T23:59:59Z',
      })).toThrow('面额必须大于 0')
    })

    it('[反例] 缺少持卡人姓名抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.create({
        templateId: 'tpl-default',
        denomination: 1000,
        holderName: '',
        holderPhone: '13900139000',
        expiresAt: '2027-12-31T23:59:59Z',
      })).toThrow('持卡人姓名')
    })

    it('[反例] 缺少持卡人手机号抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.create({
        templateId: 'tpl-default',
        denomination: 1000,
        holderName: '测试',
        holderPhone: '',
        expiresAt: '2027-12-31T23:59:59Z',
      })).toThrow('持卡人手机号')
    })
  })

  // ════════════════════════════════════════════════════════════
  // activate — 激活礼品卡
  // ════════════════════════════════════════════════════════════

  describe('activate', () => {
    it('[正例] 激活后状态为 active，余额等于面额', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 10000)
      const activated = svc.activate(card.cardId)
      expect(activated.status).toBe('active')
      expect(activated.balance).toBe(10000)
      expect(activated.activatedAt).toBeTruthy()
    })

    it('[正例] 激活后增加 activation 交易记录', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      const txs = svc.getTransactions(card.cardId)
      expect(txs.length).toBe(2)
      expect(txs[1].type).toBe('activation')
      expect(txs[1].afterBalance).toBe(card.denomination)
    })

    it('[反例] 重复激活抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      expect(() => svc.activate(card.cardId)).toThrow('不允许激活')
    })

    it('[反例] 激活不存在的卡抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.activate('nonexistent')).toThrow('不存在')
    })
  })

  // ════════════════════════════════════════════════════════════
  // topup — 充值
  // ════════════════════════════════════════════════════════════

  describe('topup', () => {
    it('[正例] 充值后余额增加', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      const topped = svc.topup({ cardId: card.cardId, amount: 5000 })
      expect(topped.balance).toBe(15000) // 10000 + 5000
    })

    it('[正例] 充值产生 topup 交易（amount 为负数表示增加余额）', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.topup({ cardId: card.cardId, amount: 3000 })
      const txs = svc.getTransactions(card.cardId)
      const topupTx = txs.find(t => t.type === 'topup')
      expect(topupTx).toBeDefined()
      expect(topupTx!.amount).toBe(-3000) // 充值是负值
    })

    it('[反例] 充值金额 <= 0 抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      expect(() => svc.topup({ cardId: card.cardId, amount: 0 })).toThrow('充值金额')
    })

    it('[反例] pending 状态的卡不允许充值', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      expect(() => svc.topup({ cardId: card.cardId, amount: 1000 })).toThrow('不允许充值')
    })
  })

  // ════════════════════════════════════════════════════════════
  // consume — 消费
  // ════════════════════════════════════════════════════════════

  describe('consume', () => {
    it('[正例] 消费后余额减少', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      const consumed = svc.consume({ cardId: card.cardId, amount: 3000 })
      expect(consumed.balance).toBe(7000)
    })

    it('[正例] 消费增加 totalConsumed', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 2000 })
      svc.consume({ cardId: card.cardId, amount: 3000 })
      const updated = svc.getById(card.cardId)!
      expect(updated.totalConsumed).toBe(5000)
    })

    it('[正例] 消费后产生 consume 交易记录', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 1000 })
      const txs = svc.getTransactions(card.cardId)
      const consumeTx = txs.find(t => t.type === 'consume')
      expect(consumeTx).toBeDefined()
      expect(consumeTx!.afterBalance).toBe(9000)
    })

    it('[正例] 消费到余额为 0 时自动标记为 redeemed', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 5000)
      svc.activate(card.cardId)
      const consumed = svc.consume({ cardId: card.cardId, amount: 5000 })
      expect(consumed.status).toBe('redeemed')
      expect(consumed.balance).toBe(0)
    })

    it('[反例] 余额不足抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 1000)
      svc.activate(card.cardId)
      expect(() => svc.consume({ cardId: card.cardId, amount: 2000 })).toThrow('余额不足')
    })

    it('[反例] 消费金额 <= 0 抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      expect(() => svc.consume({ cardId: card.cardId, amount: 0 })).toThrow('消费金额')
    })
  })

  // ════════════════════════════════════════════════════════════
  // freeze / unfreeze — 冻结与解冻
  // ════════════════════════════════════════════════════════════

  describe('freeze / unfreeze', () => {
    it('[正例] 冻结后状态变为 frozen', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      const frozen = svc.freeze(card.cardId)
      expect(frozen.status).toBe('frozen')
      expect(frozen.frozenAmount).toBe(frozen.balance)
    })

    it('[正例] 解冻后状态恢复 active', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.freeze(card.cardId)
      const unfrozen = svc.unfreeze(card.cardId)
      expect(unfrozen.status).toBe('active')
      expect(unfrozen.frozenAmount).toBe(0)
    })

    it('[反例] 冻结非 active 的卡抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      expect(() => svc.freeze(card.cardId)).toThrow('不允许冻结')
    })

    it('[反例] 重复解冻抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.freeze(card.cardId)
      svc.unfreeze(card.cardId)
      expect(() => svc.unfreeze(card.cardId)).toThrow('不允许解冻')
    })
  })

  // ════════════════════════════════════════════════════════════
  // cancel — 取消
  // ════════════════════════════════════════════════════════════

  describe('cancel', () => {
    it('[正例] 取消 pending 卡状态变为 cancelled', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      const cancelled = svc.cancel(card.cardId)
      expect(cancelled.status).toBe('cancelled')
    })

    it('[反例] 取消已 cancelled 的卡抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.cancel(card.cardId)
      expect(() => svc.cancel(card.cardId)).toThrow('不允许取消')
    })

    it('[反例] 取消已 redeemed 的卡抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 100)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 100 })
      expect(() => svc.cancel(card.cardId)).toThrow('不允许取消')
    })
  })

  // ════════════════════════════════════════════════════════════
  // refund — 退款
  // ════════════════════════════════════════════════════════════

  describe('refund', () => {
    it('[正例] 退款后余额增加', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 3000 })
      const refunded = svc.refund(card.cardId, 3000)
      expect(refunded.balance).toBe(10000) // 恢复到初始余额
    })

    it('[正例] 退款后 redeemed 卡恢复为 active', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 1000)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 1000 })
      const refunded = svc.refund(card.cardId, 500)
      expect(refunded.status).toBe('active')
      expect(refunded.balance).toBe(500)
    })

    it('[反例] 退款金额 <= 0 抛出异常', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      expect(() => svc.refund(card.cardId, 0)).toThrow('退款金额')
    })

    it('[反例] 已取消的卡不允许退款', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.cancel(card.cardId)
      expect(() => svc.refund(card.cardId, 100)).toThrow('不允许退款')
    })
  })

  // ════════════════════════════════════════════════════════════
  // list / getById — 查询
  // ════════════════════════════════════════════════════════════

  describe('list / getById', () => {
    it('[正例] list 返回空时为空数组', () => {
      const svc = createFreshService()
      expect(svc.list()).toEqual([])
    })

    it('[正例] list 按状态筛选', () => {
      const svc = createFreshService()
      makePendingCard(svc)
      const card2 = makePendingCard(svc)
      svc.activate(card2.cardId)
      const actives = svc.list({ status: 'active' })
      expect(actives.length).toBe(1)
    })

    it('[正例] list 按持卡人姓名模糊匹配', () => {
      const svc = createFreshService()
      makePendingCard(svc)
      const result = svc.list({ holderName: '张三' })
      expect(result.length).toBe(1)
    })

    it('[正例] getById 返回 undefined 对于不存在的卡', () => {
      const svc = createFreshService()
      expect(svc.getById('nonexistent')).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════════════════════
  // getTransactions — 交易流水
  // ════════════════════════════════════════════════════════════

  describe('getTransactions', () => {
    it('[正例] 获取完整交易流水', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 2000 })
      const txs = svc.getTransactions(card.cardId)
      expect(txs.length).toBe(3) // purchase + activation + consume
    })

    it('[反例] 不存在的卡抛出异常', () => {
      const svc = createFreshService()
      expect(() => svc.getTransactions('nonexistent')).toThrow('不存在')
    })

    it('[边界] 刚创建的卡有一笔 purchase 交易', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      const txs = svc.getTransactions(card.cardId)
      expect(txs.length).toBe(1)
      expect(txs[0].type).toBe('purchase')
      expect(txs[0].beforeBalance).toBe(0)
      expect(txs[0].afterBalance).toBe(0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // getStats — 统计
  // ════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('[正例] 无数据时统计为零', () => {
      const svc = createFreshService()
      const stats = svc.getStats()
      expect(stats.total).toBe(0)
      expect(stats.active).toBe(0)
      expect(stats.totalBalance).toBe(0)
    })

    it('[正例] 创建并激活后统计正确', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 10000)
      svc.activate(card.cardId)
      const stats = svc.getStats()
      expect(stats.total).toBe(1)
      expect(stats.active).toBe(1)
      expect(stats.totalBalance).toBe(10000)
      expect(stats.pending).toBe(0)
    })

    it('[正例] 多张卡统计累加', () => {
      const svc = createFreshService()
      const c1 = makePendingCard(svc, 5000)
      svc.activate(c1.cardId)
      const c2 = makePendingCard(svc, 10000)
      svc.activate(c2.cardId)
      const stats = svc.getStats()
      expect(stats.total).toBe(2)
      expect(stats.active).toBe(2)
      expect(stats.totalBalance).toBe(15000)
      expect(stats.totalDenomination).toBe(15000)
    })

    it('[正例] 消费后统计余额更新', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 5000)
      svc.activate(card.cardId)
      svc.consume({ cardId: card.cardId, amount: 2000 })
      const stats = svc.getStats()
      expect(stats.totalBalance).toBe(3000)
      expect(stats.active).toBe(1)
    })

    it('[正例] 按租户筛选统计', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc)
      svc.activate(card.cardId)
      const stats = svc.getStats('default')
      expect(stats.total).toBe(1)
      const statsOther = svc.getStats('other-tenant')
      expect(statsOther.total).toBe(0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // cleanupExpired — 过期清理
  // ════════════════════════════════════════════════════════════

  describe('cleanupExpired', () => {
    it('[正例] 清理过期的 active 卡', () => {
      const svc = createFreshService()
      // 创建一张已经过期的卡
      svc.create({
        templateId: 'tpl-default',
        denomination: 1000,
        holderName: '过期用户',
        holderPhone: '13900139000',
        expiresAt: '2020-01-01T00:00:00Z', // 早已过期
        tenantId: 'default',
      })
      const expired = svc.list()
      expect(expired.some(c => c.status === 'expired')).toBe(false) // 还没触发清理

      const count = svc.cleanupExpired()
      expect(count).toBeGreaterThanOrEqual(1) // 应该清理了 pending 过期卡

      const after = svc.list()
      const expiredCard = after.find(c => c.holderName === '过期用户')
      expect(expiredCard).toBeDefined()
      expect(expiredCard!.status).toBe('expired')
    })

    it('[边界] 无过期卡时返回 0', () => {
      const svc = createFreshService()
      const count = svc.cleanupExpired()
      expect(count).toBe(0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 复合场景
  // ════════════════════════════════════════════════════════════

  describe('复合场景', () => {
    it('完整生命周期：创建→激活→消费→退款→冻结→取消', () => {
      const svc = createFreshService()
      const card = makePendingCard(svc, 10000)
      expect(card.status).toBe('pending')

      const activated = svc.activate(card.cardId)
      expect(activated.balance).toBe(10000)

      const consumed = svc.consume({ cardId: card.cardId, amount: 4000 })
      expect(consumed.balance).toBe(6000)

      const refunded = svc.refund(card.cardId, 2000)
      expect(refunded.balance).toBe(8000)

      const frozen = svc.freeze(card.cardId)
      expect(frozen.status).toBe('frozen')

      const unfrozen = svc.unfreeze(card.cardId)
      expect(unfrozen.status).toBe('active')

      const cancelled = svc.cancel(card.cardId)
      expect(cancelled.status).toBe('cancelled')
    })

    it('多卡并发操作不影响独立余额', () => {
      const svc = createFreshService()
      const c1 = makePendingCard(svc, 10000)
      const c2 = makePendingCard(svc, 5000)
      svc.activate(c1.cardId)
      svc.activate(c2.cardId)
      svc.consume({ cardId: c1.cardId, amount: 7000 })
      svc.consume({ cardId: c2.cardId, amount: 2000 })
      expect(svc.getById(c1.cardId)!.balance).toBe(3000)
      expect(svc.getById(c2.cardId)!.balance).toBe(3000)
    })

    it('创建多卡后 getStats 汇总正确', () => {
      const svc = createFreshService()
      for (let i = 0; i < 3; i++) {
        const c = makePendingCard(svc, 5000)
        svc.activate(c.cardId)
      }
      const stats = svc.getStats()
      expect(stats.total).toBe(3)
      expect(stats.active).toBe(3)
      expect(stats.totalBalance).toBe(15000)
    })
  })
})
