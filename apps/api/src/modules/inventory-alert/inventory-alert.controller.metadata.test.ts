import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DECORATORS } from '@nestjs/swagger/dist/constants'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { InventoryAlertController } from './inventory-alert.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, InventoryAlertController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, InventoryAlertController)
  )
}

describe('InventoryAlertController metadata', () => {
  const readHandlers = [
    InventoryAlertController.prototype.list,
    InventoryAlertController.prototype.summary,
    InventoryAlertController.prototype.getById,
  ]

  const writeHandlers = [
    InventoryAlertController.prototype.create,
  ]

  it('controller should keep inventory-alert path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', InventoryAlertController), 'inventory-alert')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, InventoryAlertController), undefined)
    assert.deepEqual(Reflect.getMetadata(DECORATORS.API_TAGS, InventoryAlertController), ['库存预警分析'])
  })

  it('routes should keep REST metadata and swagger summaries', () => {
    const cases = [
      [InventoryAlertController.prototype.list, 0, '/', '获取库存预警列表'],
      [InventoryAlertController.prototype.summary, 0, 'summary', '获取预警统计汇总'],
      [InventoryAlertController.prototype.getById, 0, ':id', '获取单条预警详情'],
      [InventoryAlertController.prototype.create, 1, '/', '创建库存预警'],
    ] as const

    cases.forEach(([handler, method, path, summary]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)?.summary, summary)
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse inventory:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory:read'])
    })
  })

  it('create route should reuse inventory:update', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory:update'])
    })
  })
})
