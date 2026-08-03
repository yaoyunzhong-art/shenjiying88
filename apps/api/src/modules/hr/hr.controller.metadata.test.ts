import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { HrController } from './hr.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HrController)

describe('HrController metadata', () => {
  const readHandlers = [
    HrController.prototype.findAll,
    HrController.prototype.getStats,
    HrController.prototype.getDepartments,
    HrController.prototype.getOnboardingList,
    HrController.prototype.getOffboardingList,
  ]

  const detailReadHandlers = [
    HrController.prototype.findById,
    HrController.prototype.getAttendance,
    HrController.prototype.getAttendanceStats,
    HrController.prototype.getContracts,
  ]

  const writeHandlers = [
    HrController.prototype.create,
    HrController.prototype.update,
    HrController.prototype.delete,
    HrController.prototype.recordAttendance,
    HrController.prototype.onboard,
    HrController.prototype.offboard,
    HrController.prototype.createContract,
    HrController.prototype.renewContract,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, HrController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...detailReadHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse staff:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['staff:read'])
    })
  })

  it('detail routes should reuse staff:id:read', () => {
    detailReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['staff:id:read'])
    })
  })

  it('write routes should reuse staff:*', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['staff:*'])
    })
  })
})
