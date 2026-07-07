/**
 * SaaS 计费模块 — 实体定义
 *
 * 本文件包含所有与计费、订阅、配额相关的核心类型。
 */

/** 计费周期 */
export type BillingCycle = 'monthly' | 'quarterly' | 'annually'

/** 定价层级 */
export type PricingTier = 'starter' | 'professional' | 'enterprise'

/** 配额类型 */
export type QuotaType = 'api_calls' | 'storage_gb' | 'users' | 'transactions' | 'devices'

/** 订阅状态 */
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled'

/** 发票状态 */
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

/**
 * 定价套餐
 */
export interface PricingPlan {
  planId: string
  tier: PricingTier
  name: string
  basePrice: number
  billingCycles: BillingCycle[]
  features: string[]
  quotas: Record<QuotaType, number>
  overageRates: Record<QuotaType, number>
  discountPercent: Record<BillingCycle, number>
}

/**
 * 租户订阅
 */
export interface TenantSubscription {
  tenantId: string
  planId: string
  tier: PricingTier
  status: SubscriptionStatus
  startedAt: Date
  expiresAt?: Date
  trialEndsAt?: Date
  billingCycle: BillingCycle
  nextBillingDate: Date
  autoRenew: boolean
}

/**
 * 配额使用情况
 */
export interface QuotaUsage {
  tenantId: string
  quota: QuotaType
  used: number
  limit: number
  resetAt: Date
  overage: number
}

/**
 * 发票
 */
export interface Invoice {
  invoiceId: string
  tenantId: string
  amount: number
  currency: string
  status: InvoiceStatus
  items: Array<{ description: string; amount: number }>
  issuedAt: Date
  dueAt: Date
  paidAt?: Date
}

/**
 * 配额检查结果
 */
export interface QuotaCheckResult {
  allowed: boolean
  current: number
  limit: number
  overage: number
}

/**
 * 超额费用明细
 */
export interface OverageDetail {
  api_calls: number
  storage_gb: number
  users: number
  transactions: number
  devices: number
}

/**
 * 试用状态
 */
export interface TrialStatus {
  isTrial: boolean
  daysRemaining: number
  expiresAt: Date
}
