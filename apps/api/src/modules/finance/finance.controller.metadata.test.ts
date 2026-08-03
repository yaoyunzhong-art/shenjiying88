import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FinanceController } from './finance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, FinanceController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, FinanceController)

describe('FinanceController metadata', () => {
  const readHandlers = [
    FinanceController.prototype.listLedgers,
    FinanceController.prototype.getLedger,
    FinanceController.prototype.listAccounts,
    FinanceController.prototype.getAccount,
    FinanceController.prototype.getAccountBalance,
    FinanceController.prototype.listSettlements,
    FinanceController.prototype.getSettlement,
    FinanceController.prototype.getSettlementDetail,
    FinanceController.prototype.listInvoices,
    FinanceController.prototype.getInvoice,
    FinanceController.prototype.getRevenueSummary,
    FinanceController.prototype.getRevenueSummaryAlias,
    FinanceController.prototype.getDailyRevenue,
    FinanceController.prototype.getDailyRevenueAlias,
    FinanceController.prototype.listArchivals,
    FinanceController.prototype.getArchival,
  ]

  const writeHandlers = [
    FinanceController.prototype.recordLedger,
    FinanceController.prototype.deleteLedger,
    FinanceController.prototype.createAccount,
    FinanceController.prototype.freezeAccount,
    FinanceController.prototype.closeAccount,
    FinanceController.prototype.createSettlement,
    FinanceController.prototype.confirmSettlement,
    FinanceController.prototype.disputeSettlement,
    FinanceController.prototype.finalizeSettlement,
    FinanceController.prototype.createInvoice,
    FinanceController.prototype.issueInvoice,
    FinanceController.prototype.cancelInvoice,
    FinanceController.prototype.createArchival,
    FinanceController.prototype.recordTransactionRevenue,
    FinanceController.prototype.recordTransactionRefund,
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
