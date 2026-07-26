import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PointsController } from './points.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PointsController)

describe('PointsController metadata', () => {
  const readHandlers = [
    PointsController.prototype.getBalance,
    PointsController.prototype.getRecords,
    PointsController.prototype.getRiskStatus,
  ]

  const writeHandlers = [
    PointsController.prototype.transaction,
    PointsController.prototype.transfer,
    PointsController.prototype.deduct,
  ]

  const adjustHandlers = [
    PointsController.prototype.batchAward,
    PointsController.prototype.resetRisk,
    PointsController.prototype.scheduleReminder,
    PointsController.prototype.sendReminder,
  ]

  it('controller should keep points path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', PointsController), 'points')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, PointsController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, PointsController), {})
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PointsController), ['points:read'])
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PointsController.prototype.transaction, 1, 'transaction'],
      [PointsController.prototype.transfer, 1, 'transfer'],
      [PointsController.prototype.deduct, 1, 'deduct'],
      [PointsController.prototype.batchAward, 1, 'batch-award'],
      [PointsController.prototype.getBalance, 0, 'balance/:memberId'],
      [PointsController.prototype.getRecords, 0, 'records'],
      [PointsController.prototype.getRiskStatus, 0, 'risk-status'],
      [PointsController.prototype.resetRisk, 1, 'risk/reset'],
      [PointsController.prototype.scheduleReminder, 1, 'risk/schedule-reminder'],
      [PointsController.prototype.sendReminder, 1, 'risk/send-reminder'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })

  it('read routes should reuse points:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['points:read'])
    })
  })

  it('write routes should reuse points:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['points:write'])
    })
  })

  it('adjust routes should reuse points:adjust', () => {
    adjustHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['points:adjust'])
    })
  })
})
