import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Get, Controller, Inject, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import { AuditQueryDto } from './trust-governance.dto'
import { TrustGovernanceService } from './trust-governance.service'

type StoredAuditLog = {
  id: string
  tenantId: string
  action: string
  operatorId: string
  sourceChannel: string | null
  requestId: string | null
  metadata: Record<string, unknown>
  payload: Record<string, unknown>
  createdAt: Date
}

function createAuditManagementPrismaMock() {
  const logs: StoredAuditLog[] = [
    {
      id: 'audit_1',
      tenantId: 'tenant-demo',
      action: 'foundation.secret.rotated',
      operatorId: 'sec-admin',
      sourceChannel: 'configuration-governance',
      requestId: 'req-1',
      metadata: { riskLevel: 'high' },
      payload: { key: 'lyt-webhook' },
      createdAt: new Date('2026-06-12T08:00:00.000Z')
    },
    {
      id: 'audit_2',
      tenantId: 'tenant-demo',
      action: 'foundation.feature-flag.created',
      operatorId: 'ops-user',
      sourceChannel: 'configuration-governance',
      requestId: 'req-2',
      metadata: { riskLevel: 'medium' },
      payload: { key: 'new-loyalty-center' },
      createdAt: new Date('2026-06-12T09:00:00.000Z')
    },
    {
      id: 'audit_3',
      tenantId: 'tenant-premium',
      action: 'foundation.config-entry.updated',
      operatorId: 'ops-user',
      sourceChannel: 'configuration-governance',
      requestId: 'req-3',
      metadata: { riskLevel: 'low' },
      payload: { key: 'paymentChannels' },
      createdAt: new Date('2026-06-12T10:00:00.000Z')
    }
  ]

  return {
    prisma: {
      auditLog: {
        findMany: async ({
          where,
          take
        }: {
          where?: {
            tenantId?: string
            action?: string
            sourceChannel?: string
            requestId?: string
            operatorId?: string
            createdAt?: { gte?: Date; lte?: Date }
          }
          take?: number
        } = {}) =>
          logs
            .filter((log) => {
              if (where?.tenantId && log.tenantId !== where.tenantId) return false
              if (where?.action && log.action !== where.action) return false
              if (where?.sourceChannel && log.sourceChannel !== where.sourceChannel) return false
              if (where?.requestId && log.requestId !== where.requestId) return false
              if (where?.operatorId && log.operatorId !== where.operatorId) return false
              if (where?.createdAt?.gte && log.createdAt.getTime() < where.createdAt.gte.getTime()) return false
              if (where?.createdAt?.lte && log.createdAt.getTime() > where.createdAt.lte.getTime()) return false
              return true
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, take ?? logs.length)
      }
    },
    logs
  }
}

@Controller('foundation/trust-governance')
class TestAuditManagementController {
  constructor(
    @Inject(TrustGovernanceService)
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  @Get('audit')
  getAudit(@Query() query: AuditQueryDto) {
    return this.trustGovernanceService.getAuditRecords(query)
  }
}

it('e2e: filters audit records by actor risk level and time window', async () => {
  const { prisma } = createAuditManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuditManagementController],
    providers: [
      {
        provide: PrismaService,
        useValue: prisma
      },
      {
        provide: TrustGovernanceService,
        useFactory: (prismaService: PrismaService) => new TrustGovernanceService(prismaService),
        inject: [PrismaService]
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  try {
    const filtered = await request(app.getHttpServer())
      .get('/foundation/trust-governance/audit')
      .query({
        tenantId: 'tenant-demo',
        actorId: 'sec-admin',
        riskLevel: 'high',
        from: '2026-06-12T07:30:00.000Z',
        to: '2026-06-12T08:30:00.000Z'
      })

    const payload = filtered.body.data ?? filtered.body
    assert.equal(filtered.statusCode, 200)
    assert.equal(payload.length, 1)
    assert.equal(payload[0]?.eventType, 'foundation.secret.rotated')
    assert.equal(payload[0]?.actorId, 'sec-admin')
    assert.equal(payload[0]?.riskLevel, 'high')
  } finally {
    await app.close()
  }
})
