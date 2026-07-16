import { describe, it } from 'vitest'
/**
 * 🐜 自动: [leave-request] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LeaveRequestModule } from './leave-request.module'
import { LeaveRequestController } from './leave-request.controller'
import { LeaveRequestService } from './leave-request.service'

describe('LeaveRequestModule', () => {
  it('should be defined', () => {
    const module = new LeaveRequestModule()
    assert.ok(module instanceof LeaveRequestModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', LeaveRequestModule)
    const providers = Reflect.getMetadata('providers', LeaveRequestModule)
    const exports = Reflect.getMetadata('exports', LeaveRequestModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(LeaveRequestController))
    assert.ok(providers.includes(LeaveRequestService))
    assert.ok(exports.includes(LeaveRequestService))
  })
})
