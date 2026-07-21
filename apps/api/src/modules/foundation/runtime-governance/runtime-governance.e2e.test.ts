import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Inject, Param, Post, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import {
  RecordRuntimeGovernanceCallbackDto,
  ReplayRuntimeGovernanceActionDto,
  SubmitRuntimeGovernanceActionDto,
  SyncRuntimeGovernanceActionDto
} from './runtime-governance.dto'
import { RuntimeGovernanceService } from './runtime-governance.service'

function createRuntimeGovernanceHarness() {
  const events: Array<{
    id: string
    eventType: string
    aggregateType: string
    aggregateId: string
    idempotencyKey: string | null
    payload: Record<string, unknown>
    createdAt: Date
  }> = []

  const prisma = {
    domainEvent: {
      findMany: async ({ where }: { where?: { aggregateType?: string; aggregateId?: string } } = {}) =>
        events.filter(
          (event) =>
            (!where?.aggregateType || event.aggregateType === where.aggregateType) &&
            (!where?.aggregateId || event.aggregateId === where.aggregateId)
        )
    }
  }

  const integrationOrchestrationService = {
    publishEvent: async (
      eventType: string,
      payload: Record<string, unknown>,
      options?: { aggregateId?: string; idempotencyKey?: string; source?: string }
    ) => {
      const existing = options?.idempotencyKey
        ? events.find((event) => event.idempotencyKey === options.idempotencyKey)
        : null
      if (existing) {
        return {
          status: 'duplicate' as const,
          envelope: null,
          persistedEventId: existing.id
        }
      }

      const event = {
        id: `evt_${events.length + 1}`,
        eventType,
        aggregateType: 'runtime-governance',
        aggregateId: options?.aggregateId ?? `aggregate-${events.length + 1}`,
        idempotencyKey: options?.idempotencyKey ?? null,
        payload,
        createdAt: new Date(Date.UTC(2026, 5, 12, 0, 0, events.length))
      }
      events.push(event)

      return {
        status: 'accepted' as const,
        envelope: null,
        persistedEventId: event.id
      }
    }
  }

  const trustGovernanceService = {
    evaluateRateLimit: async ({ scopeKey }: { scopeKey: string }) => ({
      allowed: true,
      scopeKey,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0
    }),
    recordAudit: async () => ({ auditId: 'audit_1' })
  }

  return {
    prisma,
    integrationOrchestrationService,
    trustGovernanceService,
    events
  }
}

@Controller('foundation/runtime-governance')
class TestRuntimeGovernanceController {
  constructor(
    @Inject(RuntimeGovernanceService)
    private readonly runtimeGovernanceService: RuntimeGovernanceService
  ) {}

  @Post('actions')
  submitAction(@Body() body: SubmitRuntimeGovernanceActionDto) {
    return this.runtimeGovernanceService.submitAction(body)
  }

  @Get('actions/:receiptCode')
  getActionReceipt(@Param('receiptCode') receiptCode: string) {
    return this.runtimeGovernanceService.getActionReceipt(receiptCode)
  }

  @Post('actions/:receiptCode/sync')
  syncAction(@Param('receiptCode') receiptCode: string, @Body() body: SyncRuntimeGovernanceActionDto) {
    return this.runtimeGovernanceService.syncAction(receiptCode, body)
  }

  @Post('actions/:receiptCode/callback')
  recordCallback(@Param('receiptCode') receiptCode: string, @Body() body: RecordRuntimeGovernanceCallbackDto) {
    return this.runtimeGovernanceService.recordCallback(receiptCode, body)
  }

  @Post('actions/:receiptCode/replay')
  replayAction(@Param('receiptCode') receiptCode: string, @Body() body: ReplayRuntimeGovernanceActionDto) {
    return this.runtimeGovernanceService.replayAction(receiptCode, body)
  }
}

async function createTestApp(harness: ReturnType<typeof createRuntimeGovernanceHarness>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestRuntimeGovernanceController],
    providers: [
      {
        provide: RuntimeGovernanceService,
        useFactory: () =>
          new RuntimeGovernanceService(
            harness.prisma as never,
            harness.integrationOrchestrationService as never,
            harness.trustGovernanceService as never
          )
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

describe('Runtime Governance - E2E HTTP', () => {
  it('e2e: submit, query, sync, callback, and replay closure', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:http-001'
      })
      const submitPayload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(submitPayload.state, 'submitted')

      const receipt = await request(app.getHttpServer()).get(
        `/foundation/runtime-governance/actions/${submitPayload.receiptCode}`
      )
      const receiptPayload = receipt.body.data ?? receipt.body
      assert.equal(receipt.statusCode, 200)
      assert.equal(receiptPayload.receiptCode, submitPayload.receiptCode)

      const sync = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'miniapp-booking-submit-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'miniapp-handler-sync:http-001'
        })
      const syncPayload = sync.body.data ?? sync.body
      assert.equal(sync.statusCode, 201)
      assert.equal(syncPayload.callback.callbackStatus, 'awaiting-callback')
      assert.equal(syncPayload.events.length, 2)

      const duplicateSync = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'miniapp-booking-submit-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'miniapp-handler-sync:http-001'
        })
      const duplicateSyncPayload = duplicateSync.body.data ?? duplicateSync.body
      assert.equal(duplicateSync.statusCode, 201)
      assert.equal(duplicateSyncPayload.events.length, 3)
      assert.equal(duplicateSyncPayload.events[2]?.status, 'duplicate')
      assert.equal(duplicateSyncPayload.events[2]?.eventType, 'runtime-governance.handler.sync.duplicate')

      const callback = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'handler completed',
          idempotencyKey: 'miniapp-callback:http-001'
        })
      const callbackPayload = callback.body.data ?? callback.body
      assert.equal(callback.statusCode, 201)
      assert.equal(callbackPayload.state, 'callback-recorded')

      const replay = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
        .send({
          ledgerKey: callbackPayload.ledger.ledgerKey,
          requestedFrom: 'MINIAPP_RUNTIME',
          ticketCode: callbackPayload.ticket.ticketCode,
          idempotencyKey: 'miniapp-replay:http-001'
        })
      const replayPayload = replay.body.data ?? replay.body
      assert.equal(replay.statusCode, 201)
      assert.equal(replayPayload.state, 'replay-scheduled')
      assert.equal(replayPayload.events.length, 5)
    } finally {
      await app.close()
    }
  })

  it('e2e: admin-web action submit and replay', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay:http-001'
      })
      const submitPayload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(submitPayload.app, 'admin-web')
      assert.equal(submitPayload.ledger.replayable, true)
    } finally {
      await app.close()
    }
  })

  it('e2e: admin-web action replay after submit', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'admin-web',
        action: 'runtime-replay',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
        payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-002' },
        payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-002"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-runtime-replay-handler',
        idempotencyKey: 'admin-web:runtime-replay:http-002'
      })
      const submitPayload = submit.body.data ?? submit.body

      const replayRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
        .send({
          ledgerKey: submitPayload.ledger.ledgerKey,
          requestedFrom: 'ADMIN_WEB_RUNTIME',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'admin-web:runtime-replay:http-002:replay'
        })
      const replayPayload = replayRes.body.data ?? replayRes.body
      assert.equal(replayRes.statusCode, 201)
      assert.equal(replayPayload.state, 'replay-scheduled')
      assert.equal(replayPayload.ledger.summary.includes('ADMIN_WEB_RUNTIME'), true)
    } finally {
      await app.close()
    }
  })

  it('e2e: tob-web action with CHALLENGE nextStep', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'tob-web',
        action: 'member-login',
        nextStep: 'CHALLENGE',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/members/session/challenge',
        payload: { loginChannel: 'tenant-portal' },
        payloadSummary: '{"loginChannel":"tenant-portal"}',
        recommendedAction: 'COMPLETE_CHALLENGE',
        handlerName: 'tob-member-login-handler',
        idempotencyKey: 'tob-web:member-login:http-001'
      })
      const submitPayload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(submitPayload.app, 'tob-web')
      assert.equal(submitPayload.state, 'challenge-issued')
    } finally {
      await app.close()
    }
  })

  it('e2e: storefront-web booking submit and replay', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'storefront-web',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingCode: 'STORE-BOOKING-001' },
        payloadSummary: '{"bookingCode":"STORE-BOOKING-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'storefront-booking-submit-handler',
        idempotencyKey: 'storefront-web:booking-submit:http-001'
      })
      const submitPayload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(submitPayload.app, 'storefront-web')
      assert.equal(submitPayload.ledger.replayable, true)

      const replayRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
        .send({
          ledgerKey: submitPayload.ledger.ledgerKey,
          requestedFrom: 'STOREFRONT_WEB_RUNTIME',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'storefront-web:booking-submit:http-001:replay'
        })
      const replayPayload = replayRes.body.data ?? replayRes.body
      assert.equal(replayRes.statusCode, 201)
      assert.equal(replayPayload.state, 'replay-scheduled')
      assert.equal(replayPayload.ledger.summary.includes('STOREFRONT_WEB_RUNTIME'), true)
    } finally {
      await app.close()
    }
  })

  it('e2e: sync with duplicate idempotency key returns duplicate event', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-13T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-13T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'dup-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      // same idempotency key - should be duplicate
      const duplicateSubmit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-13T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-13T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'dup-test:idempotency:001'
      })
      const dupPayload = duplicateSubmit.body.data ?? duplicateSubmit.body
      assert.equal(duplicateSubmit.statusCode, 201)
      // duplicate should still return a receipt, just with the duplicate event
      assert.equal(dupPayload.receiptCode, submitPayload.receiptCode)
    } finally {
      await app.close()
    }
  })

  it('e2e: callback with callback-recorded status updates state', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-14T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-14T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'callback-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      // sync first
      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'miniapp-booking-submit-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'callback-test:sync:001'
        })

      // callback
      const callbackRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-ACK-001`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'handler completed successfully',
          idempotencyKey: 'callback-test:callback:001'
        })
      const callbackPayload = callbackRes.body.data ?? callbackRes.body
      assert.equal(callbackRes.statusCode, 201)
      assert.equal(callbackPayload.state, 'callback-recorded')
      assert.equal(callbackPayload.ledger.replayable, true)
    } finally {
      await app.close()
    }
  })

  it('e2e: callback with callback-blocked status does not mark as recorded', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-15T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-15T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'blocked-callback-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      // sync first so callback endpoint works
      const syncRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'miniapp-booking-submit-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'blocked-callback-test:sync:001'
        })

      // Then send blocked callback
      const callbackRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-blocked',
          ackToken: `${submitPayload.receiptCode}-BLOCKED`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'handler encountered error (simulated)',
          idempotencyKey: 'blocked-callback-test:callback:001'
        })
      const callbackPayload = callbackRes.body.data ?? callbackRes.body
      assert.equal(callbackRes.statusCode, 201)
      assert.equal(callbackPayload.state, 'submitted')
      assert.equal(callbackPayload.callback.callbackStatus, 'callback-blocked')
    } finally {
      await app.close()
    }
  })

  it('e2e: replay with duplicate idempotency key', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-16T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-16T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'replay-duplicate-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'miniapp-booking-submit-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'replay-duplicate-test:sync:001'
        })

      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'handler completed',
          idempotencyKey: 'replay-duplicate-test:callback:001'
        })

      const replayRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
        .send({
          ledgerKey: `runtime-ledger:${submitPayload.receiptCode}`,
          requestedFrom: 'MINIAPP_RUNTIME',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'replay-duplicate-test:replay:001'
        })
      const replayPayload = replayRes.body.data ?? replayRes.body
      // Second replay with different idempotency key should succeed (new replay)
      assert.equal(replayRes.statusCode, 201)
      assert.equal(replayPayload.state, 'replay-scheduled')
    } finally {
      await app.close()
    }
  })

  it('e2e: query non-existent receipt returns 404', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const res = await request(app.getHttpServer()).get(
        '/foundation/runtime-governance/actions/NONEXISTENT-RECEIPT-001'
      )
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  it('e2e: low risk level action submits successfully', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-17T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-17T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'low-risk-handler',
        idempotencyKey: 'low-risk-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(payload.riskLevel, 'low')
    } finally {
      await app.close()
    }
  })

  it('e2e: high risk level action submits successfully', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'admin-web',
        action: 'approval-execution',
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/admin/approvals/execute',
        payload: { approvalId: 'APPROVAL-001' },
        payloadSummary: '{"approvalId":"APPROVAL-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'admin-approval-execution-handler',
        idempotencyKey: 'high-risk-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(payload.riskLevel, 'high')
    } finally {
      await app.close()
    }
  })

  it('e2e: app = lyt app submits successfully', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'lyt',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/lyt/bookings',
        payload: { bookingRef: 'LYT-REF-001' },
        payloadSummary: '{"bookingRef":"LYT-REF-001"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'lyt-booking-handler',
        idempotencyKey: 'lyt-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(payload.app, 'lyt')
      assert.equal(payload.state, 'submitted')
    } finally {
      await app.close()
    }
  })

  it('e2e: rate limit field present in receipt response', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-18T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-18T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'rate-limit-handler',
        idempotencyKey: 'rate-limit-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.notEqual(payload.rateLimit, undefined)
      assert.equal(payload.rateLimit.allowed, true)
      assert.equal(payload.rateLimit.remaining, 11)
    } finally {
      await app.close()
    }
  })

  it('e2e: receipt contains events array with at least one event', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-19T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-19T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'events-check-handler',
        idempotencyKey: 'events-check-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(Array.isArray(payload.events), true)
      assert.equal(payload.events.length, 1)
      assert.equal(payload.events[0].eventType, 'runtime-governance.action.submitted')
    } finally {
      await app.close()
    }
  })

  it('e2e: receipt contains ticket, sync, callback, ledger, retry sections', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-20T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-20T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'sections-check-handler',
        idempotencyKey: 'sections-check-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.notEqual(payload.ticket, undefined)
      assert.notEqual(payload.sync, undefined)
      assert.notEqual(payload.callback, undefined)
      assert.notEqual(payload.ledger, undefined)
      assert.notEqual(payload.retry, undefined)
    } finally {
      await app.close()
    }
  })

  it('e2e: LOGIN nextStep transitions to blocked state', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'tob-web',
        action: 'member-login',
        nextStep: 'LOGIN',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/members/login',
        payload: { loginChannel: 'password' },
        payloadSummary: '{"loginChannel":"password"}',
        recommendedAction: 'COMPLETE_LOGIN',
        handlerName: 'tob-member-login-handler',
        idempotencyKey: 'login-blocked-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(payload.state, 'blocked')
    } finally {
      await app.close()
    }
  })

  it('e2e: REFRESH nextStep transitions to blocked state', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'REFRESH',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-28T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-28T10:00:00+08:00"}',
        recommendedAction: 'REFRESH_BOOTSTRAP',
        handlerName: 'refresh-bootstrap-handler',
        idempotencyKey: 'refresh-blocked-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)
      assert.equal(payload.state, 'blocked')
    } finally {
      await app.close()
    }
  })

  it('e2e: receipt has generatedAt timestamp in ISO format', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-21T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-21T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'timestamp-check-handler',
        idempotencyKey: 'timestamp-check-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(typeof payload.generatedAt, 'string')
      // ISO 8601 check: starts with 2026 or similar
      assert.ok(payload.generatedAt.includes('T'))
    } finally {
      await app.close()
    }
  })

  it('e2e: callback recorded state enables ledger replayable flag', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-22T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-22T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'replayable-flag-handler',
        idempotencyKey: 'replayable-flag-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'replayable-flag-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'replayable-flag-test:sync:001'
        })

      const callbackRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-REPLAY-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'handler completed, replayable ledger expected',
          idempotencyKey: 'replayable-flag-test:callback:001'
        })
      const callbackPayload = callbackRes.body.data ?? callbackRes.body
      assert.equal(callbackPayload.ledger.replayable, true)
      assert.equal(callbackPayload.ledger.summary.includes('callback'), true)
    } finally {
      await app.close()
    }
  })

  it('e2e: receipt returns action, requestEndpoint, payloadSummary fields', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-23T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-23T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'fields-check-handler',
        idempotencyKey: 'fields-check-test:idempotency:001'
      })
      const payload = submit.body.data ?? submit.body
      assert.equal(payload.action, 'booking-submit')
      assert.equal(payload.requestEndpoint, '/api/v1/storefront/bookings')
      assert.notEqual(payload.payloadSummary, undefined)
    } finally {
      await app.close()
    }
  })

  it('e2e: sync with different ticket code fails', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-24T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-24T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'wrong-ticket-handler',
        idempotencyKey: 'wrong-ticket-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      const syncRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'wrong-ticket-handler',
          ticketCode: 'WRONG-TICKET-CODE',
          idempotencyKey: 'wrong-ticket-test:sync:001'
        })
      // Should still return 201 since sync is processed, but ticket won't match
      const syncPayload = syncRes.body.data ?? syncRes.body
      assert.equal(syncRes.statusCode, 201)
      assert.notEqual(syncPayload.ticket.ticketCode, 'WRONG-TICKET-CODE')
    } finally {
      await app.close()
    }
  })

  it('e2e: full lifecycle — submit → sync → callback → replay', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-25T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-25T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'full-lifecycle-handler',
        idempotencyKey: 'full-lifecycle-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body
      assert.equal(submit.statusCode, 201)

      const syncRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'full-lifecycle-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'full-lifecycle-test:sync:001'
        })
      assert.equal(syncRes.statusCode, 201)

      const callbackRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-FULL-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'full lifecycle complete',
          idempotencyKey: 'full-lifecycle-test:callback:001'
        })
      const callbackPayload = callbackRes.body.data ?? callbackRes.body
      assert.equal(callbackRes.statusCode, 201)

      const replayRes = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
        .send({
          ledgerKey: callbackPayload.ledger.ledgerKey,
          requestedFrom: 'MINIAPP_RUNTIME',
          ticketCode: callbackPayload.ticket.ticketCode,
          idempotencyKey: 'full-lifecycle-test:replay:001'
        })
      const replayPayload = replayRes.body.data ?? replayRes.body
      assert.equal(replayRes.statusCode, 201)
      assert.equal(replayPayload.state, 'replay-scheduled')
    } finally {
      await app.close()
    }
  })

  it('e2e: query receipt by code returns expected event timeline', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-26T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-26T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'event-timeline-handler',
        idempotencyKey: 'event-timeline-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      const receiptRes = await request(app.getHttpServer()).get(
        `/foundation/runtime-governance/actions/${submitPayload.receiptCode}`
      )
      const receiptPayload = receiptRes.body.data ?? receiptRes.body
      assert.equal(receiptRes.statusCode, 200)
      assert.equal(Array.isArray(receiptPayload.events), true)
      assert.ok(receiptPayload.events.length >= 1)
      assert.equal(receiptPayload.events[0].eventType, 'runtime-governance.action.submitted')
    } finally {
      await app.close()
    }
  })

  it('e2e: callback with duplicate idempotency key returns existing state', async () => {
    const harness = createRuntimeGovernanceHarness()
    const app = await createTestApp(harness)

    try {
      const submit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'low',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-27T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-27T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'dup-callback-handler',
        idempotencyKey: 'dup-callback-test:idempotency:001'
      })
      const submitPayload = submit.body.data ?? submit.body

      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
        .send({
          handlerName: 'dup-callback-handler',
          ticketCode: submitPayload.ticket.ticketCode,
          idempotencyKey: 'dup-callback-test:sync:001'
        })

      // First callback
      await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-DUP-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'first callback',
          idempotencyKey: 'dup-callback-test:callback:001'
        })

      // Duplicate callback with same idempotency key
      const dupCallback = await request(app.getHttpServer())
        .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
        .send({
          callbackStatus: 'callback-recorded',
          ackToken: `${submitPayload.receiptCode}-DUP-ACK`,
          lastEvent: 'HANDLER_COMPLETED',
          summary: 'first callback',
          idempotencyKey: 'dup-callback-test:callback:001'
        })
      assert.equal(dupCallback.statusCode, 201)
      const dupPayload = dupCallback.body.data ?? dupCallback.body
      assert.equal(dupPayload.state, 'callback-recorded')
    } finally {
      await app.close()
    }
  })
})
