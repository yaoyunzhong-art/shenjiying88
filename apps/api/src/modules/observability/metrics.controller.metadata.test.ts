import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, MetricsController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, MetricsController)

describe('MetricsController metadata', () => {
  const publicHandlers = [
    MetricsController.prototype.getMetrics,
    MetricsController.prototype.getHealth,
  ]

  const readHandlers = [
    MetricsController.prototype.listMetrics,
    MetricsController.prototype.listAlertRules,
    MetricsController.prototype.getAlertRule,
    MetricsController.prototype.getActiveAlerts,
    MetricsController.prototype.getAlertHistory,
    MetricsController.prototype.getChaosPresets,
    MetricsController.prototype.listChaosExperiments,
    MetricsController.prototype.getChaosExperiment,
    MetricsController.prototype.getSLOTargets,
    MetricsController.prototype.listDashboards,
    MetricsController.prototype.getDashboard,
    MetricsController.prototype.getOncallSchedule,
    MetricsController.prototype.listOncallEngineers,
    MetricsController.prototype.listRunbooks,
    MetricsController.prototype.getRunbook,
  ]

  const writeHandlers = [
    MetricsController.prototype.createAlertRule,
    MetricsController.prototype.updateAlertRule,
    MetricsController.prototype.deleteAlertRule,
    MetricsController.prototype.evaluateAlerts,
    MetricsController.prototype.startChaosExperiment,
    MetricsController.prototype.rollbackChaosExperiment,
    MetricsController.prototype.rollbackAllChaosExperiments,
    MetricsController.prototype.evaluateSLO,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, MetricsController), undefined)
  })

  it('protected routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })

  it('public probe routes should stay permissionless', () => {
    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
      assert.equal(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), undefined)
      assert.equal(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), undefined)
    })
  })
})
