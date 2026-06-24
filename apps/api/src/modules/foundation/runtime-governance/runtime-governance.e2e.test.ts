import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
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
    trustGovernanceService
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

test('e2e: runtime governance endpoints expose submit, sync, query, callback, and replay closure', async () => {
  const harness = createRuntimeGovernanceHarness()

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

    const adminSubmit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
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
    const adminSubmitPayload = adminSubmit.body.data ?? adminSubmit.body
    assert.equal(adminSubmit.statusCode, 201)
    assert.equal(adminSubmitPayload.app, 'admin-web')
    assert.equal(adminSubmitPayload.ledger.replayable, true)

    const adminReplay = await request(app.getHttpServer())
      .post(`/foundation/runtime-governance/actions/${adminSubmitPayload.receiptCode}/replay`)
      .send({
        ledgerKey: adminSubmitPayload.ledger.ledgerKey,
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: adminSubmitPayload.ticket.ticketCode,
        idempotencyKey: 'admin-web:runtime-replay:http-001:replay'
      })
    const adminReplayPayload = adminReplay.body.data ?? adminReplay.body
    assert.equal(adminReplay.statusCode, 201)
    assert.equal(adminReplayPayload.state, 'replay-scheduled')
    assert.equal(adminReplayPayload.ledger.summary.includes('ADMIN_WEB_RUNTIME'), true)

    const tobSubmit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
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
    const tobSubmitPayload = tobSubmit.body.data ?? tobSubmit.body
    assert.equal(tobSubmit.statusCode, 201)
    assert.equal(tobSubmitPayload.app, 'tob-web')
    assert.equal(tobSubmitPayload.state, 'challenge-issued')

    const storefrontSubmit = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
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
    const storefrontSubmitPayload = storefrontSubmit.body.data ?? storefrontSubmit.body
    assert.equal(storefrontSubmit.statusCode, 201)
    assert.equal(storefrontSubmitPayload.app, 'storefront-web')
    assert.equal(storefrontSubmitPayload.ledger.replayable, true)

    const storefrontReplay = await request(app.getHttpServer())
      .post(`/foundation/runtime-governance/actions/${storefrontSubmitPayload.receiptCode}/replay`)
      .send({
        ledgerKey: storefrontSubmitPayload.ledger.ledgerKey,
        requestedFrom: 'STOREFRONT_WEB_RUNTIME',
        ticketCode: storefrontSubmitPayload.ticket.ticketCode,
        idempotencyKey: 'storefront-web:booking-submit:http-001:replay'
      })
    const storefrontReplayPayload = storefrontReplay.body.data ?? storefrontReplay.body
    assert.equal(storefrontReplay.statusCode, 201)
    assert.equal(storefrontReplayPayload.state, 'replay-scheduled')
    assert.equal(storefrontReplayPayload.ledger.summary.includes('STOREFRONT_WEB_RUNTIME'), true)
  } finally {
    await app.close()
  }
})
