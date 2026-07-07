import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 单元测试: tenant-lifecycle (Phase-15 task 4)
 *
 * 覆盖:
 *   - createInitialLifecycle 默认 Active
 *   - 状态转换矩阵合法性
 *   - applyTransition / suspend / reactivate / softDelete 流转
 *   - 非法转换抛 InvalidTransitionError
 *   - Deleted 终态无法再次转换
 *   - canRead / canWrite / isOperational 操作权限
 *   - TenantLifecycleService: store / assertWriteAllowed / assertReadAllowed
 *   - history 累积 + 上限 50
 */

import assert from 'node:assert/strict'
import {
  applyTransition,
  canRead,
  canWrite,
  createInitialLifecycle,
  InvalidTransitionError,
  isOperational,
  isValidTransition,
  reactivateTenant,
  softDeleteTenant,
  suspendTenant,
  TenantLifecycleStatus,
  TenantStatusReason,
  type TenantLifecycleRecord
} from './tenant-lifecycle.entity'
import { TenantLifecycleService } from './tenant-lifecycle.service'

it('createInitialLifecycle: 默认 Active + Created reason', () => {
  const lc = createInitialLifecycle('t1')
  assert.equal(lc.tenantId, 't1')
  assert.equal(lc.status, TenantLifecycleStatus.Active)
  assert.equal(lc.statusReason, TenantStatusReason.Created)
  assert.ok(lc.statusChangedAt)
  assert.equal(lc.history.length, 1)
  assert.equal(lc.history[0]!.reason, TenantStatusReason.Created)
})

it('isValidTransition: 合法转换矩阵', () => {
  assert.equal(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Suspended), true)
  assert.equal(isValidTransition(TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Active), true)
  assert.equal(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Deleted), true)
  assert.equal(isValidTransition(TenantLifecycleStatus.Suspended, TenantLifecycleStatus.Deleted), true)
  // 非法
  assert.equal(isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Active), false)
  assert.equal(isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Suspended), false)
  // 同状态不算转换
  assert.equal(isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Active), false)
})

it('canRead / canWrite / isOperational', () => {
  assert.equal(canRead(TenantLifecycleStatus.Active), true)
  assert.equal(canRead(TenantLifecycleStatus.Suspended), true)
  assert.equal(canRead(TenantLifecycleStatus.Deleted), false)

  assert.equal(canWrite(TenantLifecycleStatus.Active), true)
  assert.equal(canWrite(TenantLifecycleStatus.Suspended), false)
  assert.equal(canWrite(TenantLifecycleStatus.Deleted), false)

  assert.equal(isOperational(TenantLifecycleStatus.Active), true)
  assert.equal(isOperational(TenantLifecycleStatus.Suspended), false)
  assert.equal(isOperational(TenantLifecycleStatus.Deleted), false)
})

it('applyTransition: Active -> Suspended 合法,history 累积', () => {
  const lc = createInitialLifecycle('t1')
  const next = applyTransition(lc, TenantLifecycleStatus.Suspended, TenantStatusReason.AdminSuspend, {
    actorId: 'admin-1',
    note: 'overdue'
  })
  assert.equal(next.status, TenantLifecycleStatus.Suspended)
  assert.equal(next.statusReason, TenantStatusReason.AdminSuspend)
  assert.equal(next.history.length, 2)
  assert.equal(next.history[0]!.from, TenantLifecycleStatus.Active)
  assert.equal(next.history[0]!.to, TenantLifecycleStatus.Suspended)
  assert.equal(next.history[0]!.actorId, 'admin-1')
  assert.equal(next.history[0]!.note, 'overdue')
})

it('applyTransition: 非法转换抛 InvalidTransitionError', () => {
  const lc = createInitialLifecycle('t1')
  // Active -> Deleted 合法,但 Deleted -> Active 非法
  const deleted = softDeleteTenant(lc)
  assert.equal(deleted.status, TenantLifecycleStatus.Deleted)
  assert.throws(
    () => applyTransition(deleted, TenantLifecycleStatus.Active, TenantStatusReason.AdminReactivate),
    (err: unknown) => err instanceof InvalidTransitionError
  )
})

it('suspend / reactivate / softDelete 便捷 helper', () => {
  let lc = createInitialLifecycle('t1')
  lc = suspendTenant(lc, TenantStatusReason.BillingOverdue, 'sys', 'overdue 30d')
  assert.equal(lc.status, TenantLifecycleStatus.Suspended)
  lc = reactivateTenant(lc, 'admin', 'payment received')
  assert.equal(lc.status, TenantLifecycleStatus.Active)
  lc = softDeleteTenant(lc, TenantStatusReason.UserRequest, 'user-1')
  assert.equal(lc.status, TenantLifecycleStatus.Deleted)
  assert.equal(lc.deletedAt, lc.history[0]!.occurredAt)
  assert.equal(lc.deletedBy, 'user-1')
})

it('history 上限 50 条', () => {
  let lc = createInitialLifecycle('t1')
  for (let i = 0; i < 60; i++) {
    lc = applyTransition(lc, TenantLifecycleStatus.Suspended, TenantStatusReason.AdminSuspend)
    lc = applyTransition(lc, TenantLifecycleStatus.Active, TenantStatusReason.AdminReactivate)
  }
  assert.equal(lc.history.length, 50)
})

it('TenantLifecycleService: initialize + getLifecycle', () => {
  const svc = new TenantLifecycleService()
  const lc = svc.initialize('t1')
  assert.equal(lc.status, TenantLifecycleStatus.Active)
  assert.equal(svc.getLifecycle('t1')?.tenantId, 't1')
  assert.equal(svc.getLifecycle('unknown'), undefined)
  // 重复初始化抛错
  assert.throws(() => svc.initialize('t1'))
})

it('TenantLifecycleService: suspend/reactivate/softDelete', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  const s = svc.suspend('t1', TenantStatusReason.AdminSuspend, 'admin-1')
  assert.equal(svc.getStatus('t1'), TenantLifecycleStatus.Suspended)
  assert.equal(s.statusReason, TenantStatusReason.AdminSuspend)
  svc.reactivate('t1', 'admin-1')
  assert.equal(svc.getStatus('t1'), TenantLifecycleStatus.Active)
  svc.softDelete('t1', TenantStatusReason.AdminDelete, 'admin-1')
  assert.equal(svc.getStatus('t1'), TenantLifecycleStatus.Deleted)
})

it('TenantLifecycleService: getOrInitLifecycle 自动初始化', () => {
  const svc = new TenantLifecycleService()
  const lc = svc.getOrInitLifecycle('t-new')
  assert.equal(lc.tenantId, 't-new')
  assert.equal(lc.status, TenantLifecycleStatus.Active)
  // 第二次返回同一份
  const lc2 = svc.getOrInitLifecycle('t-new')
  assert.equal(lc, lc2)
})

it('TenantLifecycleService: assertWriteAllowed Active 允许,Suspended 拒绝', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  svc.assertWriteAllowed('t1')
  svc.suspend('t1')
  assert.throws(() => svc.assertWriteAllowed('t1'))
})

it('TenantLifecycleService: assertReadAllowed Deleted 拒绝', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  svc.assertReadAllowed('t1')
  svc.softDelete('t1')
  assert.throws(() => svc.assertReadAllowed('t1'))
})

it('TenantLifecycleService: listByStatus 过滤', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  svc.initialize('t2')
  svc.initialize('t3')
  svc.suspend('t2')
  const active = svc.listByStatus(TenantLifecycleStatus.Active)
  assert.equal(active.length, 2)
  const suspended = svc.listByStatus(TenantLifecycleStatus.Suspended)
  assert.equal(suspended.length, 1)
  assert.equal(suspended[0]!.tenantId, 't2')
})

it('TenantLifecycleService: getHistory 返回完整 history', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  svc.suspend('t1', TenantStatusReason.AdminSuspend, 'admin-1')
  svc.reactivate('t1', 'admin-1')
  const hist = svc.getHistory('t1')
  assert.ok(hist.length >= 3) // Created + Suspend + Reactivate
  assert.equal(hist[0]!.from, TenantLifecycleStatus.Suspended)
  assert.equal(hist[0]!.to, TenantLifecycleStatus.Active)
})

it('TenantLifecycleService: resetAll 清空', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  svc.suspend('t1')
  svc.resetAll()
  assert.equal(svc.getLifecycle('t1'), undefined)
})

it('TenantLifecycleService: applyTransition 自定义 to', () => {
  const svc = new TenantLifecycleService()
  svc.initialize('t1')
  // Suspended -> Deleted 是合法的
  svc.suspend('t1')
  const next = svc.applyTransition('t1', TenantLifecycleStatus.Deleted, TenantStatusReason.UserRequest, 'user-1')
  assert.equal(next.status, TenantLifecycleStatus.Deleted)
  assert.equal(next.statusReason, TenantStatusReason.UserRequest)
})

it('InvalidTransitionError: 错误结构', () => {
  const err = new InvalidTransitionError(TenantLifecycleStatus.Active, TenantLifecycleStatus.Deleted)
  // Active -> Deleted 是合法的,但 Deleted -> Active 非法,所以构造时不一定抛
  // 验证字段
  assert.equal(err.from, TenantLifecycleStatus.Active)
  assert.equal(err.to, TenantLifecycleStatus.Deleted)
  assert.ok(err.message.includes('ACTIVE'))
  assert.ok(err.message.includes('DELETED'))
})

it('TenantLifecycleService: isValidTransition wrapper', () => {
  const svc = new TenantLifecycleService()
  assert.equal(svc.isValidTransition(TenantLifecycleStatus.Active, TenantLifecycleStatus.Suspended), true)
  assert.equal(svc.isValidTransition(TenantLifecycleStatus.Deleted, TenantLifecycleStatus.Active), false)
})

it('lifecycle 与 quota 解耦: suspend 不影响 quota', () => {
  // 业务场景: tenant 被暂停时,quota 仍保留(后续恢复可继续使用)
  const lcSvc = new TenantLifecycleService()
  lcSvc.initialize('t1')
  // 假设 quota 独立服务,这里只验证 lifecycle 状态独立
  lcSvc.suspend('t1')
  assert.equal(lcSvc.getStatus('t1'), TenantLifecycleStatus.Suspended)
  // 重新激活
  lcSvc.reactivate('t1')
  assert.equal(lcSvc.getStatus('t1'), TenantLifecycleStatus.Active)
})