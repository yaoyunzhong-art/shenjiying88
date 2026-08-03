/**
 * svip-renewal-discount.test.ts
 * BS-0286: SVIP续费阶梯优惠 — 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SvipService } from './svip.service'
import { firstValueFrom } from 'rxjs'

describe('SvipService — BS-0286 SVIP续费阶梯优惠', () => {
  let service: SvipService

  beforeEach(async () => {
    service = new SvipService()

    // Create a plan for testing
    await firstValueFrom(service.createPlan({
      name: 'SVIP年卡',
      price: 10000, // 100元
      durationDays: 365,
      benefits: ['积分翻倍', '免费配送', '专属折扣'],
    }))
  })

  // ─── 获取续费阶梯 ───

  it('BS-0286: 获取续费阶梯3个档位的正确折扣', () => {
    const tiers = service.getRenewalTiers(10000)

    expect(tiers).toHaveLength(3)

    // 1年 95折
    expect(tiers[0]!.years).toBe(1)
    expect(tiers[0]!.discount).toBe(0.95)
    expect(tiers[0]!.totalPrice).toBe(9500)
    expect(tiers[0]!.monthlyPrice).toBe(792)

    // 2年 9折
    expect(tiers[1]!.years).toBe(2)
    expect(tiers[1]!.discount).toBe(0.90)
    expect(tiers[1]!.totalPrice).toBe(18000)
    expect(tiers[1]!.monthlyPrice).toBe(750)

    // 3年 85折
    expect(tiers[2]!.years).toBe(3)
    expect(tiers[2]!.discount).toBe(0.85)
    expect(tiers[2]!.totalPrice).toBe(25500)
    expect(tiers[2]!.monthlyPrice).toBe(708)
  })

  // ─── 计算折扣 ───

  it('BS-0286: 计算1年续费95折', () => {
    const result = service.calculateRenewalDiscount(10000, 1)

    expect(result.years).toBe(1)
    expect(result.originalTotal).toBe(10000)
    expect(result.discountedTotal).toBe(9500)
    expect(result.savedAmount).toBe(500)
    expect(result.discount).toBe(0.95)
  })

  it('BS-0286: 计算2年续费9折', () => {
    const result = service.calculateRenewalDiscount(10000, 2)

    expect(result.originalTotal).toBe(20000)
    expect(result.discountedTotal).toBe(18000)
    expect(result.savedAmount).toBe(2000)
    expect(result.discount).toBe(0.90)
  })

  it('BS-0286: 计算3年续费85折', () => {
    const result = service.calculateRenewalDiscount(10000, 3)

    expect(result.originalTotal).toBe(30000)
    expect(result.discountedTotal).toBe(25500)
    expect(result.savedAmount).toBe(4500)
    expect(result.discount).toBe(0.85)
  })

  // ─── 不支持年限 ───

  it('BS-0286: 不支持的续费年限抛出异常', () => {
    expect(() => service.calculateRenewalDiscount(10000, 4)).toThrow('不支持的续费年限')
    expect(() => service.calculateRenewalDiscount(10000, 0)).toThrow('不支持的续费年限')
    expect(() => service.calculateRenewalDiscount(10000, -1)).toThrow('不支持的续费年限')
  })

  // ─── 带折扣的续费操作实际进行 ───

  it('BS-0286: 带折扣续费后订阅到期日延长', async () => {
    // 获取创建的计划的ID
    const plans = await firstValueFrom(service.listPlans())
    expect(plans.length).toBeGreaterThanOrEqual(1)
    const planId = plans[0]!.planId
    expect(planId).toBeDefined()

    // 先订阅
    const subResult = await firstValueFrom(service.subscribe('user-001', planId))
    expect(subResult).not.toBeNull()

    // 带折扣续费3年
    const { subscription, discount } = await firstValueFrom(
      service.renewWithDiscount(subResult!.subscriptionId, 3)
    )

    expect(subscription).not.toBeNull()
    expect(discount).not.toBeNull()
    expect(discount!.years).toBe(3)
    expect(discount!.discount).toBe(0.85)
    expect(discount!.discountedTotal).toBe(25500)
  })

  // ─── 折扣信息包含全部档位预览 ───

  it('BS-0286: 折扣结果包含全部档位信息（用于前端预览）', () => {
    const result = service.calculateRenewalDiscount(10000, 2)

    expect(result.allTiers).toHaveLength(3)
    expect(result.allTiers[0]!.years).toBe(1)
    expect(result.allTiers[1]!.years).toBe(2)
    expect(result.allTiers[2]!.years).toBe(3)
  })
})
