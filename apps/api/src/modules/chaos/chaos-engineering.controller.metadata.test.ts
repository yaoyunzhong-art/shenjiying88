import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ChaosEngineeringController } from './chaos-engineering.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ChaosEngineeringController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ChaosEngineeringController)

describe('ChaosEngineeringController metadata', () => {
  const readHandlers = [
    ChaosEngineeringController.prototype.listExperiments,
    ChaosEngineeringController.prototype.getExperiment,
    ChaosEngineeringController.prototype.getExperimentResult,
    ChaosEngineeringController.prototype.getActiveFaults,
    ChaosEngineeringController.prototype.getRollbackHistory,
    ChaosEngineeringController.prototype.getExperimentRollbackHistory,
  ]

  const writeHandlers = [
    ChaosEngineeringController.prototype.createExperiment,
    ChaosEngineeringController.prototype.runExperiment,
    ChaosEngineeringController.prototype.pauseExperiment,
    ChaosEngineeringController.prototype.injectLatency,
    ChaosEngineeringController.prototype.injectError,
    ChaosEngineeringController.prototype.injectTimeout,
    ChaosEngineeringController.prototype.injectCPUBurn,
    ChaosEngineeringController.prototype.stopFault,
    ChaosEngineeringController.prototype.monitorHealth,
    ChaosEngineeringController.prototype.triggerRollback,
  ]

  it('controller should keep chaos path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', ChaosEngineeringController), 'chaos')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, ChaosEngineeringController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ChaosEngineeringController), {})
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ChaosEngineeringController),
      ['foundation.governance.read'],
    )
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ChaosEngineeringController.prototype.createExperiment, 1, 'experiments'],
      [ChaosEngineeringController.prototype.listExperiments, 0, 'experiments'],
      [ChaosEngineeringController.prototype.getExperiment, 0, 'experiments/:id'],
      [ChaosEngineeringController.prototype.runExperiment, 1, 'experiments/:id/run'],
      [ChaosEngineeringController.prototype.pauseExperiment, 1, 'experiments/:id/pause'],
      [ChaosEngineeringController.prototype.getExperimentResult, 0, 'experiments/:id/result'],
      [ChaosEngineeringController.prototype.injectLatency, 1, 'faults/latency'],
      [ChaosEngineeringController.prototype.injectError, 1, 'faults/error'],
      [ChaosEngineeringController.prototype.injectTimeout, 1, 'faults/timeout'],
      [ChaosEngineeringController.prototype.injectCPUBurn, 1, 'faults/cpu-burn'],
      [ChaosEngineeringController.prototype.stopFault, 1, 'faults/:target/stop'],
      [ChaosEngineeringController.prototype.getActiveFaults, 0, 'faults'],
      [ChaosEngineeringController.prototype.monitorHealth, 1, 'health/monitor'],
      [ChaosEngineeringController.prototype.triggerRollback, 1, 'health/rollback'],
      [ChaosEngineeringController.prototype.getRollbackHistory, 0, 'rollbacks'],
      [ChaosEngineeringController.prototype.getExperimentRollbackHistory, 0, 'rollbacks/:experimentId'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })

  it('read routes should reuse governance read permission', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse recovery write permission', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.operations.recovery.write'])
    })
  })
})
