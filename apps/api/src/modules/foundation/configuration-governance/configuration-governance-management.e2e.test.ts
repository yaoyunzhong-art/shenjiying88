import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { Body, Controller, Get, Inject, Param, Post, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import { decideGovernanceApproval } from '../governance-approval/governance-approval'
import { ApprovalQueryDto, ApprovalTimelineQueryDto, AuditQueryDto } from '../trust-governance/trust-governance.dto'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import {
  CertificateQueryDto,
  ConfigEntryQueryDto,
  RegisterSecretDto,
  RotateSecretDto,
  UpsertConfigEntryDto
} from './configuration-governance.dto'
import { ConfigurationGovernanceService } from './configuration-governance.service'

type StoredRevision = {
  version: number
  changedBy: string
  changeReason?: string | null
  snapshot: unknown
  createdAt: Date
}

type StoredConfigEntry = {
  id: string
  namespace: string
  key: string
  valueType: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  marketProfileId: string | null
  portalSiteId: string | null
  version: number
  value: unknown
  schemaRef: string | null
  tags: string[]
  status: string
  createdBy: string | null
  revisions: StoredRevision[]
  createdAt: Date
  updatedAt: Date
}

type StoredSecretAsset = {
  id: string
  key: string
  kind: string
  provider: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  integrationAppId: string | null
  version: number
  reference: string
  encryptedPayload: string | null
  metadata: Record<string, unknown>
  expiresAt: Date | null
  rotatedAt: Date | null
  status: string
  createdAt: Date
  updatedAt: Date
}

type StoredApproval = {
  id: string
  approvalTicket: string | null
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  version: number
  requestedBy: string | null
  status: string
  summary: Record<string, unknown> | null
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

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
  updatedAt: Date
}

function createConfigurationGovernancePrismaMock(options?: { failSecretCreateOnce?: boolean }) {
  const entries: StoredConfigEntry[] = []
  const secrets: StoredSecretAsset[] = []
  const approvals: StoredApproval[] = []
  const featureFlags: StoredFeatureFlag[] = []
  let failSecretCreateOnce = options?.failSecretCreateOnce ?? false

  const prisma = {
    configEntry: {
      findFirst: async ({
        where
      }: {
        where: {
          namespace: string
          key: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
          portalSiteId?: string | null
        }
      }) =>
        entries.find(
          (entry) =>
            entry.namespace === where.namespace &&
            entry.key === where.key &&
            entry.scopeType === where.scopeType &&
            entry.tenantId === (where.tenantId ?? null) &&
            entry.brandId === (where.brandId ?? null) &&
            entry.storeId === (where.storeId ?? null) &&
            entry.marketProfileId === (where.marketProfileId ?? null) &&
            entry.portalSiteId === (where.portalSiteId ?? null)
        ) ?? null,
      create: async ({
        data
      }: {
        data: {
          namespace: string
          key: string
          valueType: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          marketProfileId?: string | null
          portalSiteId?: string | null
          version: number
          value: unknown
          schemaRef?: string
          tags: string[]
          status: string
          createdBy: string
          revisions: {
            create: {
              version: number
              changedBy: string
              changeReason?: string
              snapshot: unknown
            }
          }
        }
      }) => {
        const now = new Date()
        const entry: StoredConfigEntry = {
          id: `cfg_${entries.length + 1}`,
          namespace: data.namespace,
          key: data.key,
          valueType: data.valueType,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          marketProfileId: data.marketProfileId ?? null,
          portalSiteId: data.portalSiteId ?? null,
          version: data.version,
          value: data.value,
          schemaRef: data.schemaRef ?? null,
          tags: data.tags,
          status: data.status,
          createdBy: data.createdBy,
          revisions: [
            {
              ...data.revisions.create,
              createdAt: now
            }
          ],
          createdAt: now,
          updatedAt: now
        }
        entries.push(entry)
        return entry
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          valueType: string
          version: number
          value: unknown
          schemaRef?: string
          tags: string[]
          status: string
          createdBy: string | null
          revisions: {
            create: {
              version: number
              changedBy: string
              changeReason?: string
              snapshot: unknown
            }
          }
        }
      }) => {
        const entry = entries.find((item) => item.id === where.id)
        if (!entry) {
          throw new Error(`Config entry not found: ${where.id}`)
        }

        const now = new Date()
        entry.valueType = data.valueType
        entry.version = data.version
        entry.value = data.value
        entry.schemaRef = data.schemaRef ?? null
        entry.tags = data.tags
        entry.status = data.status
        entry.createdBy = data.createdBy
        entry.updatedAt = now
        entry.revisions.unshift({
          ...data.revisions.create,
          createdAt: now
        })
        return entry
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const entry = entries.find((item) => item.id === where.id)
        return entry
          ? {
              ...entry,
              revisions: [...entry.revisions]
            }
          : null
      },
      findMany: async ({
        where
      }: {
        where?: {
          namespace?: string
          key?: string
          OR?: Array<{ scopeType: string; tenantId?: string; brandId?: string; storeId?: string }>
        }
      } = {}) =>
        entries
          .filter((entry) => {
            if (where?.namespace && entry.namespace !== where.namespace) return false
            if (where?.key && entry.key !== where.key) return false
            if (where?.OR?.length) {
              return where.OR.some((scope) => {
                if (entry.scopeType !== scope.scopeType) return false
                if ('tenantId' in scope && entry.tenantId !== (scope.tenantId ?? null)) return false
                if ('brandId' in scope && entry.brandId !== (scope.brandId ?? null)) return false
                if ('storeId' in scope && entry.storeId !== (scope.storeId ?? null)) return false
                return true
              })
            }
            return true
          })
          .map((entry) => ({
            ...entry,
            revisions: [...entry.revisions]
          }))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    },
    secretAsset: {
      findMany: async ({
        where,
        orderBy
      }: {
        where?: { key?: string }
        orderBy?: Array<{ key?: 'asc' | 'desc'; version?: 'asc' | 'desc' }>
      } = {}) =>
        secrets
          .filter((secret) => (where?.key ? secret.key === where.key : true))
          .sort((a, b) => {
            const versionOrder = orderBy?.find((item) => item.version)?.version
            if (versionOrder === 'desc') {
              return b.version - a.version
            }

            if (versionOrder === 'asc') {
              return a.version - b.version
            }

            return a.version - b.version
          }),
      create: async ({
        data
      }: {
        data: {
          key: string
          kind: string
          provider: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          integrationAppId?: string | null
          version: number
          reference: string
          encryptedPayload?: string | null
          metadata: Record<string, unknown>
          expiresAt?: Date | null
          rotatedAt?: Date | null
          status: string
        }
      }) => {
        if (failSecretCreateOnce) {
          failSecretCreateOnce = false
          throw new Error('Simulated secret persistence failure')
        }
        const now = new Date()
        const secret: StoredSecretAsset = {
          id: `secret_${secrets.length + 1}`,
          key: data.key,
          kind: data.kind,
          provider: data.provider,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          integrationAppId: data.integrationAppId ?? null,
          version: data.version,
          reference: data.reference,
          encryptedPayload: data.encryptedPayload ?? null,
          metadata: data.metadata,
          expiresAt: data.expiresAt ?? null,
          rotatedAt: data.rotatedAt ?? null,
          status: data.status,
          createdAt: now,
          updatedAt: now
        }
        secrets.push(secret)
        return secret
      }
    },
    governanceApproval: {
      findUnique: async ({ where }: { where: { approvalTicket: string } }) =>
        approvals.find((approval) => approval.approvalTicket === where.approvalTicket) ?? null,
      findMany: async ({
        where,
        take
      }: {
        where?: {
          approvalTicket?: string
          operation?: string
          resourceType?: string
          resourceKey?: string
          requestedBy?: string
          decidedBy?: string
          tenantId?: string
          status?: string
          updatedAt?: {
            gte?: Date
            lte?: Date
          }
        }
        take?: number
      } = {}) =>
        approvals
          .filter((approval) => {
            if (where?.approvalTicket && approval.approvalTicket !== where.approvalTicket) return false
            if (where?.operation && approval.operation !== where.operation) return false
            if (where?.resourceType && approval.resourceType !== where.resourceType) return false
            if (where?.resourceKey && approval.resourceKey !== where.resourceKey) return false
            if (where?.requestedBy && approval.requestedBy !== where.requestedBy) return false
            if (where?.decidedBy && approval.decidedBy !== where.decidedBy) return false
            if (where?.tenantId && approval.tenantId !== where.tenantId) return false
            if (where?.status && approval.status !== where.status) return false
            if (where?.updatedAt?.gte && approval.updatedAt.getTime() < where.updatedAt.gte.getTime()) return false
            if (where?.updatedAt?.lte && approval.updatedAt.getTime() > where.updatedAt.lte.getTime()) return false
            return true
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, take ?? approvals.length),
      create: async ({
        data
      }: {
        data: {
          approvalTicket: string | null
          operation: string
          resourceType: string
          resourceKey: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          required: boolean
          version?: number
          requestedBy?: string | null
          status: string
          summary?: Record<string, unknown> | null
        }
      }) => {
        const now = new Date()
        const approval: StoredApproval = {
          id: `approval_${approvals.length + 1}`,
          approvalTicket: data.approvalTicket,
          operation: data.operation,
          resourceType: data.resourceType,
          resourceKey: data.resourceKey,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          required: data.required,
          version: data.version ?? 1,
          requestedBy: data.requestedBy ?? null,
          status: data.status,
          summary: data.summary ?? null,
          decisionNote: null,
          decidedBy: null,
          decidedAt: null,
          createdAt: now,
          updatedAt: now
        }
        approvals.push(approval)
        return approval
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          approvalTicket?: string | null
          operation?: string
          resourceType?: string
          resourceKey?: string
          scopeType?: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          required?: boolean
          version?: number
          requestedBy?: string | null
          status?: string
          summary?: Record<string, unknown> | null
          decisionNote?: string | null
          decidedBy?: string | null
          decidedAt?: Date | null
        }
      }) => {
        const approval = approvals.find((item) => item.id === where.id)
        if (!approval) {
          throw new Error(`Approval not found: ${where.id}`)
        }

        if ('approvalTicket' in data) approval.approvalTicket = data.approvalTicket ?? null
        if ('operation' in data && data.operation) approval.operation = data.operation
        if ('resourceType' in data && data.resourceType) approval.resourceType = data.resourceType
        if ('resourceKey' in data && data.resourceKey) approval.resourceKey = data.resourceKey
        if ('scopeType' in data && data.scopeType) approval.scopeType = data.scopeType
        if ('tenantId' in data) approval.tenantId = data.tenantId ?? null
        if ('brandId' in data) approval.brandId = data.brandId ?? null
        if ('storeId' in data) approval.storeId = data.storeId ?? null
        if ('required' in data && typeof data.required === 'boolean') approval.required = data.required
        if ('version' in data && typeof data.version === 'number') approval.version = data.version
        if ('requestedBy' in data) approval.requestedBy = data.requestedBy ?? null
        if ('status' in data && data.status) approval.status = data.status
        if ('summary' in data) approval.summary = data.summary ?? null
        if ('decisionNote' in data) approval.decisionNote = data.decisionNote ?? null
        if ('decidedBy' in data) approval.decidedBy = data.decidedBy ?? null
        if ('decidedAt' in data) approval.decidedAt = data.decidedAt ?? null
        approval.updatedAt = new Date()
        return approval
      }
    },
    featureFlag: {
      findMany: async () => featureFlags,
      findFirst: async () => null,
      create: async () => {
        throw new Error('featureFlag.create not used in this test')
      },
      update: async () => {
        throw new Error('featureFlag.update not used in this test')
      }
    }
  }

  return {
    prisma,
    entries,
    secrets,
    approvals,
    featureFlags
  }
}

@Controller('foundation/configuration-governance')
class TestConfigurationGovernanceManagementController {
  constructor(
    @Inject(ConfigurationGovernanceService)
    private readonly configurationGovernanceService: ConfigurationGovernanceService
  ) {}

  @Get('management-metadata')
  getManagementMetadata() {
    return this.configurationGovernanceService.getManagementMetadata()
  }

  @Get('overview')
  getOverview() {
    return this.configurationGovernanceService.getOperationsOverview()
  }

  @Get('config-entries')
  getConfigEntries(@Query() query: ConfigEntryQueryDto) {
    return this.configurationGovernanceService.listConfigEntries(query)
  }

  @Get('audit')
  getAudit(@Query() query: AuditQueryDto) {
    return this.configurationGovernanceService.getAuditRecords(query)
  }

  @Get('audit/summary')
  getAuditSummary(@Query() query: AuditQueryDto) {
    return this.configurationGovernanceService.summarizeAuditRecords(query)
  }

  @Get('approvals')
  getApprovals(@Query() query: ApprovalQueryDto) {
    return this.configurationGovernanceService.listGovernanceApprovals(query)
  }

  @Get('approvals/summary')
  getApprovalSummary(@Query() query: ApprovalQueryDto) {
    return this.configurationGovernanceService.summarizeGovernanceApprovals(query)
  }

  @Get('approvals/:approvalTicket')
  getApprovalDetail(@Param('approvalTicket') approvalTicket: string) {
    return this.configurationGovernanceService.getGovernanceApprovalDetail(approvalTicket)
  }

  @Get('approvals/:approvalTicket/timeline')
  getApprovalTimeline(@Param('approvalTicket') approvalTicket: string, @Query() query: ApprovalTimelineQueryDto) {
    return this.configurationGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit)
  }

  @Get('secrets-certificates/posture')
  getSecretsCertificatePosture() {
    return this.configurationGovernanceService.getSecretsCertificatePosture()
  }

  @Get('certificates')
  getCertificates(@Query() query: CertificateQueryDto) {
    return this.configurationGovernanceService.getCertificateMetadata(query)
  }

  @Get('certificates/:certificateName')
  getCertificate(@Param('certificateName') certificateName: string, @Query() query: CertificateQueryDto) {
    return this.configurationGovernanceService.getCertificateDetail(certificateName, query)
  }

  @Post('config-entries')
  saveConfigEntry(@Body() body: UpsertConfigEntryDto) {
    return this.configurationGovernanceService.saveConfigEntry(body)
  }

  @Post('secrets/register')
  registerSecret(@Body() body: RegisterSecretDto) {
    return this.configurationGovernanceService.registerSecret(body)
  }

  @Post('secrets/:secretName/rotate')
  rotateSecret(@Param('secretName') secretName: string, @Body() body: RotateSecretDto) {
    return this.configurationGovernanceService.rotateSecret(secretName, body.rotatedBy, {
      requestedBy: body.requestedBy,
      approvalTicket: body.approvalTicket,
      approvalStatus: body.approvalStatus
    })
  }
}

@Controller('foundation/trust-governance')
class TestApprovalReviewController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Post('approvals/:approvalTicket/approve')
  approve(@Param('approvalTicket') approvalTicket: string, @Body() body: { decidedBy: string; decisionNote?: string }) {
    return decideGovernanceApproval(this.prisma, {
      approvalTicket,
      decidedBy: body.decidedBy,
      decisionNote: body.decisionNote,
      status: 'APPROVED'
    })
  }

  @Post('approvals/:approvalTicket/reject')
  reject(@Param('approvalTicket') approvalTicket: string, @Body() body: { decidedBy: string; decisionNote?: string }) {
    return decideGovernanceApproval(this.prisma, {
      approvalTicket,
      decidedBy: body.decidedBy,
      decisionNote: body.decisionNote,
      status: 'REJECTED'
    })
  }
}

test('e2e: manages config entries and secret rotation with audit linkage', async () => {
  const { prisma, entries, secrets, approvals } = createConfigurationGovernancePrismaMock()
  const audits: string[] = []

  const moduleRef = await Test.createTestingModule({
    controllers: [TestConfigurationGovernanceManagementController, TestApprovalReviewController],
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
          },
          getAuditRecords: async () => [],
          summarizeAuditRecords: async () => ({ total: 0, byAction: {}, bySource: {}, byRiskLevel: { low: 0, medium: 0, high: 0 } })
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
    const created = await request(app.getHttpServer()).post('/foundation/configuration-governance/config-entries').send({
      tenantId: 'tenant-demo',
      namespace: 'checkout',
      key: 'paymentChannels',
      valueType: 'JSON',
      scopeType: 'TENANT',
      value: {
        channels: ['wechat-pay', 'alipay']
      },
      tags: ['checkout'],
      changedBy: 'ops-user',
      requestedBy: 'ops-user'
    })

    const createdPayload = created.body.data ?? created.body
    assert.equal(created.statusCode, 201)
    assert.equal(createdPayload.status, 'created')
    assert.equal(createdPayload.entry.version, 1)
    assert.equal(createdPayload.governance.rbac.requiredPermissions[0], 'foundation.config.write')
    assert.equal(createdPayload.governance.approval.persisted, false)

    const listed = await request(app.getHttpServer())
      .get('/foundation/configuration-governance/config-entries')
      .query({ tenantId: 'tenant-demo', namespace: 'checkout' })

    const listedPayload = listed.body.data ?? listed.body
    assert.equal(listed.statusCode, 200)
    assert.equal(listedPayload.length, 1)
    assert.deepEqual(listedPayload[0]?.value, {
      channels: ['wechat-pay', 'alipay']
    })

    const registeredSecret = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'lyt-webhook',
      type: 'webhook-signing',
      scopeType: 'TENANT',
      consumers: ['integration-orchestration'],
      scopes: ['webhook'],
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin'
    })

    const registeredPayload = registeredSecret.body.data ?? registeredSecret.body
    assert.equal(registeredSecret.statusCode, 201)
    assert.equal(registeredPayload.status, 'pending-approval')
    assert.equal(registeredPayload.governance.approval.required, true)
    const registerTicket = registeredPayload.governance.approval.ticket
    assert.ok(registerTicket)

    const approvedRegistration = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${registerTicket}/approve`)
      .send({
        decidedBy: 'super-admin',
        decisionNote: 'register approved'
      })

    const approvedRegistrationPayload = approvedRegistration.body.data ?? approvedRegistration.body
    assert.equal(approvedRegistration.statusCode, 201)
    assert.equal(approvedRegistrationPayload.status, 'APPROVED')

    const executedRegistration = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'lyt-webhook',
      type: 'webhook-signing',
      scopeType: 'TENANT',
      consumers: ['integration-orchestration'],
      scopes: ['webhook'],
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin',
      approvalTicket: registerTicket
    })

    const executedRegistrationPayload = executedRegistration.body.data ?? executedRegistration.body
    assert.equal(executedRegistration.statusCode, 201)
    assert.equal(executedRegistrationPayload.status, 'created')
    assert.equal(executedRegistrationPayload.version, 1)
    assert.equal(executedRegistrationPayload.governance.approval.ticket, registerTicket)
    assert.ok(executedRegistrationPayload.governance.approval.approvalId)
    assert.equal(executedRegistrationPayload.governance.approval.version, 3)

    const replayedRegistration = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'lyt-webhook',
      type: 'webhook-signing',
      scopeType: 'TENANT',
      consumers: ['integration-orchestration'],
      scopes: ['webhook'],
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin',
      approvalTicket: registerTicket
    })

    const replayedRegistrationPayload = replayedRegistration.body.data ?? replayedRegistration.body
    assert.equal(replayedRegistration.statusCode, 201)
    assert.equal(replayedRegistrationPayload.status, 'already-executed')
    assert.equal(secrets.length, 1)

    const rotatedSecret = await request(app.getHttpServer())
      .post('/foundation/configuration-governance/secrets/lyt-webhook/rotate')
      .send({
        rotatedBy: 'sec-admin',
        requestedBy: 'sec-admin'
      })

    const rotatedPayload = rotatedSecret.body.data ?? rotatedSecret.body
    assert.equal(rotatedSecret.statusCode, 201)
    assert.equal(rotatedPayload.status, 'pending-approval')
    const rotateTicket = rotatedPayload.governance.approval.ticket
    assert.ok(rotateTicket)

    const approvedRotation = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${rotateTicket}/approve`)
      .send({
        decidedBy: 'super-admin',
        decisionNote: 'rotate approved'
      })

    const approvedRotationPayload = approvedRotation.body.data ?? approvedRotation.body
    assert.equal(approvedRotation.statusCode, 201)
    assert.equal(approvedRotationPayload.status, 'APPROVED')

    const executedRotation = await request(app.getHttpServer())
      .post('/foundation/configuration-governance/secrets/lyt-webhook/rotate')
      .send({
        rotatedBy: 'sec-admin',
        requestedBy: 'sec-admin',
        approvalTicket: rotateTicket
      })

    const executedRotationPayload = executedRotation.body.data ?? executedRotation.body
    assert.equal(executedRotation.statusCode, 201)
    assert.equal(executedRotationPayload.status, 'rotated')
    assert.equal(executedRotationPayload.secret.currentVersion, 2)
    assert.equal(executedRotationPayload.governance.approval.ticket, rotateTicket)
    assert.ok(executedRotationPayload.governance.approval.approvalId)
    assert.equal(executedRotationPayload.governance.approval.version, 3)

    const replayedRotation = await request(app.getHttpServer())
      .post('/foundation/configuration-governance/secrets/lyt-webhook/rotate')
      .send({
        rotatedBy: 'sec-admin',
        requestedBy: 'sec-admin',
        approvalTicket: rotateTicket
      })

    const replayedRotationPayload = replayedRotation.body.data ?? replayedRotation.body
    assert.equal(replayedRotation.statusCode, 201)
    assert.equal(replayedRotationPayload.status, 'already-executed')
    assert.equal(entries.length, 1)
    assert.equal(secrets.length, 2)
    assert.equal(approvals.length, 2)
    assert.deepEqual(audits, [
      'foundation.config-entry.created',
      'foundation.secret.created',
      'foundation.approval.executed',
      'foundation.approval.replay-blocked',
      'foundation.secret.rotated',
      'foundation.approval.executed',
      'foundation.approval.replay-blocked'
    ])

    const metadata = await request(app.getHttpServer()).get('/foundation/configuration-governance/management-metadata')
    const metadataPayload = metadata.body.data ?? metadata.body
    assert.equal(metadata.statusCode, 200)
    assert.equal(metadataPayload.length, 4)
  } finally {
    await app.close()
  }
})

test('e2e: secret rotation stays pending until approval is granted', async () => {
  const { prisma, secrets, approvals } = createConfigurationGovernancePrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestConfigurationGovernanceManagementController],
    providers: [
      {
        provide: PrismaService,
        useValue: prisma
      },
      {
        provide: TrustGovernanceService,
        useValue: {
          recordAudit: async () => ({ auditId: 'audit_1', eventType: 'noop' }),
          getAuditRecords: async () => [],
          summarizeAuditRecords: async () => ({ total: 0, byAction: {}, bySource: {}, byRiskLevel: { low: 0, medium: 0, high: 0 } })
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
    const rotatedSecret = await request(app.getHttpServer())
      .post('/foundation/configuration-governance/secrets/payment-provider-api-key/rotate')
      .send({
        rotatedBy: 'sec-admin',
        requestedBy: 'sec-admin'
      })

    const payload = rotatedSecret.body.data ?? rotatedSecret.body
    assert.equal(rotatedSecret.statusCode, 201)
    assert.equal(payload.status, 'pending-approval')
    assert.equal(payload.governance.approval.required, true)
    assert.equal(payload.governance.approval.status, 'PENDING')
    assert.equal(secrets.length, 0)
    assert.equal(approvals.length, 1)
  } finally {
    await app.close()
  }
})

test('e2e: failed secret registration execution records failure and allows retry', async () => {
  const { prisma, secrets, approvals } = createConfigurationGovernancePrismaMock({ failSecretCreateOnce: true })

  const moduleRef = await Test.createTestingModule({
    controllers: [TestConfigurationGovernanceManagementController, TestApprovalReviewController],
    providers: [
      {
        provide: PrismaService,
        useValue: prisma
      },
      {
        provide: TrustGovernanceService,
        useValue: {
          recordAudit: async () => ({ auditId: 'audit_failure', eventType: 'noop' }),
          getAuditRecords: async () => [],
          summarizeAuditRecords: async () => ({ total: 0, byAction: {}, bySource: {}, byRiskLevel: { low: 0, medium: 0, high: 0 } })
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
    const submitted = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'retry-secret',
      type: 'api-key',
      scopeType: 'TENANT',
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin'
    })

    const submittedPayload = submitted.body.data ?? submitted.body
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    await request(app.getHttpServer()).post(`/foundation/trust-governance/approvals/${approvalTicket}/approve`).send({
      decidedBy: 'super-admin'
    })

    const failed = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'retry-secret',
      type: 'api-key',
      scopeType: 'TENANT',
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    assert.equal(failed.statusCode, 500)
    assert.equal(approvals[0]?.version, 3)
    assert.equal(secrets.length, 0)
    assert.match(JSON.stringify(approvals[0]?.summary), /secret-register-failed/i)

    const retried = await request(app.getHttpServer()).post('/foundation/configuration-governance/secrets/register').send({
      tenantId: 'tenant-demo',
      key: 'retry-secret',
      type: 'api-key',
      scopeType: 'TENANT',
      value: 'secret-v1',
      rotatedBy: 'sec-admin',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    const retriedPayload = retried.body.data ?? retried.body
    assert.equal(retried.statusCode, 201)
    assert.equal(retriedPayload.status, 'created')
    assert.equal(retriedPayload.governance.approval.version, 4)
    assert.equal(retriedPayload.governance.approval.execution.attempts, 2)
    assert.equal(retriedPayload.governance.approval.execution.executed, true)
    assert.equal(retriedPayload.governance.approval.execution.lastFailure?.failureStatus, 'secret-register-failed')
    assert.equal(secrets.length, 1)
  } finally {
    await app.close()
  }
})

test('e2e: configuration governance approval queries only expose configuration approvals', async () => {
  const { prisma, approvals, entries, secrets, featureFlags } = createConfigurationGovernancePrismaMock()
  const now = new Date()
  entries.push({
    id: 'cfg_overview_1',
    namespace: 'checkout',
    key: 'paymentChannels',
    valueType: 'JSON',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    brandId: null,
    storeId: null,
    marketProfileId: null,
    portalSiteId: null,
    version: 1,
    value: { channels: ['wechat-pay'] },
    schemaRef: null,
    tags: ['checkout'],
    status: 'ACTIVE',
    createdBy: 'ops-user',
    revisions: [],
    createdAt: now,
    updatedAt: now
  })
  featureFlags.push({
    id: 'flag_overview_1',
    key: 'new-checkout',
    name: '新版结账流程',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    brandId: null,
    storeId: null,
    marketProfileId: null,
    status: 'ACTIVE',
    strategy: 'PERCENTAGE',
    enabled: true,
    percentage: 25,
    allowList: [],
    conditions: null,
    metadata: {},
    startsAt: null,
    endsAt: null,
    updatedAt: now
  })
  secrets.push({
    id: 'secret_overview_1',
    key: 'overview-secret',
    kind: 'API_KEY',
    provider: 'DATABASE',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    brandId: null,
    storeId: null,
    integrationAppId: null,
    version: 1,
    reference: 'secret://overview-secret/v1',
    encryptedPayload: null,
    metadata: {
      type: 'api-key',
      fingerprint: 'sha256:overview',
      rotatedBy: 'sec-admin'
    },
    expiresAt: new Date(now.getTime() + 60_000),
    rotatedAt: now,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  })
  approvals.push(
    {
      id: 'approval_cfg_1',
      approvalTicket: 'APR-CFG-001',
      operation: 'secret.register',
      resourceType: 'secret',
      resourceKey: 'lyt-webhook',
      scopeType: 'TENANT',
      tenantId: 'tenant-demo',
      brandId: null,
      storeId: null,
      required: true,
      version: 4,
      requestedBy: 'sec-admin',
      status: 'APPROVED',
      summary: {
        executionAttempts: 2,
        execution: {
          executedAt: now.toISOString(),
          executedBy: 'sec-admin',
          executionStatus: 'created'
        },
        executionFailure: {
          failedAt: new Date(now.getTime() - 60_000).toISOString(),
          failedBy: 'sec-admin',
          failureStatus: 'secret-register-failed',
          failureReason: 'retry once'
        }
      },
      decisionNote: 'approved',
      decidedBy: 'super-admin',
      decidedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'approval_trust_1',
      approvalTicket: 'APR-TRUST-001',
      operation: 'quota-ledger.reset',
      resourceType: 'quota-ledger',
      resourceKey: 'login-ip',
      scopeType: 'PLATFORM',
      tenantId: null,
      brandId: null,
      storeId: null,
      required: true,
      version: 3,
      requestedBy: 'sec-admin',
      status: 'APPROVED',
      summary: {
        executionAttempts: 1,
        execution: {
          executedAt: now.toISOString(),
          executedBy: 'sec-admin',
          executionStatus: 'reset-bulk'
        }
      },
      decisionNote: 'approved',
      decidedBy: 'super-admin',
      decidedAt: now,
      createdAt: now,
      updatedAt: now
    }
  )

  const moduleRef = await Test.createTestingModule({
    controllers: [TestConfigurationGovernanceManagementController],
    providers: [
      {
        provide: PrismaService,
        useValue: prisma
      },
      {
        provide: TrustGovernanceService,
        useValue: {
          recordAudit: async () => ({ auditId: 'audit_cfg_query', eventType: 'noop' }),
          getAuditRecords: async ({ approvalTicket }: { approvalTicket?: string }) =>
            approvalTicket === 'APR-CFG-001'
              ? [
                  {
                    auditId: 'audit_cfg_1',
                    eventType: 'foundation.approval.executed',
                    details: {
                      approvalTicket: 'APR-CFG-001',
                      executionStatus: 'created'
                    }
                  }
                ]
              : [],
          summarizeAuditRecords: async () => ({
            total: 1,
            byAction: {
              'foundation.approval.executed': 1
            },
            bySource: {
              'configuration-governance': 1
            },
            byRiskLevel: {
              low: 0,
              medium: 1,
              high: 0
            }
          })
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
    const approvalsResponse = await request(app.getHttpServer())
      .get('/foundation/configuration-governance/approvals')
      .query({ executed: true })
    const approvalsPayload = approvalsResponse.body.data ?? approvalsResponse.body
    assert.equal(approvalsResponse.statusCode, 200)
    assert.equal(approvalsPayload.length, 1)
    assert.equal(approvalsPayload[0].ticket, 'APR-CFG-001')

    const detailResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/approvals/APR-CFG-001'
    )
    const detailPayload = detailResponse.body.data ?? detailResponse.body
    assert.equal(detailResponse.statusCode, 200)
    assert.equal(detailPayload.execution.executionStatus, 'created')
    assert.equal(detailPayload.execution.lastFailure?.failureStatus, 'secret-register-failed')

    const summaryResponse = await request(app.getHttpServer())
      .get('/foundation/configuration-governance/approvals/summary')
      .query({
        groupBy: 'operation,executionStatus,failureStatus'
      })
    const summaryPayload = summaryResponse.body.data ?? summaryResponse.body
    assert.equal(summaryResponse.statusCode, 200)
    assert.equal(summaryPayload.total, 1)
    assert.equal(summaryPayload.execution.executed, 1)
    assert.equal(summaryPayload.execution.byExecutionStatus.created, 1)
    assert.equal(summaryPayload.groups.length, 1)
    assert.deepEqual(summaryPayload.groups[0].dimensions, {
      operation: 'secret.register',
      executionStatus: 'created',
      failureStatus: 'secret-register-failed'
    })

    const timelineResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/approvals/APR-CFG-001/timeline'
    )
    const timelinePayload = timelineResponse.body.data ?? timelineResponse.body
    assert.equal(timelineResponse.statusCode, 200)
    assert.equal(timelinePayload.approval.ticket, 'APR-CFG-001')
    assert.equal(timelinePayload.audits.length, 1)
    assert.equal(timelinePayload.audits[0].details.approvalTicket, 'APR-CFG-001')

    const overviewResponse = await request(app.getHttpServer()).get('/foundation/configuration-governance/overview')
    const overviewPayload = overviewResponse.body.data ?? overviewResponse.body
    assert.equal(overviewResponse.statusCode, 200)
    assert.equal(overviewPayload.configuration.entries.total, 1)
    assert.equal(overviewPayload.configuration.featureFlags.enabled, 1)
    assert.equal(overviewPayload.configuration.secrets.total, 3)
    assert.equal(overviewPayload.configuration.secrets.persisted, 1)
    assert.equal(overviewPayload.configuration.secrets.static, 2)
    assert.equal(overviewPayload.configuration.certificates.total, 2)
    assert.equal(overviewPayload.configuration.certificates.expiringSoon, 1)
    assert.equal(overviewPayload.audits.bySource['configuration-governance'], 1)

    const postureResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/secrets-certificates/posture'
    )
    const posturePayload = postureResponse.body.data ?? postureResponse.body
    assert.equal(postureResponse.statusCode, 200)
    assert.equal(posturePayload.secrets.total, 3)
    assert.equal(posturePayload.certificates.total, 2)
    assert.equal(posturePayload.attention.certificates.length, 1)

    const certificatesResponse = await request(app.getHttpServer())
      .get('/foundation/configuration-governance/certificates')
      .query({ status: 'expiring-soon' })
    const certificatesPayload = certificatesResponse.body.data ?? certificatesResponse.body
    assert.equal(certificatesResponse.statusCode, 200)
    assert.equal(certificatesPayload.length, 1)
    assert.equal(certificatesPayload[0].name, 'payment-gateway-client-cert')

    const certificateDetailResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/certificates/payment-gateway-client-cert'
    )
    const certificateDetailPayload = certificateDetailResponse.body.data ?? certificateDetailResponse.body
    assert.equal(certificateDetailResponse.statusCode, 200)
    assert.equal(certificateDetailPayload.secretName, 'payment-provider-api-key')

    const auditSummaryResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/audit/summary'
    )
    const auditSummaryPayload = auditSummaryResponse.body.data ?? auditSummaryResponse.body
    assert.equal(auditSummaryResponse.statusCode, 200)
    assert.equal(auditSummaryPayload.total, 1)
    assert.equal(auditSummaryPayload.byAction['foundation.approval.executed'], 1)

    const trustDetailResponse = await request(app.getHttpServer()).get(
      '/foundation/configuration-governance/approvals/APR-TRUST-001'
    )
    assert.equal(trustDetailResponse.statusCode, 404)
  } finally {
    await app.close()
  }
})
