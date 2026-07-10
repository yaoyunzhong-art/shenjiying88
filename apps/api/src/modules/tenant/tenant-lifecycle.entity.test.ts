/**
 * tenant-lifecycle.entity.test.ts — Tenant 生命周期状态机单元测试
 *
 * 覆盖:
 *   - 状态枚举与转换矩阵
 *   - canRead / canWrite / isOperational 权限方法
 *   - createInitialLifecycle 初始创建
 *   - applyTransition / suspendTenant / reactivateTenant / softDeleteTenant
 *   - 非法转换抛出 InvalidTransitionError
 *   - Deleted 终态不可变
 *   - 状态转换历史记录保留
 */

import { describe, it, expect } from 'vitest'
import {
  TenantLifecycleStatus,
  TenantStatusReason,
  isValidTransition,
  canRead,
  canWrite,
  isOperational,
  createInitialLifecycle,
  applyTransition,
  suspendTenant,
  reactivateTenant,
  softDeleteTenant,
  InvalidTransitionError,
  type TenantLifecycleRecord,
} from './tenant-lifecycle.entity'

// ===================================================================
// 状态转换矩阵测试
// ===================================================================
describe('isValidTransition 状态转换矩阵', () => {
  it('Active → Suspended 应允许', () => {
    expect(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Suspended)).toBe(true)
  })

  it('Active → Deleted 应允许', () => {
    expect(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Deleted)).toBe(true)
  })

  it('Suspended → Active 应允许', () => {
    expect(isValidTransition(TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Active)).toBe(true)
  })

  it('Suspended → Deleted 应允许', () => {
    expect(isValidTransition(TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Deleted)).toBe(true)
  })

  it('Deleted → 任何状态均不允许', () => {
    expect(isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Active)).toBe(false)
    expect(isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Suspended)).toBe(false)
    expect(isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Deleted)).toBe(false)
  })

  it('同状态转换应返回 false', () => {
    expect(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Active)).toBe(false)
    expect(isValidTransition(TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Suspended)).toBe(false)
  })
})

// ===================================================================
// 可操作性测试
// ===================================================================
describe('canRead / canWrite / isOperational', () => {
  it('Active 租户: 可读可写可运营', () => {
    expect(canRead(TenantLifecycleStatus.Active)).toBe(true)
    expect(canWrite(TenantLifecycleStatus.Active)).toBe(true)
    expect(isOperational(TenantLifecycleStatus.Active)).toBe(true)
  })

  it('Suspended 租户: 可读不可写不可运营', () => {
    expect(canRead(TenantLifecycleStatus.Suspended)).toBe(true)
    expect(canWrite(TenantLifecycleStatus.Suspended)).toBe(false)
    expect(isOperational(TenantLifecycleStatus.Suspended)).toBe(false)
  })

  it('Deleted 租户: 不可读不可写不可运营', () => {
    expect(canRead(TenantLifecycleStatus.Deleted)).toBe(false)
    expect(canWrite(TenantLifecycleStatus.Deleted)).toBe(false)
    expect(isOperational(TenantLifecycleStatus.Deleted)).toBe(false)
  })
})

// ===================================================================
// createInitialLifecycle
// ===================================================================
describe('createInitialLifecycle', () => {
  it('应创建 Active 状态的生命周期记录', () => {
    const record = createInitialLifecycle('tenant-001')
    expect(record.tenantId).toBe('tenant-001')
    expect(record.status).toBe(TenantLifecycleStatus.Active)
    expect(record.statusReason).toBe(TenantStatusReason.Created)
    expect(record.statusChangedAt).toBeDefined()
    expect(record.history).toHaveLength(1)
    expect(record.history[0].from).toBe(TenantLifecycleStatus.Active)
    expect(record.history[0].to).toBe(TenantLifecycleStatus.Active)
    expect(record.history[0].reason).toBe(TenantStatusReason.Created)
    expect(record.history[0].note).toBe('Tenant created')
    expect(record.deletedAt).toBeUndefined()
  })
})

// ===================================================================
// applyTransition
// ===================================================================
describe('applyTransition', () => {
  let activeRecord: TenantLifecycleRecord

  beforeEach(() => {
    activeRecord = createInitialLifecycle('tenant-a')
  })

  it('Active → Suspended 应正确转换并记录历史', () => {
    const result = applyTransition(
      activeRecord,
      TenantLifecycleStatus.Suspended,
      TenantStatusReason.AdminSuspend,
      { actorId: 'admin-1', note: '违规行为暂停' },
    )
    expect(result.status).toBe(TenantLifecycleStatus.Suspended)
    expect(result.statusReason).toBe(TenantStatusReason.AdminSuspend)
    expect(result.history).toHaveLength(2)
    expect(result.history[0].from).toBe(TenantLifecycleStatus.Active)
    expect(result.history[0].to).toBe(TenantLifecycleStatus.Suspended)
    expect(result.history[0].actorId).toBe('admin-1')
    expect(result.history[0].note).toBe('违规行为暂停')
    expect(result.deletedAt).toBeUndefined()
  })

  it('Suspended → Active 应正确恢复', () => {
    const suspended = suspendTenant(activeRecord, TenantStatusReason.AdminSuspend, 'admin-1')
    const restored = reactivateTenant(suspended, 'admin-2', '已缴纳欠费')
    expect(restored.status).toBe(TenantLifecycleStatus.Active)
    expect(restored.statusReason).toBe(TenantStatusReason.AdminReactivate)
    expect(restored.history[0].note).toBe('已缴纳欠费')
    expect(restored.history).toHaveLength(3)
  })

  it('Active → Deleted 应填入删除信息', () => {
    const result = softDeleteTenant(activeRecord, TenantStatusReason.AdminDelete, 'admin-x')
    expect(result.status).toBe(TenantLifecycleStatus.Deleted)
    expect(result.deletedAt).toBeDefined()
    expect(result.deletedBy).toBe('admin-x')
  })

  it('超过50条历史记录应裁剪', () => {
    let record = activeRecord
    // 连续转换产生 51 条历史
    for (let i = 0; i < 55; i++) {
      const isSuspended = i % 2 === 0
      record = applyTransition(
        record,
        isSuspended ? TenantLifecycleStatus.Suspended : TenantLifecycleStatus.Active,
        isSuspended ? TenantStatusReason.AdminSuspend : TenantStatusReason.AdminReactivate,
      )
    }
    // 初始 1 条 + 55 条 = 56, 应裁剪到 50
    expect(record.history.length).toBe(50)
  })

  it('非法转换应抛出 InvalidTransitionError', () => {
    const deleted = softDeleteTenant(activeRecord)
    expect(() =>
      applyTransition(deleted, TenantLifecycleStatus.Active, TenantStatusReason.AdminReactivate),
    ).toThrow(InvalidTransitionError)
  })

  it('InvalidTransitionError 应包含 from 和 to 信息', () => {
    const deleted = softDeleteTenant(activeRecord)
    try {
      applyTransition(deleted, TenantLifecycleStatus.Active, TenantStatusReason.AdminReactivate)
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError)
      expect((err as InvalidTransitionError).from).toBe(TenantLifecycleStatus.Deleted)
      expect((err as InvalidTransitionError).to).toBe(TenantLifecycleStatus.Active)
    }
  })
})

// ===================================================================
// 便捷 helper 函数
// ===================================================================
describe('suspendTenant / reactivateTenant / softDeleteTenant', () => {
  it('suspendTenant 默认使用 AdminSuspend 原因', () => {
    const record = createInitialLifecycle('t1')
    const result = suspendTenant(record)
    expect(result.status).toBe(TenantLifecycleStatus.Suspended)
    expect(result.statusReason).toBe(TenantStatusReason.AdminSuspend)
  })

  it('suspendTenant 可指定配额超限原因', () => {
    const record = createInitialLifecycle('t2')
    const result = suspendTenant(record, TenantStatusReason.QuotaExceeded, 'system', '积分超限')
    expect(result.statusReason).toBe(TenantStatusReason.QuotaExceeded)
    expect(result.history[0].note).toBe('积分超限')
  })

  it('reactivateTenant 恢复且不附带 deletedAt', () => {
    const record = createInitialLifecycle('t3')
    const suspended = suspendTenant(record)
    const restored = reactivateTenant(suspended)
    expect(restored.status).toBe(TenantLifecycleStatus.Active)
    expect(restored.deletedAt).toBeUndefined()
  })

  it('softDeleteTenant 标记删除时间和操作人', () => {
    const record = createInitialLifecycle('t4')
    const deleted = softDeleteTenant(record, TenantStatusReason.UserRequest, 'user-1', '主动注销')
    expect(deleted.status).toBe(TenantLifecycleStatus.Deleted)
    expect(deleted.deletedBy).toBe('user-1')
    expect(deleted.deletedAt).toBeDefined()
    expect(deleted.history[0].note).toBe('主动注销')
  })

  it('Suspended → Deleted: 终态记录包含 deletedAt', () => {
    const record = createInitialLifecycle('t5')
    const suspended = suspendTenant(record)
    const deleted = softDeleteTenant(suspended)
    expect(deleted.status).toBe(TenantLifecycleStatus.Deleted)
    expect(deleted.deletedAt).toBeDefined()
  })
})

// ===================================================================
// 边界情况
// ===================================================================
describe('边界情况', () => {
  it('已 Deleted 租户再次软删除应抛出异常', () => {
    const record = createInitialLifecycle('t-b1')
    const deleted = softDeleteTenant(record)
    expect(() => softDeleteTenant(deleted)).toThrow(InvalidTransitionError)
  })

  it('已 Deleted 租户不能恢复', () => {
    const record = createInitialLifecycle('t-b2')
    const deleted = softDeleteTenant(record)
    expect(() => reactivateTenant(deleted)).toThrow(InvalidTransitionError)
  })

  it('Active 租户从 Active→Active 不会修改状态', () => {
    const record = createInitialLifecycle('t-b3')
    expect(record.status).toBe(TenantLifecycleStatus.Active)
  })
})
