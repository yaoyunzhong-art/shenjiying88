/**
 * 🐜 自动: [member] [A] 模块补全 — controller spec 增强
 *
 * 覆盖：bootstrap / register / getProfile / listProfiles / addPoints / checkUpgrade
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'
import type {
  MemberLoginResult,
  MemberProfile,
  MemberProfileMutationHistoryEntry
} from './member.entity'
import { MemberLevel, MemberStatus } from './member.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── helpers ──
function createContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'cn-mainland',
    ...overrides
  }
}

function freshController(): MemberController {
  return new MemberController(new MemberService())
}

function createControllerWithServiceStub(service: Partial<MemberService>): MemberController {
  return new MemberController(service as unknown as MemberService)
}

function createProfileFixture(overrides: Partial<MemberProfile> = {}): MemberProfile {
  return {
    memberId: 'member-fixture',
    tenantContext: createContext(),
    nickname: 'Fixture Member',
    level: MemberLevel.Bronze,
    status: MemberStatus.Active,
    points: 0,
    registeredAt: '2026-06-20T00:00:00.000Z',
    ...overrides
  }
}

function createHistoryEntryFixture(
  overrides: Partial<MemberProfileMutationHistoryEntry> = {}
): MemberProfileMutationHistoryEntry {
  return {
    historyId: 'history-fixture-001',
    tenantContext: createContext(),
    memberId: 'member-fixture',
    action: 'profile-updated',
    summary: 'fixture history entry',
    sourceChannel: 'admin-web',
    operatorId: 'ops.fixture',
    createdAt: '2026-06-20T00:00:00.000Z',
    ...overrides
  }
}

function createLoginResultFixture(overrides: Partial<MemberLoginResult> = {}): MemberLoginResult {
  return {
    member: createProfileFixture({
      memberId: 'member-login',
      mobile: '13500000000'
    }),
    session: {
      sessionToken: 'sess-1',
      memberId: 'member-login',
      userId: 'user-login',
      tenantId: 't-001',
      brandId: 'b-001',
      storeId: 's-001',
      issuedAt: '2026-06-20T00:00:00.000Z',
      expiresAt: '2026-06-27T00:00:00.000Z',
      authenticated: true
    },
    ...overrides
  }
}

// ── metadata assertions ──

test('member controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', MemberController)
  assert.equal(path, 'members')
})

test('member controller getBootstrap route has GET metadata', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MemberController: Ctrl } = require('./member.controller')
  const method = Reflect.getMetadata('method', Ctrl.prototype.getBootstrap)
  const path = Reflect.getMetadata('path', Ctrl.prototype.getBootstrap)
  assert.equal(method, 0)
  assert.equal(path, 'bootstrap')
})

test('member controller registerPersistent route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.registerPersistent)
  const path = Reflect.getMetadata('path', MemberController.prototype.registerPersistent)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/register')
})

test('member controller listPersistentMutationHistory route has GET metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.listPersistentMutationHistory)
  const path = Reflect.getMetadata('path', MemberController.prototype.listPersistentMutationHistory)
  assert.equal(method, 0)
  assert.equal(path, 'persistent/:memberId/history')
})

test('member controller updatePersistentProfile route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.updatePersistentProfile)
  const path = Reflect.getMetadata('path', MemberController.prototype.updatePersistentProfile)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/profile')
})

test('member controller awardPersistentPoints route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.awardPersistentPoints)
  const path = Reflect.getMetadata('path', MemberController.prototype.awardPersistentPoints)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/points/award')
})

test('member controller rollbackPersistentPoints route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.rollbackPersistentPoints)
  const path = Reflect.getMetadata('path', MemberController.prototype.rollbackPersistentPoints)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/points/rollback')
})

test('member controller updatePersistentStatus route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.updatePersistentStatus)
  const path = Reflect.getMetadata('path', MemberController.prototype.updatePersistentStatus)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/status')
})

test('member controller overridePersistentLevel route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.overridePersistentLevel)
  const path = Reflect.getMetadata('path', MemberController.prototype.overridePersistentLevel)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/level')
})

test('member controller recordPersistentPaymentActivity route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.recordPersistentPaymentActivity)
  const path = Reflect.getMetadata('path', MemberController.prototype.recordPersistentPaymentActivity)
  assert.equal(method, 1)
  assert.equal(path, 'persistent/:memberId/payment-activity')
})

test('member controller login route has POST metadata', () => {
  const method = Reflect.getMetadata('method', MemberController.prototype.login)
  const path = Reflect.getMetadata('path', MemberController.prototype.login)
  assert.equal(method, 1)
  assert.equal(path, 'login')
})

// ── getBootstrap ──

describe('GET /members/bootstrap', () => {
  test('returns scaffold bootstrap with expected shape', () => {
    const ctrl = freshController()
    const result = ctrl.getBootstrap(createContext())

    assert.equal(result.phase, 'scaffold')
    assert.deepStrictEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box'])
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('passes minimal context through', () => {
    const ctrl = freshController()
    const result = ctrl.getBootstrap({ tenantId: 'min-t' } as RequestTenantContext)

    assert.equal(result.tenantContext.tenantId, 'min-t')
    assert.equal(result.tenantContext.brandId, undefined)
  })
})

// ── POST /members/register ──

describe('POST /members/register', () => {
  test('registers a new member and returns full profile', () => {
    const ctrl = freshController()
    const profile = ctrl.register(createContext(), {
      memberId: 'alice',
      nickname: 'Alice Wang'
    })

    assert.equal(profile.memberId, 'alice')
    assert.equal(profile.nickname, 'Alice Wang')
    assert.equal(profile.level, MemberLevel.Bronze)
    assert.equal(profile.status, MemberStatus.Active)
    assert.equal(profile.points, 0)
    assert.ok(profile.registeredAt)
    assert.equal(profile.tenantContext.tenantId, 't-001')
  })

  test('throws on duplicate registration (反例)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'bob', nickname: 'Bob' })

    assert.throws(
      () => ctrl.register(createContext(), { memberId: 'bob', nickname: 'Bob2' }),
      /already exists/
    )
  })
})

// ── GET /members/:memberId ──

describe('GET /members/:memberId', () => {
  test('retrieves registered member profile (正例)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'charlie', nickname: 'Charlie' })

    const profile = ctrl.getProfile('charlie')
    assert.equal(profile.memberId, 'charlie')
    assert.equal(profile.nickname, 'Charlie')
  })

  test('throws for unknown member (反例)', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.getProfile('ghost'),
      /not found/
    )
  })

  test('handles special characters in memberId (边界)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'user@org.com', nickname: 'Email User' })

    const profile = ctrl.getProfile('user@org.com')
    assert.equal(profile.nickname, 'Email User')
  })
})

// ── GET /members ──

describe('GET /members', () => {
  test('listProfiles returns an array (边界)', () => {
    const ctrl = freshController()
    const list = ctrl.listProfiles()
    assert.ok(Array.isArray(list))
  })

  test('registered members appear in list (正例)', () => {
    const ctrl = freshController()
    const uid = `d-${Date.now()}`
    ctrl.register(createContext(), { memberId: uid + '-1', nickname: 'D1' })
    ctrl.register(createContext(), { memberId: uid + '-2', nickname: 'D2' })

    const list = ctrl.listProfiles()
    const ids = list.map(p => p.memberId)
    assert.ok(ids.includes(uid + '-1'))
    assert.ok(ids.includes(uid + '-2'))
  })
})

describe('persistent member routes', () => {
  test('registerPersistent delegates to service', async () => {
    const mockService = {
      registerPersistent: async ({ mobile, nickname }: { mobile: string; nickname: string }) =>
        createProfileFixture({
          memberId: 'member-p1',
          mobile,
          nickname,
          persisted: true
        })
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.registerPersistent(createContext(), {
      mobile: '13600000000',
      nickname: 'Persistent Controller'
    })

    assert.equal(result.memberId, 'member-p1')
    assert.equal(result.mobile, '13600000000')
    assert.equal(result.persisted, true)
  })

  test('listPersistentMutationHistory delegates to service', async () => {
    const mockService = {
      listPersistentMutationHistory: async (memberId: string, tenantContext: RequestTenantContext) => [
        createHistoryEntryFixture({
          memberId,
          tenantContext
        })
      ]
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.listPersistentMutationHistory('member-h1', createContext())

    assert.equal(result[0]?.memberId, 'member-h1')
    assert.equal(result[0]?.tenantContext.tenantId, 't-001')
  })

  test('updatePersistentProfile delegates to service', async () => {
    const mockService = {
      updatePersistentProfile: async ({
        memberId,
        nickname,
        mobile,
        email,
        address,
        notes,
        tenantContext
      }: {
        memberId: string
        nickname: string
        mobile: string
        email?: string
        address?: string
        notes?: string
        tenantContext: RequestTenantContext
      }) =>
        createProfileFixture({
          memberId,
          tenantContext,
          nickname,
          mobile,
          email,
          address,
          notes
        })
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.updatePersistentProfile('member-p2', createContext(), {
      nickname: '资料已更新',
      mobile: '13800138000',
      email: 'member@example.com',
      address: '深圳南山科技园',
      notes: '高净值会员'
    })

    assert.equal(result.memberId, 'member-p2')
    assert.equal(result.nickname, '资料已更新')
    assert.equal(result.mobile, '13800138000')
    assert.equal(result.email, 'member@example.com')
    assert.equal(result.address, '深圳南山科技园')
    assert.equal(result.notes, '高净值会员')
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('login delegates to service and returns session token', async () => {
    const mockService = {
      login: async ({ mobile }: { mobile: string }) =>
        createLoginResultFixture({
          member: createProfileFixture({
            memberId: 'member-p2',
            mobile
          })
        })
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.login(createContext(), { mobile: '13500000000' })

    assert.equal(result.member.mobile, '13500000000')
    assert.equal(result.session.sessionToken, 'sess-1')
  })

  test('awardPersistentPoints delegates to service', async () => {
    let capturedApprovalTicket: string | undefined
    const mockService = {
      awardPoints: async (
        memberId: string,
        points: number,
        tenantContext: RequestTenantContext,
        approvalTicket?: string
      ) => {
        capturedApprovalTicket = approvalTicket
        return createProfileFixture({
          memberId,
          tenantContext,
          points
        })
      }
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.awardPersistentPoints('member-p3', createContext(), {
      points: 300,
      approvalTicket: 'APR-MEMBER-001'
    })

    assert.ok('points' in result)
    assert.equal(result.memberId, 'member-p3')
    assert.equal(result.points, 300)
    assert.equal(capturedApprovalTicket, 'APR-MEMBER-001')
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('rollbackPersistentPoints delegates to service', async () => {
    let capturedApprovalTicket: string | undefined
    const mockService = {
      rollbackPoints: async (
        memberId: string,
        points: number,
        tenantContext: RequestTenantContext,
        approvalTicket?: string
      ) => {
        capturedApprovalTicket = approvalTicket
        return createProfileFixture({
          memberId,
          tenantContext,
          points
        })
      }
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.rollbackPersistentPoints('member-p4', createContext(), {
      points: 120,
      approvalTicket: 'APR-MEMBER-002'
    })

    assert.ok('points' in result)
    assert.equal(result.memberId, 'member-p4')
    assert.equal(result.points, 120)
    assert.equal(capturedApprovalTicket, 'APR-MEMBER-002')
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('updatePersistentStatus delegates to service', async () => {
    let capturedApprovalTicket: string | undefined
    const mockService = {
      updatePersistentStatus: async (
        memberId: string,
        status: string,
        tenantContext: RequestTenantContext,
        approvalTicket?: string
      ) => {
        capturedApprovalTicket = approvalTicket
        return createProfileFixture({
          memberId,
          tenantContext,
          status: status as MemberStatus
        })
      }
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.updatePersistentStatus('member-p5', createContext(), {
      status: MemberStatus.Blacklisted,
      approvalTicket: 'APR-MEMBER-003'
    })

    assert.ok('status' in result)
    assert.equal(result.memberId, 'member-p5')
    assert.equal(result.status, MemberStatus.Blacklisted)
    assert.equal(capturedApprovalTicket, 'APR-MEMBER-003')
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('overridePersistentLevel delegates to service', async () => {
    let capturedApprovalTicket: string | undefined
    const mockService = {
      overridePersistentLevel: async (
        memberId: string,
        level: string,
        tenantContext: RequestTenantContext,
        approvalTicket?: string
      ) => {
        capturedApprovalTicket = approvalTicket
        return createProfileFixture({
          memberId,
          tenantContext,
          level: level as MemberLevel
        })
      }
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.overridePersistentLevel('member-p6', createContext(), {
      level: MemberLevel.Platinum,
      approvalTicket: 'APR-MEMBER-004'
    })

    assert.ok('level' in result)
    assert.equal(result.memberId, 'member-p6')
    assert.equal(result.level, MemberLevel.Platinum)
    assert.equal(capturedApprovalTicket, 'APR-MEMBER-004')
    assert.equal(result.tenantContext.tenantId, 't-001')
  })

  test('recordPersistentPaymentActivity delegates full payload to service', async () => {
    let capturedInput:
      | {
          memberId: string
          tenantContext: RequestTenantContext
          orderId: string
          amount: number
          paidAt?: string
          channel?: string
          source?: 'cashier' | 'lyt-snapshot'
        }
      | undefined
    const mockService = {
      recordPaymentActivity: async (input: {
        memberId: string
        tenantContext: RequestTenantContext
        orderId: string
        amount: number
        paidAt?: string
        channel?: string
        source?: 'cashier' | 'lyt-snapshot'
      }) => {
        capturedInput = input
        return createProfileFixture({
          memberId: input.memberId,
          tenantContext: input.tenantContext,
          lastPaymentOrderId: input.orderId,
          lastPaymentAmount: input.amount,
          lastPaymentChannel: input.channel
        })
      }
    }
    const ctrl = createControllerWithServiceStub(mockService)
    const result = await ctrl.recordPersistentPaymentActivity('member-p5', createContext(), {
      orderId: 'order-001',
      amount: 88,
      paidAt: '2026-06-18T10:00:00.000Z',
      channel: 'wechat-pay',
      source: 'cashier'
    })

    assert.equal(result.memberId, 'member-p5')
    assert.equal(result.tenantContext.tenantId, 't-001')
    assert.equal(capturedInput?.orderId, 'order-001')
    assert.equal(capturedInput?.amount, 88)
    assert.equal(capturedInput?.channel, 'wechat-pay')
    assert.equal(capturedInput?.source, 'cashier')
  })
})

// ── controller ↔ service ↔ Prisma integration ────────────────────────────
//
// 这里直接用真 MemberService 拼上 createPrismaStub，验证 POST /members/persistent/:id/profile
// 走 controller → service.updatePersistentProfile → saveMemberProfileExtension 把 email/address/notes
// 持久化到 Prisma MemberProfileExtension 表；后续 GET /members/persistent/:id 能再读回。

import { MemberService as RealMemberService } from './member.service'
import { resetMemberServiceTestState } from './member.service'

type StubMemberProfileExtension = {
  id: string
  tenantId: string
  memberProfileId: string
  email: string | null
  address: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

describe('controller ↔ service ↔ Prisma MemberProfileExtension integration', () => {
  beforeEach(() => {
    resetMemberServiceTestState()
  })

  function buildPrismaStubWithExtensionStorage() {
    const extensions = new Map<string, StubMemberProfileExtension>()
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
    const users = new Map<string, {
      id: string
      tenantId: string
      mobile: string
      role: string
      createdAt: Date
      updatedAt: Date
    }>()
    const snapshots = new Map<string, {
      id: string
      tenantId: string
      memberProfileId: string | null
      externalMemberId: string
      points: number
      growthValue: number
      status: string
      updatedAtFromSource: Date
    }>()

    return {
      extensions,
      memberProfiles,
      users,
      snapshots,
      prisma: {
        user: {
          findUnique: async ({ where }: { where: { mobile?: string; id?: string } }) => {
            if (where.id) {
              return Array.from(users.values()).find((user) => user.id === where.id) ?? null
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
            const existing = Array.from(users.values()).find((user) => user.id === where.id)
            if (!existing) throw new Error(`User ${where.id} not found`)
            users.delete(existing.mobile)
            const next = { ...existing, mobile: data.mobile ?? existing.mobile, updatedAt: new Date() }
            users.set(next.mobile, next)
            return next
          }
        },
        memberProfile: {
          findUnique: async ({ where }: { where: { id: string } }) => memberProfiles.get(where.id) ?? null,
          findFirst: async ({ where }: { where: { tenantId?: string; userId?: string | null } }) =>
            Array.from(memberProfiles.values()).find((profile) => {
              if (where.tenantId && profile.tenantId !== where.tenantId) return false
              if (where.userId !== undefined && profile.userId !== where.userId) return false
              return true
            }) ?? null,
          create: async ({ data }: { data: { tenantId: string; userId?: string | null; points?: number; growthValue?: number; svipStatus?: string } }) => {
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
          },
          update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const existing = memberProfiles.get(where.id)
            if (!existing) throw new Error(`Member profile ${where.id} not found`)
            const next = { ...existing, ...data, updatedAt: new Date() } as typeof existing
            memberProfiles.set(where.id, next)
            return next
          }
        },
        memberProfileExtension: {
          findUnique: async ({ where }: { where: { memberProfileId: string } }) =>
            extensions.get(where.memberProfileId) ?? null,
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
            const existing = extensions.get(where.memberProfileId)
            const nextRecord = existing
              ? { ...existing, ...update, updatedAt: now }
              : {
                  id: `extension-${extensions.size + 1}`,
                  tenantId: String(create.tenantId),
                  memberProfileId: String(create.memberProfileId),
                  email: (create.email as string | null | undefined) ?? null,
                  address: (create.address as string | null | undefined) ?? null,
                  notes: (create.notes as string | null | undefined) ?? null,
                  createdAt: now,
                  updatedAt: now
                }
            extensions.set(where.memberProfileId, nextRecord)
            return nextRecord
          }
        },
        lytMemberSnapshot: {
          findUnique: async ({ where }: { where: { tenantId_externalMemberId: { tenantId: string; externalMemberId: string } } }) =>
            snapshots.get(`${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`) ?? null,
          findFirst: async ({ where }: { where: { tenantId?: string; memberProfileId?: string | null } }) =>
            Array.from(snapshots.values()).find((snap) => {
              if (where.tenantId && snap.tenantId !== where.tenantId) return false
              if (where.memberProfileId !== undefined && snap.memberProfileId !== where.memberProfileId) return false
              return true
            }) ?? null,
          upsert: async ({
            where,
            create,
            update
          }: {
            where: { tenantId_externalMemberId: { tenantId: string; externalMemberId: string } }
            create: Record<string, unknown>
            update: Record<string, unknown>
          }) => {
            const key = `${where.tenantId_externalMemberId.tenantId}:${where.tenantId_externalMemberId.externalMemberId}`
            const now = new Date()
            const existing = snapshots.get(key)
            const nextRecord = existing
              ? {
                  ...existing,
                  ...update,
                  updatedAtFromSource:
                    (update.updatedAtFromSource as Date | undefined) ?? existing.updatedAtFromSource
                }
              : {
                  id: `snap-${snapshots.size + 1}`,
                  tenantId: String(create.tenantId),
                  memberProfileId: (create.memberProfileId as string | null | undefined) ?? null,
                  externalMemberId: String(create.externalMemberId),
                  points: Number(create.points ?? 0),
                  growthValue: Number(create.growthValue ?? 0),
                  status: String(create.status ?? 'ACTIVE'),
                  updatedAtFromSource: (create.updatedAtFromSource as Date) ?? now
                }
            snapshots.set(key, nextRecord)
            return nextRecord
          }
        }
      }
    }
  }

  test('POST /members/persistent/:memberId/profile persists email/address/notes to MemberProfileExtension', async () => {
    const harness = buildPrismaStubWithExtensionStorage()
    const service = new RealMemberService(harness.prisma as any)
    const ctrl = new MemberController(service)

    const registered = await service.registerPersistent({
      tenantContext: createContext(),
      mobile: '13600000040',
      nickname: 'Extension User',
      initialPoints: 1200
    })

    // 调用 controller 路由（不带 service mock），确保路径 controller → service → saveMemberProfileExtension
    const updated = await ctrl.updatePersistentProfile(registered.memberId, createContext(), {
      nickname: 'Extension User Updated',
      mobile: '13600000041',
      email: 'ext-user@example.com',
      address: '深圳南山区',
      notes: 'VIP,需要专属跟进'
    } as any)

    // 1) controller 返回值携带扩展字段
    assert.equal(updated.email, 'ext-user@example.com')
    assert.equal(updated.address, '深圳南山区')
    assert.equal(updated.notes, 'VIP,需要专属跟进')

    // 2) Prisma MemberProfileExtension 表真的被 upsert 了
    const persisted = harness.extensions.get(registered.memberId)
    assert.ok(persisted, 'MemberProfileExtension row should exist after update')
    assert.equal(persisted?.email, 'ext-user@example.com')
    assert.equal(persisted?.address, '深圳南山区')
    assert.equal(persisted?.notes, 'VIP,需要专属跟进')
    assert.equal(persisted?.tenantId, 't-001')

    // 3) 二次调用做 upsert（更新语义）：之前的 email 被清空，新的 email 落进去
    await ctrl.updatePersistentProfile(registered.memberId, createContext(), {
      nickname: 'Extension User Updated',
      mobile: '13600000041',
      email: 'ext-user-2@example.com',
      address: '',
      notes: undefined
    } as any)
    const afterUpdate = harness.extensions.get(registered.memberId)
    assert.ok(afterUpdate, 'MemberProfileExtension row should remain after second update')
    assert.equal(afterUpdate?.email, 'ext-user-2@example.com')
    // 空字符串/未提供字段被规整为 null（与 service 的 normalizeSnapshotString 行为一致）
    assert.equal(afterUpdate?.address ?? null, null)

    // 4) 通过 controller GET 再次读取时拿到的就是 Prisma 里持久化的最新值
    const reloaded = await ctrl.getPersistentProfile(registered.memberId, createContext())
    assert.equal(reloaded.email, 'ext-user-2@example.com')
    assert.equal(reloaded.address, undefined)
    assert.equal(reloaded.notes, undefined)
  })
})

// ── POST /members/:memberId/add-points ──

describe('POST /members/:memberId/add-points', () => {
  test('adds points and auto-computes level (正例)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'eve', nickname: 'Eve' })

    const updated = ctrl.addPoints('eve', { points: 600 })
    assert.equal(updated.points, 600)
    assert.equal(updated.level, MemberLevel.Silver)
  })

  test('accumulates points across calls', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'frank', nickname: 'Frank' })

    ctrl.addPoints('frank', { points: 1200 })
    ctrl.addPoints('frank', { points: 900 })
    const final = ctrl.addPoints('frank', { points: 50 })

    assert.equal(final.points, 2150)
    assert.equal(final.level, MemberLevel.Gold) // >= 2000
  })

  test('throws for non-existent member (反例)', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.addPoints('no-one', { points: 100 }),
      /not found/
    )
  })

  test('throws for negative points (反例/边界)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'grace', nickname: 'Grace' })

    assert.throws(
      () => ctrl.addPoints('grace', { points: -50 }),
      /must be positive/
    )
  })

  test('to Diamond level at exact 50000 (边界)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'hank', nickname: 'Hank' })

    const updated = ctrl.addPoints('hank', { points: 50000 })
    assert.equal(updated.level, MemberLevel.Diamond)
  })
})

// ── GET /members/:memberId/upgrade-check ──

describe('GET /members/:memberId/upgrade-check', () => {
  test('Bronze cannot upgrade with low points (边界)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'iris', nickname: 'Iris' })
    ctrl.addPoints('iris', { points: 100 })

    const result = ctrl.checkUpgrade('iris')
    assert.equal(result.canUpgrade, false)
    assert.equal(result.currentLevel, MemberLevel.Bronze)
  })

  test('Bronze member can check upgrade before adding points (正例)', () => {
    // checkUpgrade uses canUpgrade(currentLevel, currentPoints)
    // Bronze + 600 points => computeMemberLevel(600) = Silver > Bronze => true
    const ctrl = freshController()
    const uid = `jack-${Date.now()}`
    ctrl.register(createContext(), { memberId: uid, nickname: 'Jack' })
    ctrl.addPoints(uid, { points: 600 }) // now Silver, 600 pts

    // After upgrade to Silver, check if can go further
    const result = ctrl.checkUpgrade(uid)
    assert.equal(result.currentLevel, MemberLevel.Silver)
    // Silver + 600 pts => compute = Silver, no upgrade yet
    assert.equal(result.canUpgrade, false)
  })

  test('Diamond shows no upgrade path (边界)', () => {
    const ctrl = freshController()
    ctrl.register(createContext(), { memberId: 'kate', nickname: 'Kate' })
    ctrl.addPoints('kate', { points: 60000 })

    const result = ctrl.checkUpgrade('kate')
    assert.equal(result.currentLevel, MemberLevel.Diamond)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.nextLevel, null)
    assert.equal(result.pointsNeeded, 0)
  })

  test('throws for non-existent member (反例)', () => {
    const ctrl = freshController()
    assert.throws(
      () => ctrl.checkUpgrade('no-such-member'),
      /not found/
    )
  })
})
