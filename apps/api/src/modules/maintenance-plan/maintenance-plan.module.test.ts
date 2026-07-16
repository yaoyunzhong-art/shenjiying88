import { describe, it } from 'vitest'
/**
 * 🐜 自动: [maintenance-plan] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MaintenancePlanModule } from './maintenance-plan.module'
import { MaintenancePlanController } from './maintenance-plan.controller'
import { MaintenancePlanService } from './maintenance-plan.service'

describe('MaintenancePlanModule', () => {
  it('should be defined', () => {
    const module = new MaintenancePlanModule()
    assert.ok(module instanceof MaintenancePlanModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', MaintenancePlanModule)
    const providers = Reflect.getMetadata('providers', MaintenancePlanModule)
    const exports = Reflect.getMetadata('exports', MaintenancePlanModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(MaintenancePlanController))
    assert.ok(providers.includes(MaintenancePlanService))
    assert.ok(exports.includes(MaintenancePlanService))
  })
})
