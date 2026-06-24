import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSync } from 'class-validator'
import {
  RecordRuntimeGovernanceCallbackDto,
  ReplayRuntimeGovernanceActionDto,
  SubmitRuntimeGovernanceActionDto
} from './runtime-governance.dto'

test('runtime governance dto accepts shared submit enums and rejects non-api actions', () => {
  const validDto = Object.assign(new SubmitRuntimeGovernanceActionDto(), {
    app: 'admin-web',
    action: 'runtime-replay',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
    payload: { sourceReceiptCode: 'receipt-001' },
    payloadSummary: '{"sourceReceiptCode":"receipt-001"}',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'admin-runtime-replay-handler',
    idempotencyKey: 'admin-web:runtime-replay:submit:001'
  })
  const invalidDto = Object.assign(new SubmitRuntimeGovernanceActionDto(), {
    ...validDto,
    action: 'webhook-callback'
  })

  assert.equal(validateSync(validDto).length, 0)
  assert.equal(validateSync(invalidDto).some((error) => error.property === 'action'), true)
})

test('runtime governance dto accepts shared callback and replay enums', () => {
  const callbackDto = Object.assign(new RecordRuntimeGovernanceCallbackDto(), {
    callbackStatus: 'callback-recorded',
    ackToken: 'ack-token',
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler callback recorded',
    idempotencyKey: 'callback:001'
  })
  const replayDto = Object.assign(new ReplayRuntimeGovernanceActionDto(), {
    ledgerKey: 'runtime-ledger:receipt-001',
    requestedFrom: 'TOB_WEB_RUNTIME',
    ticketCode: 'ticket-001',
    idempotencyKey: 'replay:001'
  })

  assert.equal(validateSync(callbackDto).length, 0)
  assert.equal(validateSync(replayDto).length, 0)
})
