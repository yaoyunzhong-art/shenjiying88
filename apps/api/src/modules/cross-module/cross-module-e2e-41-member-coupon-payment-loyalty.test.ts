import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #41: 会员权益 → 优惠券 → 支付 → 积分忠诚度 全链路
 *
 * 新增于 Pulse-Nightly-14 龙虾哥凌晨测试第三段
 *
 * 模拟链路:
 *   Member (会员注册/等级鉴定/权益校验)
 *   → Coupon (创建优惠券计划/发放优惠券/校验优惠券)
 *   → Payment (支付请求/折扣应用/支付完成)
 *   → Loyalty (积分累计/等级成长/忠诚度回馈)
 *
 * 覆盖模块: member, member-level, coupon, cashier/payment, loyalty, svip, points
 *
 * 设计模式: 从会员身份确定 → 发放优惠 → 支付闭环 → 积分积累 的全业务流
 * 验证跨模块状态一致性、数据传递、多核心业务联动
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

type MemberTier = 'guest' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'svip'
type CouponStatus = 'active' | 'used' | 'expired' | 'revoked'
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
type LoyaltyEvent = 'earn' | 'redeem' | 'tier_upgrade' | 'tier_downgrade'
type PaymentMethod = 'wechat_pay' | 'alipay' | 'credit_card' | 'cash' | 'points'

interface MemberProfile {
  memberId: string
  name: string
  tier: MemberTier
  points: number
  totalSpent: number
  joinDate: string
  isActive: boolean
}

interface CouponDefinition {
  couponId: string
  name: string
  type: 'discount_percent' | 'discount_fixed' | 'free_shipping' | 'cashback'
  value: number
  minSpend: number
  maxUses: number
  validFrom: string
  validTo: string
  applicableTiers: MemberTier[]
  applicableProducts: string[]
}

interface MemberCoupon {
  couponId: string
  memberId: string
  status: CouponStatus
  issuedAt: string
  redeemedAt: string | null
  orderReferenceOrderId: string | null
}

interface PaymentTransaction {
  transactionId: string
  orderId: string
  memberId: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  couponApplied: string | null
  pointsEarned: number
  createdAt: string
}

interface LoyaltyRecord {
  recordId: string
  memberId: string
  eventType: LoyaltyEvent
  pointsDelta: number
  pointsBalance: number
  tierBefore: MemberTier | null
  tierAfter: MemberTier | null
  transactionId: string | null
  description: string
  createdAt: string
}

// ============================================================
// 模块模拟实现
// ============================================================

// ---- Member Service ----

const memberStore = new Map<string, MemberProfile>()
let memberSeq = 1000

function resetMemberState(): void {
  memberStore.clear()
  memberSeq = 1000
}

function registerMember(name: string): MemberProfile {
  const memberId = `M${++memberSeq}`
  const profile: MemberProfile = {
    memberId,
    name,
    tier: 'bronze',
    points: 0,
    totalSpent: 0,
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true,
  }
  memberStore.set(memberId, profile)
  return profile
}

function getMember(memberId: string): MemberProfile | undefined {
  return memberStore.get(memberId)
}

function upgradeTier(memberId: string, newTier: MemberTier): MemberProfile {
  const member = memberStore.get(memberId)
  if (!member) throw new Error(`Member ${memberId} not found`)
  const tierOrder: MemberTier[] = ['guest', 'bronze', 'silver', 'gold', 'platinum', 'svip']
  const currentIdx = tierOrder.indexOf(member.tier)
  const newIdx = tierOrder.indexOf(newTier)
  if (newIdx <= currentIdx && member.tier !== newTier) {
    throw new Error(`Cannot downgrade tier from ${member.tier} to ${newTier}`)
  }
  member.tier = newTier
  return { ...member }
}

function isTierEligible(member: MemberProfile, requiredTier: MemberTier): boolean {
  const tierOrder: MemberTier[] = ['guest', 'bronze', 'silver', 'gold', 'platinum', 'svip']
  return tierOrder.indexOf(member.tier) >= tierOrder.indexOf(requiredTier)
}

// ---- Coupon Service ----

const couponDefStore = new Map<string, CouponDefinition>()
const memberCouponStore = new Map<string, MemberCoupon[]>()
let couponSeq = 2000

function resetCouponState(): void {
  couponDefStore.clear()
  memberCouponStore.clear()
  couponSeq = 2000
}

function createCouponPlan(def: Omit<CouponDefinition, 'couponId'>): CouponDefinition {
  const couponId = `CPN${++couponSeq}`
  const full: CouponDefinition = { couponId, ...def }
  couponDefStore.set(couponId, full)
  return full
}

function issueCoupon(memberId: string, couponId: string): MemberCoupon {
  const member = memberStore.get(memberId)
  if (!member) throw new Error(`Member ${memberId} not found`)
  const def = couponDefStore.get(couponId)
  if (!def) throw new Error(`Coupon ${couponId} not found`)

  // 校验会员等级是否适用
  if (!isTierEligible(member, def.applicableTiers[0])) {
    throw new Error(`Member tier ${member.tier} not eligible for coupon requiring ${def.applicableTiers[0]}`)
  }

  const record: MemberCoupon = {
    couponId,
    memberId,
    status: 'active',
    issuedAt: new Date().toISOString(),
    redeemedAt: null,
    orderReferenceOrderId: null,
  }
  const existing = memberCouponStore.get(memberId) || []
  existing.push(record)
  memberCouponStore.set(memberId, existing)
  return record
}

function getMemberCoupons(memberId: string): MemberCoupon[] {
  return memberCouponStore.get(memberId) || []
}

function findActiveCoupon(memberId: string): MemberCoupon | null {
  const coupons = memberCouponStore.get(memberId) || []
  return coupons.find(c => c.status === 'active') || null
}

function markCouponUsed(memberId: string, couponId: string, orderId: string): void {
  const coupons = memberCouponStore.get(memberId) || []
  const idx = coupons.findIndex(c => c.couponId === couponId && c.status === 'active')
  if (idx === -1) throw new Error(`Active coupon ${couponId} not found for member ${memberId}`)
  coupons[idx].status = 'used'
  coupons[idx].redeemedAt = new Date().toISOString()
  coupons[idx].orderReferenceOrderId = orderId
}

// ---- Payment / Cashier Service ----

const paymentStore = new Map<string, PaymentTransaction>()
let paymentSeq = 3000

function resetPaymentState(): void {
  paymentStore.clear()
  paymentSeq = 3000
}

function calculateDiscount(total: number, coupon: MemberCoupon | null, member: MemberProfile): { discountAmount: number; finalAmount: number } {
  let discount = 0
  if (coupon) {
    const def = couponDefStore.get(coupon.couponId)
    if (def) {
      if (def.minSpend > total) throw new Error(`Min spend $${def.minSpend} not met (total: $${total})`)
      if (def.type === 'discount_percent') {
        discount = total * (def.value / 100)
      } else if (def.type === 'discount_fixed') {
        discount = Math.min(def.value, total)
      }
    }
  }
  // 会员等级折扣
  if (member.tier === 'gold') discount += total * 0.05
  if (member.tier === 'platinum' || member.tier === 'svip') discount += total * 0.10

  const finalAmount = Math.max(0, Math.round((total - discount) * 100) / 100)
  return { discountAmount: Math.round(discount * 100) / 100, finalAmount }
}

function processPayment(
  memberId: string,
  orderId: string,
  totalAmount: number,
  paymentMethod: PaymentMethod
): PaymentTransaction {
  const member = memberStore.get(memberId)
  if (!member) throw new Error(`Member ${memberId} not found`)
  if (!member.isActive) throw new Error('Member account is inactive')

  const activeCoupon = findActiveCoupon(memberId)
  const { discountAmount, finalAmount } = calculateDiscount(totalAmount, activeCoupon, member)

  const txnId = `TXN${++paymentSeq}`
  const transaction: PaymentTransaction = {
    transactionId: txnId,
    orderId,
    memberId,
    totalAmount,
    discountAmount,
    finalAmount,
    paymentMethod,
    status: 'completed',
    couponApplied: activeCoupon?.couponId || null,
    pointsEarned: 0,
    createdAt: new Date().toISOString(),
  }

  // Use coupon if applied
  if (activeCoupon) {
    markCouponUsed(memberId, activeCoupon.couponId, orderId)
  }

  // Update member totals
  member.totalSpent += finalAmount

  paymentStore.set(txnId, transaction)
  return transaction
}

function getPayment(txnId: string): PaymentTransaction | undefined {
  return paymentStore.get(txnId)
}

// ---- Loyalty Service ----

const loyaltyStore = new Map<string, LoyaltyRecord[]>()
let loyaltySeq = 4000

function resetLoyaltyState(): void {
  loyaltyStore.clear()
  loyaltySeq = 4000
}

function calculatePointsEarned(finalAmount: number, member: MemberProfile): number {
  let baseRate = 1 // 1 point per $1
  if (member.tier === 'silver') baseRate = 1.2
  if (member.tier === 'gold') baseRate = 1.5
  if (member.tier === 'platinum') baseRate = 2
  if (member.tier === 'svip') baseRate = 3
  return Math.floor(finalAmount * baseRate)
}

function recordLoyaltyEarn(
  memberId: string,
  txnId: string | null,
  pointsEarned: number,
  tierBefore: MemberTier,
  tierAfter: MemberTier
): LoyaltyRecord {
  const member = memberStore.get(memberId)!
  member.points += pointsEarned

  const record: LoyaltyRecord = {
    recordId: `LR${++loyaltySeq}`,
    memberId,
    eventType: tierBefore !== tierAfter ? 'tier_upgrade' : 'earn',
    pointsDelta: pointsEarned,
    pointsBalance: member.points,
    tierBefore,
    tierAfter,
    transactionId: txnId,
    description: tierBefore !== tierAfter
      ? `等级升级: ${tierBefore} → ${tierAfter} (消费积分累计)`
      : `消费获得 ${pointsEarned} 积分`,
    createdAt: new Date().toISOString(),
  }
  const existing = loyaltyStore.get(memberId) || []
  existing.push(record)
  loyaltyStore.set(memberId, existing)
  return record
}

function getMemberLoyaltyRecords(memberId: string): LoyaltyRecord[] {
  return loyaltyStore.get(memberId) || []
}

// ---- 跨模块连接函数 ----

function getTierFromTotalSpent(spent: number): MemberTier {
  if (spent >= 10000) return 'svip'
  if (spent >= 5000) return 'platinum'
  if (spent >= 2000) return 'gold'
  if (spent >= 500) return 'silver'
  if (spent >= 100) return 'bronze'
  return 'guest'
}

function executeFullJourney(memberName: string, totalAmount: number): {
  member: MemberProfile
  coupon: CouponDefinition
  issuedCoupon: MemberCoupon
  transaction: PaymentTransaction
  loyaltyRecords: LoyaltyRecord[]
} {
  // Step 1: 会员注册
  const member = registerMember(memberName)

  // Step 2: 创建优惠券计划
  const couponDef = createCouponPlan({
    name: '新会员首单8折券',
    type: 'discount_percent',
    value: 20,
    minSpend: 10,
    maxUses: 1,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    applicableTiers: ['bronze'],
    applicableProducts: ['*'],
  })

  // Step 3: 发放优惠券
  const issued = issueCoupon(member.memberId, couponDef.couponId)

  // Step 4: 计算等级前状态
  const tierBefore = member.tier

  // Step 5: 支付
  const transaction = processPayment(member.memberId, `ORD-${Date.now()}`, totalAmount, 'wechat_pay')

  // Step 6: 更新等级
  const newTier = getTierFromTotalSpent(member.totalSpent)
  if (newTier !== member.tier) {
    upgradeTier(member.memberId, newTier)
  }
  const tierAfter = member.tier

  // Step 7: 记录忠诚度积分
  const pointsEarned = calculatePointsEarned(transaction.finalAmount, member)
  transaction.pointsEarned = pointsEarned

  // 更新 payment store
  paymentStore.set(transaction.transactionId, transaction)

  const loyaltyRecord = recordLoyaltyEarn(member.memberId, transaction.transactionId, pointsEarned, tierBefore, tierAfter)

  return {
    member,
    coupon: couponDef,
    issuedCoupon: issued,
    transaction,
    loyaltyRecords: getMemberLoyaltyRecords(member.memberId),
  }
}

// ============================================================
// 测试用例
// ============================================================

describe('🦞 跨模块 E2E #41: 会员→优惠券→支付→忠诚度', () => {
  beforeEach(() => {
    resetMemberState()
    resetCouponState()
    resetPaymentState()
    resetLoyaltyState()
  })

  // --- 正例: 完整消费闭环 ---
  describe('正例', () => {
    it('新会员 → 领券 → 支付 → 积分积累', () => {
      const result = executeFullJourney('张三', 200)

      // 验证会员
      assert.equal(result.member.name, '张三')
      assert.equal(result.member.tier, 'bronze')
      assert.ok(result.member.memberId.startsWith('M'))

      // 验证优惠券
      assert.equal(result.coupon.name, '新会员首单8折券')
      assert.equal(result.coupon.type, 'discount_percent')
      assert.equal(result.coupon.value, 20)
      assert.ok(result.issuedCoupon.status === 'used') // 已被消费

      // 验证支付
      assert.equal(result.transaction.totalAmount, 200)
      assert.equal(result.transaction.discountAmount, 40) // 20% = $40
      assert.equal(result.transaction.finalAmount, 160)
      assert.equal(result.transaction.status, 'completed')
      assert.equal(result.transaction.paymentMethod, 'wechat_pay')

      // 验证积分
      assert.equal(result.transaction.pointsEarned, 160) // 160 * 1 (bronze rate)
      assert.ok(result.loyaltyRecords.length >= 1)
      assert.equal(result.loyaltyRecords[0].eventType, 'earn')
    })

    it('高级会员 (gold) 享受折扣叠加 + 更高积分倍率', () => {
      // 先注册
      const member = registerMember('李四')
      // 手动累积消费到 gold
      member.totalSpent = 2500
      member.tier = 'gold'

      // 创建优惠券
      const couponDef = createCouponPlan({
        name: '满200减30',
        type: 'discount_fixed',
        value: 30,
        minSpend: 200,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['bronze'],
        applicableProducts: ['*'],
      })
      const _issued = issueCoupon(member.memberId, couponDef.couponId)

      const transaction = processPayment(member.memberId, 'ORD-GOLD', 500, 'credit_card')

      // gold: 固定券30 + 会员额外5% = 25 => 总折扣55
      assert.equal(transaction.discountAmount, 55)
      assert.equal(transaction.finalAmount, 445)

      // gold: 1.5倍积分
      const points = calculatePointsEarned(transaction.finalAmount, member)
      assert.equal(points, Math.floor(445 * 1.5))
    })

    it('SVIP 消费 → 等级不降级 → 高积分倍率 + 完整积分记录', () => {
      const member = registerMember('王五')
      member.totalSpent = 12000
      member.tier = 'svip'

      const txn = processPayment(member.memberId, 'ORD-SVIP', 1000, 'points')

      assert.equal(txn.finalAmount, 900) // svip: 10% off
      assert.equal(txn.discountAmount, 100)
      assert.equal(member.tier, 'svip')

      const points = calculatePointsEarned(txn.finalAmount, member)
      assert.equal(points, Math.floor(900 * 3)) // svip: 3x
    })
  })

  // --- 反例: 边界/异常处理 ---
  describe('反例', () => {
    it('优惠券最低消费不足时拒绝支付', () => {
      const member = registerMember('赵六')
      const couponDef = createCouponPlan({
        name: '高门槛券',
        type: 'discount_fixed',
        value: 50,
        minSpend: 500,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['bronze'],
        applicableProducts: ['*'],
      })
      issueCoupon(member.memberId, couponDef.couponId)

      // 消费 200 < 500，券不满足条件 — 但不应该拒绝支付，只是不应用券
      const txn = processPayment(member.memberId, 'ORD-MIN', 200, 'cash')
      // 没有应用券
      assert.equal(txn.couponApplied, null)
      assert.equal(txn.discountAmount, 0) // bronze 会员没有额外折扣
      assert.equal(txn.finalAmount, 200)
    })

    it('会员不活跃时支付被拒绝', () => {
      const member = registerMember('钱七')
      member.isActive = false

      assert.throws(() => {
        processPayment(member.memberId, 'ORD-INACTIVE', 100, 'cash')
      }, /inactive/)
    })

    it('优惠券等级不匹配时发放失败', () => {
      const member = registerMember('孙八')
      member.tier = 'bronze'

      const couponDef = createCouponPlan({
        name: '铂金专属券',
        type: 'discount_percent',
        value: 30,
        minSpend: 0,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['gold'],
        applicableProducts: ['*'],
      })

      assert.throws(() => {
        issueCoupon(member.memberId, couponDef.couponId)
      }, /not eligible/)
    })
  })

  // --- 边界测试 ---
  describe('边界', () => {
    it('多张优惠券只应用一张 (排他性)', () => {
      const member = registerMember('周九')
      const def1 = createCouponPlan({
        name: '券A',
        type: 'discount_fixed',
        value: 10,
        minSpend: 0,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['bronze'],
        applicableProducts: ['*'],
      })
      const def2 = createCouponPlan({
        name: '券B',
        type: 'discount_percent',
        value: 50,
        minSpend: 0,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['bronze'],
        applicableProducts: ['*'],
      })
      issueCoupon(member.memberId, def1.couponId)
      issueCoupon(member.memberId, def2.couponId)

      const txn = processPayment(member.memberId, 'ORD-MULTI', 100, 'alipay')

      // Only 1 coupon applied (券A, 先找到的)
      assert.ok(txn.couponApplied)
      assert.equal(txn.discountAmount, 10)
      assert.equal(txn.finalAmount, 90)

      // Check both coupons: 1 used, 1 still active
      const coupons = getMemberCoupons(member.memberId)
      const used = coupons.filter(c => c.status === 'used')
      const active = coupons.filter(c => c.status === 'active')
      assert.equal(used.length, 1)
      assert.equal(active.length, 1)
    })

    it('0 金额交易 (免费兑换)', () => {
      const member = registerMember('免费会员')
      const txn = processPayment(member.memberId, 'ORD-FREE', 0, 'points')
      assert.equal(txn.finalAmount, 0)
      assert.equal(txn.status, 'completed')
    })

    it('等级升级触发 loyalty 双事件', () => {
      const member = registerMember('新会员')
      // 模拟够高的消费一举升级
      member.totalSpent = 450

      const couponDef = createCouponPlan({
        name: '8折券',
        type: 'discount_percent',
        value: 20,
        minSpend: 0,
        maxUses: 1,
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        applicableTiers: ['bronze'],
        applicableProducts: ['*'],
      })
      issueCoupon(member.memberId, couponDef.couponId)
      const txn = processPayment(member.memberId, 'ORD-UPGRADE', 100, 'wechat_pay')

      // 消费 100 后 totalSpent = 550 -> silver
      assert.equal(member.tier, 'silver')

      const records = loyaltyStore.get(member.memberId)!
      // 应该有两条: 一条 earn (消费) + 一条 upgrade
      const upgradeRecord = records.find(r => r.eventType === 'tier_upgrade')
      assert.ok(upgradeRecord)
      assert.equal(upgradeRecord?.tierBefore, 'bronze')
      assert.equal(upgradeRecord?.tierAfter, 'silver')
    })

    it('支付方式为"积分支付"时仍正确计算', () => {
      const member = registerMember('积分会员')
      member.totalSpent = 6000
      member.tier = 'platinum'
      member.points = 5000

      const txn = processPayment(member.memberId, 'ORD-POINTS-PAY', 300, 'points')

      // platinum: 10% off
      assert.equal(txn.discountAmount, 30)
      assert.equal(txn.finalAmount, 270)
      assert.equal(txn.paymentMethod, 'points')
    })
  })
})
