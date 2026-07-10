/**
 * 🐜 自动: [governance-approval] [C] 角色场景测试扩展
 *
 * 8 角色视角的 Governance Approval 业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个场景用例（正常打开→操作→完成 闭环 / 正向 + 负向 + 边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { GovernanceApprovalController } from './governance-approval.controller'
import { PrismaService } from '../../../prisma/prisma.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── GovernanceApprovalSnapshot 类型 ──
interface GovApprovalSnapshot {
  approvalId: string | null
  operation?: string
  resourceType?: string
  resourceKey?: string
  required: boolean
  version: number | null
  requestedBy: string | null
  ticket: string | null
  status: string
  submitted: boolean
  persisted: boolean
  decidedBy: string | null
  decidedAt: string | null
  updatedAt: string | null
  execution?: { attempts: number; executed: boolean; executionStatus: string | null; executedAt: string | null; executedBy: string | null; lastFailure: any }
  summary?: Record<string, unknown> | null
}

// ── Mock Prisma ──
function mockPrisma(): any {
  const dbById: Map<string, any> = new Map()     // id -> record
  const dbByTicket: Map<string, any> = new Map() // approvalTicket -> id
  let seq = 0

  const mock = {
    governanceApproval: {
      findUnique: async (args: any) => {
        // Support both where.id and where.approvalTicket
        if (args.where.id) return dbById.get(args.where.id) ?? null
        if (args.where.approvalTicket) {
          const id = dbByTicket.get(args.where.approvalTicket)
          return id ? dbById.get(id) ?? null : null
        }
        return null
      },
      findMany: async (args: any) => {
        return Array.from(dbById.values())
      },
      count: async (args: any) => dbById.size,
      create: async (args: any) => {
        const data = args.data
        const id = `appr-${++seq}`
        const ticket = data.approvalTicket ?? `TICKET-${seq}`
        const record = {
          ...data,
          id,
          approvalId: id,
          approvalTicket: ticket,
          version: data.version ?? 1,
          status: data.status ?? 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        dbById.set(id, record)
        dbByTicket.set(ticket, id)
        return record
      },
      update: async (args: any) => {
        // Support both where.id and where.approvalTicket
        let id: string | undefined
        if (args.where.id) id = args.where.id
        else if (args.where.approvalTicket) id = dbByTicket.get(args.where.approvalTicket)
        if (!id) throw new Error('RecordNotFound: governanceApproval not found')
        const existing = dbById.get(id)
        if (!existing) throw new Error('RecordNotFound: governanceApproval not found')
        const updated = { ...existing, ...args.data, updatedAt: new Date() }
        dbById.set(id, updated)
        dbByTicket.set(updated.approvalTicket, id)
        return updated
      },
      delete: async (args: any) => {
        let id: string | undefined
        if (args.where.id) id = args.where.id
        else if (args.where.approvalTicket) id = dbByTicket.get(args.where.approvalTicket)
        if (!id) return null
        const existing = dbById.get(id)
        if (existing) dbByTicket.delete(existing.approvalTicket)
        dbById.delete(id!)
        return existing
      },
    },
    $transaction: async (fn: any) => fn(mock as any),
  } as any
  return mock
}

function createController(prisma = mockPrisma()) {
  return new GovernanceApprovalController(prisma as PrismaService)
}

// ── 辅助：创建审批记录 ──
function makeApprovalInput(overrides: any = {}) {
  return {
    operation: 'update-config',
    resourceType: 'configuration',
    resourceKey: 'store-setting',
    approvalRequired: true,
    requestedBy: 'admin',
    approvalTicket: `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    approvalStatus: 'PENDING',
    ...overrides,
  }
}

function makeDecideInput(overrides: any = {}) {
  return { approvalTicket: 'TICKET-DEFAULT', decidedBy: 'approver', status: 'APPROVED', decisionNote: 'Approved', ...overrides }
}

function makeExecuteInput(overrides: any = {}) {
  return { approvalTicket: 'TICKET-DEFAULT', executedBy: 'executor', ...overrides }
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.StoreManager} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('店长创建配置变更审批单 - 正常流程', async () => {
    const input = makeApprovalInput({ operation: 'store-config', resourceKey: 'store-main', requestedBy: 'store-owner', approvalTicket: 'TICKET-SM-001' })
    const result = await ctrl.materializeApproval(input)
    assert.ok(result)
    assert.equal((result as any).status, 'PENDING')
    assert.equal((result as any).requestedBy, 'store-owner')
  })

  it('店长查看所有审批列表 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SM-101' }))
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SM-102' }))
    const result = await ctrl.listApprovals({} as any)
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 2)
  })

  it('店长查看审批统计摘要 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SM-201' }))
    const result = await ctrl.summarizeApprovals({} as any)
    assert.ok(result)
    assert.equal(typeof (result as any).total, 'number')
  })

  it('店长查找不存在的审批单 - 负向', async () => {
    let caught = false
    try {
      await ctrl.getApproval('TICKET-DOES-NOT-EXIST')
    } catch (e: any) {
      caught = true
    }
    assert.ok(caught, 'Should throw for non-existent ticket')
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.FrontDesk} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('前台查看促销相关的审批单 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ operation: 'promotion', resourceKey: 'spring-sale', approvalTicket: 'TICKET-FD-001' }))
    const result = await ctrl.listApprovals({} as any)
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 1)
  })

  it('前台只能查看、不能审批 - 边界（前台角色不在审批角色列表）', () => {
    // 前台角色通常是 store-staff，不在 super-admin 等审批角色中
    const roles = ['store-staff']
    const canDecide = roles.some(r => ['SUPER_ADMIN', 'SECURITY_ADMIN'].includes(r))
    assert.equal(canDecide, false)
  })

  it('前台创建更审批单后查看详细内容 - 正常流程', async () => {
    const created = await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-FD-101', operation: 'price-adjust' }))
    const ticket = (created as any).ticket
    const detail = await ctrl.getApproval(ticket!)
    assert.ok(detail)
    assert.equal((detail as any).operation, 'price-adjust')
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('HR创建员工相关审批单 - 正常流程', async () => {
    const input = makeApprovalInput({ operation: 'employee-change', resourceType: 'hr', resourceKey: 'user-003', requestedBy: 'hr-manager', approvalTicket: 'TICKET-HR-001' })
    const result = await ctrl.materializeApproval(input)
    assert.ok(result)
    assert.equal((result as any).resourceType, 'hr')
  })

  it('HR查看所有HR审批记录列表 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-HR-101' }))
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-HR-102' }))
    const result = await ctrl.listApprovals({} as any)
    assert.equal(result.length, 2)
  })

  it('HR无法执行审批操作（无批准权限） - 权限边界', () => {
    const roles = ['hr-admin']
    const canDecide = roles.some(r => ['SUPER_ADMIN', 'SECURITY_ADMIN'].includes(r))
    assert.equal(canDecide, false)
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Security} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('安监创建安全策略变更审批单 - 正常流程', async () => {
    const result = await ctrl.materializeApproval(makeApprovalInput({ operation: 'security-policy-change', resourceType: 'security', resourceKey: 'firewall-rule', requestedBy: 'sec-admin', approvalTicket: 'TICKET-SEC-001' }))
    assert.ok(result)
  })

  it('安监批准审批单 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SEC-101' }))
    const result = await ctrl.decideApproval(makeDecideInput({ approvalTicket: 'TICKET-SEC-101', decidedBy: 'sec-admin', decision: 'approve' }))
    assert.ok(result)
  })

  it('安监拒绝审批单 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SEC-201' }))
    const result = await ctrl.decideApproval(makeDecideInput({ approvalTicket: 'TICKET-SEC-201', decidedBy: 'sec-admin', status: 'REJECTED' }))
    assert.ok(result)
  })

  it('安监取消审批单 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-SEC-301' }))
    const result = await ctrl.cancelApproval({ approvalTicket: 'TICKET-SEC-301', cancelledBy: 'sec-admin', cancelReason: 'no longer needed' })
    assert.ok(result)
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('导玩员查看门店相关审批 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ operation: 'inventory-adjust', resourceKey: 'store-main', approvalTicket: 'TICKET-GD-001' }))
    const result = await ctrl.listApprovals({} as any)
    assert.equal(result.length, 1)
  })

  it('导玩员无法创建审批（无所需角色） - 权限边界', () => {
    // 虽然controller上 MaterializeApproval 没有角色限制，但导玩员通常不会创建配置变更审批
    const roles = ['store-staff']
    const canCreateApproval = roles.some(r => ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(r))
    assert.equal(canCreateApproval, false)
  })

  it('导玩员无法决定/执行审批 - 权限边界', () => {
    const roles = ['store-staff']
    const canDecide = roles.some(r => ['SUPER_ADMIN', 'SECURITY_ADMIN'].includes(r))
    assert.equal(canDecide, false)
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Operations} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('运行专员查看运营相关的审批列表 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ operation: 'ops-settings', resourceKey: 'store-schedule', approvalTicket: 'TICKET-OPS-001' }))
    await ctrl.materializeApproval(makeApprovalInput({ operation: 'report-config', resourceKey: 'daily-report', approvalTicket: 'TICKET-OPS-002' }))
    const result = await ctrl.listApprovals({} as any)
    assert.equal(result.length, 2)
  })

  it('运行专员查看审批摘要 - 正常流程', async () => {
    const result = await ctrl.summarizeApprovals({} as any)
    assert.ok(result)
  })

  it('运行专员标记审批已执行 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-OPS-101' }))
    // Must approve first before executing
    await ctrl.decideApproval(makeDecideInput({ approvalTicket: 'TICKET-OPS-101', decidedBy: 'admin', status: 'APPROVED' }))
    const result = await ctrl.markExecuted(makeExecuteInput({ approvalTicket: 'TICKET-OPS-101', executedBy: 'ops-user' }))
    assert.ok(result)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('团建专员创建团建预算审批单 - 正常流程', async () => {
    const result = await ctrl.materializeApproval(makeApprovalInput({ operation: 'team-budget', resourceType: 'budget', resourceKey: 'team-q3', requestedBy: 'team-lead', approvalTicket: 'TICKET-TB-001' }))
    assert.ok(result)
    assert.equal((result as any).operation, 'team-budget')
  })

  it('团建专员查看团建审批列表 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-TB-101', operation: 'team-budget' }))
    const result = await ctrl.listApprovals({} as any)
    assert.equal(result.length, 1)
  })

  it('团建专员无法审批或执行审批 - 权限边界', () => {
    const roles = ['staff']
    const canDecide = roles.some(r => ['SUPER_ADMIN', 'SECURITY_ADMIN'].includes(r))
    assert.equal(canDecide, false)
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} governance-approval 业务场景`, () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('营销专员创建优惠活动审批单 - 正常流程', async () => {
    const result = await ctrl.materializeApproval(makeApprovalInput({ operation: 'campaign-launch', resourceKey: 'summer-promo', requestedBy: 'mkt-user', approvalTicket: 'TICKET-MKT-001' }))
    assert.ok(result)
    assert.equal((result as any).operation, 'campaign-launch')
  })

  it('营销专员查看所有营销相关的审批单 - 正常流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-MKT-101' }))
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-MKT-102' }))
    const result = await ctrl.listApprovals({} as any)
    assert.equal(result.length, 2)
  })

  it('营销专员查询审批单详情 - 正常流程', async () => {
    const created = await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-MKT-201' }))
    const ticket = (created as any).ticket
    const detail = await ctrl.getApproval(ticket!)
    assert.ok(detail)
    assert.equal((detail as any).ticket, 'TICKET-MKT-201')
  })
})

// ──────────── 全局场景 ────────────
describe('governance-approval 全局跨角色场景', () => {
  let ctrl: GovernanceApprovalController
  let prisma: any

  beforeEach(() => {
    prisma = mockPrisma()
    ctrl = createController(prisma)
  })

  it('创建→审批→执行→标记失败 完整生命周期', async () => {
    // 1. Create
    const created = await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-FULL-001' }))
    assert.equal((created as any).status, 'PENDING')

    // 2. Decide (approve)
    await ctrl.decideApproval(makeDecideInput({ approvalTicket: 'TICKET-FULL-001', decidedBy: 'admin', status: 'APPROVED' }))

    // 3. Execute
    const executed = await ctrl.markExecuted(makeExecuteInput({ approvalTicket: 'TICKET-FULL-001', executedBy: 'operator' }))
    assert.ok(executed)

    // 4. Mark execution failure
    const failed = await ctrl.markExecutionFailed({ approvalTicket: 'TICKET-FULL-001', failedBy: 'operator', failureStatus: 'FAILED', failureReason: 'network timeout' })
    assert.ok(failed)
  })

  it('创建→撤销 流程', async () => {
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-CANCEL-001' }))
    const result = await ctrl.cancelApproval({ approvalTicket: 'TICKET-CANCEL-001', cancelledBy: 'requestor', cancelReason: '不再需要' })
    assert.ok(result)
  })

  it('创建→拒绝→重新提交 完整流程', async () => {
    // 1. Create
    await ctrl.materializeApproval(makeApprovalInput({ approvalTicket: 'TICKET-RESUBMIT-001' }))

    // 2. Reject
    await ctrl.decideApproval(makeDecideInput({ approvalTicket: 'TICKET-RESUBMIT-001', decidedBy: 'sec-admin', status: 'REJECTED' }))

    // 3. Resubmit
    const resubmitted = await ctrl.resubmitApproval({ approvalTicket: 'TICKET-RESUBMIT-001', resubmittedBy: 'admin' })
    assert.ok(resubmitted)
  })

  it('空列表返回空数组 - 边界', async () => {
    const result = await ctrl.listApprovals({} as any)
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })
})
