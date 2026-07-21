/**
 * billing.service.test.ts - 计费服务单元测试
 *
 * 原则:
 * - vitest (globals) + node:assert/strict
 * - 正例 + 反例 + 边界（三件套）
 * - test 自包含，无 beforeEach 共享状态之外的副作用
 *
 * 覆盖:
 * - calculateBill: 各套餐定价、用量计费
 * - applyDiscount: 优惠码、阶梯折扣、边界
 * - generateInvoice / payInvoice: 发票与支付流
 * - listInvoices / getBillingStats: 查询与统计
 */

import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { BillingService } from './billing.service'
import type { BillRequest, DiscountPolicy } from './billing.service'

/* ── 测试用 Fixture ───────────────────────────────────── */

function makeBillRequest(overrides: Partial<BillRequest> = {}): BillRequest {
  return {
    tenantId: 'tenant-001',
    tier: 'basic',
    usage: { apiCalls: 1000, storageGB: 10, bandwidthGB: 50, seats: 5 },
    billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    currency: 'CNY',
    ...overrides,
  }
}

/* ── 测试 ──────────────────────────────────────────────── */

describe('BillingService', () => {
  let service: BillingService

  beforeEach(() => {
    service = new BillingService()
  })

  // ─── calculateBill ────────────────────────────────────────

  describe('calculateBill', () => {
    it('计算 basic 套餐, 含基础月费 + API调用 + 存储 + 带宽 + 坐席', () => {
      const req = makeBillRequest()
      const result = service.calculateBill(req)

      assert.equal(result.tenantId, 'tenant-001')
      assert.equal(result.tier, 'basic')
      assert.equal(result.lineItems.length, 5)
      assert.equal(result.currency, 'CNY')

      // basic 月费 99
      const baseItem = result.lineItems.find((l) => l.id === 'base-monthly')
      assert.ok(baseItem)
      assert.equal(baseItem!.subtotal, 99)

      // API 调用 1000 * 0.001 = 1
      const apiItem = result.lineItems.find((l) => l.id === 'api-calls')
      assert.equal(apiItem!.subtotal, 1)

      // subtotal = 99 + 1 + 1 + 2.5 + 50 = 153.5
      assert.equal(result.subtotal, 153.5)
    })

    it('enterprise 套餐基础月费为 2999', () => {
      const req = makeBillRequest({ tier: 'enterprise', usage: { apiCalls: 5000, storageGB: 100, bandwidthGB: 200, seats: 50 } })
      const result = service.calculateBill(req)

      assert.equal(result.tier, 'enterprise')
      const baseItem = result.lineItems.find((l) => l.id === 'base-monthly')
      assert.equal(baseItem!.subtotal, 2999)
    })

    it('free 套餐所有费用为 0', () => {
      const req = makeBillRequest({ tier: 'free' })
      const result = service.calculateBill(req)

      assert.equal(result.subtotal, 0)
      assert.equal(result.total, 0)
      assert.equal(result.discountAmount, 0)
      assert.equal(result.discountLabel, '无折扣')
    })

    it('pro 套餐计算正确', () => {
      const req = makeBillRequest({ tier: 'pro', usage: { apiCalls: 2000, storageGB: 50, bandwidthGB: 100, seats: 10 } })
      const result = service.calculateBill(req)

      assert.equal(result.tier, 'pro')
      // 499 + 2000*0.0005=1 + 50*0.08=4 + 100*0.03=3 + 10*8=80 = 587
      assert.equal(result.subtotal, 587)
    })

    it('超过 1000 自动应用批量折扣 5%', () => {
      // pro 套餐把用量拉高到 subtotal > 1000
      const req = makeBillRequest({
        tier: 'pro',
        usage: { apiCalls: 500000, storageGB: 2000, bandwidthGB: 5000, seats: 50 },
      })
      const result = service.calculateBill(req)

      assert.ok(result.discountAmount > 0)
      assert.match(result.discountLabel, /批量折扣/)
    })

    it('超过 5000 自动应用大客户折扣 10%', () => {
      const req = makeBillRequest({
        tier: 'enterprise',
        usage: { apiCalls: 2000000, storageGB: 10000, bandwidthGB: 20000, seats: 200 },
      })
      const result = service.calculateBill(req)

      assert.ok(result.discountAmount > 0)
      assert.match(result.discountLabel, /大客户折扣/)
    })

    it('total = (subtotal - discount) * 1.13', () => {
      const req = makeBillRequest()
      const result = service.calculateBill(req)

      // subtotal 153.5, no coupon -> discount 0
      const expectedTotal = Math.round(153.5 * 1.13 * 100) / 100
      assert.equal(result.total, expectedTotal)
      assert.equal(result.taxAmount, Math.round(153.5 * 0.13 * 100) / 100)
    })
  })

  // ─── applyDiscount ────────────────────────────────────────

  describe('applyDiscount', () => {
    it('无优惠码且金额 < 1000 时无折扣', () => {
      const result = service.applyDiscount(500)
      assert.equal(result.amount, 0)
      assert.equal(result.label, '无折扣')
    })

    it('使用有效百分比优惠码 NEWUSER20', () => {
      const result = service.applyDiscount(200, 'NEWUSER20', 'basic')
      assert.equal(result.amount, 40) // 200 * 20% = 40
      assert.match(result.label, /新用户20%/)
    })

    it('有效优惠码有封顶金额', () => {
      // NEWUSER20 maxAmount=500, 4000*20%=800→封顶500
      const result = service.applyDiscount(4000, 'NEWUSER20', 'pro')
      assert.equal(result.amount, 500)
    })

    it('无效优惠码返回 0 折扣并标记 label', () => {
      const result = service.applyDiscount(200, 'INVALID99')
      assert.equal(result.amount, 0)
      assert.equal(result.label, '无效优惠码')
    })

    it('优惠码不适用当前套餐层级时返回 0', () => {
      // NEWUSER20 只适用 basic/pro, 不适用 free
      const result = service.applyDiscount(200, 'NEWUSER20', 'free')
      assert.equal(result.amount, 0)
      assert.equal(result.label, '不适用当前套餐')
    })

    it('金额未达优惠码最低要求时返回 0', () => {
      // VIP100 minAmount=200
      const result = service.applyDiscount(50, 'VIP100', 'pro')
      assert.equal(result.amount, 0)
      assert.match(result.label, /未达最低消费/)
    })

    it('固定减免优惠码 VIP100 减免 100 元', () => {
      const result = service.applyDiscount(500, 'VIP100', 'pro')
      assert.equal(result.amount, 100)
      assert.equal(result.label, 'VIP固定减免')
    })

    it('ANNUAL30 年付优惠码减免 30%', () => {
      const result = service.applyDiscount(1000, 'ANNUAL30')
      assert.equal(result.amount, 300) // 1000 * 30% = 300
      assert.match(result.label, /年付优惠30%/)
    })
  })

  // ─── generateInvoice ──────────────────────────────────────

  describe('generateInvoice', () => {
    it('基于 BillResult 生成 Invoice, 初始状态为 draft', () => {
      const req = makeBillRequest()
      const bill = service.calculateBill(req)
      const inv = service.generateInvoice(bill)

      assert.match(inv.id, /^inv_/)
      assert.match(inv.invoiceNo, /^INV-/)
      assert.equal(inv.status, 'draft')
      assert.equal(inv.tenantId, 'tenant-001')
      assert.equal(inv.totalAmount, bill.total)
      assert.equal(inv.currency, 'CNY')
      assert.ok(inv.dueAt > inv.issuedAt)
    })

    it('连续生成多张发票编号递增', () => {
      const bill1 = service.calculateBill(makeBillRequest())
      const bill2 = service.calculateBill(makeBillRequest({ tier: 'pro' }))

      const inv1 = service.generateInvoice(bill1)
      const inv2 = service.generateInvoice(bill2)

      assert.ok(inv2.id > inv1.id)
      assert.ok(inv2.invoiceNo > inv1.invoiceNo)
    })
  })

  // ─── payInvoice ────────────────────────────────────────────

  describe('payInvoice', () => {
    it('支付发票后状态变为 paid, 返回 PaymentInfo', () => {
      const bill = service.calculateBill(makeBillRequest())
      const inv = service.generateInvoice(bill)

      const payment = service.payInvoice(inv.id, 'wechat')
      assert.equal(payment.status, 'paid')
      assert.equal(payment.method, 'wechat')
      assert.equal(payment.amount, inv.totalAmount)
      assert.equal(payment.invoiceId, inv.id)
      assert.ok(payment.paidAt)

      // 验证 invoice 状态同步更新
      const updatedInv = service.listInvoices('tenant-001').find((i) => i.id === inv.id)
      assert.equal(updatedInv!.status, 'paid')
    })

    it('支付不存在的发票抛异常', () => {
      assert.throws(
        () => service.payInvoice('non-existent', 'alipay'),
        /发票不存在/,
      )
    })
  })

  // ─── getPaymentStatus ─────────────────────────────────────

  describe('getPaymentStatus', () => {
    it('已支付的发票返回 PaymentInfo', () => {
      const bill = service.calculateBill(makeBillRequest())
      const inv = service.generateInvoice(bill)
      service.payInvoice(inv.id, 'alipay')

      const status = service.getPaymentStatus(inv.id)
      assert.ok(status)
      assert.equal(status!.status, 'paid')
    })

    it('未支付的发票返回 null', () => {
      const bill = service.calculateBill(makeBillRequest())
      const inv = service.generateInvoice(bill)

      const status = service.getPaymentStatus(inv.id)
      assert.equal(status, null)
    })

    it('不存在的发票 ID 返回 null', () => {
      const status = service.getPaymentStatus('no-such-invoice')
      assert.equal(status, null)
    })
  })

  // ─── listInvoices / listDiscountPolicies / getBillingStats ─

  describe('查询方法', () => {
    it('listInvoices 返回该租户的发票列表', () => {
      const bill = service.calculateBill(makeBillRequest())
      service.generateInvoice(bill)

      const list = service.listInvoices('tenant-001')
      assert.equal(list.length, 1)
      assert.equal(list[0]!.tenantId, 'tenant-001')

      // 其他租户列表为空
      const other = service.listInvoices('tenant-999')
      assert.equal(other.length, 0)
    })

    it('listDiscountPolicies 返回所有折扣策略', () => {
      const policies = service.listDiscountPolicies()
      assert.equal(policies.length, 3) // 3 个默认策略

      const codes = policies.map((p) => p.code)
      assert.ok(codes.includes('NEWUSER20'))
      assert.ok(codes.includes('ANNUAL30'))
      assert.ok(codes.includes('VIP100'))
    })

    it('getBillingStats 汇总统计', () => {
      const bill1 = service.calculateBill(makeBillRequest({ tier: 'pro', usage: { apiCalls: 5000, storageGB: 50, bandwidthGB: 100, seats: 10 } }))
      const inv1 = service.generateInvoice(bill1)
      service.payInvoice(inv1.id, 'card')

      const bill2 = service.calculateBill(makeBillRequest())
      service.generateInvoice(bill2)

      const stats = service.getBillingStats()
      assert.equal(stats.invoiceCount, 2)
      assert.ok(stats.totalInvoiced > 0)
      assert.ok(stats.totalCollected > 0)
      assert.ok(stats.pendingAmount >= 0)
    })
  })
})
