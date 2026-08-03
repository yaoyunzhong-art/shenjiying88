import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CashierTransactionController } from './transaction.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CashierTransactionController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CashierTransactionController)

describe('CashierTransactionController metadata', () => {
  const readHandlers = [
    CashierTransactionController.prototype.query,
    CashierTransactionController.prototype.getById,
    CashierTransactionController.prototype.dailySummary,
    CashierTransactionController.prototype.monthlySummary,
    CashierTransactionController.prototype.stats,
  ]

  const writeHandlers = [
    CashierTransactionController.prototype.create,
    CashierTransactionController.prototype.enqueueOffline,
    CashierTransactionController.prototype.flushOffline,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, CashierTransactionController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse order:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['order:read'])
    })
  })

  it('write routes should reuse order:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['order:write'])
    })
  })
})
