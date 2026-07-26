import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ReturnRequestController } from './return-request.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ReturnRequestController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ReturnRequestController)

describe('ReturnRequestController metadata', () => {
  const readHandlers = [
    ReturnRequestController.prototype.createReturn,
    ReturnRequestController.prototype.listReturns,
    ReturnRequestController.prototype.getPendingReturns,
    ReturnRequestController.prototype.getReturnsByCustomer,
    ReturnRequestController.prototype.getReturnsByOrder,
  ]

  const detailHandlers = [
    ReturnRequestController.prototype.getReturn,
    ReturnRequestController.prototype.updateReturn,
    ReturnRequestController.prototype.deleteReturn,
    ReturnRequestController.prototype.updateReturnStatus,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...detailHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('list and query routes should reuse returns:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['returns:read'])
    })
  })

  it('detail and mutation routes should reuse returns:id:read', () => {
    detailHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['returns:id:read'])
    })
  })
})
