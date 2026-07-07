/**
 * CommercialBilling 商业化计费抽象 (P3-4.1)
 *
 * 业务背景:
 *   - 多租户 SaaS 调用方按"调用次数 / 数据量"付费
 *   - 阶梯定价 + 包月套餐 + 超额阻断 + 计费墙
 *   - 商业化阶段必须能:
 *       1) 精确计量每个租户每次调用
 *       2) 按规则计算费用
 *       3) 月底出账单
 *       4) 调用前先查余额/额度 (计费墙)
 *
 * 设计:
 *   - 三个 Port: BillingMeter (计量) / PricingEngine (计价) / BillingService (出账)
 *   - 第四个 Port: BillingWall (计费墙, 业务侧调用)
 *   - 内存实现 (P3-4.2), 后续可替换 Prisma/MySQL
 *
 * 集成:
 *   - cashier / payment / lyt 等模块在关键路径调 BillingWall.check()
 *   - 超额返回 BILLING_QUOTA_EXCEEDED, 业务方自行处理 (拒收/降级)
 *   - 月底 cron 调 BillingService.settle(tenantId, period)
 */

/** 计量事件 (调用方上报) */
export interface UsageEvent {
  /** 租户 */
  tenantId: string
  /** 调用方 (一般 = tenantId, 也可细分到子账号) */
  callerId?: string
  /** 计量项 (如: payment.wechat / order.sync / member.query) */
  metric: string
  /** 数量 (默认 1) */
  quantity: number
  /** 时间 ms */
  at: number
  /** 业务扩展字段 */
  extra?: Record<string, unknown>
}

/** 周期 (YYYY-MM) */
export type BillingPeriod = string

/** 计量聚合 (某租户某周期某 metric) */
export interface UsageAggregate {
  tenantId: string
  metric: string
  period: BillingPeriod
  /** 累计数量 */
  totalQuantity: number
  /** 事件数 */
  eventCount: number
  /** 首次/末次时间 */
  firstAt: number
  lastAt: number
}

/** 套餐类型 */
export type PricingPlanType = 'FREE' | 'FLAT' | 'PER_UNIT' | 'TIERED'

/** 单档定价 (PER_UNIT 模式只有 1 档, TIERED 模式有多档) */
export interface PricingTier {
  /** 上限 (本档包含到该值) */
  upTo: number
  /** 单价 (元/单位) */
  unitPrice: number
  /** 固定费用 (仅本档第一段计算一次) */
  flatFee?: number
}

/** 套餐 */
export interface PricingPlan {
  id: string
  name: string
  type: PricingPlanType
  /** 包含额度 (TIERED 模式下, 第一个 tier 之前的免费额度) */
  includedQuota?: number
  /** 档位 (PER_UNIT: 1 档; TIERED: 多档; FLAT: 不用) */
  tiers: PricingTier[]
  /** FLAT 模式: 固定月费 */
  flatAmount?: number
  /** 货币 */
  currency: 'CNY' | 'USD' | 'EUR'
  /** 周期: monthly / yearly / one-time */
  billingCycle: 'monthly' | 'yearly' | 'one-time'
  /** 生效时间 ms */
  effectiveAt: number
  /** 失效时间 ms */
  expiresAt?: number
}

/** 计价输入 */
export interface PricingQuery {
  plan: PricingPlan
  metric: string
  /** 本期已用数量 (用于 TIERED 计算本档) */
  currentUsage: number
  /** 本次新增数量 */
  delta: number
}

/** 计价结果 */
export interface PricingResult {
  /** 本次费用 (元) */
  amount: number
  /** 命中档位索引 (TIERED) */
  tierIndex?: number
  /** 计价明细 (调试/账单) */
  breakdown: string
  /** 货币 */
  currency: string
}

/** 账单项 */
export interface BillLine {
  metric: string
  /** 用量 */
  quantity: number
  /** 单价 (元) */
  unitPrice: number
  /** 金额 */
  amount: number
  /** 备注 */
  remark?: string
}

/** 账单 */
export interface Bill {
  id: string
  tenantId: string
  period: BillingPeriod
  /** 套餐 */
  planId: string
  /** 账单项 */
  lines: BillLine[]
  /** 总额 */
  totalAmount: number
  currency: string
  /** 状态 */
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  /** 出账时间 */
  issuedAt?: number
  /** 缴费时间 */
  paidAt?: number
  createdAt: number
}

/** 钱包 (预付费 + 余额) */
export interface Wallet {
  tenantId: string
  balance: number
  currency: string
  /** 累计充值 */
  totalRecharged: number
  /** 累计消费 */
  totalConsumed: number
  updatedAt: number
}

/** 计费墙检查结果 */
export interface BillingWallDecision {
  allowed: boolean
  /** 拒绝原因 */
  reason?: 'NO_PLAN' | 'QUOTA_EXCEEDED' | 'INSUFFICIENT_BALANCE' | 'PLAN_EXPIRED'
  /** 剩余额度 (数量) */
  remainingQuota?: number
  /** 本次预计扣费 (元) */
  estimatedCost?: number
  /** 当前余额 (元) */
  balance?: number
  /** 消息 */
  message?: string
}

// ──────────────────────────────────────────────
// Port 定义
// ──────────────────────────────────────────────

/** 计量器 (记录 + 聚合) */
export interface BillingMeter {
  record(event: UsageEvent): void
  recordBatch(events: UsageEvent[]): void
  getUsage(tenantId: string, metric: string, period: BillingPeriod): UsageAggregate
  getAllUsage(tenantId: string, period: BillingPeriod): UsageAggregate[]
  reset(tenantId: string, period?: BillingPeriod): void
  /** 当前周期 YYYY-MM */
  currentPeriod(now?: number): BillingPeriod
}

/** 计价引擎 (按规则计算费用) */
export interface PricingEngine {
  calculate(query: PricingQuery): PricingResult
}

/** 计费服务 (出账 + 钱包 + 计费墙) */
export interface BillingService {
  /** 设置租户套餐 */
  setPlan(tenantId: string, plan: PricingPlan): void
  getPlan(tenantId: string): PricingPlan | null

  /** 钱包操作 */
  recharge(tenantId: string, amount: number, currency?: string): Wallet
  getWallet(tenantId: string): Wallet
  /** 扣减余额 (返回新余额) */
  deduct(tenantId: string, amount: number): number

  /** 出账: 给定 tenant + period 生成账单 */
  settle(tenantId: string, period: BillingPeriod): Bill
  getBill(billId: string): Bill | null
  listBills(tenantId: string): Bill[]

  /** 计费墙 (业务调用前检查) */
  check(tenantId: string, metric: string, quantity?: number): BillingWallDecision
  /** 业务调用后扣费 (与 check 配套使用, 也可单独调) */
  charge(tenantId: string, metric: string, quantity: number, at?: number): PricingResult
}
