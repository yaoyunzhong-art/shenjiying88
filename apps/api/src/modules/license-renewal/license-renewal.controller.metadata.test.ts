// @ts-nocheck
import 'reflect-metadata'
import { beforeAll, describe, it } from 'vitest'
import assert from 'node:assert/strict'

describe('LicenseRenewalController metadata', () => {
  let ControllerClass: any

  beforeAll(async () => {
    const { LicenseRenewalController } = await import('./license-renewal.controller.ts')
    ControllerClass = LicenseRenewalController
  })

  it('controller should keep license-renewal path', () => {
    assert.equal(Reflect.getMetadata('path', ControllerClass), 'license-renewal')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ControllerClass.prototype.createRecord, 1, 'records'],
      [ControllerClass.prototype.listRecords, 0, 'records'],
      [ControllerClass.prototype.getRecord, 0, 'records/:id'],
      [ControllerClass.prototype.updateStatus, 'patch', 'records/:id/status'],
      [ControllerClass.prototype.createNotification, 1, 'notifications'],
      [ControllerClass.prototype.listNotifications, 0, 'notifications'],
      [ControllerClass.prototype.getStats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      const actualMethod = Reflect.getMetadata('method', handler)
      if (method === 'patch') {
        assert.ok(actualMethod === 2 || actualMethod === 4)
      } else {
        assert.equal(actualMethod, method)
      }
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
