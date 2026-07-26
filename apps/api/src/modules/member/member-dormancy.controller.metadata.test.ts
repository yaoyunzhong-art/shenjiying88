import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { MemberDormancyController } from './member-dormancy.controller'

describe('MemberDormancyController metadata', () => {
  it('controller should keep api/member/dormancy path', () => {
    assert.equal(Reflect.getMetadata('path', MemberDormancyController), 'api/member/dormancy')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MemberDormancyController.prototype.reactivate, 1, ':memberId/reactivate'],
      [MemberDormancyController.prototype.manualScan, 1, 'scan'],
      [MemberDormancyController.prototype.stats, 0, 'stats'],
      [MemberDormancyController.prototype.listByStage, 0, 'list/:stage'],
      [MemberDormancyController.prototype.cronMetrics, 0, 'cron-metrics'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
