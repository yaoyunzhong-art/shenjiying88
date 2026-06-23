import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  toMemberProfileContract,
  toMemberBootstrapContract,
  toMemberSessionContract,
  toMemberLoginResultContract,
  toMemberOperationsProfileContract,
  toMemberOperationsActionContract,
  toMemberAutomationTriggerContract,
  toMemberOperationsTaskContract,
  toMemberOperationsExecutionReceiptContract,
  toMemberProfileMutationHistoryContract,
  toMemberMutationApprovalResultContract,
  toLytMemberSnapshotContract
} from './member.contract'
import {
  MemberLevel,
  MemberStatus
} from './member.entity'

// ── Shared helpers ──
const tenantCtx = { tenantId: 't-member-ct', brandId: 'b-member-ct', storeId: 's-member-ct', marketCode: 'cn-mainland' }

function makeFullMemberProfile(overrides: any = {}) {
  return {
    memberId: 'mem-001',
    userId: 'user-001',
    tenantContext: tenantCtx,
    mobile: '13800138000',
    nickname: '测试会员',
    email: 'test@example.com',
    address: '上海市静安区',
    notes: 'VIP 高价值客户',
    level: MemberLevel.Gold,
    status: MemberStatus.Active,
    points: 3500,
    growthValue: 5200,
    svipStatus: 'ACTIVE',
    registeredAt: '2026-01-15T08:00:00Z',
    lastActiveAt: '2026-06-23T10:00:00Z',
    lifecycleStage: 'vip-active' as const,
    tags: ['paid-member', 'vip-active', 'high-value-buyer'],
    lastPaymentAt: '2026-06-23T09:30:00Z',
    lastPaymentAmount: 599,
    lastPaymentOrderId: 'ord-20260623-001',
    lastPaymentChannel: 'wechat-pay',
    source: 'prisma' as const,
    persisted: true,
    ...overrides
  }
}

// ── toMemberProfileContract ──
describe('toMemberProfileContract()', () => {
  test('maps full MemberProfile to MemberProfileContract', () => {
    const profile = makeFullMemberProfile()
    const contract = toMemberProfileContract(profile)

    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.nickname, '测试会员')
    assert.equal(contract.mobile, '13800138000')
    assert.equal(contract.email, 'test@example.com')
    assert.equal(contract.address, '上海市静安区')
    assert.equal(contract.notes, 'VIP 高价值客户')
    assert.equal(contract.level, MemberLevel.Gold)
    assert.equal(contract.status, MemberStatus.Active)
    assert.equal(contract.points, 3500)
    assert.equal(contract.growthValue, 5200)
    assert.equal(contract.svipStatus, 'ACTIVE')
    assert.equal(contract.registeredAt, '2026-01-15T08:00:00Z')
    assert.equal(contract.lastActiveAt, '2026-06-23T10:00:00Z')
    assert.equal(contract.lifecycleStage, 'vip-active')
    assert.equal(contract.lastPaymentAmount, 599)
    assert.equal(contract.lastPaymentChannel, 'wechat-pay')
    assert.equal(contract.source, 'prisma')
    assert.equal(contract.persisted, true)
    assert.deepStrictEqual(contract.tenantContext, tenantCtx)
  })

  test('copies tags array (not reference)', () => {
    const profile = makeFullMemberProfile({ tags: ['tag-a', 'tag-b'] })
    const contract = toMemberProfileContract(profile)
    assert.deepEqual(contract.tags, ['tag-a', 'tag-b'])
    // should be a new array
    contract.tags?.push('tag-c')
    assert.deepEqual(profile.tags, ['tag-a', 'tag-b'])
  })

  test('handles undefined optional fields gracefully', () => {
    const profile = makeFullMemberProfile({
      email: undefined,
      address: undefined,
      notes: undefined,
      tags: undefined,
      lifecycleStage: undefined,
      lastPaymentAt: undefined,
      lastPaymentAmount: undefined,
      lastPaymentOrderId: undefined,
      lastPaymentChannel: undefined,
      svipStatus: undefined
    })
    const contract = toMemberProfileContract(profile)
    assert.equal(contract.email, undefined)
    assert.equal(contract.address, undefined)
    assert.equal(contract.notes, undefined)
    assert.equal(contract.tags, undefined)
    assert.equal(contract.lifecycleStage, undefined)
  })

  test('new member (Bronze, memory source)', () => {
    const profile = makeFullMemberProfile({
      level: MemberLevel.Bronze,
      points: 0,
      growthValue: 0,
      svipStatus: 'INACTIVE',
      source: 'memory',
      persisted: false,
      tags: undefined,
      lastPaymentAt: undefined
    })
    const contract = toMemberProfileContract(profile)
    assert.equal(contract.level, MemberLevel.Bronze)
    assert.equal(contract.points, 0)
    assert.equal(contract.source, 'memory')
    assert.equal(contract.persisted, false)
  })
})

// ── toMemberBootstrapContract ──
describe('toMemberBootstrapContract()', () => {
  test('maps MemberBootstrap to contract', () => {
    const bootstrap = {
      tenantContext: tenantCtx,
      capabilities: ['member-center', 'points', 'svip', 'blind-box'],
      phase: 'scaffold'
    }
    const contract = toMemberBootstrapContract(bootstrap)
    assert.deepStrictEqual(contract.tenantContext, tenantCtx)
    assert.deepEqual(contract.capabilities, ['member-center', 'points', 'svip', 'blind-box'])
    assert.equal(contract.phase, 'scaffold')
  })

  test('copies capabilities array (not reference)', () => {
    const bootstrap = {
      tenantContext: tenantCtx,
      capabilities: ['member-center'],
      phase: 'scaffold'
    }
    const contract = toMemberBootstrapContract(bootstrap)
    contract.capabilities.push('extra')
    assert.deepEqual(bootstrap.capabilities, ['member-center'])
  })
})

// ── toMemberSessionContract ──
describe('toMemberSessionContract()', () => {
  test('maps MemberSession to contract', () => {
    const session = {
      sessionToken: 'tok-abc123',
      memberId: 'mem-001',
      userId: 'user-001',
      tenantId: 't-member-ct',
      brandId: 'b-member-ct',
      storeId: 's-member-ct',
      issuedAt: '2026-06-23T10:00:00Z',
      expiresAt: '2026-06-30T10:00:00Z',
      authenticated: true
    }
    const contract = toMemberSessionContract(session)
    assert.equal(contract.sessionToken, 'tok-abc123')
    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.userId, 'user-001')
    assert.equal(contract.tenantId, 't-member-ct')
    assert.equal(contract.brandId, 'b-member-ct')
    assert.equal(contract.storeId, 's-member-ct')
    assert.equal(contract.issuedAt, '2026-06-23T10:00:00Z')
    assert.equal(contract.expiresAt, '2026-06-30T10:00:00Z')
    assert.equal(contract.authenticated, true)
  })

  test('maps unauthenticated session', () => {
    const session = {
      sessionToken: 'tok-expired',
      memberId: 'mem-002',
      userId: 'user-002',
      tenantId: 't-member-ct',
      issuedAt: '2026-06-23T10:00:00Z',
      expiresAt: '2026-06-23T10:01:00Z',
      authenticated: false
    }
    const contract = toMemberSessionContract(session)
    assert.equal(contract.authenticated, false)
    assert.equal(contract.brandId, undefined)
  })
})

// ── toMemberLoginResultContract ──
describe('toMemberLoginResultContract()', () => {
  test('maps MemberLoginResult to contract', () => {
    const member = makeFullMemberProfile({ memberId: 'mem-login', nickname: '登录会员' })
    const session = {
      sessionToken: 'tok-login-001',
      memberId: 'mem-login',
      userId: 'user-login',
      tenantId: 't-member-ct',
      brandId: 'b-member-ct',
      issuedAt: '2026-06-23T10:00:00Z',
      expiresAt: '2026-06-30T10:00:00Z',
      authenticated: true
    }
    const contract = toMemberLoginResultContract({ member, session })
    assert.equal(contract.member.memberId, 'mem-login')
    assert.equal(contract.member.nickname, '登录会员')
    assert.equal(contract.session.sessionToken, 'tok-login-001')
    assert.equal(contract.session.authenticated, true)
  })
})

// ── toMemberOperationsProfileContract ──
describe('toMemberOperationsProfileContract()', () => {
  test('maps operations profile to contract with recommended actions and triggers', () => {
    const profile = {
      memberId: 'mem-ops-001',
      tenantContext: tenantCtx,
      level: MemberLevel.Gold,
      status: MemberStatus.Active,
      lifecycleStage: 'vip-active' as const,
      audienceSegments: ['lifecycle-vip-active', 'level-gold', 'high-value-buyer'],
      recommendedActions: [
        {
          code: 'assign-vip-concierge',
          label: '分配 VIP 专属跟进',
          reason: '高等级会员',
          channel: 'crm-task',
          priority: 'high'
        } as any
      ],
      automationTriggers: [
        {
          code: 'vip-service-upgrade',
          status: 'ready',
          source: 'tag',
          reason: 'VIP 运营门槛'
        } as any
      ],
      lastPaymentAt: '2026-06-23T09:30:00Z',
      lastPaymentAmount: 599,
      lastPaymentChannel: 'wechat-pay',
      tags: ['paid-member'],
      source: 'prisma' as const
    }
    const contract = toMemberOperationsProfileContract(profile)
    assert.equal(contract.memberId, 'mem-ops-001')
    assert.equal(contract.level, MemberLevel.Gold)
    assert.equal(contract.lifecycleStage, 'vip-active')
    assert.equal(contract.audienceSegments.length, 3)
    assert.equal(contract.recommendedActions.length, 1)
    assert.equal(contract.recommendedActions[0].code, 'assign-vip-concierge')
    assert.equal(contract.automationTriggers.length, 1)
    assert.equal(contract.automationTriggers[0].code, 'vip-service-upgrade')
  })
})

// ── toMemberOperationsActionContract ──
describe('toMemberOperationsActionContract()', () => {
  test('maps action fields', () => {
    const action = {
      code: 'send-post-payment-welcome',
      label: '发送首购欢迎触达',
      reason: '首单支付成功',
      channel: 'wechat',
      priority: 'high'
    } as any
    const contract = toMemberOperationsActionContract(action)
    assert.equal(contract.code, 'send-post-payment-welcome')
    assert.equal(contract.label, '发送首购欢迎触达')
    assert.equal(contract.reason, '首单支付成功')
    assert.equal(contract.channel, 'wechat')
    assert.equal(contract.priority, 'high')
  })
})

// ── toMemberAutomationTriggerContract ──
describe('toMemberAutomationTriggerContract()', () => {
  test('maps trigger fields', () => {
    const trigger = {
      code: 'payment-success-journey',
      status: 'ready',
      source: 'payment-success',
      reason: '最近一次支付成功'
    } as any
    const contract = toMemberAutomationTriggerContract(trigger)
    assert.equal(contract.code, 'payment-success-journey')
    assert.equal(contract.status, 'ready')
    assert.equal(contract.source, 'payment-success')
    assert.equal(contract.reason, '最近一次支付成功')
  })
})

// ── toMemberOperationsTaskContract ──
describe('toMemberOperationsTaskContract()', () => {
  test('maps queued task', () => {
    const task = {
      taskId: 'task-001',
      tenantContext: tenantCtx,
      memberId: 'mem-001',
      actionCode: 'send-post-payment-welcome',
      title: '发送首购欢迎触达',
      reason: '首单完成',
      channel: 'wechat',
      priority: 'high',
      status: 'queued',
      executionLane: 'campaign-execution',
      source: 'payment-success',
      sourceOrderId: 'ord-001',
      dedupeKey: 'dedup-mem-001-send-post-payment-welcome',
      createdAt: '2026-06-23T09:30:00Z',
      scheduledAt: '2026-06-23T09:35:00Z'
    }
    const contract = toMemberOperationsTaskContract(task as any)
    assert.equal(contract.taskId, 'task-001')
    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.actionCode, 'send-post-payment-welcome')
    assert.equal(contract.channel, 'wechat')
    assert.equal(contract.priority, 'high')
    assert.equal(contract.status, 'queued')
    assert.equal(contract.executionLane, 'campaign-execution')
    assert.equal(contract.dedupeKey, 'dedup-mem-001-send-post-payment-welcome')
    assert.equal(contract.sourceOrderId, 'ord-001')
  })

  test('maps completed task with execution details', () => {
    const task = {
      taskId: 'task-002',
      tenantContext: tenantCtx,
      memberId: 'mem-002',
      actionCode: 'issue-bounce-back-coupon',
      title: '发放回访券',
      reason: '复购引导',
      channel: 'coupon',
      priority: 'medium',
      status: 'completed',
      executionLane: 'promo-conversion',
      source: 'payment-success',
      sourceOrderId: 'ord-002',
      sourcePaymentId: 'pay-002',
      executionSummary: '已发放优惠券 CP-ABC',
      executionTargetId: 'CP-ABC',
      executedAt: '2026-06-23T10:00:00Z',
      dedupeKey: 'dedup-mem-002-issue-bounce-back-coupon',
      createdAt: '2026-06-23T09:30:00Z',
      scheduledAt: '2026-06-23T09:35:00Z'
    }
    const contract = toMemberOperationsTaskContract(task as any)
    assert.equal(contract.status, 'completed')
    assert.equal(contract.executionSummary, '已发放优惠券 CP-ABC')
    assert.equal(contract.executionTargetId, 'CP-ABC')
    assert.equal(contract.executedAt, '2026-06-23T10:00:00Z')
  })
})

// ── toMemberOperationsExecutionReceiptContract ──
describe('toMemberOperationsExecutionReceiptContract()', () => {
  test('maps execution receipt', () => {
    const receipt = {
      executionId: 'exec-001',
      tenantContext: tenantCtx,
      memberId: 'mem-001',
      taskId: 'task-001',
      actionCode: 'issue-bounce-back-coupon',
      targetType: 'coupon-offer',
      targetId: 'CP-ABC',
      status: 'completed',
      summary: '已发放运营优惠券 CP-ABC',
      payload: { couponCode: 'CP-ABC', discountAmount: 30, currency: 'CNY' },
      runtimeReceiptCode: 'rt-001',
      runtimeState: 'callback-recorded',
      runtimeReplayable: true,
      executedAt: '2026-06-23T10:00:00Z'
    }
    const contract = toMemberOperationsExecutionReceiptContract(receipt as any)
    assert.equal(contract.executionId, 'exec-001')
    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.taskId, 'task-001')
    assert.equal(contract.actionCode, 'issue-bounce-back-coupon')
    assert.equal(contract.targetType, 'coupon-offer')
    assert.equal(contract.status, 'completed')
    assert.equal(contract.runtimeReceiptCode, 'rt-001')
    assert.equal(contract.runtimeState, 'callback-recorded')
    assert.equal(contract.runtimeReplayable, true)
    assert.deepEqual(contract.payload, { couponCode: 'CP-ABC', discountAmount: 30, currency: 'CNY' })
  })

  test('copies payload (not reference)', () => {
    const receipt = {
      executionId: 'exec-002',
      tenantContext: tenantCtx,
      memberId: 'mem-002',
      taskId: 'task-002',
      actionCode: 'assign-vip-concierge',
      targetType: 'crm-follow-up',
      targetId: 'followup-001',
      status: 'completed',
      summary: '已创建 CRM 跟进工单',
      payload: { queueId: 'vip-concierge', slaHours: 2 },
      executedAt: '2026-06-23T10:00:00Z'
    }
    const contract = toMemberOperationsExecutionReceiptContract(receipt as any)
    ;(contract.payload as any).extra = 'injected'
    assert.equal((receipt.payload as any).extra, undefined)
  })
})

// ── toMemberProfileMutationHistoryContract ──
describe('toMemberProfileMutationHistoryContract()', () => {
  test('maps status-updated history entry', () => {
    const entry = {
      historyId: 'hist-001',
      tenantContext: tenantCtx,
      memberId: 'mem-001',
      action: 'status-updated',
      summary: '会员状态已调整为 FROZEN',
      sourceChannel: 'member-admin',
      operatorId: 'admin-001',
      payload: { status: 'FROZEN' },
      beforeValue: { status: 'ACTIVE' },
      afterValue: { status: 'FROZEN' },
      createdAt: '2026-06-23T10:00:00Z'
    }
    const contract = toMemberProfileMutationHistoryContract(entry as any)
    assert.equal(contract.historyId, 'hist-001')
    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.action, 'status-updated')
    assert.equal(contract.summary, '会员状态已调整为 FROZEN')
    assert.equal(contract.sourceChannel, 'member-admin')
    assert.equal(contract.operatorId, 'admin-001')
    assert.deepEqual(contract.payload, { status: 'FROZEN' })
    assert.deepEqual(contract.beforeValue, { status: 'ACTIVE' })
    assert.deepEqual(contract.afterValue, { status: 'FROZEN' })
  })

  test('maps points-awarded entry', () => {
    const entry = {
      historyId: 'hist-002',
      tenantContext: tenantCtx,
      memberId: 'mem-002',
      action: 'points-awarded',
      summary: '会员积分已增加 200',
      sourceChannel: 'member-admin',
      operatorId: 'admin-002',
      payload: { points: 200 },
      createdAt: '2026-06-23T10:00:00Z'
    }
    const contract = toMemberProfileMutationHistoryContract(entry as any)
    assert.equal(contract.action, 'points-awarded')
    assert.equal(contract.summary, '会员积分已增加 200')
    assert.equal(contract.beforeValue, undefined)
    assert.equal(contract.afterValue, undefined)
  })

  test('copies payload/values (not reference)', () => {
    const entry = {
      historyId: 'hist-003',
      tenantContext: tenantCtx,
      memberId: 'mem-003',
      action: 'approval.approved',
      summary: '审批通过',
      sourceChannel: 'member-admin',
      operatorId: 'admin-003',
      payload: { operation: 'level-update' },
      beforeValue: { level: 'GOLD' },
      afterValue: { level: 'PLATINUM' },
      createdAt: '2026-06-23T10:00:00Z'
    }
    const contract = toMemberProfileMutationHistoryContract(entry as any)
    ;(contract.payload as any).extra = 'injected'
    assert.equal((entry.payload as any).extra, undefined)
    ;(contract.beforeValue as any).extra = 'injected'
    assert.equal((entry.beforeValue as any).extra, undefined)
  })
})

// ── toMemberMutationApprovalResultContract ──
describe('toMemberMutationApprovalResultContract()', () => {
  test('maps pending approval', () => {
    const result = {
      memberId: 'mem-001',
      applied: false,
      approvalRequired: true,
      approvalTicket: 'ticket-pending-001',
      approvalStatus: 'PENDING' as const,
      operation: 'member.points.award',
      summary: '加积分需要审批'
    }
    const contract = toMemberMutationApprovalResultContract(result as any)
    assert.equal(contract.memberId, 'mem-001')
    assert.equal(contract.applied, false)
    assert.equal(contract.approvalRequired, true)
    assert.equal(contract.approvalTicket, 'ticket-pending-001')
    assert.equal(contract.approvalStatus, 'PENDING')
    assert.equal(contract.operation, 'member.points.award')
    assert.equal(contract.summary, '加积分需要审批')
  })

  test('maps rejected approval', () => {
    const result = {
      memberId: 'mem-002',
      applied: false,
      approvalRequired: true,
      approvalTicket: null,
      approvalStatus: 'REJECTED' as const,
      operation: 'member.status.update',
      summary: '状态变更被驳回'
    }
    const contract = toMemberMutationApprovalResultContract(result as any)
    assert.equal(contract.approvalTicket, null)
    assert.equal(contract.approvalStatus, 'REJECTED')
  })

  test('maps not-required (no approval needed)', () => {
    const result = {
      memberId: 'mem-003',
      applied: false,
      approvalRequired: true,
      approvalTicket: null,
      approvalStatus: 'NOT_REQUIRED' as const,
      operation: 'member.profile.update',
      summary: '基础资料修改无需审批'
    }
    const contract = toMemberMutationApprovalResultContract(result as any)
    assert.equal(contract.approvalStatus, 'NOT_REQUIRED')
    assert.equal(contract.approvalTicket, null)
    assert.equal(contract.summary, '基础资料修改无需审批')
  })
})

// ── toLytMemberSnapshotContract ──
describe('toLytMemberSnapshotContract()', () => {
  test('maps full LYT member snapshot', () => {
    const snapshot = {
      snapshotId: 'snap-001',
      tenantContext: tenantCtx,
      memberProfileId: 'mem-profile-001',
      externalMemberId: 'ext-mem-001',
      memberCode: 'M2026-0001',
      mobile: '13800138000',
      nickname: 'LYT 会员',
      levelCode: 'GOLD',
      points: 3500,
      growthValue: 5200,
      status: 'ACTIVE',
      updatedAtFromSource: '2026-06-23T09:30:00Z',
      rawVersion: 'v2.1',
      rawPayload: { externalId: 'ext-001', channel: 'wechat' },
      source: 'prisma' as const
    }
    const contract = toLytMemberSnapshotContract(snapshot)
    assert.equal(contract.snapshotId, 'snap-001')
    assert.equal(contract.memberProfileId, 'mem-profile-001')
    assert.equal(contract.externalMemberId, 'ext-mem-001')
    assert.equal(contract.memberCode, 'M2026-0001')
    assert.equal(contract.nickname, 'LYT 会员')
    assert.equal(contract.levelCode, 'GOLD')
    assert.equal(contract.points, 3500)
    assert.equal(contract.growthValue, 5200)
    assert.equal(contract.status, 'ACTIVE')
    assert.equal(contract.updatedAtFromSource, '2026-06-23T09:30:00Z')
    assert.equal(contract.rawVersion, 'v2.1')
    assert.equal(contract.source, 'prisma')
    assert.deepEqual(contract.tenantContext, tenantCtx)
  })

  test('maps memory-sourced snapshot', () => {
    const snapshot = {
      snapshotId: 'snap-002',
      tenantContext: { tenantId: 't-min' },
      externalMemberId: 'ext-mem-002',
      points: 0,
      growthValue: 0,
      status: 'ACTIVE',
      updatedAtFromSource: '2026-06-23T10:00:00Z',
      source: 'memory' as const
    }
    const contract = toLytMemberSnapshotContract(snapshot)
    assert.equal(contract.snapshotId, 'snap-002')
    assert.equal(contract.externalMemberId, 'ext-mem-002')
    assert.equal(contract.memberProfileId, undefined)
    assert.equal(contract.memberCode, undefined)
    assert.equal(contract.points, 0)
    assert.equal(contract.source, 'memory')
  })

  test('copies rawPayload (not reference)', () => {
    const snapshot = {
      snapshotId: 'snap-003',
      tenantContext: tenantCtx,
      externalMemberId: 'ext-mem-003',
      points: 100,
      growthValue: 100,
      status: 'ACTIVE',
      updatedAtFromSource: '2026-06-23T10:00:00Z',
      rawPayload: { key: 'value' },
      source: 'memory' as const
    }
    const contract = toLytMemberSnapshotContract(snapshot)
    ;(contract.rawPayload as any).extra = 'injected'
    assert.equal((snapshot.rawPayload as any).extra, undefined)
  })
})
