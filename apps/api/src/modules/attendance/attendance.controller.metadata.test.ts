import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { AttendanceController } from './attendance.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, AttendanceController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, AttendanceController)
  )
}

describe('AttendanceController metadata', () => {
  it('controller should keep attendance path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', AttendanceController), 'attendance')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, AttendanceController), undefined)
  })

  it('routes should keep REST metadata and tenant scope', () => {
    const cases = [
      [AttendanceController.prototype.clockIn, 1, 'clock-in'],
      [AttendanceController.prototype.records, 1, 'records'],
      [AttendanceController.prototype.summary, 1, 'summary'],
      [AttendanceController.prototype.leaveApprove, 1, 'leave/approve'],
      [AttendanceController.prototype.leaveReject, 1, 'leave/reject'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('routes should keep attendance permissions', () => {
    assert.deepEqual(resolvePermissions(AttendanceController.prototype.clockIn), ['att:clock'])
    assert.deepEqual(resolvePermissions(AttendanceController.prototype.records), ['att:list'])
    assert.deepEqual(resolvePermissions(AttendanceController.prototype.summary), ['att:summary'])
    assert.deepEqual(resolvePermissions(AttendanceController.prototype.leaveApprove), ['att:leave:approve'])
    assert.deepEqual(resolvePermissions(AttendanceController.prototype.leaveReject), ['att:leave:approve'])
  })
})
