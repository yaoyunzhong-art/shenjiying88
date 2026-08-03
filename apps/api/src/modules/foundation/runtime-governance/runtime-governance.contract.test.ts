import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
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
  const audits: Array<{
    eventType: string
    details: Record<string, unknown>
    context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
  }> = []
  const rateLimitScopes: string[] = []

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
      ...(rateLimitScopes.push(scopeKey), {}),
      allowed: true,
      scopeKey,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0
    }),
    recordAudit: async (
      eventType: string,
      details: Record<string, unknown>,
      context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
    ) => {
      audits.push({ eventType, details, context })
      return {
        auditId: `audit_${audits.length}`,
        eventType
      }
    }
  }

  return {
    service: new RuntimeGovernanceService(prisma as never, integrationOrchestrationService as never, trustGovernanceService as never),
    prisma,
    audits,
    rateLimitScopes
  }
}

it('contract: runtime governance service persists submit -> sync -> callback -> replay chain', async () => {
  const { service, audits, rateLimitScopes } = createRuntimeGovernanceHarness()

  const submitted = await service.submitAction({
    app: 'miniapp',
    action: 'booking-submit',
    nextStep: 'PROCEED',
    riskLevel: 'medium',
    requestEndpoint: '/api/v1/storefront/bookings',
    payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'miniapp-booking-submit-handler',
    idempotencyKey: 'miniapp-sync:booking-submit-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  assert.equal(submitted.state, 'submitted')
  assert.equal(submitted.ticket.status, 'ready-for-handler')
  assert.equal(submitted.sync.ready, true)

  const synced = await service.syncAction(submitted.receiptCode, {
    handlerName: 'miniapp-booking-submit-handler',
    ticketCode: submitted.ticket.ticketCode,
    idempotencyKey: 'miniapp-handler-sync:booking-submit-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })
  assert.equal(synced.callback.callbackStatus, 'awaiting-callback')

  const callbackRecorded = await service.recordCallback(submitted.receiptCode, {
    callbackStatus: 'callback-recorded',
    ackToken: `${submitted.receiptCode}-ACK`,
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler completed',
    idempotencyKey: 'miniapp-callback:booking-submit-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })
  assert.equal(callbackRecorded.state, 'callback-recorded')
  assert.equal(callbackRecorded.ledger.replayable, true)

  const replayed = await service.replayAction(submitted.receiptCode, {
    ledgerKey: callbackRecorded.ledger.ledgerKey,
    requestedFrom: 'MINIAPP_RUNTIME',
    ticketCode: callbackRecorded.ticket.ticketCode,
    idempotencyKey: 'miniapp-replay:booking-submit-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })
  assert.equal(replayed.state, 'replay-scheduled')
  assert.equal(replayed.retry.currentAttempt, 1)
  assert.equal(replayed.retry.nextBackoffMs, 4000)
  assert.equal(replayed.retry.escalationAction, 'WAIT_CALLBACK')
  assert.equal(replayed.events.length, 4)
  assert.deepEqual(rateLimitScopes, ['miniapp:booking-submit:tenant-runtime'])
  assert.deepEqual(
    audits.map((item) => item.eventType),
    [
      'foundation.runtime-governance.submit',
      'foundation.runtime-governance.sync',
      'foundation.runtime-governance.callback',
      'foundation.runtime-governance.replay'
    ]
  )
  assert.deepEqual(
    audits.map((item) => item.context?.actorId),
    ['ops.runtime', 'ops.runtime', 'ops.runtime', 'ops.runtime']
  )
  assert.deepEqual(
    audits.map((item) => item.context?.tenantId),
    ['tenant-runtime', 'tenant-runtime', 'tenant-runtime', 'tenant-runtime']
  )
})

it('contract: runtime governance service keeps challenge replay policy on shared source', async () => {
  const { service } = createRuntimeGovernanceHarness()

  const challenged = await service.submitAction({
    app: 'app',
    action: 'payment-submit',
    nextStep: 'CHALLENGE',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/app/payments/submit',
    payload: { orderNo: 'PAY-20260612-0001' },
    payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
    recommendedAction: 'COMPLETE_CHALLENGE',
    handlerName: 'native-payment-submit-handler',
    idempotencyKey: 'app-submit:payment-submit-challenge',
    actorId: 'ops.risk',
    tenantId: 'tenant-runtime'
  })

  assert.equal(challenged.retry.maxAttempts, 2)
  assert.equal(challenged.retry.nextBackoffMs, 5000)
  assert.equal(challenged.retry.escalationAction, 'REFRESH_TICKET')
})

it('contract: runtime governance operations overview applies callback stall timeout by tenant', async () => {
  const { service } = createRuntimeGovernanceHarness()

  const tenantReceipt = await service.submitAction({
    app: 'miniapp',
    action: 'booking-submit',
    nextStep: 'PROCEED',
    requestEndpoint: '/api/v1/storefront/bookings',
    payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'miniapp-booking-submit-handler',
    idempotencyKey: 'miniapp-sync:booking-submit-overview',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  await service.syncAction(tenantReceipt.receiptCode, {
    handlerName: 'miniapp-booking-submit-handler',
    ticketCode: tenantReceipt.ticket.ticketCode,
    idempotencyKey: 'miniapp-handler-sync:booking-submit-overview',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  await service.submitAction({
    app: 'app',
    action: 'member-login',
    nextStep: 'PROCEED',
    requestEndpoint: '/api/v1/app/member/session',
    payload: { memberId: 'member-002' },
    payloadSummary: '{"memberId":"member-002"}',
    riskLevel: 'medium',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'native-member-session-handler',
    idempotencyKey: 'app-sync:member-login-overview',
    actorId: 'ops.other',
    tenantId: 'tenant-other'
  })

  const freshOverview = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 5, 0)))
  const stalledOverview = await service.getOperationsOverview('tenant-runtime', new Date(Date.UTC(2026, 5, 12, 0, 12, 0)))

  assert.equal(freshOverview.summary.backlog, 1)
  assert.equal(freshOverview.summary.stalledCallbacks, 0)
  assert.equal(stalledOverview.summary.backlog, 1)
  assert.equal(stalledOverview.summary.stalledCallbacks, 1)
  assert.equal(stalledOverview.summary.highRiskBacklog, 1)
  assert.equal(stalledOverview.summary.blockedActions, 0)
  assert.equal(stalledOverview.receipts.length, 1)
  assert.equal(stalledOverview.receipts[0]?.receiptCode, tenantReceipt.receiptCode)
  assert.equal(stalledOverview.stalledReceipts.length, 1)
  assert.deepEqual(
    stalledOverview.stalledReceipts[0] && {
      receiptCode: stalledOverview.stalledReceipts[0].receiptCode,
      escalationAction: stalledOverview.stalledReceipts[0].escalationAction,
      riskLevel: stalledOverview.stalledReceipts[0].riskLevel
    },
    {
      receiptCode: tenantReceipt.receiptCode,
      escalationAction: 'SCHEDULE_REPLAY',
      riskLevel: 'high'
    }
  )
})

it('contract: runtime governance operations overview falls back to empty persisted events when prisma table is unavailable', async () => {
  const { service, prisma } = createRuntimeGovernanceHarness()
  prisma.domainEvent.findMany = (async () => {
    throw Object.assign(new Error('missing table'), { code: 'P2021' })
  }) as never

  const overview = await service.getOperationsOverview('tenant-runtime')

  assert.equal(overview.summary.backlog, 0)
  assert.equal(overview.summary.stalledCallbacks, 0)
  assert.equal(overview.summary.highRiskBacklog, 0)
  assert.equal(overview.receipts.length, 0)
})

it('contract: runtime governance submit returns stable receipt on duplicate idempotency key', async () => {
  const { service, audits } = createRuntimeGovernanceHarness()

  const first = await service.submitAction({
    app: 'app',
    action: 'payment-submit',
    nextStep: 'CHALLENGE',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/app/payments/submit',
    payload: { orderNo: 'PAY-20260612-0001' },
    payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
    recommendedAction: 'COMPLETE_CHALLENGE',
    handlerName: 'native-payment-submit-handler',
    idempotencyKey: 'app-sync:payment-submit-001'
  })
  const duplicate = await service.submitAction({
    app: 'app',
    action: 'payment-submit',
    nextStep: 'CHALLENGE',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/app/payments/submit',
    payload: { orderNo: 'PAY-20260612-0001' },
    payloadSummary: '{"orderNo":"PAY-20260612-0001"}',
    recommendedAction: 'COMPLETE_CHALLENGE',
    handlerName: 'native-payment-submit-handler',
    idempotencyKey: 'app-sync:payment-submit-001'
  })

  assert.equal(duplicate.receiptCode, first.receiptCode)
  assert.equal(duplicate.events.length, 2)
  assert.equal(duplicate.state, 'challenge-issued')
  assert.equal(duplicate.events[1]?.status, 'duplicate')
  assert.equal(duplicate.events[1]?.eventType, 'runtime-governance.action.duplicate')
  assert.deepEqual(
    audits.map((item) => item.details.publicationStatus),
    ['accepted', 'duplicate']
  )
})

it('contract: runtime governance callback keeps duplicate audit and timeline visibility', async () => {
  const { service, audits } = createRuntimeGovernanceHarness()

  const submitted = await service.submitAction({
    app: 'miniapp',
    action: 'booking-submit',
    nextStep: 'PROCEED',
    riskLevel: 'medium',
    requestEndpoint: '/api/v1/storefront/bookings',
    payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'miniapp-booking-submit-handler',
    idempotencyKey: 'miniapp-submit:callback-duplicate-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  await service.recordCallback(submitted.receiptCode, {
    callbackStatus: 'callback-recorded',
    ackToken: `${submitted.receiptCode}-ACK`,
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler completed',
    idempotencyKey: 'miniapp-callback:duplicate-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  const duplicateCallback = await service.recordCallback(submitted.receiptCode, {
    callbackStatus: 'callback-recorded',
    ackToken: `${submitted.receiptCode}-ACK`,
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler completed',
    idempotencyKey: 'miniapp-callback:duplicate-001',
    actorId: 'ops.runtime',
    tenantId: 'tenant-runtime'
  })

  const callbackAudits = audits.filter((item) => item.eventType === 'foundation.runtime-governance.callback')
  assert.equal(duplicateCallback.events.length, 3)
  assert.equal(duplicateCallback.events[2]?.status, 'duplicate')
  assert.equal(duplicateCallback.events[2]?.eventType, 'runtime-governance.handler.callback.duplicate')
  assert.deepEqual(
    callbackAudits.map((item) => item.details.publicationStatus),
    ['accepted', 'duplicate']
  )
})

it('contract: runtime governance service supports admin-web submit and replay source', async () => {
  const { service, audits, rateLimitScopes } = createRuntimeGovernanceHarness()

  const submitted = await service.submitAction({
    app: 'admin-web',
    action: 'runtime-replay',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
    payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001' },
    payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'admin-runtime-replay-handler',
    idempotencyKey: 'admin-web:runtime-replay-001',
    actorId: 'ops.admin-web',
    tenantId: 'tenant-admin'
  })

  assert.equal(submitted.app, 'admin-web')
  assert.equal(submitted.action, 'runtime-replay')
  assert.equal(submitted.ledger.replayable, true)

  const replayed = await service.replayAction(submitted.receiptCode, {
    ledgerKey: submitted.ledger.ledgerKey,
    requestedFrom: 'ADMIN_WEB_RUNTIME',
    ticketCode: submitted.ticket.ticketCode,
    idempotencyKey: 'admin-web:runtime-replay-001:replay',
    actorId: 'ops.admin-web',
    tenantId: 'tenant-admin'
  })

  assert.equal(replayed.state, 'replay-scheduled')
  assert.equal(replayed.ledger.summary.includes('ADMIN_WEB_RUNTIME'), true)
  assert.deepEqual(rateLimitScopes, ['admin-web:runtime-replay:tenant-admin'])
  assert.deepEqual(
    audits.map((item) => item.eventType),
    ['foundation.runtime-governance.submit', 'foundation.runtime-governance.replay']
  )
})

it('contract: runtime governance service supports tob-web and storefront-web submit sources', async () => {
  const { service } = createRuntimeGovernanceHarness()

  const tobReceipt = await service.submitAction({
    app: 'tob-web',
    action: 'member-login',
    nextStep: 'CHALLENGE',
    riskLevel: 'medium',
    requestEndpoint: '/api/v1/members/session/challenge',
    payload: { loginChannel: 'tenant-portal' },
    payloadSummary: '{"loginChannel":"tenant-portal"}',
    recommendedAction: 'COMPLETE_CHALLENGE',
    handlerName: 'tob-member-login-handler',
    idempotencyKey: 'tob-web:member-login-001',
    actorId: 'ops.tob-web',
    tenantId: 'tenant-tob'
  })

  const storefrontReceipt = await service.submitAction({
    app: 'storefront-web',
    action: 'booking-submit',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/storefront/bookings',
    payload: { bookingCode: 'STORE-BOOKING-001' },
    payloadSummary: '{"bookingCode":"STORE-BOOKING-001"}',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    handlerName: 'storefront-booking-submit-handler',
    idempotencyKey: 'storefront-web:booking-submit-001',
    actorId: 'ops.storefront-web',
    tenantId: 'tenant-storefront',
    brandId: 'brand-demo',
    storeId: 'store-001'
  })

  assert.equal(tobReceipt.app, 'tob-web')
  assert.equal(tobReceipt.state, 'challenge-issued')
  assert.equal(storefrontReceipt.app, 'storefront-web')
  assert.equal(storefrontReceipt.ledger.replayable, true)
})
