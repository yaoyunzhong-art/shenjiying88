import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MembershipController } from './membership.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, MembershipController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, MembershipController)

describe('MembershipController metadata', () => {
  const readHandlers = [
    MembershipController.prototype.getById,
    MembershipController.prototype.findByPhone,
    MembershipController.prototype.list,
    MembershipController.prototype.getLevels,
    MembershipController.prototype.getLevel,
    MembershipController.prototype.getUpgradeProgress,
    MembershipController.prototype.pointsHistory,
    MembershipController.prototype.balanceHistory,
    MembershipController.prototype.stats,
  ]

  const memberWriteHandlers = [
    MembershipController.prototype.register,
    MembershipController.prototype.getOrCreate,
    MembershipController.prototype.update,
    MembershipController.prototype.delete,
    MembershipController.prototype.refreshLevel,
    MembershipController.prototype.earnPoints,
    MembershipController.prototype.redeemPoints,
    MembershipController.prototype.adjustPoints,
  ]

  const settlementPayHandlers = [
    MembershipController.prototype.recharge,
    MembershipController.prototype.payWithBalance,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...memberWriteHandlers, ...settlementPayHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse member:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['member:read'])
    })
  })

  it('member write routes should reuse member:update', () => {
    memberWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['member:update'])
    })
  })

  it('balance routes should reuse settlement:pay', () => {
    settlementPayHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['settlement:pay'])
    })
  })
})
