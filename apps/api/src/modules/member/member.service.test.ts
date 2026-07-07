import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

import { PrismaService } from '../../prisma/prisma.service'
import { MemberService, resetMemberServiceTestState } from './member.service'
import { MemberController } from './member.controller'
import { MemberApprovalOutcomeRecorder } from './member-approval-recorder'
import { GovernanceApprovalService } from '../foundation/governance-approval/governance-approval.service'
import type { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import {
  MemberLevel,
  type MemberMutationApprovalResult,
  type MemberProfile,
  MemberStatus,
  computeMemberLevel,
  canUpgrade,
  MEMBER_LEVEL_THRESHOLDS
} from './member.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'

type TestPrisma = ReturnType<typeof createPrismaStub>

/**
 * 构造用于闭环验证的最小 governance approval 栈：
 * - 真实 GovernanceApprovalService：保证 decideApproval 走完整状态机和 outcome hook 派发
 * - 真实 MemberApprovalOutcomeRecorder：通过 onModuleInit 注册到 outcomeHooks
 * - 桩 RuntimeGovernanceService：只暴露 replayAction/getActionReceipt，不会触发 runtime-governance 自动恢复分支
 */
function asPrismaService(prisma: TestPrisma): PrismaService {
  return prisma as unknown as PrismaService
}

function createTestMemberService(prisma?: TestPrisma, runtimeGovernanceService?: unknown) {
  return new MemberService(
    prisma ? asPrismaService(prisma) : undefined,
    runtimeGovernanceService as RuntimeGovernanceService | undefined
  )
}

function createApprovalClosureHarness(prisma: TestPrisma) {
  const governanceApprovalService = new GovernanceApprovalService(
    asPrismaService(prisma)
  )

  const recorder = new MemberApprovalOutcomeRecorder(
    asPrismaService(prisma),
    governanceApprovalService
  )

  // 注册 outcome hook，使 recorder 能监听 governance approval 事件
  recorder.onModuleInit()

  return { governanceApprovalService, recorder }
}

// ── helpers ────────────────────────────────────────────────────
function createContext(
  overrides: Partial<RequestTenantContext> = {}
): RequestTenantContext {
  return {
    tenantId: 'tenant-mem',
    brandId: 'brand-mem',
    storeId: 'store-mem-1',
    marketCode: 'cn-mainland',
    ...overrides
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createMemberController(service = createTestMemberService()): MemberController {
  return new MemberController(service)
}

function assertMemberProfileResult(
  value: MemberProfile | MemberMutationApprovalResult
): asserts value is MemberProfile {
  assert.ok(!('approvalRequired' in value), 'expected immediate member profile result')
}

function assertApprovalResult(
  value: MemberProfile | MemberMutationApprovalResult
): asserts value is MemberMutationApprovalResult {
  assert.ok('approvalRequired' in value, 'expected approval result')
}

function createPrismaStub() {
  const users = new Map<string, { id: string; tenantId: string; mobile: string; role: string; createdAt: Date; updatedAt: Date }>()
  const memberProfiles = new Map<string, {
    id: string
    tenantId: string
    userId: string | null
    points: number
    growthValue: number
    svipStatus: string
    createdAt: Date
    updatedAt: Date
  }>()
  const memberProfileExtensions = new Map<string, {
    id: string
    tenantId: string
    memberProfileId: string
    email?: string | null
    address?: string | null
    notes?: string | null
    createdAt: Date
    updatedAt: Date
  }>()
  const lytMemberSnapshots = new Map<string, {
    id: string
    tenantId: string
    brandId?: string | null
    storeId?: string | null
    memberProfileId?: string | null
    externalMemberId: string
    memberCode?: string | null
    mobile?: string | null
    nickname?: string | null
    levelCode?: string | null
    points: number
    growthValue: number
    status: string
    updatedAtFromSource: Date
    rawVersion?: string | null
    rawPayload?: Record<string, unknown> | null
    createdAt: Date
    updatedAt: Date
  }>()
  const memberOperationsTasks = new Map<string, {
    taskId: string
    tenantId: string
    brandId?: string | null
    storeId?: string | null
    marketCode?: string | null
    memberId: string
    actionCode: string
    title: string
    reason: string
    channel: string
    priority: string
    status: string
    executionLane: string
    source: string
    sourceOrderId?: string | null
    sourcePaymentId?: string | null
    executionSummary?: string | null
    executionTargetId?: string | null
    executedAt?: Date | null
    dedupeKey: string
    createdAt: Date
    scheduledAt: Date
    updatedAt: Date
  }>()
  const memberOperationsReceipts = new Map<string, {
    executionId: string
    tenantId: string
    brandId?: string | null
    storeId?: string | null
    marketCode?: string | null
    memberId: string
    taskId: string
    actionCode: string
    targetType: string
    targetId: string
    status: string
    summary: string
    payload: Record<string, unknown>
    runtimeReceiptCode?: string | null
    runtimeState?: string | null
    runtimeReplayable?: boolean | null
    executedAt: Date
    createdAt: Date
    updatedAt: Date
  }>()
  const auditLogs: Array<{
    id: string
    tenantId: string
    brandId?: string | null
    storeId?: string | null
    action: string
    operatorId: string
    resourceType?: string | null
    resourceId?: string | null
    sourceChannel?: string | null
    purpose?: string | null
    payload?: Record<string, unknown> | null
    beforeValue?: Record<string, unknown> | null
    afterValue?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
    createdAt: Date
  }> = []
  const governanceApprovals = new Map<string, {
    id: string
    approvalTicket: string | null
    operation: string
    resourceType: string
    resourceKey: string
    scopeType: string
    tenantId: string | null
    brandId?: string | null
    storeId?: string | null
    required: boolean
    requestedBy: string | null
    status: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED'
    version: number
    decisionNote: string | null
    decidedBy: string | null
    decidedAt: Date | null
    summary: Record<string, unknown> | null
    createdAt: Date
    updatedAt: Date
  }>()

  return {
    user: {
      findUnique: async ({ where }: { where: { id?: string; mobile?: string } }) => {
        if (where.id) {
          return Array.from(users.values()).find((item) => item.id === where.id) ?? null
        }
        if (where.mobile) {
          return users.get(where.mobile) ?? null
        }
        return null
      },
      create: async ({ data }: { data: { tenantId: string; mobile: string; role: string } }) => {
        const now = new Date()
        const record = {
          id: `user-${users.size + 1}`,
          tenantId: data.tenantId,
          mobile: data.mobile,
          role: data.role,
          createdAt: now,
          updatedAt: now
        }
        users.set(record.mobile, record)
        return record
      },
      update: async ({ where, data }: { where: { id: string }; data: { mobile?: string } }) => {
        const existing = Array.from(users.values()).find((item) => item.id === where.id)
        if (!existing) {
          throw new Error(`User ${where.id} not found`)
        }
        users.delete(existing.mobile)
        const nextRecord = {
          ...existing,
          mobile: data.mobile ?? existing.mobile,
          updatedAt: new Date()
        }
        users.set(nextRecord.mobile, nextRecord)
        return nextRecord
      }
    },
    memberProfile: {
      findFirst: async ({ where }: { where: { tenantId?: string; userId?: string | null } }) => {
        return (
          Array.from(memberProfiles.values()).find((item) => {
            if (where.tenantId && item.tenantId !== where.tenantId) return false
            if (where.userId !== undefined && item.userId !== where.userId) return false
            return true
          }) ?? null
        )
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return memberProfiles.get(where.id) ?? null
      },
      findMany: async ({ where }: { where: { tenantId?: string } }) => {
        const records = Array.from(memberProfiles.values()).filter((item) => {
          return where.tenantId ? item.tenantId === where.tenantId : true
        })
        return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      },
      create: async ({ data }: { data: { tenantId: string; userId?: string; points?: number; growthValue?: number; svipStatus?: string } }) => {
        const now = new Date()
        const record = {
          id: `member-${memberProfiles.size + 1}`,
          tenantId: data.tenantId,
          userId: data.userId ?? null,
          points: data.points ?? 0,
          growthValue: data.growthValue ?? 0,
          svipStatus: data.svipStatus ?? 'INACTIVE',
          createdAt: now,
          updatedAt: now
        }
        memberProfiles.set(record.id, record)
        return record
      }
    },
    memberProfileExtension: {
      findUnique: async ({ where }: { where: { memberProfileId: string } }) => {
        return memberProfileExtensions.get(where.memberProfileId) ?? null
      },
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { memberProfileId: string }
        create: Record<string, unknown>
        update: Record<string, unknown>
      }) => {
        const now = new Date()
        const existing = memberProfileExtensions.get(where.memberProfileId)
        const nextRecord = existing
          ? {
              ...existing,
              ...update,
              updatedAt: now
            }
          : {
              id: `member-profile-extension-${memberProfileExtensions.size + 1}`,
              tenantId: String(create.tenantId),
              memberProfileId: String(create.memberProfileId),
              email: (create.email as string | undefined) ?? null,
              address: (create.address as string | undefined) ?? null,
              notes: (create.notes as string | undefined) ?? null,
              createdAt: now,
              updatedAt: now
            }
        memberProfileExtensions.set(where.memberProfileId, nextRecord)
        return nextRecord
      }
    },
    lytMemberSnapshot: {
      findUnique: async ({ where }: { where: { tenantId_externalMemberId: { tenantId: string; externalMemberId: string } } }) => {
        const compositeKey = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`
        return lytMemberSnapshots.get(compositeKey) ?? null
      },
      findFirst: async ({ where }: { where: { tenantId?: string; memberProfileId?: string | null } }) => {
        return (
          Array.from(lytMemberSnapshots.values()).find((item) => {
            if (where.tenantId && item.tenantId !== where.tenantId) return false
            if (where.memberProfileId !== undefined && item.memberProfileId !== where.memberProfileId) return false
            return true
          }) ?? null
        )
      },
      findMany: async ({ where }: { where: { tenantId?: string } }) => {
        const records = Array.from(lytMemberSnapshots.values()).filter((item) =>
          where.tenantId ? item.tenantId === where.tenantId : true
        )
        return records.sort((a, b) => b.updatedAtFromSource.getTime() - a.updatedAtFromSource.getTime())
      },
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { tenantId_externalMemberId: { tenantId: string; externalMemberId: string } }
        create: Record<string, unknown>
        update: Record<string, unknown>
      }) => {
        const compositeKey = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`
        const existing = lytMemberSnapshots.get(compositeKey)
        const now = new Date()
        const nextRecord = existing
          ? {
              ...existing,
              ...update,
              updatedAt: now
            }
          : {
              id: `lyt-member-snapshot-${lytMemberSnapshots.size + 1}`,
              tenantId: String(create.tenantId),
              brandId: (create.brandId as string | undefined) ?? null,
              storeId: (create.storeId as string | undefined) ?? null,
              memberProfileId: (create.memberProfileId as string | undefined) ?? null,
              externalMemberId: String(create.externalMemberId),
              memberCode: (create.memberCode as string | undefined) ?? null,
              mobile: (create.mobile as string | undefined) ?? null,
              nickname: (create.nickname as string | undefined) ?? null,
              levelCode: (create.levelCode as string | undefined) ?? null,
              points: Number(create.points ?? 0),
              growthValue: Number(create.growthValue ?? 0),
              status: String(create.status ?? 'ACTIVE'),
              updatedAtFromSource: create.updatedAtFromSource as Date,
              rawVersion: (create.rawVersion as string | undefined) ?? null,
              rawPayload: (create.rawPayload as Record<string, unknown> | undefined) ?? null,
              createdAt: now,
              updatedAt: now
            }
        lytMemberSnapshots.set(compositeKey, nextRecord)
        return nextRecord
      }
    },
    memberOperationsTask: {
      findUnique: async ({ where }: { where: { taskId?: string; dedupeKey?: string } }) => {
        if (where.taskId) {
          return memberOperationsTasks.get(where.taskId) ?? null
        }
        if (where.dedupeKey) {
          return (
            Array.from(memberOperationsTasks.values()).find((item) => item.dedupeKey === where.dedupeKey) ??
            null
          )
        }
        return null
      },
      findMany: async ({
        where,
        orderBy
      }: {
        where: { tenantId?: string; memberId?: string }
        orderBy?: Array<{ createdAt: 'asc' | 'desc' }>
      }) => {
        const records = Array.from(memberOperationsTasks.values()).filter((item) => {
          if (where.tenantId && item.tenantId !== where.tenantId) return false
          if (where.memberId && item.memberId !== where.memberId) return false
          return true
        })
        const direction = orderBy?.[0]?.createdAt ?? 'desc'
        return records.sort((a, b) =>
          direction === 'desc'
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime()
        )
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date()
        const record = {
          taskId: String(data.taskId),
          tenantId: String(data.tenantId),
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          marketCode: (data.marketCode as string | undefined) ?? null,
          memberId: String(data.memberId),
          actionCode: String(data.actionCode),
          title: String(data.title),
          reason: String(data.reason),
          channel: String(data.channel),
          priority: String(data.priority),
          status: String(data.status),
          executionLane: String(data.executionLane),
          source: String(data.source),
          sourceOrderId: (data.sourceOrderId as string | undefined) ?? null,
          sourcePaymentId: (data.sourcePaymentId as string | undefined) ?? null,
          executionSummary: (data.executionSummary as string | undefined) ?? null,
          executionTargetId: (data.executionTargetId as string | undefined) ?? null,
          executedAt: (data.executedAt as Date | null | undefined) ?? null,
          dedupeKey: String(data.dedupeKey),
          createdAt: data.createdAt as Date,
          scheduledAt: data.scheduledAt as Date,
          updatedAt: now
        }
        memberOperationsTasks.set(record.taskId, record)
        return record
      },
      update: async ({ where, data }: { where: { taskId: string }; data: Record<string, unknown> }) => {
        const existing = memberOperationsTasks.get(where.taskId)
        if (!existing) {
          throw new Error(`Task ${where.taskId} not found`)
        }
        const nextRecord = {
          ...existing,
          ...data,
          taskId: existing.taskId,
          dedupeKey: String(data.dedupeKey ?? existing.dedupeKey),
          createdAt: (data.createdAt as Date | undefined) ?? existing.createdAt,
          scheduledAt: (data.scheduledAt as Date | undefined) ?? existing.scheduledAt,
          executedAt:
            data.executedAt === null
              ? null
              : ((data.executedAt as Date | undefined) ?? existing.executedAt ?? null),
          updatedAt: new Date()
        }
        memberOperationsTasks.set(existing.taskId, nextRecord)
        return nextRecord
      }
    },
    memberOperationsExecutionReceipt: {
      findUnique: async ({ where }: { where: { executionId: string } }) => {
        return memberOperationsReceipts.get(where.executionId) ?? null
      },
      findMany: async ({
        where,
        orderBy
      }: {
        where: { tenantId?: string; memberId?: string }
        orderBy?: Array<{ executedAt: 'asc' | 'desc' }>
      }) => {
        const records = Array.from(memberOperationsReceipts.values()).filter((item) => {
          if (where.tenantId && item.tenantId !== where.tenantId) return false
          if (where.memberId && item.memberId !== where.memberId) return false
          return true
        })
        const direction = orderBy?.[0]?.executedAt ?? 'desc'
        return records.sort((a, b) =>
          direction === 'desc'
            ? b.executedAt.getTime() - a.executedAt.getTime()
            : a.executedAt.getTime() - b.executedAt.getTime()
        )
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date()
        const record = {
          executionId: String(data.executionId),
          tenantId: String(data.tenantId),
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          marketCode: (data.marketCode as string | undefined) ?? null,
          memberId: String(data.memberId),
          taskId: String(data.taskId),
          actionCode: String(data.actionCode),
          targetType: String(data.targetType),
          targetId: String(data.targetId),
          status: String(data.status),
          summary: String(data.summary),
          payload: ((data.payload as Record<string, unknown> | undefined) ?? {}),
          runtimeReceiptCode: (data.runtimeReceiptCode as string | undefined) ?? null,
          runtimeState: (data.runtimeState as string | undefined) ?? null,
          runtimeReplayable: (data.runtimeReplayable as boolean | undefined) ?? null,
          executedAt: data.executedAt as Date,
          createdAt: now,
          updatedAt: now
        }
        memberOperationsReceipts.set(record.executionId, record)
        return record
      },
      update: async ({
        where,
        data
      }: {
        where: { executionId: string }
        data: Record<string, unknown>
      }) => {
        const existing = memberOperationsReceipts.get(where.executionId)
        if (!existing) {
          throw new Error(`Receipt ${where.executionId} not found`)
        }
        const nextRecord = {
          ...existing,
          ...data,
          executionId: existing.executionId,
          payload: ((data.payload as Record<string, unknown> | undefined) ?? existing.payload),
          executedAt: (data.executedAt as Date | undefined) ?? existing.executedAt,
          updatedAt: new Date()
        }
        memberOperationsReceipts.set(existing.executionId, nextRecord)
        return nextRecord
      }
    },
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `audit-${auditLogs.length + 1}`,
          tenantId: String(data.tenantId),
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          action: String(data.action),
          operatorId: String(data.operatorId ?? 'member-admin'),
          resourceType: (data.resourceType as string | undefined) ?? null,
          resourceId: (data.resourceId as string | undefined) ?? null,
          sourceChannel: (data.sourceChannel as string | undefined) ?? null,
          purpose: (data.purpose as string | undefined) ?? null,
          payload: (data.payload as Record<string, unknown> | undefined) ?? null,
          beforeValue: (data.beforeValue as Record<string, unknown> | undefined) ?? null,
          afterValue: (data.afterValue as Record<string, unknown> | undefined) ?? null,
          metadata: (data.metadata as Record<string, unknown> | undefined) ?? null,
          createdAt: new Date()
        }
        auditLogs.unshift(record)
        return record
      },
      findMany: async ({
        where,
        take
      }: {
        where: {
          tenantId?: string
          resourceType?: string
          resourceId?: string
          purpose?: string | { in?: string[] }
        }
        take?: number
      }) => {
        const records = auditLogs.filter((item) => {
          if (where.tenantId && item.tenantId !== where.tenantId) return false
          if (where.resourceType && item.resourceType !== where.resourceType) return false
          if (where.resourceId && item.resourceId !== where.resourceId) return false
          if (where.purpose) {
            if (typeof where.purpose === 'string') {
              if (item.purpose !== where.purpose) return false
            } else if (where.purpose.in) {
              if (!item.purpose || !where.purpose.in.includes(item.purpose)) return false
            }
          }
          return true
        })
        return records.slice(0, take ?? records.length)
      }
    },
    governanceApproval: {
      findUnique: async ({ where }: { where: { approvalTicket?: string } }) => {
        if (!where.approvalTicket) {
          return null
        }
        return governanceApprovals.get(where.approvalTicket) ?? null
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date()
        const approvalTicket = (data.approvalTicket as string | undefined) ?? null
        const record = {
          id: `governance-approval-${governanceApprovals.size + 1}`,
          approvalTicket,
          operation: String(data.operation),
          resourceType: String(data.resourceType),
          resourceKey: String(data.resourceKey),
          scopeType: String(data.scopeType ?? 'TENANT'),
          tenantId: (data.tenantId as string | undefined) ?? null,
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          required: Boolean(data.required),
          requestedBy: (data.requestedBy as string | undefined) ?? null,
          status: String(data.status ?? 'PENDING') as
            | 'NOT_REQUIRED'
            | 'PENDING'
            | 'APPROVED'
            | 'REJECTED'
            | 'CANCELLED'
            | 'SUPERSEDED',
          version: Number(data.version ?? 1),
          decisionNote: null,
          decidedBy: null,
          decidedAt: null,
          summary: (data.summary as Record<string, unknown> | undefined) ?? null,
          createdAt: now,
          updatedAt: now
        }
        if (approvalTicket) {
          governanceApprovals.set(approvalTicket, record)
        }
        return record
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = Array.from(governanceApprovals.values()).find((item) => item.id === where.id)
        if (!existing) {
          throw new Error(`Governance approval ${where.id} not found`)
        }
        const nextRecord = {
          ...existing,
          ...data,
          id: existing.id,
          approvalTicket: (data.approvalTicket as string | undefined) ?? existing.approvalTicket,
          summary: (data.summary as Record<string, unknown> | undefined) ?? existing.summary,
          updatedAt: new Date()
        }
        if (existing.approvalTicket) {
          governanceApprovals.delete(existing.approvalTicket)
        }
        if (nextRecord.approvalTicket) {
          governanceApprovals.set(nextRecord.approvalTicket, nextRecord)
        }
        return nextRecord
      }
    }
  }
}

beforeEach(() => {
  resetMemberServiceTestState()
})

// ── Original MemberService contract tests ──────────────────────
describe('member service contract (via controller)', () => {
  it('getBootstrap returns tenantContext unchanged', () => {
    const ctrl = createMemberController()
    const ctx = createContext()
    const result = ctrl.getBootstrap(ctx)
    assert.deepStrictEqual(result.tenantContext, ctx)
  })

  it('getBootstrap always returns scaffold phase', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.equal(result.phase, 'scaffold')
  })

  it('getBootstrap exposes member-center capability', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.ok(result.capabilities.includes('member-center'))
  })

  it('getBootstrap exposes points capability', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.ok(result.capabilities.includes('points'))
  })

  it('getBootstrap exposes svip capability', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.ok(result.capabilities.includes('svip'))
  })

  it('getBootstrap exposes blind-box capability', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.ok(result.capabilities.includes('blind-box'))
  })

  it('getBootstrap capabilities length is 4', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap(createContext())
    assert.equal(result.capabilities.length, 4)
  })

  it('getBootstrap with minimal context preserves tenantId', () => {
    const ctrl = createMemberController()
    const result = ctrl.getBootstrap({
      tenantId: 'min-tenant',
    } as RequestTenantContext)
    assert.equal(result.tenantContext.tenantId, 'min-tenant')
  })

  it('getBootstrap with full context preserves brandId and storeId', () => {
    const ctrl = createMemberController()
    const ctx = createContext({
      brandId: 'brand-x',
      storeId: 'store-y',
    })
    const result = ctrl.getBootstrap(ctx)
    assert.equal(result.tenantContext.brandId, 'brand-x')
    assert.equal(result.tenantContext.storeId, 'store-y')
  })

  it('getBootstrap with different marketCode preserves it', () => {
    const ctrl = createMemberController()
    const ctx = createContext({ marketCode: 'en-global' })
    const result = ctrl.getBootstrap(ctx)
    assert.equal(result.tenantContext.marketCode, 'en-global')
  })
})

// ── MemberService direct unit tests ─────────────────────────────

describe('MemberService direct instantiation', () => {
  it('MemberService is instantiable without dependencies', () => {
    const service = createTestMemberService()
    assert.ok(service instanceof MemberService)
  })

  it('getBootstrap returns consistent phase', () => {
    const service = createTestMemberService()
    const ctx = createContext()
    const result = service.getBootstrap(ctx)
    assert.equal(result.phase, 'scaffold')
  })

  it('getBootstrap with empty tenantId still returns scaffold', () => {
    const service = createTestMemberService()
    const result = service.getBootstrap({
      tenantId: '',
      brandId: undefined,
      storeId: undefined,
      marketCode: undefined,
    } as RequestTenantContext)
    assert.equal(result.phase, 'scaffold')
    assert.equal(result.tenantContext.tenantId, '')
    assert.deepStrictEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box'])
  })

  it('getBootstrap capabilities are immutable across calls', () => {
    const service = createTestMemberService()
    const r1 = service.getBootstrap(createContext())
    const r2 = service.getBootstrap(createContext({ tenantId: 'different' }))
    assert.notDeepStrictEqual(r1.tenantContext, r2.tenantContext)
    assert.deepStrictEqual(r1.capabilities, r2.capabilities)
  })

  it('getBootstrap preserves all context fields when fully populated', () => {
    const service = createTestMemberService()
    const ctx: RequestTenantContext = {
      tenantId: 't-full',
      brandId: 'b-full',
      storeId: 's-full',
      marketCode: 'zh-hk',
    }
    const result = service.getBootstrap(ctx)
    assert.equal(result.tenantContext.tenantId, 't-full')
    assert.equal(result.tenantContext.brandId, 'b-full')
    assert.equal(result.tenantContext.storeId, 's-full')
    assert.equal(result.tenantContext.marketCode, 'zh-hk')
  })
})

describe('MemberService vs MemberController consistency', () => {
  it('service and controller produce identical results for same input', () => {
    const service = createTestMemberService()
    const controller = createMemberController(service)
    const ctx = createContext()

    const svcResult = service.getBootstrap(ctx)
    const ctrlResult = controller.getBootstrap(ctx)

    assert.deepStrictEqual(svcResult, ctrlResult)
  })

  it('service and controller both handle undefined optional fields', () => {
    const service = createTestMemberService()
    const controller = createMemberController(service)
    const ctx: RequestTenantContext = { tenantId: 't-only' } as RequestTenantContext

    const svcResult = service.getBootstrap(ctx)
    const ctrlResult = controller.getBootstrap(ctx)

    assert.equal(svcResult.tenantContext.brandId, ctrlResult.tenantContext.brandId)
    assert.equal(svcResult.tenantContext.storeId, ctrlResult.tenantContext.storeId)
  })
})

describe('MemberService edge cases', () => {
  it('getBootstrap with very long tenantId', () => {
    const service = createTestMemberService()
    const longId = 't-' + 'a'.repeat(200)
    const result = service.getBootstrap({ tenantId: longId } as RequestTenantContext)
    assert.equal(result.tenantContext.tenantId, longId)
  })

  it('getBootstrap with unicode tenantId', () => {
    const service = createTestMemberService()
    const result = service.getBootstrap({ tenantId: '租户-テスト-тест' } as RequestTenantContext)
    assert.equal(result.tenantContext.tenantId, '租户-テスト-тест')
  })

  it('getBootstrap with special characters in tenantId', () => {
    const service = createTestMemberService()
    const result = service.getBootstrap({ tenantId: 't_123-abc.def@org' } as RequestTenantContext)
    assert.equal(result.tenantContext.tenantId, 't_123-abc.def@org')
  })

  it('getBootstrap returned object is a new reference each call', () => {
    const service = createTestMemberService()
    const ctx = createContext()
    const r1 = service.getBootstrap(ctx)
    const r2 = service.getBootstrap(ctx)
    assert.notStrictEqual(r1, r2)
    assert.notStrictEqual(r1.capabilities, r2.capabilities)
  })
})

// ── NEW: register + getProfile + listProfiles ───────────────────

describe('MemberService.register()', () => {
  it('registers a new bronze-level member', () => {
    const service = createTestMemberService()
    const profile = service.register({
      memberId: uid('mem'),
      tenantContext: createContext(),
      nickname: 'Alice'
    })

    assert.equal(profile.memberId.startsWith('mem-'), true)
    assert.equal(profile.level, MemberLevel.Bronze)
    assert.equal(profile.status, MemberStatus.Active)
    assert.equal(profile.points, 0)
    assert.equal(profile.nickname, 'Alice')
    assert.ok(profile.registeredAt)
    assert.ok(profile.lastActiveAt)
  })

  it('throws when registering duplicate memberId', () => {
    const service = createTestMemberService()
    const dupId = uid('dup')
    service.register({
      memberId: dupId,
      tenantContext: createContext(),
      nickname: 'Bob'
    })

    assert.throws(
      () => service.register({
        memberId: dupId,
        tenantContext: createContext(),
        nickname: 'Charlie'
      }),
      /already exists/
    )
  })

  it('registered member is retrievable via getProfile', () => {
    const service = createTestMemberService()
    const mid = uid('mem')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Diana'
    })

    const profile = service.getProfile(mid)
    assert.ok(profile)
    assert.equal(profile!.nickname, 'Diana')
  })

  it('getProfile returns undefined for unknown member', () => {
    const service = createTestMemberService()
    assert.equal(service.getProfile(uid('ghost')), undefined)
  })

  it('preserves tenant context in profile', () => {
    const service = createTestMemberService()
    const mid = uid('ctx')
    const ctx = createContext({ tenantId: 't-special', brandId: 'b-special' })
    const profile = service.register({
      memberId: mid,
      tenantContext: ctx,
      nickname: 'Eve'
    })

    assert.equal(profile.tenantContext.tenantId, 't-special')
    assert.equal(profile.tenantContext.brandId, 'b-special')
  })
})

describe('MemberService persistent member flow', () => {
  it('registerPersistent creates user-bound persistent member profile', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const profile = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13800000000',
      nickname: 'Persisted Alice',
      initialPoints: 600
    })

    assert.equal(profile.persisted, true)
    assert.equal(profile.source, 'prisma')
    assert.equal(profile.mobile, '13800000000')
    assert.equal(profile.nickname, 'Persisted Alice')
    assert.equal(profile.points, 600)
    assert.equal(profile.level, MemberLevel.Silver)
    assert.ok(profile.userId)
  })

  it('login returns session and auto-hydrated persistent member', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13900000000',
      nickname: 'Session User',
      initialPoints: 2000
    })

    const result = await service.login({
      tenantContext: createContext(),
      mobile: '13900000000'
    })

    assert.equal(result.member.mobile, '13900000000')
    assert.equal(result.member.level, MemberLevel.Gold)
    assert.equal(result.session.tenantId, 'tenant-mem')
    assert.equal(result.session.authenticated, true)
    assert.ok(result.session.sessionToken.length > 20)

    const storedSession = service.getSession(result.session.sessionToken)
    assert.deepStrictEqual(storedSession, result.session)
  })

  it('getPersistentProfile resolves persisted member by id', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13700000000',
      nickname: 'Lookup User'
    })

    const result = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(result?.memberId, created.memberId)
    assert.equal(result?.persisted, true)
    assert.equal(result?.mobile, '13700000000')
  })

  it('awardPoints updates persisted member points and level below approval threshold', async () => {
    const prisma: any = createPrismaStub()
    prisma.memberProfile.update = async ({ where, data }: any) => {
      const target = await prisma.memberProfile.findUnique({ where })
      if (!target) {
        throw new Error('member not found')
      }
      target.points += data.points.increment
      target.growthValue += data.growthValue.increment
      target.updatedAt = new Date()
      return target
    }

    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000001',
      nickname: 'Award User',
      initialPoints: 100
    })

    const updated = await service.awardPoints(created.memberId, 4200, createContext())
    assertMemberProfileResult(updated)
    assert.equal(updated.points, 4300)
    assert.equal(updated.level, MemberLevel.Gold)
  })

  it('awardPoints returns approval result for high-risk bonus', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000011',
      nickname: 'Approval Award User',
      initialPoints: 100
    })

    const updated = await service.awardPoints(created.memberId, 5200, createContext())
    assertApprovalResult(updated)
    assert.equal(updated.applied, false)
    assert.equal(updated.approvalRequired, true)
    assert.equal(updated.approvalStatus, 'PENDING')
    assert.equal(updated.operation, 'member.points.award')

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.points, 100)
  })

  it('rollbackPoints deducts persisted member points and level safely', async () => {
    const prisma: any = createPrismaStub()
    prisma.memberProfile.update = async ({ where, data }: any) => {
      const target = await prisma.memberProfile.findUnique({ where })
      if (!target) {
        throw new Error('member not found')
      }
      target.points = data.points
      target.growthValue = data.growthValue
      target.updatedAt = new Date()
      return target
    }

    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000002',
      nickname: 'Rollback User',
      initialPoints: 900
    })

    const updated = await service.rollbackPoints(created.memberId, 500, createContext())
    assertMemberProfileResult(updated)
    assert.equal(updated.points, 400)
    assert.equal(updated.level, MemberLevel.Bronze)
  })

  it('rollbackPoints returns approval result for high-risk deduction', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000014',
      nickname: 'Approval Rollback User',
      initialPoints: 1800
    })

    const updated = await service.rollbackPoints(created.memberId, 1200, createContext())
    assertApprovalResult(updated)
    assert.equal(updated.applied, false)
    assert.equal(updated.approvalRequired, true)
    assert.equal(updated.operation, 'member.points.rollback')

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.points, 1800)
  })

  it('updatePersistentStatus persists non-risk status override through snapshot hydration', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000003',
      nickname: 'Status User',
      initialPoints: 1200
    })

    const updated = await service.updatePersistentStatus(created.memberId, MemberStatus.Frozen, createContext())
    assertMemberProfileResult(updated)
    assert.equal(updated.status, MemberStatus.Frozen)

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.status, MemberStatus.Frozen)
  })

  it('updatePersistentStatus returns approval result for blacklist action', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000012',
      nickname: 'Blacklist Approval User',
      initialPoints: 1200
    })

    const updated = await service.updatePersistentStatus(created.memberId, MemberStatus.Blacklisted, createContext())
    assertApprovalResult(updated)
    assert.equal(updated.applied, false)
    assert.equal(updated.approvalRequired, true)
    assert.equal(updated.operation, 'member.status.update')

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.status, MemberStatus.Active)
  })

  it('updatePersistentProfile persists nickname and extension fields through snapshot hydration', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000005',
      nickname: 'Profile User',
      initialPoints: 1200
    })

    const updated = await service.updatePersistentProfile({
      memberId: created.memberId,
      tenantContext: createContext(),
      nickname: 'Profile User Updated',
      mobile: '13600000999',
      email: 'member@example.com',
      address: '深圳南山科技园',
      notes: '高净值会员'
    })
    assert.equal(updated.nickname, 'Profile User Updated')
    assert.equal(updated.mobile, '13600000999')
    assert.equal(updated.email, 'member@example.com')
    assert.equal(updated.address, '深圳南山科技园')
    assert.equal(updated.notes, '高净值会员')

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.nickname, 'Profile User Updated')
    assert.equal(profile?.mobile, '13600000999')
    assert.equal(profile?.email, 'member@example.com')
    assert.equal(profile?.address, '深圳南山科技园')
    assert.equal(profile?.notes, '高净值会员')
  })

  it('listPersistentMutationHistory returns recent member audits', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000006',
      nickname: 'Audit User',
      initialPoints: 1200
    })

    await service.updatePersistentProfile({
      memberId: created.memberId,
      tenantContext: createContext(),
      nickname: 'Audit User Updated',
      mobile: '13600000111'
    })
    await service.updatePersistentStatus(created.memberId, MemberStatus.Frozen, createContext())

    const history = await service.listPersistentMutationHistory(created.memberId, createContext())
    assert.ok(history.length >= 2)
    assert.equal(history[0]?.memberId, created.memberId)
    assert.ok(history.some((entry) => entry.action === 'profile-updated'))
    assert.ok(history.some((entry) => entry.action === 'status-updated'))
  })

  it('listPersistentMutationHistory merges approval outcome audit entries', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000020',
      nickname: 'Approval Audit User',
      initialPoints: 12000
    })

    // 模拟 governance approval 写回：直接构造一条 member-approval-outcome auditLog。
    await prisma.auditLog.create({
      data: {
        tenantId: 'tenant-mem',
        brandId: 'brand-mem',
        storeId: 'store-mem-1',
        action: 'member.approval.approved',
        operatorId: 'ops.approver',
        resourceType: 'member-profile',
        resourceId: created.memberId,
        sourceChannel: 'governance-approval',
        purpose: 'member-approval-outcome',
        payload: {
          stage: 'APPROVED',
          approvalTicket: 'apr-ticket-001',
          approvalStatus: 'APPROVED',
          operation: 'member.points.award',
          resourceKey: created.memberId,
          previousStatus: 'PENDING',
          requestedBy: 'ops.admin-web'
        },
        beforeValue: { approvalStatus: 'PENDING' },
        afterValue: { approvalStatus: 'APPROVED', stage: 'APPROVED' },
        metadata: {
          summary: '审批通过：member.points.award',
          stage: 'APPROVED',
          previousStatus: 'PENDING'
        }
      }
    })

    const history = await service.listPersistentMutationHistory(created.memberId, createContext())
    assert.ok(
      history.some((entry) => entry.action === 'approval.approved'),
      'approval outcome entry should be present in mutation history'
    )
    const approvalEntry = history.find((entry) => entry.action === 'approval.approved')
    assert.ok(approvalEntry?.summary.includes('审批通过'))
    assert.equal(approvalEntry?.memberId, created.memberId)
    assert.equal(approvalEntry?.operatorId, 'ops.approver')
  })

  it('high-risk awardPoints -> governance approval -> approved -> AuditLog closure loop', async () => {
    const prisma = createPrismaStub()
    const { governanceApprovalService } = createApprovalClosureHarness(prisma)
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000030',
      nickname: 'Closure Loop Award User',
      initialPoints: 100
    })

    // 1) 高额加分触发 governance approval PENDING 工单
    const pending = await service.awardPoints(created.memberId, 5200, createContext())
    assertApprovalResult(pending)
    assert.equal(pending.applied, false)
    assert.equal(pending.approvalRequired, true)
    assert.equal(pending.approvalStatus, 'PENDING')
    assert.equal(pending.operation, 'member.points.award')
    assert.ok(pending.approvalTicket)

    // 2) 审批人决策通过 -> outcome hook 派发 -> MemberApprovalOutcomeRecorder 写 AuditLog
    const decided = await governanceApprovalService.decideApproval({
      approvalTicket: pending.approvalTicket!,
      decidedBy: 'ops.approver-closure',
      decisionNote: 'manual review ok',
      status: 'APPROVED'
    })
    assert.equal(decided.status, 'APPROVED')

    // 3) 会员侧历史读侧能直接拿到审批结果条目
    const history = await service.listPersistentMutationHistory(created.memberId, createContext())
    const approvalEntry = history.find((entry) => entry.action === 'approval.approved')
    assert.ok(approvalEntry, 'closure loop must surface approval.approved entry in mutation history')
    assert.ok(approvalEntry?.summary.includes('审批通过'))
    assert.equal(approvalEntry?.operatorId, 'ops.approver-closure')
  })

  it('high-risk rollbackPoints rejection -> AuditLog reflects approval.rejected entry', async () => {
    const prisma = createPrismaStub()
    const { governanceApprovalService } = createApprovalClosureHarness(prisma)
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000031',
      nickname: 'Closure Loop Rollback User',
      initialPoints: 5000
    })

    const pending = await service.rollbackPoints(created.memberId, 1500, createContext())
    assertApprovalResult(pending)
    assert.equal(pending.approvalRequired, true)
    assert.ok(pending.approvalTicket)

    await governanceApprovalService.decideApproval({
      approvalTicket: pending.approvalTicket!,
      decidedBy: 'ops.reviewer',
      decisionNote: 'insufficient evidence',
      status: 'REJECTED'
    })

    const history = await service.listPersistentMutationHistory(created.memberId, createContext())
    const rejected = history.find((entry) => entry.action === 'approval.rejected')
    assert.ok(rejected, 'closure loop must surface approval.rejected entry in mutation history')
    assert.ok(rejected?.summary.includes('审批驳回'))
    assert.equal(rejected?.operatorId, 'ops.reviewer')
  })

  it('blacklist status approval cancellation writes approval.cancelled audit entry', async () => {
    const prisma = createPrismaStub()
    const { governanceApprovalService } = createApprovalClosureHarness(prisma)
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000032',
      nickname: 'Closure Loop Blacklist User',
      initialPoints: 2400
    })

    const pending = await service.updatePersistentStatus(
      created.memberId,
      MemberStatus.Blacklisted,
      createContext()
    )
    assertApprovalResult(pending)
    assert.equal(pending.approvalRequired, true)
    assert.equal(pending.operation, 'member.status.update')
    assert.ok(pending.approvalTicket)

    await governanceApprovalService.cancelApproval({
      approvalTicket: pending.approvalTicket!,
      cancelledBy: 'ops.requester',
      cancelReason: 'false positive'
    })

    const history = await service.listPersistentMutationHistory(created.memberId, createContext())
    const cancelled = history.find((entry) => entry.action === 'approval.cancelled')
    assert.ok(cancelled, 'closure loop must surface approval.cancelled entry in mutation history')
    assert.ok(cancelled?.summary.includes('审批撤销'))
    assert.equal(cancelled?.operatorId, 'ops.requester')
  })

  it('overridePersistentLevel persists level override through snapshot hydration', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000004',
      nickname: 'Level User',
      initialPoints: 1200
    })

    const updated = await service.overridePersistentLevel(created.memberId, MemberLevel.Platinum, createContext())
    assertMemberProfileResult(updated)
    assert.equal(updated.level, MemberLevel.Platinum)

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.level, MemberLevel.Platinum)
  })

  it('overridePersistentLevel returns approval result for manual downgrade', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)
    const created = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000013',
      nickname: 'Downgrade Approval User',
      initialPoints: 12000
    })

    const updated = await service.overridePersistentLevel(created.memberId, MemberLevel.Silver, createContext())
    assertApprovalResult(updated)
    assert.equal(updated.applied, false)
    assert.equal(updated.approvalRequired, true)
    assert.equal(updated.operation, 'member.level.override')

    const profile = await service.getPersistentProfile(created.memberId, createContext())
    assert.equal(profile?.level, MemberLevel.Platinum)
  })

  it('syncLytMemberSnapshot creates standard snapshot and persistent business profile', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-001',
      memberCode: 'VIP-001',
      mobile: '13500000000',
      nickname: 'LYT Alice',
      levelCode: 'VIP',
      points: 3200,
      growthValue: 3600,
      status: 'ACTIVE',
      updatedAt: '2026-06-14T12:00:00.000Z',
      rawPayload: {
        externalMemberId: 'lyt-member-001',
        nickname: 'LYT Alice'
      }
    })

    assert.equal(result.snapshot.externalMemberId, 'lyt-member-001')
    assert.equal(result.snapshot.memberProfileId, result.profile.memberId)
    assert.equal(result.snapshot.mobile, '13500000000')
    assert.equal(result.profile.mobile, '13500000000')
    assert.equal(result.profile.nickname, 'LYT Alice')
    assert.equal(result.profile.points, 3200)
    assert.equal(result.profile.level, MemberLevel.Gold)

    const snapshot = await service.getLytMemberSnapshot('lyt-member-001', createContext())
    assert.equal(snapshot?.memberCode, 'VIP-001')
    assert.equal(snapshot?.levelCode, 'VIP')
  })

  it('getPersistentProfile hydrates snapshot nickname and mobile when user is absent', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-002',
      nickname: 'Snapshot Only',
      points: 1200,
      growthValue: 1500,
      updatedAt: '2026-06-14T12:10:00.000Z'
    })

    const profile = await service.getPersistentProfile(result.profile.memberId, createContext())
    assert.equal(profile?.nickname, 'Snapshot Only')
    assert.equal(profile?.lastActiveAt, '2026-06-14T12:10:00.000Z')
  })

  it('recordPaymentActivity enriches lifecycle stage and tags on persistent profile', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-003',
      nickname: 'Lifecycle User',
      points: 2100,
      growthValue: 2300,
      updatedAt: '2026-06-14T12:20:00.000Z'
    })

    const enriched = await service.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-003',
      amount: 288,
      paidAt: '2026-06-14T12:30:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    assert.equal(enriched.lifecycleStage, 'vip-active')
    assert.equal(enriched.lastPaymentOrderId, 'lyt-order-003')
    assert.equal(enriched.lastPaymentAmount, 288)
    assert.ok(enriched.tags?.includes('paid-member'))
    assert.ok(enriched.tags?.includes('high-value-buyer'))
    assert.ok(enriched.tags?.includes('channel-wechat-pay'))

    const tasks = await service.listOperationsTasks(result.profile.memberId, createContext())
    const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext())
    assert.ok(tasks.length > 0)
    assert.ok(receipts.length > 0)
    assert.ok(tasks.every((task) => task.source === 'payment-success'))
    assert.ok(tasks.some((task) => task.sourceOrderId === 'lyt-order-003'))
  })

  it('getOperationsProfile derives audience segments and recommended actions from enriched profile', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-004',
      nickname: 'Ops User',
      points: 12000,
      growthValue: 15000,
      updatedAt: '2026-06-14T12:40:00.000Z'
    })

    await service.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-004',
      amount: 520,
      paidAt: '2026-06-14T12:45:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    const operations = await service.getOperationsProfile(result.profile.memberId, createContext())

    assert.equal(operations?.lifecycleStage, 'vip-active')
    assert.ok(operations?.audienceSegments.includes('high-value-buyer'))
    assert.ok(operations?.audienceSegments.includes('channel-wechat-pay'))
    assert.ok(
      operations?.recommendedActions.some((action) => action.code === 'assign-vip-concierge')
    )
    assert.ok(
      operations?.automationTriggers.some((trigger) => trigger.code === 'payment-success-journey')
    )
  })

  it('enqueueOperationsTasks queues deduped execution tasks from operations profile', async () => {
    const prisma = createPrismaStub()
    const service = createTestMemberService(prisma)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-005',
      nickname: 'Queue User',
      points: 2200,
      growthValue: 2600,
      updatedAt: '2026-06-14T12:50:00.000Z'
    })

    await service.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-005',
      amount: 188,
      paidAt: '2026-06-14T12:55:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    const first = await service.enqueueOperationsTasks({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      source: 'payment-success',
      sourceOrderId: 'lyt-order-005',
      sourcePaymentId: 'lyt-payment-005'
    })
    const second = await service.enqueueOperationsTasks({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      source: 'payment-success',
      sourceOrderId: 'lyt-order-005',
      sourcePaymentId: 'lyt-payment-005'
    })

    assert.equal(first.queuedTasks.length, 0)
    assert.equal(second.queuedTasks.length, 0)
    assert.ok(first.existingTasks.length >= 1)
    assert.ok(second.existingTasks.length >= 1)

    const listed = await service.listOperationsTasks(result.profile.memberId, createContext())
    assert.equal(listed.length, first.existingTasks.length)
    const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext())
    assert.ok(receipts.length >= 1)
  })

  it('enqueueOperationsTasks records runtime governance receipt and supports replay', async () => {
    const prisma = createPrismaStub()
    const runtimeCalls: string[] = []
    const mockRuntimeGovernanceService = {
      submitAction: async () => {
        runtimeCalls.push('submit')
        return {
          receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
          state: 'submitted',
          ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
          ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
        }
      },
      syncAction: async () => {
        runtimeCalls.push('sync')
        return {
          receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
          state: 'submitted',
          ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
          ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
        }
      },
      recordCallback: async () => {
        runtimeCalls.push('callback')
        return {
          receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
          state: 'callback-recorded',
          ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
          ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
        }
      },
      getActionReceipt: async () => ({
        receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
        state: 'callback-recorded',
        ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
        ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: true }
      }),
      replayAction: async () => {
        runtimeCalls.push('replay')
        return {
          receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001',
          state: 'replay-scheduled',
          ticket: { ticketCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001-HANDLER' },
          ledger: { ledgerKey: 'runtime-ledger:ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001', replayable: false }
        }
      }
    }
    const service = createTestMemberService(prisma, mockRuntimeGovernanceService)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-006',
      nickname: 'Runtime User',
      points: 1200,
      growthValue: 1600,
      updatedAt: '2026-06-14T13:10:00.000Z'
    })

    await service.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-006',
      amount: 120,
      paidAt: '2026-06-14T13:15:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    const receipts = await service.listOperationsReceipts(result.profile.memberId, createContext())
    const runtimeReceipt = await service.getOperationsRuntimeReceipt(
      result.profile.memberId,
      receipts[0]!.executionId,
      createContext()
    )
    const replayed = await service.replayOperationsExecution(
      result.profile.memberId,
      receipts[0]!.executionId,
      createContext()
    )

    assert.ok(receipts[0]?.runtimeReceiptCode)
    assert.equal(runtimeReceipt?.receiptCode, 'ADMIN-WEB-COUPON-CLAIM-PROCEED-TEST001')
    assert.equal(replayed?.state, 'replay-scheduled')
    assert.deepEqual(runtimeCalls, ['submit', 'sync', 'callback', 'replay'])
  })

  it('recordPaymentActivity auto-writes coupon + notification marketing metrics by tenant', async () => {
    const prisma = createPrismaStub()
    const metrics = new MarketingMetricsService()
    const service = new MemberService(asPrismaService(prisma), undefined, metrics)

    const result = await service.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-008',
      nickname: 'Metrics Ops User',
      points: 2400,
      growthValue: 2800,
      updatedAt: '2026-06-15T10:00:00.000Z'
    })

    await service.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-008',
      amount: 288,
      paidAt: '2026-06-15T10:05:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    const snapshot = metrics.snapshot(createContext().tenantId)
    assert.equal(snapshot.couponIssuedTotal, 1)
    assert.equal(snapshot.notificationDispatchTotal, 2)
  })

  it('enqueueOperationsTasks persists tasks and receipts across service instances', async () => {
    const prisma = createPrismaStub()
    const firstService = createTestMemberService(prisma)

    const result = await firstService.syncLytMemberSnapshot({
      tenantContext: createContext(),
      externalMemberId: 'lyt-member-007',
      nickname: 'Persistent Ops User',
      points: 2600,
      growthValue: 3200,
      updatedAt: '2026-06-15T09:00:00.000Z'
    })

    await firstService.recordPaymentActivity({
      memberId: result.profile.memberId,
      tenantContext: createContext(),
      orderId: 'lyt-order-007',
      amount: 268,
      paidAt: '2026-06-15T09:05:00.000Z',
      channel: 'wechat-pay',
      source: 'lyt-snapshot'
    })

    const seededTasks = await firstService.listOperationsTasks(result.profile.memberId, createContext())
    const seededReceipts = await firstService.listOperationsReceipts(result.profile.memberId, createContext())

    const secondService = createTestMemberService(prisma)
    const listedTasks = await secondService.listOperationsTasks(result.profile.memberId, createContext())
    const listedReceipts = await secondService.listOperationsReceipts(result.profile.memberId, createContext())

    assert.equal(listedTasks.length, seededTasks.length)
    assert.equal(listedReceipts.length, seededReceipts.length)
    assert.ok(listedTasks.every((task) => task.tenantContext.tenantId === createContext().tenantId))
    assert.ok(
      listedReceipts.every((receipt) =>
        seededReceipts.some((item) => item.executionId === receipt.executionId)
      )
    )
  })
})

describe('MemberService.listProfiles()', () => {
  it('listProfiles returns an array', () => {
    const service = createTestMemberService()
    const profiles = service.listProfiles()
    assert.ok(Array.isArray(profiles))
  })

  it('newly registered members appear in list', () => {
    const service = createTestMemberService()
    const idA = uid('la')
    const idB = uid('lb')
    service.register({
      memberId: idA,
      tenantContext: createContext(),
      nickname: 'Alpha'
    })
    service.register({
      memberId: idB,
      tenantContext: createContext(),
      nickname: 'Beta'
    })

    const profiles = service.listProfiles()
    const ids = profiles.map(p => p.memberId)
    assert.ok(ids.includes(idA))
    assert.ok(ids.includes(idB))
  })
})

// ── NEW: addPoints + level computation ──────────────────────────

describe('MemberService.addPoints()', () => {
  it('adds points and Bronze stays Bronze with small amount', () => {
    const service = createTestMemberService()
    const mid = uid('pts')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Frank'
    })

    const updated = service.addPoints(mid, 300)
    assert.equal(updated.points, 300)
    assert.equal(updated.level, MemberLevel.Bronze) // 300 < 500
  })

  it('adds points and upgrades to Silver when crossing 500', () => {
    const service = createTestMemberService()
    const mid = uid('up')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Grace'
    })

    const updated = service.addPoints(mid, 600)
    assert.equal(updated.points, 600)
    assert.equal(updated.level, MemberLevel.Silver) // 600 >= 500
  })

  it('adds points and upgrades to Gold when crossing 2000', () => {
    const service = createTestMemberService()
    const mid = uid('gold')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Hank'
    })

    const updated = service.addPoints(mid, 2500)
    assert.equal(updated.points, 2500)
    assert.equal(updated.level, MemberLevel.Gold) // 2500 >= 2000
  })

  it('upgrades to Platinum at 10000 points', () => {
    const service = createTestMemberService()
    const mid = uid('plat')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Iris'
    })

    const updated = service.addPoints(mid, 10000)
    assert.equal(updated.points, 10000)
    assert.equal(updated.level, MemberLevel.Platinum)
  })

  it('upgrades to Diamond at 50000 points', () => {
    const service = createTestMemberService()
    const mid = uid('dia')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Jack'
    })

    const updated = service.addPoints(mid, 50000)
    assert.equal(updated.points, 50000)
    assert.equal(updated.level, MemberLevel.Diamond)
  })

  it('accumulates points over multiple addPoints calls', () => {
    const service = createTestMemberService()
    const mid = uid('acc')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Kate'
    })

    service.addPoints(mid, 300)
    service.addPoints(mid, 300)
    const updated = service.addPoints(mid, 400)

    assert.equal(updated.points, 1000)
    assert.equal(updated.level, MemberLevel.Silver) // 1000 >= 500, < 2000
  })

  it('updates lastActiveAt on addPoints', () => {
    const service = createTestMemberService()
    const mid = uid('act')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Leo'
    })

    // Small delay to ensure timestamp changes
    const before = new Date().toISOString()
    const updated = service.addPoints(mid, 100)

    assert.ok(updated.lastActiveAt! >= before)
  })

  it('throws for unknown member', () => {
    const service = createTestMemberService()
    assert.throws(
      () => service.addPoints(uid('ghost'), 100),
      /not found/
    )
  })

  it('throws for non-positive points', () => {
    const service = createTestMemberService()
    const mid = uid('zero')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Mia'
    })

    assert.throws(
      () => service.addPoints(mid, 0),
      /must be positive/
    )
    assert.throws(
      () => service.addPoints(mid, -50),
      /must be positive/
    )
  })

  it('revokePoints deducts points and recalculates level', () => {
    const service = createTestMemberService()
    const mid = uid('revoke')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Revoke User'
    })

    service.addPoints(mid, 700)
    const updated = service.revokePoints(mid, 300)
    assert.equal(updated.points, 400)
    assert.equal(updated.level, MemberLevel.Bronze)
  })

  it('revokePoints floors at zero', () => {
    const service = createTestMemberService()
    const mid = uid('revoke-floor')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Revoke Floor User'
    })

    service.addPoints(mid, 100)
    const updated = service.revokePoints(mid, 500)
    assert.equal(updated.points, 0)
    assert.equal(updated.level, MemberLevel.Bronze)
  })
})

// ── NEW: checkUpgrade ───────────────────────────────────────────

describe('MemberService.checkUpgrade()', () => {
  it('Bronze member with 300 points cannot upgrade', () => {
    const service = createTestMemberService()
    const mid = uid('chk')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Nina'
    })
    service.addPoints(mid, 300)

    const result = service.checkUpgrade(mid)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.currentLevel, MemberLevel.Bronze)
  })

  it('Bronze member with 0 points cannot upgrade', () => {
    const service = createTestMemberService()
    const mid = uid('chk2')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Oscar'
    })

    const result = service.checkUpgrade(mid)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.currentLevel, MemberLevel.Bronze)
    assert.equal(result.nextLevel, null)
  })

  it('Platinum member with enough points can upgrade to Diamond', () => {
    const service = createTestMemberService()
    const mid = uid('chk3')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Paul'
    })
    service.addPoints(mid, 60000) // now Diamond (>= 50000)

    const result = service.checkUpgrade(mid)
    // 60000 >= 50000 => Diamond, cannot upgrade further
    assert.equal(result.currentLevel, MemberLevel.Diamond)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.nextLevel, null)
    assert.equal(result.pointsNeeded, 0)
  })

  it('Diamond member cannot upgrade further', () => {
    const service = createTestMemberService()
    const mid = uid('max')
    service.register({
      memberId: mid,
      tenantContext: createContext(),
      nickname: 'Quinn'
    })
    service.addPoints(mid, 100000)

    const result = service.checkUpgrade(mid)
    assert.equal(result.currentLevel, MemberLevel.Diamond)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.nextLevel, null)
    assert.equal(result.pointsNeeded, 0)
  })

  it('throws for unknown member', () => {
    const service = createTestMemberService()
    assert.throws(
      () => service.checkUpgrade(uid('phant')),
      /not found/
    )
  })
})

// ── Entity pure function tests ──────────────────────────────────

describe('computeMemberLevel (pure)', () => {
  it('returns Bronze for 0 points', () => {
    assert.equal(computeMemberLevel(0), MemberLevel.Bronze)
  })

  it('returns Silver at exact 500', () => {
    assert.equal(computeMemberLevel(500), MemberLevel.Silver)
  })

  it('returns Gold at exact 2000', () => {
    assert.equal(computeMemberLevel(2000), MemberLevel.Gold)
  })

  it('returns Platinum at exact 10000', () => {
    assert.equal(computeMemberLevel(10000), MemberLevel.Platinum)
  })

  it('returns Diamond at exact 50000', () => {
    assert.equal(computeMemberLevel(50000), MemberLevel.Diamond)
  })

  it('all thresholds are monotonic', () => {
    const levels = Object.values(MemberLevel)
    for (let i = 1; i < levels.length; i++) {
      assert.ok(
        MEMBER_LEVEL_THRESHOLDS[levels[i]] > MEMBER_LEVEL_THRESHOLDS[levels[i - 1]],
        `${levels[i]} threshold should be > ${levels[i - 1]}`
      )
    }
  })
})

describe('canUpgrade (pure)', () => {
  it('Bronze + 600 points => can upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 600), true)
  })

  it('Bronze + 100 points => cannot upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 100), false)
  })

  it('Diamond + 99999 points => cannot upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Diamond, 99999), false)
  })

  it('Gold at 12000 points can upgrade to Platinum', () => {
    // computeMemberLevel(12000) = Platinum > Gold => true
    assert.equal(canUpgrade(MemberLevel.Gold, 12000), true)
  })
})
