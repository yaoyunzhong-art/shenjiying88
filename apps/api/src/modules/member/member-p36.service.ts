/**
 * P-36 会员中心核心服务 (PRD-002 驱动)
 *
 * RQ-36-01 ~ RQ-36-10 实现
 * AC-36-01 ~ AC-36-10 验收
 *
 * @see docs/knowledge/prd/prd-member-p36.md
 */

import { Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import type {
  P36Member,
  PointsTransaction,
  BalanceTransaction,
  LevelDisplay,
  ConsumptionRecord
} from './member-p36.entity'
import {
  computeLevel,
  buildLevelDisplay,
  calcEarnedPoints,
  LEVEL_CONFIGS,
  LEVEL_ORDER
} from './member-p36.entity'

// ── 内存存储（生产环境替换为数据库） ──

const memberStore = new Map<string, P36Member>()
const pointsTxStore = new Map<string, PointsTransaction>()
const balanceTxStore = new Map<string, BalanceTransaction>()

export function resetP36MemberTestState() {
  memberStore.clear()
  pointsTxStore.clear()
  balanceTxStore.clear()
}

// ── 工具 ──

function genId(prefix = 'p36'): string {
  return `${prefix}-${randomBytes(8).toString('hex')}`
}

@Injectable()
export class MemberP36Service {
  // ═══════════════════════════════════════
  // AC-36-01: 会员注册 (RQ-36-01)
  // ═══════════════════════════════════════
  register(phone: string, name: string): P36Member {
    if (!phone || !phone.trim()) {
      throw new Error('手机号不能为空')
    }
    if (!name || !name.trim()) {
      throw new Error('姓名不能为空')
    }
    const exists = this.findByPhone(phone)
    if (exists) {
      throw new Error('该手机号已注册')
    }
    const member: P36Member = {
      id: genId('mem'),
      phone: phone.trim(),
      name: name.trim(),
      level: 'regular',
      points: 0,
      balance: 0,
      totalSpent: 0,
      createdAt: new Date()
    }
    memberStore.set(member.id, member)
    return member
  }

  // ═══════════════════════════════════════
  // AC-36-02: 会员查询(手机号) (RQ-36-02)
  // ═══════════════════════════════════════
  queryByPhone(phone: string): P36Member | null {
    return this.findByPhone(phone) ?? null
  }

  queryById(id: string): P36Member | null {
    return memberStore.get(id) ?? null
  }

  private findByPhone(phone: string): P36Member | undefined {
    for (const m of memberStore.values()) {
      if (m.phone === phone.trim()) return m
    }
    return undefined
  }

  // ═══════════════════════════════════════
  // AC-36-03: 等级展示 (RQ-36-03)
  // ═══════════════════════════════════════
  getLevelDisplay(memberId: string): LevelDisplay | null {
    const member = memberStore.get(memberId)
    if (!member) return null
    return buildLevelDisplay(member)
  }

  // ═══════════════════════════════════════
  // AC-36-04: 积分累计 (RQ-36-04)
  // ═══════════════════════════════════════
  earnPoints(memberId: string, consumptionAmount: number, orderId?: string): P36Member {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')
    if (consumptionAmount <= 0) throw new Error('消费金额必须大于0')

    const earned = calcEarnedPoints(consumptionAmount, member.level)

    // 更新会员
    member.points += earned
    member.totalSpent += consumptionAmount
    // 升级判断
    const newLevel = computeLevel(member.totalSpent)
    member.level = newLevel

    // 记录积分流水
    const tx: PointsTransaction = {
      id: genId('ptx'),
      memberId,
      type: 'earn',
      amount: earned,
      orderId,
      remark: `消费${consumptionAmount}分获赠${earned}积分(等级${member.level})`,
      createdAt: new Date()
    }
    pointsTxStore.set(tx.id, tx)

    return member
  }

  // ═══════════════════════════════════════
  // AC-36-05: 积分扣减 (RQ-36-05)
  // ═══════════════════════════════════════
  redeemPoints(memberId: string, pointsToRedeem: number): { member: P36Member; deductionAmount: number } {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')
    if (pointsToRedeem <= 0) throw new Error('抵扣积分必须大于0')
    if (pointsToRedeem < 100) throw new Error('积分不足，最低100积分起抵扣') // 100积分=1元
    if (member.points < pointsToRedeem) throw new Error('积分不足')

    // 100积分 = 1元 (=100分)
    const deductionAmount = Math.floor(pointsToRedeem / 100) * 100 // 以分为单位

    member.points -= pointsToRedeem

    // 记录积分流水
    const tx: PointsTransaction = {
      id: genId('ptx'),
      memberId,
      type: 'redeem',
      amount: -pointsToRedeem,
      remark: `用${pointsToRedeem}积分抵扣${deductionAmount}分(${deductionAmount / 100}元)`,
      createdAt: new Date()
    }
    pointsTxStore.set(tx.id, tx)

    return { member, deductionAmount }
  }

  // ═══════════════════════════════════════
  // AC-36-06: 余额充值 (RQ-36-06)
  // ═══════════════════════════════════════
  rechargeBalance(memberId: string, amount: number, paymentMethod = 'wechat'): P36Member {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')
    if (amount <= 0) throw new Error('充值金额必须大于0')

    member.balance += amount

    // 记录流水
    const tx: BalanceTransaction = {
      id: genId('btx'),
      memberId,
      type: 'recharge',
      amount,
      paymentMethod,
      createdAt: new Date()
    }
    balanceTxStore.set(tx.id, tx)

    return member
  }

  // ═══════════════════════════════════════
  // AC-36-07: 余额支付 (RQ-36-07)
  // ═══════════════════════════════════════
  payByBalance(memberId: string, amount: number, orderId?: string): { member: P36Member; success: boolean } {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')
    if (amount <= 0) throw new Error('支付金额必须大于0')
    if (member.balance < amount) throw new Error('余额不足')

    member.balance -= amount
    member.totalSpent += amount

    // 自动升级
    const newLevel = computeLevel(member.totalSpent)
    member.level = newLevel

    // 记录流水
    const tx: BalanceTransaction = {
      id: genId('btx'),
      memberId,
      type: 'payment',
      amount: -amount,
      orderId,
      createdAt: new Date()
    }
    balanceTxStore.set(tx.id, tx)

    return { member, success: true }
  }

  // ═══════════════════════════════════════
  // AC-36-08: 消费记录查询 (RQ-36-08)
  // ═══════════════════════════════════════
  getConsumptionRecords(memberId: string): ConsumptionRecord[] {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')

    const records: ConsumptionRecord[] = []

    // 合并积分流水和余额流水
    for (const tx of pointsTxStore.values()) {
      if (tx.memberId !== memberId) continue
      const recordType = tx.type === 'earn' ? 'points_earn' : 'points_redeem'
      records.push({
        id: tx.id,
        memberId,
        type: recordType,
        amount: tx.amount,
        orderId: tx.orderId,
        remark: tx.remark,
        createdAt: tx.createdAt
      })
    }
    for (const tx of balanceTxStore.values()) {
      if (tx.memberId !== memberId) continue
      const recordType = tx.type === 'recharge' ? 'recharge' : 'payment'
      records.push({
        id: tx.id,
        memberId,
        type: recordType,
        amount: tx.amount,
        orderId: tx.orderId,
        remark: `${tx.type === 'recharge' ? '充值' : '支付'}${tx.amount > 0 ? '+' : ''}${Math.floor(tx.amount / 100)}元`,
        createdAt: tx.createdAt
      })
    }

    // 按时间倒序
    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return records
  }

  // ═══════════════════════════════════════
  // AC-36-09: 会员续费 (RQ-36-09)
  // ═══════════════════════════════════════
  renewMember(memberId: string, months: number): P36Member {
    const member = memberStore.get(memberId)
    if (!member) throw new Error('会员不存在')
    if (months <= 0) throw new Error('续费月数必须大于0')

    // 保留当前等级不变
    const now = new Date()
    const currentExpiry = member.expiredAt ?? now
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()))
    newExpiry.setMonth(newExpiry.getMonth() + months)
    member.expiredAt = newExpiry

    return member
  }

  // ═══════════════════════════════════════
  // AC-36-10: 权益展示 (RQ-36-10)
  // ═══════════════════════════════════════
  getBenefits(memberId: string): { level: string; label: string; emoji: string; benefits: string[]; allLevels: Record<string, string[]> } | null {
    const member = memberStore.get(memberId)
    if (!member) return null

    const config = LEVEL_CONFIGS[member.level]

    // 所有等级权益一览
    const allLevels: Record<string, string[]> = {}
    for (const lv of LEVEL_ORDER) {
      allLevels[lv] = LEVEL_CONFIGS[lv].benefits
    }

    return {
      level: member.level,
      label: config.label,
      emoji: config.emoji,
      benefits: config.benefits,
      allLevels
    }
  }
}
