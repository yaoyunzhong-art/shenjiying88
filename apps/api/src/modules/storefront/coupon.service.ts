// coupon.service.ts · 优惠券自动匹配引擎
// Phase 2A 交易闭环硬化 · 2026-07-26
//
// 职责:
// - 根据用户等级/消费历史/当前订单 智能匹配最优优惠券
// - 等级加成计算（黄金+5% / 铂金+8% / 钻石+12% / 王者+15% / SVIP+20%）
// - 优惠券使用校验 & 核销记录
//
// 宪法§15.3: AI自动推荐最优券组合（含等级加成）

import { Injectable, BadRequestException, Logger } from '@nestjs/common'

export interface CouponInfo {
  code: string
  name: string
  type: 'fixed' | 'percent' | 'first_time' | 'birthday'
  value: number // 固定金额(分) 或 百分比(如 20 表示 20%)
  minOrderAmount: number // 最低消费金额(分), 0=无门槛
  validUntil: string // YYYY-MM-DD
  isUsed: boolean
}

export interface CouponMatchResult {
  applied: boolean
  couponCode?: string
  couponName?: string
  originalAmount: number
  discountAmount: number
  finalAmount: number
  levelBonus: number // 等级加成金额
  levelBonusRate: number // 等级加成百分比
  availableCoupons: CouponInfo[]
}

// Mock 用户等级 & 优惠券库
const MEMBER_LEVELS: Record<string, { level: string; bonusRate: number }> = {
  '13800001111': { level: '王者', bonusRate: 15 },
  '13800002222': { level: '钻石', bonusRate: 12 },
  '13800003333': { level: '铂金', bonusRate: 8 },
  '13800004444': { level: '黄金', bonusRate: 5 },
  '13800005555': { level: '白银', bonusRate: 0 },
}

const MOCK_COUPONS: CouponInfo[] = [
  { code: 'WELCOME50', name: '新人专享50元券', type: 'fixed', value: 5000, minOrderAmount: 0, validUntil: '2026-12-31', isUsed: false },
  { code: 'VIP20', name: '会员8折券', type: 'percent', value: 20, minOrderAmount: 10000, validUntil: '2026-08-31', isUsed: false },
  { code: 'SUMMER30', name: '暑期30元立减', type: 'fixed', value: 3000, minOrderAmount: 5000, validUntil: '2026-09-01', isUsed: false },
  { code: 'BIRTHDAY', name: '生日专享5折', type: 'percent', value: 50, minOrderAmount: 0, validUntil: '2027-12-31', isUsed: false },
  { code: 'TEAM100', name: '团建100元券', type: 'fixed', value: 10000, minOrderAmount: 20000, validUntil: '2026-12-31', isUsed: false },
]

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name)

  /**
   * 获取用户可用优惠券列表
   */
  getAvailableCoupons(customerPhone: string): CouponInfo[] {
    return MOCK_COUPONS.filter(c => !c.isUsed && new Date(c.validUntil) >= new Date())
  }

  /**
   * 智能匹配最优优惠券
   *
   * 算法:
   * 1. 筛选可用券（未使用 + 未过期 + 满足最低消费）
   * 2. 按节省金额排序取最优
   * 3. 叠等级加成
   */
  matchBestCoupon(customerPhone: string, orderAmount: number): CouponMatchResult {
    const member = MEMBER_LEVELS[customerPhone] ?? { level: '青铜', bonusRate: 0 }
    const available = this.getAvailableCoupons(customerPhone)
      .filter(c => orderAmount >= c.minOrderAmount)

    if (available.length === 0) {
      const bonus = Math.floor(orderAmount * member.bonusRate / 100)
      return {
        applied: false,
        originalAmount: orderAmount,
        discountAmount: 0,
        finalAmount: orderAmount - bonus,
        levelBonus: bonus,
        levelBonusRate: member.bonusRate,
        availableCoupons: [],
      }
    }

    // 节省金额 = fixed 券值 或 percent * orderAmount
    const ranked = available.map(c => ({
      ...c,
      saving: c.type === 'fixed' ? c.value : Math.floor(orderAmount * c.value / 100),
    })).sort((a, b) => b.saving - a.saving)

    const best = ranked[0]
    const discount = Math.min(best.saving, orderAmount) // 不超原价
    const afterCoupon = orderAmount - discount
    const levelBonus = Math.floor(afterCoupon * member.bonusRate / 100)
    const finalAmount = Math.max(0, afterCoupon - levelBonus)

    this.logger.log(
      `[Coupon Match] ${customerPhone}(${member.level}) order=¥${orderAmount / 100} → ${best.code}=${best.name} save=¥${discount / 100} levelBonus=¥${levelBonus / 100} final=¥${finalAmount / 100}`,
    )

    return {
      applied: true,
      couponCode: best.code,
      couponName: best.name,
      originalAmount: orderAmount,
      discountAmount: discount,
      finalAmount,
      levelBonus,
      levelBonusRate: member.bonusRate,
      availableCoupons: ranked.slice(0, 5),
    }
  }

  /**
   * 校验并使用优惠券（原子操作 — mock）
   */
  validateAndUse(code: string, customerPhone: string, orderAmount: number): { valid: boolean; discountAmount: number; message?: string } {
    const coupon = MOCK_COUPONS.find(c => c.code === code)
    if (!coupon) return { valid: false, discountAmount: 0, message: `优惠券 ${code} 不存在` }
    if (coupon.isUsed) return { valid: false, discountAmount: 0, message: '该优惠券已使用' }
    if (new Date(coupon.validUntil) < new Date()) return { valid: false, discountAmount: 0, message: '该优惠券已过期' }
    if (orderAmount < coupon.minOrderAmount) {
      return { valid: false, discountAmount: 0, message: `订单金额未满足最低消费 ¥${coupon.minOrderAmount / 100}` }
    }

    const discount = coupon.type === 'fixed'
      ? coupon.value
      : Math.floor(orderAmount * coupon.value / 100)

    // 标记为已使用
    coupon.isUsed = true

    return { valid: true, discountAmount: Math.min(discount, orderAmount) }
  }
}
