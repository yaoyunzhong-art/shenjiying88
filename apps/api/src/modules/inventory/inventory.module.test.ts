import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InventoryModule } from './inventory.module'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'

describe('InventoryModule', () => {
  it('is defined', () => {
    assert.ok(InventoryModule)
  })

  it('registers controller', () => {
    const controllers = Reflect.getMetadata('controllers', InventoryModule) || []
    const controllerNames = controllers.map((c: any) => c.name || c)
    assert.ok(controllerNames.includes('InventoryController') || controllers.includes(InventoryController))
  })

  it('registers service as provider', () => {
    const providers = Reflect.getMetadata('providers', InventoryModule) || []
    const providerNames = providers.map((p: any) => {
      if (typeof p === 'function') return p.name
      return p?.provide?.name ?? p?.name ?? String(p)
    })
    assert.ok(
      providerNames.some((n: string) => n === 'InventoryService' || n.includes('InventoryService'))
    )
  })

  it('exports InventoryService', () => {
    const exports = Reflect.getMetadata('exports', InventoryModule) || []
    const exportNames = exports.map((e: any) => (typeof e === 'function' ? e.name : String(e)))
    assert.ok(exportNames.some((n: string) => n === 'InventoryService' || n.includes('InventoryService')))
  })

  it('constructs module instance', () => {
    const mod = new InventoryModule()
    assert.ok(mod instanceof InventoryModule)
  })
})
