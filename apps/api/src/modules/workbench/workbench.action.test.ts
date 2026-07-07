import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY
} from '../foundation/identity-access/identity-access.decorator'
import { WorkbenchController } from './workbench.controller'
import { WorkbenchService } from './workbench.service'

describe('workbench action controller metadata', () => {
  it('approval, replay and handler routes expose protected runtime action endpoints', () => {
    assert.equal(Reflect.getMetadata('path', WorkbenchController.prototype.executeApproval), 'approvals/execute')
    assert.equal(Reflect.getMetadata('path', WorkbenchController.prototype.submitRuntimeReplay), 'actions/runtime-replay')
    assert.equal(Reflect.getMetadata('path', WorkbenchController.prototype.getActionReceipt), 'actions/:receiptCode')
    assert.equal(
      Reflect.getMetadata('path', WorkbenchController.prototype.syncHandlerReceipt),
      'handlers/:handlerName/receipts/:receiptCode/sync'
    )
    assert.equal(
      Reflect.getMetadata('path', WorkbenchController.prototype.recordHandlerCallback),
      'handlers/:handlerName/receipts/:receiptCode/callback'
    )
    assert.equal(Reflect.getMetadata('path', WorkbenchController.prototype.replayActionReceipt), 'actions/:receiptCode/replay')
  })

  it('workbench action endpoints require tenant scope with runtime-governance permissions', () => {
    const writeHandlers = [
      WorkbenchController.prototype.executeApproval,
      WorkbenchController.prototype.rotateSecret,
      WorkbenchController.prototype.submitRuntimeReplay,
      WorkbenchController.prototype.syncHandlerReceipt,
      WorkbenchController.prototype.recordHandlerCallback,
      WorkbenchController.prototype.replayActionReceipt
    ]

    writeHandlers.forEach((handler) => {
      assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
      assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), ['foundation.runtime-governance.write'])
    })

    assert.deepEqual(
      Reflect.getMetadata(ROLES_METADATA_KEY, WorkbenchController.prototype.rotateSecret),
      ['SUPER_ADMIN', 'SECURITY_ADMIN']
    )
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, WorkbenchController.prototype.getActionReceipt),
      ['foundation.runtime-governance.read']
    )
  })
})

describe('workbench action controller behavior', () => {
  it('executeApproval delegates to service with tenant and actor context', async () => {
    let capturedArgs: unknown[] = []
    const controller = new WorkbenchController({
      submitApprovalExecution: async (...args: unknown[]) => {
        capturedArgs = args
        return { receiptCode: 'REC-APPROVAL-001', state: 'challenge-issued' }
      }
    } as never)

    const result = await controller.executeApproval(
      { approvalCode: 'APP-001', idempotencyKey: 'approval:001', operatorNote: 'manual-review' },
      { tenantId: 'tenant-001', marketCode: 'cn-mainland' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )

    assert.equal(result.receiptCode, 'REC-APPROVAL-001')
    assert.equal((capturedArgs[0] as { approvalCode: string }).approvalCode, 'APP-001')
    assert.equal((capturedArgs[1] as { tenantId: string }).tenantId, 'tenant-001')
    assert.equal((capturedArgs[2] as { actorId: string }).actorId, 'ops-001')
  })

  it('sync/replay endpoints delegate to service using receipt and handler params', async () => {
    const calls: Array<{ kind: string; args: unknown[] }> = []
    const controller = new WorkbenchController({
      syncHandlerReceipt: async (...args: unknown[]) => {
        calls.push({ kind: 'sync', args })
        return { receiptCode: 'REC-001', state: 'submitted' }
      },
      replayActionReceipt: async (...args: unknown[]) => {
        calls.push({ kind: 'replay', args })
        return { receiptCode: 'REC-001', state: 'replay-scheduled' }
      }
    } as never)

    await controller.syncHandlerReceipt(
      'REC-001',
      'admin-runtime-replay-handler',
      { ticketCode: 'TICKET-001', idempotencyKey: 'sync:001' },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )
    await controller.replayActionReceipt(
      'REC-001',
      { ledgerKey: 'LEDGER-001', requestedFrom: 'ADMIN_WEB_RUNTIME', ticketCode: 'TICKET-001', idempotencyKey: 'replay:001' },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )

    assert.equal(calls[0]?.kind, 'sync')
    assert.equal(calls[0]?.args[0], 'REC-001')
    assert.equal(calls[0]?.args[1], 'admin-runtime-replay-handler')
    assert.equal(calls[1]?.kind, 'replay')
    assert.equal(calls[1]?.args[0], 'REC-001')
  })
})

describe('workbench action service', () => {
  function createService(runtimeOverrides: Record<string, unknown> = {}) {
    return new WorkbenchService(
      null as never,
      null as never,
      null as never,
      {
        submitAction: async (input: unknown) => ({ receiptCode: 'REC-SUBMIT-001', input }),
        getActionReceipt: async (receiptCode: string) => ({ receiptCode, state: 'submitted' }),
        syncAction: async (receiptCode: string, input: unknown) => ({ receiptCode, input, state: 'submitted' }),
        recordCallback: async (receiptCode: string, input: unknown) => ({ receiptCode, input, state: 'callback-recorded' }),
        replayAction: async (receiptCode: string, input: unknown) => ({ receiptCode, input, state: 'replay-scheduled' }),
        ...runtimeOverrides
      } as never
    )
  }

  it('submitApprovalExecution builds admin-web challenge request', async () => {
    let captured: Record<string, unknown> | undefined
    const service = createService({
      submitAction: async (input: Record<string, unknown>) => {
        captured = input
        return { receiptCode: 'REC-APPROVAL-001', state: 'challenge-issued' }
      }
    })

    const result = await service.submitApprovalExecution(
      { approvalCode: 'APP-001', idempotencyKey: 'approval:001', challengeProfile: 'step-up' },
      { tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001', marketCode: 'cn-mainland' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )

    assert.equal(result.receiptCode, 'REC-APPROVAL-001')
    assert.equal(captured?.app, 'admin-web')
    assert.equal(captured?.action, 'approval-execution')
    assert.equal(captured?.nextStep, 'CHALLENGE')
    assert.equal(captured?.recommendedAction, 'COMPLETE_CHALLENGE')
    assert.equal(captured?.handlerName, 'admin-approval-execution-handler')
    assert.equal((captured?.payload as { approvalCode: string }).approvalCode, 'APP-001')
    assert.equal((captured?.payload as { challengeProfile: string }).challengeProfile, 'step-up')
    assert.equal(captured?.tenantId, 'tenant-001')
    assert.equal(captured?.brandId, 'brand-001')
  })

  it('submitSecretRotation and runtime replay map to runtime governance defaults', async () => {
    const inputs: Record<string, unknown>[] = []
    const service = createService({
      submitAction: async (input: Record<string, unknown>) => {
        inputs.push(input)
        return { receiptCode: `REC-${inputs.length}`, state: 'submitted' }
      }
    })

    await service.submitSecretRotation(
      { secretName: 'db-password', idempotencyKey: 'secret:001', targetScope: 'tenant' },
      { tenantId: 'tenant-001' },
      { actorId: 'security-001', actorType: 'tenant-user', roles: ['SECURITY_ADMIN'], permissions: [], authenticated: true, source: 'headers' }
    )
    await service.submitRuntimeReplay(
      { sourceReceiptCode: 'REC-OLD-001', idempotencyKey: 'runtime:001' },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )

    assert.equal(inputs[0]?.action, 'secret-rotation')
    assert.equal(inputs[0]?.nextStep, 'REFRESH')
    assert.equal(inputs[0]?.recommendedAction, 'REFRESH_BOOTSTRAP')
    assert.equal((inputs[0]?.payload as { secretName: string }).secretName, 'db-password')
    assert.equal((inputs[0]?.payload as { targetScope: string }).targetScope, 'tenant')
    assert.equal(inputs[1]?.action, 'runtime-replay')
    assert.equal(inputs[1]?.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK')
    assert.equal((inputs[1]?.payload as { sourceReceiptCode: string }).sourceReceiptCode, 'REC-OLD-001')
  })

  it('sync/callback/replay delegate to runtime governance service with enriched context', async () => {
    const captured: Array<{ kind: string; receiptCode: string; input: Record<string, unknown> }> = []
    const service = createService({
      syncAction: async (receiptCode: string, input: Record<string, unknown>) => {
        captured.push({ kind: 'sync', receiptCode, input })
        return { receiptCode, state: 'submitted' }
      },
      recordCallback: async (receiptCode: string, input: Record<string, unknown>) => {
        captured.push({ kind: 'callback', receiptCode, input })
        return { receiptCode, state: 'callback-recorded' }
      },
      replayAction: async (receiptCode: string, input: Record<string, unknown>) => {
        captured.push({ kind: 'replay', receiptCode, input })
        return { receiptCode, state: 'replay-scheduled' }
      }
    })

    await service.syncHandlerReceipt(
      'REC-001',
      'admin-runtime-replay-handler',
      { ticketCode: 'TICKET-001', idempotencyKey: 'sync:001' },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )
    await service.recordHandlerCallback(
      'REC-001',
      'admin-runtime-replay-handler',
      {
        callbackStatus: 'callback-recorded',
        ackToken: 'ACK-001',
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'callback ok',
        idempotencyKey: 'callback:001'
      },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )
    await service.replayActionReceipt(
      'REC-001',
      {
        ledgerKey: 'LEDGER-001',
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: 'TICKET-001',
        idempotencyKey: 'replay:001'
      },
      { tenantId: 'tenant-001' },
      { actorId: 'ops-001', actorType: 'store-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' }
    )

    assert.deepEqual(
      captured.map((item) => item.kind),
      ['sync', 'callback', 'replay']
    )
    assert.equal(captured[0]?.input.handlerName, 'admin-runtime-replay-handler')
    assert.equal(captured[0]?.input.actorId, 'ops-001')
    assert.equal(captured[1]?.input.callbackStatus, 'callback-recorded')
    assert.equal(captured[2]?.input.requestedFrom, 'ADMIN_WEB_RUNTIME')
  })
})
