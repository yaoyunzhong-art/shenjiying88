import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FinanceReconciliationController } from './finance-reconciliation.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, FinanceReconciliationController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, FinanceReconciliationController)

describe('FinanceReconciliationController metadata', () => {
  const readHandlers = [
    FinanceReconciliationController.prototype.listBatches,
    FinanceReconciliationController.prototype.getBatch,
    FinanceReconciliationController.prototype.getBatchProgress,
    FinanceReconciliationController.prototype.getBatchSummary,
    FinanceReconciliationController.prototype.listTransactions,
    FinanceReconciliationController.prototype.getTransaction,
    FinanceReconciliationController.prototype.getReconciliationStats,
    FinanceReconciliationController.prototype.queryReconciliationHistory,
    FinanceReconciliationController.prototype.getChannels,
  ]

  const writeHandlers = [
    FinanceReconciliationController.prototype.createBatch,
    FinanceReconciliationController.prototype.completeBatch,
    FinanceReconciliationController.prototype.createTransaction,
    FinanceReconciliationController.prototype.updateTransaction,
    FinanceReconciliationController.prototype.autoMatch,
    FinanceReconciliationController.prototype.manualMatch,
    FinanceReconciliationController.prototype.manualAdjustment,
    FinanceReconciliationController.prototype.importExternalTransactions,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
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
