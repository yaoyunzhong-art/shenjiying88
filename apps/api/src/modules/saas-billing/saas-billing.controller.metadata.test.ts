import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SaaSBillingController } from './saas-billing.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, SaaSBillingController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, SaaSBillingController)

describe('SaaSBillingController metadata', () => {
  const readHandlers = [
    SaaSBillingController.prototype.listPlans,
    SaaSBillingController.prototype.getPlan,
    SaaSBillingController.prototype.getSubscription,
    SaaSBillingController.prototype.getQuotaUsage,
    SaaSBillingController.prototype.calculateOverage,
    SaaSBillingController.prototype.listInvoices,
    SaaSBillingController.prototype.checkTrialStatus,
  ]

  const writeHandlers = [
    SaaSBillingController.prototype.createPlan,
    SaaSBillingController.prototype.subscribe,
    SaaSBillingController.prototype.changePlan,
    SaaSBillingController.prototype.cancelSubscription,
    SaaSBillingController.prototype.renewSubscription,
    SaaSBillingController.prototype.recordUsage,
    SaaSBillingController.prototype.checkQuota,
    SaaSBillingController.prototype.generateInvoice,
    SaaSBillingController.prototype.markPaid,
    SaaSBillingController.prototype.startTrial,
    SaaSBillingController.prototype.convertTrial,
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
