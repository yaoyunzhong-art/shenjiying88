/**
 * gift-card.service.ts — 礼品卡 Service
 *
 * 职责:
 *   - 礼品卡 CRUD（创建 / 查询 / 列表 / 状态变更）
 *   - 交易流水记录（购买 / 激活 / 充值 / 消费 / 退款 / 冻结 / 解冻 / 取消）
 *   - 余额校验
 *   - 过期检测
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import type {
  GiftCard,
  GiftCardStatus,
  GiftCardTransaction,
  GiftCardCreateRequest,
  GiftCardTopupRequest,
  GiftCardConsumeRequest,
  GiftCardFilter,
  TransactionType,
} from './gift-card.entity'
import { randomUUID } from 'node:crypto'

@Injectable()
export class GiftCardService {
  private readonly logger = new Logger(GiftCardService.name)

  /** 内存存储（生产环境迁移到数据库） */
  private readonly cards = new Map<string, GiftCard>()
  private readonly transactions = new Map<string, GiftCardTransaction[]>()

  // ─── 内部辅助 ───────────────────────────────────────────

  private generateCardId(): string {
    return `GC${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 6).toUpperCase()}`
  }

  private now(): string {
    return new Date().toISOString()
  }

  private getCardOrThrow(cardId: string): GiftCard {
    const card = this.cards.get(cardId)
    if (!card) {
      throw new NotFoundException(`礼品卡 ${cardId} 不存在`)
    }
    return card
  }

  private addTransaction(
    cardId: string,
    type: TransactionType,
    amount: number,
    beforeBalance: number,
    afterBalance: number,
    extra?: { orderId?: string; operatorId?: string; remark?: string },
  ) {
    const tx: GiftCardTransaction = {
      txId: randomUUID(),
      cardId,
      type,
      amount,
      beforeBalance,
      afterBalance,
      orderId: extra?.orderId,
      operatorId: extra?.operatorId,
      remark: extra?.remark,
      createdAt: this.now(),
    }
    const txs = this.transactions.get(cardId) || []
    txs.push(tx)
    this.transactions.set(cardId, txs)
    return tx
  }

  private checkExpired(card: GiftCard): boolean {
    return new Date(card.expiresAt) < new Date()
  }

  // ─── CRUD 操作 ──────────────────────────────────────────

  /**
   * 创建礼品卡 — 状态为 pending，需后续激活
   */
  create(request: GiftCardCreateRequest): GiftCard {
    if (request.denomination <= 0) {
      throw new BadRequestException('面额必须大于 0')
    }
    if (!request.holderName || !request.holderPhone) {
      throw new BadRequestException('持卡人姓名和手机号必填')
    }

    const cardId = this.generateCardId()
    const now = this.now()

    const card: GiftCard = {
      cardId,
      tenantId: request.tenantId,
      templateId: request.templateId,
      denomination: request.denomination,
      balance: 0,               // pending 状态余额为 0
      currency: 'CNY',
      status: 'pending',
      holderName: request.holderName,
      holderPhone: request.holderPhone,
      purchasedAt: now,
      expiresAt: request.expiresAt,
      frozenAmount: 0,
      storeScope: request.storeScope ?? [],
      sourceOrderId: request.sourceOrderId,
      totalConsumed: 0,
      createdAt: now,
      updatedAt: now,
    }

    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'purchase', request.denomination, 0, 0)

    this.logger.log(`礼品卡创建: ${cardId}, 面额: ${request.denomination}分`)
    return card
  }

  /**
   * 激活礼品卡（从 pending → active，充值面额到余额）
   */
  activate(cardId: string, operatorId?: string): GiftCard {
    const card = this.getCardOrThrow(cardId)

    if (card.status !== 'pending') {
      throw new BadRequestException(`礼品卡 ${cardId} 状态为 ${card.status}，不允许激活`)
    }

    if (this.checkExpired(card)) {
      card.status = 'expired'
      this.cards.set(cardId, card)
      throw new BadRequestException(`礼品卡 ${cardId} 已过期，无法激活`)
    }

    const beforeBalance = card.balance
    card.balance = card.denomination
    card.status = 'active'
    card.activatedAt = this.now()
    card.updatedAt = this.now()
    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'activation', card.denomination, beforeBalance, card.balance, { operatorId })

    this.logger.log(`礼品卡激活: ${cardId}`)
    return card
  }

  /**
   * 充值
   */
  topup(request: GiftCardTopupRequest): GiftCard {
    const card = this.getCardOrThrow(request.cardId)

    if (card.status !== 'active' && card.status !== 'frozen') {
      throw new BadRequestException(`礼品卡 ${request.cardId} 状态为 ${card.status}，不允许充值`)
    }

    if (this.checkExpired(card)) {
      card.status = 'expired'
      this.cards.set(request.cardId, card)
      throw new BadRequestException(`礼品卡 ${request.cardId} 已过期`)
    }

    if (request.amount <= 0) {
      throw new BadRequestException('充值金额必须大于 0')
    }

    const beforeBalance = card.balance
    card.balance += request.amount
    card.updatedAt = this.now()
    this.cards.set(request.cardId, card)

    this.addTransaction(
      request.cardId,
      'topup',
      -request.amount,  // 充值是负数金额（增加余额）
      beforeBalance,
      card.balance,
      { operatorId: request.operatorId, remark: request.remark },
    )

    this.logger.log(`礼品卡充值: ${request.cardId} +${request.amount}分`)
    return card
  }

  /**
   * 消费
   */
  consume(request: GiftCardConsumeRequest): GiftCard {
    const card = this.getCardOrThrow(request.cardId)

    if (card.status !== 'active') {
      throw new BadRequestException(`礼品卡 ${request.cardId} 状态为 ${card.status}，不允许消费`)
    }

    if (this.checkExpired(card)) {
      card.status = 'expired'
      this.cards.set(request.cardId, card)
      throw new BadRequestException(`礼品卡 ${request.cardId} 已过期`)
    }

    if (request.amount <= 0) {
      throw new BadRequestException('消费金额必须大于 0')
    }

    if (card.balance < request.amount) {
      throw new BadRequestException(
        `礼品卡 ${request.cardId} 余额不足：可用 ${card.balance} 分，需要 ${request.amount} 分`,
      )
    }

    const beforeBalance = card.balance
    card.balance -= request.amount
    card.totalConsumed += request.amount
    card.updatedAt = this.now()

    // 余额为 0 自动标记为 redeemed
    if (card.balance === 0) {
      card.status = 'redeemed'
    }

    this.cards.set(request.cardId, card)

    this.addTransaction(
      request.cardId,
      'consume',
      request.amount,
      beforeBalance,
      card.balance,
      { orderId: request.orderId, operatorId: request.operatorId, remark: request.remark },
    )

    this.logger.log(`礼品卡消费: ${request.cardId} -${request.amount}分`)
    return card
  }

  /**
   * 冻结
   */
  freeze(cardId: string, operatorId?: string, remark?: string): GiftCard {
    const card = this.getCardOrThrow(cardId)

    if (card.status !== 'active') {
      throw new BadRequestException(`礼品卡 ${cardId} 状态为 ${card.status}，不允许冻结`)
    }

    card.status = 'frozen'
    card.frozenAmount = card.balance
    card.updatedAt = this.now()
    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'freeze', 0, card.balance, card.balance, { operatorId, remark })
    this.logger.log(`礼品卡冻结: ${cardId}`)
    return card
  }

  /**
   * 解冻
   */
  unfreeze(cardId: string, operatorId?: string, remark?: string): GiftCard {
    const card = this.getCardOrThrow(cardId)

    if (card.status !== 'frozen') {
      throw new BadRequestException(`礼品卡 ${cardId} 状态为 ${card.status}，不允许解冻`)
    }

    card.status = 'active'
    card.frozenAmount = 0
    card.updatedAt = this.now()
    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'unfreeze', 0, card.balance, card.balance, { operatorId, remark })
    this.logger.log(`礼品卡解冻: ${cardId}`)
    return card
  }

  /**
   * 取消
   */
  cancel(cardId: string, operatorId?: string, remark?: string): GiftCard {
    const card = this.getCardOrThrow(cardId)

    if (card.status === 'cancelled' || card.status === 'redeemed') {
      throw new BadRequestException(`礼品卡 ${cardId} 状态为 ${card.status}，不允许取消`)
    }

    card.status = 'cancelled'
    card.updatedAt = this.now()
    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'cancel', card.balance, card.balance, 0, { operatorId, remark })
    this.logger.log(`礼品卡取消: ${cardId}`)
    return card
  }

  /**
   * 退款（将消费冲回余额）
   */
  refund(cardId: string, amount: number, operatorId?: string, remark?: string): GiftCard {
    const card = this.getCardOrThrow(cardId)

    if (card.status === 'cancelled' || card.status === 'expired') {
      throw new BadRequestException(`礼品卡 ${cardId} 状态为 ${card.status}，不允许退款`)
    }

    if (amount <= 0) {
      throw new BadRequestException('退款金额必须大于 0')
    }

    const beforeBalance = card.balance
    card.balance += amount
    card.totalConsumed = Math.max(0, card.totalConsumed - amount)
    card.updatedAt = this.now()

    // 如果之前是 redeemed 恢复为 active
    if (card.status === 'redeemed' && card.balance > 0) {
      card.status = 'active'
    }

    this.cards.set(cardId, card)

    this.addTransaction(cardId, 'refund', -amount, beforeBalance, card.balance, { operatorId, remark })
    this.logger.log(`礼品卡退款: ${cardId} +${amount}分`)
    return card
  }

  // ─── 查询 ────────────────────────────────────────────────

  /**
   * 获取礼品卡详情
   */
  getById(cardId: string): GiftCard | undefined {
    return this.cards.get(cardId)
  }

  /**
   * 查询列表（支持过滤）
   */
  list(filter?: GiftCardFilter): GiftCard[] {
    const all = Array.from(this.cards.values())

    return all.filter((card) => {
      if (filter?.status && card.status !== filter.status) return false
      if (filter?.holderName && !card.holderName.includes(filter.holderName)) return false
      if (filter?.holderPhone && !card.holderPhone.includes(filter.holderPhone)) return false
      if (filter?.tenantId && card.tenantId !== filter.tenantId) return false
      return true
    })
  }

  /**
   * 获取交易流水
   */
  getTransactions(cardId: string): GiftCardTransaction[] {
    // 验证卡存在
    this.getCardOrThrow(cardId)
    return this.transactions.get(cardId) ?? []
  }

  /**
   * 获取统计摘要
   */
  getStats(tenantId?: string) {
    const all = tenantId
      ? Array.from(this.cards.values()).filter((c) => c.tenantId === tenantId)
      : Array.from(this.cards.values())

    const active = all.filter((c) => c.status === 'active')
    const totalBalance = active.reduce((sum, c) => sum + c.balance, 0)
    const totalDenomination = all.reduce((sum, c) => sum + c.denomination, 0)

    return {
      total: all.length,
      active: active.length,
      frozen: all.filter((c) => c.status === 'frozen').length,
      expired: all.filter((c) => c.status === 'expired').length,
      redeemed: all.filter((c) => c.status === 'redeemed').length,
      cancelled: all.filter((c) => c.status === 'cancelled').length,
      pending: all.filter((c) => c.status === 'pending').length,
      totalBalance,
      totalDenomination,
    }
  }

  /**
   * 清理过期卡（将过期的 active 卡标记为 expired）
   */
  cleanupExpired(): number {
    let count = 0
    for (const card of this.cards.values()) {
      if ((card.status === 'active' || card.status === 'pending') && this.checkExpired(card)) {
        card.status = 'expired'
        card.updatedAt = this.now()
        this.cards.set(card.cardId, card)
        count++
      }
    }
    if (count > 0) {
      this.logger.log(`过期清理: ${count} 张礼品卡已标记为 expired`)
    }
    return count
  }
}
