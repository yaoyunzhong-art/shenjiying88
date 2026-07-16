import { describe, it } from 'vitest'
/**
 * 🐜 自动: [shift-scheduler] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ShiftSchedulerModule } from './shift-scheduler.module'
import { ShiftSchedulerController } from './shift-scheduler.controller'
import { ShiftSchedulerService } from './shift-scheduler.service'

describe('ShiftSchedulerModule', () => {
  it('should be defined', () => {
    const module = new ShiftSchedulerModule()
    assert.ok(module instanceof ShiftSchedulerModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', ShiftSchedulerModule)
    const providers = Reflect.getMetadata('providers', ShiftSchedulerModule)
    const exports = Reflect.getMetadata('exports', ShiftSchedulerModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(ShiftSchedulerController))
    assert.ok(providers.includes(ShiftSchedulerService))
    assert.ok(exports.includes(ShiftSchedulerService))
  })
})
