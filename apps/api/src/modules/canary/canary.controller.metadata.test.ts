import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CanaryController } from './canary.controller'

describe('CanaryController metadata', () => {
  it('controller should keep canary path', () => {
    assert.equal(Reflect.getMetadata('path', CanaryController), 'canary')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CanaryController.prototype.list, 0, 'list'],
      [CanaryController.prototype.get, 0, ':id'],
      [CanaryController.prototype.create, 1, 'create'],
      [CanaryController.prototype.activate, 1, ':id/activate'],
      [CanaryController.prototype.pause, 1, ':id/pause'],
      [CanaryController.prototype.promote, 1, ':id/promote'],
      [CanaryController.prototype.rollback, 1, ':id/rollback'],
      [CanaryController.prototype.evaluate, 1, 'evaluate'],
      [CanaryController.prototype.recordHealth, 1, ':id/health'],
      [CanaryController.prototype.getHealth, 0, ':id/health'],
      [CanaryController.prototype.checkPromote, 0, ':id/check-promote'],
      [CanaryController.prototype.auditLogs, 0, ':id/audit'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
