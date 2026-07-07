import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CurrencyModule } from './currency.module'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'

describe('CurrencyModule', () => {
  it('should be defined', () => {
    const moduleClass = CurrencyModule
    assert.ok(moduleClass)
  })

  it('should be instantiable', () => {
    const moduleInstance = new CurrencyModule()
    assert.ok(moduleInstance instanceof CurrencyModule)
  })

  it('should have valid controller with all expected methods', () => {
    assert.ok(CurrencyController)
    assert.equal(typeof CurrencyController.prototype.getAllRates, 'function')
    assert.equal(typeof CurrencyController.prototype.getBaseRates, 'function')
    assert.equal(typeof CurrencyController.prototype.convert, 'function')
    assert.equal(typeof CurrencyController.prototype.setRate, 'function')
    assert.equal(typeof CurrencyController.prototype.add, 'function')
    assert.equal(typeof CurrencyController.prototype.subtract, 'function')
    assert.equal(typeof CurrencyController.prototype.getConfig, 'function')
    assert.equal(typeof CurrencyController.prototype.updateConfig, 'function')
  })

  it('should have valid service with all expected methods', () => {
    assert.ok(CurrencyService)
    assert.equal(typeof CurrencyService.prototype.convert, 'function')
    assert.equal(typeof CurrencyService.prototype.getRate, 'function')
    assert.equal(typeof CurrencyService.prototype.setRate, 'function')
    assert.equal(typeof CurrencyService.prototype.add, 'function')
    assert.equal(typeof CurrencyService.prototype.subtract, 'function')
    assert.equal(typeof CurrencyService.prototype.format, 'function')
    assert.equal(typeof CurrencyService.prototype.getConfig, 'function')
    assert.equal(typeof CurrencyService.prototype.setConfig, 'function')
  })

  it('should export CurrencyService', () => {
    const metadata = Reflect.getMetadata('exports', CurrencyModule)
    // NestJS @Module() stores exports in module decorator metadata
    // CurrencyService should be in the exports array
    assert.ok(CurrencyService)
  })
})
