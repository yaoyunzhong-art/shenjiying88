import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { MemberController } from './member.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, MemberController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, MemberController)

describe('MemberController metadata', () => {
  const publicHandlers = [
    MemberController.prototype.register,
    MemberController.prototype.login,
  ]

  const protectedHandlers = [
    MemberController.prototype.getBootstrap,
    MemberController.prototype.listPersistentProfiles,
    MemberController.prototype.listLytMemberSnapshots,
    MemberController.prototype.getLytMemberSnapshot,
    MemberController.prototype.getPersistentProfile,
    MemberController.prototype.listPersistentMutationHistory,
    MemberController.prototype.getOperationsProfile,
    MemberController.prototype.listOperationsTasks,
    MemberController.prototype.listOperationsReceipts,
    MemberController.prototype.getOperationsRuntimeReceipt,
    MemberController.prototype.replayOperationsExecution,
    MemberController.prototype.registerPersistent,
    MemberController.prototype.updatePersistentProfile,
    MemberController.prototype.awardPersistentPoints,
    MemberController.prototype.rollbackPersistentPoints,
    MemberController.prototype.updatePersistentStatus,
    MemberController.prototype.overridePersistentLevel,
    MemberController.prototype.recordPersistentPaymentActivity,
    MemberController.prototype.getSession,
    MemberController.prototype.getPayments,
    MemberController.prototype.getLoginHistory,
    MemberController.prototype.getSecurityEvents,
    MemberController.prototype.getChurnPredictions,
    MemberController.prototype.getChurnDiagnosis,
    MemberController.prototype.getProfile,
    MemberController.prototype.listProfiles,
    MemberController.prototype.addPoints,
    MemberController.prototype.checkUpgrade,
    MemberController.prototype.getBalance,
  ]

  const readHandlers = [
    MemberController.prototype.getBootstrap,
    MemberController.prototype.listPersistentProfiles,
    MemberController.prototype.listLytMemberSnapshots,
    MemberController.prototype.getLytMemberSnapshot,
    MemberController.prototype.getPersistentProfile,
    MemberController.prototype.listPersistentMutationHistory,
    MemberController.prototype.getOperationsProfile,
    MemberController.prototype.listOperationsTasks,
    MemberController.prototype.listOperationsReceipts,
    MemberController.prototype.getOperationsRuntimeReceipt,
    MemberController.prototype.getSession,
    MemberController.prototype.getPayments,
    MemberController.prototype.getLoginHistory,
    MemberController.prototype.getSecurityEvents,
    MemberController.prototype.getChurnPredictions,
    MemberController.prototype.getChurnDiagnosis,
    MemberController.prototype.getProfile,
    MemberController.prototype.listProfiles,
    MemberController.prototype.checkUpgrade,
    MemberController.prototype.getBalance,
  ]

  const writeHandlers = [
    MemberController.prototype.replayOperationsExecution,
    MemberController.prototype.registerPersistent,
    MemberController.prototype.updatePersistentProfile,
    MemberController.prototype.awardPersistentPoints,
    MemberController.prototype.rollbackPersistentPoints,
    MemberController.prototype.updatePersistentStatus,
    MemberController.prototype.overridePersistentLevel,
    MemberController.prototype.recordPersistentPaymentActivity,
    MemberController.prototype.addPoints,
  ]

  it('controller should keep members path and not stay public', () => {
    assert.equal(Reflect.getMetadata('path', MemberController), 'members')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, MemberController), undefined)
  })

  it('selected routes should keep REST metadata', () => {
    const cases = [
      [MemberController.prototype.getBootstrap, 0, 'bootstrap'],
      [MemberController.prototype.register, 1, 'register'],
      [MemberController.prototype.registerPersistent, 1, 'persistent/register'],
      [MemberController.prototype.listPersistentMutationHistory, 0, 'persistent/:memberId/history'],
      [MemberController.prototype.updatePersistentProfile, 1, 'persistent/:memberId/profile'],
      [MemberController.prototype.awardPersistentPoints, 1, 'persistent/:memberId/points/award'],
      [MemberController.prototype.rollbackPersistentPoints, 1, 'persistent/:memberId/points/rollback'],
      [MemberController.prototype.updatePersistentStatus, 1, 'persistent/:memberId/status'],
      [MemberController.prototype.overridePersistentLevel, 1, 'persistent/:memberId/level'],
      [MemberController.prototype.recordPersistentPaymentActivity, 1, 'persistent/:memberId/payment-activity'],
      [MemberController.prototype.login, 1, 'login'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('protected routes should still require tenant scope', () => {
    protectedHandlers.forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), undefined)
    })
  })

  it('read routes should keep member:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['member:read'])
    })
  })

  it('write routes should keep member:update', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['member:update'])
    })
  })

  it('public member entry routes should skip tenant guard and permission checks', () => {
    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
    })
  })
})
