import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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

it('e2e: manages feature flags and validates persisted rollout decisions', async () => {
  const { prisma, flags } = createFeatureFlagPrismaMock()
  const audits: string[] = []

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
            return {
              auditId: `audit_${audits.length}`,
              eventType
            }
          }
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
