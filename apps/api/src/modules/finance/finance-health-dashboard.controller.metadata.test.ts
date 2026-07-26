import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FinanceHealthDashboardController } from './finance-health-dashboard.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, FinanceHealthDashboardController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, FinanceHealthDashboardController)

describe('FinanceHealthDashboardController metadata', () => {
  const readHandlers = [
    FinanceHealthDashboardController.prototype.getDashboard,
    FinanceHealthDashboardController.prototype.getCostAnalysis,
    FinanceHealthDashboardController.prototype.getCashFlow,
  ]

  const writeHandlers = [
    FinanceHealthDashboardController.prototype.recordInflow,
    FinanceHealthDashboardController.prototype.recordOutflow,
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
