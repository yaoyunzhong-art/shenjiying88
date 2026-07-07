/**
 * tenant-lifecycle.entity.ts — Phase-15 task 4
 *
 * Tenant 生命周期状态机:
 *   - Active: 正常运营
 *   - Suspended: 暂停 (欠费/违规/超限),仍可读不能写
 *   - Deleted: 已删除 (软删,保留审计数据)
 *
 * 状态转换规则:
 *   - Active -> Suspended (admin 操作)
 *   - Suspended -> Active (admin 恢复)
 *   - Active -> Deleted (admin 软删)
 *   - Suspended -> Deleted (admin 软删)
 *   - Deleted -> (终态)
 *
 * 可操作性:
 *   - isOperational() = Active
 *   - canRead() = Active | Suspended
 *   - canWrite() = Active only
 */

/**
 * Tenant 生命周期状态
 */
export enum TenantLifecycleStatus {
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Deleted = 'DELETED'
}

/**
 * 状态转换原因
 */
export enum TenantStatusReason {
  Created = 'CREATED',
  AdminSuspend = 'ADMIN_SUSPEND',
  AdminReactivate = 'ADMIN_REACTIVATE',
  QuotaExceeded = 'QUOTA_EXCEEDED',
  BillingOverdue = 'BILLING_OVERDUE',
  PolicyViolation = 'POLICY_VIOLATION',
  AdminDelete = 'ADMIN_DELETE',
  UserRequest = 'USER_REQUEST'
}

/**
 * 状态转换记录
 */
export interface TenantStatusTransition {
  from: TenantLifecycleStatus
  to: TenantLifecycleStatus
  reason: TenantStatusReason
  actorId?: string
  occurredAt: string
  note?: string
}

/**
 * Tenant lifecycle 元数据 (扩展 TenantRecord)
 */
export interface TenantLifecycleRecord {
  tenantId: string
  status: TenantLifecycleStatus
  statusReason: TenantStatusReason
  statusChangedAt: string
  /** 最近 N 条状态转换历史 (倒序,最新在前) */
  history: TenantStatusTransition[]
  /** 删除时填入,审计保留 */
  deletedAt?: string
  deletedBy?: string
}

/**
 * 状态转换矩阵 (from -> Set<to>)
 */
const TRANSITIONS: Record<TenantLifecycleStatus, ReadonlySet<TenantLifecycleStatus>> = {
  [TenantLifecycleStatus.Active]: new Set([TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Deleted]),
  [TenantLifecycleStatus.Suspended]: new Set([TenantLifecycleStatus.Active, TenantLifecycleStatus.Deleted]),
  [TenantLifecycleStatus.Deleted]: new Set() // 终态
}

/**
 * 是否允许的状态转换
 */
export function isValidTransition(
  from: TenantLifecycleStatus,
  to: TenantLifecycleStatus
): boolean {
  if (from === to) return false // 同状态不算转换
  return TRANSITIONS[from].has(to)
}

/**
 * 当前状态可操作性
 */
export function canRead(status: TenantLifecycleStatus): boolean {
  return status === TenantLifecycleStatus.Active || status === TenantLifecycleStatus.Suspended
}

export function canWrite(status: TenantLifecycleStatus): boolean {
  return status === TenantLifecycleStatus.Active
}

export function isOperational(status: TenantLifecycleStatus): boolean {
  return status === TenantLifecycleStatus.Active
}

/**
 * 创建初始 lifecycle (Active)
 */
export function createInitialLifecycle(tenantId: string): TenantLifecycleRecord {
  const now = new Date().toISOString()
  return {
    tenantId,
    status: TenantLifecycleStatus.Active,
    statusReason: TenantStatusReason.Created,
    statusChangedAt: now,
    history: [
      {
        from: TenantLifecycleStatus.Active,
        to: TenantLifecycleStatus.Active,
        reason: TenantStatusReason.Created,
        occurredAt: now,
        note: 'Tenant created'
      }
    ]
  }
}

/**
 * 应用状态转换,返回新 lifecycle (不可变更新)
 *
 * @throws InvalidTransitionError 当 from->to 不在合法转换矩阵
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: TenantLifecycleStatus,
    public readonly to: TenantLifecycleStatus
  ) {
    super(`Invalid tenant status transition: ${from} -> ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function applyTransition(
  current: TenantLifecycleRecord,
  to: TenantLifecycleStatus,
  reason: TenantStatusReason,
  options: { actorId?: string; note?: string } = {}
): TenantLifecycleRecord {
  if (!isValidTransition(current.status, to)) {
    throw new InvalidTransitionError(current.status, to)
  }
  const now = new Date().toISOString()
  const transition: TenantStatusTransition = {
    from: current.status,
    to,
    reason,
    actorId: options.actorId,
    occurredAt: now,
    note: options.note
  }
  return {
    tenantId: current.tenantId,
    status: to,
    statusReason: reason,
    statusChangedAt: now,
    history: [transition, ...current.history].slice(0, 50), // 保留最近 50 条
    ...(to === TenantLifecycleStatus.Deleted
      ? { deletedAt: now, deletedBy: options.actorId }
      : {})
  }
}

/**
 * 便捷 helper: suspend / reactivate / softDelete
 */
export function suspendTenant(
  current: TenantLifecycleRecord,
  reason: TenantStatusReason = TenantStatusReason.AdminSuspend,
  actorId?: string,
  note?: string
): TenantLifecycleRecord {
  return applyTransition(current, TenantLifecycleStatus.Suspended, reason, { actorId, note })
}

export function reactivateTenant(
  current: TenantLifecycleRecord,
  actorId?: string,
  note?: string
): TenantLifecycleRecord {
  return applyTransition(current, TenantLifecycleStatus.Active, TenantStatusReason.AdminReactivate, {
    actorId,
    note
  })
}

export function softDeleteTenant(
  current: TenantLifecycleRecord,
  reason: TenantStatusReason = TenantStatusReason.AdminDelete,
  actorId?: string,
  note?: string
): TenantLifecycleRecord {
  return applyTransition(current, TenantLifecycleStatus.Deleted, reason, { actorId, note })
}