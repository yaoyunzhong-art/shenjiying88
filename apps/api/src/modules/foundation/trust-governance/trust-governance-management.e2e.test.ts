import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Inject, Param, Post, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  ApprovalDecisionDto,
  ApprovalLifecycleDto,
  ApprovalQueryDto,
  ApprovalTimelineQueryDto,
  AuditQueryDto,
  QuotaLedgerQueryDto,
  RateLimitPolicyQueryDto,
  ResetQuotaLedgerDto,
  UpsertRateLimitPolicyDto
} from './trust-governance.dto'
import { TrustGovernanceService } from './trust-governance.service'

type StoredPolicy = {
  id: string
  code: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  integrationAppId: string | null
  period: string
  limit: number
  burstLimit: number | null
  dimensionKeys: string[]
  algorithm: string
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
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

type StoredAudit = {
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

function createTrustGovernanceManagementPrismaMock(options?: { failLedgerUpdateOnce?: boolean }) {
  const policies: StoredPolicy[] = []
  const ledgers: StoredLedger[] = []
  const approvals: StoredApproval[] = []
  const audits: StoredAudit[] = []
  let failLedgerUpdateOnce = options?.failLedgerUpdateOnce ?? false

  const attachPolicy = (ledger: StoredLedger) => {
    const policy = policies.find((item) => item.id === ledger.rateLimitPolicyId)
    if (!policy) {
      throw new Error(`Policy not found for ledger ${ledger.id}`)
    }

    return {
      ...ledger,
      rateLimitPolicy: policy
    }
  }

  const prisma = {
    rateLimitPolicy: {
      findUnique: async ({ where }: { where: { code: string } }) =>
        policies.find((policy) => policy.code === where.code) ?? null,
      findMany: async ({
        where
      }: {
        where?: {
          code?: string
          tenantId?: string
          brandId?: string
          storeId?: string
          integrationAppId?: string
        }
      } = {}) =>
        policies
          .filter((policy) => {
            if (where?.code && policy.code !== where.code) return false
            if (where?.tenantId && policy.tenantId !== where.tenantId) return false
            if (where?.brandId && policy.brandId !== where.brandId) return false
            if (where?.storeId && policy.storeId !== where.storeId) return false
            if (where?.integrationAppId && policy.integrationAppId !== where.integrationAppId) return false
            return true
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      create: async ({
        data
      }: {
        data: {
          code: string
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          integrationAppId?: string | null
          period: string
          limit: number
          burstLimit?: number | null
          dimensionKeys: string[]
          algorithm: string
          metadata: Record<string, unknown>
        }
      }) => {
        const now = new Date()
        const policy: StoredPolicy = {
          id: `policy_${policies.length + 1}`,
          code: data.code,
          scopeType: data.scopeType,
          tenantId: data.tenantId ?? null,
          brandId: data.brandId ?? null,
          storeId: data.storeId ?? null,
          integrationAppId: data.integrationAppId ?? null,
          period: data.period,
          limit: data.limit,
          burstLimit: data.burstLimit ?? null,
          dimensionKeys: data.dimensionKeys,
          algorithm: data.algorithm,
          metadata: data.metadata,
          createdAt: now,
          updatedAt: now
        }
        policies.push(policy)
        return policy
      },
      update: async ({
        where,
        data
      }: {
        where: { id: string }
        data: {
          scopeType: string
          tenantId?: string | null
          brandId?: string | null
          storeId?: string | null
          integrationAppId?: string | null
          period: string
          limit: number
          burstLimit?: number | null
          dimensionKeys: string[]
          algorithm: string
          metadata: Record<string, unknown>
        }
      }) => {
        const policy = policies.find((item) => item.id === where.id)
        if (!policy) {
          throw new Error(`Policy not found: ${where.id}`)
        }

        policy.scopeType = data.scopeType
        policy.tenantId = data.tenantId ?? null
        policy.brandId = data.brandId ?? null
        policy.storeId = data.storeId ?? null
        policy.integrationAppId = data.integrationAppId ?? null
        policy.period = data.period
        policy.limit = data.limit
        policy.burstLimit = data.burstLimit ?? null
        policy.dimensionKeys = data.dimensionKeys
        policy.algorithm = data.algorithm
        policy.metadata = data.metadata
        policy.updatedAt = new Date()
        return policy
      }
    },
    quotaLedger: {
      findMany: async ({
        where,
        take
      }: {
        where?: {
          subjectKey?: string
          rateLimitPolicy?: {
            code?: string
            tenantId?: string
          }
          resetAt?: {
            gt: Date
          }
        }
        take?: number
      } = {}) => {
        const filtered = ledgers
          .filter((ledger) => {
            if (where?.subjectKey && ledger.subjectKey !== where.subjectKey) return false
            if (where?.resetAt?.gt && ledger.resetAt.getTime() <= where.resetAt.gt.getTime()) return false
            if (where?.rateLimitPolicy?.code || where?.rateLimitPolicy?.tenantId) {
              const policy = policies.find((item) => item.id === ledger.rateLimitPolicyId)
              if (!policy) return false
              if (where.rateLimitPolicy.code && policy.code !== where.rateLimitPolicy.code) return false
              if (where.rateLimitPolicy.tenantId && policy.tenantId !== where.rateLimitPolicy.tenantId) return false
            }
            return true
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map((ledger) => attachPolicy(ledger))

        return filtered.slice(0, take ?? filtered.length)
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
        if (failLedgerUpdateOnce) {
          failLedgerUpdateOnce = false
          throw new Error('Simulated quota ledger update failure')
        }
        const ledger = ledgers.find((item) => item.id === where.id)
        if (!ledger) {
          throw new Error(`Ledger not found: ${where.id}`)
        }

        ledger.consumed = data.consumed
        ledger.remaining = data.remaining
        ledger.metadata = data.metadata
        ledger.updatedAt = new Date()
        return attachPolicy(ledger)
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
          decisionNote?: string | null
          decidedBy?: string | null
          decidedAt?: Date | null
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
          decisionNote: data.decisionNote ?? null,
          decidedBy: data.decidedBy ?? null,
          decidedAt: data.decidedAt ?? null,
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
          createdAt?: {
            gte?: Date
            lte?: Date
          }
        }
        take?: number
      } = {}) =>
        audits
          .filter((audit) => {
            if (where?.tenantId && audit.tenantId !== where.tenantId) return false
            if (where?.action && audit.action !== where.action) return false
            if (where?.sourceChannel && audit.sourceChannel !== where.sourceChannel) return false
            if (where?.requestId && audit.requestId !== where.requestId) return false
            if (where?.operatorId && audit.operatorId !== where.operatorId) return false
            if (where?.createdAt?.gte && audit.createdAt.getTime() < where.createdAt.gte.getTime()) return false
            if (where?.createdAt?.lte && audit.createdAt.getTime() > where.createdAt.lte.getTime()) return false
            return true
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, take ?? audits.length),
      create: async ({
        data
      }: {
        data: {
          tenantId: string
          action: string
          operatorId: string
          sourceChannel?: string
          requestId?: string
          metadata?: Record<string, unknown>
          payload?: Record<string, unknown>
        }
      }) => {
        const audit: StoredAudit = {
          id: `audit_${audits.length + 1}`,
          tenantId: data.tenantId,
          action: data.action,
          operatorId: data.operatorId,
          sourceChannel: data.sourceChannel ?? null,
          requestId: data.requestId ?? null,
          metadata: data.metadata ?? {},
          createdAt: new Date(),
          payload: data.payload ?? {}
        }
        audits.push(audit)
        return audit
      }
    }
  }

  const now = new Date()
  const seededPolicy: StoredPolicy = {
    id: 'policy_seed',
    code: 'login-ip',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    brandId: null,
    storeId: null,
    integrationAppId: null,
    period: 'MINUTE',
    limit: 5,
    burstLimit: 5,
    dimensionKeys: ['scopeKey'],
    algorithm: 'FIXED_WINDOW',
    metadata: { seeded: true },
    createdAt: now,
    updatedAt: now
  }
  policies.push(seededPolicy)
  ledgers.push({
    id: 'ledger_seed',
    rateLimitPolicyId: seededPolicy.id,
    subjectKey: 'tenant-demo:login:127.0.0.1',
    period: 'MINUTE',
    consumed: 3,
    remaining: 2,
    resetAt: new Date(now.getTime() + 60_000),
    metadata: { blockedUntil: null },
    createdAt: now,
    updatedAt: now
  })

  return {
    prisma,
    policies,
    ledgers,
    approvals,
    audits
  }
}

@Controller('foundation/trust-governance')
class TestTrustGovernanceManagementController {
  constructor(
    @Inject(TrustGovernanceService)
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  @Get('management-metadata')
  getManagementMetadata() {
    return this.trustGovernanceService.getManagementMetadata()
  }

  @Get('overview')
  getOverview() {
    return this.trustGovernanceService.getOperationsOverview()
  }

  @Get('approvals')
  getApprovals(@Query() query: ApprovalQueryDto) {
    return this.trustGovernanceService.listGovernanceApprovals(query)
  }

  @Get('approvals/summary')
  getApprovalSummary(@Query() query: ApprovalQueryDto) {
    return this.trustGovernanceService.summarizeGovernanceApprovals(query)
  }

  @Get('approvals/:approvalTicket')
  getApprovalDetail(@Param('approvalTicket') approvalTicket: string) {
    return this.trustGovernanceService.getGovernanceApprovalDetail(approvalTicket)
  }

  @Get('approvals/:approvalTicket/timeline')
  getApprovalTimeline(@Param('approvalTicket') approvalTicket: string, @Query() query: ApprovalTimelineQueryDto) {
    return this.trustGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit)
  }

  @Get('audit')
  getAudit(@Query() query: AuditQueryDto) {
    return this.trustGovernanceService.getAuditRecords(query)
  }

  @Get('audit/summary')
  getAuditSummary(@Query() query: AuditQueryDto) {
    return this.trustGovernanceService.summarizeAuditRecords(query)
  }

  @Post('approvals/:approvalTicket/approve')
  approveApproval(@Param('approvalTicket') approvalTicket: string, @Body() body: ApprovalDecisionDto) {
    return this.trustGovernanceService.approveGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/reject')
  rejectApproval(@Param('approvalTicket') approvalTicket: string, @Body() body: ApprovalDecisionDto) {
    return this.trustGovernanceService.rejectGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/cancel')
  cancelApproval(@Param('approvalTicket') approvalTicket: string, @Body() body: ApprovalLifecycleDto) {
    return this.trustGovernanceService.cancelGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/resubmit')
  resubmitApproval(@Param('approvalTicket') approvalTicket: string, @Body() body: ApprovalLifecycleDto) {
    return this.trustGovernanceService.resubmitGovernanceApproval(approvalTicket, body)
  }

  @Get('rate-limit/policies')
  getPolicies(@Query() query: RateLimitPolicyQueryDto) {
    return this.trustGovernanceService.listRateLimitPolicies(query)
  }

  @Post('rate-limit/policies')
  savePolicy(@Body() body: UpsertRateLimitPolicyDto) {
    return this.trustGovernanceService.upsertRateLimitPolicy(body)
  }

  @Get('rate-limit/ledgers')
  getLedgers(@Query() query: QuotaLedgerQueryDto) {
    return this.trustGovernanceService.listQuotaLedgers(query)
  }

  @Post('rate-limit/ledgers/reset')
  resetLedgers(@Body() body: ResetQuotaLedgerDto) {
    return this.trustGovernanceService.resetQuotaLedgers(body)
  }
}

it('e2e: manages rate limit policies and resets ledgers', async () => {
  const { prisma, policies, ledgers, approvals } = createTrustGovernanceManagementPrismaMock()
  approvals.push({
    id: 'approval_seed_approved',
    approvalTicket: 'APR-001',
    operation: 'quota-ledger.reset',
    resourceType: 'quota-ledger',
    resourceKey: 'login-ip:tenant-demo:login:127.0.0.1',
    scopeType: 'PLATFORM',
    tenantId: null,
    brandId: null,
    storeId: null,
    required: true,
    version: 1,
    requestedBy: 'sec-admin',
    status: 'APPROVED',
    summary: { requestedAction: 'reset' },
    decisionNote: 'seeded approval',
    decidedBy: 'super-admin',
    decidedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const created = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/policies').send({
      code: 'checkout-submit',
      scopeType: 'TENANT',
      tenantId: 'tenant-demo',
      period: 'MINUTE',
      limit: 10,
      burstLimit: 15,
      dimensionKeys: ['scopeKey', 'ip'],
      algorithm: 'FIXED_WINDOW',
      metadata: { channel: 'checkout' },
      requestedBy: 'ops-admin'
    })

    const createdPayload = created.body.data ?? created.body
    assert.equal(created.statusCode, 201)
    assert.equal(createdPayload.status, 'created')
    assert.equal(createdPayload.policy.code, 'checkout-submit')
    assert.equal(createdPayload.governance.rbac.requiredPermissions[0], 'foundation.rate-limit-policy.write')
    assert.equal(createdPayload.governance.approval.required, false)

    const listedPolicies = await request(app.getHttpServer())
      .get('/foundation/trust-governance/rate-limit/policies')
      .query({ tenantId: 'tenant-demo' })

    const policiesPayload = listedPolicies.body.data ?? listedPolicies.body
    assert.equal(listedPolicies.statusCode, 200)
    assert.ok(Array.isArray(policiesPayload))
    assert.equal(policies.length, 2)
    assert.match(JSON.stringify(policiesPayload), /checkout-submit/)

    const listedLedgers = await request(app.getHttpServer())
      .get('/foundation/trust-governance/rate-limit/ledgers')
      .query({ policyCode: 'login-ip' })

    const ledgersPayload = listedLedgers.body.data ?? listedLedgers.body
    assert.equal(listedLedgers.statusCode, 200)
    assert.equal(ledgersPayload[0]?.consumed, 3)

    const reset = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket: 'APR-001',
      approvalStatus: 'APPROVED'
    })

    const resetPayload = reset.body.data ?? reset.body
    assert.equal(reset.statusCode, 201)
    assert.equal(resetPayload.status, 'reset-bulk')
    assert.equal(resetPayload.count, 1)
    assert.equal(resetPayload.ledgers[0]?.consumed, 0)
    assert.equal(ledgers[0]?.remaining, 5)
    assert.equal(resetPayload.governance.approval.required, true)
    assert.equal(resetPayload.governance.approval.ticket, 'APR-001')
    assert.ok(resetPayload.governance.approval.approvalId)
    assert.equal(approvals.length, 1)

    const metadata = await request(app.getHttpServer()).get('/foundation/trust-governance/management-metadata')
    const metadataPayload = metadata.body.data ?? metadata.body
    assert.equal(metadata.statusCode, 200)
    assert.equal(metadataPayload.length, 5)
  } finally {
    await app.close()
  }
})

it('e2e: trust governance overview aggregates approvals audits policies and ledgers', async () => {
  const { prisma, policies, ledgers, approvals, audits } = createTrustGovernanceManagementPrismaMock()
  const now = new Date()
  approvals.push({
    id: 'approval_overview_1',
    approvalTicket: 'APR-OVERVIEW-1',
    operation: 'quota-ledger.reset',
    resourceType: 'quota-ledger',
    resourceKey: 'login-ip:tenant-demo:login:127.0.0.1',
    scopeType: 'PLATFORM',
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
        executionStatus: 'reset-bulk',
        executedBy: 'sec-admin'
      },
      executionFailure: {
        failedAt: new Date(now.getTime() - 60_000).toISOString(),
        failureStatus: 'reset-bulk-failed',
        failureReason: 'retry once',
        failedBy: 'sec-admin'
      }
    },
    decisionNote: 'approved',
    decidedBy: 'super-admin',
    decidedAt: now,
    createdAt: now,
    updatedAt: now
  })
  policies.push({
    id: 'policy_runtime',
    code: 'runtime-ip',
    scopeType: 'TENANT',
    tenantId: 'tenant-demo',
    brandId: null,
    storeId: null,
    integrationAppId: null,
    period: 'MINUTE',
    limit: 20,
    burstLimit: 20,
    dimensionKeys: ['scopeKey'],
    algorithm: 'FIXED_WINDOW',
    metadata: { runtimeManaged: true },
    createdAt: now,
    updatedAt: now
  })
  ledgers.push({
    id: 'ledger_blocked',
    rateLimitPolicyId: 'policy_runtime',
    subjectKey: 'tenant-demo:runtime:127.0.0.1',
    period: 'MINUTE',
    consumed: 20,
    remaining: 0,
    resetAt: new Date(now.getTime() + 60_000),
    metadata: { blockedUntil: new Date(now.getTime() + 30_000).toISOString() },
    createdAt: now,
    updatedAt: now
  })
  audits.push(
    {
      id: 'audit_overview_1',
      tenantId: 'tenant-demo',
      action: 'foundation.approval.executed',
      operatorId: 'sec-admin',
      sourceChannel: 'trust-governance',
      requestId: null,
      metadata: { riskLevel: 'medium' },
      payload: { approvalTicket: 'APR-OVERVIEW-1' },
      createdAt: now
    },
    {
      id: 'audit_overview_2',
      tenantId: 'tenant-demo',
      action: 'foundation.approval.execution-failed',
      operatorId: 'sec-admin',
      sourceChannel: 'trust-governance',
      requestId: null,
      metadata: { riskLevel: 'high' },
      payload: { approvalTicket: 'APR-OVERVIEW-1' },
      createdAt: now
    }
  )

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
    providers: [
      { provide: PrismaService, useValue: prisma },
      { provide: TrustGovernanceService, useFactory: (prismaService: PrismaService) => new TrustGovernanceService(prismaService), inject: [PrismaService] }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  try {
    const overview = await request(app.getHttpServer()).get('/foundation/trust-governance/overview')
    const payload = overview.body.data ?? overview.body
    assert.equal(overview.statusCode, 200)
    assert.equal(payload.rateLimit.policies.total >= 2, true)
    assert.equal(payload.rateLimit.policies.runtimeManaged >= 1, true)
    assert.equal(payload.rateLimit.ledgers.blocked >= 1, true)
    assert.equal(payload.rateLimit.ledgers.exhausted >= 1, true)
    assert.equal(payload.audits.byAction['foundation.approval.executed'] >= 1, true)
    assert.equal(payload.approvals.execution.byFailureStatus['reset-bulk-failed'] >= 1, true)
  } finally {
    await app.close()
  }
})

it('e2e: quota reset stays pending without approval', async () => {
  const { prisma, ledgers, approvals } = createTrustGovernanceManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const reset = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })

    const payload = reset.body.data ?? reset.body
    assert.equal(reset.statusCode, 201)
    assert.equal(payload.status, 'pending-approval')
    assert.equal(payload.count, 0)
    assert.equal(payload.governance.approval.status, 'PENDING')
    assert.equal(ledgers[0]?.consumed, 3)
    assert.equal(approvals.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: approval lifecycle runs submit -> review -> execute', async () => {
  const { prisma, ledgers, approvals } = createTrustGovernanceManagementPrismaMock()
  const from = new Date(Date.now() - 60_000).toISOString()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })

    const submittedPayload = submitted.body.data ?? submitted.body
    assert.equal(submitted.statusCode, 201)
    assert.equal(submittedPayload.status, 'pending-approval')
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    const approvalList = await request(app.getHttpServer())
      .get('/foundation/trust-governance/approvals')
      .query({ status: 'PENDING', approvalTicket })

    const approvalListPayload = approvalList.body.data ?? approvalList.body
    assert.equal(approvalList.statusCode, 200)
    assert.equal(approvalListPayload.length, 1)
    assert.equal(approvalListPayload[0].status, 'PENDING')

    const approved = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${approvalTicket}/approve`)
      .send({
        decidedBy: 'super-admin',
        decisionNote: 'risk reviewed'
      })

    const approvedPayload = approved.body.data ?? approved.body
    assert.equal(approved.statusCode, 201)
    assert.equal(approvedPayload.status, 'approved')
    assert.equal(approvedPayload.approval.status, 'APPROVED')

    const filteredApprovals = await request(app.getHttpServer())
      .get('/foundation/trust-governance/approvals')
      .query({
        status: 'APPROVED',
        decidedBy: 'super-admin',
        operation: 'quota-ledger.reset',
        from
      })

    const filteredApprovalsPayload = filteredApprovals.body.data ?? filteredApprovals.body
    assert.equal(filteredApprovals.statusCode, 200)
    assert.equal(filteredApprovalsPayload.length, 1)
    assert.equal(filteredApprovalsPayload[0].ticket, approvalTicket)

    const executed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    const executedPayload = executed.body.data ?? executed.body
    assert.equal(executed.statusCode, 201)
    assert.equal(executedPayload.status, 'reset-bulk')
    assert.equal(executedPayload.count, 1)
    assert.equal(executedPayload.governance.approval.status, 'APPROVED')
    assert.equal(executedPayload.governance.approval.version, 3)
    assert.equal(ledgers[0]?.consumed, 0)
    assert.equal(approvals[0]?.status, 'APPROVED')
    assert.equal(approvals[0]?.version, 3)
    assert.equal(approvals[0]?.decidedBy, 'super-admin')

    const executedApprovals = await request(app.getHttpServer())
      .get('/foundation/trust-governance/approvals')
      .query({
        approvalTicket,
        executed: true,
        executionStatus: 'reset-bulk'
      })

    const executedApprovalsPayload = executedApprovals.body.data ?? executedApprovals.body
    assert.equal(executedApprovals.statusCode, 200)
    assert.equal(executedApprovalsPayload.length, 1)
    assert.equal(executedApprovalsPayload[0].ticket, approvalTicket)
    assert.equal(executedApprovalsPayload[0].execution.executionStatus, 'reset-bulk')

    const replayed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    const replayedPayload = replayed.body.data ?? replayed.body
    assert.equal(replayed.statusCode, 201)
    assert.equal(replayedPayload.status, 'already-executed')
    assert.equal(replayedPayload.count, 0)
    assert.equal(approvals[0]?.version, 3)
  } finally {
    await app.close()
  }
})

it('e2e: pending approval can be cancelled and resubmitted before execution', async () => {
  const { prisma, ledgers, approvals } = createTrustGovernanceManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })
    const submittedPayload = submitted.body.data ?? submitted.body
    const originalTicket = submittedPayload.governance.approval.ticket
    assert.ok(originalTicket)
    assert.equal(submittedPayload.governance.approval.version, 1)

    const cancelled = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${originalTicket}/cancel`)
      .send({
        operatorId: 'sec-admin',
        expectedVersion: 1,
        reason: 'rescope request'
      })

    const cancelledPayload = cancelled.body.data ?? cancelled.body
    assert.equal(cancelled.statusCode, 201)
    assert.equal(cancelledPayload.status, 'cancelled')
    assert.equal(cancelledPayload.approval.status, 'CANCELLED')
    assert.equal(cancelledPayload.approval.version, 2)

    const resubmitted = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${originalTicket}/resubmit`)
      .send({
        operatorId: 'sec-admin',
        expectedVersion: 2,
        reason: 'retry with fresh ticket'
      })

    const resubmittedPayload = resubmitted.body.data ?? resubmitted.body
    assert.equal(resubmitted.statusCode, 201)
    assert.equal(resubmittedPayload.status, 'resubmitted')
    assert.equal(resubmittedPayload.supersededTicket, originalTicket)
    assert.equal(resubmittedPayload.approval.status, 'PENDING')
    assert.notEqual(resubmittedPayload.approval.ticket, originalTicket)
    assert.equal(approvals.length, 2)
    assert.equal(approvals[0]?.status, 'SUPERSEDED')
    assert.equal(approvals[1]?.status, 'PENDING')

    const approved = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${resubmittedPayload.approval.ticket}/approve`)
      .send({
        decidedBy: 'super-admin',
        expectedVersion: 1,
        decisionNote: 'approved on second pass'
      })

    const approvedPayload = approved.body.data ?? approved.body
    assert.equal(approved.statusCode, 201)
    assert.equal(approvedPayload.approval.status, 'APPROVED')
    assert.equal(approvedPayload.approval.version, 2)

    const executed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket: resubmittedPayload.approval.ticket
    })

    const executedPayload = executed.body.data ?? executed.body
    assert.equal(executed.statusCode, 201)
    assert.equal(executedPayload.status, 'reset-bulk')
    assert.equal(ledgers[0]?.consumed, 0)
  } finally {
    await app.close()
  }
})

it('e2e: approval decision rejects stale expectedVersion', async () => {
  const { prisma, approvals } = createTrustGovernanceManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })

    const submittedPayload = submitted.body.data ?? submitted.body
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    const cancelled = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${approvalTicket}/cancel`)
      .send({
        operatorId: 'sec-admin',
        expectedVersion: 1
      })

    assert.equal(cancelled.statusCode, 201)

    const staleApprove = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${approvalTicket}/approve`)
      .send({
        decidedBy: 'super-admin',
        expectedVersion: 1,
        decisionNote: 'stale approve'
      })

    assert.equal(staleApprove.statusCode, 409)
    assert.match(JSON.stringify(staleApprove.body), /version mismatch/i)
    assert.equal(approvals[0]?.status, 'CANCELLED')
    assert.equal(approvals[0]?.version, 2)
  } finally {
    await app.close()
  }
})

it('e2e: rejected approval blocks later execution with same ticket', async () => {
  const { prisma, ledgers, approvals } = createTrustGovernanceManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })

    const submittedPayload = submitted.body.data ?? submitted.body
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    const rejected = await request(app.getHttpServer())
      .post(`/foundation/trust-governance/approvals/${approvalTicket}/reject`)
      .send({
        decidedBy: 'super-admin',
        decisionNote: 'risk too high'
      })

    const rejectedPayload = rejected.body.data ?? rejected.body
    assert.equal(rejected.statusCode, 201)
    assert.equal(rejectedPayload.status, 'rejected')
    assert.equal(rejectedPayload.approval.status, 'REJECTED')

    const executed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    const executedPayload = executed.body.data ?? executed.body
    assert.equal(executed.statusCode, 201)
    assert.equal(executedPayload.status, 'approval-rejected')
    assert.equal(executedPayload.count, 0)
    assert.equal(executedPayload.governance.approval.status, 'REJECTED')
    assert.equal(ledgers[0]?.consumed, 3)
    assert.equal(approvals[0]?.status, 'REJECTED')
  } finally {
    await app.close()
  }
})

it('e2e: approved ticket cannot be replayed with a different reset payload', async () => {
  const { prisma, ledgers } = createTrustGovernanceManagementPrismaMock()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })

    const submittedPayload = submitted.body.data ?? submitted.body
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    await request(app.getHttpServer()).post(`/foundation/trust-governance/approvals/${approvalTicket}/approve`).send({
      decidedBy: 'super-admin',
      decisionNote: 'approved for original payload'
    })

    const replayed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:10.0.0.9',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    assert.equal(replayed.statusCode, 400)
    assert.match(JSON.stringify(replayed.body), /does not match/i)
    assert.equal(ledgers[0]?.consumed, 3)
  } finally {
    await app.close()
  }
})

it('e2e: failed quota reset execution records failure and allows retry', async () => {
  const { prisma, ledgers, approvals } = createTrustGovernanceManagementPrismaMock({ failLedgerUpdateOnce: true })

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTrustGovernanceManagementController],
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
    const submitted = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin'
    })
    const submittedPayload = submitted.body.data ?? submitted.body
    const approvalTicket = submittedPayload.governance.approval.ticket
    assert.ok(approvalTicket)

    await request(app.getHttpServer()).post(`/foundation/trust-governance/approvals/${approvalTicket}/approve`).send({
      decidedBy: 'super-admin',
      expectedVersion: 1
    })

    const failed = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    assert.equal(failed.statusCode, 500)
    assert.equal(approvals[0]?.version, 3)
    assert.match(JSON.stringify(approvals[0]?.summary), /reset-bulk-failed/i)
    assert.equal(ledgers[0]?.consumed, 3)

    const retried = await request(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/ledgers/reset').send({
      policyCode: 'login-ip',
      subjectKey: 'tenant-demo:login:127.0.0.1',
      requestedBy: 'sec-admin',
      approvalTicket
    })

    const retriedPayload = retried.body.data ?? retried.body
    assert.equal(retried.statusCode, 201)
    assert.equal(retriedPayload.status, 'reset-bulk')
    assert.equal(retriedPayload.governance.approval.version, 4)
    assert.equal(retriedPayload.governance.approval.execution.attempts, 2)
    assert.equal(retriedPayload.governance.approval.execution.executed, true)
    assert.equal(retriedPayload.governance.approval.execution.lastFailure?.failureStatus, 'reset-bulk-failed')
    assert.equal(ledgers[0]?.consumed, 0)

    const approvalDetail = await request(app.getHttpServer()).get(`/foundation/trust-governance/approvals/${approvalTicket}`)
    const approvalDetailPayload = approvalDetail.body.data ?? approvalDetail.body
    assert.equal(approvalDetail.statusCode, 200)
    assert.equal(approvalDetailPayload.execution.attempts, 2)
    assert.equal(approvalDetailPayload.execution.executed, true)
    assert.equal(approvalDetailPayload.execution.executionStatus, 'reset-bulk')
    assert.equal(approvalDetailPayload.execution.lastFailure?.failureStatus, 'reset-bulk-failed')

    const approvalTimeline = await request(app.getHttpServer()).get(
      `/foundation/trust-governance/approvals/${approvalTicket}/timeline`
    )
    const approvalTimelinePayload = approvalTimeline.body.data ?? approvalTimeline.body
    assert.equal(approvalTimeline.statusCode, 200)
    assert.equal(approvalTimelinePayload.approval.ticket, approvalTicket)
    assert.ok(
      approvalTimelinePayload.audits.some(
        (audit: { eventType: string }) => audit.eventType === 'foundation.approval.execution-failed'
      )
    )
    assert.ok(
      approvalTimelinePayload.audits.some((audit: { eventType: string }) => audit.eventType === 'foundation.approval.executed')
    )

    const auditSummary = await request(app.getHttpServer())
      .get('/foundation/trust-governance/audit/summary')
      .query({ approvalTicket })
    const auditSummaryPayload = auditSummary.body.data ?? auditSummary.body
    assert.equal(auditSummary.statusCode, 200)
    assert.equal(auditSummaryPayload.total >= 2, true)
    assert.equal(auditSummaryPayload.byAction['foundation.approval.execution-failed'] >= 1, true)
    assert.equal(auditSummaryPayload.byAction['foundation.approval.executed'] >= 1, true)

    const approvalSummary = await request(app.getHttpServer())
      .get('/foundation/trust-governance/approvals/summary')
      .query({
        executionStatus: 'reset-bulk',
        groupBy: 'operation,executionStatus,failureStatus'
      })
    const approvalSummaryPayload = approvalSummary.body.data ?? approvalSummary.body
    assert.equal(approvalSummary.statusCode, 200)
    assert.equal(approvalSummaryPayload.total, 1)
    assert.equal(approvalSummaryPayload.statuses.APPROVED, 1)
    assert.equal(approvalSummaryPayload.execution.executed, 1)
    assert.equal(approvalSummaryPayload.execution.withFailures, 1)
    assert.equal(approvalSummaryPayload.execution.byExecutionStatus['reset-bulk'], 1)
    assert.equal(approvalSummaryPayload.execution.byFailureStatus['reset-bulk-failed'], 1)
    assert.equal(approvalSummaryPayload.groups.length, 1)
    assert.deepEqual(approvalSummaryPayload.groups[0].dimensions, {
      operation: 'quota-ledger.reset',
      executionStatus: 'reset-bulk',
      failureStatus: 'reset-bulk-failed'
    })
    assert.equal(approvalSummaryPayload.groups[0].total, 1)

    const failureFiltered = await request(app.getHttpServer())
      .get('/foundation/trust-governance/approvals')
      .query({
        approvalTicket,
        hasFailures: true,
        failureStatus: 'reset-bulk-failed'
      })
    const failureFilteredPayload = failureFiltered.body.data ?? failureFiltered.body
    assert.equal(failureFiltered.statusCode, 200)
    assert.equal(failureFilteredPayload.length, 1)
    assert.equal(failureFilteredPayload[0].ticket, approvalTicket)
    assert.equal(failureFilteredPayload[0].execution.lastFailure?.failureStatus, 'reset-bulk-failed')
  } finally {
    await app.close()
  }
})
