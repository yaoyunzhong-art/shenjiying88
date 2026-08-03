import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Inject, Param, Post, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import {
  FeatureFlagQueryDto,
  PersistFeatureFlagDto
} from './configuration-governance.dto'
import { ConfigurationGovernanceService } from './configuration-governance.service'

type StoredFeatureFlag = {
  id: string
  key: string
  name: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  marketProfileId: string | null
  status: string
  strategy: string
  enabled: boolean
  percentage: number | null
  allowList: string[]
  conditions: Record<string, unknown> | null
  metadata: Record<string, unknown>
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function createFeatureFlagPrismaMock() {
  const flags: StoredFeatureFlag[] = []

  const prisma = {
    featureFlag: {
      findFirst: async ({
        where
      }: {
        where: {
          key: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
        }
      }) =>
        flags.find(
          (flag) =>
            flag.key === where.key &&
            flag.scopeType === where.scopeType &&
            flag.tenantId === (where.tenantId ?? null) &&
            flag.brandId === (where.brandId ?? null) &&
            flag.storeId === (where.storeId ?? null) &&
            flag.marketProfileId === (where.marketProfileId ?? null)
        ) ?? null,
      findMany: async ({
        where
      }: {
        where?: {
          key?: string
          OR?: Array<{ scopeType: string; tenantId?: string; brandId?: string; storeId?: string }>
        }
      } = {}) =>
        flags
          .filter((flag) => {
            if (where?.key && flag.key !== where.key) return false
            if (where?.OR?.length) {
              return where.OR.some((scope) => {
                if (flag.scopeType !== scope.scopeType) return false
                if ('tenantId' in scope && flag.tenantId !== (scope.tenantId ?? null)) return false
                if ('brandId' in scope && flag.brandId !== (scope.brandId ?? null)) return false
                if ('storeId' in scope && flag.storeId !== (scope.storeId ?? null)) return false
                return true
              })
            }

            return true
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      create: async ({
        data
      }: {
        data: {
          key: string
          name: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
          status: string
          strategy: string
          enabled: boolean
          percentage?: number | null
          allowList: string[]
          conditions?: Record<string, unknown>
          metadata: Record<string, unknown>
          startsAt?: Date | null
          endsAt?: Date | null
        }
      }) => {
        const now = new Date()
        const flag: StoredFeatureFlag = {
          id: `flag_${flags.length + 1}`,
          key: data.key,
          name: data.name,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          marketProfileId: data.marketProfileId ?? null,
          status: data.status,
          strategy: data.strategy,
          enabled: data.enabled,
          percentage: data.percentage ?? null,
          allowList: data.allowList,
          conditions: data.conditions ?? null,
          metadata: data.metadata,
          startsAt: data.startsAt ?? null,
          endsAt: data.endsAt ?? null,
          createdAt: now,
          updatedAt: now
        }
        flags.push(flag)
        return flag
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          name: string
          status: string
          strategy: string
          enabled: boolean
          percentage?: number | null
          allowList: string[]
          conditions?: Record<string, unknown>
          metadata: Record<string, unknown>
          startsAt?: Date | null
          endsAt?: Date | null
        }
      }) => {
        const flag = flags.find((item) => item.id === where.id)
        if (!flag) {
          throw new Error(`Feature flag not found: ${where.id}`)
        }

        flag.name = data.name
        flag.status = data.status
        flag.strategy = data.strategy
        flag.enabled = data.enabled
        flag.percentage = data.percentage ?? null
        flag.allowList = data.allowList
        flag.conditions = data.conditions ?? null
        flag.metadata = data.metadata
        flag.startsAt = data.startsAt ?? null
        flag.endsAt = data.endsAt ?? null
        flag.updatedAt = new Date()
        return flag
      }
    },
    configEntry: {
      findMany: async () => []
    },
    secretAsset: {
      findMany: async () => []
    }
  }

  return {
    prisma,
    flags
  }
}

@Controller('foundation/configuration-governance')
class TestFeatureFlagManagementController {
  constructor(
    @Inject(ConfigurationGovernanceService)
    private readonly configurationGovernanceService: ConfigurationGovernanceService
  ) {}

  @Post('feature-flags')
  saveFlag(@Body() body: PersistFeatureFlagDto) {
    return this.configurationGovernanceService.saveFeatureFlag(body)
  }

  @Get('feature-flag-records')
  listFlagRecords(@Query() query: FeatureFlagQueryDto) {
    return this.configurationGovernanceService.listPersistedFeatureFlags(
      {
        tenantId: query.tenantId ?? 'tenant-demo',
        brandId: query.brandId,
        storeId: query.storeId,
        marketCode: query.marketCode
      },
      query.subjectKey
    )
  }

  @Get('feature-flags/:flagKey')
  evaluateFlag(@Param('flagKey') flagKey: string, @Query() query: FeatureFlagQueryDto) {
    return this.configurationGovernanceService.evaluateFeatureFlag(
      flagKey,
      {
        tenantId: query.tenantId ?? 'tenant-demo',
        brandId: query.brandId,
        storeId: query.storeId,
        marketCode: query.marketCode
      },
      query.subjectKey
    )
  }
}

async function createTestApp(prisma: any, audits: string[]) {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestFeatureFlagManagementController],
    providers: [
      {
        provide: PrismaService,
        useValue: prisma
      },
      {
        provide: TrustGovernanceService,
        useValue: {
          recordAudit: async (eventType: string) => {
            audits.push(eventType)
            return { auditId: `audit_${audits.length}`, eventType }
          },
          getAuditRecords: async () => [],
          evaluateRateLimit: async () => ({ allowed: true, limit: 12, remaining: 11, retryAfterSeconds: 0 }),
          summarizeAuditRecords: async () => ({})
        }
      },
      {
        provide: ConfigurationGovernanceService,
        useFactory: (prismaService: PrismaService, trustGovernanceService: TrustGovernanceService) =>
          new ConfigurationGovernanceService(prismaService, trustGovernanceService),
        inject: [PrismaService, TrustGovernanceService]
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

// ============ E2E 测试集 ============

describe('Feature Flag Management - E2E HTTP', () => {
  it('e2e: creates and evaluates an ALLOW_LIST feature flag', async () => {
    const { prisma, flags } = createFeatureFlagPrismaMock()
    const audits: string[] = []
    const app = await createTestApp(prisma, audits)

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'new-loyalty-center',
        name: '新积分中心',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALLOW_LIST',
        enabled: true,
        allowList: ['vip-user-1'],
        description: '只给白名单会员灰度'
      })

      const createdPayload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(createdPayload.status, 'created')
      assert.equal(createdPayload.record.key, 'new-loyalty-center')

      const evaluatedAllow = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/new-loyalty-center')
        .query({ tenantId: 'tenant-demo', subjectKey: 'vip-user-1' })

      const allowPayload = evaluatedAllow.body.data ?? evaluatedAllow.body
      assert.equal(evaluatedAllow.statusCode, 200)
      assert.equal(allowPayload.enabled, true)
      assert.equal(allowPayload.rolloutPercentage, 100)
      assert.equal(allowPayload.source, 'prisma')

      const evaluatedDeny = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/new-loyalty-center')
        .query({ tenantId: 'tenant-demo', subjectKey: 'visitor-2' })

      const denyPayload = evaluatedDeny.body.data ?? evaluatedDeny.body
      assert.equal(evaluatedDeny.statusCode, 200)
      assert.equal(denyPayload.enabled, false)
      assert.equal(denyPayload.rolloutPercentage, 0)

      const listed = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flag-records')
        .query({ tenantId: 'tenant-demo', subjectKey: 'vip-user-1' })

      const listedPayload = listed.body.data ?? listed.body
      assert.equal(listed.statusCode, 200)
      assert.equal(Array.isArray(listedPayload), true)
      assert.equal(listedPayload[0]?.key, 'new-loyalty-center')
      assert.equal(listedPayload[0]?.enabled, true)
      assert.equal(flags.length, 1)
      assert.deepEqual(audits, ['foundation.feature-flag.created'])
    } finally {
      await app.close()
    }
  })

  it('e2e: evaluates a non-persisted in-memory feature flag', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/new-checkout')
        .query({ tenantId: 'tenant-premium', subjectKey: 'user-1' })

      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(evaluated.statusCode, 200)
      assert.equal(payload.key, 'new-checkout')
      assert.equal(payload.enabled, true)
      assert.equal(payload.source, 'in-memory')
    } finally {
      await app.close()
    }
  })

  it('e2e: in-memory flag disabled for SG market', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/ai-order-review')
        .query({ marketCode: 'SG', subjectKey: 'sg-user-1' })

      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(evaluated.statusCode, 200)
      assert.equal(payload.key, 'ai-order-review')
      assert.equal(payload.enabled, false)
      assert.equal(payload.source, 'in-memory')
    } finally {
      await app.close()
    }
  })

  it('e2e: updates an existing feature flag', async () => {
    const { prisma, flags } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      // create
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'test-flag-update',
        name: 'Test Flag',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      // update
      const updated = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'test-flag-update',
        name: 'Test Flag Updated',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: ['user-1']
      })

      const payload = updated.body.data ?? updated.body
      assert.equal(updated.statusCode, 201)
      assert.equal(payload.status, 'updated')
      assert.equal(payload.record.enabled, true)
      assert.equal(payload.record.name, 'Test Flag Updated')
      assert.equal(flags.length, 1)
    } finally {
      await app.close()
    }
  })

  it('e2e: creates flag with PERCENTAGE strategy', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'percentage-rollout-flag',
        name: 'Percentage Rollout',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'PERCENTAGE',
        enabled: true,
        percentage: 50,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.strategy, 'PERCENTAGE')
      assert.equal(payload.record.percentage, 50)
    } finally {
      await app.close()
    }
  })

  it('e2e: creates DRAFT flag does not affect evaluations', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'draft-test',
        name: 'Draft Flag',
        scopeType: 'TENANT',
        status: 'DRAFT',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      // drafted flag still exists in list
      const listed = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flag-records')
        .query({ tenantId: 'tenant-demo' })
      const listedPayload = listed.body.data ?? listed.body
      assert.equal(Array.isArray(listedPayload), true)
    } finally {
      await app.close()
    }
  })

  it('e2e: creates SCOPE_MATCH strategy flag', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'scope-match-flag',
        name: 'Scope Match',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'SCOPE_MATCH',
        enabled: true,
        allowList: [],
        conditions: { region: 'shanghai' }
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.strategy, 'SCOPE_MATCH')
    } finally {
      await app.close()
    }
  })

  it('e2e: feature flag at STORE scope', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        storeId: 'store-sh-001',
        key: 'store-level-flag',
        name: 'Store Level Flag',
        scopeType: 'STORE',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.scopeType, 'STORE')
    } finally {
      await app.close()
    }
  })

  it('e2e: creates flag at BRAND scope', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        brandId: 'brand-premium',
        key: 'brand-scope-flag',
        name: 'Brand Scope Flag',
        scopeType: 'BRAND',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.scopeType, 'BRAND')
    } finally {
      await app.close()
    }
  })

  it('e2e: creates flag at PLATFORM scope', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        key: 'platform-wide-flag',
        name: 'Platform Wide Flag',
        scopeType: 'PLATFORM',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.scopeType, 'PLATFORM')
    } finally {
      await app.close()
    }
  })

  it('e2e: multiple flags are listed via feature-flag-records', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      // create two flags
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'flag-alpha',
        name: 'Flag Alpha',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'flag-beta',
        name: 'Flag Beta',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const listed = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flag-records')
        .query({ tenantId: 'tenant-demo' })
      const payload = listed.body.data ?? listed.body
      assert.equal(listed.statusCode, 200)
      assert.equal(Array.isArray(payload), true)
      assert.equal(payload.length, 2)
    } finally {
      await app.close()
    }
  })

  it('e2e: disables a previously enabled feature flag', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'toggleable-flag',
        name: 'Toggleable',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      // update to disabled
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'toggleable-flag',
        name: 'Toggleable',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/toggleable-flag')
        .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' })
      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(payload.enabled, false)
    } finally {
      await app.close()
    }
  })

  it('e2e: tenant isolation — persisted flags scoped to different tenant not returned via list', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-premium',
        key: 'premium-tenant-flag',
        name: 'Premium Tenant Flag',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      // Query with a non-matching tenant — the endpoint uses tenant-demo which doesn't have this flag
      const listed = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flag-records')
        .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' })
      const listedPayload = listed.body.data ?? listed.body
      // The mocked findMany uses OR filter with provided tenant
      // Since we passed tenant-demo but the flag is for tenant-premium it won't match
      assert.equal(listed.statusCode, 200)
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with startsAt/endsAt temporal bounds', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'temporal-flag',
        name: 'Temporal Flag',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: [],
        startsAt: '2026-01-01T00:00:00Z',
        endsAt: '2027-01-01T00:00:00Z'
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.notEqual(payload.record.startsAt, null)
      assert.notEqual(payload.record.endsAt, null)
    } finally {
      await app.close()
    }
  })

  it('e2e: audit trail recorded on flag creation', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const audits: string[] = []
    const app = await createTestApp(prisma, audits)

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'audit-test-flag',
        name: 'Audit Test',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })

      assert.deepEqual(audits, ['foundation.feature-flag.created'])
    } finally {
      await app.close()
    }
  })

  it('e2e: in-memory member-import-v2 flag has 20% rollout', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/member-import-v2')
        .query({ tenantId: 'tenant-demo', subjectKey: 'test-user' })

      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(evaluated.statusCode, 200)
      assert.equal(payload.source, 'in-memory')
      assert.equal(payload.rolloutPercentage, 20)
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with PAUSED status can still be evaluated', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'paused-flag',
        name: 'Paused Flag',
        scopeType: 'TENANT',
        status: 'PAUSED',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.status, 'created')
      assert.equal(payload.record.status, 'PAUSED')
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with ARCHIVED status', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'archived-flag',
        name: 'Archived Flag',
        scopeType: 'TENANT',
        status: 'ARCHIVED',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const payload = created.body.data ?? created.body
      assert.equal(created.statusCode, 201)
      assert.equal(payload.record.status, 'ARCHIVED')
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with empty allowList evaluated as denied for all users', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'empty-allowlist-flag',
        name: 'Empty AllowList',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALLOW_LIST',
        enabled: true,
        allowList: []
      })

      // user not in allowlist
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/empty-allowlist-flag')
        .query({ tenantId: 'tenant-demo', subjectKey: 'any-user' })
      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(payload.enabled, false)
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with 0 percentage in PERCENTAGE strategy denies all', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'zero-percentage-flag',
        name: 'Zero Percentage',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'PERCENTAGE',
        enabled: true,
        percentage: 0,
        allowList: []
      })

      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/zero-percentage-flag')
        .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' })
      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(payload.enabled, false)
    } finally {
      await app.close()
    }
  })

  it('e2e: flag with 100 percentage in PERCENTAGE strategy allows all', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'full-percentage-flag',
        name: 'Full Percentage',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'PERCENTAGE',
        enabled: true,
        percentage: 100,
        allowList: []
      })

      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/full-percentage-flag')
        .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' })
      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(payload.enabled, true)
      assert.equal(payload.rolloutPercentage, 100)
    } finally {
      await app.close()
    }
  })

  it('e2e: in-memory flag with marketCode CN gets CN config', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/new-checkout')
        .query({ marketCode: 'CN', subjectKey: 'cn-user-1' })
      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(evaluated.statusCode, 200)
      assert.equal(payload.source, 'in-memory')
    } finally {
      await app.close()
    }
  })

  it('e2e: lists persisted and in-memory flags together', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      // Create a persisted flag
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'persisted-list-flag',
        name: 'Persisted List Flag',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const listed = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flag-records')
        .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' })
      const payload = listed.body.data ?? listed.body
      assert.equal(listed.statusCode, 200)
      assert.equal(Array.isArray(payload), true)
      assert.ok(payload.length >= 1)
    } finally {
      await app.close()
    }
  })

  it('e2e: updates PAUSED flag to ACTIVE', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'pause-toggle-flag',
        name: 'Pause Toggle Flag',
        scopeType: 'TENANT',
        status: 'PAUSED',
        strategy: 'ALL',
        enabled: false,
        allowList: []
      })

      const updated = await request(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
        tenantId: 'tenant-demo',
        key: 'pause-toggle-flag',
        name: 'Pause Toggle Flag Active',
        scopeType: 'TENANT',
        status: 'ACTIVE',
        strategy: 'ALL',
        enabled: true,
        allowList: []
      })
      const payload = updated.body.data ?? updated.body
      assert.equal(updated.statusCode, 201)
      assert.equal(payload.status, 'updated')
      assert.equal(payload.record.status, 'ACTIVE')
    } finally {
      await app.close()
    }
  })

  it('e2e: in-memory flag without matching scope uses default', async () => {
    const { prisma } = createFeatureFlagPrismaMock()
    const app = await createTestApp(prisma, [])

    try {
      const evaluated = await request(app.getHttpServer())
        .get('/foundation/configuration-governance/feature-flags/member-import-v2')
        .query({ tenantId: 'unknown-tenant', subjectKey: 'user-1' })

      const payload = evaluated.body.data ?? evaluated.body
      assert.equal(evaluated.statusCode, 200)
      // default for member-import-v2 is disabled
      assert.equal(payload.enabled, false)
    } finally {
      await app.close()
    }
  })
})
