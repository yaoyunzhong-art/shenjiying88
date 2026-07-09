/**
 * 🐜 自动: [license-renewal] [A] contract 补全
 *
 * License Renewal：跨模块合约类型
 * 定义 license-renewal 模块对外暴露的稳定合约接口，
 * 供其它模块（license, notification, saas-billing 等）消费。
 */
import type {
  RenewalRecordResponseDto,
  NotificationResponseDto,
  RenewalStatsResponseDto,
} from './license-renewal.dto'

// ─── 枚举常量 ──────────────────────────────────────────────────────────

export type RenewalStatus = 'pending' | 'success' | 'failed'
export type RenewalNotificationType = 'reminder' | 'success' | 'failure'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * 续费记录合约（跨模块安全子集）
 */
export interface RenewalRecordContract {
  id: string
  licenseId: string
  tenantId: string
  price: number
  status: RenewalStatus
  createdAt: string
  paidAt?: string
  errorMessage?: string
}

/**
 * 续费通知合约（跨模块安全子集）
 */
export interface RenewalNotificationContract {
  id: string
  licenseId: string
  type: RenewalNotificationType
  sentAt: string
  reminderDays?: number
}

/**
 * 续费统计合约（跨模块安全子集）
 */
export interface RenewalStatsContract {
  totalRenewals: number
  successCount: number
  failedCount: number
  pendingCount: number
  successRate: number
  totalRevenue: number
}

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整响应 DTO 创建合约子集
 */
export function toRenewalRecordContract(full: RenewalRecordResponseDto): RenewalRecordContract {
  return {
    id: full.id,
    licenseId: full.licenseId,
    tenantId: full.tenantId,
    price: full.price,
    status: full.status as RenewalStatus,
    createdAt: full.createdAt,
    paidAt: full.paidAt,
    errorMessage: full.errorMessage,
  }
}

/**
 * 从完整通知 DTO 创建合约子集
 */
export function toRenewalNotificationContract(
  full: NotificationResponseDto,
): RenewalNotificationContract {
  return {
    id: full.id,
    licenseId: full.licenseId,
    type: full.type as RenewalNotificationType,
    sentAt: full.sentAt,
    reminderDays: full.reminderDays,
  }
}

/**
 * 从完整统计 DTO 创建合约子集
 */
export function toRenewalStatsContract(full: RenewalStatsResponseDto): RenewalStatsContract {
  return {
    totalRenewals: full.totalRenewals,
    successCount: full.successCount,
    failedCount: full.failedCount,
    pendingCount: full.pendingCount,
    successRate: full.successRate,
    totalRevenue: full.totalRevenue,
  }
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type { RenewalRecordResponseDto, NotificationResponseDto, RenewalStatsResponseDto }
