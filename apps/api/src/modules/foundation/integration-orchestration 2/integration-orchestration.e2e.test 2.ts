import 'reflect-metadata'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { Body, Controller, Inject, Param, Post, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import { WebhookIngestDto } from './integration-orchestration.dto'
import { IntegrationOrchestrationService } from './integration-orchestration.service'

function buildSignature(timestamp: string, payload: Record<string, unknown>) {
  const rawBody = JSON.stringify(payload)
  return `sha256=${createHmac('sha256', 'lyt-webhook-secret-v2').update(`${timestamp}.${rawBody}`).digest('hex')}`
}

function createPrismaMock() {
  const events: Array<{
    id: string
    eventType: string
    aggregateId: string
    idempotencyKey: string | null
    payload: Record<string, unknown>
    headers: Record<string, unknown>
    occurredAt: Date
    availableAt?: Date
    processedAt?: Date
    createdAt: Date
    updatedAt: Date
  }> = []

  return {
    domainEvent: {
      create: async ({
        data
      }: {
        data: {
          eventType: string
          aggregateId: string
          idempotencyKey?: string | null
          payload: Record<string, unknown>
          headers: Record<string, unknown>
          occurredAt: Date
          availableAt?: Date
          processedAt?: Date
        }
      }) => {
        if (data.idempotencyKey && events.some((event) => event.idempotencyKey === data.idempotencyKey)) {
          const error = Object.assign(new Error('duplicate idempotency key'), {
            code: 'P2002',
            meta: {
              target: ['idempotencyKey']
            }
          })
          throw error
        }

        const now = new Date()
        const event = {
          id: `evt_${events.length + 1}`,
          eventType: data.eventType,
          aggregateId: data.aggregateId,
          idempotencyKey: data.idempotencyKey ?? null,
          payload: data.payload,
          headers: data.headers,
          occurredAt: data.occurredAt,
          availableAt: data.availableAt,
          processedAt: data.processedAt,
          createdAt: now,
          updatedAt: now
        }
        events.unshift(event)
        return event
      },
      findUnique: async ({ where }: { where: { idempotencyKey?: string; id?: string } }) => {
        if (where.idempotencyKey) {
          return events.find((event) => event.idempotencyKey === where.idempotencyKey) ?? null
        }

        if (where.id) {
          return events.find((event) => event.id === where.id) ?? null
        }

        return null
      },
      findMany: async ({
        where,
        take
      }: {
        where?: { NOT?: { idempotencyKey: null } }
        take?: number
      } = {}) => {
        const filtered = where?.NOT?.idempotencyKey === null ? events.filter((event) => event.idempotencyKey) : events
        return filtered.slice(0, take ?? filtered.length)
      }
    }
  }
}

@Controller('foundation/integration-orchestration')
class TestIntegrationOrchestrationE2eController {
  constructor(
    @Inject(IntegrationOrchestrationService)
    private readonly integrationOrchestrationService: IntegrationOrchestrationService
  ) {}

  @Post('webhooks/:source/ingest')
  ingestWebhook(@Param('source') source: string, @Body() body: WebhookIngestDto) {
    return this.integrationOrchestrationService.acceptWebhook(source, body)
  }
}

test('e2e: repeated webhook delivery returns duplicate on second request', async () => {
  const prismaMock = createPrismaMock()
  const audits: string[] = []

  const moduleRef = await Test.createTestingModule({
    controllers: [TestIntegrationOrchestrationE2eController],
    providers: [
      {
        provide: PrismaService,
        useValue: prismaMock
      },
      {
        provide: TrustGovernanceService,
        useValue: {
          recordAudit: async (eventType: string) => {
            audits.push(eventType)
            return {
              auditId: `audit_${audits.length}`,
              eventType
            }
          }
        }
      },
      {
        provide: IntegrationOrchestrationService,
        useFactory: (prisma: PrismaService, trustGovernanceService: TrustGovernanceService) =>
          new IntegrationOrchestrationService(prisma, trustGovernanceService),
        inject: [PrismaService, TrustGovernanceService]
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  try {
    const payload = { orderId: 'o-2001', status: 'paid' }
    const timestamp = String(Date.now())
    const signature = buildSignature(timestamp, payload)

    const accepted = await request(app.getHttpServer())
      .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
      .send({
        eventId: 'evt-2001',
        eventType: 'lyt.webhook.received',
        timestamp,
        signature,
        rawBody: JSON.stringify(payload),
        payload
      })

    const acceptedPayload = accepted.body.data ?? accepted.body
    assert.equal(accepted.statusCode, 201)
    assert.equal(acceptedPayload.status, 'accepted')
    assert.equal(acceptedPayload.idempotency.key, 'lyt:evt-2001')

    const duplicate = await request(app.getHttpServer())
      .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
      .send({
        eventId: 'evt-2001',
        eventType: 'lyt.webhook.received',
        timestamp,
        signature,
        rawBody: JSON.stringify(payload),
        payload
      })

    const duplicatePayload = duplicate.body.data ?? duplicate.body
    assert.equal(duplicate.statusCode, 201)
    assert.equal(duplicatePayload.status, 'duplicate')
    assert.equal(duplicatePayload.idempotency.key, 'lyt:evt-2001')
    assert.match(JSON.stringify(audits), /foundation\.webhook\.accepted/)
    assert.match(JSON.stringify(audits), /foundation\.webhook\.duplicate/)
  } finally {
    await app.close()
  }
})
