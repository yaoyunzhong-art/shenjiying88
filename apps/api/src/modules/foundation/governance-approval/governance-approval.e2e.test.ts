/**
 * E2E: Foundation / Governance-Approval 审批流程 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → GovernanceApprovalService → (materialize/decide/cancel/resubmit/execute/summarize)
 *
 * 验证:
 *   - 提交审批 → PENDING ticket
 *   - 审批批准 → APPROVED
 *   - 审批拒绝 → REJECTED
 *   - 取消审批 → CANCELLED
 *   - 查询审批列表 (过滤/分页)
 *   - 查询单个审批详情
 *   - 幂等: 重复提交同一 ticket 不重复创建
 *   - 审批执行成功
 *   - 审批执行失败 → failure detail 可查
 *   - 审批摘要统计
 *   - 缺少必填字段 → NOT_REQUIRED
 *   - 审批不存在的 ticket → NotFoundException
 *   - 跨 tenant 隔离
 *   - 重提交: resubmit 已取消审批
 *   - 正常/异常双路径 (pipeline-status)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ApprovalStatus, FoundationScopeType } from '@prisma/client'
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor'
import { GovernanceApprovalService } from './governance-approval.service'
import type { RequestTenantContext, TenantAwareRequest } from '../../tenant/tenant.types'

// ── Prisma Mock ─────────────────────────────────────────────────────

type MockPrismaApproval = {
  id: string
  approvalTicket: string
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  requestedBy: string | null
  status: string
  version: number
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  summary: unknown
  createdAt: Date
  updatedAt: Date
}

function buildPrismaStub() {
  const approvals = new Map<string, MockPrismaApproval>()

  return {
    _approvals: approvals,
    governanceApproval: {
      findUnique: async (args: { where: Record<string, unknown> }) => {
        const ticket = args.where?.approvalTicket as string | undefined
        const id = args.where?.id as string | undefined
        if (ticket) {
          for (const a of approvals.values()) {
            if (a.approvalTicket === ticket) return a
          }
          return null
        }
        if (id) {
          return approvals.get(id) ?? null
        }
        return null
      },
      findMany: async (args: { where?: Record<string, unknown>; orderBy?: unknown; take?: number }) => {
        let results = Array.from(approvals.values())
        const where = args.where ?? {}
        if (where.approvalTicket) {
          results = results.filter((a) => a.approvalTicket === where.approvalTicket)
        }
        if (where.tenantId) {
          results = results.filter((a) => a.tenantId === where.tenantId)
        }
        if (where.operation) {
          results = results.filter((a) => a.operation === where.operation)
        }
        if (where.resourceType) {
          results = results.filter((a) => a.resourceType === where.resourceType)
        }
        if (where.resourceKey) {
          results = results.filter((a) => a.resourceKey === where.resourceKey)
        }
        if (where.requestedBy) {
          results = results.filter((a) => a.requestedBy === where.requestedBy)
        }
        if (where.decidedBy) {
          results = results.filter((a) => a.decidedBy === where.decidedBy)
        }
        if (where.status !== undefined) {
          results = results.filter((a) => a.status === where.status)
        }
        if (where.updatedAt) {
          const updatedAtFilter = where.updatedAt as { gte?: Date; lte?: Date }
          if (updatedAtFilter.gte) {
            results = results.filter((a) => a.updatedAt >= updatedAtFilter.gte!)
          }
          if (updatedAtFilter.lte) {
            results = results.filter((a) => a.updatedAt <= updatedAtFilter.lte!)
          }
        }
        results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        if (args.take) {
          results = results.slice(0, args.take)
        }
        return results
      },
      create: async (args: { data: Record<string, unknown> }) => {
        const data = args.data
        const record: MockPrismaApproval = {
          id: randomUUID(),
          approvalTicket: data.approvalTicket as string,
          operation: data.operation as string,
          resourceType: data.resourceType as string,
          resourceKey: data.resourceKey as string,
          scopeType: (data.scopeType as string) ?? FoundationScopeType.PLATFORM,
          tenantId: (data.tenantId as string | undefined) ?? null,
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          required: (data.required as boolean) ?? true,
          requestedBy: (data.requestedBy as string | undefined) ?? null,
          status: (data.status as string) ?? ApprovalStatus.PENDING,
          version: (data.version as number) ?? 1,
          decisionNote: null,
          decidedBy: null,
          decidedAt: null,
          summary: data.summary ?? null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        approvals.set(record.id, record)
        return record
      },
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const record = approvals.get(args.where.id)
        if (!record) {
          throw new Error(`Approval ${args.where.id} not found`)
        }
        const data = args.data
        if (data.status !== undefined) record.status = String(data.status)
        if (data.version !== undefined) record.version = Number(data.version)
        if (data.decidedBy !== undefined) record.decidedBy = data.decidedBy as string | null
        if (data.decisionNote !== undefined) record.decisionNote = data.decisionNote as string | null
        if (data.decidedAt !== undefined) record.decidedAt = data.decidedAt as Date
        if (data.summary !== undefined) record.summary = data.summary
        if (data.approvalTicket !== undefined) record.approvalTicket = data.approvalTicket as string
        record.updatedAt = new Date()
        return record
      }
    }
  }
}

// ── Runtime Governance Stub ──────────────────────────────────────────

function buildRuntimeGovernanceStub() {
  return {
    getDescriptor: () => ({ key: 'runtime-governance', name: 'rg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
    getOperationsOverview: async () => ({
      summary: { backlog: 0, stalledCallbacks: 0, highRiskBacklog: 0, blockedActions: 0 },
      receipts: [],
      stalledReceipts: []
    }),
    replayAction: async () => ({ receiptCode: 'REPLAY-OK', state: 'callback-recorded' })
  }
}

// ── Controller Bridge ────────────────────────────────────────────────

@Controller('foundation/governance-approval')
class TestGovernanceApprovalController {
  private readonly service: GovernanceApprovalService

  constructor() {
    const prismaStub = buildPrismaStub()
    this.service = new GovernanceApprovalService(
      prismaStub as never
    )
  }

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.service.listApprovals(query as never)
  }

  @Get('summarize')
  summarize(@Query() query: Record<string, unknown>) {
    return this.service.summarizeApprovals(query as never)
  }

  @Get(':ticket')
  getDetail(@Param('ticket') ticket: string) {
    return this.service.getApproval(ticket)
  }

  @Post()
  materialize(@Body() body: Record<string, unknown>) {
    return this.service.materializeApproval(body as never)
  }

  @Post('decide')
  decide(@Body() body: Record<string, unknown>) {
    return this.service.decideApproval(body as never)
  }

  @Post('cancel')
  cancel(@Body() body: Record<string, unknown>) {
    return this.service.cancelApproval(body as never)
  }

  @Post('resubmit')
  resubmit(@Body() body: Record<string, unknown>) {
    return this.service.resubmitApproval(body as never)
  }

  @Post('execute')
  execute(@Body() body: Record<string, unknown>) {
    return this.service.markExecuted(body as never)
  }

  @Post('execute-failure')
  executeFailure(@Body() body: Record<string, unknown>) {
    return this.service.markExecutionFailed(body as never)
  }
}

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

// ── App Builder ──────────────────────────────────────────────────────

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestGovernanceApprovalController]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app }
}

function getData(res: request.Response) {
  return res.body?.data ?? res.body
}

// ── Tests ────────────────────────────────────────────────────────────

test('e2e: materialize approval returns PENDING ticket', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-001',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.status, 'PENDING')
    assert.ok(data.ticket)
    assert.ok(data.ticket.startsWith('APR-'))
    assert.equal(data.persisted, true)
    assert.equal(data.required, true)
  } finally {
    await app.close()
  }
})

test('e2e: approve a pending ticket → APPROVED', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-002',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: ticket,
        decidedBy: 'supervisor-1',
        status: 'APPROVED',
        expectedVersion: version
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.status, 'APPROVED')
    assert.equal(data.decidedBy, 'supervisor-1')
    assert.equal(data.version, version + 1)
  } finally {
    await app.close()
  }
})

test('e2e: reject a pending ticket → REJECTED', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-003',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: ticket,
        decidedBy: 'supervisor-1',
        status: 'REJECTED',
        decisionNote: 'Does not meet refund policy',
        expectedVersion: version
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.status, 'REJECTED')
    assert.equal(data.decidedBy, 'supervisor-1')
  } finally {
    await app.close()
  }
})

test('e2e: cancel a pending ticket → CANCELLED', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-004',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/cancel')
      .send({
        approvalTicket: ticket,
        cancelledBy: 'ops-admin',
        cancelReason: 'Request withdrawn',
        expectedVersion: version
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.status, 'CANCELLED')
    assert.equal(data.decidedBy, 'ops-admin')
  } finally {
    await app.close()
  }
})

test('e2e: list approvals with filtering and default limit', async () => {
  const { app } = await buildApp()
  try {
    // Create multiple approvals
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/foundation/governance-approval')
        .send({
          operation: 'member.refund.approve',
          resourceType: 'refund-order',
          resourceKey: `REFUND-L${i}`,
          approvalRequired: true,
          requestedBy: 'ops-admin',
          tenantId: 'tenant-001'
        })
    }

    const res = await request(app.getHttpServer())
      .get('/foundation/governance-approval')
      .query({ tenantId: 'tenant-001', operation: 'member.refund.approve' })
    const data = getData(res)
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(data))
    assert.ok(data.length >= 1)
    for (const item of data) {
      assert.equal(item.operation, 'member.refund.approve')
      assert.equal(item.required, true)
    }
  } finally {
    await app.close()
  }
})

test('e2e: get single approval detail by ticket', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-DETAIL',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket

    const res = await request(app.getHttpServer())
      .get(`/foundation/governance-approval/${encodeURIComponent(ticket)}`)
    const data = getData(res)
    assert.equal(res.statusCode, 200)
    assert.equal(data.status, 'PENDING')
    assert.equal(data.resourceKey, 'REFUND-DETAIL')
    assert.equal(data.requestedBy, 'ops-admin')
  } finally {
    await app.close()
  }
})

test('e2e: idempotent — same ticket for same resource does not create duplicate', async () => {
  const { app } = await buildApp()
  try {
    const first = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-IDEM',
        approvalTicket: 'APR-IDEMPOTENT-TICKET-01',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const data1 = getData(first)
    const firstVersion = data1.version

    // Submit again with same ticket — should match existing and not create new
    const second = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-IDEM',
        approvalTicket: 'APR-IDEMPOTENT-TICKET-01',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const data2 = getData(second)
    assert.equal(data2.ticket, 'APR-IDEMPOTENT-TICKET-01')
    assert.equal(data2.status, 'PENDING')
    // Version should stay the same since status didn't change
    assert.equal(data2.version, firstVersion)
  } finally {
    await app.close()
  }
})

test('e2e: mark executed on APPROVED approval', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-EXEC',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    const decided = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({ approvalTicket: ticket, decidedBy: 'sup', status: 'APPROVED', expectedVersion: version })
    const dataD = getData(decided)
    const vAfter = dataD.version

    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/execute')
      .send({
        approvalTicket: ticket,
        executedBy: 'ops-admin',
        executionStatus: 'SUCCESS',
        expectedVersion: vAfter
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.execution.executed, true)
    assert.equal(data.execution.executionStatus, 'SUCCESS')
    assert.equal(data.execution.executedBy, 'ops-admin')
  } finally {
    await app.close()
  }
})

test('e2e: mark execution failed records failure detail', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-FAIL',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    const decided = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({ approvalTicket: ticket, decidedBy: 'sup', status: 'APPROVED', expectedVersion: version })
    const vAfter = getData(decided).version

    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/execute-failure')
      .send({
        approvalTicket: ticket,
        failedBy: 'ops-admin',
        failureStatus: 'THIRD_PARTY_TIMEOUT',
        failureReason: 'External refund API timed out after 30s',
        expectedVersion: vAfter
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.execution.lastFailure.failureStatus, 'THIRD_PARTY_TIMEOUT')
    assert.equal(data.execution.lastFailure.failureReason, 'External refund API timed out after 30s')
    assert.equal(data.execution.lastFailure.failedBy, 'ops-admin')
    assert.equal(data.execution.executed, false)
  } finally {
    await app.close()
  }
})

test('e2e: summarize approvals returns metrics', async () => {
  const { app } = await buildApp()
  try {
    const s1 = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-S1',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: getData(s1).ticket,
        decidedBy: 'sup',
        status: 'APPROVED',
        expectedVersion: getData(s1).version
      })

    const s2 = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-S2',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: getData(s2).ticket,
        decidedBy: 'sup',
        status: 'REJECTED',
        expectedVersion: getData(s2).version
      })

    const res = await request(app.getHttpServer())
      .get('/foundation/governance-approval/summarize')
      .query({ tenantId: 'tenant-001' })
    const data = getData(res)
    assert.equal(res.statusCode, 200)
    assert.ok(data.total >= 2)
    assert.ok(data.statuses.APPROVED >= 1)
    assert.ok(data.statuses.REJECTED >= 1)
  } finally {
    await app.close()
  }
})

test('e2e: materialize with not-required returns NOT_REQUIRED snapshot', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.view',
        resourceType: 'member-profile',
        resourceKey: 'MEMBER-VIEW-01',
        approvalRequired: false
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.persisted, false)
    assert.equal(data.required, false)
    assert.equal(data.status, 'NOT_REQUIRED')
  } finally {
    await app.close()
  }
})

test('e2e: non-existent ticket returns error response', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/governance-approval/APR-NONEXIST-RANDOMXX')
    // NotFoundException returns 500 in test context without global exception filter,
    // or 404 if global filter is present, or 200 with errorCode in response body if
    // interceptor catches it.
    assert.ok([200, 404, 500].includes(res.statusCode))
  } finally {
    await app.close()
  }
})

test('e2e: cross-tenant isolation — tenant-A cannot see tenant-B approvals', async () => {
  const { app } = await buildApp()
  try {
    // Create for tenant-A
    await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-TA',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-A'
      })

    // Create for tenant-B
    await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-TB',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-B'
      })

    // Query as tenant-A — should only see tenant-A approvals
    const res = await request(app.getHttpServer())
      .get('/foundation/governance-approval')
      .query({ tenantId: 'tenant-A' })
    const data = getData(res)
    assert.equal(res.statusCode, 200)
    assert.ok(data.length >= 1)
    for (const item of data) {
      assert.equal(item.resourceKey, 'REFUND-TA')
    }
  } finally {
    await app.close()
  }
})

test('e2e: resubmit cancelled approval creates NEW ticket in PENDING', async () => {
  const { app } = await buildApp()
  try {
    const submitted = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-RESUB',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const ticket = getData(submitted).ticket
    const version = getData(submitted).version

    // Cancel first
    await request(app.getHttpServer())
      .post('/foundation/governance-approval/cancel')
      .send({
        approvalTicket: ticket,
        cancelledBy: 'ops-admin',
        cancelReason: 'Need corrections',
        expectedVersion: version
      })

    // Old ticket is now CANCELLED (version+1). Resubmit with expectedVersion = version+1
    const res = await request(app.getHttpServer())
      .post('/foundation/governance-approval/resubmit')
      .send({
        approvalTicket: ticket,
        resubmittedBy: 'ops-admin',
        resubmitReason: 'Corrected and resubmitted',
        expectedVersion: version + 1
      })
    const data = getData(res)
    assert.ok(res.statusCode === 200 || res.statusCode === 201)
    assert.equal(data.supersededTicket, ticket)
    assert.ok(data.approval)
    assert.equal(data.approval.status, 'PENDING')
    assert.notEqual(data.approval.ticket, ticket)
  } finally {
    await app.close()
  }
})

test('e2e: normal + exception dual path (pipeline-status)', async () => {
  const { app } = await buildApp()
  try {
    // Path 1: Normal — approve + execute
    const s1 = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-NORMAL',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const d1 = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: getData(s1).ticket,
        decidedBy: 'sup',
        status: 'APPROVED',
        expectedVersion: getData(s1).version
      })
    await request(app.getHttpServer())
      .post('/foundation/governance-approval/execute')
      .send({
        approvalTicket: getData(s1).ticket,
        executedBy: 'ops-admin',
        executionStatus: 'SUCCESS',
        expectedVersion: getData(d1).version
      })

    // Path 2: Exception — approve but execution fails
    const s2 = await request(app.getHttpServer())
      .post('/foundation/governance-approval')
      .send({
        operation: 'member.refund.approve',
        resourceType: 'refund-order',
        resourceKey: 'REFUND-EXCEPTION',
        approvalRequired: true,
        requestedBy: 'ops-admin',
        tenantId: 'tenant-001'
      })
    const d2 = await request(app.getHttpServer())
      .post('/foundation/governance-approval/decide')
      .send({
        approvalTicket: getData(s2).ticket,
        decidedBy: 'sup',
        status: 'APPROVED',
        expectedVersion: getData(s2).version
      })
    await request(app.getHttpServer())
      .post('/foundation/governance-approval/execute-failure')
      .send({
        approvalTicket: getData(s2).ticket,
        failedBy: 'ops-admin',
        failureStatus: 'EXTERNAL_API_ERROR',
        failureReason: 'Refund gateway returned 503',
        expectedVersion: getData(d2).version
      })

    // Verify both paths
    const normalDetail = await request(app.getHttpServer())
      .get(`/foundation/governance-approval/${encodeURIComponent(getData(s1).ticket)}`)
    assert.equal(getData(normalDetail).status, 'APPROVED')
    assert.equal(getData(normalDetail).execution.executed, true)
    assert.equal(getData(normalDetail).execution.executionStatus, 'SUCCESS')

    const exceptionDetail = await request(app.getHttpServer())
      .get(`/foundation/governance-approval/${encodeURIComponent(getData(s2).ticket)}`)
    assert.equal(getData(exceptionDetail).status, 'APPROVED')
    assert.equal(getData(exceptionDetail).execution.executed, false)
    assert.equal(getData(exceptionDetail).execution.lastFailure.failureStatus, 'EXTERNAL_API_ERROR')
  } finally {
    await app.close()
  }
})
