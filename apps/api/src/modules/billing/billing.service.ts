/**
 * billing.service.ts - 计费服务
 *
 * 提供费用计算、折扣应用、发票生成、支付状态查询等计费能力。
 * 支持多租户定价、阶梯折扣、Invoice模板化。
 *
 * 功能:
 *   - calculateBill(): 根据用量/套餐计算费用
 *   - applyDiscount(): 应用优惠策略
 *   - generateInvoice(): 生成发票
 *   - getPaymentStatus(): 查询支付状态
 *
 * 树哥后台自动执行: 计费引擎
 */

import { Injectable, Logger } from '@nestjs/common'

// ── 类型 ──

export type PricingTier = 'free' | 'basic' | 'pro' | 'enterprise'
export type Currency = 'CNY' | 'USD' | 'EUR'
export type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  currency: Currency
  discountPercent: number
  subtotal: number
}

export interface BillRequest {
  tenantId: string
  tier: PricingTier
  usage: {
    apiCalls: number
    storageGB: number
    bandwidthGB: number
    seats: number
  }
  billingPeriod: { start: string; end: string }
  currency: Currency
  couponCode?: string
}

export interface BillResult {
  tenantId: string
  tier: PricingTier
  period: { start: string; end: string }
  lineItems: LineItem[]
  subtotal: number
  discountAmount: number
  discountLabel: string
  taxAmount: number
  total: number
  currency: Currency
  calculatedAt: string
}

export interface DiscountPolicy {
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  minAmount?: number
  maxAmount?: number
  applicableTiers?: PricingTier[]
  expiresAt?: string
  maxUses?: number
  currentUses: number
}

export interface Invoice {
  id: string
  tenantId: string
  billId: string
  invoiceNo: string
  status: InvoiceStatus
  billingPeriod: { start: string; end: string }
  lineItems: LineItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  currency: Currency
  issuedAt: string
  paidAt?: string
  dueAt: string
}

export interface PaymentInfo {
  tenantId: string
  invoiceId: string
  paymentId: string
  status: PaymentStatus
  amount: number
  currency: Currency
  method: string
  paidAt?: string
  createdAt: string
  notes?: string
}

// ── 阶梯定价表 ──

const TIER_PRICING: Record<PricingTier, { baseMonthly: number; apiCallPrice: number; storagePrice: number; bandwidthPrice: number; seatPrice: number }> = {
  free: { baseMonthly: 0, apiCallPrice: 0, storagePrice: 0, bandwidthPrice: 0, seatPrice: 0 },
  basic: { baseMonthly: 99, apiCallPrice: 0.001, storagePrice: 0.1, bandwidthPrice: 0.05, seatPrice: 10 },
  pro: { baseMonthly: 499, apiCallPrice: 0.0005, storagePrice: 0.08, bandwidthPrice: 0.03, seatPrice: 8 },
  enterprise: { baseMonthly: 2999, apiCallPrice: 0.0002, storagePrice: 0.05, bandwidthPrice: 0.02, seatPrice: 5 },
}

// ── 默认折扣策略 ──

const DEFAULT_DISCOUNTS: DiscountPolicy[] = [
  {
    code: 'NEWUSER20',
    name: '新用户20%',
    type: 'percentage',
    value: 20,
    minAmount: 0,
    maxAmount: 500,
    applicableTiers: ['basic', 'pro'],
    maxUses: 1000,
    currentUses: 0,
  },
  {
    code: 'ANNUAL30',
    name: '年付优惠30%',
    type: 'percentage',
    value: 30,
    minAmount: 100,
    maxAmount: 5000,
    maxUses: 5000,
    currentUses: 0,
  },
  {
    code: 'VIP100',
    name: 'VIP固定减免',
    type: 'fixed',
    value: 100,
    minAmount: 200,
    applicableTiers: ['pro', 'enterprise'],
    maxUses: 100,
    currentUses: 0,
  },
]

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private invoices: Invoice[] = []
  private payments: PaymentInfo[] = []
  private discounts: DiscountPolicy[] = [...DEFAULT_DISCOUNTS]
  private invoiceCounter = 0
  private paymentCounter = 0

  /**
   * 计算账单: 根据用量和套餐计算费用
   */
  calculateBill(request: BillRequest): BillResult {
    this.logger.log(`[calculateBill] tenant=${request.tenantId} tier=${request.tier}`)

    const pricing = TIER_PRICING[request.tier] ?? TIER_PRICING.basic
    const { usage } = request

    // 用量计费
    const baseItem: LineItem = {
      id: 'base-monthly',
      description: `基础月费 (${request.tier})`,
      quantity: 1,
      unitPrice: pricing.baseMonthly,
      currency: request.currency,
      discountPercent: 0,
      subtotal: pricing.baseMonthly,
    }

    const apiItem: LineItem = {
      id: 'api-calls',
      description: `API调用 (${usage.apiCalls}次)`,
      quantity: usage.apiCalls,
      unitPrice: pricing.apiCallPrice,
      currency: request.currency,
      discountPercent: 0,
      subtotal: Math.round(usage.apiCalls * pricing.apiCallPrice * 100) / 100,
    }

    const storageItem: LineItem = {
      id: 'storage',
      description: `存储 (${usage.storageGB}GB)`,
      quantity: usage.storageGB,
      unitPrice: pricing.storagePrice,
      currency: request.currency,
      discountPercent: 0,
      subtotal: Math.round(usage.storageGB * pricing.storagePrice * 100) / 100,
    }

    const bandwidthItem: LineItem = {
      id: 'bandwidth',
      description: `带宽 (${usage.bandwidthGB}GB)`,
      quantity: usage.bandwidthGB,
      unitPrice: pricing.bandwidthPrice,
      currency: request.currency,
      discountPercent: 0,
      subtotal: Math.round(usage.bandwidthGB * pricing.bandwidthPrice * 100) / 100,
    }

    const seatItem: LineItem = {
      id: 'seats',
      description: `坐席 (${usage.seats}个)`,
      quantity: usage.seats,
      unitPrice: pricing.seatPrice,
      currency: request.currency,
      discountPercent: 0,
      subtotal: Math.round(usage.seats * pricing.seatPrice * 100) / 100,
    }

    const lineItems = [baseItem, apiItem, storageItem, bandwidthItem, seatItem]
    const subtotal = Math.round(lineItems.reduce((s, item) => s + item.subtotal, 0) * 100) / 100

    // 折扣计算
    const { amount: discountAmount, label: discountLabel } = this.applyDiscount(subtotal, request.couponCode, request.tier)

    // 税费 (简单13% VAT)
    const taxRate = 0.13
    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100

    this.logger.log(`[calculateBill] subtotal=${subtotal} discount=${discountAmount} tax=${taxAmount} total=${total}`)

    return {
      tenantId: request.tenantId,
      tier: request.tier,
      period: { ...request.billingPeriod },
      lineItems,
      subtotal,
      discountAmount,
      discountLabel,
      taxAmount,
      total,
      currency: request.currency,
      calculatedAt: new Date().toISOString(),
    }
  }

  /**
   * 应用折扣: 查找并计算折扣
   */
  applyDiscount(amount: number, couponCode?: string, tier?: PricingTier): { amount: number; label: string } {
    if (!couponCode) {
      // 阶梯折扣: 按用量自动
      if (amount >= 10000) return { amount: Math.round(amount * 0.15 * 100) / 100, label: '企业批量折扣(15%)' }
      if (amount >= 5000) return { amount: Math.round(amount * 0.10 * 100) / 100, label: '大客户折扣(10%)' }
      if (amount >= 1000) return { amount: Math.round(amount * 0.05 * 100) / 100, label: '批量折扣(5%)' }
      return { amount: 0, label: '无折扣' }
    }

    const policy = this.discounts.find(d => d.code === couponCode)
    if (!policy) {
      this.logger.warn(`[applyDiscount] 优惠码不存在: ${couponCode}`)
      return { amount: 0, label: '无效优惠码' }
    }

    // 检查层级限制
    if (tier && policy.applicableTiers && !policy.applicableTiers.includes(tier)) {
      this.logger.warn(`[applyDiscount] 优惠码 ${couponCode} 不适用于 ${tier} 层级`)
      return { amount: 0, label: '不适用当前套餐' }
    }

    // 检查最低金额
    if (policy.minAmount && amount < policy.minAmount) {
      return { amount: 0, label: `未达最低消费 ${policy.minAmount}` }
    }

    // 检查使用次数
    if (policy.maxUses && policy.currentUses >= policy.maxUses) {
      return { amount: 0, label: '优惠码已达使用上限' }
    }

    // 检查过期
    if (policy.expiresAt && new Date(policy.expiresAt) < new Date()) {
      return { amount: 0, label: '优惠码已过期' }
    }

    let discountAmount: number
    if (policy.type === 'percentage') {
      discountAmount = Math.round(amount * (policy.value / 100) * 100) / 100
    } else {
      discountAmount = policy.value
    }

    // 封顶
    if (policy.maxAmount && discountAmount > policy.maxAmount) {
      discountAmount = policy.maxAmount
    }

    policy.currentUses++
    this.logger.log(`[applyDiscount] ${policy.name}: ${discountAmount} (${policy.code})`)

    return { amount: discountAmount, label: policy.name }
  }

  /**
   * 生成发票
   */
  generateInvoice(bill: BillResult): Invoice {
    this.invoiceCounter++
    const inv: Invoice = {
      id: `inv_${String(this.invoiceCounter).padStart(6, '0')}`,
      tenantId: bill.tenantId,
      billId: `bill_${Date.now()}`,
      invoiceNo: `INV-${new Date().getFullYear()}-${String(this.invoiceCounter).padStart(6, '0')}`,
      status: 'draft',
      billingPeriod: bill.period,
      lineItems: bill.lineItems,
      subtotal: bill.subtotal,
      discountAmount: bill.discountAmount,
      taxAmount: bill.taxAmount,
      totalAmount: bill.total,
      currency: bill.currency,
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    this.invoices.push(inv)
    this.logger.log(`[generateInvoice] ${inv.invoiceNo} total=${inv.totalAmount} ${inv.currency}`)
    return inv
  }

  /**
   * 获取支付状态
   */
  getPaymentStatus(invoiceId: string): PaymentInfo | null {
    // 先查 payments
    const payment = this.payments.find(p => p.invoiceId === invoiceId)
    if (payment) return payment

    // 再查 invoice
    const inv = this.invoices.find(i => i.id === invoiceId)
    if (!inv) {
      this.logger.warn(`[getPaymentStatus] 发票不存在: ${invoiceId}`)
      return null
    }

    return null
  }

  /**
   * 支付发票
   */
  payInvoice(invoiceId: string, method: string): PaymentInfo {
    const inv = this.invoices.find(i => i.id === invoiceId)
    if (!inv) {
      throw new Error(`发票不存在: ${invoiceId}`)
    }

    this.paymentCounter++
    const payment: PaymentInfo = {
      tenantId: inv.tenantId,
      invoiceId,
      paymentId: `pay_${String(this.paymentCounter).padStart(6, '0')}`,
      status: 'paid',
      amount: inv.totalAmount,
      currency: inv.currency,
      method,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    inv.status = 'paid'
    inv.paidAt = payment.paidAt
    this.payments.push(payment)

    this.logger.log(`[payInvoice] ${invoiceId} ${method} ${payment.amount}${inv.currency}`)
    return payment
  }

  /**
   * 列出所有发票
   */
  listInvoices(tenantId: string): Invoice[] {
    return this.invoices.filter(i => i.tenantId === tenantId)
  }

  /**
   * 列出所有折扣策略
   */
  listDiscountPolicies(): DiscountPolicy[] {
    return [...this.discounts]
  }

  /**
   * 获取计费统计
   */
  getBillingStats(): {
    totalInvoiced: number
    totalCollected: number
    pendingAmount: number
    invoiceCount: number
  } {
    const totalInvoiced = this.invoices.reduce((s, i) => s + i.totalAmount, 0)
    const totalCollected = this.payments.reduce((s, p) => s + p.amount, 0)
    const pendingAmount = totalInvoiced - totalCollected

    return {
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      invoiceCount: this.invoices.length,
    }
  }
}
