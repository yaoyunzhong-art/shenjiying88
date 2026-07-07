/**
 * tenant-lifecycle.service.ts — Phase-15 task 4
 *
 * Tenant 生命周期服务 (运行时管理 lifecycle 状态)
 *
 * 职责:
 *   - 维护 tenantId -> TenantLifecycleRecord 映射
 *   - 提供 suspend / reactivate / softDelete / getStatus 操作
 *   - 与 TenantQuotaService 协同 (suspend 时 quota 仍保留)
 */

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
  applyTransition,
  canRead,
  canWrite,
  createInitialLifecycle,
  isOperational,
  isValidTransition,
  reactivateTenant,
  softDeleteTenant,
  suspendTenant,
  TenantLifecycleRecord,
  TenantLifecycleStatus,
  TenantStatusReason,
  type TenantStatusTransition
} from './tenant-lifecycle.entity'

@Injectable()
export class TenantLifecycleService {
  private readonly store = new Map<string, TenantLifecycleRecord>()

  /**
   * 初始化 tenant lifecycle (首次创建)
   */
  initialize(tenantId: string): TenantLifecycleRecord {
    if (this.store.has(tenantId)) {
      throw new ConflictException(`Tenant ${tenantId} lifecycle already initialized`)
    }
    const lifecycle = createInitialLifecycle(tenantId)
    this.store.set(tenantId, lifecycle)
    return lifecycle
  }

  /**
   * 获取 lifecycle (未初始化返回 undefined)
   */
  getLifecycle(tenantId: string): TenantLifecycleRecord | undefined {
    return this.store.get(tenantId)
  }

  /**
   * 获取 lifecycle (未初始化时自动初始化为 Active)
   */
  getOrInitLifecycle(tenantId: string): TenantLifecycleRecord {
    const existing = this.store.get(tenantId)
    if (existing) return existing
    return this.initialize(tenantId)
  }

  /**
   * 获取当前状态 (未初始化返回 Active 默认)
   */
  getStatus(tenantId: string): TenantLifecycleStatus {
    return this.store.get(tenantId)?.status ?? TenantLifecycleStatus.Active
  }

  /**
   * 暂停 tenant
   */
  suspend(
    tenantId: string,
    reason: TenantStatusReason = TenantStatusReason.AdminSuspend,
    actorId?: string,
    note?: string
  ): TenantLifecycleRecord {
    const current = this.getOrInitLifecycle(tenantId)
    return this.commit(tenantId, suspendTenant(current, reason, actorId, note))
  }

  /**
   * 恢复 tenant
   */
  reactivate(
    tenantId: string,
    actorId?: string,
    note?: string
  ): TenantLifecycleRecord {
    const current = this.getOrInitLifecycle(tenantId)
    return this.commit(tenantId, reactivateTenant(current, actorId, note))
  }

  /**
   * 软删除 tenant
   */
  softDelete(
    tenantId: string,
    reason: TenantStatusReason = TenantStatusReason.AdminDelete,
    actorId?: string,
    note?: string
  ): TenantLifecycleRecord {
    const current = this.getOrInitLifecycle(tenantId)
    return this.commit(tenantId, softDeleteTenant(current, reason, actorId, note))
  }

  /**
   * 应用任意合法状态转换
   */
  applyTransition(
    tenantId: string,
    to: TenantLifecycleStatus,
    reason: TenantStatusReason,
    actorId?: string,
    note?: string
  ): TenantLifecycleRecord {
    const current = this.getOrInitLifecycle(tenantId)
    const next = applyTransition(current, to, reason, { actorId, note })
    return this.commit(tenantId, next)
  }

  /**
   * 是否可操作性检查 (供 service/guard 复用)
   */
  canRead(tenantId: string): boolean {
    return canRead(this.getStatus(tenantId))
  }

  canWrite(tenantId: string): boolean {
    return canWrite(this.getStatus(tenantId))
  }

  isOperational(tenantId: string): boolean {
    return isOperational(this.getStatus(tenantId))
  }

  /**
   * 写操作前置检查 (写时 tenant 必须 Active)
   * @throws ForbiddenException-like error via ConflictException
   */
  assertWriteAllowed(tenantId: string): void {
    if (!this.canWrite(tenantId)) {
      throw new ConflictException(
        `Tenant ${tenantId} is not active (status: ${this.getStatus(tenantId)}), write operations blocked.`
      )
    }
  }

  /**
   * 读操作前置检查
   */
  assertReadAllowed(tenantId: string): void {
    if (!this.canRead(tenantId)) {
      throw new NotFoundException(`Tenant ${tenantId} not found or deleted.`)
    }
  }

  /**
   * 校验状态转换合法性 (无需 apply)
   */
  isValidTransition(from: TenantLifecycleStatus, to: TenantLifecycleStatus): boolean {
    return isValidTransition(from, to)
  }

  /**
   * 获取历史转换记录
   */
  getHistory(tenantId: string): TenantStatusTransition[] {
    return this.store.get(tenantId)?.history ?? []
  }

  /**
   * 列出所有已初始化的 tenant lifecycle
   */
  listLifecycles(): TenantLifecycleRecord[] {
    return Array.from(this.store.values())
  }

  /**
   * 按状态过滤 tenant
   */
  listByStatus(status: TenantLifecycleStatus): TenantLifecycleRecord[] {
    return this.listLifecycles().filter(l => l.status === status)
  }

  /**
   * 测试重置
   */
  resetAll(): void {
    this.store.clear()
  }

  private commit(tenantId: string, next: TenantLifecycleRecord): TenantLifecycleRecord {
    this.store.set(tenantId, next)
    return next
  }
}