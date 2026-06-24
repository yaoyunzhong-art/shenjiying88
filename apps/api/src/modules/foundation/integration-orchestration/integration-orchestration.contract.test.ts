import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { IntegrationOrchestrationService } from './integration-orchestration.service'

function buildSignature(timestamp: string, payload: Record<string, unknown>) {
  const rawBody = JSON.stringify(payload)
  return `sha256=${createHmac('sha256', 'lyt-webhook-secret-v2').update(`${timestamp}.${rawBody}`).digest('hex')}`
}

test('contract: webhook duplicate race falls back to database unique key result', async () => {
  const now = new Date()
  const existingEvent = {
    id: 'evt_existing',
    eventType: 'lyt.webhook.received',
    aggregateId: 'evt-001',
    idempotencyKey: 'lyt:evt-001',
    payload: { orderId: 'o-1001', status: 'paid' },
    headers: { 'x-event-source': 'lyt' },
    occurredAt: now,
    createdAt: now,
    updatedAt: now
  }

  let lookupCount = 0
  const prisma = {
    domainEvent: {
      create: async () => {
        const error = Object.assign(new Error('duplicate idempotency key'), {
          code: 'P2002',
          meta: {
            target: ['idempotencyKey']
          }
        })
        throw error
      },
      findUnique: async ({ where }: { where: { idempotencyKey?: string; id?: string } }) => {
        if (where.idempotencyKey === existingEvent.idempotencyKey) {
          lookupCount += 1
          return lookupCount === 1 ? null : existingEvent
        }

        if (where.id === existingEvent.id) {
          return existingEvent
        }

        return null
      },
      findMany: async () => []
    }
  }

  const audits: string[] = []
  const trustGovernanceService = {
    recordAudit: async (eventType: string) => {
      audits.push(eventType)
      return {
        auditId: `audit_${audits.length}`,
        eventType
      }
    }
  }

  const service = new IntegrationOrchestrationService(
    prisma as never,
    trustGovernanceService as never
  )

  const payload = { orderId: 'o-1001', status: 'paid' }
  const timestamp = String(Date.now())
  const result = await service.acceptWebhook('lyt', {
    eventId: 'evt-001',
    eventType: 'lyt.webhook.received',
    timestamp,
    signature: buildSignature(timestamp, payload),
    rawBody: JSON.stringify(payload),
    payload
  })

  assert.equal(result.status, 'duplicate')
  assert.equal(result.source, 'lyt')
  assert.equal(result.idempotency.key, 'lyt:evt-001')
  assert.match(result.pipeline.join(','), /database-unique-key/)
  assert.deepEqual(audits, ['foundation.webhook.duplicate-race'])
})
