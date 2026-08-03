import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { MemberConfigController } from './member-config.controller'

describe('MemberConfigController metadata', () => {
  it('controller should keep api/member/config path', () => {
    assert.equal(Reflect.getMetadata('path', MemberConfigController), 'api/member/config')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberConfigController.prototype.getConfig, 0, '/'],
      [MemberConfigController.prototype.updateConfig, 4, '/'],
      [MemberConfigController.prototype.resetConfig, 1, 'reset'],
      [MemberConfigController.prototype.getHistory, 0, 'history'],
      [MemberConfigController.prototype.getThreshold, 0, 'threshold/:level'],
      [MemberConfigController.prototype.batchThreshold, 1, 'threshold/batch'],
      [MemberConfigController.prototype.getPointsRate, 0, 'points-rate'],
      [MemberConfigController.prototype.upgradeProgress, 0, 'upgrade-progress'],
      [MemberConfigController.prototype.validateConfig, 1, 'validate'],
      [MemberConfigController.prototype.getDefault, 0, 'default'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
