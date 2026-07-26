import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryItemController } from './inventory-item.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, InventoryItemController)

describe('InventoryItemController metadata', () => {
  const readHandlers = [
    InventoryItemController.prototype.getOne,
    InventoryItemController.prototype.list,
    InventoryItemController.prototype.getReservation,
    InventoryItemController.prototype.getLowStock,
    InventoryItemController.prototype.getAuditLog,
  ]

  const writeHandlers = [
    InventoryItemController.prototype.create,
    InventoryItemController.prototype.update,
    InventoryItemController.prototype.stockIn,
    InventoryItemController.prototype.stockOut,
    InventoryItemController.prototype.adjust,
    InventoryItemController.prototype.reserve,
    InventoryItemController.prototype.confirmReservation,
    InventoryItemController.prototype.releaseReservation,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, InventoryItemController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse inventory:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory:read'])
    })
  })

  it('write routes should reuse inventory:update', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['inventory:update'])
    })
  })
})
