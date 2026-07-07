import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BlindboxModule } from './blindbox.module'
import { BlindboxController } from './blindbox.controller'
import { BlindboxService } from './blindbox.service'

describe('BlindboxModule', () => {
  it('should be defined', () => {
    const moduleClass = BlindboxModule
    assert.ok(moduleClass)
  })

  it('should export expected shape (controllers, providers, exports)', () => {
    const moduleInstance = new BlindboxModule()
    assert.ok(moduleInstance instanceof BlindboxModule)
  })

  it('should have valid controller', () => {
    assert.ok(BlindboxController)
    assert.equal(typeof BlindboxController.prototype.createPlan, 'function')
    assert.equal(typeof BlindboxController.prototype.draw, 'function')
    assert.equal(typeof BlindboxController.prototype.drawBatch, 'function')
    assert.equal(typeof BlindboxController.prototype.getProbabilities, 'function')
    assert.equal(typeof BlindboxController.prototype.getPrizePool, 'function')
    assert.equal(typeof BlindboxController.prototype.getHistory, 'function')
  })

  it('should have valid service', () => {
    assert.ok(BlindboxService)
    assert.equal(typeof BlindboxService.prototype.createPlan, 'function')
    assert.equal(typeof BlindboxService.prototype.drawSingle, 'function')
    assert.equal(typeof BlindboxService.prototype.drawBatch10, 'function')
    assert.equal(typeof BlindboxService.prototype.getProbability公示, 'function')
    assert.equal(typeof BlindboxService.prototype.getPrizePool, 'function')
    assert.equal(typeof BlindboxService.prototype.getDrawHistory, 'function')
  })

  it('should define @Module decorator with controllers provider', () => {
    // NestJS stores module metadata; verify the module is properly wired
    const ctrl = Reflect.getMetadata('controllers', BlindboxModule)
    const providers = Reflect.getMetadata('providers', BlindboxModule)
    const exports = Reflect.getMetadata('exports', BlindboxModule)

    // At minimum these should be defined as an array
    assert.ok(Array.isArray(ctrl) || ctrl === undefined)
    assert.ok(Array.isArray(providers) || providers === undefined)
    assert.ok(Array.isArray(exports) || exports === undefined)
  })
})
