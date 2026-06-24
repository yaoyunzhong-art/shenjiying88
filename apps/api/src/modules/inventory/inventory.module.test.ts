import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

const { InventoryModule } = require('./inventory.module')
const { InventoryController } = require('./inventory.controller')
const { InventoryService } = require('./inventory.service')

describe('InventoryModule', () => {
  test('is defined', () => {
    assert.ok(InventoryModule)
  })

  test('registers controller', () => {
    const controllers = Reflect.getMetadata('controllers', InventoryModule) || []
    const controllerNames = controllers.map((c: any) => c.name || c)
    assert.ok(controllerNames.includes('InventoryController') || controllers.includes(InventoryController))
  })

  test('registers service as provider', () => {
    const providers = Reflect.getMetadata('providers', InventoryModule) || []
    const providerNames = providers.map((p: any) => {
      if (typeof p === 'function') return p.name
      return p?.provide?.name ?? p?.name ?? String(p)
    })
    assert.ok(
      providerNames.some((n: string) => n === 'InventoryService' || n.includes('InventoryService'))
    )
  })

  test('exports InventoryService', () => {
    const exports = Reflect.getMetadata('exports', InventoryModule) || []
    const exportNames = exports.map((e: any) => (typeof e === 'function' ? e.name : String(e)))
    assert.ok(exportNames.some((n: string) => n === 'InventoryService' || n.includes('InventoryService')))
  })

  test('constructs module instance', () => {
    const mod = new InventoryModule()
    assert.ok(mod instanceof InventoryModule)
  })
})
