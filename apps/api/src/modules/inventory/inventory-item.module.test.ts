import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InventoryItemModule } from './inventory-item.module'
import { InventoryItemController } from './inventory-item.controller'
import { InventoryItemService } from './inventory-item.service'
import { InventoryReservationCron } from './inventory.cron'

/**
 * Phase-37 T167: InventoryItemModule 单元测试
 *
 * 覆盖:
 *  - controllers 注册到模块
 *  - providers 注册到模块
 *  - exports 正确导出
 */

describe('InventoryItemModule', () => {
  it('模块定义存在', () => {
    assert.ok(InventoryItemModule)
  })

  it('controllers 包含 InventoryItemController', () => {
    const controllers = Reflect.getMetadata('controllers', InventoryItemModule)
    assert.ok(Array.isArray(controllers))
    assert.ok(controllers.includes(InventoryItemController))
  })

  it('providers 包含 InventoryItemService', () => {
    const providers = Reflect.getMetadata('providers', InventoryItemModule)
    assert.ok(Array.isArray(providers))
    assert.ok(providers.includes(InventoryItemService))
  })

  it('providers 包含 InventoryReservationCron', () => {
    const providers = Reflect.getMetadata('providers', InventoryItemModule)
    assert.ok(Array.isArray(providers))
    assert.ok(providers.includes(InventoryReservationCron))
  })

  it('exports 包含 InventoryItemService', () => {
    const exports = Reflect.getMetadata('exports', InventoryItemModule)
    assert.ok(Array.isArray(exports))
    assert.ok(exports.includes(InventoryItemService))
  })
})
