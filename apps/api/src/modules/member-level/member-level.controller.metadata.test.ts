import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MemberLevelController } from './member-level.controller'

describe('MemberLevelController metadata', () => {
  it('controller should keep member-level path', () => {
    assert.equal(Reflect.getMetadata('path', MemberLevelController), 'member-level')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberLevelController.prototype.evaluate, 1, 'evaluate'],
      [MemberLevelController.prototype.calculate, 1, 'calculate'],
      [MemberLevelController.prototype.batchEvaluate, 1, 'batch'],
      [MemberLevelController.prototype.getConfig, 0, 'config'],
      [MemberLevelController.prototype.getUpgradePath, 0, 'upgrade-path/:fromTier/:fromSub/:toTier/:toSub'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
