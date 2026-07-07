import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Inject, Post, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import { RateLimitCheckDto } from './trust-governance.dto'
import { TrustGovernanceService } from './trust-governance.service'

type StoredPolicy = {
  id: string
  code: string
  limit: number
  burstLimit: number | null
  period: string
  scopeType: string
  dimensionKeys: string[]
  algorithm: string
  metadata: Record<string, unknown>
}

type StoredLedger = {
  id: string
  rateLimitPolicyId: string
  subjectKey: string
  period: string
  consumed: number
  remaining: number | null
  resetAt: Date
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

function createRateLimitPrismaMock() {
  const policies: StoredPolicy[] = []
  const ledgers: StoredLedger[] = []

  const prisma = {
    rateLimitPolicy: {
      findUnique: async ({ where }: { where: { code: string } }) =>
        policies.find((policy) => policy.code === where.code) ?? null,
      findUniqueOrThrow: async ({ where }: { where: { code: string } }) => {
        const policy = policies.find((item) => item.code === where.code)
        if (!policy) {
          throw new Error(`Policy not found: ${where.code}`)
        }

        return policy
      },
      create: async ({
        data
      }: {
        data: {
          code: string
          scopeType: string
          period: string
          limit: number
          burstLimit?: number | null
          dimensionKeys: string[]
          algorithm: string
          metadata: Record<string, unknown>
        }
      }) => {
        const policy: StoredPolicy = {
          id: `policy_${policies.length + 1}`,
          code: data.code,
          scopeType: data.scopeType,
          period: data.period,
          limit: data.limit,
          burstLimit: data.burstLimit ?? null,
          dimensionKeys: data.dimensionKeys,
          algorithm: data.algorithm,
          metadata: data.metadata
        }
        policies.push(policy)
        return policy
      }
    },
    quotaLedger: {
      findUnique: async ({
        where
      }: {
        where: {
          rateLimitPolicyId_subjectKey_resetAt: {
            rateLimitPolicyId: string
            subjectKey: string
            resetAt: Date
          }
        }
      }) =>
        ledgers.find(
          (ledger) =>
            ledger.rateLimitPolicyId === where.rateLimitPolicyId_subjectKey_resetAt.rateLimitPolicyId &&
            ledger.subjectKey === where.rateLimitPolicyId_subjectKey_resetAt.subjectKey &&
            ledger.resetAt.getTime() === where.rateLimitPolicyId_subjectKey_resetAt.resetAt.getTime()
        ) ?? null,
      findUniqueOrThrow: async ({
        where
      }: {
        where: {
          rateLimitPolicyId_subjectKey_resetAt: {
            rateLimitPolicyId: string
            subjectKey: string
            resetAt: Date
          }
        }
      }) => {
        const ledger = ledgers.find(
          (item) =>
            item.rateLimitPolicyId === where.rateLimitPolicyId_subjectKey_resetAt.rateLimitPolicyId &&
            item.subjectKey === where.rateLimitPolicyId_subjectKey_resetAt.subjectKey &&
            item.resetAt.getTime() === where.rateLimitPolicyId_subjectKey_resetAt.resetAt.getTime()
        )
        if (!ledger) {
          throw new Error('Ledger not found')
        }

        return ledger
      },
      create: async ({
        data
      }: {
        data: {
          rateLimitPolicyId: string
          subjectKey: string
          period: string
          consumed: number
          remaining: number | null
          resetAt: Date
          metadata: Record<string, unknown>
        }
      }) => {
        const now = new Date()
        const ledger: StoredLedger = {
          id: `ledger_${ledgers.length + 1}`,
          rateLimitPolicyId: data.rateLimitPolicyId,
          subjectKey: data.subjectKey,
          period: data.period,
          consumed: data.consumed,
          remaining: data.remaining,
          resetAt: data.resetAt,
          metadata: data.metadata,
          createdAt: now,
          updatedAt: now
        }
        ledgers.push(ledger)
        return ledger
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          consumed: number
          remaining: number | null
          metadata: Record<string, unknown>
        }
      }) => {
        const ledger = ledgers.find((item) => item.id === where.id)
        if (!ledger) {
          throw new Error(`Ledger not found: ${where.id}`)
        }

        ledger.consumed = data.consumed
        ledger.remaining = data.remaining
        ledger.metadata = data.metadata
        ledger.updatedAt = new Date()
        return ledger
      }
    },
    $transaction: async <T>(callback: (tx: unknown) => Promise<T>) => callback(prisma)
  }

  return {
    prisma,
    policies,
    ledgers
  }
}

@Controller('foundation/trust-governance')
class TestTrustGovernanceRateLimitController {
  constructor(
    @Inject(TrustGovernanceService)
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  @Post('rate-limit/check')
  check(@Body() body: RateLimitCheckDto) {
    return this.trustGovernanceService.evaluateRateLimit(body)
  }
}

it('e2e: rate limit endpoint persists ledger and blocks after threshold', async () => {
  const { prisma, policies, ledgers } = createRateLimitPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceRateLimitController],
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
    const first = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/check').send({
      scopeKey: 'tenant-demo:login:127.0.0.1',
      limit: 1,
      windowSeconds: 60,
      blockSeconds: 120
    })

    const firstPayload = first.body.data ?? first.body
    assert.equal(first.statusCode, 201)
    assert.equal(firstPayload.allowed, true)
    assert.equal(firstPayload.remaining, 0)

    const second = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/check').send({
      scopeKey: 'tenant-demo:login:127.0.0.1',
      limit: 1,
      windowSeconds: 60,
      blockSeconds: 120
    })

    const secondPayload = second.body.data ?? second.body
    assert.equal(second.statusCode, 201)
    assert.equal(secondPayload.allowed, false)
    assert.equal(secondPayload.remaining, 0)
    assert.ok(secondPayload.retryAfterSeconds > 0)
    assert.equal(policies.length, 1)
    assert.equal(ledgers.length, 1)
    assert.equal(ledgers[0]?.consumed, 2)
    assert.match(JSON.stringify(ledgers[0]?.metadata ?? {}), /blockedUntil/)
  } finally {
    await app.close()
  }
})
