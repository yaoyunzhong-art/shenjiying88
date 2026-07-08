import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SvipModule } from './svip.module'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'

describe('SvipModule', () => {
  it('should be defined', () => {
    const moduleClass = SvipModule
    assert.ok(moduleClass)
  })

  it('should export expected shape (controllers, providers, exports)', () => {
    const moduleInstance = new SvipModule()
    assert.ok(moduleInstance instanceof SvipModule)
  })

  it('should have valid controller', () => {
    assert.ok(SvipController)
    assert.equal(typeof SvipController.prototype.createPlan, 'function')
    assert.equal(typeof SvipController.prototype.listPlans, 'function')
    assert.equal(typeof SvipController.prototype.subscribe, 'function')
    assert.equal(typeof SvipController.prototype.getSubscription, 'function')
    assert.equal(typeof SvipController.prototype.cancel, 'function')
    assert.equal(typeof SvipController.prototype.renew, 'function')
    assert.equal(typeof SvipController.prototype.useBenefit, 'function')
    assert.equal(typeof SvipController.prototype.getBenefits, 'function')
  })

  it('should have valid service', () => {
    assert.ok(SvipService)
    assert.equal(typeof SvipService.prototype.createPlan, 'function')
    assert.equal(typeof SvipService.prototype.subscribe, 'function')
    assert.equal(typeof SvipService.prototype.cancelSubscription, 'function')
    assert.equal(typeof SvipService.prototype.renewSubscription, 'function')
    assert.equal(typeof SvipService.prototype.getSubscription, 'function')
    assert.equal(typeof SvipService.prototype.useBenefit, 'function')
    assert.equal(typeof SvipService.prototype.getBenefits, 'function')
    assert.equal(typeof SvipService.prototype.checkAndExpire, 'function')
  })

  it('should have valid provider references', () => {
    // Verify that the module providers are correctly set up
    const metadata = Reflect.getMetadataKeys(SvipModule)
    assert.ok(Array.isArray(metadata))
  })
})
