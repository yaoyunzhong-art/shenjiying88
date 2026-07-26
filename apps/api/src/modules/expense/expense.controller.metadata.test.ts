import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { ExpenseController } from './expense.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ExpenseController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ExpenseController)
  )
}

describe('ExpenseController metadata', () => {
  const readHandlers = [
    ExpenseController.prototype.getExpense,
    ExpenseController.prototype.listExpenses,
    ExpenseController.prototype.getSummary,
  ]

  const writeHandlers = [
    ExpenseController.prototype.createExpense,
    ExpenseController.prototype.submitExpense,
    ExpenseController.prototype.deleteExpense,
    ExpenseController.prototype.approveExpense,
    ExpenseController.prototype.reimburseExpense,
    ExpenseController.prototype.cancelExpense,
  ]

  it('controller should keep expense path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', ExpenseController), 'expense')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, ExpenseController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[
      ...readHandlers,
      ...writeHandlers,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse finance:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:read'])
    })
  })

  it('write routes should reuse finance:*', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:*'])
    })
  })
})
